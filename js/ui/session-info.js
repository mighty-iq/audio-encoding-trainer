/* ES.ui.sessionInfo — stateless helpers for js/ui/session.js: what a session can run (exercise names and info,
   whether the engine, the audio engine and voice clips are installed, the Lab's context for the planner), and pure
   helpers for trials and set records (level text, fallback set record, plain plan copies). */
(function (ES, win) {
  'use strict';
  var NAMES = { crowd: 'Crowd', far: 'Far', strange: 'Strange voices', repair: 'Repair', echo: 'Echo', seek: 'Seek', voices: 'Voices', missions: 'Missions' };
  function report(where, e) {
    if (win.console) console.error('[session ' + where + ']', e);
    if (ES._keepError) ES._keepError({ at: Date.now(), kind: 'session', msg: where + ': ' + String(e && e.message || e), stack: String(e && e.stack || '').slice(0, 800) });
  }
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
      view: ex.view || 'keyword', feedback: ex.feedback || 'standard', tutorial: ex.tutorial || null, custom: ex.custom, tips: ex.tips || null,
      helpBody: ex.helpBody, openHelp: ex.openHelp, mod: ES.ex[exId] || null };
  }
  /** What the Lab tells the planner and the set runner ({weakest: probeId|null}). */
  function labInfo() {
    try {
      if (ES.lab && typeof ES.lab.context === 'function') return ES.lab.context();
      if (ES.lab && typeof ES.lab.forPlanner === 'function') return ES.lab.forPlanner();
    } catch (e) { report('lab', e); }
    return null;
  }
  // ---- pure helpers for trials and set records
  function focusLevel(trial) {
    var s = trial && trial.setting;
    return s && s.focus && s.dials && typeof s.dials[s.focus] === 'number' ? s.dials[s.focus] : null;
  }
  /** The level line in the trial bar ("Other voices · −3 dB"). */
  function levelText(trial) {
    var s = trial && trial.setting;
    if (trial && trial.meta && trial.meta.levelText && !(trial.meta.demo)) return String(trial.meta.levelText);
    if (!s || !s.focus) return '';
    if (trial.meta && trial.meta.demo) return ES.ui.demo.levelText(s.dials.tmr);
    var v = s.dials ? s.dials[s.focus] : null;
    return v == null ? '' : ES.ui.w.dialText(trial.ex, s.focus, v).replace(': ', ' · ');
  }
  function pbText(exId, pbs) {
    return (pbs || []).map(function (p) { return ES.ui.w.dialText(exId, p.dial, p.m); }).filter(Boolean).join(' · ');
  }
  /** A set record from the shell's own tally (sets without an engine flow: demo, fixed trials, custom views). */
  function fallbackEntry(set, extra) {
    var counts = {};
    set.results.forEach(function (r) { if (r.focus) counts[r.focus] = (counts[r.focus] || 0) + 1; });
    var last = set.results[set.results.length - 1], end = {};
    if (last && last.focus && last.level != null) end[last.focus] = last.level;
    return { ex: set.exId, n: extra.n != null ? extra.n | 0 : set.results.length,
      correct: extra.correct != null ? extra.correct | 0 : set.results.filter(function (r) { return r.correct; }).length,
      focus: Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0] || '', end: end, pb: false };
  }
  /** A planner set without its functions (make), as plain JSON for the stored session. */
  function planCopy(p) {
    var o = {};
    Object.keys(p || {}).forEach(function (k) { if (typeof p[k] !== 'function') o[k] = p[k]; });
    try { return JSON.parse(JSON.stringify(o)); } catch (e) { return { exId: p && p.exId }; }
  }
  ES.ui.sessionInfo = { NAMES: NAMES, flowOk: flowOk, engineReady: engineReady, runnable: runnable, audioData: audioData,
    realAvailable: realAvailable, exInfo: exInfo, labInfo: labInfo, focusLevel: focusLevel, levelText: levelText, pbText: pbText,
    fallbackEntry: fallbackEntry, planCopy: planCopy };
})(window.ES, window);
