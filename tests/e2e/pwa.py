#!/usr/bin/env python3
"""PWA browser test (Chromium via Playwright): the installable, offline Pages build and the in-app browser notice.

A copy of the site (the files of the precache list, with sw.js regenerated for the copy by tools/build-sw.mjs
--root) is served from a local http server like GitHub Pages serves the repository. Checks:
  1. the worker installs and every precached URL is in its cache, which is named after the version;
  2. Chromium parses the manifest without errors, and its icons load with the sizes it states;
  3. an update (a changed file, sw.js rewritten for it) installs and waits; its banner never shows during a set,
     shows after it, and Reload brings in the new version and deletes the old cache;
  4. a version whose file has other bytes than sw.js lists never installs, and the running version stays;
  5. file:// and the single file (over http and file://) never register a worker, even when forced;
  6. the in-app notice: shown for an in-app user agent, Dismiss is remembered after a reload; never for the
     Claude app's webview, never on file://;
  7. the app loads offline (browser offline, then the server stopped) from the worker's cache.
Automated browsers skip the worker unless ES_CONFIG.pwa === true (js/core/pwa.js), so this test forces it.
Run: tools/with-browser.sh python3 tests/e2e/pwa.py --held  (--held: the wrapper or run_all already holds a browser
slot; without it the harness takes one itself)        Outputs: tests/out/pwa/*.png. MIT licence.
"""
import contextlib
import functools
import http.server
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import time

from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import harness as H  # noqa: E402

ROOT = H.ROOT
OUT = H.OUT / 'pwa'
FORCE = "window.ES_CONFIG = Object.assign(window.ES_CONFIG || {}, { pwa: true });"
SPY = """window.__swRegister = 0;
try { var P = window.ServiceWorkerContainer && ServiceWorkerContainer.prototype; if (P && P.register) { var orig = P.register;
  P.register = function () { window.__swRegister++; return orig.apply(this, arguments); }; } } catch (e) {}"""
UA_INAPP = ('Mozilla/5.0 (Linux; Android 13; Pixel 7 Build/TQ3A.230901.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) '
            'Version/4.0 Chrome/117.0.5938.60 Mobile Safari/537.36 Instagram 302.0.0.34.111 Android (33/13; 420dpi; '
            '1080x2400; Google/google; Pixel 7; panther; panther; en_US; 520702512)')
UA_CLAUDE = ('Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro Build/AP2A.240805.005; wv) AppleWebKit/537.36 (KHTML, like Gecko) '
             'Version/4.0 Chrome/128.0.6613.127 Mobile Safari/537.36 Claude/1.240827.4')
INAPP_TEXT = 'You opened Earshot inside an app. To keep your progress, open it in your browser (menu → Open in browser).'


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = dict(http.server.SimpleHTTPRequestHandler.extensions_map, **{
        '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png',
        '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json'})

    def log_message(self, *args):
        pass


class Server:
    """A static server on a free local port (normal caching headers, like a static host)."""
    def __init__(self, root):
        self.srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(root)))
        self.base = f'http://127.0.0.1:{self.srv.server_address[1]}'
        threading.Thread(target=self.srv.serve_forever, daemon=True).start()

    def stop(self):
        self.srv.shutdown()
        self.srv.server_close()


def node(*args, cwd=ROOT):
    return subprocess.run(['node', *args], cwd=str(cwd), capture_output=True, text=True, check=True).stdout


def make_site(dst):
    files = node('tools/build-sw.mjs', '--list').split()
    for rel in files + ['sw.js']:
        (dst / rel).parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / rel, dst / rel)
    node('tools/build-sw.mjs', '--root', str(dst))
    return files


def version_of(site):
    return re.search(r"var VERSION = '([0-9a-f]+)';", (site / 'sw.js').read_text()).group(1)


def until(fn, timeout=20.0, step=0.2):
    t0 = time.time()
    while time.time() - t0 < timeout:
        v = fn()
        if v:
            return v
        time.sleep(step)
    return None


def sw_state(page):
    return page.evaluate("""async () => {
      const r = await navigator.serviceWorker.getRegistration();
      if (!r) return null;
      const s = (w) => w ? w.state : null;
      return { active: s(r.active), waiting: s(r.waiting), installing: s(r.installing), controlled: !!navigator.serviceWorker.controller, scope: r.scope };
    }""")


def caches_now(page):
    return page.evaluate("""async () => {
      const out = {};
      for (const n of (await caches.keys()).filter((n) => n.startsWith('earshot@'))) out[n] = (await (await caches.open(n)).keys()).map((r) => r.url);
      return out;
    }""")


def worker_version(page):
    return page.evaluate("""() => new Promise((resolve) => {
      const c = navigator.serviceWorker.controller;
      if (!c) { resolve(null); return; }
      const on = (ev) => { if (ev.data && ev.data.type === 'version') { navigator.serviceWorker.removeEventListener('message', on); resolve(ev.data.version); } };
      navigator.serviceWorker.addEventListener('message', on);
      c.postMessage({ type: 'version' });
      setTimeout(() => resolve(null), 3000);
    })""")


def open_app(page, url):
    page.goto(url)
    H.wait_ready(page)
    H.close_sheets(page)


def banner(page, bid):
    return page.locator(f'#banners [data-banner="{bid}"]')


def check_install(c, page, site, base, files):
    v1 = version_of(site)
    st = until(lambda: (sw_state(page) or {}).get('active') == 'activated' and sw_state(page), timeout=40)
    c.ok(st, 'the worker installs and activates', sw_state(page))
    c.eq(page.evaluate('() => ES.core.pwa.state().reason'), 'ok', 'pwa.js registered it (reason ok)')
    c.eq((st or {}).get('scope'), base + '/', 'its scope is the site folder')
    cs = caches_now(page)
    c.eq(list(cs.keys()), ['earshot@/#' + v1], 'one cache, named after the version in sw.js')
    have = set(next(iter(cs.values()), []))
    want = {base + '/' + f for f in files}
    c.ok(want <= have, f'every precached URL is in the cache ({len(want)} files)', sorted(want - have)[:5])
    c.ok(have <= want, 'nothing else is in the cache', sorted(have - want)[:5])
    page.reload()
    H.wait_ready(page)
    H.close_sheets(page)
    c.ok(until(lambda: sw_state(page)['controlled'], timeout=10), 'after a reload the page is controlled by the worker')
    c.eq(worker_version(page), v1, 'the worker reports the version of sw.js')
    return v1


def check_manifest(c, ctx, page, base):
    cdp = ctx.new_cdp_session(page)
    m = cdp.send('Page.getAppManifest')
    c.eq(m.get('url'), base + '/manifest.webmanifest', 'Chromium finds the manifest link')
    c.eq(m.get('errors'), [], 'Chromium parses the manifest without errors')
    try:
        inst = cdp.send('Page.getInstallabilityErrors').get('installabilityErrors', [])
        ids = [e.get('errorId') for e in inst]
        c.ok(not [i for i in ids if i not in ('in-incognito',)], 'no installability errors (incognito aside)', ids)
    except Exception as e:  # an older CDP without the method: the parse check above still holds
        c.warn('installability check unavailable: ' + str(e)[:120])
    icons = page.evaluate("""async () => {
      const man = await (await fetch('manifest.webmanifest')).json();
      const out = [];
      for (const i of man.icons) { const b = await (await fetch(i.src)).blob(); const im = await createImageBitmap(b);
        out.push({ src: i.src, sizes: i.sizes, got: im.width + 'x' + im.height, purpose: i.purpose }); }
      return { man, out };
    }""")
    man = icons['man']
    c.ok(man['name'] == 'Earshot' and man['short_name'] == 'Earshot' and man['display'] == 'standalone'
         and man['start_url'] == './' and man['scope'] == './', 'manifest fields', man)
    bad = [i for i in icons['out'] if i['sizes'] != i['got']]
    c.ok(not bad and len(icons['out']) >= 4, 'every manifest icon decodes at its stated size', bad)
    apple = page.evaluate("async () => { const b = await (await fetch('icons/apple-touch-icon.png')).blob(); const im = await createImageBitmap(b); return im.width + 'x' + im.height; }")
    c.eq(apple, '180x180', 'the apple-touch-icon decodes at 180×180')


def check_update(c, page, site, v1):
    with open(site / 'css' / 'screens.css', 'a') as f:
        f.write('\n/* pwa update test */\n')
    node('tools/build-sw.mjs', '--root', str(site))
    v2 = version_of(site)
    c.ok(v2 != v1, 'a changed file gives a new version', v2)
    page.evaluate('() => { ES.ui.inSet = true; }')                     # a set is running
    page.evaluate('() => ES.core.pwa.update()')
    st = until(lambda: (sw_state(page) or {}).get('waiting') == 'installed' and sw_state(page), timeout=30)
    c.ok(st, 'the new version installs and waits', sw_state(page))
    page.evaluate("() => { ES.hooks.emit('route', { name: 'play' }); }")
    time.sleep(1.5)
    c.eq(banner(page, 'update').count(), 0, 'no update banner during a set')
    c.eq(page.evaluate('() => ES.core.pwa.state().pending'), 1, 'the banner waits for the set to end')
    page.evaluate("() => { ES.ui.inSet = false; ES.hooks.emit('set:done', {}); }")
    c.ok(until(lambda: banner(page, 'update').count() == 1, timeout=6), 'after the set the update banner shows')
    text = banner(page, 'update').inner_text() if banner(page, 'update').count() else ''
    c.ok('A new version of Earshot is ready.' in text and 'Reload' in text, 'banner text and its Reload button', text)
    H.shot(page, 'pwa/update-banner')
    with page.expect_navigation(timeout=15000):
        banner(page, 'update').locator('button').click()
    H.wait_ready(page)
    H.close_sheets(page)
    c.eq(until(lambda: worker_version(page) == v2 and v2, timeout=10), v2, 'Reload brings in the new version')
    cs = until(lambda: (lambda x: list(x) == ['earshot@/#' + v2] and x)(caches_now(page)), timeout=10)
    c.ok(cs, 'the old version\'s cache is deleted', list(caches_now(page)))
    got = page.evaluate("async () => { const r = await caches.match(new URL('css/screens.css', location.href).href); return r ? await r.text() : ''; }")
    c.ok('/* pwa update test */' in got, 'the changed file comes with the new version')
    c.eq(banner(page, 'update').count(), 0, 'no banner after the update')
    return v2


def check_mismatch(c, page, site, v2):
    css = site / 'css' / 'screens.css'
    with open(css, 'a') as f:
        f.write('\n/* listed bytes */\n')
    node('tools/build-sw.mjs', '--root', str(site))                     # sw.js lists these bytes …
    with open(css, 'a') as f:
        f.write('\n/* other bytes */\n')                                  # … the server has others
    page.evaluate("""async () => {                                     // record the new worker's life
      const r = await navigator.serviceWorker.getRegistration();
      window.__mm = { found: 0, states: [] };
      r.addEventListener('updatefound', () => {
        window.__mm.found++;
        const w = r.installing;
        if (!w) return;
        window.__mm.states.push(w.state);
        w.addEventListener('statechange', () => window.__mm.states.push(w.state));
      });
    }""")
    page.evaluate('() => ES.core.pwa.update()')
    mm = until(lambda: (lambda m: m['states'] and m['states'][-1] in ('redundant', 'installed', 'activated') and m)(page.evaluate('() => window.__mm')), timeout=30)
    c.ok(mm and mm['found'] == 1, 'the browser starts installing the listed version', page.evaluate('() => window.__mm'))
    c.ok(mm and 'installed' not in mm['states'] and mm['states'][-1] == 'redundant', 'a version with mismatched bytes never installs', mm)
    st = sw_state(page)
    c.ok(st and st['waiting'] is None and st['active'] == 'activated', 'nothing waits; the active worker stays', st)
    c.eq(worker_version(page), v2, 'the running version stays')
    time.sleep(0.5)
    c.eq(banner(page, 'update').count(), 0, 'and no update banner shows')
    node('tools/build-sw.mjs', '--root', str(site))                     # consistent again for what follows


def check_never_registers(c, browser, site_url, label, reason):
    ctx = browser.new_context(viewport={'width': 390, 'height': 844})
    ctx.add_init_script(FORCE)
    ctx.add_init_script(SPY)
    tab = H.Tab(ctx.new_page())
    page = tab.page
    page.goto(site_url)
    H.wait_ready(page, timeout=30000)
    time.sleep(1.5)                                                     # registration would run 0.5 s after load
    c.eq(page.evaluate('() => window.__swRegister'), 0, f'{label}: no worker is registered')
    got = page.evaluate('() => ES.core.pwa.state().reason')
    c.ok(got in reason, f'{label}: pwa.js says why ({got})', got)
    if site_url.startswith('http'):
        c.eq(page.evaluate('async () => (await navigator.serviceWorker.getRegistrations()).length'), 0, f'{label}: no registrations')
    c.eq(page.locator('link[rel="manifest"]').count(), 0 if 'single' in label else 1, f'{label}: manifest link ' + ('absent' if 'single' in label else 'present'))
    errs = [e for e in tab.errors if 'pwa' in (e['where'] + e['text'])]
    c.ok(not errs, f'{label}: no errors from pwa.js', errs[:2])
    ctx.close()


def check_inapp(c, browser, base):
    ctx = browser.new_context(viewport={'width': 390, 'height': 844}, user_agent=UA_INAPP, device_scale_factor=2, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    open_app(page, base + '/')
    b = banner(page, 'inapp')
    c.ok(until(lambda: b.count() == 1, timeout=5), 'in-app browser: the notice shows')
    text = b.inner_text() if b.count() else ''
    c.ok(INAPP_TEXT in text and 'Dismiss' in text, 'in-app notice text and Dismiss', text)
    H.shot(page, 'pwa/inapp-notice')
    if b.count():
        box = b.locator('button').bounding_box()
        c.ok(box and box['height'] >= 30, 'the Dismiss button is a reasonable tap target', box)
        b.locator('button').click()
    c.eq(b.count(), 0, 'Dismiss removes the notice')
    c.ok(page.evaluate("() => localStorage.getItem('earshot.v1.$inapp')"), 'the dismissal is remembered on the device')
    page.reload()
    H.wait_ready(page)
    H.close_sheets(page)
    time.sleep(0.8)
    c.eq(b.count(), 0, 'after a reload the dismissed notice stays away')
    c.eq(page.evaluate('() => ES.core.pwa.state().notice'), 'dismissed', 'state: dismissed')
    ctx.close()

    ctx = browser.new_context(viewport={'width': 390, 'height': 844}, user_agent=UA_CLAUDE, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    open_app(page, base + '/')
    time.sleep(0.8)
    c.eq(banner(page, 'inapp').count(), 0, 'the Claude app webview gets no notice')
    ctx.close()

    ctx = browser.new_context(viewport={'width': 390, 'height': 844}, user_agent=UA_INAPP)
    page = ctx.new_page()
    open_app(page, H.file_url('index.html'))
    time.sleep(0.8)
    c.eq(banner(page, 'inapp').count(), 0, 'file:// gets no notice, even in an in-app user agent')
    c.eq(page.evaluate('() => ES.core.pwa.state().notice'), 'not-here', 'state: not-here on file://')
    ctx.close()


def check_offline(c, ctx, page, server, files):
    failed = []
    page.on('requestfailed', lambda r: failed.append(r.url))
    packs = len([f for f in files if f.startswith('audio/pack-')])
    ctx.set_offline(True)
    page.reload()
    H.wait_ready(page)
    c.eq(page.evaluate('() => Object.keys(ES.packs).length'), packs, 'offline: the app boots with every audio pack')
    c.eq(failed, [], 'offline: no request failed')
    server.stop()
    page.reload()
    H.wait_ready(page)
    H.close_sheets(page)
    c.ok(page.evaluate("() => !!document.querySelector('#app .screen')"), 'offline with the server gone: a screen is shown')
    H.shot(page, 'pwa/offline-home')
    ctx.set_offline(False)


def main():
    c = H.Checks('pwa')
    t0 = time.time()
    OUT.mkdir(parents=True, exist_ok=True)
    tmp = pathlib.Path(tempfile.mkdtemp(prefix='earshot-pwa-'))
    try:
        site = tmp / 'site'
        files = make_site(site)
        single = tmp / 'single'
        single.mkdir()
        node('tools/build-single.mjs', '--out', str(single / 'earshot.html'))
        html = (single / 'earshot.html').read_text(encoding='utf8')
        c.ok('rel="manifest"' not in html and 'rel="apple-touch-icon"' not in html, 'the single file has no manifest or home-screen icon link')
        held = '--held' in sys.argv[1:]
        with (contextlib.nullcontext() if held else H.browser_lock()), sync_playwright() as pw:
            browser = H.launch(pw)
            server, server2 = Server(site), Server(single)
            ctx = browser.new_context(viewport={'width': 390, 'height': 844})
            ctx.add_init_script(FORCE)
            tab = H.Tab(ctx.new_page())
            page = tab.page
            open_app(page, server.base + '/')
            v1 = check_install(c, page, site, server.base, files)
            check_manifest(c, ctx, page, server.base)
            v2 = check_update(c, page, site, v1)
            check_mismatch(c, page, site, v2)
            check_inapp(c, browser, server.base)
            check_never_registers(c, browser, H.file_url('index.html'), 'file://', ('protocol', 'unsupported'))
            check_never_registers(c, browser, server2.base + '/earshot.html', 'single file over http', ('inline',))
            check_never_registers(c, browser, (single / 'earshot.html').as_uri(), 'single file on file://', ('protocol', 'unsupported'))
            check_offline(c, ctx, page, server, files)
            mine = [e for e in tab.errors if re.search(r'pwa\.js|sw\.js', e['where'] + ' ' + e['text'])]
            c.ok(not mine, 'no page errors from pwa.js or sw.js', mine[:3])
            for e in tab.errors:
                if e not in mine:
                    c.warn('page error (not pwa): ' + e['text'][:160])
            server2.stop()
            browser.close()
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    bad = c.failed
    for ok, name, detail in c.items:
        print(('✓ ' if ok else '✗ ') + name + ('' if ok else f' — {detail}'), flush=True)
    for w in c.warnings:
        print('! ' + w, flush=True)
    print(f'\npwa: {len(c.items) - len(bad)}/{len(c.items)} passed ({time.time() - t0:.0f} s)')
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
