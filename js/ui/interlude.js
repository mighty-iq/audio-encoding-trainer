/* ES.ui.interlude — listen-only exposure between sets (PLAN §7, after Wright 2015: practice plus exposure).
   The planner marks some sets with interlude {kind:'exposure', ex, seconds}; ES.engine.flow.exposure(ex) gives
   examples [{text, audio, textFirst?}] of the condition just trained. Every example is rendered before playback
   starts; then they play in order with their words on screen. Nothing to answer, never a repeat-aloud step.
   It starts on a tap (sound needs a gesture), and Next set stops it. */
(function (ES, win) {
  'use strict';
  var U = ES.core.util;
  var cur = null;

  function available(set) {
    var F = ES.engine.flow;
    return !!(set && !set.demo && set.plan && set.plan.interlude && F && typeof F.exposure === 'function' && ES.audio && typeof ES.audio.render === 'function');
  }
  function stop() {
    if (!cur) return;
    cur.stopped = true;
    if (cur.player) { try { cur.player.stop(); } catch (e) { /* ignore */ } }
    if (cur.quiet) { ES.ui.quiet(false); ES.core.store.release(); cur.quiet = false; }
    cur = null;
  }
  /** Render the interlude card into el for a finished set. Returns true when it could. */
  function mount(el, set) {
    if (!available(set)) return false;
    var secs = set.plan.interlude.seconds || 25;
    var words = U.el('p', { class: 'interlude-words', 'aria-live': 'polite' });
    var status = U.el('p', { class: 'hint mono' }, 'About ' + secs + ' seconds. Nothing to answer.');
    var btn = ES.ui.button('Play the examples', { kind: 'secondary', attrs: { 'data-interlude-play': '' }, onClick: play });
    el.appendChild(U.el('section', { class: 'card interlude-card', 'data-interlude': '' }, [
      U.el('h2', { class: 'h-small' }, 'Listen only'),
      U.el('p', null, 'Hear the condition you just trained, with its words on screen. In lab studies, practice mixed with short listen-only breaks like this one learned as much as practice alone.'),
      words, status, btn]));

    function play() {
      stop();
      ES.ui.sound.unlock();
      var me = cur = { stopped: false, player: null, quiet: false };
      btn.disabled = true;
      status.textContent = 'Getting the examples ready…';
      var items = [];
      try { items = ES.engine.flow.exposure(set.exId, { headphones: !!(ES.core.store.peek('profile').settings || {}).headphones, seed: 'exp:' + set.exId + ':' + Date.now() }) || []; }
      catch (e) { items = []; }
      items = items.filter(function (x) { return x && x.audio; });
      if (!items.length) { status.textContent = 'No examples are available for this exercise yet.'; return; }
      Promise.all(items.map(function (x, i) {
        return Promise.resolve(ES.audio.render(x.audio, { seed: 'exposure:' + set.exId + ':' + i })).then(function (r) { return r && r.buffer ? r.buffer : r; });
      })).then(function (bufs) {
        if (me.stopped) return;
        var budget = secs * 1000 + 4000, t0 = Date.now(), i = 0;
        (function step() {
          if (me.stopped) return;
          if (i >= bufs.length || Date.now() - t0 > budget) { finishPlay(); return; }
          var x = items[i], buf = bufs[i];
          i++;
          words.textContent = x.text || '';
          status.textContent = 'Example ' + i + ' of ' + bufs.length;
          setTimeout(function () {
            if (me.stopped) return;
            ES.ui.quiet(true); ES.core.store.hold(); me.quiet = true;
            var h = ES.audio.play(buf) || {};
            me.player = h;
            Promise.resolve(h.ended).then(function () {
              if (me.quiet) { ES.ui.quiet(false); ES.core.store.release(); me.quiet = false; }
              me.player = null;
              setTimeout(step, 400);
            });
          }, x.textFirst ? 900 : 150);
        })();
      }, function () { if (!me.stopped) { status.textContent = 'The examples could not be prepared.'; btn.disabled = false; } });
      function finishPlay() {
        if (cur === me) cur = null;
        status.textContent = 'Done. Play them again any time before the next set.';
        btn.disabled = false;
      }
    }
    return true;
  }

  ES.ui.interlude = { mount: mount, stop: stop, available: available };
})(window.ES, window);
