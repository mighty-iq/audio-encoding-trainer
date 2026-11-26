/* ES.lab.hpcheck — headphone check by the anti-phase method (generic; after Woods, Siegel, Traer & McDermott 2017,
   docs/research/R4 §6a). Own synthesised stimuli: three 200 Hz tones of 1 s (100 ms ramps, 0.5 s gaps); one is
   6 dB quieter; one of the two louder tones has its right channel inverted. Over headphones the inverted tone
   sounds as loud as the other; over loudspeakers (or when a device sums left and right) it partly cancels and
   seems quietest. Task: tap the quietest. Six rounds, no feedback, pass at 5 of 6 (chance of passing by guessing:
   13/729 ≈ 1.8 %). Passing unlocks the direction dials (profile.settings.headphones); a manual override with a
   note is always offered. The check screens for headphone use; it says nothing about hearing. MIT licence. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var L = ES.lab = ES.lab || {};
  var H = L.hpcheck = { N: 6, PASS: 5, F: 200, TONE: 1.0, RAMP: 0.1, GAP: 0.5, LEAD: 0.3, TAIL: 0.2, QUIET_DB: -6, VER: 'ap-1' };
  H.AMP = 0.1;   // tone RMS −20 dBFS (peak −17 dBFS), the level of every other sound in the app

  /** Round k: the order of the three tones and the answer (1-based position of the quiet tone). */
  H.trial = function (rng, k) {
    var r = rng.fork ? rng.fork('hp' + k) : rng, order = ['std', 'anti', 'quiet'];
    for (var j = order.length - 1; j > 0; j--) { var m = Math.floor(r.next() * (j + 1)), t = order[j]; order[j] = order[m]; order[m] = t; }
    return { k: k, order: order, answer: order.indexOf('quiet') + 1 };
  };
  /** Stereo samples for one round at sample rate sr: {L, R} Float32Arrays. */
  H.samples = function (tr, sr) {
    var n = Math.round((H.LEAD + 3 * H.TONE + 2 * H.GAP + H.TAIL) * sr), Lc = new Float32Array(n), Rc = new Float32Array(n);
    var tn = Math.round(H.TONE * sr), rn = Math.round(H.RAMP * sr), w = 2 * Math.PI * H.F / sr;
    tr.order.forEach(function (kind, i) {
      var start = Math.round((H.LEAD + i * (H.TONE + H.GAP)) * sr);
      var a = H.AMP * Math.SQRT2 * (kind === 'quiet' ? Math.pow(10, H.QUIET_DB / 20) : 1), sign = kind === 'anti' ? -1 : 1;
      for (var s = 0; s < tn; s++) {
        var env = s < rn ? 0.5 - 0.5 * Math.cos(Math.PI * s / rn) : s >= tn - rn ? 0.5 - 0.5 * Math.cos(Math.PI * (tn - s) / rn) : 1;
        var v = a * env * Math.sin(w * s);
        Lc[start + s] = v; Rc[start + s] = sign * v;
      }
    });
    return { L: Lc, R: Rc };
  };
  H.score = function (answers, trials) {
    var c = 0;
    trials.forEach(function (t, i) { if (answers[i] === t.answer) c++; });
    return { correct: c, of: trials.length, pass: c >= H.PASS };
  };
  /** Probability of passing by guessing (each round 1/3). */
  H.chance = function () {
    var p = 1 / 3, n = H.N, tot = 0;
    for (var k = H.PASS; k <= n; k++) tot += comb(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
    return tot;
  };
  function comb(n, k) { var r = 1; for (var i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; }

  // ---- UI (a sheet; nothing moves while a tone plays)
  function U() { return ES.core.util; }
  function saveResult(rec, on) {
    ES.core.store.update('profile', function (p) { p.settings = p.settings || {}; p.settings.headphones = !!on; p.settings.hpCheck = rec; });
    ES.hooks.emit('hpcheck', rec);
  }
  function play(tr) {
    var A = ES.audio, c = A && A.ctx && A.ctx.ensure && A.ctx.ensure();
    if (!c || typeof c.createBuffer !== 'function' || typeof A.play !== 'function') return Promise.resolve({ silent: true });
    var sm = H.samples(tr, c.sampleRate), buf = c.createBuffer(2, sm.L.length, c.sampleRate);
    if (buf.copyToChannel) { buf.copyToChannel(sm.L, 0); buf.copyToChannel(sm.R, 1); }
    else { buf.getChannelData(0).set(sm.L); buf.getChannelData(1).set(sm.R); }
    var h = A.play(buf) || {};
    return Promise.resolve(h.ended).then(function (r) { return { silent: !!(r && r.ok === false) }; });
  }
  H.open = function (opts) {
    opts = opts || {};
    var u = U(), rng = ES.core.rng('hp:' + Date.now()), trials = [], answers = [], k = 0, silent = false;
    for (var i = 0; i < H.N; i++) trials.push(H.trial(rng, i));
    var body = u.el('div', { class: 'lab-hp', 'data-hpcheck': '' });
    var h = ES.ui.sheet({ title: 'Headphone check', cls: 'sheet-lab-hp', body: body, onClose: function () { if (ES.audio && ES.audio.stop) ES.audio.stop(); if (opts.onClose) opts.onClose(); } });
    function intro() {
      u.clear(body);
      body.appendChild(u.el('p', null, 'Put on your headphones. Each round plays three low hums; one is quieter. Tap its number. Six rounds, about a minute.'));
      body.appendChild(u.el('p', { class: 'hint' }, 'This tells headphones from a speaker, so the direction dials work as they should. It is not a hearing test.'));
      body.appendChild(ES.ui.button('Start the check', { kind: 'primary', wide: true, attrs: { 'data-hp-start': '' }, onClick: function () {
        if (ES.audio && ES.audio.ctx && ES.audio.ctx.ensure) { try { ES.audio.ctx.ensure(); if (ES.audio.ctx.unlock) ES.audio.ctx.unlock(); } catch (e) { /* no audio */ } }
        round();
      } }));
      manualRow(null);
    }
    function round() {
      u.clear(body);
      var status = u.el('p', { class: 'lab-hp-status mono', 'aria-live': 'polite' }, 'Round ' + (k + 1) + ' of ' + H.N + ' · listen…');
      var row = u.el('div', { class: 'lab-hp-keys', role: 'group', 'aria-label': 'Which hum was quietest?' });
      var keys = [1, 2, 3].map(function (n) {
        var b = ES.ui.button(String(n), { kind: 'secondary', cls: 'lab-hp-key', attrs: { 'data-hp-key': String(n) }, onClick: function () { pick(n); } });
        b.disabled = true; row.appendChild(b); return b;
      });
      body.appendChild(u.el('p', null, 'Which hum was quietest?'));
      body.appendChild(row);
      body.appendChild(status);
      function pick(n) {
        if (keys[0].disabled) return;
        keys.forEach(function (b) { b.disabled = true; });
        answers[k] = n; k++;
        if (k < H.N) setTimeout(round, 350); else result();
      }
      play(trials[k]).then(function (r) {
        if (r.silent) silent = true;
        status.textContent = 'Round ' + (k + 1) + ' of ' + H.N + (silent ? ' · sound is unavailable here' : ' · which was quietest?');
        keys.forEach(function (b) { b.disabled = false; });
        try { keys[0].focus({ preventScroll: true }); } catch (e) { /* ignore */ }
      });
    }
    function result() {
      var sc = H.score(answers, trials), rec = { at: Date.now(), result: sc.pass ? 'pass' : 'fail', score: sc.correct + '/' + sc.of, ver: H.VER };
      if (!silent) saveResult(rec, sc.pass);
      u.clear(body);
      body.setAttribute('data-hp-result', silent ? 'silent' : rec.result);
      if (silent) body.appendChild(u.el('p', null, 'Sound did not play here, so the check could not run. Nothing was changed.'));
      else if (sc.pass) body.appendChild(u.el('p', null, [u.el('strong', null, 'Headphones detected (' + rec.score + '). '), 'The direction dials are unlocked.']));
      else body.appendChild(u.el('p', null, [u.el('strong', null, 'That sounded like a speaker (' + rec.score + '). '),
        'Direction dials stay off; everything else works the same. If you are wearing headphones, try again somewhere quiet, or switch them on by hand.']));
      body.appendChild(u.el('div', { class: 'row-buttons' }, [
        sc.pass && !silent ? null : ES.ui.button('Try again', { small: true, attrs: { 'data-hp-again': '' }, onClick: function () { k = 0; answers = []; silent = false; trials = trials.map(function (t, i) { return H.trial(ES.core.rng('hp:' + Date.now() + ':' + i), i); }); round(); } }),
        ES.ui.button('Done', { small: true, kind: 'primary', attrs: { 'data-hp-done': '' }, onClick: function () { h.close('done'); } })
      ]));
      if (!sc.pass) manualRow(rec);
    }
    function manualRow(failed) {
      var note = u.el('input', { type: 'text', class: 'text-input', maxlength: '80', 'aria-label': 'Note (optional)', placeholder: 'optional note, e.g. wired earbuds', 'data-hp-note': '' });
      body.appendChild(u.el('details', { class: 'lab-hp-manual' }, [u.el('summary', null, 'I am wearing headphones: switch them on by hand'), note,
        ES.ui.button('Switch on by hand', { small: true, attrs: { 'data-hp-manual': '' }, onClick: function () {
          saveResult({ at: Date.now(), result: 'manual', note: note.value.trim().slice(0, 80), after: failed ? failed.score : null, ver: H.VER }, true);
          ES.ui.toast('Headphones switched on by hand');
          h.close('manual');
        } })]));
    }
    intro();
    return h;
  };
  H.status = function () {
    var s = (ES.core.store.peek('profile').settings || {}), c = s.hpCheck;
    if (c && c.result === 'pass') return 'Checked: headphones detected (' + c.score + ').';
    if (s.headphones && c && c.result === 'manual') return 'Switched on by hand' + (c.note ? ' (' + c.note + ')' : '') + '.';
    if (c && c.result === 'fail') return 'Last check sounded like a speaker (' + c.score + '); direction dials are off.';
    return s.headphones ? 'Headphones on (not checked).' : 'Not checked yet: direction dials are off.';
  };
})(typeof window !== 'undefined' ? window : globalThis);
