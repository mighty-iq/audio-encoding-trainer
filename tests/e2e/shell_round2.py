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


def answer_keys(h, c):
    """FRESH-A #7, FRESH-B D4/D6: keys never look picked by focus or hover; keys before answers open change nothing;
    one Enter goes on after a replay."""
    tab, pg = page(h, size=(1366, 768))
    pg.click('[data-start]')
    pg.wait_for_function("() => { const v = ES.ui.trialView.current; return v && v.state() === 'listen'; }", polling=20, timeout=15000)
    pg.keyboard.press('1')
    st = pg.evaluate("""() => ({ focusKey: !!(document.activeElement && document.activeElement.closest && document.activeElement.closest('.key')),
      stops: [...document.querySelectorAll('.answer .key')].filter(k => k.tabIndex === 0).length, picked: document.querySelectorAll('.key.picked').length })""")
    c.ok(not st['focusKey'] and st['stops'] == 0 and st['picked'] == 0, 'D4: a number key while the sound plays changes nothing', st)
    wait_state(pg, 'answer', 15000)
    c.ok(pg.evaluate("document.activeElement && document.activeElement.classList.contains('answer')"),
         '#7: when answers open the panel has the focus, not a key that would look picked')
    key = pg.locator('.answer-slot[data-slot="0"] .key[data-opt="1"]')
    box = key.bounding_box()
    pg.mouse.move(box['x'] + 5, box['y'] + 5)
    bg = pg.evaluate("""() => { const k = document.querySelector('.answer-slot[data-slot="0"] .key[data-opt="1"]'), o = document.querySelector('.answer-slot[data-slot="0"] .key[data-opt="2"]');
      return [getComputedStyle(k).backgroundColor, getComputedStyle(o).backgroundColor, document.querySelector('.answer').classList.contains('hover-ok')]; }""")
    c.ok(bg[0] == bg[1] and bg[2], 'D6: hover adds no fill (only a lighter border once the pointer moves)', bg)
    pg.keyboard.press('ArrowRight')
    n_slots = pg.evaluate('ES.ui.trialView.current.trial.question.slots.length')
    key.click()
    if n_slots > 1:
        pg.locator('.answer-slot[data-slot="1"] .key[data-opt="0"]').click()
    wait_state(pg, 'feedback', 5000)
    foc = pg.evaluate("() => { const a = document.activeElement; const k = a && a.closest && a.closest('.key'); return k ? { picked: k.classList.contains('picked') } : null; }")
    c.ok(foc is None or foc['picked'], '#7: no focus ring is left on a key that was not picked', foc)
    if pg.locator('[data-next]').count() and pg.evaluate("ES.ui.trialView.current.state()") == 'feedback':
        pg.locator('[data-replay="1"]').click()
        pg.wait_for_function("() => !document.querySelector('.trial-body').hasAttribute('data-playing')", timeout=10000)
        before = pg.evaluate("String(ES.ui.trialView.current.trial.seed)")
        pg.keyboard.press('Enter')
        pg.wait_for_function("(s) => String(ES.ui.trialView.current.trial.seed) !== s", arg=before, timeout=5000)
        c.ok(True, '#7: after a replay one Enter goes to the next trial')
    errors(c, tab, 'keys')
    pg.context.close()


def exercises_list(h, c):
    """FRESH-A #4, FRESH-B C1: every exercise by name from Home; Play a set (tutorial first); Free includes Seek."""
    from harness import ROOT
    if not (ROOT / 'data' / 'manifest.js').exists():
        c.warn('no voice data: the Exercises list check is skipped')
        return
    tab, pg = page(h, profile={'v': 1, 'welcomeSeen': 1, 'tutorials': {'crowd': 1}}, real=True)
    pg.click('[data-index-link="exercises"]')
    pg.wait_for_selector('.exercises', timeout=8000)
    rows = pg.evaluate("[...document.querySelectorAll('[data-ex-row]')].map(r => r.dataset.exRow)")
    c.eq(rows, ['crowd', 'far', 'strange', 'repair', 'echo', 'seek', 'voices', 'missions'], '#4: Home → Exercises lists all eight by name')
    c.ok(pg.locator('[data-ex-row] .ex-short').count() >= 8 and pg.locator('[data-ex-row] .ex-bet').count() >= 8, '#4: each with a line on what it trains and its bet')
    shot(pg, 'round2_exercises_390', full=True)
    pg.click('[data-ex-help="repair"]')
    pg.wait_for_selector('.sheet', timeout=5000)
    c.ok(True, '#4: How it works opens the exercise\'s help')
    close_sheets(pg)
    pg.click('[data-ex-play="strange"]')
    pg.wait_for_function("() => ES.ui.session.active() && ES.core.router.current().name === 'tutorial'", timeout=15000)
    st = pg.evaluate("() => ({ sets: ES.ui.session.state().sets.map(s => s.exId), ex: ES.core.router.current().params.exId, mode: ES.ui.session.state().mode })")
    c.ok(st['sets'] == ['strange'] and st['ex'] == 'strange' and st['mode'] == 'edge', '#4: Play a set starts one Strange voices set, its tutorial first, mode unchanged', st)
    pg.evaluate("() => { ES.ui.session.abandon({ discard: true }); ES.core.router.go('settings', {}, { reset: true }); }")
    pg.check('[data-mode="free"]')
    pg.wait_for_selector('[data-free-pick]', timeout=5000)
    c.ok(pg.locator('[data-free-ex="seek"]').count() == 1, 'C1: the Free picker includes Seek')
    errors(c, tab, 'exercises')
    pg.context.close()


def trial_screen(h, c):
    """A4 heading, A2 live region, P14 pause count, C6 the dial value in the bar at 360 px, P9 one invitation card."""
    tab, pg = page(h, size=(360, 640))
    pg.click('[data-start]')
    pg.wait_for_function("() => { const v = ES.ui.trialView.current; return v && v.state() === 'listen'; }", polling=20, timeout=15000)
    live_listen = pg.evaluate("() => (document.querySelector('.trial-live') || {}).textContent || ''")
    c.ok('Listen' not in live_listen and not pg.evaluate("!!document.querySelector('.trial-status[aria-live]')"),
         'A2: "Listen…" is not announced while the sound plays', live_listen)
    wait_state(pg, 'answer', 15000)
    c.ok('Answer now' in pg.inner_text('.trial-live'), 'A2: the live region says when to answer')
    c.ok(pg.evaluate("(document.querySelector('.trial h1.sr-only') || {}).textContent || ''").endswith('trial 1 of 6'), 'A4: an sr-only heading names the trial')
    val = pg.evaluate("""() => { const v = document.querySelector('.tb-val'), bar = document.querySelector('.trial-bar').getBoundingClientRect(), r = v && v.getBoundingClientRect();
      return v ? { text: v.textContent, cut: v.scrollWidth > v.clientWidth + 1, inside: r.right <= bar.right && r.left >= bar.left } : null; }""")
    c.ok(val and val['text'] and not val['cut'] and val['inside'], 'C6: the dial value is shown whole in the bar at 360 px', val)
    answer_current(pg, False)
    wait_state(pg, 'feedback', 8000)
    c.ok(len(pg.inner_text('.trial-live')) > 3, 'A2: the verdict and feedback go to the live region')
    pg.click('[data-pause]')
    pg.wait_for_selector('.sheet-pause', timeout=5000)
    c.ok('Trial 1 of 6' in pg.inner_text('.sheet-pause'), 'P14: pausing in trial 1\'s feedback says trial 1', pg.inner_text('.sheet-pause'))
    pg.click('[data-end-set]')
    pg.wait_for_selector('.results', timeout=8000)
    pg.evaluate("""() => { const inv = document.querySelector('.invites'); ES.core.chimera.invite('pb', { title: 'New personal best', detail: 'a' });
      ES.core.chimera.invite('milestone', { title: 'Milestone reached', detail: 'b' }); ES.core.chimera.takeInto(inv);
      ES.core.chimera.invite('milestone', { el: inv, title: 'Another', detail: 'c' }); }""")
    c.eq(pg.locator('.results .chimera-card').count(), 1, 'P9: one invitation card per results screen, the others merged into it')
    errors(c, tab, 'trial screen')
    pg.context.close()


def modes(h, c):
    """P6 Focus without a target; A6 Settings choices as toggle buttons; P4 Path shows its place; P3 one formatter."""
    from harness import ROOT
    real = (ROOT / 'data' / 'manifest.js').exists()
    prof = {'v': 1, 'welcomeSeen': 1, 'tutorials': {k: 1 for k in ('demo', 'crowd', 'far')}, 'settings': {'mode': 'focus'}}
    tab, pg = page(h, profile=prof, real=real)
    if real:
        c.ok(pg.locator('[data-focus-note]').count() == 1, 'P6: Home says Focus has no target yet and trains like Edge')
    pg.evaluate("() => { ES.core.router.go('settings', {}, { reset: true }); }")
    c.ok(pg.locator('[data-focus-aim="none"]').count() == 1 and pg.locator('[data-focus-choose]').count() == 1, 'P6: Settings shows what Focus aims at, with Choose')
    c.ok(pg.evaluate("[...document.querySelectorAll('.seg-btn')].every(b => b.hasAttribute('aria-pressed') && !b.hasAttribute('role'))"), 'A6: Settings choices are toggle buttons (aria-pressed)')
    lv = pg.evaluate("""() => { const d = (ES.engine.dials.crowd || []).find(x => x.kind === 'ord'); if (!d) return null;
      return { top: ES.ui.fmt.level('crowd', d.id, d.max + 1.4), near: ES.ui.fmt.level('crowd', d.id, d.max + 0.57), last: d.levels[d.max] }; }""")
    c.ok(lv and lv['top'] == lv['last'] + ' (top)' and lv['near'] == lv['last'], 'P3: an estimate floors to the level reached; past the last level it reads "(top)", never a raw number', lv)
    if real:
        pg.evaluate("() => { ES.core.store.update('profile', r => { r.settings.mode = 'path'; }); ES.ui.session.start({ sets: [{ exId: 'crowd', trials: 3 }] }); }")
        wait_state(pg, 'answer', 45000)
        bar = pg.inner_text('.trial-bar')
        c.ok('Path step' in bar and 'of' in bar, 'P4: Path mode shows its stage and step in the bar', bar)
        for _ in range(3):
            answer_current(pg, True)
            wait_state(pg, 'feedback', 8000)
            pg.click('[data-next]')
            try:
                wait_state(pg, 'answer', 20000)
            except Exception:
                break
        pg.wait_for_selector('.results', timeout=15000)
        c.ok(pg.locator('.path-card').count() == 1 and 'path · ' in pg.inner_text('.path-card').lower(), 'P4: Results shows the path place', pg.inner_text('.path-card') if pg.locator('.path-card').count() else '')
    errors(c, tab, 'modes')
    pg.context.close()


def run(h):
    c = Checks('round2')
    for fn in (tutorial_cap, set_skips, end_set_first, answer_keys, exercises_list, trial_screen, modes):
        print('  round2:', fn.__name__, flush=True)
        try:
            fn(h, c)
        except Exception as e:
            c.ok(False, f'{fn.__name__} crashed', repr(e)[:400])
    return c
