/* Earshot engine — Echo: a message heard once in café or party noise (names, places, times, days, numbers,
   things to bring), a pause, then 2–3 questions. Dials: snr, details per message, rate (WSOLA speed-up), delay
   before the questions. Foils that occur elsewhere in the message are labelled 'context' (a binding error: right
   word, wrong question). Bet: listening under memory load on real-life content (bridging).
   Lab matrix words (the probe vocabulary: "eleven", "thirty", "warm" …) may occur inside a message, but Echo never
   asks for a detail that contains one and never offers one (token match: "eleven thirty", "twenty-four"); a message
   with no other askable detail is skipped (lead's decision, 2026-11-26).
   Shortcut-proof questions (lead's decisions, 2026-11-26/27; review ST-03): the messages in play are those with the
   asked number of details, from every voice (one voice per message: a narrow voice pool would replay a handful of
   messages until known by heart). A question is asked only when it has ≥ 3 different answers among them, and its
   foils are those answers ("Where is the train going?" → the other destinations), drawn uniformly. The trial is
   drawn through a lead detail: a question, one of its answers uniformly, then a message with that answer; the
   other asked details favour rare answers (weight 1 / messages sharing it). One detail fewer than the message
   holds is asked (at most 3), so the player keeps them all in mind. Each answer then comes up about as often as
   any option, and remembering past answers does not help. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var E = ES.engine, I = E.items, C = I.common, X = I.data;

  function val(id, i) { var d = E.dialDef('echo', id); return d.values[Math.max(d.min, Math.min(d.max, Math.round(i)))]; }
  // a value with any probe (matrix) word among its tokens
  function hasProbe(v) { var P = X.idx().probeWords; return C.norm(v).split(' ').some(function (t) { return !!P[t]; }); }
  // the details of a message that can be asked: a category with ≥ 4 values to choose foils from, no probe word
  function askable(it, cats) { return (it.facts || []).filter(function (f) { return cats[f.cat] && cats[f.cat].length >= 4 && !hasProbe(f.value); }); }
  function catPools(V) {
    var idx = X.idx(); idx.poolCache = idx.poolCache || {};
    if (idx.poolCache['echo:cats']) return idx.poolCache['echo:cats'];
    var out = {}, seen = {};
    I.adapt.echoItems().forEach(function (it) {
      (it.facts || []).forEach(function (f) {
        var k = f.cat + '|' + C.norm(f.value);
        if (seen[k] || hasProbe(f.value)) return;
        seen[k] = 1; (out[f.cat] = out[f.cat] || []).push(f.value);
      });
    });
    var extra = V.echoValues || {};
    Object.keys(extra).forEach(function (cat) {
      (extra[cat] || []).forEach(function (v) { var k = cat + '|' + C.norm(v); if (!seen[k] && !hasProbe(v)) { seen[k] = 1; (out[cat] = out[cat] || []).push(v); } });
    });
    idx.poolCache['echo:cats'] = out;
    return out;
  }
  function cap(w) { w = String(w || ''); return w.charAt(0).toUpperCase() + w.slice(1); }
  function fallbackMessages() {
    var idx = X.idx(); idx.poolCache = idx.poolCache || {};
    if (idx.poolCache['echo:fb']) return idx.poolCache['echo:fb'];
    var nums = {}; I.adapt.callsign().forEach(function (p) { nums[p.number] = 1; });
    var withNum = Object.keys(nums).length >= 3;
    var out = I.adapt.fallbackItems().map(function (it) {
      var f = [{ cat: 'caller', value: cap(it.words[0]), q: 'Who was calling?' }, { cat: 'word', value: it.words[1], q: 'Which word did they say?' }];
      if (withNum) f.push({ cat: 'number', value: it.words[2], q: 'Which number?' });
      return { id: it.id, text: it.text, words: it.words, facts: f, kind: it.kind };
    });
    idx.poolCache['echo:fb'] = out;
    return out;
  }
  function catPoolsOf(items) {
    var out = {}, seen = {};
    items.forEach(function (it) { it.facts.forEach(function (f) { var k = f.cat + '|' + C.norm(f.value); if (!seen[k] && !hasProbe(f.value)) { seen[k] = 1; (out[f.cat] = out[f.cat] || []).push(f.value); } }); });
    return out;
  }
  function contains(text, phrase) { return (' ' + C.norm(text) + ' ').indexOf(' ' + C.norm(phrase) + ' ') >= 0; }
  function uniqNorm(a) { var s = {}, o = []; a.forEach(function (v) { var k = C.norm(v); if (k && !s[k]) { s[k] = 1; o.push(v); } }); return o; }
  // The questions that can be asked among the messages in play: those with ≥ 3 different answers there. Their
  // answers there are the options (all of them when there are 3), so the answer is a uniform pick among values that
  // are answers just as often (review ST-03 and the lead's frequency decision). Cached per message set.
  function inPlay(list, cats) {
    var cache = X.idx().poolCache = X.idx().poolCache || {}, key = 'echo:play:' + list.map(function (m) { return m.id; }).join('|');
    if (cache[key]) return cache[key];
    var F = list.map(function (m) { return askable(m, cats); }), vals = {}, c = {};
    F.forEach(function (A) { A.forEach(function (f) { var k = C.norm(f.value); (vals[f.q] = vals[f.q] || {})[k] = f.value; (c[f.q] = c[f.q] || {})[k] = (c[f.q][k] || 0) + 1; }); });
    var sets = {}; Object.keys(vals).forEach(function (q) { var vs = Object.keys(vals[q]).map(function (k) { return vals[q][k]; }); if (vs.length >= 3) sets[q] = vs; });
    cache[key] = { F: F.map(function (A) { return A.filter(function (f) { return sets[f.q]; }); }), sets: sets, c: c };
    return cache[key];
  }
  // messages of the last tutorial trials: the next real trials use others (FRESH-A #3; in memory for the visit)
  var TUTORED = [];
  function valueAt(cn, i, q) { var f = cn.F[i].filter(function (x) { return x.q === q; })[0]; return f ? C.norm(f.value) : null; }
  // One trial's details: a lead detail (a question as common as it is in play, one of its answers uniformly, then a
  // message with that answer) and up to two more from that message, one fewer than it holds, weighted by u[q][answer].
  function drawDetails(rng, msgs, cn, ids, u) {
    var inst = []; ids.forEach(function (i) { cn.F[i].forEach(function (f) { inst.push(f.q); }); });
    var q = inst[C.ri(rng, inst.length)], sameQ = ids.filter(function (i) { return valueAt(cn, i, q) !== null; });
    var vals = C.uniq(sameQ.map(function (i) { return valueAt(cn, i, q); })), v = vals[C.ri(rng, vals.length)];
    var mi = C.pick(rng, sameQ.filter(function (i) { return valueAt(cn, i, q) === v; }));
    var leadF = cn.F[mi].filter(function (f) { return f.q === q; })[0], facts = [leadF];
    var nQ = Math.min(3, msgs[mi].facts.length - 1, cn.F[mi].length), rest = cn.F[mi].filter(function (f) { return f !== leadF; });
    while (facts.length < nQ && rest.length) {
      var pk = C.weighted(rng, rest, rest.map(function (f) { return (u[f.q] && u[f.q][C.norm(f.value)]) || 1; }));
      facts.push(pk); rest = rest.filter(function (f) { return f !== pk; });
    }
    return { mi: mi, facts: facts };
  }
  // Weights for the extra details of a message set: start at 1 / messages sharing the answer, then four rounds of
  // simulated draws (2,000 each, a fixed seed) in which each answer's weight is divided by how often it came up
  // against its question's mean, so the answers of every question are asked about equally often. Cached.
  function extraWeights(msgs, cn) {
    var cache = X.idx().poolCache, key = 'echo:u:' + msgs.map(function (m) { return m.id; }).join('|');
    if (cache[key]) return cache[key];
    var u = {}, ids = msgs.map(function (m, i) { return i; }).filter(function (i) { return cn.F[i].length > 0; }), rng = ES.core.rng('echo:weights');
    Object.keys(cn.sets).forEach(function (q) { u[q] = {}; cn.sets[q].forEach(function (v) { var k = C.norm(v); u[q][k] = 1 / ((cn.c[q] && cn.c[q][k]) || 1); }); });
    for (var round = 0; round < 4 && ids.length; round++) {
      var cnt = {};
      for (var t = 0; t < 2000; t++) drawDetails(rng, msgs, cn, ids, u).facts.forEach(function (f) { var q = cnt[f.q] = cnt[f.q] || {}, k = C.norm(f.value); q[k] = (q[k] || 0) + 1; });
      Object.keys(u).forEach(function (q) {
        var ks = Object.keys(u[q]), mean = ks.reduce(function (a, k) { return a + ((cnt[q] && cnt[q][k]) || 0); }, 0) / ks.length;
        ks.forEach(function (k) { var n = (cnt[q] && cnt[q][k]) || 0.5; u[q][k] *= Math.max(0.25, Math.min(4, Math.pow(mean / n, 0.8))); });
      });
    }
    cache[key] = u;
    return u;
  }
  function make(rng, setting, ctx) {
    ctx = ctx || {};
    var V = (ES.data && ES.data.vocab) || {}, breadth = C.breadthOf(setting, ctx);
    var dials = JSON.parse(JSON.stringify(setting.dials || {}));
    var snr = dials.snr !== undefined ? dials.snr : 10, nDet = val('details', dials.details || 0), rate = val('rate', dials.rate || 0), delay = val('delay', dials.delay || 0);
    var cats = catPools(V);
    // Relaxation (meta.relaxed): (1) all voices with material; (2) the build's call-sign phrases as two- or
    // three-detail messages (who called, which word, which number when the build has ≥ 3 numbers).
    var A = I.adapt, all = A.echoItems().filter(function (it) { return askable(it, cats).length > 0; }), withMat = {}, relaxed = [];
    if (!A.voicesWith(all).length) {
      all = fallbackMessages(); relaxed.push('call-sign phrases'); cats = catPoolsOf(all);
      all = all.filter(function (it) { return askable(it, cats).length > 0; });
    }
    A.voicesWith(all).forEach(function (v) { withMat[v] = 1; });
    // the messages in play: the asked number of details (nearest available), every voice; a message already heard
    // in this set or in the tutorial is left out (FRESH-A #3); widened to neighbouring counts while none is left
    // or no question has three different answers there
    var memo = C.memo(ctx), seenSet = memo.echoSeen = memo.echoSeen || [], skipM = {};
    seenSet.concat(ctx.tutorial ? [] : TUTORED).forEach(function (id) { skipM[id] = 1; });
    var skipV = {}; (C.recentOf(ctx) || []).concat(ctx.avoidVoices || []).forEach(function (v) { skipV[v] = 1; });
    var msgs = [], cn = null, ids = [], off;
    for (var pass = 0; pass < 2 && !ids.length; pass++) {
      for (off = 0; off < 4; off++) {
        msgs = all.filter(function (it) { return Math.abs(it.facts.length - nDet) <= off && A.clipsOf(it).length > 0; });
        if (!msgs.length || (off === 0 && !msgs.some(function (m) { return m.facts.length === nDet; }))) continue;
        cn = inPlay(msgs, cats);
        var usable = msgs.map(function (m, i) { return i; }).filter(function (i) { return cn.F[i].length > 0 && (pass > 0 || !skipM[msgs[i].id]); });
        var fresh = usable.filter(function (i) { return A.clipsOf(msgs[i]).some(function (id) { return !skipV[X.clip(id).voice]; }); });
        ids = fresh.length ? fresh : usable;
        if (ids.length) break;
      }
    }
    if (!ids.length) throw new Error('echo: no speech material in this build');
    if (off > 0) relaxed.push('details widened');
    // balanced draw (lead's decision): a lead question (as common as it is among the messages in play), one of its
    // answers uniformly, then a message with that answer; so each answer of the lead question comes up equally
    // often, and messages with rare answers are drawn more often for the other questions too
    var drawn = drawDetails(rng, msgs, cn, ids, extraWeights(msgs, cn)), mi = drawn.mi, it = msgs[mi];
    seenSet.push(it.id); if (seenSet.length > 40) seenSet.shift();
    if (ctx.tutorial) { TUTORED.push(it.id); if (TUTORED.length > 8) TUTORED.shift(); }
    var clipIds = A.clipsOf(it), freshClips = clipIds.filter(function (id) { return !skipV[X.clip(id).voice]; });
    var hitClip = C.pick(rng, freshClips.length ? freshClips : clipIds), hit = { item: it, clip: hitClip, voice: X.clip(hitClip).voice };
    var actual = it.facts.length;
    dials.details = Math.max(0, Math.min(3, actual - 2));
    var fx = rate > 1.001 ? [{ type: 'wsola', rate: rate }] : null;
    var c = X.clip(hit.clip), dur = (c.dur || 3) / (rate || 1);
    var part = { clip: hit.clip, at: 0.6, db: 0, role: 'target' };
    if (fx) part.fx = fx;
    var bo = { avoid: [hit.voice], talkers: X.bedTalkers(rng, breadth), db: -snr };
    var beds = [X.bedSpec(rng, breadth < 0.4 ? ['cafe'] : ['cafe', 'party', 'babble'], bo) || X.bedSpec(rng, ['babble'], bo) || { kind: 'ssn', db: -snr }];
    var audio = { out: { db: -20 }, dur: Math.round((0.6 + dur + 0.8) * 100) / 100, spatial: 'mono', parts: [part], beds: beds, room: null };
    C.remember(ctx, hit.voice, null);
    var facts = C.shuffle(rng, drawn.facts);
    var slots = facts.map(function (f) {
      var others = it.facts.filter(function (g) { return g !== f && g.cat === f.cat; }).map(function (g) { return g.value; });
      // foils: the question's other answers among the messages in play ("Where is the train going?" → the other
      // destinations), drawn uniformly; a question with three answers there shows all three
      var S = cn.sets[f.q], draw = function (r) { return S[C.ri(r, S.length)]; };
      // uniform foils from S (no sound-alike pairing here: the option set stays a uniform draw, so neither how
      // familiar an option is nor how it pairs with another says which one is the answer)
      var sl = C.slot(rng, { label: f.q, answer: f.value, pool: S, draw: draw, neighbours: function () { return []; }, avoid: others, type: f.cat === 'number' ? 'number' : undefined });

      Object.keys(sl.foils).forEach(function (o) { if (contains(it.text, o)) sl.foils[o] = 'context'; });
      sl.cat = f.cat;
      return sl;
    });
    return {
      id: 'echo-' + C.seedOf(rng).toString(36), ex: 'echo', seed: setting.seed || null,
      setting: { dials: dials, focus: setting.focus, anchor: !!setting.anchor, warmup: !!setting.warmup },
      audio: audio,
      question: { prompt: 'Questions about the message', delayMs: Math.round(delay * 1000), slots: slots },
      feedback: { text: '“' + it.text + '”', replays: [{ label: 'Hear it again', audio: audio, showText: true }] },
      picture: { voices: [{ id: 'v0', role: 'target', az: 0, dist: 1, label: '' }] },
      meta: { items: facts.map(function (f) { return f.value; }), voices: [hit.voice], family: null, probe: false, ctxKey: 'echo', cond: 'base', relaxed: relaxed,
        offsetDb: c.diff || 0, text: it.text, facts: it.facts }
    };
  }
  I.echo = { make: make, ready: function () { return I.adapt.ready('echo'); },
    askable: function (it) { return askable(it, catPools((ES.data && ES.data.vocab) || {})); }, hasProbe: hasProbe };
})(typeof window !== 'undefined' ? window : globalThis);
