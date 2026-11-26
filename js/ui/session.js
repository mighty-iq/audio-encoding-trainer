/* ES.ui.session — one training session: plan → sets → results → log (PLAN §7; CONTRACTS §5, §7, §11).
   Real trials run as soon as the engine and the audio engine are present (planner, controller, items[ex],
   score, audio.render/play); until then a demo session of tone trials keeps the flow testable. Writes happen
   between trials and at set ends, never during a stimulus. While a set runs, ES.ui.inSet is true and every
   Chimera invitation waits for the screen between sets. */
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
  function engineReady(exId) {
    var E = ES.engine, A = ES.audio;
    return !!(E && E.controller && typeof E.controller.next === 'function' && E.items && E.items[exId] &&
      typeof E.items[exId].make === 'function' && typeof E.score === 'function' && A && typeof A.render === 'function' && typeof A.play === 'function');
  }
  function runnable(exId) {
    var ex = ES.ex[exId];
    if (ex && ex.view === 'custom') return typeof ex.custom === 'function';
    return engineReady(exId);
  }
  function exInfo(exId) {
    if (exId === 'demo') return ES.ui.demo.ex;
    var ex = ES.ex[exId] || {};
    return { id: exId, name: ex.name || NAMES[exId] || exId, short: ex.short || '', bet: ex.bet || '', betNew: !!ex.betNew,
      view: ex.view || 'keyword', feedback: ex.feedback || 'standard', tutorial: ex.tutorial || null, custom: ex.custom, tips: ex.tips || null };
  }
  function settings() { return store().peek('profile').settings || {}; }

  function buildPlan() {
    var P = ES.engine.planner;
    if (P && typeof P.session === 'function') {
      try {
        var p = P.session({ mode: settings().mode || 'edge', sessionMin: settings().sessionMin || 15, now: Date.now(),
          log: store().peek('log'), learner: store().peek('learner'), headphones: !!settings().headphones });
        var sets = (p && p.sets || []).filter(function (s) { return s && runnable(s.exId); });
        if (sets.length) return { sets: sets, demo: false };
      } catch (e) { report('planner', e); }
    }
    return { sets: ES.ui.demo.plan().sets, demo: true };
  }

  function active() { return !!(S && !S.done); }
  function state() { return S; }
  function currentSet() { return S ? S.sets[S.setIndex] : null; }

  /** Start a session (call from the Start tap, so sound can unlock). */
  function start() {
    var plan = buildPlan();
    S = { id: U.uid('s'), start: Date.now(), mode: settings().mode || 'edge', demo: plan.demo, setIndex: 0, done: false,
      demoTmr: 6, rows: [], log: null,
      sets: plan.sets.map(function (p, i) {
        return { index: i, exId: p.exId, n: Math.max(1, p.trials | 0 || 20), plan: p, results: [], pb: false, activeStart: 0, plateau: null, demo: plan.demo };
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
    var t = store().peek('profile').tutorials || {};
    return !t[exId];
  }
  function beginSet(i) {
    if (!S || !S.sets[i]) { finish(); return; }
    S.setIndex = i;
    var set = S.sets[i];
    set.activeStart = ES.core.clock.activeMs();
    if (needsTutorial(set.exId)) { ES.ui.inSet = false; ES.core.router.go('tutorial', { exId: set.exId, set: i }, { replace: i > 0 }); return; }
    ES.ui.inSet = true;
    ES.core.router.go('play', { set: i }, { replace: i > 0 });
  }
  /** After a tutorial run inside a session: start the set it was guarding. */
  function afterTutorial() {
    if (!active()) return false;
    var set = currentSet();
    set.activeStart = ES.core.clock.activeMs();
    ES.ui.inSet = true;
    ES.core.router.go('play', { set: S.setIndex }, { replace: true });
    return true;
  }

  function makeTrial() {
    var set = currentSet(), i = set.results.length, seed = S.id + ':' + set.index + ':' + i + ':' + (set.skips || 0);
    var rng = ES.core.rng(seed);
    if (set.demo || set.exId === 'demo') {
      var last2 = set.results.slice(-2), anchor = (i > 0 && i % 5 === 4) || (last2.length === 2 && !last2[0].correct && !last2[1].correct);
      return ES.ui.demo.make(rng, { tmr: anchor ? Math.min(ES.ui.demo.MAX_TMR, S.demoTmr + 6) : S.demoTmr, twoSlots: i % 3 === 2, anchor: anchor });
    }
    var learner = store().peek('learner');
    var ctx = { mode: S.mode, rng: rng.fork('controller'), recent: (learner.recent || {})[set.exId] || [], breadth: (learner.breadth || {})[set.exId] || 0,
      set: set.plan, index: i, prev: set.results.slice(-5), headphones: !!settings().headphones };
    var setting = ES.engine.controller.next(set.exId, ctx);
    var trial = ES.engine.items[set.exId].make(rng.fork('items'), setting, ctx);
    if (trial.seed == null) trial.seed = seed;
    if (!trial.setting) trial.setting = setting;
    if (!trial.ex) trial.ex = set.exId;
    return trial;
  }
  function scorer(trial) {
    if (trial && trial.meta && trial.meta.demo) return ES.ui.demo.score;
    return function (t, r) { return ES.engine.score(t, r); };
  }
  function focusLevel(trial) {
    var s = trial && trial.setting;
    return s && s.focus && s.dials && typeof s.dials[s.focus] === 'number' ? s.dials[s.focus] : null;
  }
  function levelText(trial) {
    var s = trial && trial.setting;
    if (!s || !s.focus) return '';
    if (trial.meta && trial.meta.demo) return ES.ui.demo.levelText(s.dials.tmr);
    var defs = (ES.engine.dials || {})[trial.ex] || [], d = defs.filter(function (x) { return x.id === s.focus; })[0];
    var v = s.dials ? s.dials[s.focus] : null;
    if (v == null) return '';
    if (d && d.kind === 'ord' && d.levels) return (d.label ? d.label + ' · ' : '') + (d.levels[Math.round(v)] || v);
    var unit = (d && d.unit) || '', val = unit === 'dB' ? U.fmtDb(v) : unit === 'm' ? U.fmtM(v) : U.fmtNum(v, 1) + (unit ? ' ' + unit : '');
    return (d && d.label ? d.label + ' · ' : '') + val;
  }
  /** Record an answered trial (called at answer time, between stimuli). */
  function record(trial, result, resp) {
    var set = currentSet();
    if (!set) return;
    var rec = { correct: !!result.correct, prop: +result.prop || 0, intrusions: result.intrusions | 0, focus: trial.setting && trial.setting.focus || '', level: focusLevel(trial) };
    set.results.push(rec);
    S.rows.push([Date.now(), trial.ex || set.exId, rec.focus, rec.level, rec.correct ? 1 : 0, U.round(rec.prop, 3), rec.intrusions]);
    if (trial.meta && trial.meta.demo) S.demoTmr = ES.ui.demo.nextTmr(S.demoTmr, rec.correct);
    else if (ES.engine.learner && typeof ES.engine.learner.update === 'function') {
      try { ES.engine.learner.update(trial, result); } catch (e) { report('learner', e); }
    }
    ES.hooks.emit('trial:done', { trial: trial, result: result, response: resp, set: set.index, index: set.results.length - 1, demo: !!set.demo });
  }
  function skip(trial, err) {
    var set = currentSet();
    set.skips = (set.skips || 0) + 1;
    report('skip', err || 'skipped');
    if (set.skips >= 3 && !set.demo) { set.demo = true; set.exId = 'demo'; ES.ui.toast('Trials could not be prepared, so this set continues with demo trials.'); }
  }
  function writeLog() {
    S.log.end = Date.now();
    S.log.activeMs = ES.core.clock.activeMs();
    var copy = U.copy(S.log), rows = S.rows;
    S.rows = [];
    store().update('log', function (r) { r.sessions = (r.sessions || []).filter(function (x) { return x.id !== copy.id; }).concat([copy]); });
    if (rows.length) store().update('trials', function (r) { r.rows = (r.rows || []).concat(rows); });
  }
  function endLevels(set) {
    var L = ES.engine.learner;
    if (!set.demo && L && typeof L.summary === 'function') {
      try { var sm = L.summary(set.exId); if (sm && typeof sm === 'object') return U.copy(sm); } catch (e) { report('summary', e); }
    }
    var last = set.results[set.results.length - 1], out = {};
    if (last && last.focus && last.level != null) out[last.focus] = last.level;
    return out;
  }
  /** Close the current set (also from a custom view's done(result)) and show its results. */
  function finishSet(extra) {
    var set = currentSet();
    if (!set || set.finished) return;
    set.finished = true;
    extra = extra || {};
    var n = extra.n != null ? extra.n | 0 : set.results.length;
    var correct = extra.correct != null ? extra.correct | 0 : set.results.filter(function (r) { return r.correct; }).length;
    set.activeMs = Math.max(0, ES.core.clock.activeMs() - set.activeStart);
    var focusCounts = {};
    set.results.forEach(function (r) { if (r.focus) focusCounts[r.focus] = (focusCounts[r.focus] || 0) + 1; });
    var focus = set.plan.focus || Object.keys(focusCounts).sort(function (a, b) { return focusCounts[b] - focusCounts[a]; })[0] || '';
    var entry = { ex: set.exId, n: n, correct: correct, focus: focus, end: endLevels(set), pb: !!set.pb, activeMs: set.activeMs };
    S.log.sets.push(entry);
    ES.ui.inSet = false;
    writeLog();
    if (ES.core.playtest.enabled()) {
      var last = set.results[set.results.length - 1];
      ES.core.playtest.setDone({ ex: set.exId, n: n, correct: correct, activeMs: set.activeMs, level: last ? last.level : null, demo: !!set.demo });
    }
    if (!set.demo && ES.engine.plateau && typeof ES.engine.plateau.check === 'function') {
      try {
        var pl = ES.engine.plateau.check(set.exId);
        if (pl) { set.plateau = pl; ES.hooks.emit('plateau', { exId: set.exId, reason: pl.reason, breaker: pl.breaker, text: pl.breaker && pl.breaker.text }); }
      } catch (e) { report('plateau', e); }
    }
    ES.hooks.emit('set:done', { set: entry, index: set.index, session: S.id, results: set.results.slice(), demo: !!set.demo });
    ES.core.router.go('results', { set: set.index }, { replace: true });
  }
  /** End the running set early (from the pause sheet). */
  function endSetEarly() {
    var set = currentSet();
    if (!set) return;
    if (!set.results.length) { set.finished = true; ES.ui.inSet = false; S.sets = S.sets.slice(0, set.index); finish(); return; }
    set.n = set.results.length;
    finishSet();
  }
  function next() { if (!S) return; if (S.setIndex + 1 < S.sets.length) beginSet(S.setIndex + 1); else finish(); }
  function finish() {
    if (!S) return;
    ES.ui.inSet = false;
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

  ES.ui.session = { active: active, state: state, start: start, beginSet: beginSet, afterTutorial: afterTutorial, currentSet: currentSet,
    exInfo: exInfo, makeTrial: makeTrial, scorer: scorer, record: record, skip: skip, levelText: levelText, finishSet: finishSet,
    endSetEarly: endSetEarly, next: next, finish: finish, abandon: abandon, runnable: runnable, engineReady: engineReady,
    needsTutorial: needsTutorial, NAMES: NAMES };
})(window.ES, window);
