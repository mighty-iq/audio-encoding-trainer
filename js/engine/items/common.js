/* Earshot engine — shared helpers for the item generators: seeded choice (only rng.next() is used), text
   normalisation, homophones, and the option builder.
   Option design (so that responders who use only the option list stay at chance):
   - every option comes from the pool of possible answers (a foil is never a word that cannot be an answer);
   - similarity structure is symmetric: with no masker words the options are two neighbour pairs (T, nT) and
     (R, nR); with one masker (T, nT) and (M, nM); with two maskers T, M1, M2 and one random R; with three, all
     spoken words. So "pick the most typical / most different option" has no edge;
   - positions are shuffled; homophones of the answer are never options.
   Foil labels are relative to the answer: 'masker' (spoken by another voice in this trial), 'neighbour'
   (phonetic neighbour of the answer), 'context' (fits the sentence's meaning, or said in the message for another
   question), 'number' (another number of the closed set: numbers are not sound-alikes, so a number foil is never
   'neighbour'), 'random' (none of these). Voices uses 'similar' for a voice close in pitch (items/voices.js). */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  ES.engine = ES.engine || {};
  ES.engine.items = ES.engine.items || {};

  function ri(rng, n) { return Math.floor(rng.next() * n); }
  function pick(rng, a) { return a.length ? a[ri(rng, a.length)] : undefined; }
  function shuffle(rng, a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = ri(rng, i + 1), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function sample(rng, a, k) { return shuffle(rng, a).slice(0, Math.max(0, k)); }
  function chance(rng, p) { return rng.next() < p; }
  function weighted(rng, items, w) {
    var t = 0, i; for (i = 0; i < w.length; i++) t += Math.max(0, w[i]);
    if (t <= 0) return pick(rng, items);
    var r = rng.next() * t;
    for (i = 0; i < items.length; i++) { r -= Math.max(0, w[i]); if (r < 0) return items[i]; }
    return items[items.length - 1];
  }
  function norm(t) { return String(t === undefined || t === null ? '' : t).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function slug(t) { return norm(t).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function uniq(a) { var s = {}, o = []; a.forEach(function (x) { var k = norm(x); if (!s[k]) { s[k] = 1; o.push(x); } }); return o; }

  var HOMO = [['two', 'to', 'too'], ['four', 'for', 'fore'], ['eight', 'ate'], ['one', 'won'], ['night', 'knight'],
    ['sail', 'sale'], ['tail', 'tale'], ['mail', 'male'], ['pear', 'pair', 'pare'], ['bear', 'bare'], ['sea', 'see'],
    ['tea', 'tee'], ['knows', 'nose'], ['flour', 'flower'], ['hole', 'whole'], ['road', 'rode'], ['week', 'weak'],
    ['right', 'write'], ['son', 'sun'], ['steel', 'steal'], ['peace', 'piece'], ['plain', 'plane'], ['so', 'sew'],
    ['new', 'knew'], ['red', 'read'], ['hear', 'here'], ['meet', 'meat'], ['cent', 'scent', 'sent'], ['bee', 'be'],
    ['seen', 'scene'], ['berry', 'bury'], ['rain', 'reign'], ['sight', 'site', 'cite'], ['whine', 'wine'], ['hair', 'hare']];
  var homoIndex = {};
  HOMO.forEach(function (g) { g.forEach(function (w) { homoIndex[w] = g; }); });
  var NUMW = {};
  ('zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen ' +
    'eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety hundred').split(' ').forEach(function (w) { NUMW[w] = 1; });
  // a number word or numeral, also several ("twenty-four", "twenty one")
  function isNum(w) { var t = norm(w).split(' ').filter(Boolean); return t.length > 0 && t.every(function (k) { return !!NUMW[k] || /^[0-9]+$/.test(k); }); }
  function homophones(a, b) {
    a = norm(a); b = norm(b);
    if (a === b) return true;
    var g = homoIndex[a];
    return !!(g && g.indexOf(b) >= 0);
  }

  /* Build one answer slot.
     o = { answer, spoken:[masker words], pool:[possible answers], draw:fn(rng)→word from this slot's answer
           distribution, neighbours:fn(w)→[w], context:[words fitting the sentence], avoid:[words never to show], n:4, label,
           type:'number' (a number slot; also inferred when the answer and every foil are numbers) }
     Returns { label, options, answer, foils:{option:type} }. */
  function slot(rng, o) {
    var n = o.n || 4, T = o.answer, used = {}, out = [T];
    var inPool = o.pool ? normSet(o.pool) : null;
    var nbT = (o.neighbours ? o.neighbours(T) : []) || [];
    var nbTset = {}; nbT.forEach(function (w) { nbTset[norm(w)] = 1; });
    var avoid = {}; (o.avoid || []).forEach(function (w) { avoid[norm(w)] = 1; });
    used[norm(T)] = 1;
    function ok(w) {
      var k = norm(w);
      if (!k || used[k] || avoid[k]) return false;
      if (inPool && !inPool[k]) return false;
      for (var i = 0; i < out.length; i++) if (homophones(out[i], w)) return false;
      return true;
    }
    function add(w) { if (w !== undefined && out.length < n && ok(w)) { out.push(w); used[norm(w)] = 1; return true; } return false; }
    // neighbours closest in length first (a pair of options never gives away its member by length), then in a
    // random order weighted by how often each is an answer for this slot (o.freq), so a neighbour foil is not
    // systematically a rarer answer than the target
    function nbOf(w) {
      var a = ((o.neighbours ? o.neighbours(w) : []) || []).filter(ok), L = norm(w).length;
      var keyed = a.map(function (x) { return { x: x, d: Math.min(2, Math.abs(norm(x).length - L)), k: o.freq ? Math.pow(rng.next(), 1 / Math.max(0.01, o.freq[norm(x)] || 0.01)) : rng.next() }; });
      keyed.sort(function (p, q) { return p.d - q.d || q.k - p.k; });
      return keyed.map(function (e) { return e.x; });
    }
    function randomOne(f) {
      // foils follow the answer distribution of this slot (item-sampled), so no option is more often "an answer";
      // f: an extra condition (the length class below), dropped when nothing meets it
      var g = function (w) { return w !== undefined && ok(w) && !nbTset[norm(w)] && (!f || f(w)); };
      if (o.draw) for (var d = 0; d < 30; d++) { var dw = o.draw(rng); if (g(dw)) return dw; }
      var P = o.pool || [];
      for (var t = 0; t < 30 && P.length; t++) { var w = P[ri(rng, P.length)]; if (g(w)) return w; }
      var cand = shuffle(rng, P.filter(g));
      return cand.length || !f ? cand[0] : randomOne();
    }
    // a sound-alike of w with exactly its length (pairs then say nothing by length); undefined when none
    function twin(w) { var L = norm(w).length; return nbOf(w).filter(function (x) { return norm(x).length === L; })[0]; }
    function nbOfAny(w) { var k = norm(w); return out.some(function (x) { return ((o.neighbours ? o.neighbours(x) : []) || []).some(function (y) { return norm(y) === k; }); }); }
    (o.prefer || []).forEach(function (w) { add(w); });
    var spoken = uniq((o.spoken || []).filter(function (w) { return norm(w) !== norm(T); }));
    var ctx = uniq(o.context || []);
    // Pairs or none: two same-length sound-alike pairs (T, T') and (A, A'), A a masker's or a context word, or drawn
    // among words that have such a twin; when either twin is missing (small pools) the options are unpaired, so the
    // answer is never the one option with a sound-alike beside it and pairs never differ by length (reviews ST-02,
    // option length). Unpaired fillers come from the answer's class (with or without a twin in the pool).
    function snapshot() { var u2 = {}; Object.keys(used).forEach(function (k) { u2[k] = used[k]; }); return { o: out.slice(), u: u2 }; }
    function restore(sn) { out.length = 0; sn.o.forEach(function (w) { out.push(w); }); Object.keys(used).forEach(function (k) { delete used[k]; }); Object.keys(sn.u).forEach(function (k) { used[k] = sn.u[k]; }); }
    function pairUp(A) {
      var sn = snapshot(), tT = twin(T);
      if (tT === undefined || !add(tT)) { restore(sn); return false; }
      var a = A !== undefined ? A : randomOne(function (w) { return twin(w) !== undefined; });
      if (a === undefined || !add(a)) { restore(sn); return false; }
      var tA = twin(a);
      if (tA === undefined || !add(tA)) { restore(sn); return false; }
      return true;
    }
    var tClass = twin(T) !== undefined, unpaired = false;
    var loose = function (w) { return (twin(w) !== undefined) === tClass && !nbOfAny(w); };
    if (spoken.length >= n - 1) {
      spoken.slice(0, n - 1).forEach(add);
    } else if (spoken.length === 2) {
      spoken.forEach(add); add(randomOne(function (w) { return !nbOfAny(w); }));
    } else if (spoken.length === 1) {
      if (!pairUp(spoken[0])) { add(spoken[0]); unpaired = true; }
    } else if (ctx.length) {
      var Cw = shuffle(rng, ctx.filter(ok))[0];
      if (Cw === undefined || !pairUp(Cw)) { if (Cw !== undefined) add(Cw); unpaired = true; }
    } else if (!pairUp()) unpaired = true;
    if (unpaired) while (out.length < n) { if (!add(randomOne(loose))) break; }
    var guard = 0;
    while (out.length < n && guard++ < 50) {
      var fw = unpaired ? randomOne(function (w) { return !nbOfAny(w); }) : randomOne();
      if (!add(fw)) { var any = shuffle(rng, (o.pool || []).filter(ok))[0]; if (!add(any)) break; }
    }
    var spokenSet = {}; spoken.forEach(function (w) { spokenSet[norm(w)] = 1; });
    var ctxSet = {}; ctx.forEach(function (w) { ctxSet[norm(w)] = 1; });
    var foils = {}, numSlot = o.type === 'number' || (!o.type && isNum(T) && out.length > 1 && out.slice(1).every(isNum));
    out.slice(1).forEach(function (w) {
      var k = norm(w);
      foils[w] = spokenSet[k] ? 'masker' : numSlot ? (ctxSet[k] ? 'context' : 'number') : nbTset[k] ? 'neighbour' : ctxSet[k] ? 'context' : 'random';
    });
    return { label: o.label || '', options: shuffle(rng, out), answer: T, foils: foils };
  }

  // Normalised membership set of a (cached) pool array, memoised on the array itself.
  function normSet(a) {
    if (a.__ns && a.__nsLen === a.length) return a.__ns;
    var m = {}; for (var i = 0; i < a.length; i++) m[norm(a[i])] = 1;
    try { Object.defineProperty(a, '__ns', { value: m, configurable: true, writable: true }); Object.defineProperty(a, '__nsLen', { value: a.length, configurable: true, writable: true }); } catch (e) { /* frozen */ }
    return m;
  }
  // A part list for words spoken one after another by one voice (gap in s between words).
  function sequence(clips, meta, t0, gap, extra) {
    var parts = [], t = t0;
    clips.forEach(function (c) {
      var p = { clip: c, at: Math.round(t * 1000) / 1000 };
      for (var k in extra) p[k] = extra[k];
      parts.push(p);
      t += ((meta(c) && meta(c).dur) || 0.5) + gap;
    });
    return { parts: parts, end: t - gap };
  }
  // Answer support and sampler for one slot from eligible items: getAns(item) → the slot's answer in that item.
  function answerDist(items, getAns) {
    var list = [], seen = {}, support = [], freq = {};
    items.forEach(function (it) { var a = getAns(it); if (a === undefined || a === null) return; list.push(a); var k = norm(a); freq[k] = (freq[k] || 0) + 1; if (!seen[k]) { seen[k] = 1; support.push(a); } });
    return { support: support, freq: freq, draw: function (rng) { return list.length ? list[ri(rng, list.length)] : undefined; } };
  }
  // Per-set memory for callers that pass the planner's set object as ctx.set (the shell): the controller keeps its
  // counters there and generators remember recent voices and the last room. Non-enumerable, so never logged.
  function memo(ctx) {
    var s = ctx && ctx.set;
    if (!s || typeof s !== 'object') return (ctx && (ctx.__es = ctx.__es || {})) || {};
    if (s.__flow) return s;
    if (!s.__es) { try { Object.defineProperty(s, '__es', { value: {}, enumerable: false, writable: true, configurable: true }); } catch (e) { return {}; } }
    return s.__es;
  }
  function remember(ctx, voice, room) {
    var m = memo(ctx);
    if (voice) { m.recentVoices = [voice].concat((m.recentVoices || []).filter(function (v) { return v !== voice; })).slice(0, 3); }
    if (room) m.lastRoom = room;
  }
  function recentOf(ctx) { return (ctx && ctx.recentVoices) || memo(ctx).recentVoices || []; }
  function breadthOf(setting, ctx) {
    if (setting && typeof setting.breadth === 'number') return setting.breadth;
    return ctx && typeof ctx.breadth === 'number' ? ctx.breadth : 0.3;
  }
  function seedOf(rng) { return Math.floor(rng.next() * 4294967296); }

  ES.engine.items.common = { ri: ri, pick: pick, shuffle: shuffle, sample: sample, chance: chance, weighted: weighted,
    norm: norm, slug: slug, uniq: uniq, homophones: homophones, isNum: isNum, slot: slot, answerDist: answerDist, memo: memo, remember: remember,
    recentOf: recentOf, breadthOf: breadthOf, sequence: sequence, seedOf: seedOf };
})(typeof window !== 'undefined' ? window : globalThis);
