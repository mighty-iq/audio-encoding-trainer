#!/usr/bin/env python3
"""exB browser test: Echo, Voices and Seek start from the Night out map. Map → a venue → its "Also here" row →
Play starts a set of that condition (the game's venues.plan with the condition's pinned dials); the trials carry
the pins (Echo at the café: details, rate and delay held at the café's levels; Seek at the park: no decoys, a
large target, short pauses); a trial plays and is scored; Pause → End set lands on Results. Also checks that the
Home index opens Missions. Run: tools/with-browser.sh python3 tests/e2e/ex_b_map.py   Outputs: tests/out/exb/map-*.png.
MIT licence."""
import pathlib
import sys
import time

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import ex_b_common as C  # noqa: E402

PREP = """() => {
  ES.core.store.update('profile', function (r) { r.tutorials = r.tutorials || {}; ['echo', 'voices', 'seek'].forEach(function (x) { r.tutorials[x] = true; }); });
  var L = ES.engine.learner; L.sync && L.sync(); L.state.cond['seek:base'] = { n: 5, acc: 0.7, at: Date.now() }; L.save();
  ES.core.store.update('game', function (r) { r.venues = r.venues || {}; r.venues.park = Object.assign({}, r.venues.park || {}, { open: Date.now() }); });
}"""


def pins(page, venue, ex):
    return page.evaluate("""([v, ex]) => { var c = ES.game.data.venue(v).also.filter(function (a) { return a.ex === ex; })[0]; return c ? c.pin : null; }""", [venue, ex])


def play_from_venue(page, rep, venue, ex):
    page.evaluate("(v) => ES.core.router.go('venue', { id: v }, { reset: true })", venue)
    btn = page.locator('[data-play-also^="%s."]' % ex)
    if not rep.check('%s: the %s venue offers a %s set' % (ex, venue, ex), btn.count() >= 1, btn.count()):
        return
    C.shot(page, 'map-%s-venue' % venue)
    btn.first.click()
    page.wait_for_function("() => (ES.core.router.current() || {}).name === 'play'", timeout=10000)
    want = pins(page, venue, ex)
    if ex == 'seek':
        for _ in range(100):
            pk = C.seek_peek(page)
            if pk and pk['phase'] == 'search' and not pk['practice']:
                break
            time.sleep(0.1)
        dials = page.evaluate("() => ES.ex._seekScene.current.spec.setting.dials")
        rep.check('seek: the scene carries the park’s pins %s' % want, all(dials.get(k) == v for k, v in want.items()), dials)
        C.seek_walk(page, steps=12, pause=0.02, hold_s=0.2)
        page.wait_for_function("() => ES.ex._seekScene.current.peek().phase === 'word'", timeout=5000)
        C.answer(page, [C.seek_peek(page)['word']])
        page.wait_for_function("() => ES.ex._seekScene.current.peek().phase === 'feedback'", timeout=5000)
    else:
        t0 = time.time()
        while time.time() - t0 < 40 and C.state(page)['trial'] != 'answer':
            time.sleep(0.1)
        t = page.evaluate("() => { var t = ES.ui.trialView.current.trial; return { dials: t.setting.dials, kind: t.meta && t.meta.decision ? 'flow' : 'other', answers: t.question.slots.map(function (s) { return String(s.answer); }) }; }")
        rep.check('%s: the trial carries the venue’s pins %s' % (ex, want), all(t['dials'].get(k) == v for k, v in want.items()), t['dials'])
        C.answer(page, t['answers'])
        page.wait_for_function("() => document.querySelector('.trial-body').dataset.state === 'feedback'", timeout=5000)
    rep.check('%s: a trial from the map plays and is scored' % ex, page.evaluate("() => ES.ui.session.currentSet().results.length") == 1)
    C.shot(page, 'map-%s-trial' % ex)
    page.locator('[data-pause]').click()
    page.locator('[data-end-set]').click()
    page.wait_for_function("() => (ES.core.router.current() || {}).name === 'results'", timeout=10000)
    kind = page.evaluate("() => { var S = ES.ui.session.state(); return S.sets[0].plan.kind + ':' + S.sets[0].plan.venue; }")
    rep.check('%s: ending the set lands on Results (a %s set)' % (ex, kind), kind == 'venue:' + venue, kind)
    page.evaluate("() => { if (ES.ui.session.active()) ES.ui.session.finish(); ES.core.router.go('home', {}, { reset: true }); }")
    time.sleep(0.3)


def main():
    rep = C.Report('ex_b_map')
    url = C.build_page('map.html')
    with sync_playwright() as p:
        b = C.launch(p)
        ctx, page = C.new_page(b, 'phone')
        C.boot(page, url)
        page.evaluate(PREP)
        rep.check('the session runner takes venue plans', page.evaluate("() => !!(ES.ui.session.supports && ES.ui.session.supports.plan)"))
        play_from_venue(page, rep, 'cafe', 'echo')
        play_from_venue(page, rep, 'cafe', 'voices')
        play_from_venue(page, rep, 'park', 'seek')
        page.evaluate("() => ES.core.router.go('home', {}, { reset: true })")
        page.locator('[data-index-link="missions"]').click()
        page.wait_for_selector('[data-mission]', timeout=5000)
        rep.check('Home index opens Missions', C.route(page) == 'missions')
        errs = C.errors(page)
        rep.check('no page errors', not errs, errs[:4])
        b.close()
    return rep.done()


if __name__ == '__main__':
    sys.exit(main())
