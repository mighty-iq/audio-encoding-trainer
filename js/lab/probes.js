/* ES.lab.probes (part 1) — probe definitions (CONTRACTS §11; PLAN §8): Matrix, Digits, Two voices, plus the kit
   the other probes share (probes-more.js). A probe is {id, name, distance, minutes, core, unit, better, sigmaW,
   sigmaX, practice, ref, short, measures, answerHow, available(), make(form, rng, opts) → run}. A run is a pure
   state machine: next() → a probe trial (TrialSpec-shaped audio + ui + answer) or null, record(trial, response)
   → {score}, progress(), finish() → {est:{m, s}, n, trials:[compact], extra, edge}. Alternate forms come from the
   seed: new word combinations, talkers and noise tokens on every run; probe-set content only (materials.js).
   No feedback during probe trials. Every number the app says about a probe comes from these definitions.
   MIT licence. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var L = ES.lab = ES.lab || {};
  var M = L.materials, PR = L.procedures, S = L.stats;
  var PROBES = L.probes = L.probes || {};
  var OUT = { db: -20 };
  var HOMOGENISE_CAP = 3;  // dB: word-level corrections capped like matrix tests do (Puglisi et al. 2015)

  // ---- kit shared by the probes
  var K = L.probeKit = {};
  K.r2 = function (x) { return Math.round(x * 100) / 100; };
  K.shuffle = function (rng, a) { return rng.shuffle ? rng.shuffle(a) : a.slice(); };
  K.pick = function (rng, a) { return a[Math.floor(rng.next() * a.length)]; };
  /** Voices for a role: vocab.probeVoices[role] when given, else a stable split of the matrix voices. */
  K.voicesFor = function (role) {
    var X = M.idx(), pv = (X.vocab && X.vocab.probeVoices) || {}, mv = X.matrix.voices;
    if (Array.isArray(pv[role])) { var given = pv[role].filter(function (v) { return mv.indexOf(v) >= 0 || role === 'story'; }); if (given.length) return given; }
    if (role === 'newvoice') return mv.length >= 2 ? mv.slice(Math.ceil(mv.length / 2)) : mv.slice();
    return mv.length >= 2 ? mv.slice(0, Math.ceil(mv.length / 2)) : mv.slice();
  };
  /** One matrix sentence: a word per slot (never the previous sentence's word in that slot), word clips of one
      voice in a row with short gaps after a noise lead-in. Returns {words, parts, dur}. */
  K.matrixSentence = function (rng, voice, prev, opts) {
    opts = opts || {};
    var X = M.idx(), words = [], parts = [], t = opts.lead != null ? opts.lead : 0.5, corr = [];
    X.matrix.slots.forEach(function (s, i) {
      var list = X.matrix.words[s], w;
      do { w = K.pick(rng, list); } while (prev && prev[i] === w && list.length > 1);
      words.push(w);
      var id = M.clip(voice, 'word', w), c = M.meta(id) || {};
      corr.push(isFinite(c.diff) ? Math.max(-HOMOGENISE_CAP, Math.min(HOMOGENISE_CAP, +c.diff)) : 0);
      parts.push({ clip: id, at: K.r2(t), db: 0, role: 'target' });
      t += M.dur(id, 0.45) + 0.04 + rng.next() * 0.04;
    });
    var cm = S.mean(corr);
    parts.forEach(function (p, i) { p.db = K.r2(corr[i] - cm); });  // harder words a little louder (diff > 0 = harder)
    if (opts.room) parts.forEach(function (p) { p.room = true; });
    if (opts.fx) parts.forEach(function (p) { p.fx = opts.fx; });
    return { words: words, parts: parts, dur: t };
  };
  K.matrixColumns = function () {
    var X = M.idx();
    return X.matrix.slots.map(function (s) { return { id: s, label: M.SLOT_LABEL[s] || s, options: X.matrix.words[s].slice() }; });
  };
  K.countWords = function (answer, picks) {
    var k = 0;
    (answer || []).forEach(function (w, i) { if (picks && picks[i] != null && M.norm(picks[i]) === M.norm(w)) k++; });
    return k;
  };
  /** Bed db for an SNR re the sentence's mean level: the renderer references beds to the first target part. */
  K.bedDb = function (snr, parts) { return K.r2(-snr - ((parts[0] && parts[0].db) || 0)); };
  K.edge = function (e) { return e && e.atEdge ? e.atEdge : null; };

  /** Run state shared by every probe. redraw(): the current trial was voided (a sound that did not play, or a second
      pause while it played): the next trial keeps the procedure's level but draws new items (never charged). */
  function base(def, form, rng, n) {
    var run = { probe: def.id, form: form, proc: def.proc, seed: rng.seed, n: n, i: 0, log: [], redraws: 0 };
    run.redraw = function () { run.redraws++; return run.redraws; };
    return run;
  }
  K.base = base;
  /** The fork label of trial i, new after every redraw. */
  K.tag = function (run, prefix) { return prefix + run.i + (run.redraws ? 'r' + run.redraws : ''); };

  // ---- Matrix (near–mid): 5-word closed-set sentences in steady speech-shaped noise, word scoring, Bayesian track
  PROBES.matrix = {
    id: 'matrix', name: 'Matrix', distance: 'near–mid', minutes: 3, core: true, proc: 'matrix-1', n: 20,
    unit: 'dB', better: -1, sigmaW: 0.6, sigmaX: 0.3, practice: { c0: 0.5, sd: 0.4, q: 0.35 }, ref: { m: -6, s: 2 },
    short: 'Five-word sentences in steady noise, from voices you never train with.',
    measures: 'The noise level at which you catch half the words. Lower (more negative) is better.',
    answerHow: 'Tap one word in each column: the name, verb, number, kind and object you heard. Guess when unsure.',
    temper: 1, targets: [0.7, 0.5], grid: { lo: -22, hi: 12, step: 0.25, mu: -6, sd: 6, slopes: [0.08, 0.11, 0.15, 0.2, 0.26], slopeW: [1, 2, 3, 2, 1],
      lapses: [0.01, 0.04, 0.1], lapseW: [0.6, 0.3, 0.1], guess: 0.1 },
    available: function () {
      var X = M.idx(), v = K.voicesFor('matrix');
      if (X.matrix.slots.length < 5) return { ok: false, why: 'The matrix words arrive with the probe voices.' };
      return v.length ? { ok: true } : { ok: false, why: 'The probe voices for the matrix arrive in a later build.' };
    },
    make: function (form, rng, opts) {
      var def = this, voices = K.voicesFor('matrix'), run = base(def, form, rng, def.n);
      var T = PR.bayes({ grid: def.grid, n: def.n, start: def.grid.mu + 8, temper: def.temper, round: 0.5, min: -21, max: 11, targets: def.targets });
      var prev = null, vOrder = K.shuffle(rng.fork('voices'), voices);
      run.next = function () {
        if (T.done()) return null;
        var i = run.i, r = rng.fork(K.tag(run, 's')), v = vOrder[i % vOrder.length], snr = T.next();
        var s = K.matrixSentence(r, v, prev);
        prev = s.words;
        return { id: 'matrix-' + form + '-' + i, probe: 'matrix', i: i, seed: rng.seed + ':' + i, level: snr,
          audio: { out: OUT, spatial: 'mono', dur: K.r2(s.dur + 0.3), parts: s.parts, beds: [{ kind: 'ssn', from: 'target', db: K.bedDb(snr, s.parts) }], room: null },
          ui: { kind: 'matrix', columns: K.matrixColumns(), prompt: 'Which words did you hear?' },
          answer: s.words, meta: { probe: true, items: s.words, voices: [v], form: form, synthetic: M.synthetic(v) } };
      };
      run.record = function (trial, resp) {
        var k = K.countWords(trial.answer, resp && resp.picks);
        T.record(trial.level, k, trial.answer.length);
        run.log.push([trial.i, trial.level, k, trial.answer.length, voices.indexOf(trial.meta.voices[0])]);
        run.i++;
        return { score: k / trial.answer.length, k: k };
      };
      run.progress = function () { return { i: run.i, n: def.n }; };
      run.finish = function () {
        var e = T.estimate();
        return { est: { m: K.r2(e.m), s: K.r2(e.s) }, n: run.i, trials: run.log, edge: K.edge(e),
          extra: { slope: K.r2(e.slope), lapse: K.r2(e.lapse), pc: K.r2(S.mean(run.log.map(function (x) { return x[2] / x[3]; }))) } };
      };
      return run;
    }
  };

  // ---- Digits (mid): natural talkers, digit triplets in steady noise, 1-up/1-down 2 dB, SRT = mean of trials 5–25
  PROBES.digits = {
    id: 'digits', name: 'Digits', distance: 'mid', minutes: 2.5, core: true, proc: 'digits-1', n: 24,
    unit: 'dB', better: -1, sigmaW: 0.9, sigmaX: 0.4, practice: { c0: 0.3, sd: 0.4, q: 0.35 }, ref: { m: -9, s: 2 },
    short: 'Three digits in steady noise, spoken by real people you never train with.',
    measures: 'The noise level at which you get half of the triplets fully right. Lower is better.',
    answerHow: 'Type the three digits in the order you heard them. Guess when unsure.',
    available: function () {
      return M.idx().digits.voices.length ? { ok: true } : { ok: false, why: 'The recorded digit talkers arrive in a later build.' };
    },
    make: function (form, rng, opts) {
      var def = this, X = M.idx(), voices = X.digits.voices, run = base(def, form, rng, def.n);
      var prev = opts && isFinite(opts.prevEst) ? opts.prevEst : -10;
      var T = PR.staircase({ start: Math.max(-14, Math.min(4, Math.round(prev + 6))), step: 2, n: def.n, min: -28, max: 10, from: 5, to: 25, guess: 0.001 });
      var vOrder = K.shuffle(rng.fork('voices'), voices);
      run.next = function () {
        if (T.done()) return null;
        var i = run.i, r = rng.fork(K.tag(run, 't')), v = vOrder[i % vOrder.length], snr = T.next();
        var pool = K.shuffle(r, X.digits.words[v]).slice(0, 3), t = 0.5, parts = [];
        pool.forEach(function (d) {
          var id = M.clip(v, 'digit', d);
          parts.push({ clip: id, at: K.r2(t), db: 0, role: 'target' });
          t += M.dur(id, 0.5) + 0.15 + r.next() * 0.1;   // 200 ± 50 ms gaps (Koopmans et al. 2018)
        });
        var answer = pool.map(function (d) { return String(M.DIGITS.indexOf(d)); });
        return { id: 'digits-' + form + '-' + i, probe: 'digits', i: i, seed: rng.seed + ':' + i, level: snr,
          audio: { out: OUT, spatial: 'mono', dur: K.r2(t + 0.2), parts: parts, beds: [{ kind: 'ssn', from: 'target', db: K.bedDb(snr, parts) }], room: null },
          ui: { kind: 'keypad', len: 3, prompt: 'Type the three digits.' }, answer: answer,
          meta: { probe: true, items: pool, voices: [v], form: form, synthetic: M.synthetic(v) } };
      };
      run.record = function (trial, resp) {
        var got = (resp && resp.digits) || [], k = 0;
        trial.answer.forEach(function (d, j) { if (String(got[j]) === d) k++; });
        T.record(trial.level, k === 3);
        run.log.push([trial.i, trial.level, k, 3, voices.indexOf(trial.meta.voices[0])]);
        run.i++;
        return { score: k === 3 ? 1 : 0, k: k };
      };
      run.progress = function () { return { i: run.i, n: def.n }; };
      run.finish = function () {
        var e = T.estimate();
        return { est: { m: K.r2(e.m), s: K.r2(e.s) }, n: run.i, trials: run.log, edge: e.atEdge,
          extra: { fit: K.r2(e.fit), slope: K.r2(e.slope), levels: T.levels.slice() } };
      };
      return run;
    }
  };

  // ---- Two voices (mid): natural sentences of a held-out talker against two other talkers, adaptive TMR
  PROBES.twovoices = {
    id: 'twovoices', name: 'Two voices', distance: 'mid', minutes: 2.5, core: true, proc: 'twovoices-1', n: 24,
    unit: 'dB', better: -1, sigmaW: 1.8, sigmaX: 0.8, practice: { c0: 0.8, sd: 0.8, q: 0.35 }, ref: { m: -2, s: 3 },
    short: 'One real voice to follow while two others talk over it.',
    measures: 'How much louder the two other voices can be while you still follow yours. Lower is better.',
    answerHow: 'Meet the voice first. Then, after each mix, tap what that voice said. Guess when unsure.',
    grid: { lo: -25, hi: 20, step: 0.25, mu: 0, sd: 8, slopes: [0.03, 0.05, 0.08, 0.12], slopeW: [1, 2, 2, 1],
      lapses: [0.02, 0.06, 0.12], lapseW: [0.6, 0.3, 0.1] },
    available: function () {
      var tv = M.idx().twovoices;
      if (tv.items.length < 4) return { ok: false, why: 'The recorded sentences for this check-in arrive in a later build.' };
      return tv.voices.length >= 3 ? { ok: true } : { ok: false, why: 'The recorded talkers for this check-in arrive in a later build.' };
    },
    make: function (form, rng, opts) {
      var def = this, X = M.idx(), tv = X.twovoices, run = base(def, form, rng, def.n);
      var order = K.shuffle(rng.fork('target'), tv.voices), target = order[0];
      var sex = (M.voice(target) || {}).sex === 'm' ? 'm' : 'f';
      var same = tv.bySex[sex].filter(function (v) { return v !== target; }), others = tv.voices.filter(function (v) { return v !== target; });
      var maskPool = same.length >= 2 ? same : others;
      var items = tv.items, keyOf = {}, textOf = {};
      items.forEach(function (it) { keyOf[it.id] = it.key; textOf[it.id] = it.text; });
      var options = items.map(function (it) { return it.key; });
      var grid = Object.assign({}, def.grid, { guess: 1 / options.length });
      var T = PR.bayes({ grid: grid, n: def.n, start: 8, temper: 1, round: 1, min: -24, max: 18, targets: [0.75, 0.5], comfortBelow: 0.5 });
      var mine = tv.has[target], prevA = null;
      var pv = mine[Math.floor(rng.fork('preview').next() * mine.length)];
      run.preview = { text: 'This is the voice to follow.', said: textOf[pv],
        audio: { out: OUT, spatial: 'mono', parts: [{ clip: M.clip(target, 'sentence', textOf[pv]), at: 0.2, db: 0, role: 'target' }], beds: [], room: null } };
      run.next = function () {
        if (T.done()) return null;
        var i = run.i, r = rng.fork(K.tag(run, 't')), tmr = T.next();
        var a; do { a = K.pick(r, mine); } while (a === prevA && mine.length > 1);
        prevA = a;
        var ms = K.shuffle(r, maskPool).slice(0, 2), used = [a], parts = [], end = 0;
        parts.push({ clip: M.clip(target, 'sentence', textOf[a]), at: 0.5, db: 0, role: 'target' });
        ms.forEach(function (mv) {
          var cand = K.shuffle(r, tv.has[mv]).filter(function (id) { return used.indexOf(id) < 0; });
          var b = cand[0] || tv.has[mv][0];
          used.push(b);
          parts.push({ clip: M.clip(mv, 'sentence', textOf[b]), at: K.r2(0.35 + r.next() * 0.3), db: K.r2(-tmr), role: 'masker' });
        });
        parts.forEach(function (p) { end = Math.max(end, p.at + M.dur(p.clip, 2)); });
        return { id: 'twovoices-' + form + '-' + i, probe: 'twovoices', i: i, seed: rng.seed + ':' + i, level: tmr,
          audio: { out: OUT, spatial: 'mono', dur: K.r2(end + 0.3), parts: parts, beds: [], room: null },
          ui: { kind: 'choice', options: options, prompt: 'What did your voice say?' }, answer: keyOf[a],
          meta: { probe: true, items: used.map(function (id) { return keyOf[id]; }), voices: [target].concat(ms), form: form } };
      };
      run.record = function (trial, resp) {
        var pick = resp && resp.pick != null ? String(resp.pick) : null, ok = pick === trial.answer ? 1 : 0;
        var intr = !ok && pick !== null && trial.meta.items.slice(1).indexOf(pick) >= 0 ? 1 : 0;
        T.record(trial.level, ok, 1);
        run.log.push([trial.i, trial.level, ok, 1, intr]);
        run.i++;
        return { score: ok, intrusion: intr };
      };
      run.progress = function () { return { i: run.i, n: def.n }; };
      run.finish = function () {
        var e = T.estimate(), wrong = run.log.filter(function (x) { return !x[2]; }).length;
        return { est: { m: K.r2(e.m), s: K.r2(e.s) }, n: run.i, trials: run.log, edge: K.edge(e),
          extra: { slope: K.r2(e.slope), target: target, intrusions: run.log.filter(function (x) { return x[4]; }).length, wrong: wrong } };
      };
      return run;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
