/* ES.lab.charts — the trend picture of one probe (dataviz method: one series, thin marks, hairline solid grid,
   the 90 % band as a wash, practice runs hollow, a solid baseline hairline, selective labels: only the latest value).
   "Better" is always up: for thresholds in dB (lower is better) the axis runs from worse at the bottom to better at
   the top; Rooms is drawn on its log-distance scale with metre labels. trend(info, {compact}) → {el}; compact is a
   sparkline for the overview cards (the whole card is the link); the full chart has a tooltip on hover and keyboard
   focus for every run, and table(info) is its table view. Labels are set with textContent. MIT licence. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var L = ES.lab = ES.lab || {};
  var C = L.charts = {};
  function U() { return ES.core.util; }
  function svg(tag, attrs, kids) { return U().svg(tag, attrs, kids); }
  function r1(x) { return Math.round(x * 10) / 10; }
  var DAY = 864e5;

  function niceStep(span, n) {
    var raw = span / Math.max(1, n), p = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  }
  function axisLabel(id, v) {
    if (id === 'rooms') { var m = L.probes.rooms.metres(v); return (m < 10 ? r1(m) : Math.round(m)) + '\u00a0m'; }
    var p = L.probes[id];
    if (p.unit === 'dB') return U().fmtNum(r1(v), 1);
    if (p.unit === '%') return Math.round(v) + '';
    return r1(v) + '';
  }
  function kindText(r) { return r.practice ? 'practice run' : r.kind === 'extra' ? 'extra run' : r.kind === 'retention' ? 'retention check' : r.kind === 'weekly' ? 'weekly check-in' : 'baseline run'; }

  /** info: {id, runs (normalised, oldest first), trend}; opts: {compact} */
  C.trend = function (info, opts) {
    opts = opts || {};
    var u = U(), id = info.id, P = L.probes[id], runs = info.runs || [], tr = info.trend || {};
    // the viewBox follows the container width, so 11 px labels stay 11 px on a phone
    var compact = !!opts.compact, W = compact ? 300 : Math.round(Math.max(300, Math.min(640, opts.width || 640)));
    var H = compact ? 64 : Math.round(Math.max(190, Math.min(240, W * 0.42)));
    var pad = compact ? { l: 4, r: 4, t: 6, b: 6 } : { l: 40, r: W < 420 ? 58 : 64, t: 20, b: 30 };
    var box = u.el('div', { class: 'lab-chart-box', 'data-lab-chart': id });
    if (!runs.length) { box.appendChild(u.el('p', { class: 'hint' }, 'No runs yet.')); return { el: box }; }
    var t0 = runs[0].at, days = runs.map(function (r) { return (r.at - t0) / DAY; });
    var xMax = Math.max(compact ? 14 : 28, days[days.length - 1] + 3);
    var vals = [];
    runs.forEach(function (r) { vals.push(r.est.m - (r.est.s || 0), r.est.m + (r.est.s || 0)); });
    var band = null;
    if (tr.ok && typeof tr.band === 'function') {
      band = [];
      var a = tr.tRef, b = tr.tLast;
      for (var k = 0; k <= 16; k++) { var t = a + (b - a) * k / 16, q = tr.band(t); band.push({ t: t, m: q.m, lo: q.lo, hi: q.hi }); vals.push(q.lo, q.hi); }
    }
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), span = Math.max(hi - lo, P.unit === '%' ? 10 : 1);
    lo -= span * 0.12; hi += span * 0.12;
    var up = P.better === -1;   // lower numbers are better: draw them higher
    var X = function (d) { return pad.l + (W - pad.l - pad.r) * d / xMax; };
    var Y = function (v) { var f = (v - lo) / (hi - lo); return up ? pad.t + (H - pad.t - pad.b) * f : H - pad.b - (H - pad.t - pad.b) * f; };
    var last = runs[runs.length - 1];
    var label = P.name + ': ' + u.plural(runs.length, 'run') + '; latest ' + L.exporter.showValue(id, last.est.m) +
      (tr.ok ? '; ' + (L.stats.VERDICT_TEXT[tr.verdict] || tr.verdict) : '');
    var g = svg('svg', { class: compact ? 'lab-spark' : 'lab-chart', viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': label, preserveAspectRatio: 'xMidYMid meet' });
    if (!compact) {
      var step = niceStep(hi - lo, 4), v0 = Math.ceil(lo / step) * step;
      for (var v = v0; v <= hi + 1e-9; v += step) {
        g.appendChild(svg('line', { class: 'lc-grid', x1: pad.l, x2: W - pad.r, y1: Y(v), y2: Y(v) }));
        g.appendChild(svg('text', { class: 'lc-axis', x: pad.l - 6, y: Y(v) + 4, 'text-anchor': 'end' }, axisLabel(id, v)));
      }
      for (var wk = 0; wk * 7 <= xMax; wk++) g.appendChild(svg('text', { class: 'lc-axis', x: X(wk * 7), y: H - 10, 'text-anchor': 'middle' }, 'wk ' + wk));
      g.appendChild(svg('text', { class: 'lc-axis', x: 2, y: 10, 'text-anchor': 'start' }, 'better ↑'));
    }
    var meas = runs.filter(function (r) { return !r.practice; }), nb = Math.min(P.core ? 2 : 1, meas.length);
    if (nb) {
      var base = L.stats.mean(meas.slice(0, nb).map(function (r) { return r.est.m; })), bx = X((meas[0].at - t0) / DAY);
      g.appendChild(svg('line', { class: 'lc-base', x1: bx, x2: W - pad.r, y1: Y(base), y2: Y(base) }));
      if (!compact) g.appendChild(svg('text', { class: 'lc-base-label', x: W - pad.r + 4, y: Y(base) + 4 }, 'baseline'));
    }
    if (band) {
      var top = band.map(function (q) { return X(q.t) + ',' + Y(up ? q.lo : q.hi); }), bot = band.slice().reverse().map(function (q) { return X(q.t) + ',' + Y(up ? q.hi : q.lo); });
      g.appendChild(svg('polygon', { class: 'lc-band', points: top.concat(bot).join(' ') }));
      g.appendChild(svg('polyline', { class: 'lc-line', points: band.map(function (q) { return X(q.t) + ',' + Y(q.m); }).join(' ') }));
    }
    var tip = compact ? null : u.el('div', { class: 'lab-tip', hidden: true, role: 'status' });
    runs.forEach(function (r, i) {
      var x = X(days[i]), y = Y(r.est.m);
      if (!compact && r.est.s) g.appendChild(svg('line', { class: 'lc-err', x1: x, x2: x, y1: Y(r.est.m - r.est.s), y2: Y(r.est.m + r.est.s) }));
      g.appendChild(svg('circle', { class: 'lc-pt' + (r.practice ? ' is-practice' : ''), cx: x, cy: y, r: compact ? 3.5 : 4.5 }));
      if (compact) return;
      var text = L.exporter.showValue(id, r.est.m), sub = 'Run ' + (i + 1) + ' · day ' + Math.round(days[i]) + ' · ' + kindText(r);
      var hit = svg('circle', { class: 'lc-hit', cx: x, cy: y, r: 12, tabindex: '0', role: 'button', 'aria-label': text + ', ' + sub, 'data-run': r.id || String(i) });
      var show = function () {
        tip.textContent = '';
        tip.appendChild(u.el('strong', null, text));
        if (r.est.s) tip.appendChild(u.el('span', null, 'give or take ' + axisDelta(id, r)));
        tip.appendChild(u.el('span', null, sub));
        tip.hidden = false;
        tip.style.left = (100 * x / W) + '%'; tip.style.top = (100 * y / H) + '%';
      };
      var hide = function () { tip.hidden = true; };
      hit.addEventListener('pointerenter', show); hit.addEventListener('pointerleave', hide);
      hit.addEventListener('focus', show); hit.addEventListener('blur', hide);
      g.appendChild(hit);
    });
    if (!compact) g.appendChild(svg('text', { class: 'lc-endlabel', x: X(days[days.length - 1]) + 10, y: Y(last.est.m) + 4 }, L.exporter.showValue(id, last.est.m)));
    box.appendChild(g);
    if (tip) box.appendChild(tip);
    return { el: box, svg: g };
  };
  function axisDelta(id, r) {
    if (id === 'rooms') return '×' + r1(Math.pow(2, r.est.s / 6.02)) + ' in distance';
    var p = L.probes[id];
    return p.unit === 'dB' ? r1(r.est.s) + '\u00a0dB' : p.unit === '%' ? Math.round(r.est.s) + ' points' : r1(r.est.s);
  }

  /** The table view of a probe's runs (every value the chart shows). */
  C.table = function (info) {
    var u = U(), runs = info.runs || [], t0 = runs.length ? runs[0].at : 0;
    var rows = runs.map(function (r, i) {
      return u.el('tr', null, [u.el('td', { class: 'num' }, String(i + 1)), u.el('td', { class: 'num' }, 'day ' + Math.round((r.at - t0) / DAY)),
        u.el('td', null, kindText(r)), u.el('td', { class: 'num' }, L.exporter.showValue(info.id, r.est.m)), u.el('td', { class: 'num' }, r.est.s ? axisDelta(info.id, r) : ''),
        u.el('td', null, r.hp ? 'headphones' : 'speaker')]);
    });
    return u.el('table', { class: 'lab-table', 'data-lab-table': info.id }, [
      u.el('thead', null, u.el('tr', null, ['Run', 'When', 'Kind', 'Result', 'Give or take', 'Sound'].map(function (h) { return u.el('th', { scope: 'col' }, h); }))),
      u.el('tbody', null, rows)]);
  };
  C.kindText = kindText;
})(typeof window !== 'undefined' ? window : globalThis);
