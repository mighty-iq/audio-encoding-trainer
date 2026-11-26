/* ES.ui.tutorial — the two-minute start (CONTRACTS §11). Plays an exercise's tutorial.steps:
   caption (on screen ≥ minMs, default 3 s; the next action is always stated), demo (a worked example with the
   answer marked and every foil labelled; it covers each foil type the practice trials use), practice (real
   answers with feedback; the right answer sits in a different key each time). Ends with the Chimera link.
   Screen 'tutorial' params: { exId, set } inside a session, or { exId, resume:true } from a set's Help.
   Exercise hooks (exA request; guarded): ES.ex[id].tutorialTrial(step, stepIndex, rng) builds demo/practice
   trials (it then owns forcing and key positions); ES.ex[id].openHelp() behind "How it works" on the first
   caption. Step fields beyond §11: title, next (button label), notes (foil wording), replayOnMiss (true or
   replay indices). A wrong practice answer offers "Try again" with a new trial of the same step (3 tries). */
(function (ES, win) {
  'use strict';
  var U = ES.core.util;
  var cur = null;

  function stepsOf(exId) {
    var info = ES.ui.session.exInfo(exId);
    return (info.tutorial && info.tutorial.steps || []).filter(function (s) { return s && /^(caption|demo|practice)$/.test(s.kind); });
  }
  function comfortDials(exId) {
    var defs = (ES.engine.dials || {})[exId] || [], out = {};
    defs.forEach(function (d) { if (d && d.id != null) out[d.id] = d.comfort != null ? d.comfort : d.start; });
    return out;
  }
  function hook(exId) { var X = ES.ex[exId]; return X && typeof X.tutorialTrial === 'function' ? X : null; }
  function makeTrial(exId, step, key, stepIndex) {
    var force = step.force || {};
    var rng = ES.core.rng('tutorial:' + exId + ':' + key);
    if (exId === 'demo') return ES.ui.demo.make(rng, { dials: force.dials, warmup: true });
    var X = hook(exId);
    if (X) {
      var own = X.tutorialTrial(step, stepIndex, rng);
      if (own) { if (own.seed == null) own.seed = rng.seed; if (!own.ex) own.ex = exId; return own; }
    }
    var setting = { dials: Object.assign(comfortDials(exId), force.dials || {}), focus: null, anchor: true, warmup: true };
    var t = ES.engine.items[exId].make(rng, setting, { tutorial: true, force: force.items, mode: 'tutorial' });
    if (t && !t.setting) t.setting = setting;
    if (t && t.seed == null) t.seed = rng.seed;
    if (t && !t.ex) t.ex = exId;
    return t;
  }
  function answerIdx(t) {
    var s = t && t.question && t.question.slots && t.question.slots[0];
    if (!s) return -1;
    return (s.options || []).map(function (o) { return String(o && typeof o === 'object' ? (o.id != null ? o.id : o.value) : o); }).indexOf(String(s.answer));
  }
  function foilTypes(t) {
    var set = {};
    ((t && t.question && t.question.slots) || []).forEach(function (s) { Object.keys(s.foils || {}).forEach(function (k) { set[s.foils[k]] = true; }); });
    return set;
  }
  /** Prepare every step's trial up front: practice answers in new keys, the example covering the practice's foils. */
  function prepare(exId, steps) {
    var usedIdx = [], need = {}, trials = [];
    steps.forEach(function (st, k) {
      if (st.kind !== 'practice') return;
      var t = null;
      for (var tries = 0; tries < (hook(exId) ? 1 : 16); tries++) {
        t = makeTrial(exId, st, k + ':' + tries, k);
        if (usedIdx.indexOf(answerIdx(t)) < 0) break;
      }
      usedIdx.push(answerIdx(t));
      Object.keys(foilTypes(t)).forEach(function (f) { need[f] = true; });
      trials[k] = t;
    });
    steps.forEach(function (st, k) {
      if (st.kind !== 'demo') return;
      var t = null;
      for (var tries = 0; tries < (hook(exId) ? 1 : 24); tries++) {
        t = makeTrial(exId, st, k + ':' + tries, k);
        var have = foilTypes(t);
        if (Object.keys(need).every(function (f) { return have[f]; })) break;
      }
      trials[k] = t;
    });
    return trials;
  }

  function mount(root, params) {
    var exId = params.exId || 'demo', steps = stepsOf(exId), info = ES.ui.session.exInfo(exId), k = 0, trials;
    try { trials = prepare(exId, steps); } catch (e) {
      if (win.console) console.error('[tutorial]', e);
      steps = steps.filter(function (s) { return s.kind === 'caption'; });
      trials = [];
    }
    var total = steps.length + 1;
    cur = { timer: null, view: null, aborted: false };
    var count = U.el('span', { class: 'mono tut-count' });
    var host = U.el('div', { class: 'tut-host' });
    var skip = U.el('button', { type: 'button', class: 'btn btn-ghost btn-small', 'data-skip-tutorial': '', on: { click: function () { finish(true); } } }, 'Skip');
    root.appendChild(U.el('div', { class: 'tut trial' }, [
      U.el('header', { class: 'trial-bar tut-bar' }, [
        U.el('div', { class: 'tb-mid' }, [U.el('div', { class: 'tb-line' }, [U.el('span', { class: 'tb-title' }, 'How to play: ' + info.name), count])]),
        ES.core.playtest.enabled() ? ES.core.playtest.noteButton(function () { return 'tutorial:' + exId + ':' + (k + 1); }, { cls: 'tb-note' }) : null,
        skip]),
      host]));
    document.documentElement.classList.add('in-trial');

    function clearTimer() { if (cur && cur.timer) { clearTimeout(cur.timer); cur.timer = null; } }
    function show() {
      if (!cur || cur.aborted) return;
      clearTimer();
      count.textContent = 'Step ' + Math.min(k + 1, total) + ' of ' + total;
      if (k >= steps.length) { last(); return; }
      var st = steps[k];
      if (st.kind === 'caption') caption(st);
      else runTrial(st, trials[k]);
    }
    function caption(st) {
      var minMs = Math.max(3000, st.minMs | 0), auto = st.then === 'auto', label = st.next || 'Continue', X = ES.ex[exId];
      var nextNote = U.el('p', { class: 'tut-next' }, auto ? 'Next: the following step starts by itself.' : 'Next: tap ' + label + '.');
      var btn = ES.ui.button(label, { kind: 'primary', wide: true, disabled: true, attrs: { 'data-continue': '' }, onClick: function () { k++; show(); } });
      var howBtn = k === 0 && X && typeof X.openHelp === 'function' ? ES.ui.button('How it works', { kind: 'ghost', small: true, attrs: { 'data-how': '' },
        onClick: function () { try { X.openHelp(); } catch (e) { /* ignore */ } } }) : null;
      U.clear(host);
      host.appendChild(U.el('div', { class: 'tut-card card', 'data-step': 'caption' }, [st.title ? U.el('h2', { class: 'h-small' }, st.title) : null,
        U.el('p', { class: 'tut-text' }, st.text), nextNote, auto ? null : btn, howBtn]));
      cur.timer = setTimeout(function () { if (auto) { k++; show(); } else { btn.disabled = false; try { btn.focus({ preventScroll: true }); } catch (e) { /* ignore */ } } }, minMs);
    }
    function runTrial(st, trial, attempt) {
      if (!trial) { k++; show(); return; }
      attempt = attempt || 1;
      U.clear(host);
      var cap = U.el('p', { class: 'tut-caption', 'data-step': st.kind }, [st.text || '', ' ', U.el('span', { class: 'tut-next-inline' },
        st.kind === 'demo' ? 'Next: listen; the answer is marked after the sound.' : 'Next: listen, then tap your answer.')]);
      var slot = U.el('div', { class: 'tut-trial' });
      host.appendChild(cap);
      host.appendChild(slot);
      var label = st.next || 'Continue', practice = st.kind === 'practice';
      var view = ES.ui.trialView.run(slot, { trial: trial, mode: practice ? 'practice' : 'demo', autoNext: false,
        nextLabel: label, answerNote: exId === 'demo' ? 'the red voice' : 'the answer', score: ES.ui.session.scorer(trial), foilWords: st.notes,
        nextLabelFor: function (r) { return practice && r && !r.correct && attempt < 3 ? 'Try again' : label; },
        autoReplays: function (r) { return practice && r && !r.correct && st.replayOnMiss ? (Array.isArray(st.replayOnMiss) ? st.replayOnMiss : [0]) : []; } });
      cur.view = view;
      view.done.then(function (out) {
        if (!cur || cur.aborted || (out && out.aborted)) return;
        if (practice && out && out.result && !out.result.correct && attempt < 3) {
          runTrial(st, makeTrial(exId, st, k + ':again:' + attempt, k), attempt + 1);
          return;
        }
        k++; show();
      });
    }
    function last() {
      U.clear(host);
      host.appendChild(U.el('div', { class: 'tut-card card', 'data-step': 'end' }, [
        U.el('p', { class: 'tut-text' }, 'You are ready.'),
        U.el('p', null, ['Earshot was built by the Chimera community on Discord. Join us: ', ES.core.chimera.linkEl('discord.gg/chmr', { where: 'tutorial' })]),
        U.el('p', { class: 'tut-next' }, params.resume ? 'Next: tap Back to the set.' : 'Next: tap Start the set.'),
        ES.ui.button(params.resume ? 'Back to the set' : 'Start the set', { kind: 'primary', wide: true, attrs: { 'data-continue': '' }, onClick: function () { finish(false); } })
      ]));
    }
    function finish(skipped) {
      if (!cur || cur.aborted) return;
      clearTimer();
      if (cur.view) cur.view.abort();
      cur.aborted = true;
      ES.core.store.update('profile', function (r) { r.tutorials = r.tutorials || {}; r.tutorials[exId] = true; });
      ES.hooks.emit('tutorial:done', { exId: exId, skipped: !!skipped });
      var s = ES.ui.session;
      if (!params.resume && s.active() && s.currentSet() && s.currentSet().exId === exId && !s.currentSet().results.length) s.afterTutorial();
      else ES.core.router.back();
    }
    show();
  }
  function unmount() {
    if (cur) { cur.aborted = true; if (cur.timer) clearTimeout(cur.timer); if (cur.view) cur.view.abort(); }
    cur = null;
    document.documentElement.classList.remove('in-trial');
  }

  if (!ES.ui.screens.tutorial) ES.ui.screens.tutorial = { mount: mount, unmount: unmount, deepLink: false };
  ES.ui.tutorial = { steps: stepsOf, prepare: prepare, needs: function (exId) { return ES.ui.session.needsTutorial(exId); } };
})(window.ES, window);
