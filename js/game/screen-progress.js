/* Screen 'progress' — your levels over time in real units: for every exercise, one small chart per dial with data
   (the engine's estimate after each session's last set of that exercise, ±1 SD shaded; up = harder), your best per
   dial, milestones reached and the next one per dial, and the weekly nights. Honest by design: estimates only (no
   smoothing, no invented points), the axis in the dial's own units, a table view for every chart. */
(function (ES, win) {
  'use strict';
  var G = ES.game;
  function U() { return ES.core.util; }
  function el(t, a, c) { return U().el(t, a, c); }
  var ORDER = ['crowd', 'far', 'strange', 'repair', 'echo', 'seek', 'voices'];

  function logRec() { try { return ES.core.store.peek('log'); } catch (e) { return { sessions: [] }; } }
  function exSection(ex, byCk) {
    var hpNote = null, cks = Object.keys(byCk).sort(function (a, b) { return a.length - b.length; });
    var charts = [];
    cks.forEach(function (ck) {
      var hp = ck.indexOf('@hp') > 0, dials = byCk[ck];
      (ES.engine.dials[ex] || []).forEach(function (d) {
        var pts = dials[d.id];
        if (!pts || pts.length < 2) return;
        var best = G.milestones.bestOf(ex, d.id, pts), last = pts[pts.length - 1];
        charts.push(G.ui.levelChart({ ex: ex, dial: d.id, points: pts, title: d.label + (hp ? ' (headphones)' : ''),
          sub: 'Now ' + G.core.levelText(ex, d, last.y) + ' · best ' + G.core.levelText(ex, d, best) + ' · ' + pts.length + ' sessions' }));
      });
      if (hp) hpNote = el('p', { class: 'g-note' }, 'With headphones, Crowd keeps its own levels: voices from different directions make it easier.');
    });
    if (!charts.length) return null;
    return el('section', { class: 'g-prog-ex', 'data-progress-ex': ex }, [el('h2', { class: 'g-sec' }, G.venues.exName(ex)), el('div', { class: 'g-charts' }, charts), hpNote]);
  }
  function milestonesBlock() {
    var got = G.milestones.reachedList(), next = G.milestones.nextUp();
    if (!got.length && !next.length) return null;
    var kids = [el('h2', { class: 'g-sec' }, 'Milestones')];
    if (got.length) {
      kids.push(el('ul', { class: 'g-also', 'data-milestones': '' }, got.slice(0, 8).map(function (m) {
        return el('li', null, [el('span', null, [el('span', { class: 'g-vname' }, m.name), m.text ? el('span', { class: 'g-vdesc' }, m.text) : null]),
          el('span', { class: 'g-vval' }, G.ui.dateText(m.at))]);
      })));
      if (got.length > 8) kids.push(el('p', { class: 'g-note' }, 'And ' + (got.length - 8) + ' more.'));
    }
    if (next.length) {
      kids.push(el('p', { class: 'eyebrow mono', style: 'margin-top:14px' }, 'Next up'));
      kids.push(el('ul', { class: 'g-also' }, next.slice(0, 5).map(function (m) {
        return el('li', null, [el('span', null, [el('span', { class: 'g-vname' }, m.name), el('span', { class: 'g-vdesc' }, G.venues.exName(m.ex) + ' · now ' + m.now)]),
          el('span', { class: 'g-vval' }, m.value)]);
      })));
    }
    return el('section', null, kids);
  }
  function weeklyBlock() {
    var rec = G.core.rec(), weeks = Object.keys(rec.weekly || {}).filter(G.weekly.validWeek).sort().reverse().slice(0, 8);
    if (!weeks.length) return null;
    return el('section', null, [el('h2', { class: 'g-sec' }, 'Weekly nights'), el('ul', { class: 'g-hist' }, weeks.map(function (w) {
      var r = G.weekly.result(w, rec);
      return el('li', null, [el('a', { href: '#weekly', 'data-go': 'weekly', 'data-params': JSON.stringify({ week: w }), class: 'g-mono' }, w),
        el('span', null, r.stops.map(function (s) { return s.marks ? G.weekly.glyphs(s.marks) : '·'; }).join('  ')), el('span', { class: 'g-mono' }, r.right + '/' + r.n)]);
    }))]);
  }

  function mount(root) {
    var S = G.milestones.series(logRec()), secs = ORDER.filter(function (ex) { return S[ex]; }).map(function (ex) { return exSection(ex, S[ex]); }).filter(Boolean);
    var empty = !secs.length;
    root.appendChild(el('div', { class: 'wrap g-wrap g-progress' }, [
      ES.ui.w.header({ back: true, title: 'Progress' }),
      el('p', { class: 'eyebrow mono' }, 'Progress'),
      el('h1', { class: 'h-mid' }, 'Your levels over time'),
      el('p', { class: 'g-sub' }, 'Each level is where you get about 7 in 10 right, in its own units: decibels, metres, seconds of echo, line quality. Higher on a chart is harder.'),
      empty ? el('div', { class: 'g-empty', 'data-progress-empty': '' }, [el('p', null, 'Your levels appear here after your first two sessions with an exercise.'),
        el('p', { class: 'g-note' }, 'Nothing is drawn before there is something real to draw.')]) : null,
      secs,
      milestonesBlock(),
      weeklyBlock(),
      empty ? null : el('p', { class: 'g-note' }, 'Shaded: the estimate’s spread (±1 SD). Untrained check-ins that test carry-over live in the Lab.'),
      ES.ui.w.footer()
    ]));
    if (ES.core.playtest && ES.core.playtest.enabled()) setTimeout(function () { ES.core.playtest.sampleFrames('progress', 1000); }, 400);
  }

  ES.ui.screens.progress = { mount: mount, unmount: function () {} };
})(window.ES, window);
