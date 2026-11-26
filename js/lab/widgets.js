/* ES.lab.ui widgets — answer panels of the probe runner: the 5 × 10 word matrix (one word per column, then Done),
   the digit keypad (three digits; Backspace corrects; the third digit sends after a short pause), a choice list
   (one tap sends) and a 1–5 rating scale with an optional "did not happen". Every panel starts disabled and
   stays static while sound plays; enable() is called once the sound has ended. Keys are ≥ 44 px, act on click
   (keyboard and assistive technology included) and carry their state as text (aria-checked), not colour alone.
   MIT licence. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var L = ES.lab = ES.lab || {};
  var W = L.ui = L.ui || {};
  function U() { return ES.core.util; }
  function key(label, attrs) {
    var a = { type: 'button', class: 'lab-key' };
    Object.keys(attrs || {}).forEach(function (k) { a[k] = attrs[k]; });
    return U().el('button', a, label);
  }
  function setDisabled(list, off) { list.forEach(function (b) { b.disabled = !!off; }); }

  /** columns: [{id, label, options:[word]}] → onDone({picks:[word|null]}) */
  W.matrixPanel = function (columns, onDone) {
    var u = U(), picks = columns.map(function () { return null; }), all = [], cols = [];
    var grid = u.el('div', { class: 'lab-matrix', role: 'group', 'aria-label': 'One word in each column' });
    var done = u.el('button', { type: 'button', class: 'btn btn-primary btn-wide lab-done', 'data-lab-done': '', disabled: true }, 'Done');
    columns.forEach(function (c, ci) {
      var hid = u.uid('mh'), col = u.el('div', { class: 'lab-mcol', role: 'radiogroup', 'aria-labelledby': hid, 'data-slot': c.id });
      col.appendChild(u.el('div', { class: 'lab-mhead', id: hid }, c.label));
      var keys = c.options.map(function (w, oi) {
        var b = key(w, { role: 'radio', 'aria-checked': 'false', 'data-col': String(ci), 'data-word': w, tabindex: oi === 0 ? '0' : '-1' });
        b.addEventListener('click', function () { if (!b.disabled) choose(ci, oi); });
        b.addEventListener('keydown', function (e) { nav(e, ci, oi); });
        col.appendChild(b); all.push(b);
        return b;
      });
      cols.push(keys); grid.appendChild(col);
    });
    function choose(ci, oi) {
      picks[ci] = columns[ci].options[oi];
      cols[ci].forEach(function (b, j) { b.setAttribute('aria-checked', j === oi ? 'true' : 'false'); b.setAttribute('tabindex', j === oi ? '0' : '-1'); });
      done.disabled = picks.some(function (p) { return p === null; });
    }
    function nav(e, ci, oi) {
      var to = null;
      if (e.key === 'ArrowDown') to = [ci, Math.min(cols[ci].length - 1, oi + 1)];
      else if (e.key === 'ArrowUp') to = [ci, Math.max(0, oi - 1)];
      else if (e.key === 'ArrowRight') to = [Math.min(cols.length - 1, ci + 1), oi];
      else if (e.key === 'ArrowLeft') to = [Math.max(0, ci - 1), oi];
      if (!to) return;
      e.preventDefault();
      var b = cols[to[0]][Math.min(to[1], cols[to[0]].length - 1)];
      try { b.focus({ preventScroll: true }); } catch (x) { /* ignore */ }
    }
    done.addEventListener('click', function () {
      if (done.disabled) return;
      setDisabled(all, true); done.disabled = true;
      onDone({ picks: picks.slice() });
    });
    var el = u.el('div', { class: 'lab-answer', 'data-lab-panel': 'matrix' }, [grid, done]);
    setDisabled(all, true);
    return { el: el, enable: function () { setDisabled(all, false); try { cols[0][0].focus({ preventScroll: true }); } catch (x) { /* ignore */ } },
      disable: function () { setDisabled(all, true); done.disabled = true; }, destroy: function () {} };
  };

  /** Three digits → onDone({digits:['3','7','1']}). */
  W.keypad = function (len, onDone) {
    var u = U(), got = [], timer = null, enabled = false;
    var boxes = [], shown = u.el('div', { class: 'lab-digits', 'aria-live': 'polite', 'aria-label': 'Digits entered' });
    for (var i = 0; i < len; i++) { var s = u.el('span', { class: 'mono' }, '·'); boxes.push(s); shown.appendChild(s); }
    var pad = u.el('div', { class: 'lab-pad', role: 'group', 'aria-label': 'Digit keypad' }), keys = [];
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', ''].forEach(function (d) {
      if (d === '') { pad.appendChild(u.el('span')); return; }
      var b = key(d, { 'data-digit': d === '⌫' ? 'back' : d, 'aria-label': d === '⌫' ? 'Delete the last digit' : d });
      b.addEventListener('click', function () { if (!b.disabled) press(d === '⌫' ? 'back' : d); });
      pad.appendChild(b); keys.push(b);
    });
    function paint() { boxes.forEach(function (b, j) { b.textContent = got[j] != null ? got[j] : '·'; }); }
    function press(d) {
      if (!enabled) return;
      if (d === 'back') { if (timer) { clearTimeout(timer); timer = null; } got.pop(); paint(); return; }
      if (got.length >= len) return;
      got.push(d); paint();
      if (got.length === len) timer = setTimeout(function () { timer = null; send(); }, 450);
    }
    function send() { enabled = false; setDisabled(keys, true); unbind(); onDone({ digits: got.slice() }); }
    function onKey(e) {
      if (!enabled || (ES.ui.sheetOpen && ES.ui.sheetOpen())) return;
      if (/^[0-9]$/.test(e.key)) { e.preventDefault(); press(e.key); }
      else if (e.key === 'Backspace') { e.preventDefault(); press('back'); }
    }
    var bound = false;
    function bind() { if (!bound) { root.document.addEventListener('keydown', onKey); bound = true; } }
    function unbind() { if (bound) { root.document.removeEventListener('keydown', onKey); bound = false; } }
    setDisabled(keys, true);
    return { el: u.el('div', { class: 'lab-answer', 'data-lab-panel': 'keypad' }, [shown, pad]),
      enable: function () { enabled = true; setDisabled(keys, false); bind(); },
      disable: function () { enabled = false; setDisabled(keys, true); unbind(); },
      destroy: function () { if (timer) clearTimeout(timer); unbind(); } };
  };

  /** One tap sends: onDone({pick: option}). opts.list → one column (long labels). */
  W.choice = function (options, onDone, opts) {
    opts = opts || {};
    var u = U(), keys = [], sent = false;
    var box = u.el('div', { class: 'lab-choice' + (opts.list ? ' is-list' : ''), role: 'group', 'aria-label': opts.label || 'Your answer' });
    options.forEach(function (o, i) {
      var b = key(o, { 'data-choice': String(o), 'data-i': String(i) });
      b.addEventListener('click', function () {
        if (b.disabled || sent) return;
        sent = true; setDisabled(keys, true); b.setAttribute('aria-pressed', 'true');
        onDone({ pick: o, idx: i });
      });
      box.appendChild(b); keys.push(b);
    });
    function onKey(e) {
      if (sent || keys[0].disabled || (ES.ui.sheetOpen && ES.ui.sheetOpen())) return;
      if (/^[1-9]$/.test(e.key) && keys[+e.key - 1]) { e.preventDefault(); keys[+e.key - 1].click(); }
    }
    var bound = false;
    setDisabled(keys, true);
    return { el: u.el('div', { class: 'lab-answer', 'data-lab-panel': 'choice' }, box),
      enable: function () { setDisabled(keys, false); if (!bound) { root.document.addEventListener('keydown', onKey); bound = true; } try { keys[0].focus({ preventScroll: true }); } catch (x) { /* ignore */ } },
      disable: function () { setDisabled(keys, true); },
      destroy: function () { if (bound) root.document.removeEventListener('keydown', onKey); } };
  };

  /** 1–5 scale → onDone({v: 1..5 | null}). opts: {lo, hi, none} */
  W.scale = function (onDone, opts) {
    opts = opts || {};
    var u = U(), keys = [], sent = false;
    var row = u.el('div', { class: 'lab-scale', role: 'group', 'aria-label': (opts.lo || '1') + ' to ' + (opts.hi || '5') });
    [1, 2, 3, 4, 5].forEach(function (v) {
      var b = key(String(v), { 'data-scale': String(v), 'aria-label': v + (v === 1 ? ' (' + (opts.lo || '') + ')' : v === 5 ? ' (' + (opts.hi || '') + ')' : '') });
      b.addEventListener('click', function () { if (!sent) { sent = true; setDisabled(keys, true); onDone({ v: v }); } });
      row.appendChild(b); keys.push(b);
    });
    var parts = [row, u.el('div', { class: 'lab-scale-ends' }, [u.el('span', null, '1 ' + (opts.lo || '')), u.el('span', null, (opts.hi || '') + ' 5')])];
    if (opts.none) {
      var nb = u.el('button', { type: 'button', class: 'btn btn-ghost btn-wide', 'data-scale': 'none' }, opts.none);
      nb.addEventListener('click', function () { if (!sent) { sent = true; setDisabled(keys, true); onDone({ v: null }); } });
      parts.push(nb); keys.push(nb);
    }
    return { el: u.el('div', { class: 'lab-answer', 'data-lab-panel': 'scale' }, parts), enable: function () { setDisabled(keys, false); },
      disable: function () { setDisabled(keys, true); }, destroy: function () {} };
  };
})(typeof window !== 'undefined' ? window : globalThis);
