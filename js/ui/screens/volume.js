/* Screen 'volume' — a comfortable listening level (PLAN §8 safe listening). Plays a reference noise at the
   level trials use (an active level of −20 dBFS) and asks the player to set the device volume so it is clear
   and comfortable. Trials keep the same output loudness whatever the difficulty. */
(function (ES, win) {
  'use strict';
  var U = ES.core.util;
  var REF_DB = -20, REF_S = 4;
  var cur = null;

  function mount(root) {
    cur = { player: null };
    var status = U.el('p', { class: 'hint', 'aria-live': 'polite', 'data-volume-status': '' }, 'Tap Play, then adjust your device volume.');
    var playBtn = ES.ui.button('Play the reference', { kind: 'secondary', wide: true, attrs: { 'data-volume-play': '' }, onClick: function () {
      ES.ui.sound.unlock().then(function () {
        if (cur.player) cur.player.stop();
        var pcm = ES.ui.sound.pink(REF_S, 22050, REF_DB, ES.core.rng('volume-reference'));
        cur.player = ES.ui.sound.play(pcm);
        status.textContent = cur.player.silent ? 'Sound is unavailable here.' : 'Playing for ' + REF_S + ' seconds…';
        cur.player.ended.then(function () { if (cur) status.textContent = 'Clear and comfortable? Then tap It is comfortable. If not, change the volume and play again.'; });
      });
    } });
    var okBtn = ES.ui.button('It is comfortable', { kind: 'primary', wide: true, attrs: { 'data-volume-ok': '' }, onClick: function () {
      ES.core.store.update('profile', function (r) { r.settings.volumeSet = Date.now(); });
      ES.ui.toast('Level saved');
      ES.core.router.back();
    } });
    root.appendChild(U.el('div', { class: 'wrap narrow volume' }, [
      ES.ui.w.header({ back: true, title: 'Sound level', settings: false }),
      U.el('h1', { class: 'h-mid' }, 'Set a comfortable level'),
      U.el('p', { class: 'lead' }, 'Play the reference and set your device volume so it sounds clear and comfortable, like a conversation across a table.'),
      U.el('ol', { class: 'steps' }, [U.el('li', null, 'Use the headphones or speaker you will train with.'),
        U.el('li', null, 'Play the reference: ' + REF_S + ' seconds of soft noise.'),
        U.el('li', null, 'Adjust the device volume until it is clear but never loud.')]),
      playBtn, status, okBtn,
      U.el('p', { class: 'hint' }, 'Every trial except Seek’s live search plays at this loudness, however hard it gets. If anything ever sounds too loud, turn it down; short sessions are plenty.'),
      U.el('p', { class: 'hint', 'data-audiologist': '' }, 'If you notice ringing, muffled hearing or pain after listening, stop and see an audiologist.')
    ]));
  }
  function unmount() { if (cur && cur.player) cur.player.stop(); cur = null; }

  if (!ES.ui.screens.volume) ES.ui.screens.volume = { mount: mount, unmount: unmount };
})(window.ES, window);
