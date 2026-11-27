/* Screen 'exercises' — every exercise by name (FRESH-A #4, FRESH-B C1): what it trains in one line, the bet it
   tests, "Play a set" (a one-exercise session in the player's mode; its tutorial first if never played) and "How it
   works". Missions opens its own screen. ES.ui.exerciseHelp(exId, actions) is the one help sheet, also used by Play.
   Reached from Home's index. */
(function (ES) {
  'use strict';
  var U = ES.core.util;
  var ORDER = ['crowd', 'far', 'strange', 'repair', 'echo', 'seek', 'voices', 'missions'];

  /** How it works: the exercise's own sheet, else its help body in ours, else short text, tips and the bet.
      actions: sheet actions ([] → Close). → Promise of the action value. */
  function help(exId, actions) {
    var info = ES.ui.session.exInfo(exId), X = ES.ex[exId];
    var acts = actions && actions.length ? actions : [{ label: 'Close', kind: 'primary', value: 'close' }];
    if (X && typeof X.openHelp === 'function') {
      var own = null;
      try { own = X.openHelp({ actions: acts }); } catch (e) { own = null; }
      if (own && own.closed) return own.closed;
    }
    if (X && typeof X.helpBody === 'function') {
      return ES.ui.sheet({ title: info.name, cls: 'sheet-help', body: function (b) { try { X.helpBody(b); } catch (e) { b.appendChild(U.el('p', null, info.short || '')); } },
        actions: acts }).closed;
    }
    var tips = info.tips || ((info.tutorial && info.tutorial.steps) || []).filter(function (s) { return s.kind === 'caption' || s.text; }).map(function (s) { return s.text; });
    return ES.ui.sheet({ title: info.name, cls: 'sheet-help', body: function (b) {
      if (info.short) b.appendChild(U.el('p', { class: 'lead' }, info.short));
      if (tips.length) b.appendChild(U.el('ul', { class: 'tips' }, tips.slice(0, 5).map(function (t) { return U.el('li', null, t); })));
      if (info.bet) b.appendChild(U.el('p', { class: 'bet' }, [U.el('strong', null, 'The bet: '), info.bet]));
    }, actions: acts }).closed;
  }

  function setTrials(exId) { var m = ES.engine.dialMeta && ES.engine.dialMeta[exId]; return m && m.setTrials || 20; }
  /** One set of this exercise in the player's mode; a running session is resumed or ended first, on request. */
  function playSet(exId) {
    var S = ES.ui.session, info = S.exInfo(exId);
    function go() {
      ES.ui.sound.unlock();
      S.start({ sets: [{ exId: exId, trials: setTrials(exId), kind: 'normal' }], title: info.name });
    }
    if (!S.active()) { go(); return; }
    ES.ui.sheet({ title: 'A session is running', body: 'Finish it first, or end it now and play ' + info.name + '.', actions: [
      { label: 'Back to the session', value: 'resume' }, { label: 'End it and play', kind: 'primary', value: 'end' }] }).closed.then(function (v) {
      if (v === 'resume') S.resume();
      else if (v === 'end') { S.finish(); go(); }
    });
  }
  function row(exId) {
    var S = ES.ui.session, info = S.exInfo(exId), X = ES.ex[exId], mission = exId === 'missions';
    var ok = mission ? ES.core.router.has('missions') : S.realAvailable() && S.runnable(exId);
    var bet = X && X.card && X.card.bet ? X.card.bet : info.bet;
    return U.el('li', { class: 'card ex-row', 'data-ex-row': exId }, [
      U.el('div', { class: 'ex-head' }, [U.el('h2', { class: 'h-small' }, info.name), info.betNew ? U.el('span', { class: 'chip' }, 'new bet') : null]),
      info.short ? U.el('p', { class: 'ex-short' }, info.short) : null,
      bet ? U.el('p', { class: 'ex-bet hint' }, [U.el('strong', null, 'Bets on: '), bet]) : null,
      U.el('div', { class: 'row-buttons' }, [
        mission ? ES.ui.button('Open missions', { small: true, kind: 'primary', go: 'missions', attrs: { 'data-ex-play': exId } })
          : ES.ui.button('Play a set', { small: true, kind: 'primary', disabled: !ok, attrs: { 'data-ex-play': exId }, onClick: function () { playSet(exId); } }),
        ES.ui.button('How it works', { small: true, kind: 'ghost', attrs: { 'data-ex-help': exId }, onClick: function () { help(exId); } })
      ]),
      ok || mission ? null : U.el('p', { class: 'hint' }, 'Plays once the voice exercises are installed (the demo has tones only).')
    ]);
  }
  function mount(root) {
    var ids = ORDER.filter(function (id) { return ES.ex[id]; });
    root.appendChild(U.el('div', { class: 'wrap narrow exercises' }, [
      ES.ui.w.header({ back: true, title: 'Exercises' }),
      U.el('h1', { class: 'h-mid' }, 'Exercises'),
      U.el('p', { class: 'lead' }, 'Every exercise holds itself at the edge of what you can hear. Play a set of one here; the first time, its two-minute tutorial comes first. Your mode stays as it is.'),
      U.el('ul', { class: 'ex-list' }, ids.map(row)),
      ES.ui.w.footer()
    ]));
  }

  ES.ui.exerciseHelp = help;
  ES.ui.exercises = { ORDER: ORDER, playSet: playSet };
  if (!ES.ui.screens.exercises) ES.ui.screens.exercises = { mount: mount, unmount: function () {} };
})(window.ES);
