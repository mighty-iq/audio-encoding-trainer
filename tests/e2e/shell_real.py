"""Real sessions (needs data/ and audio/ packs; skipped otherwise): the shell switches from the demo to real trials
when the planner, the audio engine and voice clips are present. Starts a session on a phone size, skips any
tutorial, plays and answers real trials (rendered by ES.audio, scored by ES.engine.flow), ends the set from the
pause sheet and checks what was logged. Errors from other owners' files are reported as warnings."""
from harness import ROOT, Checks, new_tab, file_url, wait_ready, close_sheets, wait_state, answer_current, layout, shot, preset


def run(h):
    c = Checks('real')
    if not (ROOT / 'data' / 'manifest.js').exists() or not list((ROOT / 'audio').glob('pack-*.js')):
        c.warn('no voice data yet: real-session checks skipped')
        return c
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
