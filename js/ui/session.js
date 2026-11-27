/* ES.ui.session — one training session: plan → sets → results → log (PLAN §7; CONTRACTS §5, §7, §11).
   Real sets run through the engine's set runner (ES.engine.flow: start → next → answer → end), which owns the
   controller, generators, scoring and learner updates; the shell saves the learner between trials and the log at
   set ends, never during a stimulus. Real sessions need the planner, the audio engine and voice clips; until then
   (or with ES_CONFIG.demo) a demo session of tone trials keeps the flow testable. While a set runs ES.ui.inSet is
   true, so Chimera invitations wait for the screen between sets. */
(function (ES, win) {
  'use strict';
  var U = ES.core.util;
  var S = null, MAX_REPLACE = 3, SS = ES.ui.sessionStore;
  ES.ui.inSet = false;

  function store() { return ES.core.store; }
  function report(where, e) {
    if (win.console) console.error('[session ' + where + ']', e);
    if (ES._keepError) ES._keepError({ at: Date.now(), kind: 'session', msg: where + ': ' + String(e && e.message || e), stack: String(e && e.stack || '').slice(0, 800) });
  }
  function settings() { return store().peek('profile').settings || {}; }
  var I = ES.ui.sessionInfo, NAMES = I.NAMES, flowOk = I.flowOk, engineReady = I.engineReady, runnable = I.runnable,
    realAvailable = I.realAvailable, exInfo = I.exInfo, labInfo = I.labInfo, focusLevel = I.focusLevel, levelText = I.levelText,
    pbText = I.pbText, fallbackEntry = I.fallbackEntry, planCopy = I.planCopy;
  function E() { return ES.engine; }
  /** The engine's learner follows the stored record (other tabs may have trained); call outside sets. */
  function syncLearner() {
    var L = E().learner;
    if (L && typeof L.load === 'function') { try { L.load(store().get('learner')); } catch (e) { report('learner load', e); } }
  }
  /** Weekly Night Out and other replays of fixed items never teach the learner (RV M8): learn:false on the session
      or the set, or setting.noUpdate / meta.learn === false on the trial. */
  function noLearn(set, trial) {
    return !!((S && S.learn === false) || (set && set.plan && set.plan.learn === false) ||
      (trial && trial.setting && trial.setting.noUpdate) || (trial && trial.meta && trial.meta.learn === false));
  }
  function saveLearner() {
    var L = E().learner;
    if (L && typeof L.save === 'function') { try { L.save(); } catch (e) { report('learner save', e); } }
  }

  function buildPlan(id) {
    if (realAvailable()) {
      try {
        var avail = (E().exercises || Object.keys(E().items || {})).filter(runnable), st = settings();
        // Free mode trains one exercise: the picked one (Settings, RV C06), else the first with the trial view
        var freeEx = st.mode !== 'free' ? undefined : st.free && st.free.exId && avail.indexOf(st.free.exId) >= 0 ? st.free.exId
          : avail.filter(function (x) { return exInfo(x).view !== 'custom'; })[0];
        var p = E().planner.session({ mode: st.mode || 'edge', minutes: st.sessionMin || 15, now: Date.now(), exId: freeEx,
          rng: ES.core.rng('plan:' + id), log: store().peek('log'), available: avail, lab: labInfo(), headphones: !!st.headphones });
        var sets = (p && p.sets || []).filter(function (s) { return s && runnable(s.exId); });
        if (sets.length) return { sets: sets, demo: false, notes: (p.notes || []).slice() };
      } catch (e) { report('planner', e); }
    }
    return { sets: ES.ui.demo.plan().sets, demo: true, notes: [] };
  }

  function active() { return !!(S && !S.done); }
  function state() { return S; }
  function currentSet() { return S ? S.sets[S.setIndex] : null; }

  /** Start a session (call from the Start tap, so sound can unlock). opts (the game's venue sets and the Weekly
      Night Out): {sets:[planner-shaped sets, may carry make(i, ctx), title, pin, focus, family, learn], kind, title,
      done:{name, params}, learn:false (never teaches the learner: RV M8)}. */
  function start(opts) {
    opts = opts && typeof opts === 'object' ? opts : {};
    var id = U.uid('s');
    syncLearner();
    var plan = opts.sets ? { sets: opts.sets.filter(function (x) { return x && (typeof x.make === 'function' ? !!ES.engine.score : runnable(x.exId)); }), demo: false, notes: [] } : buildPlan(id);
    if (!plan.sets.length) plan = { sets: ES.ui.demo.plan().sets, demo: true, notes: [] };
    S = { id: id, start: Date.now(), mode: settings().mode || 'edge', demo: plan.demo, setIndex: 0, done: false, demoTmr: 6, rows: [], notes: plan.notes,
      kind: opts.kind || null, title: opts.title || null, doneRoute: opts.done || null, learn: opts.learn === false ? false : undefined,
      sets: plan.sets.map(function (p, i) {
        return { index: i, exId: p.exId, n: Math.max(1, p.trials | 0 || 20), plan: p, results: [], pb: false, activeStart: 0, plateau: null, demo: plan.demo, sc: null };
      }) };
    S.log = { id: S.id, start: S.start, end: S.start, activeMs: 0, mode: S.mode, sets: [] };
    if (S.demo) S.log.demo = true;
    if (S.kind) S.log.kind = S.kind;
    ES.core.clock.start();
    beginSet(0);
    persist();
    return S;
  }
  function needsTutorial(exId) {
    var info = exInfo(exId), steps = info.tutorial && info.tutorial.steps;
    if (!steps || !steps.length) return false;
    return !(store().peek('profile').tutorials || {})[exId];
  }
  /** The set's engine context. A set that must not teach the learner (RV M8) runs a learn:false flow. After a
      reload the stored snapshot is resumed (same trial count, anchors and replacement cap; RV M11). */
  function openFlow(set) {
    var p = set.plan;
    if (set.demo || set.sc || !flowOk() || typeof p.make === 'function') return;
    try {
      if (set.snap && typeof E().flow.resume === 'function') {     // custom views (Seek) pick up set.sc too
        set.sc = E().flow.resume(set.snap, {});
        set.snap = null;
        if (set.sc) { if (noLearn(set)) set.sc.learn = false; return; }
      }
      var free = S.mode === 'free' && settings().free && settings().free.exId === set.exId ? settings().free.dials || null : null;
      // a custom view (Seek) opens its own flow, except that Free mode's hand-set dials must reach it
      if (exInfo(set.exId).view === 'custom' && !(free && Object.keys(free).length)) return;
      set.sc = E().flow.start(set.exId, { mode: S.mode, seed: S.id + ':' + set.index, headphones: !!settings().headphones, kind: p.kind,
        hint: p.hint, avoidVoices: p.avoidVoices, daysAway: p.daysAway, lab: labInfo(), trials: Math.max(1, set.n - set.results.length),
        pin: p.pin, focus: typeof p.focus === 'string' ? p.focus : undefined, family: typeof p.family === 'string' ? p.family : undefined,
        overrides: free && Object.keys(free).length ? free : null,
        learn: noLearn(set) ? false : undefined });
    } catch (e) { report('flow.start', e); set.sc = null; }
  }
  function beginSet(i) {
    if (!S || !S.sets[i]) { finish(); return; }
    S.setIndex = i;
    var set = S.sets[i];
    set.activeStart = ES.core.clock.activeMs();
    if (needsTutorial(set.exId)) { ES.ui.inSet = false; ES.core.router.go('tutorial', { exId: set.exId, set: i }, { replace: i > 0 }); return; }
    openFlow(set);                                   // the set's engine context opens only when its trials start
    ES.ui.inSet = true;
    ES.core.router.go('play', { set: i }, { replace: i > 0 });
  }
  /** After a tutorial run inside a session: start the set it was guarding. */
  function afterTutorial() {
    if (!active()) return false;
    var set = currentSet();
    set.activeStart = ES.core.clock.activeMs();
    openFlow(set);
    ES.ui.inSet = true;
    ES.core.router.go('play', { set: S.setIndex }, { replace: true });
    return true;
  }

  /** The next trial of the current set, or null when the engine says the set is complete. */
  function makeTrial() {
    var set = currentSet(), i = set.results.length, seed = S.id + ':' + set.index + ':' + i + (set.salt ? ':r' + set.salt : '');
    if (set.demo || set.exId === 'demo') {
      var rng = ES.core.rng(seed), last2 = set.results.slice(-2);
      var anchor = (i > 0 && i % 5 === 4) || (last2.length === 2 && !last2[0].correct && !last2[1].correct);
      return ES.ui.demo.make(rng, { tmr: anchor ? Math.min(ES.ui.demo.MAX_TMR, S.demoTmr + 6) : S.demoTmr, twoSlots: i % 3 === 2, anchor: anchor });
    }
    var t;
    if (typeof set.plan.make === 'function') {          // fixed trials (the Weekly Night Out): identical for everyone
      t = set.plan.make(i, { mode: S.mode, set: set.plan, index: i, results: set.results.slice(), headphones: !!settings().headphones });
      if (!t) return null;
    } else if (set.sc) {
      var drawn = !set.sc.pending;
      t = set.sc.pending || E().flow.next(set.sc);    // an aborted trial stays pending, so it is shown again, not re-drawn
      if (!t) return null;
      if (drawn) persist();                           // a reload now replaces this trial instead of replaying it (M11)
      return finishTrial(t, seed, set);
    } else {
      var r2 = ES.core.rng(seed), learner = store().peek('learner');
      var ctx = { mode: S.mode, rng: r2.fork('controller'), recent: (learner.recent || {})[set.exId] || [], breadth: (learner.breadth || {})[set.exId] || 0,
        set: set.plan, index: i, prev: set.results.slice(-5), headphones: !!settings().headphones };
      var setting = E().controller.next(set.exId, ctx);
      t = E().items[set.exId].make(r2.fork('items'), setting, ctx);
      if (!t.setting) t.setting = setting;
    }
    // a replacement of a trial the flow did not draw: a new render seed (the flow draws new items itself; RV M6)
    if (set.salt && t._salt !== set.salt) {
      t.seed = String(t.seed != null ? t.seed : seed) + ':r' + set.salt;
      if (t.setting) t.setting.seed = t.seed;
      t._salt = set.salt;
    }
    return finishTrial(t, seed, set);
  }
  function finishTrial(t, seed, set) {
    if (t.seed == null) t.seed = seed;
    if (!t.ex) t.ex = set.exId;
    return t;
  }
  /** How a trial is scored: the demo scorer; the set's flow (updates the learner, counts toward the set) for
      trials the flow made; plain ES.engine.score for anything else (tutorial trials: no learner update). */
  function scorer(trial) {
    if (trial && trial.meta && trial.meta.demo) return ES.ui.demo.score;
    var set = currentSet(), fromFlow = !!(trial && trial.meta && trial.meta.decision);
    if (set && set.sc && fromFlow) return function (t, r) {
      // a trial flagged not to teach (RV M8) still advances the set, with the learner left alone
      var sc = set.sc, was = sc.learn, quiet = noLearn(set, t);
      if (quiet) sc.learn = false;
      try { var out = E().flow.answer(sc, t, r); } finally { if (quiet) sc.learn = was; }
      set.lastOut = out;
      var dp = t.meta && t.meta.decision && t.meta.decision.path;
      if (dp) set.pathAt = dp;                          // Path mode: where the set is, and its moves (RV P4)
      if (out.path && (out.path.advanced || out.path.back)) set.pathMoves = (set.pathMoves || []).concat([{ advanced: !!out.path.advanced, back: !!out.path.back, i: out.path.i }]);
      return out.result;
    };
    return function (t, r) { return E().score(t, r); };
  }
  /** Tutorial trials never touch the learner or the set. */
  function plainScorer(trial) {
    if (trial && trial.meta && trial.meta.demo) return ES.ui.demo.score;
    return function (t, r) { return E().score(t, r); };
  }
  /** Record an answered trial (at answer time, after the stimulus). opts.learned: the caller's flow already
      updated the learner (custom views that drive ES.engine.flow themselves). */
  function record(trial, result, resp, opts) {
    var set = currentSet();
    if (!set) return;
    var rec = { correct: !!result.correct, prop: +result.prop || 0, intrusions: result.intrusions | 0, focus: trial.setting && trial.setting.focus || '', level: focusLevel(trial),
      slots: (trial.question && trial.question.slots && trial.question.slots.length) || 1 };
    set.results.push(rec);
    S.rows.push([Date.now(), trial.ex || set.exId, rec.focus, rec.level, rec.correct ? 1 : 0, U.round(rec.prop, 3), rec.intrusions]);
    if (trial.meta && trial.meta.demo) S.demoTmr = ES.ui.demo.nextTmr(S.demoTmr, rec.correct);
    else if (!noLearn(set, trial)) {
      var L = E().learner;
      if (!set.sc && !(opts && opts.learned) && L && typeof L.update === 'function') { try { L.update(trial, result); } catch (e) { report('learner', e); } }
      saveLearner();                                  // persistence is the shell's: after every answer, between stimuli
    }
    persist();
    ES.hooks.emit('trial:done', { trial: trial, result: result, response: resp, set: set.index, index: set.results.length - 1, demo: !!set.demo });
  }
  /** A trial that could not be played (skipped) or was interrupted twice (voided) is replaced by a NEW trial; it is
      never charged to the player. After MAX_REPLACE replacements the set ends early and is logged as partial. */
  function replaceTrial(trial, reason) {
    var set = currentSet();
    if (!set) return false;
    set.replacements = (set.replacements || 0) + 1;
    if (reason !== 'voided') report('skip', reason || 'skipped');
    var ended = set.replacements > MAX_REPLACE;
    if (set.sc) {
      // the flow drops the pending trial unscored and draws a new item at the same level; an error marks its clips bad
      if (typeof E().flow.skip === 'function') {
        try { var r = E().flow.skip(set.sc, { reason: reason === 'voided' ? 'void' : reason === 'skipped' || !reason ? 'skip' : 'error' }); if (r && r.ended) ended = true; }
        catch (e) { report('flow.skip', e); set.sc.pending = null; }
      } else {
        set.sc.pending = null;
        if (set.sc.rng && typeof set.sc.rng.fork === 'function') set.sc.rng = set.sc.rng.fork('r' + set.replacements);
      }
    }
    if (ended) {
      endSetEarly({ partial: true, reason: reason === 'voided' ? 'voided' : 'sounds' });   // the screen says why (RV P16)
      return false;
    }
    set.salt = set.replacements;
    persist();
    return true;
  }
  function skip(trial, err) { return replaceTrial(trial, err ? String(err.message || err) : 'skipped'); }
  /** One definition of a session (round 2): it holds at least one answered trial. Only such sessions are logged;
      log.sessions[].answered carries the count for every counter (week ring, today's note, the planner). */
  function writeLog() {
    S.log.end = Date.now();
    S.log.activeMs = (S.activeBase || 0) + ES.core.clock.activeMs();
    S.log.answered = (S.log.sets || []).reduce(function (a, x) { return a + ((x && x.n) | 0); }, 0);
    if (!S.log.answered) return false;
    var copy = U.copy(S.log), rows = S.rows;
    S.rows = [];
    store().update('log', function (r) { r.sessions = (r.sessions || []).filter(function (x) { return x.id !== copy.id; }).concat([copy]); });
    if (rows.length) store().update('trials', function (r) { r.rows = (r.rows || []).concat(rows); });
    return true;
  }
  /** Close the current set (also from a custom view's done(result)) and show its results. extra.partial: the set
      ended early with fewer than half its trials answered, or after too many replacements (RV M11): it is logged as
      partial and never counts as a completed set (no personal best, no plateau input, no venue best). */
  function finishSet(extra) {
    var set = currentSet();
    if (!set || set.finished) return;
    set.finished = true;
    extra = extra || {};
    var partial = !!extra.partial, L = E().learner, keepBest = null;
    set.activeMs = Math.max(0, ES.core.clock.activeMs() - set.activeStart);
    var entry = null;
    if (set.sc && typeof E().flow.end === 'function') {
      if (partial && L && L.state) keepBest = JSON.stringify(L.state.best || {});
      try { entry = E().flow.end(set.sc, { early: !!extra.early }); } catch (e) { report('flow.end', e); }
      if (keepBest !== null) L.state.best = JSON.parse(keepBest);   // a partial set sets no personal best
    } else if (extra.ex && extra.n != null) entry = U.copy(extra);
    if (!entry) entry = fallbackEntry(set, extra);
    entry.n = set.results.length || entry.n;
    entry.correct = set.results.length ? set.results.filter(function (r) { return r.correct; }).length : entry.correct;
    entry.activeMs = set.activeMs;
    if (partial) { entry.partial = true; entry.planned = set.planned || set.n; entry.pb = false; entry.pbs = []; }
    if (set.plan.kind && set.plan.kind !== 'normal') entry.kind = set.plan.kind;
    ['venue', 'week', 'stop'].forEach(function (k) { if (set.plan[k] != null) entry[k] = set.plan[k]; });
    set.entry = entry;
    set.partial = partial;
    if (extra.reason) set.endReason = extra.reason;      // 'sounds' or 'voided': Results says why the set ended
    ES.ui.inSet = false;
    var learns = !set.demo && !noLearn(set);
    if (learns) saveLearner();
    // set:done first: the game raises 'pb' from its handler; the log then records it (the plateau check reads pb).
    ES.hooks.emit('set:done', { set: entry, index: set.index, session: S.id, results: set.results.slice(), demo: !!set.demo, partial: partial });
    set.pb = !partial && (set.pb || !!entry.pb);
    entry.pb = set.pb;
    S.log.sets.push(entry);
    writeLog();
    persist();
    if (ES.core.playtest.enabled()) {
      var lr = set.results[set.results.length - 1];
      ES.core.playtest.setDone({ ex: set.exId, n: entry.n, correct: entry.correct, activeMs: set.activeMs, level: lr ? lr.level : null, demo: !!set.demo, partial: partial });
    }
    if (entry.pb && !partial) ES.hooks.emit('pb', { exId: set.exId, pbs: entry.pbs || [], title: 'New personal best', text: pbText(set.exId, entry.pbs) });
    if (learns && !partial && E().plateau && typeof E().plateau.check === 'function') {
      try {
        var logNow = store().peek('log'), pl = E().plateau.check(set.exId, { log: logNow, headphones: !!settings().headphones });
        if (pl) {
          set.plateau = pl;
          // RV H1: the breaker is applied, not only announced (breadth, forced focus, anchors or a rest), then saved.
          if (typeof E().plateau.apply === 'function') E().plateau.apply(set.exId, pl, { log: logNow });
          saveLearner();
          ES.hooks.emit('plateau', { exId: set.exId, reason: pl.reason, breaker: pl.breaker, text: pl.breaker && pl.breaker.text });
        }
      } catch (e) { report('plateau', e); }
    }
    ES.core.router.go('results', { set: set.index }, { replace: true });
  }
  /** End the running set early (Pause → End set, or too many replacements). Fewer than half of its trials answered,
      or opts.partial: logged as partial. No trial answered: the set is dropped. */
  function endSetEarly(opts) {
    opts = opts || {};
    var set = currentSet();
    if (!set) return;
    if (set.sc) set.sc.pending = null;
    if (!set.results.length) { skipSet(set, opts.reason || 'ended'); return; }
    var partial = !!opts.partial || set.results.length < set.n / 2;
    set.planned = set.n;
    set.n = set.results.length;
    finishSet({ partial: partial, early: true, reason: opts.reason });
  }
  /** A set with no answered trial (ended before the first answer, or its sounds could not be prepared) is passed
      over: nothing is logged, its screen says why, and the session goes on with the next set (RV P7, P16). */
  function skipSet(set, reason) {
    set.finished = true;
    set.skipped = reason;
    set.activeMs = 0;
    ES.ui.inSet = false;
    persist();
    ES.hooks.emit('set:skipped', { index: set.index, exId: set.exId, reason: reason, session: S.id });
    ES.core.router.go('results', { set: set.index }, { replace: true });
  }
  function next() { if (!S) return; if (S.setIndex + 1 < S.sets.length) beginSet(S.setIndex + 1); else finish(); }
  function finish() {
    if (!S) return;
    ES.ui.inSet = false;
    ES.core.clock.resume('away');
    if (!S.done) {
      S.done = true;
      var logged = writeLog();
      ES.core.clock.stop();
      clearStored(S.id);
      // empty: nothing was answered, so nothing was logged (listeners that count sessions skip it)
      ES.hooks.emit('session:done', { session: U.copy(S.log), demo: !!S.demo, kind: S.kind, empty: !logged });
    }
    var d = S.doneRoute;
    if (d && d.name && ES.core.router.has(d.name)) ES.core.router.go(d.name, d.params || {}, { replace: true });
    else ES.core.router.go('results', { done: true }, { replace: true });
  }
  /** Leave the session. opts.discard (Delete everything, a wipe in another tab): drop it without writing anything. */
  function abandon(opts) {
    if (!S || S.done) { if (opts && opts.discard) S = null; clearStored(); return; }
    ES.ui.inSet = false;
    if (opts && opts.discard) { S.done = true; S = null; ES.core.clock.stop(); clearStored(); return; }
    if (S.log.sets.length) finish(); else { S.done = true; ES.core.clock.stop(); clearStored(); }
  }

  // ---- the session survives a reload (RV M11): its plan and the player's place are stored between trials
  // (js/ui/session-store.js keeps the shared record and this tab's own copy).
  function persist() { if (S && !S.done) SS.save(S); }
  function clearStored(id) { SS.clear(id); }
  /** Rebuild a stored session after a reload (offered as "Resume session" on Home). */
  function restore() {
    if (S && !S.done) return false;
    var r = SS.load();
    if (!r) return false;
    S = { id: r.id, start: r.start, mode: r.mode || 'edge', demo: !!r.demo, setIndex: Math.min(r.setIndex | 0, r.sets.length - 1), done: false,
      demoTmr: typeof r.demoTmr === 'number' ? r.demoTmr : 6, rows: Array.isArray(r.rows) ? r.rows : [], notes: Array.isArray(r.notes) ? r.notes : [],
      kind: r.kind || null, title: r.title || null, doneRoute: r.done || null, learn: r.learn === false ? false : undefined, restored: true,
      sets: r.sets.map(function (x, i) {
        return { index: i, exId: x.exId, n: x.n || 1, planned: x.planned, plan: x.plan || { exId: x.exId }, results: Array.isArray(x.results) ? x.results : [],
          pb: false, activeStart: 0, activeSoFar: x.activeMs || 0, plateau: null, demo: !!x.demo, sc: null, finished: !!x.finished,
          activeMs: x.activeMs || 0, entry: x.entry || null, partial: !!x.partial, replacements: x.replacements || 0, salt: x.salt || 0, introShown: !!x.introShown,
          snap: x.snap && typeof x.snap === 'object' ? x.snap : null, skipped: x.skipped || undefined, endReason: x.endReason || undefined,
          pathAt: x.pathAt || undefined, pathMoves: Array.isArray(x.pathMoves) ? x.pathMoves : undefined };
      }) };
    S.log = r.log && typeof r.log === 'object' ? r.log : { id: S.id, start: S.start, end: S.start, activeMs: 0, mode: S.mode, sets: [] };
    S.activeBase = S.log.activeMs || 0;
    return true;
  }
  /** Continue the session: its results screen when the current set is finished, else the set (a new flow context
      for the trials still to play). Call from a tap. */
  function resume() {
    if (!active()) return false;
    if (S.restored) { S.restored = false; ES.core.clock.start(); }     // active time counts again from here
    var set = currentSet();
    if (!set) { finish(); return true; }
    if (set.finished) { ES.core.router.go('results', { set: set.index }); return true; }
    if (set.activeSoFar) { set.activeStart = ES.core.clock.activeMs() - set.activeSoFar; set.activeSoFar = 0; }
    if (needsTutorial(set.exId) && !set.results.length) { ES.ui.inSet = false; ES.core.router.go('tutorial', { exId: set.exId, set: set.index }); return true; }
    openFlow(set);
    ES.ui.inSet = true;
    ES.core.router.go('play', { set: set.index });
    return true;
  }

  ES.hooks.on('pb', function () { var set = currentSet(); if (set && active()) set.pb = true; });
  ES.hooks.on('store:changed', function (ev) {
    if (ev && ev.source === 'wipe') {                   // Delete everything, here or in another tab (RV M5)
      var cur = ES.core.router.current(), was = !!S;
      abandon({ discard: true });
      var L = E().learner;
      if (L && typeof L.reset === 'function') { try { L.reset(); } catch (e) { report('learner reset', e); } }
      if (was && cur && ['play', 'results', 'tutorial'].indexOf(cur.name) >= 0) ES.core.router.go('home', {}, { reset: true });
      return;
    }
    if (ev && ev.source !== 'local' && (ev.key === 'learner' || ev.key === '*') && !ES.ui.inSet) syncLearner();
  });
  ES.hooks.on('app:ready', function () { syncLearner(); restore(); });

  ES.ui.session = { supports: { plan: true, make: true, pin: true, learn: true, resume: true }, active: active, state: state, start: start,
    beginSet: beginSet, afterTutorial: afterTutorial, currentSet: currentSet, exInfo: exInfo, makeTrial: makeTrial, scorer: scorer,
    plainScorer: plainScorer, record: record, skip: skip, replaceTrial: replaceTrial, levelText: levelText, finishSet: finishSet,
    endSetEarly: endSetEarly, next: next, finish: finish, abandon: abandon, resume: resume, restore: restore, persist: persist,
    runnable: runnable, engineReady: engineReady, needsTutorial: needsTutorial, realAvailable: realAvailable, syncLearner: syncLearner,
    noLearn: noLearn, NAMES: NAMES, MAX_REPLACE: MAX_REPLACE };
})(window.ES, window);
