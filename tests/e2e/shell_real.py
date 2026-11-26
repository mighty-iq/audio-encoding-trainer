"""Real sessions (needs data/ and audio/ packs; skipped otherwise): the shell switches from the demo to real trials
when the planner, the audio engine and voice clips are present. Starts a session on a phone size, skips any
tutorial, plays and answers real trials (rendered by ES.audio, scored by ES.engine.flow), ends the set from the
pause sheet and checks what was logged. Errors from other owners' files are reported as warnings."""
from harness import ROOT, Checks, new_tab, file_url, wait_ready, close_sheets, wait_state, answer_current, layout, shot, preset


def tutorial_then_set(h, c, ex='crowd'):
    """A real exercise's tutorial with practice answers, then its set: practice is scored without touching the
    learner or the set, and "Start the set" lands on the play route with the set's counter at zero."""
    import time
    tab = new_tab(h.browser, viewport=(360, 640), real=True, touch=True, init=preset({'profile': {'v': 1, 'welcomeSeen': 1}}))
    pg = tab.page
    pg.goto(file_url())
    wait_ready(pg)
    close_sheets(pg)
    pg.evaluate("(ex) => { ES.engine.planner.session = function () { return { sets: [{ exId: ex, trials: 3 }] }; }; ES.ui.session.start(); }", ex)
    pg.wait_for_function("() => ES.core.router.current() && ES.core.router.current().name === 'tutorial'", timeout=10000)
    practiced, t0 = 0, time.time()
    while time.time() - t0 < 150:
        st = pg.evaluate("""() => { const b = document.querySelector('.trial-body'); return { route: ES.core.router.current().name,
          state: b ? b.dataset.state : null, mode: b ? b.dataset.mode : null, playing: b ? b.getAttribute('data-playing') : null,
          cont: !!document.querySelector('[data-continue]:not([disabled])'), next: !!document.querySelector('[data-next]:not([disabled])') }; }""")
        if st['route'] != 'tutorial':
            break
        if st['cont']:
            pg.click('[data-continue]:not([disabled])')
        elif st['state'] == 'answer':
            answer_current(pg, True)
            practiced += 1
        elif st['state'] in ('feedback', 'example') and st['next'] and st['playing'] != 'auto':
            pg.click('[data-next]')
        pg.wait_for_timeout(250)
    c.ok(practiced >= 1, f'{ex} tutorial: practice trials were answered', practiced)
    try:
        pg.wait_for_function("() => ES.core.router.current().name === 'play'", timeout=8000)
        ok = True
    except Exception:
        ok = False
    c.ok(ok, f'{ex} tutorial: "Start the set" lands on the play route', pg.evaluate("ES.core.router.current().name"))
    if ok:
        info = pg.evaluate("() => { const s = ES.ui.session.currentSet(); return { results: s.results.length, i: s.sc ? s.sc.i : null, n: s.n }; }")
        c.ok(info['results'] == 0 and info['i'] == 0, f'{ex} tutorial: practice did not count toward the set', info)
        done = 0
        for _ in range(3):
            try:
                wait_state(pg, 'answer', 25000)
            except Exception:
                break
            answer_current(pg, True)
            wait_state(pg, 'feedback', 8000)
            done += 1
            pg.click('[data-next]')
        c.eq(done, 3, f'{ex} tutorial: the three set trials play after it')
    mine, other = tab.split()
    c.ok(not mine, f'{ex} tutorial: no page errors from shell files', mine[:5])
    for who, text in other:
        c.warn(f'{ex} tutorial: error from {who}: {text}')
    pg.context.close()


def run(h):
    c = Checks('real')
    if not (ROOT / 'data' / 'manifest.js').exists() or not list((ROOT / 'audio').glob('pack-*.js')):
        c.warn('no voice data yet: real-session checks skipped')
        return c
    tutorial_then_set(h, c, 'crowd')
    for (w, ht) in ((390, 844), (360, 640)):
        tag = f'{w}x{ht}'
        tab = new_tab(h.browser, viewport=(w, ht), real=True, touch=True, init=preset({'profile': {'v': 1, 'welcomeSeen': 1}}))
        pg = tab.page
        pg.goto(file_url())
        wait_ready(pg)
        close_sheets(pg)
        c.ok(pg.evaluate('ES.ui.session.realAvailable()'), f'{tag}: real sessions are available')
        pg.click('[data-start]')
        pg.wait_for_function("() => ES.ui.session.active()", timeout=8000)
        c.eq(pg.evaluate('ES.ui.session.state().demo'), False, f'{tag}: the session is real, not the demo')
        plan = pg.evaluate("ES.ui.session.state().sets.map(s => s.exId)")
        c.ok(len(plan) >= 1, f'{tag}: the planner made sets', plan)
        answered = 0
        for _ in range(4):
            for _ in range(3):   # a tutorial or a set intro may come first
                if pg.locator('[data-skip-tutorial]').count():
                    pg.click('[data-skip-tutorial]')
                if pg.locator('[data-intro-start]').count():
                    pg.click('[data-intro-start]')
                pg.wait_for_timeout(200)
            try:
                wait_state(pg, ['answer', 'error'], 25000)
            except Exception as e:
                c.ok(False, f'{tag}: a real trial reaches the answer state', str(e)[:200])
                break
            st = pg.evaluate("document.querySelector('.trial-body').dataset.state")
            if st == 'error':
                c.ok(False, f'{tag}: the trial sound renders', pg.inner_text('.trial-status'))
                pg.click('[data-skip]')
                continue
            if answered == 0:
                L = layout(pg)
                c.ok(L['sh'] <= L['ih'] and L['sw'] <= L['iw'], f'{tag}: a real trial fits the screen', L)
                shot(pg, f'real_trial_{tag}')
            answer_current(pg, answered % 2 == 0)
            wait_state(pg, 'feedback', 8000)
            if answered == 1:
                shot(pg, f'real_feedback_{tag}')
            answered += 1
            pg.click('[data-next]')
        c.ok(answered >= 3, f'{tag}: real trials play and score', answered)
        pg.click('[data-pause]')
        pg.click('[data-end-set]')
        pg.wait_for_selector('.results', timeout=8000)
        shot(pg, f'real_results_{tag}', full=True)
        log = pg.evaluate("ES.core.store.peek('log').sessions.slice(-1)[0]")
        c.ok(log and log['sets'] and log['sets'][0]['ex'] == plan[0], f'{tag}: the set is logged with its exercise', log and log['sets'])
        c.ok(pg.evaluate("Object.keys(ES.core.store.peek('learner').dials || {}).length") >= 0, f'{tag}: learner record readable')
        mine, other = tab.split()
        c.ok(not mine, f'{tag}: no page errors from shell files', mine[:5])
        for who, text in other:
            c.warn(f'{tag}: error from {who}: {text}')
        pg.context.close()
    return c
