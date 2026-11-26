"""A demo session end to end on a phone size, in a playtest build: tutorial (captions held ≥ 3 s with the next
action stated, a worked example, practice with Try again, ends with the Chimera link), a set where a right answer
moves on by itself and a wrong one waits for Next, results with playtest ratings, a second set, the session
summary, and what was logged."""
from harness import Checks, new_tab, file_url, wait_ready, close_sheets, wait_state, answer_current, trial_state, shot, OUT

ANSWER_IDX = "() => { const s = ES.ui.trialView.current.trial.question.slots[0]; return s.options.map(String).indexOf(String(s.answer)); }"


def index(pg):
    return pg.get_attribute('.trial', 'data-index')


def run(h):
    c = Checks('session')
    for size in ((390, 844), (1366, 768)):
        one(h, c, size)
    return c


def one(h, c, size):
    tag = f'{size[0]}x{size[1]}'
    c.ok(True, f'--- session at {tag}')
    tab = new_tab(h.browser, viewport=size, config={'testBuild': True})
    pg = tab.page
    pg.goto(file_url())
    wait_ready(pg)
    close_sheets(pg)
    c.ok(pg.locator('#pt-float').count() == 1, 'playtest build: a Note button on every screen')
    pg.click('[data-start]')

    # Tutorial: caption.
    pg.wait_for_selector('.tut [data-step="caption"]', timeout=8000)
    btn = pg.locator('[data-continue]')
    c.ok(btn.is_disabled(), 'tutorial: Continue waits while the caption is read')
    c.ok(pg.inner_text('.tut-next').startswith('Next:'), 'tutorial: the next action is stated')
    pg.wait_for_timeout(1800)
    c.ok(btn.is_disabled(), 'tutorial: still held at 1.8 s')
    pg.wait_for_function("() => { const b = document.querySelector('[data-continue]'); return b && !b.disabled; }", timeout=6000)
    btn.click()
    # Worked example.
    wait_state(pg, 'example', 15000)
    c.ok(pg.locator('.key.answer .glyph-right').count() >= 1, 'tutorial: the example marks the answer with ✓')
    notes = pg.locator('.key-note').all_inner_texts()
    c.ok(any('another voice' in n for n in notes) and len(notes) >= 2, 'tutorial: the example labels the answer and the foil type', notes)
    pg.click('[data-next]')
    # Practice: right, then wrong → Try again → right.
    pos = []
    wait_state(pg, 'answer', 15000)
    pos.append(pg.evaluate(ANSWER_IDX))
    answer_current(pg, True)
    wait_state(pg, 'feedback')
    pg.click('[data-next]')
    wait_state(pg, 'answer', 15000)
    pos.append(pg.evaluate(ANSWER_IDX))
    answer_current(pg, False)
    wait_state(pg, 'feedback')
    c.eq(pg.inner_text('[data-next]').strip(), 'Try again', 'tutorial: a wrong practice answer offers Try again')
    pg.click('[data-next]')
    wait_state(pg, 'answer', 15000)
    answer_current(pg, True)
    wait_state(pg, 'feedback')
    pg.click('[data-next]')
    c.ok(len(set(pos)) == len(pos), 'tutorial: practice answers sit in different keys', pos)
    pg.wait_for_selector('[data-step="end"]', timeout=8000)
    c.ok(pg.locator('[data-step="end"] a.chimera-link[href="https://discord.gg/chmr"]').count() == 1, 'tutorial: ends with the Chimera link')
    pg.click('[data-step="end"] [data-continue]')

    # Set 1.
    pg.wait_for_selector('.trial[data-ex="demo"] .trial-body', timeout=8000)
    c.ok(pg.locator('.trial-bar .tb-note').count() == 1, 'playtest: Note button in the trial bar')
    c.ok(pg.evaluate('ES.ui.inSet') is True, 'a set is running (invitations wait)')
    for i in range(6):
        wait_state(pg, 'answer', 15000)
        before = index(pg)
        if i == 2:
            answer_current(pg, False)
            wait_state(pg, 'feedback')
            pg.wait_for_timeout(2600)
            c.eq(trial_state(pg), 'feedback', 'a wrong answer waits for Next')
            c.eq(index(pg), before, 'no advance after a wrong answer')
            c.ok(pg.locator('.key.wrong .glyph-wrong').count() >= 1, 'feedback: ✕ glyph on the wrong pick')
            c.ok(pg.locator('.key.answer .glyph-right').count() >= 1, 'feedback: ✓ glyph on the right answer')
            c.ok(pg.inner_text('.fb-head').strip() in ('Not quite', 'Partly right'), 'feedback in words, not colour alone')
            shot(pg, f'session_feedback_wrong_{tag}')
            pg.click('[data-replay="0"]')
            pg.wait_for_function("() => !document.querySelector('.trial-body').hasAttribute('data-playing')", timeout=8000)
            c.ok(True, 'replay: target alone plays and returns')
            pg.click('[data-next]')
            pg.wait_for_function("(b) => document.querySelector('.trial').getAttribute('data-index') !== b", arg=before, timeout=4000)
            c.ok(True, 'Next moves on after a wrong answer')
        else:
            answer_current(pg, True)
            wait_state(pg, 'feedback')
            if i < 5:
                try:
                    pg.wait_for_function("(b) => { const t = document.querySelector('.trial'); return t && t.getAttribute('data-index') !== b; }", arg=before, timeout=4000)
                    ok = True
                except Exception:
                    ok = False
                c.ok(ok, f'trial {i + 1}: a right answer moves on by itself')
    pg.wait_for_selector('.results', timeout=8000)
    c.ok('of 6 right' in pg.inner_text('.results h1').replace('\n', ' '), 'results: set summary', pg.inner_text('.results h1'))
    c.eq(pg.locator('.glyph-row li').count(), 6, 'results: one glyph per trial, after the set')
    c.eq(pg.evaluate('ES.ui.inSet'), False, 'between sets: invitations may show')
    for label in ('Fun 4', 'Clarity 5', 'Difficulty 3'):
        pg.click(f'[aria-label="{label}"]')
    c.ok(pg.locator('.rating.rated').count() == 1, 'playtest: three taps saved')
    shot(pg, f'session_results_{tag}', full=True)
    pg.click('[data-next-set]')

    # Set 2: quick right answers, Next each time.
    pg.wait_for_selector('.trial .trial-body', timeout=8000)
    for i in range(6):
        wait_state(pg, 'answer', 15000)
        answer_current(pg, True)
        wait_state(pg, 'feedback')
        if pg.locator('[data-next]').count():
            try:
                pg.click('[data-next]', timeout=1500)
            except Exception:
                pass
    pg.wait_for_selector('.results', timeout=8000)
    c.ok('Finish session' in pg.inner_text('[data-next-set]'), 'last set offers Finish session')
    pg.click('[data-next-set]')
    pg.wait_for_selector('.results-done', timeout=8000)
    shot(pg, f'session_done_{tag}', full=True)
    log = pg.evaluate("ES.core.store.peek('log')")
    c.eq(len(log['sessions']), 1, 'log: one session')
    c.eq(len(log['sessions'][0]['sets']), 2, 'log: two sets')
    c.ok(log['sessions'][0]['activeMs'] > 5000, 'log: active time counted', log['sessions'][0]['activeMs'])
    c.eq(pg.evaluate("ES.core.store.peek('trials').rows.length"), 12, 'trials ring: 12 rows')
    report = pg.evaluate('ES.core.playtest.reportText()')
    for part in ('Device:', 'Frames', 'Rating', 'Set ', 'Screens:', 'Errors'):
        c.ok(part in report, f'playtest report has {part.strip()}')
    (OUT / 'playtest_report_sample.txt').write_text(report)
    pg.click('[data-home]')
    pg.wait_for_selector('.home')
    c.ok('1 session' in pg.inner_text('.week'), 'weekly ring counts the session')
    mine, other = tab.split()
    c.ok(not mine, f'{tag}: no page errors from shell files', mine[:5])
    for who, text in other:
        c.warn(f'{tag}: error from {who}: {text}')
    pg.context.close()
