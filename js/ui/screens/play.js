/* Screen 'play' — runs the current set of the session (CONTRACTS §11). 'keyword' exercises (and the demo) run
   trial after trial through ES.ui.trialView; 'custom' ones get ES.ex[id].custom(root, api). The chrome is
   hidden: a slim bar with Pause, the exercise and its level, progress dots (progress only, never a score),
   Help, and a playtest Note in test builds. A hidden tab stops the sound and opens the pause sheet. */
(function (ES, win) {
  'use strict';
  var U = ES.core.util;
  var cur = null;

  function pauseIcon() {
    return U.svg('svg', { viewBox: '0 0 24 24', class: 'icon', 'aria-hidden': 'true', focusable: 'false' },
      [U.svg('rect', { x: 6.5, y: 5, width: 3.6, height: 14, rx: 1 }), U.svg('rect', { x: 13.9, y: 5, width: 3.6, height: 14, rx: 1 })]);
  }
  function paintDots(ol, set) {
    U.clear(ol);
    var n = set.n, done = set.results.length;
    ol.setAttribute('aria-label', 'Trial ' + Math.min(done + 1, n) + ' of ' + n);
    if (n > 30) { ol.appendChild(U.el('li', { class: 'dots-count mono' }, Math.min(done + 1, n) + '/' + n)); return; }
    for (var i = 0; i < n; i++) ol.appendChild(U.el('li', { class: i < done ? 'is-done' : i === done ? 'is-now' : '' }));
  }
  function savedChip() {
    var st = ES.core.store.status();
    return st.saved ? null : U.el('span', { class: 'chip chip-warn tb-chip', title: 'Progress is not being saved' }, 'Not saved');
  }

  function mount(root, params) {
    var sess = ES.ui.session;
    if (!sess.active() || !sess.currentSet()) { ES.core.router.go('home', {}, { reset: true }); return; }
    var set = sess.currentSet(), info = sess.exInfo(set.exId);
    ES.ui.inSet = true;
    ES.core.clock.resume('away');
    document.documentElement.classList.add('in-trial');
    var level = U.el('span', { class: 'tb-level mono' });
    var dots = U.el('ol', { class: 'dots' });
    var bar = U.el('header', { class: 'trial-bar' }, [
      U.el('button', { type: 'button', class: 'tb-btn', 'aria-label': 'Pause', 'data-pause': '', on: { click: openPause } }, pauseIcon()),
      U.el('div', { class: 'tb-mid' }, [U.el('div', { class: 'tb-line' }, [U.el('span', { class: 'tb-title' }, info.name), level]), dots]),
      savedChip(),
      ES.core.playtest.enabled() ? ES.core.playtest.noteButton(function () { return 'play:' + set.exId + ':' + (set.results.length + 1); }, { cls: 'tb-note' }) : null,
      U.el('button', { type: 'button', class: 'tb-btn tb-help', 'aria-label': 'Help', 'data-help': '', on: { click: function () { openHelp(); } } }, '?')
    ]);
    var host = U.el('div', { class: 'trial-host' });
    root.appendChild(U.el('div', { class: 'trial', 'data-ex': set.exId }, [bar, host]));
    cur = { view: null, aborted: false, host: host, set: set, sheet: null };
    function onVis() {
      if (!cur || cur.aborted) return;
      if (document.hidden) { if (cur.view) cur.view.pause(); }
      else if (cur.view && cur.view.state() === 'paused') openPause();
    }
    cur.onVis = onVis;
    document.addEventListener('visibilitychange', onVis);

    if (info.view === 'custom' && typeof info.custom === 'function') { runCustom(host, set, info); return; }
    loop();

    function loop() {
      if (!cur || cur.aborted || !sess.active()) return;
      var s = sess.currentSet();
      if (s !== set) return;
      if (set.results.length >= set.n) { sess.finishSet(); return; }
      paintDots(dots, set);
      if (!set.results.length && set.plan && set.plan.text && !set.introShown) { intro(set); return; }
      var trial = null, err = null;
      try { trial = sess.makeTrial(); } catch (e) { err = e; reportErr(e); }
      if (!trial && !err) { sess.finishSet(); return; }          // the engine says the set is complete
      if (!trial) { sess.skip(null, err); if (set.skips > 5) { sess.endSetEarly(); return; } setTimeout(loop, 0); return; }
      level.textContent = sess.levelText(trial);
      root.querySelector('.trial').setAttribute('data-index', String(set.results.length));
      var view = ES.ui.trialView.run(host, { trial: trial, mode: 'set', score: sess.scorer(trial),
        onResult: function (result, resp, prepared) { sess.record(prepared || trial, result, resp); } });
      cur.view = view;
      view.done.then(function (out) {
        if (!cur || cur.aborted || (out && out.aborted)) return;
        if (out && out.skipped) sess.skip(trial, out.error);
        loop();
      });
    }
    /** Overnight check or fresh-ears set: say what this set is before it starts (static; no sound yet). */
    function intro(s) {
      U.clear(host);
      host.appendChild(U.el('div', { class: 'tut-card card set-intro', 'data-set-intro': '' }, [
        U.el('p', { class: 'eyebrow mono' }, s.plan.kind === 'fresh' ? 'Fresh ears' : s.plan.kind === 'overnight' ? 'Overnight check' : 'This set'),
        U.el('p', { class: 'tut-text' }, s.plan.text),
        U.el('p', { class: 'tut-next' }, 'Next: tap Start, then listen.'),
        ES.ui.button('Start', { kind: 'primary', wide: true, attrs: { 'data-intro-start': '' }, onClick: function () { s.introShown = true; loop(); } })
      ]));
    }
    function reportErr(e) {
      if (win.console) console.error('[play]', e);
      if (ES._keepError) ES._keepError({ at: Date.now(), kind: 'play', msg: String(e && e.message || e), stack: String(e && e.stack || '').slice(0, 800) });
    }
    function runCustom(host2, s, inf) {
      var api = { engine: ES.engine, audio: ES.audio, ui: ES.ui, set: { index: s.index, n: s.n, exId: s.exId, plan: s.plan },
        done: function (result) { if (cur && !cur.aborted) sess.finishSet(result || {}); },
        rate: function () { return ratingSheet(s.exId, s.index); } };
      try { inf.custom(host2, api); } catch (e) {
        reportErr(e);
        U.clear(host2);
        host2.appendChild(U.el('div', { class: 'card' }, [U.el('p', null, 'This exercise could not start.'),
          ES.ui.button('End the set', { kind: 'primary', onClick: function () { sess.endSetEarly(); } })]));
      }
    }
  }
  function ratingSheet(exId, setIndex) {
    if (!ES.core.playtest.enabled()) return Promise.resolve(null);
    var h = ES.ui.sheet({ title: 'Quick rating', body: function (b) {
      b.appendChild(ES.core.playtest.ratingEl(exId, { set: setIndex, onDone: function (v) { h.close(v); } }));
    } });
    return h.closed;
  }
  function openPause() {
    if (!cur || ES.ui.sheetOpen()) return;
    var set = cur.set, n = set.n, i = Math.min(set.results.length + 1, n);
    if (cur.view) cur.view.pause();
    ES.core.clock.pause('menu');
    var h = ES.ui.sheet({ title: 'Paused', cls: 'sheet-pause', body: function (b) {
      b.appendChild(U.el('p', null, 'Trial ' + i + ' of ' + n + ' in this set. Nothing is lost while you pause.'));
    }, actions: [
      { label: 'End set', value: 'end', attrs: { 'data-end-set': '' } },
      { label: 'Help', value: 'help' },
      { label: 'Resume', kind: 'primary', value: 'resume', attrs: { 'data-resume': '' } }
    ] });
    h.closed.then(function (v) {
      ES.core.clock.resume('menu');
      if (!cur) return;
      if (v === 'end') { cur.aborted = true; if (cur.view) cur.view.abort(); ES.ui.session.endSetEarly(); return; }
      if (v === 'help') { openHelp(true); return; }
      if (cur.view) cur.view.resume();
    });
  }
  function openHelp(fromPause) {
    if (!cur || ES.ui.sheetOpen()) return;
    var set = cur.set, info = ES.ui.session.exInfo(set.exId), X = ES.ex[set.exId];
    if (cur.view) cur.view.pause();
    ES.core.clock.pause('menu');
    if (X && typeof X.openHelp === 'function') {          // the exercise's own "How it works" (exA request)
      var own = null;
      try { own = X.openHelp(); } catch (e) { own = null; }
      if (own && own.closed) {
        own.closed.then(function () { ES.core.clock.resume('menu'); if (cur && cur.view) cur.view.resume(); });
        return;
      }
    }
    var tips = info.tips || ((info.tutorial && info.tutorial.steps) || []).filter(function (s) { return s.kind === 'caption' || s.text; }).map(function (s) { return s.text; });
    var h = ES.ui.sheet({ title: info.name, cls: 'sheet-help', body: function (b) {
      if (info.short) b.appendChild(U.el('p', { class: 'lead' }, info.short));
      if (tips.length) b.appendChild(U.el('ul', { class: 'tips' }, tips.slice(0, 5).map(function (t) { return U.el('li', null, t); })));
      if (info.bet) b.appendChild(U.el('p', { class: 'bet' }, [U.el('strong', null, 'The bet: '), info.bet]));
    }, actions: [
      info.tutorial && info.tutorial.steps && info.tutorial.steps.length ? { label: 'Replay the tutorial', value: 'tutorial' } : null,
      { label: fromPause ? 'Resume' : 'Back to the trial', kind: 'primary', value: 'resume' }
    ].filter(Boolean) });
    h.closed.then(function (v) {
      ES.core.clock.resume('menu');
      if (!cur) return;
      if (v === 'tutorial') { ES.core.router.go('tutorial', { exId: set.exId, resume: true }); return; }
      if (cur.view) cur.view.resume();
    });
  }
  function unmount() {
    if (cur) {
      cur.aborted = true;
      if (cur.view) cur.view.abort();
      document.removeEventListener('visibilitychange', cur.onVis);
      // Left mid-set (Back, Help → tutorial): the set waits; invitations may show again and the clock rests.
      var s = ES.ui.session.currentSet();
      if (ES.ui.session.active() && s && !s.finished) { ES.ui.inSet = false; ES.core.clock.pause('away'); }
    }
    cur = null;
    ES.ui.quiet(false);
    document.documentElement.classList.remove('in-trial');
  }

  if (!ES.ui.screens.play) ES.ui.screens.play = { mount: mount, unmount: unmount, deepLink: false };
})(window.ES, window);
