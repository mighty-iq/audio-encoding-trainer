"""The single-file build (dist/earshot.html): it opens from file:// and over http, and runs inside a sandboxed srcdoc
iframe (allow-scripts only: opaque origin, storage blocked, downloads and clipboard blocked) — the welcome, a
trial, and an export that falls back to the copy box."""
import subprocess

from harness import ROOT, Checks, new_tab, file_url, wait_ready, close_sheets, shot


def frame_ready(fr, timeout=15000):
    fr.wait_for_function("() => window.ES && ES.app && ES.app.booted && document.documentElement.classList.contains('ready')", timeout=timeout)


def run(h):
    c = Checks('srcdoc')
    r = subprocess.run(['node', 'tools/build-single.mjs', '--test', '--srcdoc'], cwd=str(ROOT), capture_output=True, text=True)
    c.ok(r.returncode == 0, 'build-single succeeds', r.stderr[-500:])
    size = (ROOT / 'dist' / 'earshot.html').stat().st_size
    c.ok(size < 16 * 1024 * 1024, 'single file is under 16 MiB', size)
    html = (ROOT / 'dist' / 'earshot.html').read_text(encoding='utf8')
    c.ok('<script src=' not in html and 'rel="stylesheet"' not in html and 'url(../fonts' not in html, 'single file has no external scripts, styles or fonts')

    for label, url in (('file', file_url('dist/earshot.html')), ('http', h.base + '/dist/earshot.html')):
        tab = new_tab(h.browser, viewport=(390, 844))
        pg = tab.page
        pg.goto(url)
        wait_ready(pg)
        c.ok(pg.locator('.sheet-chimera-full').count() == 1, f'single file ({label}): opens with the welcome')
        c.ok(pg.evaluate('ES.TEST_BUILD') is True, f'single file ({label}): --test makes a playtest build')
        mine, other = tab.split()
        c.ok(not mine, f'single file ({label}): no page errors from shell code', mine[:5])
        for who, text in other:
            c.warn(f'single file ({label}): error from {who}: {text}')
        pg.context.close()

    tab = new_tab(h.browser, viewport=(390, 844))
    pg = tab.page
    pg.goto(file_url('dist/earshot.srcdoc.html'))
    fr = pg.frame_locator('iframe')
    frame = pg.frames[1] if len(pg.frames) > 1 else None
    pg.wait_for_timeout(300)
    frame = pg.frames[1]
    frame_ready(frame)
    c.eq(frame.evaluate('ES.core.store.status().mode'), 'memory', 'srcdoc: storage blocked → memory mode')
    c.ok(fr.locator('.sheet-chimera-full').count() == 1, 'srcdoc: the welcome shows')
    fr.locator('.sheet .sheet-actions .btn-primary').last.click()
    c.ok('not saved' in fr.locator('#banners').inner_text().lower(), 'srcdoc: a lasting not-saved banner')
    fr.locator('[data-start]').click()
    fr.locator('[data-skip-tutorial]').click()
    frame.wait_for_function("() => document.querySelector('.trial-body') && document.querySelector('.trial-body').dataset.state === 'answer'", timeout=15000)
    ans = frame.evaluate("() => { const s = ES.ui.trialView.current.trial.question.slots; return s.map(x => x.options.map(String).indexOf(String(x.answer))); }")
    for si, idx in enumerate(ans):
        fr.locator(f'.answer-slot[data-slot="{si}"] .key[data-opt="{idx}"]').click()
    frame.wait_for_function("() => document.querySelector('.trial-body').dataset.state === 'feedback'", timeout=5000)
    c.ok(True, 'srcdoc: a trial plays and scores')
    shot(pg, 'srcdoc_trial_390')
    frame.evaluate("() => { ES.ui.session.abandon(); ES.core.router.go('settings', {}, { reset: true }); }")
    fr.locator('[data-export]').click()
    fr.locator('[data-copy-backup]').click()
    frame.wait_for_function("() => document.querySelector('.copybox') || [...document.querySelectorAll('.toast')].some(t => /copied/i.test(t.textContent))", timeout=5000)
    c.ok(True, 'srcdoc: Copy the text either copies or opens the copy box')
    close = frame.locator('.sheet:has(.copybox) .sheet-actions .btn-primary')
    if close.count():
        close.click()
    fr.locator('[data-show-backup]').click()
    frame.wait_for_selector('.copybox', timeout=5000)
    c.ok(frame.evaluate("document.querySelector('.copybox').value.includes('earshot-backup')"), 'srcdoc: the backup text is always reachable in a copy box')
    c.ok(fr.locator('.sheet-export a.chimera-link').count() == 1, 'srcdoc: the export carries the Chimera invitation')
    shot(pg, 'srcdoc_copybox_390')
    mine, other = tab.split()
    c.ok(not mine, 'srcdoc: no page errors from shell code', mine[:5])
    for who, text in other:
        c.warn(f'srcdoc: error from {who}: {text}')
    pg.context.close()
    return c
