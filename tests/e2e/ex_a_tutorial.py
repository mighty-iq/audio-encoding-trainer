#!/usr/bin/env python3
"""exA browser test: a fresh profile goes Home → Start → the exercise's tutorial → the first set, for Crowd, Far,
Strange voices and Repair, at 360×640 (light). A simulated player taps Continue as soon as it is enabled, answers
every practice trial correctly (except one deliberate miss on the first practice when --miss is given, to check
that a wrong answer does not advance), listens to automatic replays after a miss, then plays the set's trials.
Checks: the tutorial ends (Chimera link shown) within 120 s of simulated play; every practice and set trial gets
the right answer accepted; trials need no scrolling at 360×640 while answering and in feedback; no page errors.
Run:  tools/with-browser.sh python3 tests/e2e/ex_a_tutorial.py [crowd far ...] [--miss] [--real]
Outputs: tests/out/exa/ (screenshots, ex_a_tutorial.json). MIT licence."""
import pathlib
import sys
import time

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import ex_a_common as C  # noqa: E402

LIMIT_S = 120


def click(page, sel):
    page.locator(sel).first.click()


def play_tutorial(page, ex, rep, miss=False):
    """Simulated player through the tutorial. Returns seconds to the end card, or None."""
    t0, seen, missed, last_id, shots = time.time(), [], False, None, set()
    practice_after_miss = None
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
                seen.append(('caption', count))
                time.sleep(0.15)
                continue
        elif s['trial'] == 'example' and s['next']:
            if 'ex:' + count not in shots:
                shots.add('ex:' + count)
                rep.check(ex + ': example fits 360×640', C.fits(page)['ok'], C.fits(page))
                C.shot(page, '%s-tutorial-example' % ex)
            click(page, '[data-next]')
            seen.append(('demo', count))
            time.sleep(0.15)
            continue
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
                    picks = [next((w for w in o if w != a), a) for o, a in zip(tr['options'], tr['answers'])]
                    missed = True
                    practice_after_miss = count
                C.answer(page, picks)
                seen.append(('practice', count, picks == tr['answers']))
                time.sleep(0.2)
                continue
        elif s['trial'] == 'feedback':
            ok_head = page.evaluate("() => !!document.querySelector('.fb-head.is-right')")
            if s['playing'] == 'auto':     # a real player listens to the replays after a miss
                time.sleep(0.2)
                continue
            if 'fb:' + count not in shots:
                shots.add('fb:' + count)
                fit = C.fits(page)
                rep.check(ex + ': feedback fits 360×640 (%s)' % count, fit['ok'], fit)
                C.shot(page, '%s-tutorial-feedback-%s' % (ex, count.replace(' ', '').lower()))
            if s['next']:
                was = count
                click(page, '[data-next]')
                time.sleep(0.3)
                if practice_after_miss == was and not ok_head:
                    now = page.evaluate("() => (document.querySelector('.tut-count') || {}).textContent || ''")
                    rep.check(ex + ': a wrong practice answer does not advance (shell runner)', now == was, 'after a miss: %s → %s' % (was, now))
                    practice_after_miss = None
                continue
        time.sleep(0.1)
    return None


def play_set(page, ex, rep, n):
    """Answer the set's trials correctly; the right answer must be accepted each time."""
    done, last_id, t0 = 0, None, time.time()
    while done < n and time.time() - t0 < 120:
        s = C.state(page)
        if s['route'] != 'play':
            break
        if s['trial'] == 'answer':
            tr = C.last_trial(page)
            if tr and tr['id'] != last_id:
                last_id = tr['id']
                fit = C.fits(page)
                rep.check(ex + ': set trial %d fits 360×640' % (done + 1), fit['ok'], fit)
                if done == 0:
                    C.shot(page, '%s-set-answer' % ex)
                C.answer(page, tr['answers'])
                time.sleep(0.25)
                right = page.evaluate("() => !!document.querySelector('.fb-head.is-right')")
                rep.check(ex + ': set trial %d right answer accepted' % (done + 1), right, tr['prompt'])
                if done == 0:
                    C.shot(page, '%s-set-feedback' % ex)
                done += 1
                continue
        if s['trial'] == 'feedback' and s['next'] and s['playing'] != 'auto':
            time.sleep(0.3)
        time.sleep(0.1)
    return done


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    exs = args or C.EXERCISES
    miss = '--miss' in sys.argv
    url, missing = C.build_page(real='--real' in sys.argv)
    rep = C.Report('ex_a_tutorial')
    if missing:
        print('note: index.html does not list', missing, '- the test page adds them')
    with sync_playwright() as p:
        b = C.launch(p)
        for ex in exs:
            ctx, page = C.new_page(b, 'phone-s', 'light')
            C.boot(page, url)
            C.start_set(page, ex, 3)
            page.wait_for_function("() => ES.core.router.current() && ES.core.router.current().name === 'tutorial'", timeout=10000)
            dt = play_tutorial(page, ex, rep, miss=miss)
            rep.check(ex + ': tutorial finished in ≤ %d s of simulated play' % LIMIT_S, dt is not None and dt <= LIMIT_S,
                      'n/a' if dt is None else '%.1f s' % dt)
            try:
                page.wait_for_function("() => ES.core.router.current().name === 'play'", timeout=8000)
                n = play_set(page, ex, rep, 3)
                rep.check(ex + ': set trials played after the tutorial', n == 3, n)
            except Exception as e:  # noqa: BLE001
                rep.check(ex + ': play screen after the tutorial', False, str(e)[:200])
            errs = [e for e in C.errors(page) if 'favicon' not in e]
            rep.check(ex + ': no page errors', not errs, errs[:3])
            ctx.close()
        b.close()
    return rep.done()


if __name__ == '__main__':
    sys.exit(main())
