/* Screen 'map' — the Night out as an earshot map: three lines leave "you" (Many voices up-right, Far & echoey
   up-left, the Phone line down); each venue sits on a ring, one ring per step; the ink "reach" along a line ends at
   the furthest open venue. Open venues show your earshot there in real units, the next venue its opening mark,
   later ones only their names. Below (or beside, on wide screens) the same facts as a list. Static picture. */
(function (ES, win) {
  'use strict';
  var G = ES.game;
  function U() { return ES.core.util; }
  function el(t, a, c) { return U().el(t, a, c); }
  function svg(t, a, c) { return U().svg(t, a, c); }
  var VB_W = 340, YOU = { x: 170, y: 300 }, VB_H = 380;

  function pos(lineId, step) {
    var D = G.data, l = D.line(lineId), m = D.MAP, r = lineId === 'phone' ? m.phoneR : m.ring0 + step * m.ring, a = l.deg * Math.PI / 180;
    return { x: Math.round((YOU.x + Math.sin(a) * r) * 10) / 10, y: Math.round((YOU.y - Math.cos(a) * r) * 10) / 10, r: r };
  }
  function shortMark(s) {                       // "≤ 0 dB" / "≥ 4 m" for the next venue's opening mark on the map
    var from = s.from && s.from.venue, d = from ? G.core.dialDef(from.head.ex, from.head.dial) : null;
    if (!d) return '';
    return (d.dir < 0 ? '≤ ' : '≥ ') + s.atText;
  }
  function valueOf(s) {
    if (s.open) return s.earshot && s.earshot.status !== 'none' ? s.earshot.text : '–';
    if (s.next) return shortMark(s);
    return '';
  }
  function aria(s) {
    if (s.open) return s.name + ', open, ' + (s.earshot && s.earshot.status !== 'none' ? 'your earshot ' + s.earshot.text : 'not measured yet');
    return s.name + ', ' + (s.next ? 'next to open: ' + s.rule : 'opens later');
  }

  function drawMap(st) {
    var D = G.data, root = svg('svg', { class: 'g-map-svg', viewBox: '0 0 ' + VB_W + ' ' + VB_H, role: 'group', 'aria-label': 'Night out map' });
    var maxStep = 6;
    for (var k = 0; k < maxStep; k++) {                 // rings: arcs across the upper sector, one per step
      var r = D.MAP.ring0 + k * D.MAP.ring, a0 = -35 * Math.PI / 180, a1 = 35 * Math.PI / 180;
      var p0 = { x: YOU.x + Math.sin(a0) * r, y: YOU.y - Math.cos(a0) * r }, p1 = { x: YOU.x + Math.sin(a1) * r, y: YOU.y - Math.cos(a1) * r };
      root.appendChild(svg('path', { class: 'gm-ring', d: 'M' + p0.x.toFixed(1) + ' ' + p0.y.toFixed(1) + ' A' + r + ' ' + r + ' 0 0 1 ' + p1.x.toFixed(1) + ' ' + p1.y.toFixed(1) }));
    }
    D.LINES.forEach(function (l) {
      var vs = st.filter(function (s) { return s.line === l.id; }), last = vs[vs.length - 1], end = pos(l.id, last.step);
      root.appendChild(svg('line', { class: 'gm-ray', x1: YOU.x, y1: YOU.y, x2: end.x, y2: end.y }));
      var reach = vs.filter(function (s) { return s.open; }).pop();
      if (reach) { var rp = pos(l.id, reach.step); root.appendChild(svg('line', { class: 'gm-reach', x1: YOU.x, y1: YOU.y, x2: rp.x, y2: rp.y })); }
    });
    root.appendChild(svg('text', { class: 'gm-line-name', x: 6, y: 14 }, '↖ ' + D.line('far').name));
    root.appendChild(svg('text', { class: 'gm-line-name', x: VB_W - 6, y: 14, 'text-anchor': 'end' }, D.line('crowd').name + ' ↗'));
    root.appendChild(svg('circle', { class: 'gm-you-ring', cx: YOU.x, cy: YOU.y, r: 14 }));
    root.appendChild(svg('circle', { class: 'gm-you', cx: YOU.x, cy: YOU.y, r: 5 }));
    root.appendChild(svg('text', { class: 'gm-you-label', x: YOU.x + 26, y: YOU.y + 4 }, 'you'));
    st.forEach(function (s) {
      var p = pos(s.line, s.step), cls = s.open ? 'is-open' : s.next ? 'is-next' : 'is-locked';
      var outside = s.line === 'phone' || s.step < 2, right = s.line === 'crowd' ? outside : s.line === 'phone' ? true : !outside;
      var tx = right ? p.x + 12 : p.x - 12, anchor = right ? 'start' : 'end';
      var g = svg('g', { class: 'gm-node ' + cls, tabindex: '0', role: 'link', 'aria-label': aria(s), 'data-venue': s.id });
      g.appendChild(svg('circle', { class: 'gm-focus', cx: p.x, cy: p.y, r: 12, fill: 'none', stroke: 'none' }));
      g.appendChild(svg('rect', { class: 'gm-hit', x: right ? p.x - 16 : p.x - 96, y: p.y - 18, width: 112, height: 36 }));
      g.appendChild(svg('circle', { class: 'gm-dot', cx: p.x, cy: p.y, r: s.open ? 6.5 : 6 }));
      g.appendChild(svg('text', { class: 'gm-name', x: tx, y: p.y - 2, 'text-anchor': anchor }, s.name));
      var val = valueOf(s);
      if (val) g.appendChild(svg('text', { class: 'gm-val', x: tx, y: p.y + 13, 'text-anchor': anchor }, val));
      function go() { ES.core.router.go('venue', { id: s.id }); }
      g.addEventListener('click', go);
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      root.appendChild(g);
    });
    return root;
  }

  function lineCard(l, st) {
    var V = G.venues, rows = st.filter(function (s) { return s.line === l.id; });
    return el('section', { class: 'g-line', 'aria-label': l.name }, [el('h2', null, l.name), el('p', { class: 'g-note' }, l.what),
      rows.map(function (s) {
        var cls = 'g-vrow ' + (s.open ? 'is-open' : 'is-locked'), val;
        var none = s.open && !(s.earshot && s.earshot.status !== 'none');
        if (s.open) val = none ? 'not measured yet' : s.earshot.text;
        else val = s.next ? 'opens at ' + s.atText + (s.from ? ' at the ' + V.venueName(s.from.venue) : '') : 'later';
        return el('a', { href: '#venue', class: cls, 'data-go': 'venue', 'data-params': JSON.stringify({ id: s.id }), 'data-venue-row': s.id }, [
          el('span', null, [el('span', { class: 'g-vname' }, s.name), el('span', { class: 'g-vdesc' }, V.describe(s.venue.head))]),
          el('span', { class: 'g-vval' + (none ? ' is-none' : '') }, val), el('span', { class: 'g-varrow', 'aria-hidden': 'true' }, '›')]);
      })]);
  }

  function persistOpenings(st) {
    var fresh = st.filter(function (s) { return s.newly || (s.open && !s.openedAt && !s.venue.opens); });
    if (!fresh.length) return;
    var now = G.core.now();
    G.core.update(function (r) { fresh.forEach(function (s) { var sv = r.venues[s.id] = r.venues[s.id] || {}; if (!sv.open) sv.open = now; }); });
  }

  function mount(root) {
    var st = G.venues.state(), measured = st.some(function (s) { return s.earshot && s.earshot.status !== 'none'; });
    persistOpenings(st);
    var open = st.filter(function (s) { return s.open; }).length;
    root.appendChild(el('div', { class: 'wrap g-wrap g-map' }, [
      ES.ui.w.header({ back: true, title: 'Map' }),
      el('p', { class: 'eyebrow mono' }, 'The night out · ' + open + ' of ' + st.length + ' venues open'),
      el('h1', { class: 'h-mid' }, 'Your earshot, venue by venue'),
      el('p', { class: 'g-sub' }, measured ? 'Each number is the level where you get about 7 in 10 right at that venue. A venue opens when the one before it reaches its mark and it comes within your reach.'
        : 'Three venues are open from the start. Your earshot at each one appears after your first sets there: a number in decibels or metres, never a guess.'),
      el('div', { class: 'g-map-layout' }, [el('figure', { class: 'g-map-fig' }, drawMap(st)),
        el('div', { class: 'g-lines' }, G.data.LINES.map(function (l) { return lineCard(l, st); }))]),
      ES.ui.w.footer()
    ]));
    if (ES.core.playtest && ES.core.playtest.enabled()) setTimeout(function () { ES.core.playtest.sampleFrames('map', 1000); }, 400);
  }

  ES.ui.screens.map = { mount: mount, unmount: function () {} };
  G.map = { pos: pos, drawMap: drawMap };
})(window.ES, window);
