/* ES.ui.answerPanel(slots, onDone, opts) — the closed-set answer panel (CONTRACTS §3, §5).
   1–3 slots, each a 2–3 column grid of option keys. A key acts on pointer release when the finger moved
   less than 8 px (a scroll or a slip selects nothing); keyboard: 1–9 picks in the active slot, arrows move,
   Enter/Space picks. Until the last slot is filled, a pick in any slot can be changed; then the panel locks
   and calls onDone({ picks:[value], idx:[index], rts:[ms] }). mark(result) shows ✓/✕ glyphs with words.
   slots: [{ label, options:[string|number|{id|value, label}] }]   opts: { enabled:true, hints:true } */
(function (ES, win) {
  'use strict';
  var U = ES.core.util;
  var MOVE_PX = 8;

  function norm(o) {
    if (o !== null && typeof o === 'object') {
      var v = o.id != null ? o.id : o.value != null ? o.value : o.label;
      return { value: String(v), label: String(o.label != null ? o.label : v) };
    }
    return { value: String(o), label: String(o) };
  }
  function cols(n) { return n <= 2 || n === 4 ? 2 : 3; }
  function glyph(kind) {
    var d = kind === 'right' || kind === 'partial' ? 'M4 12.5 L9.5 18 L20 6.5' : 'M6 6 L18 18 M18 6 L6 18';
    return U.svg('svg', { class: 'glyph glyph-' + kind, viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' },
      U.svg('path', { d: d }));
  }
  ES.ui.glyph = glyph;

  function answerPanel(slots, onDone, opts) {
    opts = opts || {};
    slots = (slots || []).slice(0, 3);
    var root = U.el('div', { class: 'answer', role: 'group', 'aria-label': opts.label || 'Your answer', 'data-slots': String(slots.length), tabindex: '-1' });
    var picks = slots.map(function () { return -1; }), rts = slots.map(function () { return null; });
    var enabled = false, locked = false, enabledAt = 0, track = null, lastUp = 0, keyBound = false;
    var groups = [];

    slots.forEach(function (s, si) {
      var options = (s.options || []).map(norm);
      var labelId = U.uid('slot');
      var grid = U.el('div', { class: 'answer-grid cols-' + cols(options.length), 'data-n': String(options.length), role: 'radiogroup', 'aria-labelledby': labelId });
      var keys = options.map(function (o, oi) {
        var k = U.el('button', { type: 'button', class: 'key', role: 'radio', 'aria-checked': 'false', 'data-slot': si, 'data-opt': oi,
          tabindex: '-1' }, [
          opts.hints !== false && oi < 9 ? U.el('span', { class: 'key-n', 'aria-hidden': 'true' }, String(oi + 1)) : null,
          U.el('span', { class: 'key-t' }, o.label),
          U.el('span', { class: 'key-mark' }),
          U.el('span', { class: 'sr-only key-sr' })
        ]);
        grid.appendChild(k);
        return k;
      });
      var box = U.el('div', { class: 'answer-slot', 'data-slot': si }, [
        slots.length > 1 || s.label ? U.el('div', { class: 'answer-label', id: labelId }, s.label || 'Answer ' + (si + 1)) : U.el('span', { class: 'sr-only', id: labelId }, 'Answer'),
        grid
      ]);
      root.appendChild(box);
      groups.push({ box: box, grid: grid, keys: keys, options: options });
    });

    function activeSlot() { for (var i = 0; i < picks.length; i++) if (picks[i] < 0) return i; return picks.length - 1; }
    function paint() {
      var act = activeSlot(), live = enabled && !locked;
      groups.forEach(function (g, si) {
        g.box.classList.toggle('is-active', live && si === act && slots.length > 1);
        // roving tab stop while answers are open; before they open no key takes the focus (FRESH-B D4)
        var stop = live ? (picks[si] >= 0 ? picks[si] : 0) : -1;
        g.keys.forEach(function (k, oi) {
          var on = picks[si] === oi;
          k.classList.toggle('picked', on);
          k.setAttribute('aria-checked', on ? 'true' : 'false');
          k.setAttribute('aria-disabled', live ? 'false' : 'true');
          k.setAttribute('tabindex', oi === stop ? '0' : '-1');
        });
      });
      root.classList.toggle('is-locked', locked);
      root.classList.toggle('is-enabled', live);
      if (!live) root.classList.remove('hover-ok');
    }
    function choose(key) {
      if (!enabled || locked || !key) return;
      var si = +key.getAttribute('data-slot'), oi = +key.getAttribute('data-opt');
      if (!(si >= 0) || !(oi >= 0)) return;
      picks[si] = oi;
      rts[si] = Math.round(Date.now() - enabledAt);
      var next = activeSlot();
      if (picks.every(function (p) { return p >= 0; })) {
        locked = true;
        paint();
        unbindKeys();
        var resp = { picks: picks.map(function (p, i) { return groups[i].options[p].value; }), idx: picks.slice(), rts: rts.slice() };
        if (typeof onDone === 'function') onDone(resp);
        return;
      }
      paint();
      // the focus follows the choice: a ring never stays on a key that was not picked (FRESH-A #7)
      var inPanel = document.activeElement && root.contains(document.activeElement);
      if (inPanel && groups[next]) focusKey(groups[next].keys[0]);
    }
    function focusKey(k) {
      if (!k) return;
      groups.forEach(function (g) { g.keys.forEach(function (x) { x.setAttribute('tabindex', x === k ? '0' : '-1'); }); });
      U.focus(k);
    }

    root.addEventListener('pointerdown', function (e) {
      var key = e.target.closest && e.target.closest('.key');
      if (!key || !enabled || locked || (e.pointerType === 'mouse' && e.button !== 0)) return;
      track = { id: e.pointerId, x: e.clientX, y: e.clientY, key: key, moved: false };
      key.classList.add('pressed');
    });
    root.addEventListener('pointermove', function (e) {
      // hover shows only after the pointer moves over open answers, so a resting pointer never pre-marks a key
      if (enabled && !locked && e.pointerType === 'mouse') root.classList.add('hover-ok');
      if (!track || e.pointerId !== track.id || track.moved) return;
      var dx = e.clientX - track.x, dy = e.clientY - track.y;
      if (dx * dx + dy * dy > MOVE_PX * MOVE_PX) { track.moved = true; track.key.classList.remove('pressed'); }
    });
    function endTrack(e, cancel) {
      if (!track || e.pointerId !== track.id) return;
      var t = track;
      track = null;
      t.key.classList.remove('pressed');
      if (cancel || t.moved) return;
      var dx = e.clientX - t.x, dy = e.clientY - t.y;
      if (dx * dx + dy * dy > MOVE_PX * MOVE_PX) return;
      var under = e.pointerType === 'mouse' && e.target.closest ? e.target.closest('.key') : t.key;
      if (under !== t.key) return;
      lastUp = Date.now();
      choose(t.key);
    }
    root.addEventListener('pointerup', function (e) { endTrack(e, false); });
    root.addEventListener('pointercancel', function (e) { endTrack(e, true); });
    root.addEventListener('click', function (e) {
      var key = e.target.closest && e.target.closest('.key');
      if (!key) return;
      e.preventDefault();
      if (Date.now() - lastUp < 700) return;   // already handled on pointer release
      if (e.detail > 0 && e.pointerType && e.pointerType !== '') return; // a pointer click that moved too far
      choose(key);                              // keyboard (Enter/Space) or assistive technology
    });

    function onKey(e) {
      if (!enabled || locked || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      if (ES.ui.sheetOpen && ES.ui.sheetOpen()) return;
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      var si = activeSlot(), g = groups[si];
      if (/^[1-9]$/.test(e.key)) {
        var k = g && g.keys[+e.key - 1];
        if (k) { e.preventDefault(); choose(k); }
        return;
      }
      var cur = document.activeElement && document.activeElement.closest ? document.activeElement.closest('.key') : null;
      if ((!cur || !root.contains(cur)) && /^Arrow/.test(e.key) && g) { e.preventDefault(); focusKey(g.keys[Math.max(0, picks[si])]); return; }
      if (!cur || !root.contains(cur)) return;
      var csi = +cur.getAttribute('data-slot'), coi = +cur.getAttribute('data-opt'), cg = groups[csi], c = cols(cg.keys.length);
      var to = { ArrowRight: coi + 1, ArrowLeft: coi - 1, ArrowDown: coi + c, ArrowUp: coi - c }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      focusKey(cg.keys[U.clamp(to, 0, cg.keys.length - 1)]);
    }
    function bindKeys() { if (!keyBound) { document.addEventListener('keydown', onKey); keyBound = true; } }
    function unbindKeys() { if (keyBound) { document.removeEventListener('keydown', onKey); keyBound = false; } }

    var handle = {
      el: root,
      enable: function () { if (locked) return; enabled = true; enabledAt = Date.now(); bindKeys(); paint(); },
      disable: function () { enabled = false; paint(); },
      lock: function () { locked = true; unbindKeys(); paint(); },
      isLocked: function () { return locked; },
      picks: function () { return picks.slice(); },
      /** Answers open: the panel takes the focus (not a key, which would look picked); number keys answer, arrows
          and Tab reach the keys. */
      focusFirst: function () { U.focus(root); },
      /** result.slots[i] = { picked, answer, correct } (values as strings or numbers). */
      mark: function (result) {
        locked = true; unbindKeys();
        var rs = (result && result.slots) || [];
        groups.forEach(function (g, si) {
          var r = rs[si] || {};
          var ans = r.answer != null ? String(r.answer) : slots[si].answer != null ? String(slots[si].answer) : null;
          g.keys.forEach(function (k, oi) {
            var v = g.options[oi].value, picked = picks[si] === oi, isAns = ans !== null && v === ans;
            var mark = k.querySelector('.key-mark'), sr = k.querySelector('.key-sr');
            U.clear(mark);
            k.classList.remove('right', 'wrong', 'answer');
            if (picked && isAns) { k.classList.add('right'); mark.appendChild(glyph('right')); sr.textContent = ' (your answer, right)'; }
            else if (picked) { k.classList.add('wrong'); mark.appendChild(glyph('wrong')); sr.textContent = ' (your answer, wrong)'; }
            else if (isAns) { k.classList.add('answer'); mark.appendChild(glyph('right')); sr.textContent = ' (the right answer)'; }
            else sr.textContent = '';
          });
        });
        paint();
      },
      /** Show notes under keys, e.g. foil types in a tutorial example: notes[slot][value] = text. */
      annotate: function (notes) {
        groups.forEach(function (g, si) {
          var n = notes && notes[si];
          if (!n) return;
          g.keys.forEach(function (k, oi) {
            var t = n[g.options[oi].value];
            var old = k.querySelector('.key-note');
            if (old) old.parentNode.removeChild(old);
            if (t) k.appendChild(U.el('span', { class: 'key-note' }, t));
          });
        });
      },
      destroy: function () { unbindKeys(); enabled = false; if (root.parentNode) root.parentNode.removeChild(root); }
    };
    if (opts.enabled !== false) handle.enable(); else paint();
    return handle;
  }

  ES.ui.answerPanel = answerPanel;
})(window.ES, window);
