/* Placeholders for screens that wave-2 modules will register in ES.ui.screens (map, lab, cast, missions,
   progress, diary, weekly, probe). The router uses these only while no module has registered the name.
   Honest by design: no sample or fake data. */
(function (ES) {
  'use strict';
  var U = ES.core.util;
  var LATER = {
    map: ['Map', 'The night out: about a dozen venues, from a café to a cathedral, each a family of listening conditions. Each one shows your earshot there.'],
    lab: ['Lab', 'Untrained check-ins at near, mid and far distance from training, with your trend and its margin, and exports the community can pool.'],
    cast: ['Cast', 'The voices you meet in training, with cards that fill in as you get to know them.'],
    missions: ['Missions', 'One real-world listening task a week, with a 20-second check-in afterwards.'],
    progress: ['Progress', 'Your levels over time, in real units: decibels and metres.'],
    diary: ['Diary', 'A weekly note on everyday listening, five short items.'],
    weekly: ['Weekly Night Out', 'A seeded challenge everyone plays identically, with a result card to share.'],
    probe: ['Check-in', 'A Lab check-in run.']
  };

  function make(id) {
    return {
      mount: function (root) {
        var t = LATER[id];
        root.appendChild(U.el('div', { class: 'wrap narrow placeholder', 'data-placeholder': id }, [
          ES.ui.w.header({ back: true, title: t[0] }),
          U.el('h1', { class: 'h-mid' }, t[0]),
          U.el('p', { class: 'lead' }, t[1]),
          U.el('p', { class: 'card placeholder-note' }, [U.el('strong', null, 'Arrives in a later build. '), 'Until then this page stays empty on purpose: it shows nothing that is not real.']),
          ES.ui.button('Back to Tonight', { kind: 'primary', onClick: function () { ES.core.router.go('home', {}, { reset: true }); } }),
          ES.ui.w.footer()
        ]));
      },
      unmount: function () {}
    };
  }
  Object.keys(LATER).forEach(function (id) { ES.ui.placeholders[id] = make(id); });
})(window.ES);
