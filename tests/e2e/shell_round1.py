"""Fix round 1, shell part (RV-code H1, H2, M5, M6, M7, M8, M11, L1, L2, L7; RV-claims C02, C06). Each check was
written to fail on the snapshot before the fixes and to pass after them. Demo sessions cover the trial-view and
session rules; real sessions (need data/ and audio/, skipped otherwise) cover the wiring to ES.engine.flow."""
import json
import time

from harness import ROOT, Checks, new_tab, file_url, wait_ready, close_sheets, wait_state, answer_current, shot, preset

DONE = {k: 1 for k in ('demo', 'crowd', 'far', 'strange', 'repair', 'echo', 'voices', 'seek')}
PROFILE = {'v': 1, 'welcomeSeen': 1, 'tutorials': DONE}
CUR = "() => { const v = ES.ui.trialView.current; return v ? { state: v.state(), seed: String(v.trial.seed), id: v.trial.id || null } : null; }"
SET = """() => { const s = ES.ui.session.currentSet(); return s ? { results: s.results.length, n: s.n, replacements: s.replacements || 0,
  i: s.sc ? s.sc.i : null, scn: s.sc ? s.sc.n : null, replaced: s.sc ? s.sc.replaced : null, finished: !!s.finished } : null; }"""
LEARNER = "() => { const s = ES.engine.learner.state; return JSON.stringify({ d: s.dials, n: s.n, r: s.recent, e: s.edge, c: s.cond, b: s.best }); }"


def real_data():
    return (ROOT / 'data' / 'manifest.js').exists() and bool(list((ROOT / 'audio').glob('pack-*.js')))


def page(h, real=False, size=(390, 844), config=None, profile=None, context=None, init=''):
    tab = new_tab(h.browser, viewport=size, real=real, config=config, context=context,
                  init=None if context else preset({'profile': profile or PROFILE}) + init)
    pg = tab.page
    pg.goto(file_url(), timeout=90000)
    wait_ready(pg, 60000)
    close_sheets(pg)
    return tab, pg


def start_sets(pg, sets, extra=None):
    opts = dict(extra or {})
    opts['sets'] = sets
    pg.evaluate("(o) => { ES.ui.session.start(o); }", opts)
    pg.wait_for_function("() => ES.ui.session.active() && ES.core.router.current().name === 'play'", timeout=30000)


def play_one(pg, right=True, timeout=45000):
    wait_state(pg, 'answer', timeout)
    answer_current(pg, right)
    wait_state(pg, 'feedback', 8000)
    pg.click('[data-next]')


def route(pg):
    return pg.evaluate("ES.core.router.current().name")


def errors(c, tab, tag, expect=None):
    mine, other = tab.split()
    if expect:                       # an error the case provokes on purpose
        mine = [m for m in mine if expect not in m[1]]
    c.ok(not mine, f'{tag}: no page errors from shell files', mine[:5])
    for w, t in other:
        c.warn(f'{tag}: error from {w}: {t}')


def pause_in(pg, state, timeout=15000):
    """Pause the running trial view the moment it is in `state`."""
    pg.wait_for_function("(st) => { const v = ES.ui.trialView.current; if (v && v.state() === st) { v.pause(); return true; } return false; }",
                         arg=state, polling=20, timeout=timeout)


# ---- H2: a sound that never played is not a heard trial
def h2_demo(h, c):
    tab, pg = page(h)
    pg.evaluate("() => { window.__ctx = ES.ui.sound.ctx; ES.ui.sound.ctx = function () { return { state: 'suspended', resume: function () {} }; }; }")
    pg.click('[data-start]')
    try:
        wait_state(pg, ['nosound', 'answer'], 10000)
    except Exception:
        pass
    st = pg.evaluate(CUR)
    c.eq(st and st['state'], 'nosound', 'H2 demo: a play with a suspended context shows the no-sound state, not the answer panel')
    c.ok(pg.locator('[data-retry]').count() == 1, 'H2 demo: a "Play the sound again" button')
    c.eq(pg.locator('.answer-slot .key[aria-disabled="false"]').count(), 0, 'H2 demo: no answer key can be tapped')
    c.eq(pg.evaluate(SET)['results'], 0, 'H2 demo: nothing was recorded')
    pg.evaluate("() => { ES.ui.sound.ctx = window.__ctx; }")
    if pg.locator('[data-retry]').count():
        pg.click('[data-retry]')
        play_one(pg)
        c.eq(pg.evaluate(SET)['results'], 1, 'H2 demo: after the retry the trial plays and counts once')
    errors(c, tab, 'H2 demo')
    pg.context.close()


def h2_real(h, c):
    tab, pg = page(h, real=True)
    before = pg.evaluate(LEARNER)
    pg.evaluate("() => { const A = ES.audio.ctx; window.__st = A.state; window.__un = A.unlock; A.state = function () { return 'suspended'; }; A.unlock = function () { return Promise.resolve(false); }; }")
    start_sets(pg, [{'exId': 'crowd', 'trials': 3}])
    for _ in range(3):                    # a trial whose sound cannot be prepared is skipped (data errors are not H2)
        try:
            wait_state(pg, ['nosound', 'answer', 'error'], 45000)
        except Exception:
            break
        if pg.evaluate(CUR)['state'] != 'error':
            break
        c.warn('H2 real: a trial could not be prepared: ' + pg.inner_text('.trial-status')[:120])
        pg.click('[data-skip]')
    st = pg.evaluate(CUR)
    c.eq(st and st['state'], 'nosound', 'H2 real: a suspended context that cannot resume shows the no-sound state')
    s = pg.evaluate(SET)
    c.ok(s['results'] == 0 and s['i'] == 0, 'H2 real: the trial is not scored and the flow did not advance', s)
    c.eq(pg.evaluate(LEARNER), before, 'H2 real: the learner did not move')
    pg.evaluate("() => { const A = ES.audio.ctx; A.state = window.__st; A.unlock = window.__un; }")
    if pg.locator('[data-retry]').count():
        pg.click('[data-retry]')
        play_one(pg)
        s = pg.evaluate(SET)
        c.ok(s['results'] == 1 and s['i'] == 1, 'H2 real: after the retry the same trial plays and is scored once', s)
    errors(c, tab, 'H2 real')
    pg.context.close()


# ---- M7: a second pause during the stimulus voids the trial; a new trial replaces it
def m7(h, c):
    tab, pg = page(h)
    pg.click('[data-start]')
    first = None
    pause_in(pg, 'listen')
    first = pg.evaluate(CUR)
    c.eq(first['state'], 'paused', 'M7: a pause while the stimulus plays stops it')
    pg.evaluate("() => { ES.ui.trialView.current.resume(); }")
    pause_in(pg, 'listen')
    c.ok(pg.evaluate("ES.ui.trialView.current.voided()"), 'M7: the second pause during the stimulus voids the trial')
    pg.evaluate("() => { ES.ui.trialView.current.resume(); }")
    pg.wait_for_function("(seed) => { const v = ES.ui.trialView.current; return v && String(v.trial.seed) !== seed; }", arg=first['seed'], timeout=8000)
    s = pg.evaluate(SET)
    c.ok(s['results'] == 0 and s['replacements'] == 1, 'M7: the voided trial is replaced by a new one and charged nothing', s)
    play_one(pg)
    c.eq(pg.evaluate(SET)['results'], 1, 'M7: the replacement plays and counts')
    errors(c, tab, 'M7')
    pg.context.close()


# ---- M6: a skipped trial is replaced by a NEW trial; past three replacements the set ends as partial
def m6(h, c, real=False):
    tag = 'M6 real' if real else 'M6 demo'
    tab, pg = page(h, real=real)
    if real:
        start_sets(pg, [{'exId': 'crowd', 'trials': 4}])
    else:
        pg.click('[data-start]')
    wait_state(pg, 'answer', 25000)
    answer_current(pg, False)             # a miss waits for Next, so the stub is in place before the next trial
    wait_state(pg, 'feedback', 8000)
    if real:
        pg.evaluate("() => { window.__render = ES.audio.render; ES.audio.render = function () { return Promise.reject(new Error('test: render refused')); }; }")
    else:
        pg.evaluate("() => { window.__render = ES.ui.demo.render; ES.ui.demo.render = function () { return Promise.reject(new Error('test: render refused')); }; }")
    pg.click('[data-next]')
    seeds = []
    for k in range(4):
        try:
            wait_state(pg, 'error', 20000)
        except Exception:
            break
        cur = pg.evaluate(CUR)
        seeds.append(cur['id'] if real else cur['seed'])
        pg.click('[data-skip]')
        pg.wait_for_timeout(150)
    c.ok(len(set(seeds)) == len(seeds), f'{tag}: every skipped trial is replaced by a new trial', seeds)
    c.eq(len(seeds), 4, f'{tag}: three replacements are allowed, the fourth skip ends the set')
    try:
        pg.wait_for_function("() => ES.core.router.current().name === 'results'", timeout=8000)
    except Exception:
        pass
    c.eq(route(pg), 'results', f'{tag}: the set ends after too many replacements')
    entry = pg.evaluate("() => { const l = ES.core.store.peek('log').sessions; const s = l[l.length - 1]; return s && s.sets[s.sets.length - 1]; }")
    c.ok(entry and entry.get('partial') is True and entry.get('n') == 1, f'{tag}: the set is logged as partial with its one answered trial', entry)
    c.ok(pg.locator('[data-partial]').count() == 1, f'{tag}: Results says the set is partial')
    if real:
        c.ok(entry and entry.get('ex') == 'crowd', f'{tag}: the partial set keeps its exercise (no demo tones)', entry)
    errors(c, tab, tag, expect='render refused')
    pg.context.close()


# ---- M11: a session survives a reload; "End set" with fewer than half answered is partial
# Read at the start of every document: did the stored session reach this page? Under heavy CPU load the headless
# browser has lost a page's localStorage writes across a reload (the record was there before; only Delete everything
# removes keys): the session must then come back from the tab's own sessionStorage copy, and a warning says so. It
# has also hung the reload itself (an idle new renderer that never commits): such an attempt is repeated, up to
# three attempts, with a warning.
PRE = "window.__pre = (function () { try { return localStorage.getItem('earshot.v1.session') ? 'kept' : 'none'; } catch (e) { return 'blocked'; } })();"


def m11(h, c, real=False, drop=False):
    for attempt in (1, 2, 3):
        sub = Checks(c.suite if hasattr(c, 'suite') else 'round1')
        try:
            out = m11_once(h, sub, real, last=attempt == 3, drop=drop)
        except Exception as e:
            sub.ok(False, f'm11 {"real" if real else "demo"} crashed', repr(e)[:300])
            out = None
        if out == 'retry':
            c.warn(sub.warnings[-1] if sub.warnings else 'M11: the test browser lost the reload; repeated')
            continue
        c.items.extend(sub.items)
        c.warnings.extend(sub.warnings)
        return


def m11_drop(h, c):
    """The browser loses the page's last localStorage writes across a reload: the tab's own copy restores it."""
    m11(h, c, drop=True)


def m11_once(h, c, real=False, last=True, drop=False):
    tag = ('M11 real' if real else 'M11 demo') + (' (localStorage lost)' if drop else '')
    tab, pg = page(h, real=real, init=PRE)
    if real:
        start_sets(pg, [{'exId': 'crowd', 'trials': 8}])
    else:
        pg.click('[data-start]')
    play_one(pg, True)
    play_one(pg, False)
    wait_state(pg, ['loading', 'listen', 'answer'], 20000)
    sid = pg.evaluate("ES.ui.session.state().id")
    c.ok(pg.evaluate("!!localStorage.getItem('earshot.v1.session')"), f'{tag}: the session is stored before the reload')
    if drop:
        pg.evaluate("() => { localStorage.removeItem('earshot.v1.session'); }")
    try:
        pg.reload(wait_until='domcontentloaded', timeout=60000)
        wait_ready(pg, 60000)
    except Exception as e:
        if not last:
            c.warn(f'{tag}: the test browser did not finish the reload ({repr(e)[:80]}); repeated')
            pg.context.close()
            return 'retry'
        raise
    if pg.evaluate("window.__pre") == 'none' and not drop:   # the tab's own copy must still bring the session back
        c.warn(f'{tag}: the test browser dropped the page\'s localStorage writes across the reload (the tab copy is checked)')
    close_sheets(pg)
    c.eq(route(pg), 'home', f'{tag}: a reload lands on Home')
    diag = pg.evaluate("""() => { const r = ES.core.store.peek('session'); let ss = null; try { ss = sessionStorage.getItem('earshot.session'); } catch (e) {}
      return { active: ES.ui.session.active(), id: r.id || '', at: r.at, now: Date.now(), sets: (r.sets || []).length, noResume: !!r.noResume, ss: ss }; }""")
    c.ok(pg.locator('[data-resume-session]').count() == 1, f'{tag}: Home offers "Resume session"', diag)
    if not pg.locator('[data-resume-session]').count():
        pg.context.close()
        return
    pg.click('[data-resume-session]')
    pg.wait_for_function("() => ES.core.router.current().name === 'play'", timeout=8000)
    s = pg.evaluate(SET)
    c.eq(pg.evaluate("ES.ui.session.state().id"), sid, f'{tag}: the same session continues')
    c.eq(s['results'], 2, f'{tag}: the two answered trials are kept')
    if not real:                          # a second tab opened now does not take the running session over
        t2, p2 = page(h, context=pg.context)
        c.ok(not p2.evaluate("ES.ui.session.active()") and p2.locator('[data-resume-session]').count() == 0,
             f'{tag}: a second tab does not offer the session another tab is running')
        p2.close()
        pg.bring_to_front()
        if pg.locator('[data-resume]').count():   # a hidden-tab pause while the other tab was in front
            pg.click('[data-resume]')
    if real:
        c.ok(s['i'] == 2 and s['scn'] == 8, f'{tag}: the engine flow resumes from its snapshot (count and set length)', s)
        play_one(pg, True)                # 3 of 8 answered; the demo set ends at 2 of 6 (both below half)
    wait_state(pg, ['loading', 'listen', 'answer'], 20000)
    pg.click('[data-pause]')
    pg.click('[data-end-set]')
    pg.wait_for_function("() => ES.core.router.current().name === 'results'", timeout=8000)
    entry = pg.evaluate("() => { const l = ES.core.store.peek('log').sessions; const s = l[l.length - 1]; return s && s.sets[s.sets.length - 1]; }")
    want, got = (8, 3) if real else (6, 2)
    c.ok(entry and entry.get('partial') is True and entry.get('n') == got and entry.get('planned') == want,
         f'{tag}: End set after {got} of {want} trials is logged as partial', entry)
    c.ok(pg.locator('[data-partial]').count() == 1, f'{tag}: Results says the set is partial')
    if real:
        c.ok(entry and not entry.get('pb'), f'{tag}: a partial set sets no personal best', entry)
    errors(c, tab, tag)
    pg.context.close()


# ---- M5: Delete everything drops the waiting session (here and in another tab)
def m5(h, c):
    tab, pg = page(h)
    pg.click('[data-start]')
    play_one(pg, True)
    pg.click('[data-pause]')
    pg.click('[data-end-set]')
    pg.wait_for_function("() => ES.core.router.current().name === 'results'", timeout=8000)
    pg.evaluate("() => { ES.core.router.go('settings'); }")
    pg.evaluate("() => { ES.ui.settingsData.deleteAll(); }")
    pg.locator('.sheet .sheet-actions button', has_text='Delete everything').click()
    pg.wait_for_function("() => ES.core.router.current().name === 'home'", timeout=8000)
    pg.wait_for_timeout(1500)
    st = pg.evaluate("""() => ({ active: ES.ui.session.active(), log: (ES.core.store.peek('log').sessions || []).length,
      rows: (ES.core.store.peek('trials').rows || []).length, session: ES.core.store.peek('session').id || '',
      keys: Object.keys(localStorage).filter(k => /earshot\\.v1\\.(log|trials|session)$/.test(k)).map(k => [k, localStorage.getItem(k).length]) })""")
    c.ok(not st['active'] and st['log'] == 0 and st['rows'] == 0 and not st['session'], 'M5: after Delete everything no session, log or trial rows come back', st)
    c.eq(pg.locator('[data-resume-session]').count(), 0, 'M5: Home offers no session to resume')
    errors(c, tab, 'M5')
    # another tab in a set
    ctx = h.browser.new_context(viewport={'width': 390, 'height': 844})
    ctx.add_init_script('window.ES_CONFIG = Object.assign(window.ES_CONFIG || {}, {"demo": true});')
    ctx.add_init_script(preset({'profile': PROFILE}))
    ta, a = page(h, context=ctx)
    tb, b = page(h, context=ctx)
    a.bring_to_front()
    a.click('[data-start]')
    play_one(a, True)
    wait_state(a, ['loading', 'listen', 'answer'], 15000)
    b.evaluate("() => { ES.core.store.wipe(); }")
    try:
        a.wait_for_function("() => !ES.ui.session.active() && ES.core.router.current().name === 'home'", timeout=8000)
    except Exception:
        pass
    a.wait_for_timeout(1200)
    st = a.evaluate("() => ({ active: ES.ui.session.active(), route: ES.core.router.current().name, log: (ES.core.store.peek('log').sessions || []).length, n: ES.engine.learner && ES.engine.learner.state ? ES.engine.learner.state.n || 0 : 0 })")
    c.ok(not st['active'] and st['route'] == 'home' and st['log'] == 0, 'M5: a wipe in another tab ends this tab\'s session without writing', st)
    stb = b.evaluate("() => (ES.core.store.peek('log').sessions || []).length")
    c.eq(stb, 0, 'M5: the other tab still sees an empty log')
    errors(c, ta, 'M5 tab A')
    ctx.close()


# ---- L1: a replay that is still rendering never starts under the Pause sheet
def l1(h, c):
    tab, pg = page(h)
    pg.evaluate("""() => { const r = ES.ui.demo.render; window.__plays = 0;
      ES.ui.demo.render = function (t, o) { return new Promise(function (res) { setTimeout(function () { res(r(t, o)); }, 1500); }); };
      const p = ES.ui.sound.play; ES.ui.sound.play = function (b) { window.__plays++; return p.apply(this, arguments); };
      if (ES.audio && ES.audio.play) { const q = ES.audio.play; ES.audio.play = function () { window.__plays++; return q.apply(this, arguments); }; } }""")
    pg.click('[data-start]')
    wait_state(pg, 'answer', 20000)
    answer_current(pg, False)
    wait_state(pg, 'feedback', 8000)
    n0 = pg.evaluate("window.__plays")
    pg.click('[data-replay="0"]')
    pg.click('[data-pause]')
    pg.wait_for_timeout(2400)
    st = pg.evaluate("() => ({ plays: window.__plays, playing: document.querySelector('.trial-body').getAttribute('data-playing'), sheet: ES.ui.sheetOpen() })")
    c.ok(st['sheet'] and st['plays'] == n0 and not st['playing'], 'L1: no replay starts while the Pause sheet is open', st)
    pg.click('[data-resume]')
    c.ok(pg.locator('[data-replay="0"]:not([disabled])').count() == 1, 'L1: after Resume the replay buttons work again')
    errors(c, tab, 'L1')
    pg.context.close()


# ---- L2: the tutorial pauses in a hidden tab
def l2(h, c):
    tab, pg = page(h, profile={'v': 1, 'welcomeSeen': 1})
    pg.click('[data-start]')
    pg.wait_for_selector('.tut [data-step="caption"]', timeout=8000)
    pg.wait_for_function("() => { const b = document.querySelector('[data-continue]'); return b && !b.disabled; }", timeout=8000)
    pg.click('[data-continue]')
    pg.wait_for_function("() => { const v = ES.ui.trialView.current; return v && v.state() === 'listen'; }", polling=20, timeout=15000)
    pg.evaluate("() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); }")
    c.eq(pg.evaluate("ES.ui.trialView.current.state()"), 'paused', 'L2: the tutorial\'s trial pauses when the tab is hidden')
    pg.evaluate("() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); }")
    pg.wait_for_timeout(300)
    if pg.evaluate("ES.ui.trialView.current.state()") == 'paused' and pg.locator('[data-resume]').count():
        pg.click('[data-resume]')
    try:
        wait_state(pg, ['listen', 'example', 'loading'], 8000)
        ok = True
    except Exception:
        ok = False
    c.ok(ok, 'L2: the tutorial continues when the tab is back', pg.evaluate("ES.ui.trialView.current.state()"))
    errors(c, tab, 'L2')
    pg.context.close()


# ---- L7: a render that never finishes ends in the error state with Skip
def l7(h, c):
    tab, pg = page(h, config={'renderTimeoutMs': 1500})
    pg.evaluate("() => { ES.ui.demo.render = function () { return new Promise(function () {}); }; }")
    pg.click('[data-start]')
    try:
        wait_state(pg, 'error', 6000)
        ok = True
    except Exception:
        ok = False
    c.ok(ok, 'L7: a render that hangs ends in the error state', pg.evaluate("ES.ui.trialView.current && ES.ui.trialView.current.state()"))
    c.ok(pg.locator('[data-skip]').count() == 1, 'L7: the error state offers Skip')
    errors(c, tab, 'L7', expect='took too long to prepare')
    pg.context.close()


# ---- M8: a learn:false session (the Weekly Night Out) never changes the learner
def m8(h, c):
    tab, pg = page(h, real=True)
    pg.evaluate("() => { ES.engine.learner.sync && ES.engine.learner.sync(); }")
    before, stored = pg.evaluate(LEARNER), pg.evaluate("JSON.stringify(ES.core.store.peek('learner'))")
    start_sets(pg, [{'exId': 'crowd', 'trials': 3, 'learn': False}], {'learn': False})
    for k in range(3):
        play_one(pg, k != 1)
    pg.wait_for_function("() => ES.core.router.current().name === 'results'", timeout=10000)
    c.eq(pg.evaluate(LEARNER), before, 'M8: no threshold, trial count, recent or edge value moved')
    c.eq(pg.evaluate("JSON.stringify(ES.core.store.peek('learner'))"), stored, 'M8: the stored learner record is unchanged')
    entry = pg.evaluate("() => { const l = ES.core.store.peek('log').sessions; const s = l[l.length - 1]; return s && s.sets[0]; }")
    c.ok(entry and entry.get('n') == 3 and entry.get('learn') is False and not entry.get('pb'), 'M8: the set is logged with learn:false and no personal best', entry)
    errors(c, tab, 'M8')
    pg.context.close()


# ---- H1: a plateau breaker is applied to the learner, not only announced
def h1(h, c):
    tab, pg = page(h, real=True)
    pg.evaluate("""() => { const P = ES.engine.plateau, orig = P.check; let once = false;
      P.check = function (ex, o) { if (once) return orig.apply(P, arguments); once = true;
        return { ex: ex, reason: 'Test plateau.', breaker: { kind: 'variety', text: 'Next sets bring in more voices.' }, chimera: true }; }; }""")
    b0 = pg.evaluate("() => { const b = ES.engine.learner.state.breadth.crowd; return b === undefined ? 0.2 : b; }")
    start_sets(pg, [{'exId': 'crowd', 'trials': 2}])
    play_one(pg, True)
    play_one(pg, True)
    pg.wait_for_function("() => ES.core.router.current().name === 'results'", timeout=10000)
    st = pg.evaluate("""() => { const s = ES.engine.learner.state, r = ES.core.store.peek('learner');
      return { b: s.breadth.crowd, k: (s.plat.crowd || {}).k, storedK: ((r.plat || {}).crowd || {}).k, storedB: (r.breadth || {}).crowd }; }""")
    want = round(min(1, b0 + 0.3), 2)
    c.ok(st['k'] == 0 and abs((st['b'] or 0) - want) < 0.011, 'H1: the variety breaker widens the variety (breadth +0.3) and is marked applied', [b0, st])
    c.ok(st['storedK'] == 0 and abs((st['storedB'] or 0) - want) < 0.011, 'H1: the applied breaker is saved', st)
    c.ok(pg.locator('.results').inner_text().find('Next sets bring in more voices') >= 0, 'H1: Results states what changes and why')
    errors(c, tab, 'H1')
    pg.context.close()


# ---- C02: Credits inside the app
def c02(h, c):
    for size, scheme in (((360, 640), 'light'), ((390, 844), 'dark')):
        tab = new_tab(h.browser, viewport=size, scheme=scheme, init=preset({'profile': PROFILE}))
        pg = tab.page
        pg.goto(file_url())
        wait_ready(pg)
        close_sheets(pg)
        pg.evaluate("() => { ES.core.router.go('about'); }")
        pg.click('[data-credits-link]')
        pg.wait_for_selector('.credits', timeout=5000)
        tag = f'C02 {size[0]}x{size[1]} {scheme}'
        rows = pg.locator('.credit').count()
        c.ok(rows >= 9, f'{tag}: Credits lists every source', rows)
        txt = pg.inner_text('.credits')
        for needle in ('CC BY-SA 3.0', 'CC BY 4.0', 'Apache', 'CC0', 'Open Font License', 'CMU', 'MIT', 'CC BY-SA 4.0'):
            c.ok(needle in txt, f'{tag}: Credits names {needle}')
        c.eq(pg.locator('details.notice').count(), 3, f'{tag}: the OFL, CMU and AudioMNIST notices travel with the app')
        pg.locator('details.notice summary').first.click()
        c.ok('SIL OPEN FONT LICENSE' in pg.inner_text('details.notice[open]').upper(), f'{tag}: the OFL text opens')
        links = pg.evaluate("() => [...document.querySelectorAll('.credits a[href^=\"http\"]')].every(a => a.target === '_blank' && /noopener/.test(a.rel))")
        c.ok(links, f'{tag}: licence links open in a new tab')
        dims = pg.evaluate("() => ({ sw: document.scrollingElement.scrollWidth, iw: innerWidth })")
        c.ok(dims['sw'] <= dims['iw'], f'{tag}: nothing overflows sideways', dims)
        shot(pg, f'round1_credits_{size[0]}_{scheme}', full=True)
        errors(c, tab, tag)
        pg.context.close()


# ---- C06: the Free-mode picker
def c06(h, c):
    tab, pg = page(h, real=True)
    pg.evaluate("() => { ES.core.router.go('settings'); }")
    pg.check('[data-mode="free"]')
    pg.wait_for_selector('[data-free-pick]', timeout=5000)
    chips = pg.locator('[data-free-ex]').all()
    ids = [x.get_attribute('data-free-ex') for x in chips]
    c.ok(len(ids) >= 4 and 'seek' not in ids, 'C06: the picker offers the trial-view exercises', ids)
    ex = 'far' if 'far' in ids else ids[0]
    pg.click(f'[data-free-ex="{ex}"]')
    rows = pg.locator('[data-free-dial]').count()
    c.ok(rows >= 1, 'C06: the exercise\'s dials are listed', rows)
    c.eq(pg.locator('[data-free-coach]').count(), rows, 'C06: every dial has a coach line')
    shot(pg, 'round1_free_picker_390', full=True)
    # set the first dial by hand
    d = pg.evaluate("""() => { const row = document.querySelector('[data-free-dial]'), inp = row.querySelector('[data-free-input]');
      if (inp.tagName === 'SELECT') { inp.value = String(inp.options.length - 1 > 1 ? 1 : 0); }
      else { inp.value = String((+inp.min + +inp.max) / 2); }
      inp.dispatchEvent(new Event('change', { bubbles: true })); return { id: row.dataset.freeDial, tag: inp.tagName, v: inp.value }; }""")
    free = pg.evaluate("ES.core.store.peek('profile').settings.free")
    c.ok(free and free.get('exId') == ex and d['id'] in (free.get('dials') or {}), 'C06: the choice and the hand-set dial are saved', [d, free])
    want = (free.get('dials') or {}).get(d['id'])
    pg.click('[data-free-coach-all]')
    free2 = pg.evaluate("ES.core.store.peek('profile').settings.free")
    c.eq(len((free2.get('dials') or {})), rows, 'C06: "Use the coach\'s levels" sets every dial')
    pg.evaluate("(o) => ES.core.store.update('profile', function (r) { r.settings.free = o; })", {'exId': ex, 'dials': {d['id']: want}})
    pg.evaluate("() => { ES.core.router.go('home'); }")
    pg.click('[data-start]')
    pg.wait_for_function("() => ES.ui.session.active()", timeout=8000)
    plan = pg.evaluate("ES.ui.session.state().sets.map(s => s.exId)")
    c.ok(plan and all(x == ex for x in plan), 'C06: a Free session trains the picked exercise only', plan)
    st, t_end = None, time.time() + 60          # a tutorial or a set intro may come first; renders can be slow under load
    while time.time() < t_end:
        st = pg.evaluate("""() => { const b = document.querySelector('.trial-body');
          return { route: ES.core.router.current().name, state: b ? b.dataset.state : null,
            intro: !!document.querySelector('[data-intro-start]'), tut: !!document.querySelector('[data-skip-tutorial]') }; }""")
        if st['tut']:
            pg.click('[data-skip-tutorial]')
        elif st['intro']:
            pg.click('[data-intro-start]')
        elif st['state'] and st['state'] != 'done':
            break
        pg.wait_for_timeout(250)
    c.ok(st and st['state'] and st['state'] != 'done', 'C06: the Free session\'s first trial starts', st)
    got = pg.evaluate("(id) => { const v = ES.ui.trialView.current, t = v && v.trial; return t && t.setting && t.setting.dials ? t.setting.dials[id] : null; }", d['id'])
    c.ok(got is not None and abs(float(got) - float(want)) < 1e-6, 'C06: the trial plays at the hand-set dial value', [got, want])
    errors(c, tab, 'C06')
    pg.context.close()


def run(h):
    c = Checks('round1')
    for fn in (h2_demo, m7, m6, m11, m11_drop, m5, l1, l2, l7, c02):
        print('  round1:', fn.__name__, flush=True)
        try:
            fn(h, c)
        except Exception as e:  # one broken case is one failure; the others still run
            c.ok(False, f'{fn.__name__} crashed', repr(e)[:400])
    if not real_data():
        c.warn('no voice data: real-session checks (H1, H2 real, M6 real, M8, M11 real, C06) skipped')
        return c
    for fn, kw in ((h2_real, {}), (m6, {'real': True}), (m11, {'real': True}), (m8, {}), (h1, {}), (c06, {})):
        print('  round1:', fn.__name__, kw, flush=True)
        try:
            fn(h, c, **kw)
        except Exception as e:
            c.ok(False, f'{fn.__name__} {json.dumps(kw)} crashed', repr(e)[:400])
    return c
