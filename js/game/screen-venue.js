/* Screen 'venue' (params {id}) — one venue of the night out: what makes it hard (generated from the dial settings),
   your earshot there in real units with what it means, your best, the earshot over time, the other conditions
   found there with your level in each, the cast regulars, and a button that starts a set at the venue (adaptive
   on its headline dial, the venue's other dials pinned). A locked venue states exactly what opens it. */
(function (ES, win) {
  'use strict';
  var G = ES.game;
  function U() { return ES.core.util; }
  function el(t, a, c) { return U().el(t, a, c); }

  function stateOf(id) { return G.venues.state().filter(function (s) { return s.id === id; })[0] || null; }
  function earshotBlock(s) {
    var v = s.venue, e = s.earshot, has = e && e.status !== 'none', best = s.best;
    var kids = [el('span', { class: 'g-earshot-num', 'data-earshot': has ? e.text : '' }, has ? e.text : '–'),
      el('span', { class: 'g-earshot-lab' }, 'Your earshot here'),
      el('p', { class: 'g-earshot-mean' }, G.venues.meaning(v.head, e))];
    if (typeof best === 'number' && has && best !== e.x) {
      kids.push(el('p', { class: 'g-note', style: 'grid-column:1/-1' }, 'Your best here: ' + G.core.levelText(v.head.ex, v.head.dial, best) +
        (s.bestAt ? ' (' + G.ui.dateText(s.bestAt) + ').' : '.') + ' Levels move with each set; your best stays.'));
    }
    return el('div', { class: 'g-earshot' }, kids);
  }
  function lockBlock(s) {
    var from = s.from || (s.venue.opens ? stateOf(s.venue.opens.from) : null), parts = [el('p', null, G.venues.ruleText(s.venue))];
    if (from && from.earshot && from.earshot.status !== 'none') parts.push(el('p', { class: 'g-note' }, 'Your earshot at the ' + G.venues.venueName(from.venue) + ' now: ' + from.earshot.text + '.'));
    if (from && !from.open) parts.push(el('p', { class: 'g-note' }, 'The ' + G.venues.venueName(from.venue) + ' opens first.'));
    return el('section', { class: 'card', 'data-locked': '' }, [el('p', { class: 'eyebrow mono' }, 'Not open yet')].concat(parts));
  }
  function historyChart(s) {
    var rec = G.core.rec(), h = ((rec.venues || {})[s.id] || {}).h || [];
    if (h.length < 2) return null;
    return G.ui.levelChart({ title: 'Your earshot here over time', sub: 'After each set with this venue’s conditions. Higher is harder.',
      ex: s.venue.head.ex, dial: s.venue.head.dial, points: h.map(function (p) { return { t: p[0], y: p[1] }; }) });
  }
  function alsoList(v, open) {
    if (!v.also.length) return null;
    var S = ES.ui.session, can = function (ex) { return open && S && S.supports && S.supports.plan && (typeof S.runnable !== 'function' || S.runnable(ex)); };
    return [el('h2', { class: 'g-sec' }, 'Also here'), el('ul', { class: 'g-also' }, v.also.map(function (c) {
      var e = G.venues.condEarshot(c), d = G.core.dialDef(c.ex, c.dial);
      var val = e.status === 'none' ? 'not measured yet' : e.text;
      var play = can(c.ex) ? ES.ui.button('Play', { small: true, attrs: { 'data-play-also': c.ex + '.' + c.dial, 'aria-label': 'Play a set: ' + c.label },
        onClick: function () { G.ui.startPlan(G.venues.plan(v.id, { cond: c })); } }) : null;
      return el('li', { class: play ? 'has-play' : '' }, [el('span', null, [el('span', { class: 'g-vname' }, c.label), el('span', { class: 'g-vdesc' }, G.venues.exName(c.ex) + ' · ' + (d ? d.label.toLowerCase() : c.dial))]),
        el('span', { class: 'g-vval' + (e.status === 'none' || e.status === 'below' ? ' is-none' : '') }, val), play]);
    }))];
  }
  function regulars(v) {
    var cs = G.cast.cards().filter(function (c) { return c.venue === v.id; });
    if (!cs.length) return null;
    return [el('h2', { class: 'g-sec' }, 'Regulars'), el('ul', { class: 'g-regulars' }, cs.map(function (c) {
      return el('li', { class: c.state === 'unmet' ? 'is-unmet' : '' }, c.state === 'unmet' ? 'Someone you have not met yet' : c.name + ' · ' + c.blurb.replace(/\.$/, ''));
    })), el('p', { class: 'g-note' }, [el('a', { href: '#cast', 'data-go': 'cast' }, 'All the cast')])];
  }
  function playButton(s) {
    var mins = Math.round(((ES.engine.dialMeta || {})[s.venue.head.ex] || { setTrials: 20, secPerTrial: 9 }).setTrials *
      ((ES.engine.dialMeta || {})[s.venue.head.ex] || { secPerTrial: 9 }).secPerTrial / 60);
    var sup = G.venues.supports();
    var b = ES.ui.button(s.open ? 'Play a set here · about ' + Math.max(2, mins) + ' min' : 'Opens later', { kind: 'primary', wide: true, cls: 'g-play',
      disabled: !s.open, attrs: { 'data-play-venue': s.id }, onClick: function () { G.ui.startPlan(G.venues.plan(s.id)); } });
    var note = s.open && !sup.start ? el('p', { class: 'g-note' }, 'Starting a set from here arrives with the next build. Your normal sessions train this venue’s conditions meanwhile.') : null;
    return [b, note];
  }

  function mount(root, params) {
    var s = stateOf(params && params.id);
    if (!s) { ES.core.router.go('map', {}, { replace: true }); return; }
    var v = s.venue, line = G.data.line(v.line), n = line.venues.length;
    root.appendChild(el('div', { class: 'wrap narrow g-wrap g-venue', 'data-venue': v.id }, [
      ES.ui.w.header({ back: true, title: 'Venue' }),
      el('p', { class: 'eyebrow mono' }, line.name + (n > 1 ? ' · venue ' + (v.step + 1) + ' of ' + n : '')),
      el('h1', { class: 'h-big' }, v.name),
      el('p', { class: 'lead' }, v.flavour),
      el('p', { class: 'g-cond' }, G.venues.exName(v.head.ex) + ' · ' + G.venues.describe(v.head)),
      s.open ? earshotBlock(s) : lockBlock(s),
      el('div', { class: 'g-actions' }, playButton(s)),
      s.open ? historyChart(s) : null,
      alsoList(v, s.open),
      regulars(v),
      ES.ui.w.footer()
    ]));
  }

  ES.ui.screens.venue = { mount: mount, unmount: function () {} };
})(window.ES, window);
