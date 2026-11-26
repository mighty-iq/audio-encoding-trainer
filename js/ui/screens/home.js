/* Screen 'home' — "Tonight": start (or resume) a session, the weekly ring, the next venue, the index of the
   rest of the app, and the permanent Chimera link. */
(function (ES, win) {
  'use strict';
  var U = ES.core.util, W = function () { return ES.ui.w; };
  var INDEX = [
    ['map', 'Map', 'The night out: venues that open as your ear grows'],
    ['lab', 'Lab', 'Check-ins that measure what carries over'],
    ['cast', 'Cast', 'The voices you have met'],
    ['missions', 'Missions', 'One real-world listening task a week'],
    ['progress', 'Progress', 'Your levels over time, in dB and metres'],
    ['settings', 'Settings', 'Mode, session length, sound, data'],
    ['about', 'About', 'What Earshot is, licences and credits']
  ];

  function venueTeaser() {
    var V = ES.game && ES.game.venues;
    if (V && typeof V.next === 'function') {
      try {
        var nx = V.next();
        if (nx && nx.name) return U.el('section', { class: 'card venue' }, [U.el('p', { class: 'eyebrow mono' }, 'Next venue'),
          U.el('h2', { class: 'h-small' }, nx.name), nx.text ? U.el('p', { class: 'hint' }, nx.text) : null]);
      } catch (e) { /* fall back to the teaser */ }
    }
    return U.el('section', { class: 'card venue' }, [U.el('p', { class: 'eyebrow mono' }, 'Coming up'),
      U.el('h2', { class: 'h-small' }, 'A night out, venue by venue'),
      U.el('p', { class: 'hint' }, 'Café, restaurant, bar, house party and more open as your ear grows. The map arrives in a later build.')]);
  }
  function startButton() {
    var sess = ES.ui.session;
    if (sess.active()) {
      return ES.ui.button('Resume session', { kind: 'primary', wide: true, cls: 'btn-start', attrs: { 'data-start': '' }, onClick: function () {
        ES.ui.sound.unlock();
        var set = sess.currentSet();
        if (set && set.finished) ES.core.router.go('results', { set: set.index });
        else if (set) { ES.ui.inSet = true; ES.core.router.go('play', { set: set.index }); }
      } });
    }
    return ES.ui.button('Start session', { kind: 'primary', wide: true, cls: 'btn-start', attrs: { 'data-start': '' }, onClick: function () {
      ES.ui.sound.unlock();
      sess.start();
    } });
  }
  function lead() {
    if (!ES.ui.session.realAvailable()) return 'Demo session: two short sets of tone trials walk you through the flow. The voice exercises arrive with the audio build.';
    var min = (ES.core.store.peek('profile').settings || {}).sessionMin || 15;
    return 'About ' + min + ' minutes of short mixed sets, each held at the edge of what you can hear.';
  }

  /** Cards other modules offer for Tonight (element or null each): the Lab's check-in, the game's welcome-back,
      overnight check or weekly challenge, this week's mission. They never block Start. */
  function moduleCards() {
    var out = [];
    [ES.lab && ES.lab.homeCard, ES.game && ES.game.homeCard, ES.ex.missions && ES.ex.missions.homeCard].forEach(function (fn) {
      if (typeof fn !== 'function') return;
      try { var el = fn(); if (el && el.nodeType === 1) out.push(el); } catch (e) { if (win.console) console.error('[home card]', e); }
    });
    return out;
  }
  function mount(root) {
    var w = W();
    var today = w.sessionsToday();
    root.appendChild(U.el('div', { class: 'wrap home' }, [
      w.header(),
      U.el('div', { class: 'home-hero' }, [
        U.el('div', { class: 'home-hero-text' }, [
          U.el('p', { class: 'eyebrow mono' }, 'Tonight'),
          U.el('h1', { class: 'h-big' }, ES.ui.session.active() ? 'Your session is waiting.' : 'Ready when you are.'),
          U.el('p', { class: 'lead' }, lead()),
          today >= 3 ? U.el('p', { class: 'hint sleep-note' }, 'That is ' + today + ' sessions today. Learning settles overnight, so the next one pays off most after sleep.') : null,
          startButton()
        ]),
        U.el('div', { class: 'home-hero-pic', 'aria-hidden': 'true' }, ES.ui.field(null, { compact: true, labels: false, voices: [
          { id: 'a', role: 'target', az: 28, dist: 2.2 }, { id: 'b', role: 'masker', az: -55, dist: 3.1 },
          { id: 'c', role: 'masker', az: 140, dist: 2.6 }, { id: 'd', role: 'masker', az: 95, dist: 3.6 }] }))
      ]),
      U.el('div', { class: 'home-cards' }, [w.weekCard()].concat(moduleCards(), [venueTeaser()])),
      U.el('nav', { class: 'index', 'aria-label': 'Sections' }, U.el('ul', null, INDEX.map(function (it) {
        var later = !ES.ui.screens[it[0]] && ES.ui.placeholders[it[0]];
        return U.el('li', null, U.el('a', { href: '#' + it[0], class: 'index-row', 'data-index-link': it[0] }, [
          U.el('span', { class: 'index-name' }, it[1]), U.el('span', { class: 'index-desc' }, it[2]),
          later ? U.el('span', { class: 'chip' }, 'later build') : U.el('span', { class: 'index-arrow', 'aria-hidden': 'true' }, '›')]));
      }))),
      w.footer()
    ]));
    if (ES.core.playtest.enabled()) setTimeout(function () { ES.core.playtest.sampleFrames('home', 1200); }, 400);
  }

  if (!ES.ui.screens.home) ES.ui.screens.home = { mount: mount, unmount: function () {} };
})(window.ES, window);
