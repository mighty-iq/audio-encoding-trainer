#!/usr/bin/env python3
"""exB browser test: a fresh profile goes Home → Start → the exercise's tutorial → its first set, for Echo, Voices
and Seek, at 360×640 (light). A simulated player taps Continue as soon as it is enabled, answers every practice
trial correctly (one deliberate miss on the first practice with --miss, to check that a wrong answer does not
advance), plays Seek's practice scene by dragging itself to the voice, then plays the set.
Checks: the tutorial (Seek: the tutorial and its practice scene) is played correctly within 120 s of simulated
play; the end card carries the Chimera link; every trial fits 360×640 while answering and in feedback; Echo holds
its questions back while the message plays; the set ends on the Results screen with its trials counted; the set's
log entry exists; no page errors.
Run:  tools/with-browser.sh python3 tests/e2e/ex_b_tutorial.py [echo voices seek] [--miss] [--real]
Outputs: tests/out/exb/ (screenshots, ex_b_tutorial.json). MIT licence."""
import pathlib
import sys
import time

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import ex_b_common as C  # noqa: E402

LIMIT_S = 120


def click(page, sel):
    page.locator(sel).first.click()


def tutorial(page, ex, rep, miss=False):
    """Simulated player through a keyword tutorial (Echo, Voices) or Seek's captions. Returns seconds to the end
    card (the practice is done by then for keyword exercises), or None."""
    t0, missed, last_id, shots, held = time.time(), False, None, set(), False
    while time.time() - t0 < 240:
        s = C.state(page)
        if s['route'] != 'tutorial':
            return None
        count = page.evaluate("() => (document.querySelector('.tut-count') || {}).textContent || ''")
        if s['step'] == 'end':
            dt = time.time() - t0
            rep.check(ex + ': tutorial ends with the Chimera link', page.locator('.tut-card a[href="https://discord.gg/chmr"]').count() == 1)
            C.shot(page, '%s-tutorial-end' % ex)
            click(page, '.tut-card [data-continue]')
            return dt
        if s['step'] == 'caption':
            if 'cap:' + count not in shots:
                shots.add('cap:' + count)
                C.shot(page, '%s-tutorial-%s' % (ex, count.replace(' ', '').lower()))
            if s['cont']:
                click(page, '.tut-card [data-continue]')
                time.sleep(0.15)
                continue
        elif s['trial'] == 'example' and s['next']:
            rep.check(ex + ': example fits 360×640', C.fits(page)['ok'], C.fits(page))
            C.shot(page, '%s-tutorial-example' % ex)
            click(page, '[data-next]')
            time.sleep(0.15)
            continue
        elif s['trial'] in ('listen', 'hold') and ex == 'echo' and not held:
            hidden = page.evaluate("() => { var a = document.querySelector('.trial-answer'); return !!a && getComputedStyle(a).visibility === 'hidden'; }")
            if s['mode'] == 'practice':
                held = True
                rep.check('echo: the questions stay hidden while the message plays and during the pause', hidden)
        elif s['trial'] == 'answer':
            tr = C.last_trial(page)
            if tr and tr['id'] != last_id:
                last_id = tr['id']
                fit = C.fits(page)
                rep.check(ex + ': practice trial fits 360×640 (%s)' % count, fit['ok'], fit)
                if 'ans:' + count not in shots:
                    shots.add('ans:' + count)
                    C.shot(page, '%s-tutorial-practice-%s' % (ex, count.replace(' ', '').lower()))
                picks = tr['answers']
                if miss and not missed:
                    picks = [next((w for w in o if w.lower() != a.lower()), a) for o, a in zip(tr['options'], tr['answers'])]
                    missed = True
                C.answer(page, picks)
                time.sleep(0.25)
                if miss and missed and picks != tr['answers']:
                    s2 = C.state(page)
                    rep.check(ex + ': a wrong practice answer does not advance', s2['route'] == 'tutorial' and page.locator('[data-next]').first.inner_text().strip() == 'Try again',
                              page.locator('[data-next]').first.inner_text())
                continue
        elif s['trial'] == 'feedback':
            if s['playing'] == 'auto':
                time.sleep(0.2)
                continue
            fit = C.fits(page)
            rep.check(ex + ': feedback fits 360×640 (%s)' % count, fit['ok'], fit)
            if 'fb:' + count not in shots:
                shots.add('fb:' + count)
                C.shot(page, '%s-tutorial-feedback-%s' % (ex, count.replace(' ', '').lower()))
            if s['next']:
                click(page, '[data-next]')
                time.sleep(0.15)
                continue
        time.sleep(0.12)
    return None


def seek_scene(page, ex, rep, label, wrong=False):
    """Play one Seek scene: wait for the search, drag to the voice (or away from it), tap the word. Returns peek."""
    pk = None
    for _ in range(150):
        pk = C.seek_peek(page)
        if pk and pk['phase'] == 'search':
            break
        time.sleep(0.1)
    if not pk or pk['phase'] != 'search':
        rep.check(ex + ': %s reaches the search' % label, False, pk)
        return None
    fit = C.fits(page)
    rep.check(ex + ': %s search fits 360×640' % label, fit['ok'], fit)
    to = None
    if wrong:   # stop on the far side of the field from the voice
        to = (-0.8 if pk['answer']['x'] > 0 else 0.8, 0.8 if pk['answer']['y'] < 0 else -0.8)
    C.seek_walk(page, to=to, steps=18, pause=0.02, hold_s=0.25)
    page.wait_for_function("() => { var s = ES.ex._seekScene.current; return s && s.peek().phase === 'word'; }", timeout=5000)
    fit = C.fits(page)
    rep.check(ex + ': %s word question fits 360×640' % label, fit['ok'], fit)
    C.answer(page, [pk['word']])
    page.wait_for_function("() => ES.ex._seekScene.current.peek().phase === 'feedback'", timeout=5000)
    fit = C.fits(page)
    rep.check(ex + ': %s feedback fits 360×640' % label, fit['ok'], fit)
    return pk


def run_one(browser, url, ex, rep, miss=False):
    ctx, page = C.new_page(browser, 'phone-s')
    C.boot(page, url)
    n = 3 if ex == 'seek' else 4
    C.start_set(page, ex, n)
    page.wait_for_function("() => (ES.core.router.current() || {}).name === 'tutorial'", timeout=10000)
    t0 = time.time()
    dt = tutorial(page, ex, rep, miss=miss)
    rep.check(ex + ': tutorial reaches its end card', dt is not None, dt)
    if ex == 'seek':
        page.wait_for_function("() => (ES.core.router.current() || {}).name === 'play'", timeout=10000)
        pk = seek_scene(page, ex, rep, 'practice', wrong=miss)
        if miss and pk:
            rep.check('seek: a missed practice scene offers Try again', page.locator('[data-next]').first.inner_text().strip() == 'Try again')
            click(page, '[data-next]')
            pk = seek_scene(page, ex, rep, 'practice again')
        rep.check('seek: the practice scene is found and named', page.locator('.fb-head.is-right').count() == 1)
        C.shot(page, 'seek-practice-feedback')
        dt = time.time() - t0
        click(page, '[data-next]')
    rep.check(ex + ': played correctly within %d s of simulated play' % LIMIT_S, dt is not None and dt <= LIMIT_S, '%.1f s' % (dt or -1))
    # the set
    page.wait_for_function("() => (ES.core.router.current() || {}).name === 'play'", timeout=10000)
    t1, last_id, done = time.time(), None, 0
    while time.time() - t1 < 200:
        r = C.route(page)
        if r == 'results':
            break
        if ex == 'seek':
            pk = C.seek_peek(page)
            if pk and pk['phase'] in ('preview', 'search') and not pk['practice']:
                seek_scene(page, ex, rep, 'set scene %d' % (done + 1))
                done += 1
                C.shot(page, 'seek-set-feedback-%d' % done)
                click(page, '[data-next]')
                time.sleep(0.3)
            else:
                time.sleep(0.15)
            continue
        s = C.state(page)
        if s['trial'] == 'answer':
            tr = C.last_trial(page)
            if tr and tr['id'] != last_id:
                last_id = tr['id']
                fit = C.fits(page)
                rep.check(ex + ': set trial %d fits 360×640' % (done + 1), fit['ok'], fit)
                C.shot(page, '%s-set-answer-%d' % (ex, done + 1))
                C.answer(page, tr['answers'])
                done += 1
                time.sleep(0.3)
                continue
        if s['trial'] == 'feedback' and s['next'] and s['playing'] != 'auto':
            click(page, '[data-next]')
        time.sleep(0.15)
    rep.check(ex + ': the set ends on Results', C.route(page) == 'results', C.route(page))
    C.shot(page, '%s-results' % ex)
    entry = page.evaluate("() => { var S = ES.ui.session.state(); return S && S.log.sets.length ? S.log.sets[S.log.sets.length - 1] : null; }")
    rep.check(ex + ': the set is logged with its trials', bool(entry) and entry.get('ex') == ex and entry.get('n', 0) >= n, entry and {k: entry.get(k) for k in ('ex', 'n', 'correct')})
    rows = page.evaluate("() => ES.ui.session.state().sets[0].results.length")
    rep.check(ex + ': %d trials counted in the set' % n, rows == n, rows)
    errs = C.errors(page)
    rep.check(ex + ': no page errors', not errs, errs[:4])
    ctx.close()


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    exs = args or ['echo', 'voices', 'seek']
    rep = C.Report('ex_b_tutorial' + ('_miss' if '--miss' in sys.argv else '') + ('_real' if '--real' in sys.argv else ''))
    url = C.build_page('tutorial.html', real='--real' in sys.argv)
    with sync_playwright() as p:
        b = C.launch(p)
        for ex in exs:
            run_one(b, url, ex, rep, miss='--miss' in sys.argv)
        b.close()
    return rep.done()


if __name__ == '__main__':
    sys.exit(main())
