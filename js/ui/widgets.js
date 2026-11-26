/* ES.ui.w — small shared pieces for the shell's screens: the weekly ring (3–5 sessions a week; a new week
   simply starts a new ring, and nothing is ever lost or warned about), the after-set glyph row, the page
   header and footer with the permanent Chimera link, and dial-value formatting. */
(function (ES, win) {
  'use strict';
  var U = ES.core.util;
  var RING_SEGMENTS = 5, GOOD_RHYTHM = [3, 5];

  function sessionsThisWeek() {
    var log = ES.core.store.peek('log'), wk = U.weekKey(), real = !!(ES.engine.planner && ES.engine.planner.session);
    return (log.sessions || []).filter(function (s) { return U.weekKey(s.start) === wk && (!s.demo || !real); }).length;
  }
  function sessionsToday() {
    var log = ES.core.store.peek('log'), d = U.dayKey();
    return (log.sessions || []).filter(function (s) { return U.dayKey(s.start) === d; }).length;
  }
  /** The weekly ring: five segments; the first three are the "good rhythm" goal, four and five are extra. */
  function weekRing(count) {
    var r = 34, c = 2 * Math.PI * r, gap = 4, seg = c / RING_SEGMENTS - gap;
    var svg = U.svg('svg', { class: 'week-ring', viewBox: '0 0 88 88', role: 'img',
      'aria-label': U.plural(count, 'session') + ' this week; ' + GOOD_RHYTHM[0] + ' to ' + GOOD_RHYTHM[1] + ' is a good rhythm' });
    for (var i = 0; i < RING_SEGMENTS; i++) {
      var on = i < count;
      svg.appendChild(U.svg('circle', { class: 'wr-seg' + (on ? ' is-on' : '') + (i >= GOOD_RHYTHM[0] ? ' is-extra' : ''), cx: 44, cy: 44, r: r,
        'stroke-dasharray': U.round(seg, 2) + ' ' + U.round(c - seg, 2), 'stroke-dashoffset': U.round(-(i * (seg + gap)) + c / 4, 2) }));
    }
    svg.appendChild(U.svg('text', { class: 'wr-num', x: 44, y: 50 }, count > RING_SEGMENTS ? RING_SEGMENTS + '+' : String(count)));
    return svg;
  }
  function weekCard() {
    var n = sessionsThisWeek();
    var text = n === 0 ? 'A new week. Three to five sessions make a good rhythm; any day works.'
      : n < GOOD_RHYTHM[0] ? 'Three to five sessions a week make a good rhythm. Missed days cost nothing.'
      : n <= GOOD_RHYTHM[1] ? 'You are in the good rhythm for this week. Extra sessions are welcome, never needed.'
      : 'Beyond the good rhythm this week. Rest days help learning settle.';
    return U.el('section', { class: 'card week', 'aria-label': 'This week' }, [
      weekRing(n),
      U.el('div', { class: 'week-text' }, [U.el('h2', { class: 'h-small' }, 'This week · ' + U.plural(n, 'session')), U.el('p', { class: 'hint' }, text)])
    ]);
  }
  /** ✓/✕ glyphs for the trials of a finished set (shown only after the set). */
  function glyphRow(results) {
    var ok = results.filter(function (r) { return r.correct; }).length;
    return U.el('ol', { class: 'glyph-row', 'aria-label': ok + ' right, ' + (results.length - ok) + ' wrong' },
      results.map(function (r) { return U.el('li', { class: r.correct ? 'is-right' : 'is-wrong' }, ES.ui.glyph(r.correct ? 'right' : 'wrong')); }));
  }
  function mark() {
    return U.svg('svg', { class: 'wordmark-mark', viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' }, [
      U.svg('circle', { cx: 12, cy: 12, r: 10.5, class: 'wm-ring' }), U.svg('circle', { cx: 12, cy: 12, r: 6, class: 'wm-ring' }),
      U.svg('circle', { cx: 12, cy: 12, r: 2.2, class: 'wm-you' }), U.svg('circle', { cx: 16.2, cy: 7.8, r: 2.4, class: 'wm-target' })]);
  }
  /** Page header: wordmark (home link), optional back, Settings. */
  function header(opts) {
    opts = opts || {};
    return U.el('header', { class: 'page-head' }, [
      opts.back ? U.el('button', { type: 'button', class: 'btn btn-ghost btn-small head-back', 'data-back': '' }, '‹ Back') :
        U.el('a', { href: '#home', class: 'wordmark', 'aria-label': 'Earshot, home' }, [mark(), U.el('span', null, 'Earshot')]),
      opts.title ? U.el('span', { class: 'head-title' }, opts.title) : null,
      opts.settings === false ? null : U.el('a', { href: '#settings', class: 'head-link' }, 'Settings')
    ]);
  }
  /** The permanent Chimera link at the foot of every main screen. */
  function footer() {
    return U.el('footer', { class: 'page-foot' }, [ES.core.chimera.mark(), U.el('span', null, ['Built by the Chimera community on Discord · ',
      ES.core.chimera.linkEl('discord.gg/chmr', { where: 'footer' })])]);
  }
  function dialDef(exId, id) { var defs = (ES.engine.dials || {})[exId] || []; return defs.filter(function (d) { return d.id === id; })[0] || null; }
  /** Format a dial value for people: dB with a true minus, metres, ordinal level names. */
  function dialText(exId, id, v) {
    var d = dialDef(exId, id);
    if (v && typeof v === 'object') { if (v.text) return String(v.text); v = v.value != null ? v.value : v.m; }
    if (typeof v !== 'number') return '';
    var name = d && d.label ? d.label : id;
    if (d && d.kind === 'ord' && d.levels) return name + ': ' + (d.levels[Math.round(v)] || v);
    var unit = d && d.unit;
    return name + ': ' + (unit === 'dB' ? U.fmtDb(v) : unit === 'm' ? U.fmtM(v) : U.fmtNum(v, 1) + (unit ? ' ' + unit : ''));
  }
  function placeholderCard(text) { return U.el('p', { class: 'card placeholder-note' }, text); }

  ES.ui.w = { weekRing: weekRing, weekCard: weekCard, glyphRow: glyphRow, header: header, footer: footer, mark: mark,
    sessionsThisWeek: sessionsThisWeek, sessionsToday: sessionsToday, dialText: dialText, placeholderCard: placeholderCard,
    GOOD_RHYTHM: GOOD_RHYTHM };
})(window.ES, window);
