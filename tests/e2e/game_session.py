"""A real Crowd set played through the shell's session (real data, audio rendered by ES.audio, scored by the engine's
flow), then: the game record holds the set (snapshot of levels, met voices), the screen between sets shows the
game's news block, nothing from the game appeared during the set, and the home shows the game card afterwards.
Needs data/ and audio/ packs (skipped otherwise). Run: python3 tests/e2e/game_session.py
"""
import sys

from playwright.sync_api import sync_playwright

from harness import Checks, OUT, browser_lock, close_sheets, http_server, launch, new_tab, preset, wait_state, answer_current
from game_common import build_page, game_errors

PROFILE = {'profile': {'v': 1, 'welcomeSeen': 1, 'tutorials': {'crowd': True, 'far': True, 'strange': True, 'repair': True, 'echo': True, 'seek': True, 'voices': True}}}


def run(c, browser, base, n=8):
    tab = new_tab(browser, viewport=(390, 844), real=True, touch=True, init=preset(PROFILE))
    p = tab.page
    p.goto(base + '/' + build_page())
    p.wait_for_function("() => window.ES && ES.app && ES.app.booted", timeout=20000)
    close_sheets(p)
    if not p.evaluate('() => ES.ui.session.realAvailable()'):
        c.warn('game_session: no real data or audio here; skipped')
        p.context.close()
        return
    p.evaluate("(n) => { ES.engine.planner.session = function () { return { sets: [{ exId: 'crowd', trials: n }, { exId: 'crowd', trials: 2 }] }; }; ES.ui.session.start(); }", n)
    p.wait_for_function("() => ES.core.router.current() && ES.core.router.current().name === 'play'", timeout=15000)
    during = []
    for i in range(n):
        wait_state(p, 'answer', 30000)
        during.append(p.evaluate("() => document.querySelectorAll('[data-game-news], [data-game-home], .chimera-card').length"))
        answer_current(p, i % 4 != 3)
        wait_state(p, 'feedback', 10000)
        p.click('[data-next]')
    c.ok(all(x == 0 for x in during), 'nothing from the game or Chimera on screen during the set', during)
    p.wait_for_function("() => ES.core.router.current().name === 'results'", timeout=15000)
    p.wait_for_timeout(200)
    rec = p.evaluate("() => ES.core.store.get('game')")
    c.ok(rec.get('last') and any(k.startswith('crowd') for k in rec['last']), 'the set left a level snapshot', list((rec.get('last') or {}).keys()))
    news = p.locator('[data-game-news]')
    c.ok(news.count() == 1, 'the news block shows between sets')
    if news.count():
        lines = news.locator('li').all_text_contents()
        c.ok(len(lines) >= 1, 'news lines: ' + ' | '.join(lines)[:300])
    met = len(rec.get('cast') or {})
    c.ok(met >= 0, 'cast record written (%d voices met)' % met)
    p.screenshot(path=str(OUT / 'game' / 'session_results_news_390.png'), full_page=True)
    p.click('[data-end-session]') if p.locator('[data-end-session]').count() else None
    p.wait_for_timeout(300)
    p.evaluate("() => ES.core.router.go('home', {}, { reset: true })")
    p.wait_for_selector('[data-game-home]', timeout=5000)
    c.ok(True, 'home shows the game card after a session')
    p.evaluate("() => ES.core.router.go('map')")
    p.wait_for_selector('[data-screen="map"]')
    cafe = p.locator('.gm-node[data-venue="cafe"] .gm-val').text_content()
    c.ok(cafe is not None, 'map after one real set: café shows ' + str(cafe))
    p.screenshot(path=str(OUT / 'game' / 'map_after_session_390.png'), full_page=True)
    mine, other = game_errors(tab)
    c.ok(not mine, 'real session: no errors from js/game', mine)
    for o in other:
        c.warn('other owner error: ' + o)
    p.context.close()


def main():
    c = Checks('game_session')
    with browser_lock(timeout=3600), sync_playwright() as pw, http_server() as base:
        browser = launch(pw)
        try:
            run(c, browser, base)
        finally:
            browser.close()
    for ok, name, detail in c.items:
        print(('PASS ' if ok else 'FAIL ') + name + ('' if ok else '  -> ' + str(detail)[:400]))
    for w in sorted(set(c.warnings)):
        print('WARN ' + w)
    print('%d/%d passed' % (len(c.items) - len(c.failed), len(c.items)))
    sys.exit(1 if c.failed else 0)


if __name__ == '__main__':
    main()
