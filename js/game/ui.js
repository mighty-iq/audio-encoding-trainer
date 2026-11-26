/* ES.game.ui — shared pieces for the game screens (DOM): a single-series level chart in real units (up = harder;
   2 px line, ringed markers, ±1 SD wash, end label only, crosshair + tooltip on hover, tap and keyboard, a table
   view), the "after this set" news block, the home card (fresh ears / overnight check / weekly), weekly marks, the
   pitch bar of a cast card, and starting a game session through the shell. Texts go in with textContent. */
(function (ES, win) {
  'use strict';
  var G = ES.game;
  function U() { return ES.core.util; }
  function el(t, a, c) { return U().el(t, a, c); }
  function svg(t, a, c) { return U().svg(t, a, c); }
  function K() { return G.core; }
  function r2(x) { return Math.round(x * 100) / 100; }
  function dateText(t) {
    try { return new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }); } catch (e) { return new Date(t).toISOString().slice(5, 10); }
  }

  /** A level chart. o = {title, sub, ex, dial, points:[{t, y, s?}], label?(y)}. Returns an element (.g-chart). */
  function levelChart(o) {
    var d = K().dialDef(o.ex, o.dial), pts = (o.points || []).filter(function (p) { return typeof p.y === 'number' && isFinite(p.y); });
    var label = o.label || function (y) { return K().levelText(o.ex, d, y); };
    var box = el('figure', { class: 'g-chart', 'data-chart': o.ex + '.' + o.dial }, [
      el('h3', null, o.title || (d ? d.label : o.dial)), o.sub ? el('p', { class: 'g-chart-sub' }, o.sub) : null]);
    if (!d || !pts.length) { box.appendChild(el('p', { class: 'g-note' }, 'No points yet.')); return box; }
    var W = 320, H = 140, L = 46, R = 62, T = 20, B = 22, pw = W - L - R, ph = H - T - B, dir = d.dir;
    var t0 = pts[0].t, t1 = pts[pts.length - 1].t;
    if (t1 - t0 < 864e5) { t0 -= 432e5; t1 += 432e5; }
    var vs = []; pts.forEach(function (p) { vs.push(p.y * dir); if (p.s) { vs.push((p.y - p.s) * dir, (p.y + p.s) * dir); } });
    var lo = Math.min.apply(null, vs), hi = Math.max.apply(null, vs), unitStep = d.kind === 'ord' ? 1 : niceStep(hi - lo);
    lo = Math.floor(lo / unitStep - 1e-9) * unitStep; hi = Math.ceil(hi / unitStep + 1e-9) * unitStep;
    if (hi - lo < unitStep) { hi = lo + unitStep; }
    if (d.kind === 'ord') { lo = Math.max(lo, dir > 0 ? d.min : -d.max); hi = Math.min(hi, dir > 0 ? d.max : -d.min); if (hi <= lo) hi = lo + 1; }
    function X(t) { return r2(L + (t - t0) / Math.max(1, t1 - t0) * pw); }
    function Y(v) { return r2(T + (hi - v) / (hi - lo) * ph); }
    var s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', tabindex: '0', 'aria-label': (o.title || d.label) + ': ' + pts.length + ' points, latest ' + label(pts[pts.length - 1].y) + '. Arrow keys step through them.' });
    var step = unitStep, nTicks = Math.round((hi - lo) / step);
    while (nTicks > 5) { step *= 2; nTicks = Math.round((hi - lo) / step); }
    for (var v = lo; v <= hi + 1e-9; v += step) {
      s.appendChild(svg('line', { class: 'gc-grid', x1: L, x2: L + pw, y1: Y(v), y2: Y(v) }));
      var txt = label(v * dir);
      if (txt.length <= 7) s.appendChild(svg('text', { class: 'gc-tick', x: L - 6, y: Y(v) + 4, 'text-anchor': 'end' }, txt));
      else if (Math.abs(v - lo) < 1e-9 || Math.abs(v - hi) < 1e-9) s.appendChild(svg('text', { class: 'gc-tick', x: L + 3, y: Y(v) - 4 }, txt));
    }
    s.appendChild(svg('line', { class: 'gc-axis', x1: L, x2: L + pw, y1: T + ph, y2: T + ph }));
    s.appendChild(svg('text', { class: 'gc-tick', x: L, y: H - 4 }, dateText(pts[0].t)));
    if (pts.length > 1) s.appendChild(svg('text', { class: 'gc-tick', x: L + pw, y: H - 4, 'text-anchor': 'end' }, dateText(pts[pts.length - 1].t)));
    s.appendChild(svg('text', { class: 'gc-tick', x: L + pw, y: 10, 'text-anchor': 'end' }, '\u2191 harder'));
    if (pts.some(function (p) { return p.s; })) {
      var up = pts.map(function (p) { return X(p.t) + ',' + Y((p.y + (p.s || 0) * (dir > 0 ? 1 : -1)) * dir); });
      var dn = pts.slice().reverse().map(function (p) { return X(p.t) + ',' + Y((p.y - (p.s || 0) * (dir > 0 ? 1 : -1)) * dir); });
      if (pts.length > 1) s.appendChild(svg('polygon', { class: 'gc-band', points: up.concat(dn).join(' ') }));
    }
    if (pts.length > 1) s.appendChild(svg('polyline', { class: 'gc-line', points: pts.map(function (p) { return X(p.t) + ',' + Y(p.y * dir); }).join(' ') }));
    var cross = svg('line', { class: 'gc-cross', x1: 0, x2: 0, y1: T, y2: T + ph, visibility: 'hidden' });
    s.appendChild(cross);
    pts.forEach(function (p, i) { if (i === pts.length - 1 || pts.length <= 24) s.appendChild(svg('circle', { class: 'gc-dot', cx: X(p.t), cy: Y(p.y * dir), r: 4 })); });
    var last = pts[pts.length - 1];
    if (label(last.y).length <= 9) s.appendChild(svg('text', { class: 'gc-end', x: X(last.t) + 8, y: Y(last.y * dir) + 4 }, label(last.y)));
    var hot = svg('rect', { class: 'gc-hot', x: L - 8, y: 0, width: pw + 16, height: H });
    s.appendChild(hot);
    box.appendChild(s);
    var tip = el('div', { class: 'g-tip', hidden: true, role: 'status' }), cur = -1;
    box.appendChild(tip);
    function show(i) {
      if (i < 0 || i >= pts.length) return;
      cur = i;
      var p = pts[i], x = X(p.t);
      cross.setAttribute('x1', x); cross.setAttribute('x2', x); cross.setAttribute('visibility', 'visible');
      U().clear(tip);
      tip.appendChild(el('strong', null, label(p.y)));
      tip.appendChild(el('span', null, dateText(p.t) + (p.s ? ' · ± ' + spread(d, p.s) : '')));
      tip.hidden = false;
      var bw = box.clientWidth || W, sx = (bw - 20) / W;
      tip.style.left = Math.max(4, Math.min(bw - 140, 10 + x * sx - 50)) + 'px';
      tip.style.top = Math.max(0, 28 + Y(p.y * dir) * sx - 52) + 'px';
    }
    function hide() { tip.hidden = true; cross.setAttribute('visibility', 'hidden'); }
    function nearest(ev) {
      var r = s.getBoundingClientRect(), x = (ev.clientX - r.left) / Math.max(1, r.width) * W, best = 0, bd = Infinity;
      pts.forEach(function (p, i) { var dd = Math.abs(X(p.t) - x); if (dd < bd) { bd = dd; best = i; } });
      return best;
    }
    s.addEventListener('pointermove', function (ev) { show(nearest(ev)); });
    s.addEventListener('pointerdown', function (ev) { show(nearest(ev)); });
    s.addEventListener('pointerleave', hide);
    s.addEventListener('blur', hide);
    s.addEventListener('focus', function () { show(cur < 0 ? pts.length - 1 : cur); });
    s.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') { ev.preventDefault(); show(Math.max(0, Math.min(pts.length - 1, (cur < 0 ? pts.length - 1 : cur) + (ev.key === 'ArrowLeft' ? -1 : 1)))); }
      if (ev.key === 'Escape') hide();
    });
    var tableBtn = el('button', { type: 'button', class: 'g-link', 'aria-expanded': 'false' }, 'Show as a table'), table = null;
    tableBtn.addEventListener('click', function () {
      if (table) { table.parentNode.removeChild(table); table = null; tableBtn.textContent = 'Show as a table'; tableBtn.setAttribute('aria-expanded', 'false'); return; }
      table = el('table', { class: 'g-table' }, [el('thead', null, el('tr', null, [el('th', null, 'Date'), el('th', null, 'Level'), el('th', null, 'Spread')])),
        el('tbody', null, pts.slice().reverse().map(function (p) {
          return el('tr', null, [el('td', null, dateText(p.t)), el('td', { class: 'n' }, label(p.y)), el('td', { class: 'n' }, p.s ? '± ' + spread(d, p.s) : '')]);
        }))]);
      box.appendChild(table); tableBtn.textContent = 'Hide the table'; tableBtn.setAttribute('aria-expanded', 'true');
    });
    box.appendChild(el('p', { class: 'g-note' }, [tableBtn]));
    return box;
  }
  function spread(d, s) { return d.kind === 'ord' ? K().num(s, 1) + ' level' + (Math.abs(s - 1) < 0.05 ? '' : 's') : K().num(s, 1) + ' ' + (d.unit || ''); }
  function niceStep(span) { var c = [0.5, 1, 2, 3, 5, 10, 20]; for (var i = 0; i < c.length; i++) if (span / c[i] <= 4) return c[i]; return 20; }

  /** ✓/✕ marks of a weekly stop ('110100'); text alternatives included. */
  function marks(m) {
    var s = String(m || ''), ok = s.split('').filter(function (c) { return c === '1'; }).length;
    return el('span', { class: 'g-marks', role: 'img', 'aria-label': ok + ' of ' + s.length + ' right' }, s.split('').map(function (c) {
      return el('i', { class: c === '1' ? 'y' : 'n', 'aria-hidden': 'true' }, c === '1' ? '✓' : '✕');
    }));
  }
  /** A pitch bar (log scale 80–320 Hz) with the voice's median pitch marked. */
  function pitchBar(f0) {
    if (typeof f0 !== 'number' || !(f0 > 0)) return null;
    var lo = Math.log(80), hi = Math.log(320), x = function (f) { return r2(4 + (Math.log(Math.max(80, Math.min(320, f))) - lo) / (hi - lo) * 132); };
    return svg('svg', { class: 'g-pitch', viewBox: '0 0 140 18', 'aria-hidden': 'true' }, [
      svg('line', { class: 'gp-track', x1: 4, x2: 136, y1: 6, y2: 6 }),
      [100, 200, 300].map(function (f) { return svg('line', { class: 'gp-track', x1: x(f), x2: x(f), y1: 3, y2: 9 }); }),
      svg('text', { class: 'gp-tick', x: x(100), y: 17, 'text-anchor': 'middle' }, '100'), svg('text', { class: 'gp-tick', x: x(200), y: 17, 'text-anchor': 'middle' }, '200 Hz'),
      svg('circle', { class: 'gp-mark', cx: x(f0), cy: 6, r: 3.5 })]);
  }

  /** The news block for the screen after a set (null when there is nothing to say). */
  function newsBlock(n) {
    if (!n) return null;
    var items = [];
    (n.returns || []).forEach(function (r) { items.push(['k-ret', r.title + ': ' + r.text]); });
    (n.opened || []).forEach(function (o) { items.push(['k-open', o.text, { go: 'venue', params: { id: o.id }, label: 'See ' + o.name }]); });
    (n.milestones || []).forEach(function (m) { items.push(['k-ms', 'Milestone: ' + m.name + '. ' + m.text]); });
    (n.venueBest || []).forEach(function (b) { items.push(['k-best', b.text]); });
    (n.lines || []).forEach(function (l) { items.push(['k-' + l.kind, l.text]); });
    if (n.weekly) {
      items.push(['k-week', n.weekly.practice ? 'Weekly practice run: ' + n.weekly.marks.replace(/1/g, '✓').replace(/0/g, '✕') + ' (your card for the week stays as it was).'
        : 'Weekly Night Out, stop ' + (n.weekly.stop + 1) + ' of 4: ' + n.weekly.marks.replace(/1/g, '✓').replace(/0/g, '✕') + (n.weekly.complete ? '. Your card is ready.' : '.'),
      n.weekly.complete ? { go: 'weekly', params: { week: n.weekly.week }, label: 'See your card' } : null]);
    }
    if (!items.length) return null;
    return el('section', { class: 'card g-news', 'data-game-news': '' }, [el('h2', null, 'After this set'),
      el('ul', null, items.slice(0, 8).map(function (it) {
        return el('li', { class: it[0] }, el('span', null, [it[1], it[2] ? ' ' : null,
          it[2] ? el('a', { href: '#' + it[2].go, class: 'g-link', 'data-go': it[2].go, 'data-params': JSON.stringify(it[2].params) }, it[2].label) : null]));
      }))]);
  }

  /** The home card: what the next session opens with (fresh ears, overnight check) and this week's challenge. */
  function homeCard() {
    var ret = null, wk = G.weekly.weekKey(), res = null;
    try { ret = G.returns.upcoming(); } catch (e) { ret = null; }
    try { res = G.weekly.result(wk); } catch (e) { res = null; }
    var kids = [];
    if (ret) kids.push(el('p', { class: 'eyebrow mono' }, ret.title), el('p', null, ret.text));
    kids.push(el('p', { class: 'eyebrow mono' }, 'Weekly Night Out · ' + G.weekly.weekLabel(wk)));
    var played = res && res.stops.filter(function (s) { return s.marks; }).length;
    kids.push(el('p', { class: 'hint' }, res && res.complete ? 'Your card for this week: ' + res.right + ' of ' + res.n + ' right. Share it, or play again for practice.'
      : played ? played + ' of 4 stops played. The rest wait for you all week.' : 'Four stops, six trials each, the same for everyone this week. No leaderboard: just your night, to share.'));
    kids.push(el('a', { href: '#weekly', class: 'btn btn-secondary btn-small', 'data-go': 'weekly' }, res && res.complete ? 'Your card' : 'This week’s night out'));
    return el('section', { class: 'card g-home', 'data-game-home': '' }, kids);
  }

  /** Start a game session (venue set or weekly) through the shell; false when this build cannot. */
  function startPlan(plan) {
    var S = ES.ui && ES.ui.session;
    if (!plan || !plan.sets || !plan.sets.length) return false;
    if (!S || !S.supports || !S.supports.plan) {
      if (ES.ui.toast) ES.ui.toast('Starting a set from here arrives with the next build. Your sessions train every venue meanwhile.');
      return false;
    }
    if (S.active && S.active()) { if (ES.ui.toast) ES.ui.toast('Finish or end the session that is running first.'); return false; }
    try { if (ES.ui.sound && ES.ui.sound.unlock) ES.ui.sound.unlock(); } catch (e) { /* sound unlocks on the next tap */ }
    S.start(plan);
    return true;
  }

  // The shell's screen between sets hosts the news block (hook `results:news`); Home calls ES.game.homeCard().
  if (ES.hooks && ES.hooks.on) {
    ES.hooks.on('results:news', function (p) {
      if (!p || !p.el || p.done) return;
      var b = newsBlock(G.record.newsFor(p.index));
      if (b) p.el.appendChild(b);
    });
  }

  G.ui = { levelChart: levelChart, marks: marks, pitchBar: pitchBar, newsBlock: newsBlock, homeCard: homeCard, startPlan: startPlan, dateText: dateText };
  G.homeCard = homeCard;
})(window.ES, window);
