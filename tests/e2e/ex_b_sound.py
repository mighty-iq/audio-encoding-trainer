#!/usr/bin/env python3
"""exB browser test for RV-code H2 in Seek: a search during which no sound played is never scored.
1. The audio context is suspended and cannot resume (the review's failing case): grabbing your dot does not start
   a scene, and letting go at the voice does not reach the word question; the set records nothing and the learner
   does not move; the screen says the sound did not play.
2. Audio works again: the same scene plays, is answered and is scored (one result in the set).
3. The context stops in the middle of a search (a call, another app): the scene stops, the release is not scored,
   and a new grab starts the sound again.
Before the fix the first release reached the word question and was scored. Run:
tools/with-browser.sh python3 tests/e2e/ex_b_sound.py   Outputs: tests/out/exb/sound-*.png, ex_b_sound.json. MIT."""
import pathlib
import sys
import time

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import ex_b_common as C  # noqa: E402

PREP = """() => {
  ES.core.store.update('profile', function (r) { r.tutorials = r.tutorials || {}; r.tutorials.seek = true; });
  var L = ES.engine.learner; L.sync && L.sync(); L.state.cond['seek:base'] = { n: 5, acc: 0.7, at: Date.now() }; L.save();
}"""
BLOCK = "() => { var c = ES.audio.ctx.ensure(); c.resume = function () { return Promise.resolve(); }; return c.suspend().then(function () { return c.state; }); }"
UNBLOCK = "() => { var c = ES.audio.ctx.raw(); delete c.resume; return c.resume().then(function () { return c.state; }); }"


def wait_phase(page, phase, timeout=10):
    t0 = time.time()
    while time.time() - t0 < timeout:
        pk = C.seek_peek(page)
        if pk and pk['phase'] == phase:
            return pk
        time.sleep(0.1)
    return C.seek_peek(page)


def counts(page):
    return page.evaluate("() => ({ results: ES.ui.session.currentSet().results.length, n: ES.engine.learner.state.n })")


def main():
    rep = C.Report('ex_b_sound')
    url = C.build_page('sound.html')
    with sync_playwright() as p:
        b = C.launch(p)
        ctx, page = C.new_page(b, 'phone-s')
        C.boot(page, url)
        page.evaluate(PREP)
        C.start_set(page, 'seek', 3)
        pk = wait_phase(page, 'search')
        before = counts(page)
        state = page.evaluate(BLOCK)
        rep.check('the audio context is suspended and cannot resume', state == 'suspended', state)
        C.seek_walk(page, steps=12, pause=0.02, hold_s=1.8)   # the unlock gets its 1.5 s
        time.sleep(0.4)
        pk2 = C.seek_peek(page)
        status = page.inner_text('.trial-status')
        rep.check('1: no word question after a silent search', pk2['phase'] == 'search', pk2['phase'])
        rep.check('1: the screen says the sound did not play', 'didn’t play' in status, status)
        rep.check('1: nothing is scored or learned', counts(page) == before, [before, counts(page)])
        C.shot(page, 'sound-silent')
        state = page.evaluate(UNBLOCK)
        rep.check('audio runs again', state == 'running', state)
        C.seek_walk(page, steps=12, pause=0.02, hold_s=0.4)
        pk3 = wait_phase(page, 'word', 5)
        rep.check('2: with sound the same scene reaches the word question', pk3['phase'] == 'word' and pk3['answer'] == pk['answer'], pk3['phase'])
        C.answer(page, [pk3['word']])
        wait_phase(page, 'feedback', 5)
        after = counts(page)
        rep.check('2: the heard scene is scored once', after['results'] == before['results'] + 1, after)
        page.locator('[data-next]').first.click()
        pk4 = wait_phase(page, 'search', 10)
        # 3: the context stops mid-search
        x0, y0 = C.field_xy(page, pk4['pos']['x'], pk4['pos']['y'])
        page.mouse.move(x0, y0)
        page.mouse.down()
        for i in range(1, 6):
            page.mouse.move(x0 + i * 6, y0 - i * 10)
            time.sleep(0.05)
        time.sleep(0.4)
        rep.check('3: the scene plays while you drag', C.seek_peek(page)['listening'] is True)
        page.evaluate(BLOCK)
        time.sleep(0.4)
        mid = C.seek_peek(page)
        rep.check('3: the scene stops when the context does', mid['listening'] is False, mid)
        x1, y1 = C.field_xy(page, mid['answer']['x'], mid['answer']['y'])
        page.mouse.move(x1, y1, steps=8)
        page.mouse.up()
        time.sleep(0.3)
        pk5 = C.seek_peek(page)
        rep.check('3: a release after the sound stopped is not scored', pk5['phase'] == 'search' and counts(page)['results'] == after['results'], [pk5['phase'], counts(page)])
        page.evaluate(UNBLOCK)
        C.seek_walk(page, steps=12, pause=0.02, hold_s=0.4)
        rep.check('3: a new grab starts the sound again and the scene goes on', wait_phase(page, 'word', 5)['phase'] == 'word')
        errs = C.errors(page)
        rep.check('no page errors', not errs, errs[:4])
        b.close()
    return rep.done()


if __name__ == '__main__':
    sys.exit(main())
