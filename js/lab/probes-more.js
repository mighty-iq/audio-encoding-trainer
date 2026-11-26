/* ES.lab.probes (part 2) — Rooms, New voice, Story, Diary (PLAN §8). Shapes as in probes.js.
   - Rooms: matrix sentences from a talker in a held-out simulated hall (seed ≥ 10000, never trained), room noise
     at a fixed level re the talker at 1 m; distance adapts on a log scale (each doubling costs 6 dB of direct
     sound), so the estimate is the distance at which half the words get through, kept for statistics as
     6.02 dB per doubling (the "dB*" unit) and shown in metres.
   - New voice: tone-vocoded matrix sentences (a degradation family never trained; the engine trains noise
     carriers) from held-out voices; accuracy over 16 sentences and its slope across them (adaptation).
   - Story: one passage in café noise at a fixed SNR, then 5 questions and an effort rating.
   - Diary: five original weekly items on everyday listening (1 very hard … 5 very easy, or "did not happen").
   MIT licence. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var L = ES.lab = ES.lab || {};
  var M = L.materials, PR = L.procedures, S = L.stats, K = L.probeKit;
  var PROBES = L.probes = L.probes || {};
  var OUT = { db: -20 }, DB_PER_DOUBLING = 6.02;

  function base(def, form, rng, n) { return K.base(def, form, rng, n); }

  // ---- Rooms (mid): distance ladder in a held-out hall
  PROBES.rooms = {
    id: 'rooms', name: 'Rooms', distance: 'mid', minutes: 2, core: false, proc: 'rooms-1', n: 12,
    unit: 'dB*', show: 'm', better: 1, sigmaW: 2.5, sigmaSource: 'working', sigmaX: 1.0, practice: { c0: 1.5, sd: 1.5, q: 0.35 }, ref: { m: 14, s: 5 },
    room: { rt60: 1.4, size: 'large', seed: 10007 }, noiseDb: -12,
    short: 'Sentences from further and further away in a hall you never train in.',
    measures: 'The distance at which you still catch half the words. Further is better.',
    answerHow: 'Tap one word in each column, as in the Matrix check-in. The talker moves; guess when unsure.',
    grid: { lo: -1, hi: 4.1, step: 0.05, mu: 2.3, sd: 1.5, slopes: [0.25, 0.4, 0.6, 0.9], slopeW: [1, 2, 2, 1],
      lapses: [0.01, 0.04, 0.1], lapseW: [0.6, 0.3, 0.1], guess: 0.1, dir: -1 },
    metres: function (m) { return Math.pow(2, m / DB_PER_DOUBLING); },
    available: function () { return PROBES.matrix.available(); },
    make: function (form, rng, opts) {
      var def = this, voices = K.voicesFor('rooms'), run = base(def, form, rng, def.n);
      var T = PR.bayes({ grid: def.grid, n: def.n, start: 0, temper: 0.7, round: 0.25, min: -1, max: 4.1, maxStep: 1.5 });
      var prev = null, vOrder = K.shuffle(rng.fork('voices'), voices);
      run.next = function () {
        if (T.done()) return null;
        var i = run.i, r = rng.fork(K.tag(run, 's')), v = vOrder[i % vOrder.length], u = T.next(), d = K.r2(Math.pow(2, u));
        var s = K.matrixSentence(r, v, prev, { room: true });
        prev = s.words;
        var room = { rt60: def.room.rt60, size: def.room.size, seed: def.room.seed, dist: d, levels: 'source' };
        return { id: 'rooms-' + form + '-' + i, probe: 'rooms', i: i, seed: rng.seed + ':' + i, level: u, dist: d,
          audio: { out: OUT, spatial: 'mono', dur: K.r2(s.dur + 0.9), parts: s.parts, beds: [{ kind: 'ssn', from: 'target', db: def.noiseDb, room: true }], room: room },
          ui: { kind: 'matrix', columns: K.matrixColumns(), prompt: 'Which words did you hear?' },
          answer: s.words, meta: { probe: true, items: s.words, voices: [v], form: form, synthetic: M.synthetic(v), room: room } };
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
        return { est: { m: K.r2(DB_PER_DOUBLING * e.m), s: K.r2(DB_PER_DOUBLING * e.s) }, n: run.i, trials: run.log, edge: K.edge(e),
          extra: { metres: K.r2(Math.pow(2, e.m)), lo90: K.r2(Math.pow(2, e.lo90)), hi90: K.r2(Math.pow(2, e.hi90)), slope: K.r2(e.slope) } };
      };
      return run;
    }
  };

  // ---- New voice (mid–far): a never-trained degradation family, accuracy and adaptation over 16 sentences
  PROBES.newvoice = {
    id: 'newvoice', name: 'New voice', distance: 'mid', minutes: 2.5, core: false, proc: 'newvoice-1', n: 16,
    unit: '%', better: 1, sigmaW: 7, sigmaSource: 'working', sigmaX: 3, practice: { c0: 8, sd: 6, q: 0.35 }, ref: { m: 60, s: 15 },
    fx: { type: 'vocode', bands: 6, carrier: 'tone' },
    short: 'A kind of voice you have never trained with: speech rebuilt from a few tones.',
    measures: 'How many words you catch, and how fast that rises as the voice grows familiar. Higher is better.',
    answerHow: 'Tap one word in each column. It sounds very strange at first and clears over the 16 sentences; how fast it clears is part of what this check measures.',
    available: function () {
      var a = PROBES.matrix.available();
      return a.ok && K.voicesFor('newvoice').length ? { ok: true } : { ok: false, why: a.why || 'The new-voice talkers arrive in a later build.' };
    },
    make: function (form, rng, opts) {
      var def = this, voices = K.voicesFor('newvoice'), run = base(def, form, rng, def.n), prev = null;
      var vOrder = K.shuffle(rng.fork('voices'), voices);
      run.next = function () {
        if (run.i >= def.n) return null;
        var i = run.i, r = rng.fork(K.tag(run, 's')), v = vOrder[i % vOrder.length];
        var s = K.matrixSentence(r, v, prev, { fx: [def.fx], lead: 0.3 });
        prev = s.words;
        return { id: 'newvoice-' + form + '-' + i, probe: 'newvoice', i: i, seed: rng.seed + ':' + i, level: def.fx.bands,
          audio: { out: OUT, spatial: 'mono', dur: K.r2(s.dur + 0.3), parts: s.parts, beds: [], room: null },
          ui: { kind: 'matrix', columns: K.matrixColumns(), prompt: 'Which words did you hear?' },
          answer: s.words, meta: { probe: true, items: s.words, voices: [v], form: form, family: 'tone-vocoded', synthetic: M.synthetic(v) } };
      };
      run.record = function (trial, resp) {
        var k = K.countWords(trial.answer, resp && resp.picks);
        run.log.push([trial.i, trial.level, k, trial.answer.length, voices.indexOf(trial.meta.voices[0])]);
        run.i++;
        return { score: k / trial.answer.length, k: k };
      };
      run.progress = function () { return { i: run.i, n: def.n }; };
      run.finish = function () {
        var props = run.log.map(function (x) { return x[2] / x[3]; }), a = PR.adaptation(props, 5, 0.7);
        return { est: { m: K.r2(100 * a.acc), s: K.r2(100 * a.s) }, n: run.i, trials: run.log, edge: a.acc > 0.97 ? 'hi' : a.acc < 0.15 ? 'lo' : null,
          extra: { slope10: K.r2(100 * a.slope10), first: K.r2(100 * a.first), last: K.r2(100 * a.last), bands: def.fx.bands } };
      };
      return run;
    }
  };

  // ---- Story (far): a passage in café noise at a fixed SNR, then 5 questions and an effort rating
  PROBES.story = {
    id: 'story', name: 'Story', distance: 'far', minutes: 2, core: false, proc: 'story-1', n: 1, snr: 3,
    unit: '%', better: 1, sigmaW: 15, sigmaSource: 'working', sigmaX: 6, practice: { c0: 5, sd: 8, q: 0.35 }, ref: { m: 70, s: 15 },
    short: 'A one-minute story in a busy café, then five questions about it.',
    measures: 'How much of a real passage you take in and keep, in café noise. Higher is better.',
    answerHow: 'Listen to the whole story once. Then answer five questions about it and say how much effort it took.',
    available: function () {
      var X = M.idx();
      return X.stories.length ? { ok: true } : { ok: false, why: 'The recorded stories arrive in a later build.' };
    },
    make: function (form, rng, opts) {
      var def = this, X = M.idx(), run = base(def, form, rng, 1), trial = null, st = null;
      var order = ES.core && ES.core.rng ? ES.core.rng('story-order:' + ((opts && opts.playerSeed) || 'p')).shuffle(X.stories) : X.stories.slice();
      function build() {
        var k = (+form || 0) + run.redraws;
        st = order[k % order.length];
        var v = st.voices[k % st.voices.length], id = M.storyClip(v, st), dur = M.dur(id, 50), beds = [];
        if (X.cafe) beds.push({ kind: 'ambience', bed: X.cafe, db: -def.snr });
        else beds.push({ kind: 'ssn', from: 'target', db: -def.snr });
        var qs = st.questions.slice(0, 5).map(function (q, j) {
          var opts2 = K.shuffle(rng.fork('q' + j + (run.redraws ? 'r' + run.redraws : '')), q.options.map(String));
          // the answer is either the option's text or its index in options (stimuli's vocab.stories use the index)
          var ans = typeof q.answer === 'number' || (/^\d+$/.test(String(q.answer)) && q.options.map(String).indexOf(String(q.answer)) < 0) ? q.options[+q.answer] : q.answer;
          return { q: q.q, options: opts2, answer: String(ans) };
        });
        trial = { id: 'story-' + form + (run.redraws ? 'r' + run.redraws : ''), probe: 'story', i: 0, seed: rng.seed + ':0' + (run.redraws ? 'r' + run.redraws : ''), level: def.snr,
          audio: { out: OUT, spatial: 'mono', dur: K.r2(dur + 2), parts: [{ clip: id, at: 1, db: 0, role: 'target' }], beds: beds, room: null },
          ui: { kind: 'story', questions: qs, effort: true, prompt: 'Listen to the whole story.' },
          answer: qs.map(function (q) { return q.answer; }), meta: { probe: true, items: [st.id], voices: [v], form: form, title: st.title, synthetic: M.synthetic(v) } };
        trial.redraws = run.redraws;
      }
      run.next = function () { if (run.i) return null; if (!trial || trial.redraws !== run.redraws) build(); return trial; };
      run.record = function (t, resp) {
        var got = (resp && resp.answers) || [], k = 0;
        t.answer.forEach(function (a, j) { if (got[j] != null && String(got[j]) === a) k++; });
        run.log.push([0, t.level, k, t.answer.length, resp && isFinite(resp.effort) ? +resp.effort : null]);
        run.i++;
        return { score: k / t.answer.length, k: k };
      };
      run.progress = function () { return { i: run.i, n: 1 }; };
      run.finish = function () {
        var x = run.log[0] || [0, def.snr, 0, 5, null], pr = PR.proportion(x[2], x[3]);
        return { est: { m: K.r2(100 * pr.p), s: K.r2(100 * pr.s) }, n: run.i, trials: run.log, edge: null,
          extra: { story: st ? st.id : null, effort: x[4], snr: def.snr } };
      };
      return run;
    }
  };

  // ---- Diary (far, real life): five original items each week
  var DIARY_ITEMS = [
    { id: 'loud', text: 'Following one person in a loud place: a party, a bar, a busy restaurant.' },
    { id: 'far', text: 'Understanding someone across a room, in a large hall, or at a distance outdoors.' },
    { id: 'unusual', text: 'Understanding an unfamiliar accent, a fast talker, or someone who mumbles.' },
    { id: 'memory', text: 'Remembering names, numbers or plans you heard somewhere noisy.' },
    { id: 'effort', text: 'Listening on a busy day, all things considered: how easy did it feel?' }
  ];
  var SCALE = ['very hard', 'hard', 'mixed', 'easy', 'very easy'];
  PROBES.diary = {
    id: 'diary', name: 'Diary', distance: 'far', minutes: 1, core: false, proc: 'diary-1', n: 1,
    unit: 'pts', better: 1, sigmaW: 0.5, sigmaSource: 'working', sigmaX: 0.3, practice: { c0: 0, sd: 0.2, q: 0.35 }, ref: { m: 3, s: 1 },
    items: DIARY_ITEMS, scale: SCALE,
    short: 'Five quick questions about listening in your week.',
    measures: 'How everyday listening went, from 1 (very hard) to 5 (very easy). Higher is better.',
    answerHow: 'Think of this past week. Tap how each situation went, or "did not happen".',
    available: function () { return { ok: true }; },
    make: function (form, rng, opts) {
      var def = this, run = base(def, form, rng, 1), out = null;
      var trial = { id: 'diary-' + form, probe: 'diary', i: 0, seed: rng.seed, level: null, audio: null,
        ui: { kind: 'diary', items: DIARY_ITEMS, scale: SCALE, prompt: 'This past week, how did these go?' }, answer: null, meta: { probe: true, form: form } };
      run.next = function () { return run.i ? null : trial; };
      run.record = function (t, resp) {
        var r = (resp && resp.ratings) || {}, vals = [];
        DIARY_ITEMS.forEach(function (it) { var v = r[it.id]; if (v != null && v >= 1 && v <= 5) vals.push(+v); });
        out = { ratings: r, vals: vals };
        run.log.push(DIARY_ITEMS.map(function (it) { var v = r[it.id]; return v >= 1 && v <= 5 ? +v : null; }));
        run.i++;
        return { score: vals.length ? S.mean(vals) : null };
      };
      run.progress = function () { return { i: run.i, n: 1 }; };
      run.finish = function () {
        var vals = out ? out.vals : [], m = vals.length ? S.mean(vals) : null;
        return { est: { m: m === null ? null : K.r2(m), s: vals.length > 1 ? K.r2(Math.max(0.3, S.sd(vals) / Math.sqrt(vals.length))) : 0.6 },
          n: run.i, trials: run.log, edge: null, extra: { answered: vals.length, ratings: out ? out.ratings : {} } };
      };
      return run;
    }
  };

  L.probeOrder = ['matrix', 'digits', 'twovoices', 'rooms', 'newvoice', 'story', 'diary'];
  L.DB_PER_DOUBLING = DB_PER_DOUBLING;
})(typeof window !== 'undefined' ? window : globalThis);
