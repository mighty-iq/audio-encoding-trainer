/* Free-mode picker in Settings (RV C06). A Free session trains one exercise the player picks. Each of its dials can
   be set by hand within the dial's range, or left alone to play at a comfortable level. Under each dial a coach
   line shows the player's current edge on it (the learner's estimate), and one tap copies the coach's levels.
   Saved as profile.settings.free = {exId, dials: {dialId: value}}: continuous dials in their unit, ordinal dials as
   a level index. The session hands the dials to the engine as overrides (ES.engine.flow.start {overrides}).
   Exercises with their own screen (Seek) set their own levels and are not offered here. */
(function (ES) {
  'use strict';
  var U = ES.core.util;
  function E() { return ES.engine; }
  function settings() { return ES.core.store.peek('profile').settings || {}; }
  function current() {
    var f = settings().free;
    return f && typeof f === 'object' ? { exId: String(f.exId || ''), dials: f.dials && typeof f.dials === 'object' ? U.copy(f.dials) : {} } : { exId: '', dials: {} };
  }
  function save(f) { ES.core.store.update('profile', function (r) { r.settings = r.settings || {}; r.settings.free = { exId: f.exId, dials: f.dials }; }); }

  /** Exercises a Free session can run with hand-set dials: runnable now, shown in the trial view. */
  function choices() {
    var I = ES.ui.sessionInfo;
    if (!I || !I.realAvailable()) return [];
    return (E().exercises || []).filter(function (id) { return I.runnable(id) && I.exInfo(id).view !== 'custom' && E().dials && E().dials[id]; });
  }
  function snapTo(d, v) {
    if (d.kind === 'ord') return Math.max(d.min, Math.min(d.max, Math.round(v)));
    var st = d.step || 1, x = Math.round((v - d.min) / st) * st + d.min;
    return Math.round(Math.max(d.min, Math.min(d.max, x)) * 100) / 100;
  }
  /** The exercise's dials on this device (headphone-only dials need headphones), with the coach's level for each. */
  function dialsFor(exId) {
    var L = E().learner, sum = null, by = {};
    try { sum = L && typeof L.summary === 'function' ? L.summary(exId, { headphones: !!settings().headphones }) : null; } catch (e) { sum = null; }
    ((sum && sum.dials) || []).forEach(function (s) { by[s.id] = s; });
    return ((E().dials && E().dials[exId]) || []).filter(function (d) { return !d.family && (sum ? !!by[d.id] : !d.requires); }).map(function (d) {
      var s = by[d.id], coach = s ? snapTo(d, d.kind === 'ord' ? s.level : s.m) : snapTo(d, d.comfort != null ? d.comfort : d.min);
      return { d: d, coach: coach, known: !!(s && s.n) };
    });
  }
  function valText(exId, id, v) { var t = ES.ui.w.dialText(exId, id, v); return t.slice(t.indexOf(': ') + 2); }

  function dialRow(exId, it, f, onSave) {
    var d = it.d, set = f.dials[d.id] !== undefined, val = U.el('span', { class: 'free-val', 'data-free-val': '' });
    var row = U.el('div', { class: 'free-dial', 'data-free-dial': d.id });
    var ctl, clear = ES.ui.button('Clear', { small: true, kind: 'ghost', attrs: { 'data-free-clear': '' }, onClick: function () { delete f.dials[d.id]; onSave(true); } });
    function paint() {
      var on = f.dials[d.id] !== undefined;
      val.textContent = on ? valText(exId, d.id, f.dials[d.id]) : 'Comfortable';
      row.classList.toggle('is-auto', !on);
      clear.hidden = !on;
    }
    if (d.kind === 'ord') {
      ctl = U.el('select', { 'aria-label': d.label, 'data-free-input': '' }, [U.el('option', { value: '' }, 'Comfortable (not set)')].concat(
        (d.levels || []).map(function (lab, i) { return U.el('option', { value: String(i) }, lab); })));
      ctl.value = set ? String(f.dials[d.id]) : '';
      ctl.addEventListener('change', function () { if (ctl.value === '') delete f.dials[d.id]; else f.dials[d.id] = +ctl.value; paint(); onSave(false); });
    } else {
      ctl = U.el('input', { type: 'range', min: String(d.min), max: String(d.max), step: String(d.step || 1), 'aria-label': d.label, 'data-free-input': '' });
      ctl.value = String(set ? f.dials[d.id] : it.coach);
      ctl.addEventListener('input', function () { f.dials[d.id] = snapTo(d, +ctl.value); paint(); });
      ctl.addEventListener('change', function () { f.dials[d.id] = snapTo(d, +ctl.value); paint(); onSave(false); });
    }
    row.appendChild(U.el('strong', null, d.label));
    row.appendChild(val);
    row.appendChild(ctl);
    row.appendChild(U.el('span', { class: 'free-coach', 'data-free-coach': '' }, 'Coach suggests ' + valText(exId, d.id, it.coach) +
      (it.known ? ' (your edge now).' : ' (a starting level; your edge shows after a few trials).')));
    row.appendChild(clear);
    paint();
    return row;
  }

  /** The picker element; shown under the mode list while Free is the mode. */
  function el() {
    var box = U.el('div', { class: 'free-pick', 'data-free-pick': '' });
    function render() {
      U.clear(box);
      var list = choices(), f = current();
      box.appendChild(U.el('strong', null, 'Free mode: what to train'));
      if (!list.length) { box.appendChild(U.el('p', { class: 'hint' }, 'Free mode needs the training sounds; the demo plays tones only.')); return; }
      if (list.indexOf(f.exId) < 0) { f = { exId: list[0], dials: {} }; save(f); }
      var chips = U.el('div', { class: 'seg', role: 'radiogroup', 'aria-label': 'Exercise for Free mode' });
      list.forEach(function (id) {
        chips.appendChild(U.el('button', { type: 'button', role: 'radio', class: 'seg-btn', 'aria-checked': String(id === f.exId), 'data-free-ex': id,
          on: { click: function () { if (id !== f.exId) { save({ exId: id, dials: {} }); render(); } } } }, ES.ui.sessionInfo.exInfo(id).name));
      });
      box.appendChild(U.el('div', { class: 'chips' }, chips));
      box.appendChild(U.el('p', { class: 'hint' }, 'Set any dial yourself, or leave it at a comfortable level. Sessions in Free mode train only this exercise.'));
      var rows = dialsFor(f.exId);
      function onSave(again) { save(f); if (again) render(); }
      rows.forEach(function (it) { box.appendChild(dialRow(f.exId, it, f, onSave)); });
      box.appendChild(U.el('div', { class: 'row-buttons' }, [
        ES.ui.button('Use the coach’s levels', { small: true, attrs: { 'data-free-coach-all': '' }, onClick: function () {
          rows.forEach(function (it) { f.dials[it.d.id] = it.coach; }); onSave(true); ES.ui.toast('Dials set to the coach’s levels'); } }),
        ES.ui.button('Clear all', { small: true, kind: 'ghost', attrs: { 'data-free-clear-all': '' }, onClick: function () { f.dials = {}; onSave(true); } })
      ]));
    }
    render();
    return box;
  }

  ES.ui.settingsFree = { el: el, choices: choices, dialsFor: dialsFor, current: current };
})(window.ES);
