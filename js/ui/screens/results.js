/* Screen 'results' — between sets: the set summary, an interlude slot, plateau news, Chimera invitations,
   playtest ratings; and, with params.done, the session summary. Invitations only appear here, never in a set. */
(function (ES, win) {
  'use strict';
  var U = ES.core.util;

  function levelLine(set, entry) {
    if (set.demo) {
      var last = set.results[set.results.length - 1];
      return last && last.level != null ? 'Ended at: ' + ES.ui.demo.levelText(last.level) : '';
    }
    var end = entry && entry.end || {}, parts = [];
    Object.keys(end).slice(0, 3).forEach(function (k) { var t = ES.ui.w.dialText(set.exId, k, end[k]); if (t) parts.push(t); });
    return parts.join(' · ');
  }
  /** Plateau news: the reason, what changes next, and a strategy card when the breaker is a strategy. */
  function plateauCard(set) {
    var pl = set.plateau, br = pl.breaker || {}, card = null;
    if (br.kind === 'strategy' && ES.ex.strategies && typeof ES.ex.strategies.pick === 'function') {
      var seen = Object.keys(ES.core.store.peek('profile').cards || {});
      try { card = ES.ex.strategies.pick(set.exId, { dial: br.dial, seen: seen }); } catch (e) { card = null; }
      if (card && card.id) ES.core.store.update('profile', function (r) { r.cards = r.cards || {}; if (!r.cards[card.id]) r.cards[card.id] = Date.now(); });
    }
    return U.el('section', { class: 'card plateau' }, [U.el('h2', { class: 'h-small' }, 'A plateau, and what changes next'),
      pl.reason ? U.el('p', null, pl.reason) : null,
      br.text && !card ? U.el('p', { 'data-plateau-next': '' }, br.text) : null,          // the text says what changes (RV P8)
      card ? U.el('div', { class: 'strategy' }, [U.el('strong', null, card.title || 'A strategy to try'), card.text ? U.el('p', null, card.text) : null,
        card.tryIt ? U.el('p', { class: 'hint' }, [U.el('strong', null, 'Try it: '), card.tryIt]) : null]) : null]);
  }
  // Why a set ended without its trials (RV P7, P16): said on the screen, not only in a toast.
  var SKIPPED = {
    ended: 'You ended it before the first answer, so nothing was counted.',
    sounds: 'Its sounds could not be prepared on this device, so it was passed over. Nothing was counted.',
    voided: 'Its trials were interrupted too often, so it was passed over. Nothing was counted against you.'
  };
  var ENDED = {
    sounds: 'The set ended here because its sounds could not be prepared on this device.',
    voided: 'The set ended here because its trials were interrupted too often; nothing was counted against you.'
  };
  function actionsFor(S, set) {
    var last = set.index + 1 >= S.sets.length;
    return U.el('div', { class: 'actions' }, [
      last ? null : ES.ui.button('End session', { kind: 'secondary', attrs: { 'data-end-session': '' }, onClick: function () { ES.ui.session.finish(); } }),
      ES.ui.button(last ? 'Finish session' : 'Next set', { kind: 'primary', attrs: { 'data-next-set': '' }, onClick: function () { ES.ui.sound.unlock(); ES.ui.session.next(); } })
    ]);
  }
  /** A set passed over before its first answer: why, and what comes next; the session goes on. */
  function skippedSummary(root, S, set) {
    var info = ES.ui.session.exInfo(set.exId), nx = S.sets[set.index + 1];
    root.appendChild(U.el('div', { class: 'wrap results', 'data-skipped': set.skipped }, [
      U.el('p', { class: 'eyebrow mono' }, 'Set ' + (set.index + 1) + ' of ' + S.sets.length + ' · ' + info.name),
      U.el('h1', { class: 'h-big', 'data-autofocus': '' }, 'Set passed over'),
      U.el('p', { class: 'lead', 'data-skip-reason': '' }, SKIPPED[set.skipped] || SKIPPED.ended),
      nx ? U.el('p', { class: 'hint' }, 'Next: ' + ES.ui.session.exInfo(nx.exId).name + '.') : U.el('p', { class: 'hint' }, 'That was the last set of this session.'),
      actionsFor(S, set)
    ]));
  }
  /** Path mode (RV P4): where the set left the path, its moves (on, or one step back with no penalty), and at the
      last step that the path is complete, with Edge offered. Never "mastered". */
  function pathCard(set) {
    var place = set.pathAt ? ES.ui.sessionInfo.pathPlace(set.exId, set.pathAt) : null;
    if (!place) return null;
    var name = ES.ui.session.exInfo(set.exId).name, moves = set.pathMoves || [], up = moves.filter(function (m) { return m.advanced; }).length;
    var back = moves.filter(function (m) { return m.back; }).length, lines = [];
    if (up) lines.push(up === 1 ? 'You moved on a step.' : 'You moved on ' + up + ' steps.');
    if (back) lines.push('The path went back a step to firm it up. No penalty: you move on again from there.');
    if (!up && !back) lines.push('A step moves on after 5 fully right trials in a row, or 8 in 10 over the last 15.');
    var edge = (ES.core.store.peek('profile').settings || {}).mode !== 'edge';
    return U.el('section', { class: 'card path-card', 'data-path': place.last ? 'complete' : 'step' }, [
      U.el('p', { class: 'eyebrow mono' }, place.text),
      U.el('p', null, lines.join(' ')),
      place.last ? U.el('p', { 'data-path-complete': '' }, 'This is the last step of the ' + name + ' path: the path is complete. From here, Edge mode keeps every dial at your own edge.') : null,
      place.last && edge ? ES.ui.button('Switch to Edge', { small: true, attrs: { 'data-path-edge': '' }, onClick: function (e, b) {
        ES.core.store.update('profile', function (r) { r.settings = r.settings || {}; r.settings.mode = 'edge'; });
        b.disabled = true; ES.ui.toast('Edge mode from the next session');
      } }) : null
    ]);
  }
  function setSummary(root, S, set) {
    if (set.skipped) { skippedSummary(root, S, set); return; }
    var info = ES.ui.session.exInfo(set.exId), entry = S.log.sets[S.log.sets.length - 1] || {};
    var T = ES.ui.w.tally(set.results);
    // multi-answer sets count their answers, so a set at the edge does not read as half wrong (RV P5)
    var head = T.multi ? [U.el('span', { class: 'mono' }, String(T.answersRight)), ' of ', U.el('span', { class: 'mono' }, String(T.answers)), ' answers right']
      : [U.el('span', { class: 'mono' }, String(T.right)), ' of ', U.el('span', { class: 'mono' }, String(T.trials)), ' right'];
    var interlude = U.el('section', { class: 'interlude', 'data-slot': 'interlude' });
    var news = U.el('section', { class: 'news', 'data-slot': 'news' });
    var invites = U.el('div', { class: 'invites' });
    var wrap = U.el('div', { class: 'wrap results' }, [
      U.el('p', { class: 'eyebrow mono' }, 'Set ' + (set.index + 1) + ' of ' + S.sets.length + ' · ' + info.name),
      U.el('h1', { class: 'h-big', 'data-autofocus': '', 'data-headline': T.multi ? 'answers' : 'trials' }, head),
      T.multi ? U.el('p', { class: 'hint', 'data-trials-line': '' }, T.right + ' of ' + T.trials + ' trials fully right' + (T.partial ? ', ' + T.partial + ' partly right' : '') + '.') : null,
      ES.ui.w.glyphRow(set.results),
      U.el('p', { class: 'facts mono' }, ['Active ' + U.fmtClock(set.activeMs || 0), levelLine(set, entry) ? ' · ' + levelLine(set, entry) : '']),
      set.demo ? U.el('p', { class: 'hint' }, 'A demo set: tone trials stand in until the voice exercises are installed. Nothing here counts toward your levels.') : null,
      set.endReason && ENDED[set.endReason] ? U.el('p', { class: 'lead', 'data-end-reason': set.endReason }, ENDED[set.endReason]) : null,
      set.partial ? U.el('p', { class: 'hint', 'data-partial': '' }, 'Ended early, so this set is logged as partial: it sets no personal best and does not count as a completed set.') : null,
      set.index === 0 && S.notes && S.notes.length ? U.el('div', { class: 'plan-notes' }, S.notes.map(function (n) { return U.el('p', { class: 'hint' }, n.text || ''); })) : null,
      pathCard(set),
      interlude,
      set.plateau ? plateauCard(set) : null,
      news,
      invites
    ]);
    ES.hooks.emit('results:news', { el: news, set: set.plan, exId: set.exId, index: set.index, entry: set.entry || null });
    ES.hooks.emit('results:interlude', { el: interlude, set: set.plan, exId: set.exId, index: set.index });
    if (!interlude.childNodes.length && ES.ui.interlude) ES.ui.interlude.mount(interlude, set);
    if (!interlude.childNodes.length && set.plan && set.plan.interlude && !set.demo) {
      interlude.appendChild(ES.ui.w.placeholderCard('Listen-only examples of the condition you just trained will play here; they arrive with the audio build.'));
    }
    if (ES.core.playtest.enabled()) wrap.appendChild(ES.core.playtest.ratingEl(set.exId, { set: set.index }));
    wrap.appendChild(actionsFor(S, set));
    root.appendChild(wrap);
    ES.core.chimera.takeInto(invites);
    if (ES.core.playtest.enabled()) setTimeout(function () { ES.core.playtest.sampleFrames('results', 1000); }, 300);
  }
  function sessionDone(root, S) {
    var total = U.sum(S.sets.map(function (s) { return s.activeMs || 0; }));
    var invites = U.el('div', { class: 'invites' });
    var news = U.el('section', { class: 'news', 'data-slot': 'news' }), after = U.el('section', { class: 'after', 'data-slot': 'done' });
    var today = ES.ui.w.sessionsToday(), played = S.sets.some(function (s) { return s.results.length > 0; });
    root.appendChild(U.el('div', { class: 'wrap results results-done' }, [
      U.el('p', { class: 'eyebrow mono' }, 'Tonight' + (S.demo ? ' · demo' : '')),
      U.el('h1', { class: 'h-big', 'data-autofocus': '' }, 'Session done.'),
      played ? null : U.el('p', { class: 'lead', 'data-empty-session': '' }, 'Nothing was answered in this session, so it is not logged and does not count.'),
      U.el('ul', { class: 'set-list' }, S.sets.filter(function (s) { return s.finished; }).map(function (s) {
        var T = ES.ui.w.tally(s.results), score = T.multi ? T.answersRight + '/' + T.answers + ' answers' : T.right + '/' + T.trials + ' right';
        return U.el('li', null, [U.el('span', null, ES.ui.session.exInfo(s.exId).name),
          U.el('span', { class: 'mono' }, s.skipped ? 'passed over' : score + ' · ' + U.fmtClock(s.activeMs || 0))]);
      })),
      U.el('p', { class: 'facts mono' }, 'Active time ' + U.fmtClock(total)),
      ES.ui.w.weekCard(),
      today >= 3 ? U.el('p', { class: 'hint sleep-note' }, 'That is ' + today + ' sessions today. Sleep consolidates practice, so tomorrow is a good time for the next session.') : null,
      news,
      after,
      invites,
      U.el('div', { class: 'actions' }, [ES.ui.button('Back to Tonight', { kind: 'primary', attrs: { 'data-home': '' }, onClick: function () { ES.core.router.go('home', {}, { reset: true }); } })])
    ]));
    ES.hooks.emit('results:news', { el: news, session: U.copy(S.log), done: true });
    ES.hooks.emit('results:done', { el: after, session: U.copy(S.log) });     // e.g. the Lab's check-in after training
    ES.core.chimera.takeInto(invites);
  }
  function mount(root, params) {
    var S = ES.ui.session.state();
    if (!S) { ES.core.router.go('home', {}, { reset: true }); return; }
    if (params.done || S.done) { sessionDone(root, S); return; }
    var set = S.sets[params.set != null ? params.set : S.setIndex];
    if (!set) { ES.core.router.go('home', {}, { reset: true }); return; }
    setSummary(root, S, set);
  }

  if (!ES.ui.screens.results) ES.ui.screens.results = { mount: mount, unmount: function () { if (ES.ui.interlude) ES.ui.interlude.stop(); }, deepLink: false };
})(window.ES, window);
