/* ES.ui.sessionStore — the running session kept for a reload (RV M11), for js/ui/session.js.
   save(S) writes the plan, the results so far and each open set's flow snapshot to the shared `session` record
   (localStorage, between trials only) and to this tab's own copy (sessionStorage). load() picks what to restore:
   this tab's copy after a reload (it survives even when the browser dropped the last localStorage writes, as headless
   Chromium did under load), else the shared record unless another tab is running it (written by a tab that is not
   this one in the last two minutes) or it is older than 12 hours. clear(id) forgets this tab's copy and the shared
   record when it holds that session (any session without an id). sessionStorage blocked: the shared record alone. */
(function (ES, win) {
  'use strict';
  var RESUME_MS = 12 * 3600000, OTHER_TAB_MS = 120000, TAB_ID = 'earshot.session', TAB_REC = 'earshot.session.rec';
  function store() { return ES.core.store; }
  function E() { return ES.engine; }
  function report(where, e) {
    if (win.console) console.error('[session ' + where + ']', e);
    if (ES._keepError) ES._keepError({ at: Date.now(), kind: 'session', msg: where + ': ' + String(e && e.message || e), stack: String(e && e.stack || '').slice(0, 800) });
  }
  function tabMark(rec) { try { win.sessionStorage.setItem(TAB_ID, rec.id); win.sessionStorage.setItem(TAB_REC, JSON.stringify(rec)); } catch (e) { /* blocked or full */ } }
  /** true / false, or null where sessionStorage is blocked. */
  function tabHas(id) { try { return win.sessionStorage.getItem(TAB_ID) === id; } catch (e) { return null; } }
  function tabRec() {
    try {
      var t = JSON.parse(win.sessionStorage.getItem(TAB_REC) || 'null');
      return t && typeof t === 'object' && t.id ? ES.core.storeSchema.sanitizeRecord('session', t) : null;
    } catch (e) { return null; }
  }
  function tabClear() { try { win.sessionStorage.removeItem(TAB_ID); win.sessionStorage.removeItem(TAB_REC); } catch (e) { /* blocked */ } }

  function snapOf(x) {
    if (x.finished) return null;
    if (!x.sc) return x.snap || null;
    try { return typeof E().flow.snapshot === 'function' ? E().flow.snapshot(x.sc) : null; } catch (e) { report('flow.snapshot', e); return null; }
  }
  /** Store the running session S (call between trials, never during a stimulus). */
  function save(S) {
    var now = ES.core.clock.activeMs(), planCopy = ES.ui.sessionInfo.planCopy;
    var rec = { v: 1, id: S.id, at: Date.now(), start: S.start, mode: S.mode, kind: S.kind || '', title: S.title || '', demo: !!S.demo,
      setIndex: S.setIndex, demoTmr: S.demoTmr, notes: S.notes || [], done: S.doneRoute || null, log: S.log, rows: S.rows, learn: S.learn === false ? false : undefined,
      noResume: S.sets.some(function (x) { return typeof x.plan.make === 'function'; }) || undefined,   // fixed trials cannot be rebuilt
      sets: S.sets.map(function (x) {
        return { index: x.index, exId: x.exId, n: x.n, planned: x.planned, plan: planCopy(x.plan), results: x.results, finished: !!x.finished,
          activeMs: x.finished ? x.activeMs || 0 : Math.max(0, now - x.activeStart), entry: x.entry || null, partial: !!x.partial,
          replacements: x.replacements || 0, salt: x.salt || 0, introShown: !!x.introShown, demo: !!x.demo, snap: snapOf(x) };
      }) };
    store().set('session', rec);
    tabMark(rec);
  }
  /** The stored session to offer after a reload, or null. */
  function load() {
    var r = store().peek('session'), t = tabRec();
    // this tab's own copy wins: the shared record is missing, older, or another tab's session
    if (t && (!r || !r.id || r.id !== t.id || (t.at || 0) > (r.at || 0))) r = t;
    if (!r || !r.id || r.noResume || !Array.isArray(r.sets) || !r.sets.length) return null;
    if (Date.now() - (r.at || 0) > RESUME_MS) { clear(r.id); return null; }
    if (tabHas(r.id) === false && Date.now() - (r.at || 0) < OTHER_TAB_MS) return null;   // another tab is running it
    return r;
  }
  function clear(id) {
    tabClear();
    try { var cur = store().peek('session').id; if (cur && (!id || cur === id)) store().set('session', { v: 1, id: '' }); } catch (e) { /* ignore */ }
  }

  ES.ui.sessionStore = { save: save, load: load, clear: clear, RESUME_MS: RESUME_MS };
})(window.ES, window);
