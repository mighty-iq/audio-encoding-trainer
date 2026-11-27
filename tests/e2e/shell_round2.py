"""Shell round 2 (FRESH-A, FRESH-B, RV-play-a11y): failures and counting, tutorial Continue, the back stack, answer
keys and the other items of the lead's list. Demo sessions unless a case needs real exercises."""
from harness import Checks, new_tab, file_url, wait_ready, close_sheets, wait_state, answer_current, shot, preset

DONE = {'v': 1, 'welcomeSeen': 1, 'tutorials': {'demo': 1}}
REFUSE = "() => { window.__render = ES.ui.demo.render; ES.ui.demo.render = function () { return Promise.reject(new Error('test: refused')); }; }"
RESTORE = "() => { if (window.__render) ES.ui.demo.render = window.__render; }"
SESSIONS = """() => { const l = ES.core.store.peek('log').sessions || [];
  return { n: l.length, answered: l.map(s => s.answered), today: ES.ui.w.sessionsToday(), week: ES.ui.w.sessionsThisWeek() }; }"""


def page(h, profile=None, size=(390, 844), real=False, config=None):
    tab = new_tab(h.browser, viewport=size, real=real, config=config, init=preset({'profile': profile or DONE}))
    pg = tab.page
    pg.goto(file_url(), timeout=90000)
    wait_ready(pg, 60000)
    close_sheets(pg)
    return tab, pg


def route(pg):
    return pg.evaluate("ES.core.router.current().name")


def errors(c, tab, tag):
    mine, other = tab.split()
    mine = [m for m in mine if 'test: ' not in m[1]]
    c.ok(not mine, f'{tag}: no page errors from shell files', mine[:5])
    for w, t in other:
        c.warn(f'{tag}: error from {w}: {t}')


def tutorial_cap(h, c):
    """P1: a tutorial step whose sound cannot be prepared is passed over after two tries, with a plain message."""
    tab, pg = page(h, profile={'v': 1, 'welcomeSeen': 1})
    pg.evaluate(REFUSE)
    pg.click('[data-start]')
    pg.wait_for_selector('.tut [data-step="caption"]', timeout=8000)
    pg.click('[data-continue]')
    skips = 0
    for _ in range(6):
        try:
            pg.wait_for_selector('[data-skip], [data-step="failed"]', timeout=8000)
        except Exception:
            break
        if pg.locator('[data-step="failed"]').count():
            break
        pg.click('[data-skip]')
        skips += 1
    c.eq(skips, 2, 'P1: a failing tutorial step allows two tries')
    c.ok(pg.locator('[data-step="failed"]').count() == 1 and 'could not be prepared' in pg.inner_text('[data-step="failed"]'),
         'P1: then the tutorial says so and moves on')
    shot(pg, 'round2_tutorial_step_passed_over_390')
    pg.evaluate(RESTORE)
    pg.click('[data-step="failed"] [data-continue]')
    pg.wait_for_function("() => !document.querySelector('[data-step=\"failed\"]')", timeout=5000)
    c.ok(True, 'P1: Continue goes on to the next step')
    errors(c, tab, 'P1')
    pg.context.close()


def set_skips(h, c):
    """P16: a set whose sounds cannot be prepared is passed over with the reason on screen, and the next set plays."""
    tab, pg = page(h)
    pg.evaluate(REFUSE)
    pg.click('[data-start]')
    for _ in range(4):
        wait_state(pg, 'error', 15000)
        pg.click('[data-skip]')
        pg.wait_for_timeout(120)
    pg.wait_for_selector('[data-skipped="sounds"]', timeout=8000)
    c.ok('could not be prepared' in pg.inner_text('[data-skip-reason]'), 'P16: the screen says the sounds could not be prepared')
    c.ok(ES_ACTIVE(pg), 'P16: the session goes on')
    shot(pg, 'round2_set_passed_over_390')
    pg.evaluate(RESTORE)
    pg.click('[data-next-set]')
    wait_state(pg, 'answer', 15000)
    c.eq(pg.evaluate("ES.ui.session.currentSet().index"), 1, 'P16: Next set plays the second set')
    answer_current(pg, True)
    wait_state(pg, 'feedback', 8000)
    pg.click('[data-pause]')
    pg.click('[data-end-set]')
    pg.wait_for_selector('.results', timeout=8000)
    pg.click('[data-next-set]')                      # the last set: Finish session
    pg.wait_for_selector('.results-done', timeout=8000)
    st = pg.evaluate(SESSIONS)
    c.ok(st['n'] == 1 and st['answered'] == [1], 'one answered trial: the session is logged with answered = 1', st)
    errors(c, tab, 'P16')
    pg.context.close()


def ES_ACTIVE(pg):
    return pg.evaluate("ES.ui.session.active()")


def end_set_first(h, c):
    """P7: End set before the first answer ends only that set; an empty session is never logged or counted."""
    tab, pg = page(h)
    pg.click('[data-start]')
    wait_state(pg, ['loading', 'listen', 'answer'], 15000)
    pg.click('[data-pause]')
    pg.click('[data-end-set]')
    pg.wait_for_selector('[data-skipped="ended"]', timeout=8000)
    c.ok(ES_ACTIVE(pg) and 'before the first answer' in pg.inner_text('[data-skip-reason]'), 'P7: End set before an answer passes over that set only')
    pg.click('[data-next-set]')
    wait_state(pg, ['loading', 'listen', 'answer'], 15000)
    c.eq(pg.evaluate("ES.ui.session.currentSet().index"), 1, 'P7: the next set starts')
    pg.click('[data-pause]')
    pg.click('[data-end-set]')
    pg.wait_for_selector('[data-skipped="ended"]', timeout=8000)
    pg.click('[data-next-set]')                      # Finish session
    pg.wait_for_selector('.results-done', timeout=8000)
    c.ok(pg.locator('[data-empty-session]').count() == 1, 'FRESH-A #6: Session done says nothing was answered, so nothing is logged')
    st = pg.evaluate(SESSIONS)
    c.ok(st['n'] == 0 and st['today'] == 0 and st['week'] == 0, 'FRESH-A #6: an empty session is neither logged nor counted', st)
    pg.evaluate("() => { ES.core.router.go('home', {}, { reset: true }); }")
    c.eq(pg.locator('.sleep-note').count(), 0, 'FRESH-A #6: no "sessions today" note after empty sessions')
    errors(c, tab, 'P7')
    pg.context.close()


def run(h):
    c = Checks('round2')
    for fn in (tutorial_cap, set_skips, end_set_first):
        print('  round2:', fn.__name__, flush=True)
        try:
            fn(h, c)
        except Exception as e:
            c.ok(False, f'{fn.__name__} crashed', repr(e)[:400])
    return c
