"""Weekly Night Out in a real browser: the same week gives the identical challenge in two separate browser runs (and
for a fresh and a long-term profile), the result card draws, "Copy text" puts the Chimera link on the clipboard,
"Download image" saves a 1200×675 PNG, and a blocked download falls back to the image shown to save by hand.
The data fixture stands in for the voice packs where the current packs cannot build every stop (a page variant that
loads tests/fixtures/data-fixture.js instead of data/*.js). Run: python3 tests/e2e/game_weekly.py
"""
import json
import struct
import sys

from playwright.sync_api import sync_playwright

from harness import Checks, OUT, ROOT, browser_lock, close_sheets, http_server, launch, new_tab, preset
from game_common import build_page, game_errors, longterm_records

WEEK = '2026-W48'
GEN = """(wk) => { ES.game.weekly._clear(); const out = [];
  for (let k = 0; k < 4; k++) out.push(ES.game.weekly.trials(wk, k));
  return JSON.stringify({ route: ES.game.weekly.route(wk), trials: out }); }"""


def fixture_page():
    rel = build_page()
    p = ROOT / rel
    html = p.read_text(encoding='utf8')
    for f in ('data/voices.js', 'data/vocab.js', 'data/manifest.js'):
        html = html.replace('<script src="%s"></script>' % f, '')
    html = html.replace('<script src="data/packs.js"></script>', '<script src="tests/fixtures/data-fixture.js"></script>\n<script src="data/packs.js"></script>')
    if 'tests/fixtures/data-fixture.js' not in html:
        html = html.replace('<!-- scripts:begin -->', '<!-- scripts:begin -->\n<script src="tests/fixtures/data-fixture.js"></script>')
    out = OUT / 'game-index-fixture.html'
    out.write_text(html, encoding='utf8')
    return 'tests/out/game-index-fixture.html'


def boot(p, base, rel):
    p.goto(base + '/' + rel)
    p.wait_for_function("() => window.ES && ES.app && ES.app.booted", timeout=20000)
    close_sheets(p)


def main():
    c = Checks('game_weekly')
    with browser_lock(timeout=3600), sync_playwright() as pw, http_server() as base:
        browser = launch(pw)
        try:
            run(c, browser, base)
        finally:
            browser.close()
    for ok, name, detail in c.items:
        print(('PASS ' if ok else 'FAIL ') + name + ('' if ok else '  -> ' + str(detail)[:400]))
    print('%d/%d passed' % (len(c.items) - len(c.failed), len(c.items)))
    sys.exit(1 if c.failed else 0)


def run(c, browser, base):
    rel = fixture_page()
    runs = []
    for i, init in enumerate([None, None, preset(longterm_records())]):
        tab = new_tab(browser, viewport=(390, 844), init=init)
        boot(tab.page, base, rel)
        c.ok(tab.page.evaluate('() => !!ES.data.__fixture'), 'run %d uses the data fixture' % i)
        runs.append(tab.page.evaluate(GEN, WEEK))
        c.ok(tab.page.evaluate("(wk) => ES.game.weekly.available(wk).ok", WEEK), 'run %d: the week is available' % i)
        mine, other = game_errors(tab)
        c.ok(not mine, 'run %d: no errors from js/game' % i, mine)
        tab.page.context.close()
    c.ok(len(runs[0]) > 5000, 'the week has content (%d chars)' % len(runs[0]))
    c.eq(runs[0], runs[1], 'two separate runs: identical challenge for the same week')
    c.eq(runs[0], runs[2], 'a long-term profile gets the identical challenge')
    n = len(json.loads(runs[0])['trials'][0])
    c.eq(n, 6, 'six trials per stop')

    # the card: draw, copy text, download, blocked download
    ctx = browser.new_context(viewport={'width': 390, 'height': 844}, accept_downloads=True)
    ctx.grant_permissions(['clipboard-read', 'clipboard-write'], origin=base)
    ctx.add_init_script(preset(longterm_records()))
    p = ctx.new_page()
    errs = []
    p.on('pageerror', lambda e: errs.append(str(e)))
    boot(p, base, rel)
    p.evaluate("""(wk) => ES.game.core.update(r => { ['110100', '111010', '111111', '100000'].forEach((m, k) =>
      ES.game.weekly.recordStop(r, wk, k, m, Date.now() - 1000 * (5 - k))); })""", WEEK)
    p.evaluate("(wk) => ES.core.router.go('weekly', { week: wk })", WEEK)
    p.wait_for_selector('[data-weekly-card]')
    c.eq(p.locator('[data-score]').get_attribute('data-score'), '14/24', 'card score')
    p.wait_for_function("() => { const i = document.querySelector('.g-shareimg'); return i && i.src.startsWith('data:image/png') && i.naturalWidth === 1200; }", timeout=8000)
    c.ok(True, 'card image 1200 px wide')
    p.locator('[data-copy-text]').click()
    p.wait_for_timeout(300)
    clip = p.evaluate('() => navigator.clipboard.readText().catch(() => "")')
    box = p.evaluate("() => { const t = document.querySelector('.copybox'); return t ? t.value : ''; }")
    txt = clip or box
    c.ok('https://discord.gg/chmr' in txt and WEEK in txt, 'copied text carries the week and the Chimera link', txt[:200])
    close_sheets(p)
    with p.expect_download(timeout=8000) as dl:
        p.locator('[data-download-image]').click()
    path = dl.value.path()
    head = open(path, 'rb').read(24)
    w, h = struct.unpack('>II', head[16:24])
    c.ok(head[:8] == b'\x89PNG\r\n\x1a\n' and (w, h) == (1200, 675), 'downloaded a 1200×675 PNG (%sx%s)' % (w, h))
    c.eq(dl.value.suggested_filename, 'earshot-weekly-%s.png' % WEEK, 'download file name')
    p.evaluate("() => { URL.createObjectURL = () => { throw new Error('blocked'); }; }")
    p.locator('[data-download-image]').click()
    p.wait_for_selector('.sheet .g-shareimg', timeout=6000)
    c.ok(True, 'blocked download → the image is shown to save by hand')
    p.locator('.sheet .g-shareimg').screenshot(path=str(OUT / 'game' / 'weekly_card_image.png'))
    close_sheets(p)
    c.ok(not [e for e in errs if 'js/game' in e], 'card page: no game errors', errs[:3])
    ctx.close()


if __name__ == '__main__':
    main()
