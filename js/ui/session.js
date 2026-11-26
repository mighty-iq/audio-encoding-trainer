/* ES.ui.session — one training session: plan → sets → results → log (PLAN §7; CONTRACTS §5, §7, §11).
   Real sets run through the engine's set runner (ES.engine.flow: start → next → answer → end), which owns the
   controller, generators, scoring and learner updates; the shell saves the learner between trials and the log at
   set ends, never during a stimulus. Real sessions need the planner, the audio engine and voice clips; until then
   (or with ES_CONFIG.demo) a demo session of tone trials keeps the flow testable. While a set runs ES.ui.inSet is
   true, so Chimera invitations wait for the screen between sets. */
(function (ES, win) {
  'use strict';
  var U = ES.core.util;
  var NAMES = { crowd: 'Crowd', far: 'Far', strange: 'Strange voices', repair: 'Repair', echo: 'Echo', seek: 'Seek', voices: 'Voices', missions: 'Missions' };
  var S = null;
  ES.ui.inSet = false;

  function store() { return ES.core.store; }
  function report(where, e) {
    if (win.console) console.error('[session ' + where + ']', e);
    if (ES._keepError) ES._keepError({ at: Date.now(), kind: 'session', msg: where + ': ' + String(e && e.message || e), stack: String(e && e.stack || '').slice(0, 800) });
  }
  function settings() { return store().peek('profile').settings || {}; }
  function E() { return ES.engine; }
  function flowOk() { var f = E().flow; return !!(f && typeof f.start === 'function' && typeof f.next === 'function' && typeof f.answer === 'function'); }
  function engineReady(exId) {
    var A = ES.audio, en = E();
    var gen = en.items && en.items[exId] && typeof en.items[exId].make === 'function';
    var loop = flowOk() || (en.controller && typeof en.controller.next === 'function' && typeof en.score === 'function');
    return !!(gen && loop && A && typeof A.render === 'function' && typeof A.play === 'function');
  }
  function runnable(exId) {
    var ex = ES.ex[exId];
    if (ex && ex.view === 'custom') return typeof ex.custom === 'function';
    return engineReady(exId);
  }
  /** Voice clips exist (the stimulus packs and their manifest). */
  function audioData() {
    var m = ES.data && ES.data.manifest;
    return !!(m && m.clips && Object.keys(m.clips).length && ES.packs && Object.keys(ES.packs).length);
  }
  /** A real session can start: a planner, the audio engine and voice clips are installed. */
  function realAvailable() {
    if (ES.CONFIG && ES.CONFIG.demo === true) return false;    // tests and previews can force the demo session
    return !!(E().planner && typeof E().planner.session === 'function' && ES.audio && typeof ES.audio.render === 'function' && audioData());
  }
  function exInfo(exId) {
    if (exId === 'demo') return ES.ui.demo.ex;
    var ex = ES.ex[exId] || {};
    return { id: exId, name: ex.name || NAMES[exId] || exId, short: ex.short || '', bet: ex.bet || '', betNew: !!ex.betNew,
      view: ex.view || 'keyword', feedback: ex.feedback || 'standard', tutorial: ex.tutorial || null, custom: ex.custom, tips: ex.tips || null };
  }
  function labInfo() {
    try { if (ES.lab && typeof ES.lab.forPlanner === 'function') return ES.lab.forPlanner(); } catch (e) { report('lab', e); }
    return null;
  }
  /** The engine's learner follows the stored record (other tabs may have trained); call outside sets. */
  function syncLearner() {
    var L = E().learner;
    if (L && typeof L.load === 'function') { try { L.load(store().get('learner')); } catch (e) { report('learner load', e); } }
  }
  function saveLearner() {
    var L = E().learner;
    if (L && typeof L.save === 'function') { try { L.save(); } catch (e) { report('learner save', e); } }
  }

  function buildPlan(id) {
    if (realAvailable()) {
      try {
        var avail = (E().exercises || Object.keys(E().items || {})).filter(runnable);
        var p = E().planner.session({ mode: settings().mode || 'edge', minutes: settings().sessionMin || 15, now: Date.now(),
          rng: ES.core.rng('plan:' + id), log: store().peek('log'), available: avail, lab: labInfo(), headphones: !!settings().headphones });
        var sets = (p && p.sets || []).filter(function (s) { return s && runnable(s.exId); });
        if (sets.length) return { sets: sets, demo: false, notes: (p.notes || []).slice() };
      } catch (e) { report('planner', e); }
    }
    return { sets: ES.ui.demo.plan().sets, demo: true, notes: [] };
  }

  function active() { return !!(S && !S.done); }
  function state() { return S; }
  function currentSet() { return S ? S.sets[S.setIndex] : null; }

  /** Start a session (call from the Start tap, so sound can unlock). */
  function start() {
    var id = U.uid('s');
    syncLearner();
    var plan = buildPlan(id);
    S = { id: id, start: Date.now(), mode: settings().mode || 'edge', demo: plan.demo, setIndex: 0, done: false, demoTmr: 6, rows: [], notes: plan.notes,
      sets: plan.sets.map(function (p, i) {
        return { index: i, exId: p.exId, n: Math.max(1, p.trials | 0 || 20), plan: p, results: [], pb: false, activeStart: 0, plateau: null, demo: plan.demo, sc: null };
      }) };
    S.log = { id: S.id, start: S.start, end: S.start, activeMs: 0, mode: S.mode, sets: [] };
    if (S.demo) S.log.demo = true;
    ES.core.clock.start();
    beginSet(0);
    return S;
  }
  function needsTutorial(exId) {
    var info = exInfo(exId), steps = info.tutorial && info.tutorial.steps;
    if (!steps || !steps.length) return false;
    return !(store().peek('profile').tutorials || {})[exId];
  }
  function openFlow(set) {
    if (set.demo || set.sc || !flowOk() || exInfo(set.exId).view === 'custom') return;
    var p = set.plan;
    try {
      set.sc = E().flow.start(set.exId, { mode: S.mode, seed: S.id + ':' + set.index, headphones: !!settings().headphones, kind: p.kind,
        hint: p.hint, avoidVoices: p.avoidVoices, daysAway: p.daysAway, lab: labInfo(), trials: set.n });
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
    var set = currentSet(), i = set.results.length, seed = S.id + ':' + set.index + ':' + i + ':' + (set.skips || 0);
    if (set.demo || set.exId === 'demo') {
      var rng = ES.core.rng(seed), last2 = set.results.slice(-2);
      var anchor = (i > 0 && i % 5 === 4) || (last2.length === 2 && !last2[0].correct && !last2[1].correct);
      return ES.ui.demo.make(rng, { tmr: anchor ? Math.min(ES.ui.demo.MAX_TMR, S.demoTmr + 6) : S.demoTmr, twoSlots: i % 3 === 2, anchor: anchor });
    }
    var t;
    if (set.sc) {
      t = set.sc.pending || E().flow.next(set.sc);    // an aborted trial stays pending, so it is shown again, not re-drawn
      if (!t) return null;
    } else {
      var r2 = ES.core.rng(seed), learner = store().peek('learner');
      var ctx = { mode: S.mode, rng: r2.fork('controller'), recent: (learner.recent || {})[set.exId] || [], breadth: (learner.breadth || {})[set.exId] || 0,
        set: set.plan, index: i, prev: set.results.slice(-5), headphones: !!settings().headphones };
      var setting = E().controller.next(set.exId, ctx);
      t = E().items[set.exId].make(r2.fork('items'), setting, ctx);
      if (!t.setting) t.setting = setting;
    }
    if (t.seed == null) t.seed = seed;
    if (!t.ex) t.ex = set.exId;
    return t;
  }
  /** How a trial is scored: the demo scorer; the set's flow (updates the learner, counts toward the set) for
      trials the flow made; plain ES.engine.score for anything else (tutorial trials: no learner update). */
  function scorer(trial) {
    if (trial && trial.meta && trial.meta.demo) return ES.ui.demo.score;
    var set = currentSet(), fromFlow = !!(trial && trial.meta && trial.meta.decision);
    if (set && set.sc && fromFlow) return function (t, r) { var out = E().flow.answer(set.sc, t, r); set.lastOut = out; return out.result; };
    return function (t, r) { return E().score(t, r); };
  }
  /** Tutorial trials never touch the learner or the set. */
  function plainScorer(trial) {
    if (trial && trial.meta && trial.meta.demo) return ES.ui.demo.score;
    return function (t, r) { return E().score(t, r); };
  }
  function focusLevel(trial) {
    var s = trial && trial.setting;
    return s && s.focus && s.dials && typeof s.dials[s.focus] === 'number' ? s.dials[s.focus] : null;
  }
  function levelText(trial) {
    var s = trial && trial.setting;
    if (!s || !s.focus) return '';
    if (trial.meta && trial.meta.demo) return ES.ui.demo.levelText(s.dials.tmr);
    var v = s.dials ? s.dials[s.focus] : null;
    return v == null ? '' : ES.ui.w.dialText(trial.ex, s.focus, v).replace(': ', ' · ');
  }
  /** Record an answered trial (at answer time, after the stimulus). */
  function record(trial, result, resp) {
    var set = currentSet();
    if (!set) return;
    var rec = { correct: !!result.correct, prop: +result.prop || 0, intrusions: result.intrusions | 0, focus: trial.setting && trial.setting.focus || '', level: focusLevel(trial) };
    set.results.push(rec);
    S.rows.push([Date.now(), trial.ex || set.exId, rec.focus, rec.level, rec.correct ? 1 : 0, U.round(rec.prop, 3), rec.intrusions]);
    if (trial.meta && trial.meta.demo) S.demoTmr = ES.ui.demo.nextTmr(S.demoTmr, rec.correct);
    else {
      var L = E().learner;
      if (!set.sc && L && typeof L.update === 'function') { try { L.update(trial, result); } catch (e) { report('learner', e); } }
      if (!(L && L._bound)) saveLearner();          // a store-bound learner already saved itself after the update
    }
    ES.hooks.emit('trial:done', { trial: trial, result: result, response: resp, set: set.index, index: set.results.length - 1, demo: !!set.demo });
  }
  function skip(trial, err) {
    var set = currentSet();
    set.skips = (set.skips || 0) + 1;
    if (set.sc && set.sc.pending) set.sc.pending = null;   // an unplayable trial is dropped, not retried
    report('skip', err || 'skipped');
    if (set.skips >= 3 && !set.demo) { set.demo = true; set.sc = null; set.exId = 'demo'; ES.ui.toast('Trials could not be prepared, so this set continues with demo trials.'); }
  }
  function writeLog() {
    S.log.end = Date.now();
    S.log.activeMs = ES.core.clock.activeMs();
    var copy = U.copy(S.log), rows = S.rows;
    S.rows = [];
    store().update('log', function (r) { r.sessions = (r.sessions || []).filter(function (x) { return x.id !== copy.id; }).concat([copy]); });
    if (rows.length) store().update('trials', function (r) { r.rows = (r.rows || []).concat(rows); });
  }
  function pbText(exId, pbs) {
    return (pbs || []).map(function (p) { return ES.ui.w.dialText(exId, p.dial, p.m); }).filter(Boolean).join(' · ');
  }
  function fallbackEntry(set, extra) {
    var counts = {};
    set.results.forEach(function (r) { if (r.focus) counts[r.focus] = (counts[r.focus] || 0) + 1; });
    var last = set.results[set.results.length - 1], end = {};
    if (last && last.focus && last.level != null) end[last.focus] = last.level;
    return { ex: set.exId, n: extra.n != null ? extra.n | 0 : set.results.length,
      correct: extra.correct != null ? extra.correct | 0 : set.results.filter(function (r) { return r.correct; }).length,
      focus: Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0] || '', end: end, pb: false };
  }
  /** Close the current set (also from a custom view's done(result)) and show its results. */
  function finishSet(extra) {
    var set = currentSet();
    if (!set || set.finished) return;
    set.finished = true;
    extra = extra || {};
    set.activeMs = Math.max(0, ES.core.clock.activeMs() - set.activeStart);
    var entry = null;
    if (set.sc && typeof E().flow.end === 'function') { try { entry = E().flow.end(set.sc); } catch (e) { report('flow.end', e); } }
    else if (extra.ex && extra.n != null) entry = U.copy(extra);
    if (!entry) entry = fallbackEntry(set, extra);
    entry.activeMs = set.activeMs;
    if (set.plan.kind && set.plan.kind !== 'normal') entry.kind = set.plan.kind;
    set.entry = entry;
    set.pb = set.pb || !!entry.pb;
    S.log.sets.push(entry);
    ES.ui.inSet = false;
    if (!set.demo) saveLearner();
    writeLog();
    if (ES.core.playtest.enabled()) {
      var lr = set.results[set.results.length - 1];
      ES.core.playtest.setDone({ ex: set.exId, n: entry.n, correct: entry.correct, activeMs: set.activeMs, level: lr ? lr.level : null, demo: !!set.demo });
    }
    if (entry.pb) ES.hooks.emit('pb', { exId: set.exId, pbs: entry.pbs || [], title: 'New personal best', text: pbText(set.exId, entry.pbs) });
    if (!set.demo && E().plateau && typeof E().plateau.check === 'function') {
      try {
        var pl = E().plateau.check(set.exId);
        if (pl) { set.plateau = pl; ES.hooks.emit('plateau', { exId: set.exId, reason: pl.reason, breaker: pl.breaker, text: pl.breaker && pl.breaker.text }); saveLearner(); }
      } catch (e) { report('plateau', e); }
    }
    ES.hooks.emit('set:done', { set: entry, index: set.index, session: S.id, results: set.results.slice(), demo: !!set.demo });
    ES.core.router.go('results', { set: set.index }, { replace: true });
  }
  /** End the running set early (from the pause sheet). */
  function endSetEarly() {
    var set = currentSet();
    if (!set) return;
    if (set.sc) set.sc.pending = null;
    if (!set.results.length) { set.finished = true; ES.ui.inSet = false; S.sets = S.sets.slice(0, set.index); finish(); return; }
    set.n = set.results.length;
    finishSet();
  }
  function next() { if (!S) return; if (S.setIndex + 1 < S.sets.length) beginSet(S.setIndex + 1); else finish(); }
  function finish() {
    if (!S) return;
    ES.ui.inSet = false;
    ES.core.clock.resume('away');
    if (!S.done) {
      S.done = true;
      writeLog();
      ES.core.clock.stop();
      ES.hooks.emit('session:done', { session: U.copy(S.log), demo: !!S.demo });
    }
    ES.core.router.go('results', { done: true }, { replace: true });
  }
  function abandon() { if (S && !S.done) { ES.ui.inSet = false; if (S.log.sets.length) finish(); else { S.done = true; ES.core.clock.stop(); } } }

  ES.hooks.on('pb', function () { var set = currentSet(); if (set && active()) set.pb = true; });
  ES.hooks.on('store:changed', function (ev) {
    if (ev && ev.source !== 'local' && (ev.key === 'learner' || ev.key === '*') && !ES.ui.inSet) syncLearner();
  });
  ES.hooks.on('app:ready', syncLearner);

  ES.ui.session = { active: active, state: state, start: start, beginSet: beginSet, afterTutorial: afterTutorial, currentSet: currentSet,
    exInfo: exInfo, makeTrial: makeTrial, scorer: scorer, plainScorer: plainScorer, record: record, skip: skip, levelText: levelText, finishSet: finishSet,
    endSetEarly: endSetEarly, next: next, finish: finish, abandon: abandon, runnable: runnable, engineReady: engineReady,
    needsTutorial: needsTutorial, realAvailable: realAvailable, syncLearner: syncLearner, NAMES: NAMES };
})(window.ES, window);
