/* Screen 'probe' — the probe runner (CONTRACTS §0, §11). params {items:[{probe}], kind, i, done:[…]}: one probe
   per mount; Next mounts the following item. Flow: intro (what it measures, how to answer, practice note) → Start
   (inside the tap: audio unlock) → trials: render → play once → answer → next, with no right/wrong feedback (a
   check-in measures; training teaches) → the run is saved → result with its margin, trend state and Next.
   While sound plays nothing on screen changes, toasts wait and store writes wait; ES.ui.inSet holds Chimera
   invitations until the result panel. A hidden tab pauses; resume replays the current trial (never scored twice).
   Fits 360×640 without scrolling. MIT licence. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var L = ES.lab = ES.lab || {};
  var RN = L.runner = L.runner || {};
  var cur = null;
  function U() { return ES.core.util; }
  function R() { return L.records; }
  var KIND = { baseline: 'baseline', weekly: 'weekly check-in', retention: 'retention check', extra: 'extra run' };

  RN.start = function (items, kind) {
    var list = (items || []).filter(function (it) { return it && L.probes[it.probe]; }).map(function (it) { return { probe: it.probe }; });
    if (!list.length) return false;
    return ES.core.router.go('probe', { items: list, kind: kind || 'extra', i: 0, done: [] });
  };
  function settings() { return ES.core.store.peek('profile').settings || {}; }
  function finishedRuns(id) { return id === 'diary' ? R().runsOf([], 'diary', R().diary()).length : R().runsOf(R().all(), id).length; }
  function pauseIcon() {
    var u = U();
    return u.svg('svg', { viewBox: '0 0 24 24', class: 'icon', 'aria-hidden': 'true', focusable: 'false' },
      [u.svg('rect', { x: 6.5, y: 5, width: 3.6, height: 14, rx: 1 }), u.svg('rect', { x: 13.9, y: 5, width: 3.6, height: 14, rx: 1 })]);
  }
  function report(e) { if (root.console) console.error('[lab runner]', e); if (ES._keepError) ES._keepError({ at: Date.now(), kind: 'lab', msg: String(e && e.message || e), stack: String(e && e.stack || '').slice(0, 800) }); }

  function mount(rootEl, params) {
    L.ui.css();
    var u = U(), items = params.items || [], i = params.i || 0, kind = params.kind || 'extra', done = params.done || [];
    if (!items.length) { ES.core.router.go('lab', {}, { replace: true }); return; }
    var item = items[i], def = item && L.probes[item.probe];
    var title = u.el('span', { class: 'tb-title' }, def ? def.name : 'Check-in');
    var level = u.el('span', { class: 'tb-level mono' }, items.length > 1 ? (i + 1) + ' of ' + items.length : '');
    var dots = u.el('ol', { class: 'dots', 'aria-label': 'Progress' });
    var bar = u.el('header', { class: 'trial-bar' }, [
      u.el('button', { type: 'button', class: 'tb-btn', 'aria-label': 'Pause', 'data-lab-pause': '', on: { click: function () { openPause(); } } }, pauseIcon()),
      u.el('div', { class: 'tb-mid' }, [u.el('div', { class: 'tb-line' }, [title, level]), dots]),
      ES.core.playtest && ES.core.playtest.enabled() ? ES.core.playtest.noteButton(function () { return 'probe:' + (def ? def.id : '') + ':' + (cur && cur.run ? cur.run.i : 0); }, { cls: 'tb-note' }) : null
    ]);
    var host = u.el('div', { class: 'trial-host' });
    rootEl.appendChild(u.el('div', { class: 'trial lab-run', 'data-lab-run': def ? def.id : '' }, [bar, host]));
    cur = { host: host, dots: dots, def: def, items: items, i: i, kind: kind, done: done, run: null, player: null, widget: null, tok: 0, state: 'intro', trial: null, prevInSet: !!ES.ui.inSet };
    cur.onVis = function () { if (root.document.hidden && cur && (cur.state === 'listen' || cur.state === 'answer')) openPause(); };
    root.document.addEventListener('visibilitychange', cur.onVis);
    if (!def) { summary(); return; }
    var av = def.available();
    if (!av.ok) { notAvailable(av.why); return; }
    intro();
  }

  function panel(children) { var u = U(); U().clear(cur.host); var p = u.el('section', { class: 'card lab-panel' }, children); cur.host.appendChild(p); return p; }
  function paintDots(n, k) {
    var u = U(); u.clear(cur.dots);
    if (n > 30) { cur.dots.appendChild(u.el('li', { class: 'dots-count mono' }, Math.min(k + 1, n) + '/' + n)); return; }
    for (var j = 0; j < n; j++) cur.dots.appendChild(u.el('li', { class: j < k ? 'is-done' : j === k ? 'is-now' : '' }));
  }
  function notAvailable(why) {
    var u = U();
    panel([u.el('h1', { 'data-autofocus': '' }, cur.def.name), u.el('p', null, why || 'This check-in arrives in a later build.'), nextButton()]);
  }
  function intro() {
    var u = U(), def = cur.def, practice = def.id !== 'diary' && finishedRuns(def.id) === 0;
    cur.practice = practice;
    var hp = settings().headphones;
    panel([
      u.el('p', { class: 'eyebrow mono' }, def.distance + ' · ' + (practice ? 'practice run' : KIND[cur.kind] || 'check-in') + ' · about ' + def.minutes + ' min'),
      u.el('h1', { 'data-autofocus': '' }, def.name),
      u.el('p', { class: 'lead' }, def.short),
      u.el('p', null, [u.el('strong', null, 'How to answer: '), def.answerHow]),
      u.el('p', { class: 'hint' }, practice ? 'This first run is practice: it teaches the task and does not count toward your trend. There is no right-or-wrong feedback during check-ins.'
        : 'No right-or-wrong feedback during check-ins: just your best answer each time.'),
      def.id === 'diary' ? null : u.el('p', { class: 'hint' }, 'Sound: ' + (hp ? 'headphones' : 'speaker') + '. Use the same setup each time; a quiet spot helps.'),
      ES.ui.button(def.id === 'diary' ? 'Start the diary' : 'Start', { kind: 'primary', wide: true, attrs: { 'data-lab-start': '' }, onClick: begin })
    ]);
  }
  function begin() {
    var def = cur.def, A = ES.audio;
    if (def.id !== 'diary' && A && A.ctx && A.ctx.ensure) { try { A.ctx.ensure(); if (A.ctx.unlock) A.ctx.unlock(); } catch (e) { report(e); } }
    var form = R().nextForm(def.id), pid = R().pid(), seed = 'lab:' + pid + ':' + def.id + ':' + form + ':' + Date.now().toString(36);
    try { cur.run = def.make(form, ES.core.rng(seed), { prevEst: R().prevEst(def.id), playerSeed: pid }); }
    catch (e) { report(e); notAvailable('This check-in could not start: ' + (e && e.message || e)); return; }
    cur.form = form; cur.seed = seed; cur.t0 = Date.now(); cur.hp = !!settings().headphones;
    ES.ui.inSet = true;
    root.document.documentElement.classList.add('in-trial');
    if (cur.run.preview) preview(); else loop();
  }

  // ---- sound
  function render(spec, seed) { return Promise.resolve(ES.audio.render(spec, { seed: seed })).then(function (r) { return r && r.buffer ? r.buffer : r; }); }
  function play(buf, onEnd) {
    var tok = ++cur.tok, ended = false;
    ES.ui.quiet(true); if (ES.core.store.hold) ES.core.store.hold();
    function end(res) { if (ended) return; ended = true; ES.ui.quiet(false); if (ES.core.store.release) ES.core.store.release(); if (cur && tok === cur.tok) { cur.player = null; onEnd(res || {}); } }
    try { cur.player = ES.audio.play(buf) || {}; } catch (e) { report(e); end({ ok: false }); return; }
    cur.player._end = end;
    Promise.resolve(cur.player.ended).then(end, function () { end({ ok: false }); });
  }
  function stopSound() {
    if (!cur || !cur.player) return;
    var p = cur.player; cur.player = null; cur.tok++;
    try { if (p.stop) p.stop(); } catch (e) { /* ignore */ }
    if (p._end) p._end({ stopped: true });
  }
  /** Render and play one spec; status set before playback; then(cb) once it ended (or failed). */
  function sound(spec, seed, statusEl, text, then) {
    if (!ES.audio || typeof ES.audio.render !== 'function') { statusEl.textContent = 'Sound is unavailable here.'; then({ silent: true }); return; }
    statusEl.textContent = 'Getting the sound ready…';
    cur.state = 'loading';
    var tok = cur.tok;
    render(spec, seed).then(function (buf) {
      if (!cur || tok !== cur.tok || cur.state !== 'loading') return;
      statusEl.textContent = text;
      cur.state = 'listen';
      play(buf, function (r) { if (cur && cur.state === 'listen') then({ silent: r && r.ok === false }); });
    }, function (e) {
      report(e);
      if (!cur || tok !== cur.tok) return;
      cur.state = 'error';
      statusEl.textContent = 'This sound could not be prepared.';
      cur.host.appendChild(U().el('div', { class: 'row-buttons' }, [ES.ui.button('Try again', { kind: 'primary', attrs: { 'data-lab-retry': '' }, onClick: function () { replay(); } }),
        ES.ui.button('End the check-in', { attrs: { 'data-lab-abort': '' }, onClick: abort })]));
    });
  }

  // ---- stages
  function preview() {
    var u = U(), pv = cur.run.preview, status = u.el('p', { class: 'lab-status', 'aria-live': 'polite' });
    var again = ES.ui.button('Hear the voice again', { attrs: { 'data-lab-preview': '' }, onClick: function () { if (cur.state === 'ready') go(); } });
    var startB = ES.ui.button('Begin', { kind: 'primary', attrs: { 'data-lab-begin': '' }, onClick: function () { if (cur.state === 'ready') { cur.state = 'run'; loop(); } } });
    panel([u.el('h1', null, 'Meet the voice'), u.el('p', null, pv.text + ' Two other voices will talk over it; tap what this one said.'), status, u.el('div', { class: 'lab-preview' }, [again, startB])]);
    again.disabled = startB.disabled = true;
    function go() { again.disabled = startB.disabled = true; sound(pv.audio, cur.seed + ':preview', status, 'Listen: this is your voice…', function () { cur.state = 'ready'; status.textContent = '“' + pv.said + '”'; again.disabled = startB.disabled = false; }); }
    cur.replay = go;
    go();
  }
  function loop() {
    if (!cur || !cur.run) return;
    var t = null;
    try { t = cur.run.next(); } catch (e) { report(e); }
    if (!t) { finish(); return; }
    cur.trial = t;
    var p = cur.run.progress();
    paintDots(p.n, p.i);
    if (t.ui.kind === 'story') { story(t); return; }
    if (t.ui.kind === 'diary') { diary(t); return; }
    stageTrial(t);
  }
  function stageTrial(t) {
    var u = U(), status = u.el('p', { class: 'lab-status', 'aria-live': 'polite' });
    var onAnswer = function (resp) {
      if (!cur || cur.state !== 'answer') return;
      cur.state = 'saving';
      try { cur.run.record(t, resp); } catch (e) { report(e); }
      status.textContent = 'Next…';
      setTimeout(loop, 350);
    };
    var w = t.ui.kind === 'matrix' ? L.ui.matrixPanel(t.ui.columns, onAnswer) : t.ui.kind === 'keypad' ? L.ui.keypad(t.ui.len || 3, onAnswer) : L.ui.choice(t.ui.options, onAnswer);
    if (cur.widget && cur.widget.destroy) cur.widget.destroy();
    cur.widget = w;
    u.clear(cur.host);
    var prompt = t.ui.kind === 'matrix' ? null : u.el('p', { class: 'lab-prompt' }, t.ui.prompt);
    cur.host.appendChild(u.el('div', { class: 'lab-stage', 'data-lab-trial': String(t.i), 'data-lab-kind': t.ui.kind }, [status, prompt, w.el]));
    cur.replay = function () { sound(t.audio, t.seed, status, 'Listen…', ready); };
    function ready(r) { if (!cur) return; cur.state = 'answer'; status.textContent = (r && r.silent ? 'Sound is unavailable here. ' : '') + (t.ui.kind === 'matrix' ? 'One word per column, then Done.' : ''); w.enable(); }
    cur.replay();
  }
  function story(t) {
    var u = U(), status = u.el('p', { class: 'lab-status', 'aria-live': 'polite' }), answers = [], qi = 0;
    u.clear(cur.host);
    cur.host.appendChild(u.el('div', { class: 'lab-stage', 'data-lab-kind': 'story' }, [u.el('p', { class: 'lab-prompt' }, t.meta.title ? '“' + t.meta.title + '”' : 'A short story'), status]));
    cur.replay = function () { sound(t.audio, t.seed, status, 'Listen to the whole story (about a minute)…', function () { cur.state = 'answer'; question(); }); };
    function question() {
      if (qi >= t.ui.questions.length) { effort(); return; }
      var q = t.ui.questions[qi], w = L.ui.choice(q.options, function (r) { answers[qi] = r.pick; qi++; setTimeout(question, 250); }, { list: true, label: q.q });
      if (cur.widget && cur.widget.destroy) cur.widget.destroy();
      cur.widget = w;
      paintDots(t.ui.questions.length + 1, qi);
      u.clear(cur.host);
      cur.host.appendChild(u.el('div', { class: 'lab-stage', 'data-lab-kind': 'question', 'data-q': String(qi) }, [u.el('p', { class: 'lab-status' }, 'Question ' + (qi + 1) + ' of ' + t.ui.questions.length), u.el('p', { class: 'lab-q' }, q.q), w.el]));
      w.enable();
    }
    function effort() {
      paintDots(t.ui.questions.length + 1, t.ui.questions.length);
      var w = L.ui.scale(function (r) { cur.state = 'saving'; try { cur.run.record(t, { answers: answers, effort: r.v }); } catch (e) { report(e); } setTimeout(loop, 250); }, { lo: 'very little', hi: 'a lot' });
      u.clear(cur.host);
      cur.host.appendChild(u.el('div', { class: 'lab-stage', 'data-lab-kind': 'effort' }, [u.el('p', { class: 'lab-q' }, 'How much effort did listening take?'), w.el]));
      w.enable();
    }
    cur.replay();
  }
  function diary(t) {
    var u = U(), items = t.ui.items, ratings = {}, k = 0;
    cur.state = 'answer';
    function step() {
      if (k >= items.length) { cur.state = 'saving'; try { cur.run.record(t, { ratings: ratings }); } catch (e) { report(e); } loop(); return; }
      paintDots(items.length, k);
      var it = items[k], w = L.ui.scale(function (r) { ratings[it.id] = r.v; k++; setTimeout(step, 200); }, { lo: 'very hard', hi: 'very easy', none: 'Did not happen this week' });
      u.clear(cur.host);
      cur.host.appendChild(u.el('div', { class: 'lab-stage', 'data-lab-kind': 'diary', 'data-item': it.id }, [u.el('p', { class: 'lab-status' }, 'This past week · ' + (k + 1) + ' of ' + items.length), u.el('p', { class: 'lab-q' }, it.text), w.el]));
      w.enable();
    }
    step();
  }
  function replay() { if (cur && typeof cur.replay === 'function') { stopSound(); cur.replay(); } }

  // ---- end of a run
  function finish() {
    var def = cur.def, fin = cur.run.finish(), now = Date.now(), u = U(), before = L.schedule(R().state(now)).baseline.complete;
    var oldTrend = def.id === 'diary' ? null : R().trend(def.id);
    var saved;
    if (def.id === 'diary') {
      var wk = u.weekKey(cur.t0), items = def.items.map(function (it) { var v = fin.extra.ratings[it.id]; return { id: it.id, v: v >= 1 && v <= 5 ? v : null }; });
      saved = ES.core.store.update('diary', function (d) { d.entries = (d.entries || []).filter(function (e) { return e.week !== wk; }).concat([{ week: wk, at: cur.t0, items: items }]); });
    } else {
      var rec = { id: u.uid('run'), probe: def.id, form: cur.form, seed: cur.seed, at: cur.t0, end: now, practice: !!cur.practice, kind: cur.kind,
        proc: def.proc, est: fin.est, n: fin.n, unit: def.unit, trials: fin.trials, extra: fin.extra, edge: fin.edge || null, hp: cur.hp, aborted: false };
      saved = R().add(rec);
      ES.hooks.emit('lab:run', { probe: def.id, est: fin.est, practice: !!cur.practice, kind: cur.kind });
    }
    ES.ui.inSet = cur.prevInSet;
    root.document.documentElement.classList.remove('in-trial');
    cur.state = 'done';
    var tr = def.id === 'diary' ? R().trend('diary') : R().trend(def.id), after = L.schedule(R().state(now)).baseline.complete;
    cur.done = cur.done.concat([{ probe: def.id, m: fin.est.m, s: fin.est.s, practice: !!cur.practice }]);
    var value = fin.est.m == null ? 'No items answered' : L.exporter.showValue(def.id, fin.est.m), invites = u.el('div', { class: 'invites' });
    var line = def.id === 'diary' ? (fin.extra.answered + ' of ' + def.items.length + ' answered; saved for this week.') : cur.practice ? 'Practice run: it taught the task and does not count toward your trend.'
      : tr.ok ? 'Trend: ' + (L.stats.VERDICT_TEXT[tr.verdict] || tr.verdict) + '.' : (L.stats.VERDICT_TEXT[tr.verdict] || 'Saved') + '.';
    panel([
      u.el('p', { class: 'eyebrow mono' }, def.name + ' · ' + (cur.practice ? 'practice run' : KIND[cur.kind] || 'run') + (saved ? ' · saved' : ' · not saved on this device')),
      u.el('h1', { 'data-autofocus': '' }, [u.el('span', { class: 'mono' }, value), fin.est.s && def.id !== 'diary' ? u.el('span', { class: 'hint mono' }, ' ± ' + (def.unit === 'dB' ? U().round(fin.est.s, 1) + ' dB' : def.id === 'rooms' ? U().round(fin.est.s / 6.02, 2) + ' doublings' : Math.round(fin.est.s) + ' points')) : null]),
      u.el('p', null, line),
      fin.edge ? u.el('p', { class: 'hint' }, fin.edge === 'hi' ? 'You reached the easy end of this check-in’s range: the true value may be better still.' : 'You reached the hard end of this check-in’s range.') : null,
      ES.core.playtest && ES.core.playtest.enabled() ? ES.core.playtest.ratingEl('probe:' + def.id, {}) : null,
      invites, nextButton()
    ]);
    if (!before && after) ES.core.chimera.invite('milestone', { el: invites, title: 'Baseline complete', detail: 'Your weekly check-ins start in about a week. Compare notes with other listeners.' });
    else if (tr.verdict === 'clear' && (!oldTrend || oldTrend.verdict !== 'clear')) ES.core.chimera.invite('milestone', { el: invites, title: 'A clear gain', detail: def.name + ': ' + L.exporter.showGain(def.id, tr.gain) + ' better than your baseline.' });
  }
  function nextButton() {
    var u = U(), n = cur.i + 1, nx = cur.items[n], d = nx && L.probes[nx.probe];
    if (d) return ES.ui.button('Next: ' + d.name + ' · ' + d.minutes + ' min', { kind: 'primary', wide: true, attrs: { 'data-lab-next': '' }, onClick: function () {
      ES.core.router.go('probe', { items: cur.items, kind: cur.kind, i: n, done: cur.done }, { replace: true });
    } });
    return u.el('div', { class: 'row-buttons' }, [ES.ui.button(cur.items.length > 1 ? 'Check-in done · back to Lab' : 'Back to Lab', { kind: 'primary', wide: true, attrs: { 'data-lab-back': '' }, onClick: function () { ES.core.router.go('lab', {}, { replace: true }); } })]);
  }
  function summary() { var u = U(); panel([u.el('h1', null, 'Check-in done'), nextButton()]); }

  // ---- pause and abort
  function openPause() {
    if (!cur || cur.state === 'done' || cur.state === 'intro' || ES.ui.sheetOpen()) return;
    var wasListening = cur.state === 'listen' || cur.state === 'loading';
    if (wasListening) { stopSound(); cur.state = 'paused'; }
    var h = ES.ui.sheet({ title: 'Paused', body: 'This run is saved only when it is complete. Resume plays the current sound again from the start.',
      actions: [{ label: 'End without saving', value: 'end', attrs: { 'data-lab-end': '' } }, { label: 'Resume', kind: 'primary', value: 'resume', attrs: { 'data-lab-resume': '' } }] });
    h.closed.then(function (v) {
      if (!cur) return;
      if (v === 'end') { abort(); return; }
      if (wasListening && cur.state === 'paused') replay();
    });
  }
  function abort() {
    stopSound();
    if (cur) { cur.state = 'done'; ES.ui.inSet = cur.prevInSet; }
    root.document.documentElement.classList.remove('in-trial');
    ES.core.router.go('lab', {}, { replace: true });
  }
  function unmount() {
    if (!cur) return;
    stopSound();
    if (cur.widget && cur.widget.destroy) cur.widget.destroy();
    root.document.removeEventListener('visibilitychange', cur.onVis);
    if (cur.state !== 'done') ES.ui.inSet = cur.prevInSet;
    root.document.documentElement.classList.remove('in-trial');
    cur = null;
  }
  RN.state = function () { return cur ? { state: cur.state, probe: cur.def && cur.def.id, trial: cur.trial } : null; };
  ES.ui.screens.probe = { mount: mount, unmount: unmount, deepLink: false };
})(typeof window !== 'undefined' ? window : globalThis);
