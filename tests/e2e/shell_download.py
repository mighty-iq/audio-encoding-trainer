"""ES.core.download (shell round 2): the one way Earshot saves a file. In the claude.ai artifact viewer a fake
window.claude.use('downloads') stands in for the host (a stub namespace that saves, or rejects with each error code);
elsewhere the Blob + a[download] path runs, with Copy offered. Checks that only window.claude.use is read, that the
capability is asked for once, what the player sees for each outcome, and that the backup and Lab export sheets
follow the result."""
from harness import Checks, new_tab, file_url, wait_ready, close_sheets, preset, shot

PROFILE = {'v': 1, 'welcomeSeen': 1, 'tutorials': {'demo': 1}}
# The host stand-in: a Proxy that records which members of window.claude are read; use() resolves later (300 ms).
FAKE = """
window.__dl = { calls: [], mode: 'ok', reads: [], used: [] };
(function () {
  var stub = { save: function (o) {
    var d = o.data, kind = (typeof Blob !== 'undefined' && d instanceof Blob) ? 'blob:' + d.type : typeof d === 'string' ? 'string' : Object.prototype.toString.call(d);
    window.__dl.calls.push({ filename: o.filename, kind: kind, head: typeof d === 'string' ? d.slice(0, 60) : '' });
    var m = window.__dl.mode;
    if (m === 'ok') return Promise.resolve();
    var e = new Error('test: ' + m); if (m !== 'nocode') e.code = m; return Promise.reject(e);
  } };
  window.claude = new Proxy({ use: function (name) { window.__dl.used.push(name);
    return new Promise(function (r) { setTimeout(function () { r(name === 'downloads' ? stub : null); }, 300); }); } },
    { get: function (t, k) { window.__dl.reads.push(String(k)); return t[k]; } });
})();
"""
TOASTS = "() => [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent)"


def page(h, fake):
    tab = new_tab(h.browser, viewport=(390, 844), init=preset({'profile': PROFILE}) + (FAKE if fake else ''))
    pg = tab.page
    pg.goto(file_url(), timeout=90000)
    wait_ready(pg, 60000)
    close_sheets(pg)
    return tab, pg


def errors(c, tab, tag):
    mine, other = tab.split()
    mine = [m for m in mine if 'test: ' not in m[1]]
    c.ok(not mine, f'{tag}: no page errors from shell files', mine[:5])
    for w, t in other:
        c.warn(f'{tag}: error from {w}: {t}')


def export_backup(pg):
    pg.evaluate("() => { document.querySelectorAll('#toasts .toast').forEach(t => t.remove()); ES.core.router.go('settings', {}, { reset: true }); }")
    pg.click('[data-export]')


def with_host(h, c):
    tab, pg = page(h, True)
    downloads = []
    pg.on('download', lambda d: downloads.append(d.suggested_filename))
    pg.wait_for_function("() => ES.core.download.state() === 'ready'", timeout=15000)
    c.ok(True, 'host: the downloads namespace is kept once it resolves')
    # 1. saved by the host
    export_backup(pg)
    pg.wait_for_selector('.sheet-export [data-save-result]', timeout=8000)
    calls = pg.evaluate('window.__dl.calls')
    c.ok(len(calls) == 1 and calls[0]['filename'].startswith('earshot-backup-') and calls[0]['filename'].endswith('.json')
         and calls[0]['kind'] == 'string' and 'earshot-backup' in calls[0]['head'], 'host: the backup goes to downloads.save({filename, data})', calls)
    c.eq(pg.get_attribute('.sheet-export [data-save-result]', 'data-save-result'), 'downloads', 'host: the sheet says the file was saved')
    c.ok('Saved earshot-backup-' in pg.inner_text('.sheet-export'), 'host: "Saved <name>"')
    c.ok(pg.locator('.sheet-export [data-copy-backup]').count() == 1 and pg.locator('.sheet-export [data-invite="export"]').count() == 1,
         'host: Copy and the export invitation stay')
    shot(pg, 'download_host_saved_390')
    close_sheets(pg)
    # 2. declined: nothing is said
    pg.evaluate("() => { window.__dl.mode = 'declined'; }")
    export_backup(pg)
    pg.wait_for_function('() => window.__dl.calls.length === 2', timeout=8000)
    pg.wait_for_timeout(600)
    c.ok(pg.locator('.sheet').count() == 0 and not pg.evaluate(TOASTS), 'host declined: no sheet and no toast', pg.evaluate(TOASTS))
    # 3. rate limited: "Try again in a moment"
    pg.evaluate("() => { window.__dl.mode = 'rate_limited'; }")
    export_backup(pg)
    pg.wait_for_function("() => [...document.querySelectorAll('#toasts .toast')].some(t => /Try again in a moment/.test(t.textContent))", timeout=8000)
    c.ok(pg.locator('.sheet').count() == 0, 'host rate_limited: "Try again in a moment", no sheet')
    # 4. host unavailable, unavailable and an unknown code: this view cannot save files, Copy offered
    for code in ('host_unavailable', 'unavailable', 'nocode'):
        pg.evaluate("(m) => { window.__dl.mode = m; }", code)
        export_backup(pg)
        pg.wait_for_selector('.sheet-export [data-save-result]', timeout=8000)
        txt = pg.inner_text('.sheet-export')
        c.ok(pg.get_attribute('.sheet-export [data-save-result]', 'data-save-result') == 'unavailable' and 'cannot save files' in txt
             and 'open Earshot in a browser' in txt and pg.locator('.sheet-export [data-copy-backup]').count() == 1,
             f'host {code}: the sheet says this view cannot save files and keeps Copy', txt[:300])
        if code == 'host_unavailable':
            shot(pg, 'download_host_unavailable_390')
            pg.click('.sheet-export [data-copy-backup]')
            pg.wait_for_function("() => document.querySelector('.copybox') || [...document.querySelectorAll('#toasts .toast')].some(t => /copied/i.test(t.textContent))", timeout=5000)
            c.ok(True, 'host unavailable: Copy the text copies or opens the copy box')
        close_sheets(pg)
    # 5. the helper's own sheet (no caller sheet) and a PNG Blob
    pg.evaluate("() => { window.__dl.mode = 'unavailable'; ES.core.download.save('notes.txt', 'hello', 'text/plain'); }")
    pg.wait_for_selector('.sheet-download [data-download-result="unavailable"]', timeout=8000)
    c.ok(pg.locator('.sheet-download [data-download-copy]').count() == 1, 'host unavailable (no caller sheet): the helper offers Copy the text')
    close_sheets(pg)
    pg.evaluate("""() => { window.__dl.mode = 'ok'; const b = new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' });
      window.__res = null; ES.core.download.save('earshot-weekly-test.png', b, 'image/png', { copyText: 'card text' }).then(r => { window.__res = r; }); }""")
    pg.wait_for_function('() => window.__res', timeout=8000)
    last = pg.evaluate('window.__dl.calls[window.__dl.calls.length - 1]')
    c.ok(last['filename'] == 'earshot-weekly-test.png' and last['kind'] == 'blob:image/png', 'host: a PNG Blob is passed as is', last)
    c.eq(pg.evaluate('window.__res.how'), 'downloads', 'host: save() resolves {ok:true, how:"downloads"}')
    # 6. the Lab's export sheet follows the result
    pg.evaluate("() => { ES.lab.exportUi.deliver({ kind: 'csv-runs', name: 'earshot-runs-test.csv', text: 'a,b\\r\\n1,2', mime: 'text/csv' }); }")
    pg.wait_for_selector('[data-lab-export-done] [data-save-result]', timeout=8000)
    c.eq(pg.get_attribute('[data-lab-export-done] [data-save-result]', 'data-save-result'), 'downloads', 'host: the Lab export sheet says the file was saved')
    close_sheets(pg)
    reads, used = pg.evaluate('window.__dl.reads'), pg.evaluate('window.__dl.used')
    c.ok(set(reads) <= {'use'}, 'only window.claude.use is read', sorted(set(reads)))
    c.eq(used, ['downloads'], "claude.use('downloads') is called once")
    c.eq(downloads, [], 'host: no browser download is started')
    errors(c, tab, 'host')
    pg.context.close()


def without_host(h, c):
    tab, pg = page(h, False)
    pg.wait_for_function("() => ['none', 'polling'].includes(ES.core.download.state())", timeout=8000)
    with pg.expect_download(timeout=10000) as dl:
        export_backup(pg)
    c.ok(dl.value.suggested_filename.startswith('earshot-backup-'), 'browser: the backup downloads', dl.value.suggested_filename)
    pg.wait_for_selector('.sheet-export [data-save-result]', timeout=8000)
    txt = pg.inner_text('.sheet-export')
    c.ok(pg.get_attribute('.sheet-export [data-save-result]', 'data-save-result') == 'anchor' and 'if nothing appeared, use Copy instead' in txt,
         'browser: the sheet says the download started and offers Copy', txt[:200])
    close_sheets(pg)
    with pg.expect_download(timeout=10000) as dl2:
        pg.evaluate("() => { ES.core.download.save('notes.txt', 'abc', 'text/plain'); }")
    c.eq(dl2.value.suggested_filename, 'notes.txt', 'browser: save() from any caller downloads')
    pg.wait_for_selector('#toasts .toast [data-download-copy]', timeout=5000)
    c.ok('Saved notes.txt' in pg.inner_text('#toasts .toast'), 'browser: a toast says "Saved notes.txt" with a Copy button')
    shot(pg, 'download_toast_copy_390')
    pg.click('#toasts .toast [data-download-copy]')
    pg.wait_for_function("() => document.querySelector('.copybox') || [...document.querySelectorAll('#toasts .toast')].some(t => /copied/i.test(t.textContent))", timeout=5000)
    c.ok(True, 'browser: the toast\'s Copy copies or opens the copy box')
    close_sheets(pg)
    pg.evaluate("() => { URL.createObjectURL = () => { throw new Error('test: blocked'); }; ES.core.download.save('notes.txt', 'abc', 'text/plain'); }")
    pg.wait_for_selector('.sheet-download [data-download-result="blocked"]', timeout=5000)
    c.ok('blocked' in pg.inner_text('.sheet-download').lower() and pg.locator('.sheet-download [data-download-copy]').count() == 1,
         'browser, downloads blocked: said plainly, with Copy')
    errors(c, tab, 'browser')
    pg.context.close()


def run(h):
    c = Checks('download')
    for fn in (with_host, without_host):
        try:
            fn(h, c)
        except Exception as e:
            c.ok(False, f'{fn.__name__} crashed', repr(e)[:400])
    return c
