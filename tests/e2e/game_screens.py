"""Game layer screens in a real browser: map, venue, cast, weekly, progress, the home card and the news block, on a
fresh profile (nothing invented anywhere) and on a simulated long-term profile, at 390×844 and 360×640 (light and
dark) and 1366×768. Screenshots go to tests/out/game/. Run: flock /tmp/earshot-browser.lock python3 tests/e2e/game_screens.py
"""
import json
import sys

from playwright.sync_api import sync_playwright

from harness import Checks, OUT, browser_lock, close_sheets, http_server, launch, new_tab, preset
from game_common import build_page, game_errors, longterm_records

SHOTS = OUT / 'game'
SIZES = [((390, 844), 'light'), ((360, 640), 'dark'), ((1366, 768), 'light')]


def shot(page, name):
    SHOTS.mkdir(parents=True, exist_ok=True)
    page.screenshot(path=str(SHOTS / (name + '.png')), full_page=True)


def open_screen(page, base, name, params=None):
    page.evaluate('([n, p]) => ES.core.router.go(n, p || {})', [name, params])
    page.wait_for_selector('[data-screen="%s"]' % name, timeout=8000)
    page.wait_for_timeout(120)


def boot(page, base):
    page.goto(base + '/' + build_page())
    page.wait_for_function("() => window.ES && ES.app && ES.app.booted", timeout=20000)
    close_sheets(page)


def fresh_suite(c, browser, base):
    tab = new_tab(browser, viewport=(390, 844))
    p = tab.page
    boot(p, base)
    open_screen(p, base, 'map')
    c.eq(p.locator('.g-vrow').count(), 12, 'fresh map lists 12 venues')
    c.eq(sorted(p.eval_on_selector_all('.g-vrow.is-open', 'els => els.map(e => e.dataset.venueRow)')), ['cafe', 'lecture', 'phone'], 'fresh: three venues open')
    vals = p.eval_on_selector_all('.gm-node.is-open .gm-val', 'els => els.map(e => e.textContent)')
    c.ok(all(v == '–' for v in vals), 'fresh: no earshot number on the map', vals)
    c.ok(p.locator('.g-vrow.is-open .g-vval').all_text_contents() == ['not measured yet'] * 3, 'fresh: open rows say not measured yet')
    shot(p, 'map_fresh_390_light')
    open_screen(p, base, 'venue', {'id': 'cafe'})
    c.eq(p.locator('[data-earshot]').get_attribute('data-earshot'), '', 'fresh café: no earshot')
    c.ok('Not measured yet' in p.locator('.g-earshot-mean').inner_text(), 'fresh café: says not measured yet')
    c.ok(p.locator('[data-play-venue="cafe"]').count() == 1, 'café has a play button')
    shot(p, 'venue_cafe_fresh_390_light')
    open_screen(p, base, 'venue', {'id': 'bar'})
    c.ok(p.locator('[data-locked]').count() == 1, 'bar is locked on a fresh profile')
    c.ok(p.locator('[data-play-venue="bar"]').is_disabled(), 'locked venue cannot be played')
    open_screen(p, base, 'cast')
    states = set(p.eval_on_selector_all('.g-card', 'els => els.map(e => e.dataset.state)'))
    c.ok(states == {'unmet'} or not states, 'fresh cast: every card unmet', states)
    c.ok(p.locator('.g-cast-count').count() == 0 or p.locator('.g-cast-count').inner_text().startswith('0 of'), 'fresh cast count')
    shot(p, 'cast_fresh_390_light')
    open_screen(p, base, 'weekly')
    c.eq(p.locator('.g-stop').count(), 4, 'weekly: four stops')
    c.eq(p.locator('[data-weekly-card]').count(), 0, 'fresh weekly: no card yet')
    shot(p, 'weekly_fresh_390_light')
    open_screen(p, base, 'progress')
    c.eq(p.locator('[data-progress-empty]').count(), 1, 'fresh progress: empty state')
    c.eq(p.locator('.g-chart').count(), 0, 'fresh progress: no chart')
    shot(p, 'progress_fresh_390_light')
    open_screen(p, base, 'home')
    c.eq(p.locator('[data-game-home]').count(), 1, 'home shows the game card')
    shot(p, 'home_fresh_390_light')
    mine, other = game_errors(tab)
    c.ok(not mine, 'fresh: no errors from js/game', mine)
    for o in other:
        c.warn('other owner error: ' + o)


def longterm_suite(c, browser, base):
    recs = longterm_records()
    for (vp, scheme) in SIZES:
        tab = new_tab(browser, viewport=vp, scheme=scheme, init=preset(recs))
        p = tab.page
        tag = '%dx%d_%s' % (vp[0], vp[1], scheme)
        boot(p, base)
        open_screen(p, base, 'map')
        n_open = p.locator('.g-vrow.is-open').count()
        c.ok(n_open >= 6, 'long-term %s: several venues open (%d)' % (tag, n_open))
        cafe = p.locator('.gm-node[data-venue="cafe"] .gm-val').text_content()
        c.ok(cafe.endswith('dB'), 'long-term %s: café earshot in dB (%s)' % (tag, cafe))
        fits = p.evaluate("() => { const s = document.querySelector('.g-map-svg').getBoundingClientRect(); return s.right <= innerWidth + 1 && s.left >= -1; }")
        c.ok(fits, 'long-term %s: map fits the width' % tag)
        overflow = p.evaluate("() => document.documentElement.scrollWidth - innerWidth")
        c.ok(overflow <= 1, 'long-term %s: no horizontal scroll on the map (%s px)' % (tag, overflow))
        shot(p, 'map_long_' + tag)
        open_screen(p, base, 'venue', {'id': 'cafe'})
        c.ok(p.locator('[data-earshot]').get_attribute('data-earshot').endswith('dB'), 'long-term %s: café venue earshot' % tag)
        c.ok(p.locator('.g-chart').count() >= 1, 'long-term %s: café history chart' % tag)
        shot(p, 'venue_cafe_long_' + tag)
        open_screen(p, base, 'progress')
        nch = p.locator('.g-chart').count()
        c.ok(nch >= 4, 'long-term %s: progress charts (%d)' % (tag, nch))
        c.ok(p.locator('[data-milestones] li').count() >= 1, 'long-term %s: milestones listed' % tag)
        overflow = p.evaluate("() => document.documentElement.scrollWidth - innerWidth")
        c.ok(overflow <= 1, 'long-term %s: no horizontal scroll on progress (%s px)' % (tag, overflow))
        shot(p, 'progress_long_' + tag)
        if vp[0] == 390:
            # tooltip on a chart point (tap), table view
            ch = p.locator('.g-chart svg').first
            box = ch.bounding_box()
            p.mouse.move(box['x'] + box['width'] * 0.6, box['y'] + box['height'] * 0.5)
            p.wait_for_timeout(80)
            c.ok(p.locator('.g-tip:not([hidden])').count() == 1, 'chart tooltip on hover')
            p.locator('.g-chart .g-link').first.click()
            c.ok(p.locator('.g-table').count() >= 1, 'chart table view')
            shot(p, 'progress_long_tip_' + tag)
            # cast: meet and know some voices, then look
            p.evaluate("""() => { const ids = ES.game.cast.list().map(c => c.id).slice(0, 7); ES.game.core.update(r => {
              ids.forEach((id, i) => { r.cast[id] = { met: Date.now() - 864e5 * (8 - i), n: 5 + i, id: i < 3 ? 4 : i % 3, at: Date.now() - 3600e3 }; }); }); }""")
            open_screen(p, base, 'cast')
            states = p.eval_on_selector_all('.g-card', 'els => els.map(e => e.dataset.state)')
            c.ok(states.count('known') >= 3 and states.count('met') >= 1 and states.count('unmet') >= 1, 'cast cards fill in', states[:10])
            shot(p, 'cast_long_' + tag)
            # weekly with a finished card for this week
            wk = p.evaluate('() => ES.game.weekly.weekKey()')
            p.evaluate("""(wk) => ES.game.core.update(r => { ['110100', '111010', '111111', '100000'].forEach((m, k) => ES.game.weekly.recordStop(r, wk, k, m, Date.now() - 1000 * (5 - k))); })""", wk)
            open_screen(p, base, 'weekly')
            c.eq(p.locator('[data-score]').get_attribute('data-score'), '14/24', 'weekly card score')
            p.wait_for_function("() => { const i = document.querySelector('.g-shareimg'); return i && i.src.startsWith('data:image/png'); }", timeout=6000)
            c.ok(True, 'weekly card image drawn')
            txt = p.evaluate('(wk) => ES.game.weekly.shareText(ES.game.weekly.result(wk))', wk)
            c.ok('https://discord.gg/chmr' in txt, 'share text has the Chimera link')
            shot(p, 'weekly_card_' + tag)
            # the news block between sets (rendered alone; the shell's results screen hosts it)
            p.evaluate("""() => { const n = { returns: [{ title: 'Fresh ears', text: 'Your level held after 4 days away.' }],
              opened: [{ id: 'bar', name: 'Bar', text: 'Bar is open: 2 other voices · same sex. Your earshot there: +1.5 dB.' }],
              milestones: [{ name: 'Equal footing', text: 'You follow a voice as loud as each voice around it, about 7 times in 10.' }],
              venueBest: [{ text: 'New best at the café: −5 dB (was −3.5 dB)' }], lines: [{ kind: 'up', text: 'Your voice vs the others: +2 dB → −1 dB' }],
              weekly: null }; const b = ES.game.ui.newsBlock(n); const host = document.querySelector('[data-screen]'); host.prepend(b); }""")
            p.locator('[data-game-news]').screenshot(path=str(SHOTS / ('news_block_' + tag + '.png')))
            c.ok(p.locator('[data-game-news] li').count() == 5, 'news block lines')
            open_screen(p, base, 'home')
            c.eq(p.locator('[data-game-home]').count(), 1, 'home shows the game card (long-term)')
            shot(p, 'home_long_' + tag)
        mine, other = game_errors(tab)
        c.ok(not mine, 'long-term %s: no errors from js/game' % tag, mine)
        for o in other:
            c.warn('other owner error: ' + o)
        tab.page.context.close()


def main():
    c = Checks('game_screens')
    with browser_lock(timeout=3600), sync_playwright() as pw, http_server() as base:
        browser = launch(pw)
        try:
            fresh_suite(c, browser, base)
            longterm_suite(c, browser, base)
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
