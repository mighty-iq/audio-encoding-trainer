/* Earshot engine — shared helpers for the item generators: seeded choice (only rng.next() is used), text
   normalisation, homophones, and the option builder.
   Option design (so that responders who use only the option list stay at chance):
   - every option comes from the pool of possible answers (a foil is never a word that cannot be an answer);
   - similarity structure is symmetric: with no masker words the options are two neighbour pairs (T, nT) and
     (R, nR); with one masker (T, nT) and (M, nM); with two maskers T, M1, M2 and one random R; with three, all
     spoken words. So "pick the most typical / most different option" has no edge;
   - positions are shuffled; homophones of the answer are never options.
   Foil labels are relative to the answer: 'masker' (spoken by another voice in this trial), 'neighbour'
   (phonetic neighbour of the answer), 'context' (fits the sentence's meaning), 'random' (none of these). */
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
  function homophones(a, b) {
    a = norm(a); b = norm(b);
    if (a === b) return true;
    var g = homoIndex[a];
    return !!(g && g.indexOf(b) >= 0);
  }

  /* Build one answer slot.
     o = { answer, spoken:[masker words], pool:[possible answers], neighbours:fn(w)→[w], context:[words fitting the
           sentence], avoid:[words never to show], n:4, label }
     Returns { label, options, answer, foils:{option:type} }. */
  function slot(rng, o) {
    var n = o.n || 4, T = o.answer, used = {}, out = [T];
    var inPool = {}; (o.pool || []).forEach(function (w) { inPool[norm(w)] = 1; });
    var nbT = (o.neighbours ? o.neighbours(T) : []) || [];
    var nbTset = {}; nbT.forEach(function (w) { nbTset[norm(w)] = 1; });
    var avoid = {}; (o.avoid || []).forEach(function (w) { avoid[norm(w)] = 1; });
    used[norm(T)] = 1;
    function ok(w) {
      var k = norm(w);
      if (!k || used[k] || avoid[k]) return false;
      if (o.pool && !inPool[k]) return false;
      for (var i = 0; i < out.length; i++) if (homophones(out[i], w)) return false;
      return true;
    }
    function add(w) { if (w !== undefined && out.length < n && ok(w)) { out.push(w); used[norm(w)] = 1; return true; } return false; }
    function nbOf(w) { return shuffle(rng, ((o.neighbours ? o.neighbours(w) : []) || []).filter(ok)); }
    function randomOne() {
      var cand = shuffle(rng, (o.pool || []).filter(function (w) { return ok(w) && !nbTset[norm(w)]; }));
      return cand[0];
    }
    var spoken = uniq((o.spoken || []).filter(function (w) { return norm(w) !== norm(T); }));
    var ctx = uniq(o.context || []);
    if (spoken.length >= n - 1) {
      spoken.slice(0, n - 1).forEach(add);
    } else if (spoken.length === 2) {
      spoken.forEach(add); add(randomOne());
    } else if (spoken.length === 1) {
      add(spoken[0]);
      add(nbOf(T)[0]);
      add(nbOf(spoken[0])[0]);
    } else if (ctx.length) {
      var C = shuffle(rng, ctx.filter(ok))[0];
      add(nbOf(T)[0]);
      if (add(C)) add(nbOf(C)[0]);
    } else {
      add(nbOf(T)[0]);
      var R = randomOne();
      if (add(R)) add(nbOf(R)[0]);
    }
    var guard = 0;
    while (out.length < n && guard++ < 50) { if (!add(randomOne())) { var any = shuffle(rng, (o.pool || []).filter(ok))[0]; if (!add(any)) break; } }
    var spokenSet = {}; spoken.forEach(function (w) { spokenSet[norm(w)] = 1; });
    var ctxSet = {}; ctx.forEach(function (w) { ctxSet[norm(w)] = 1; });
    var foils = {};
    out.slice(1).forEach(function (w) {
      var k = norm(w);
      foils[w] = spokenSet[k] ? 'masker' : nbTset[k] ? 'neighbour' : ctxSet[k] ? 'context' : 'random';
    });
    return { label: o.label || '', options: shuffle(rng, out), answer: T, foils: foils };
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
  function seedOf(rng) { return Math.floor(rng.next() * 4294967296); }

  ES.engine.items.common = { ri: ri, pick: pick, shuffle: shuffle, sample: sample, chance: chance, weighted: weighted,
    norm: norm, slug: slug, uniq: uniq, homophones: homophones, slot: slot, sequence: sequence, seedOf: seedOf };
})(typeof window !== 'undefined' ? window : globalThis);
