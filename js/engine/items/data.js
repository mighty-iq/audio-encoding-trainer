/* Earshot engine — index over ES.data for the generators (train set only; probe voices, probe clips and probe
   words such as the matrix and story vocabulary are never used). Rebuilt when the manifest changes. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  ES.engine = ES.engine || {};
  var I = ES.engine.items = ES.engine.items || {};
  var C = I.common;
  var cache = null;

  function build() {
    var D = ES.data || {}, man = (D.manifest && D.manifest.clips) || {}, voices = D.voices || {}, vocab = D.vocab || {};
    if (cache && cache.man === man && cache.vdat === voices && cache.vocab === vocab && cache.ver === (D.manifest && D.manifest.version)) return cache;
    var ids = Object.keys(man);
    var sig = (D.manifest && D.manifest.version) + ':' + ids.length + ':' + Object.keys(voices).length;
    var X = { sig: sig, ver: D.manifest && D.manifest.version, byVK: {}, byKT: {}, byVKT: {}, beds: {}, voices: [], probeWords: {}, man: man, vdat: voices, vocab: vocab };
    // probe-only words: the matrix probe vocabulary and story texts, plus any word that only probe clips speak
    var mx = vocab.matrix || {};
    Object.keys(mx).forEach(function (k) { (mx[k] || []).forEach(function (w) { X.probeWords[C.norm(w)] = 1; }); });
    ids.forEach(function (id) {
      var c = man[id];
      if (!c || c.set !== 'train' || (c.asr && c.asr.ok === false)) return;
      if (c.kind === 'bed') { (X.beds[c.bed || 'babble'] = X.beds[c.bed || 'babble'] || []).push(id); return; }
      if (!c.voice || !voices[c.voice] || voices[c.voice].set !== 'train') return;
      var t = C.norm(c.text);
      if (X.probeWords[t]) return;
      var vk = c.voice + '|' + c.kind;
      (X.byVK[vk] = X.byVK[vk] || []).push(id);
      (X.byKT[c.kind + '|' + t] = X.byKT[c.kind + '|' + t] || []).push(id);
      var key = vk + '|' + t;
      if (!X.byVKT[key]) X.byVKT[key] = id;
    });
    X.voices = Object.keys(voices).filter(function (v) { return voices[v].set === 'train'; }).sort();
    cache = X;
    return X;
  }

  function idx() { return build(); }
  function clip(id) { return idx().man[id]; }
  function textOf(id) { var c = clip(id); return c ? c.text : ''; }
  function voice(v) { return idx().vdat[v]; }
  function has(v, kind, text) { return !!idx().byVKT[v + '|' + kind + '|' + C.norm(text)]; }
  function clipFor(v, kind, text) { return idx().byVKT[v + '|' + kind + '|' + C.norm(text)] || null; }
  function kindsOf(v, kind) { return idx().byVK[v + '|' + kind] || []; }
  // Texts of `kind` available from at least `minVoices` train voices, restricted to `list` when given.
  function pool(kind, list, minVoices) {
    var X = idx(), out = [], seen = {};
    var ck = kind + '|' + (minVoices || 1) + '|' + (list || []).length + '|' + (list && list[0]) + '|' + (list && list[list.length - 1]);
    X.poolCache = X.poolCache || {};
    if (X.poolCache[ck]) return X.poolCache[ck];
    X.poolCache[ck] = out;
    (list || []).forEach(function (w) {
      var t = C.norm(w);
      if (seen[t] || X.probeWords[t]) return;
      var a = X.byKT[kind + '|' + t];
      if (a && a.length >= (minVoices || 1)) { seen[t] = 1; out.push(w); }
    });
    return out;
  }
  function isProbeWord(w) { return !!idx().probeWords[C.norm(w)]; }
  // Sound-alike neighbours, symmetric (x lists w ⇒ w's neighbours include x): one-way lists made long answers'
  // neighbours shorter on average, which an always-pick-the-longest player could exploit (review: option length).
  function neighbours(w) {
    var X = idx();
    if (!X.nbSym) {
      var src = X.vocab.neighbours || {}, m = {};
      Object.keys(src).forEach(function (k) {
        var a = C.norm(k);
        (src[k] || []).forEach(function (x) { var b = C.norm(x); if (!a || !b || a === b) return; (m[a] = m[a] || {})[b] = 1; (m[b] = m[b] || {})[a] = 1; });
      });
      X.nbSym = {}; Object.keys(m).forEach(function (k) { X.nbSym[k] = Object.keys(m[k]); });
    }
    return (X.nbSym[C.norm(w)] || []).slice();
  }
  function semis(a, b) { return a && b ? 12 * Math.log(a / b) / Math.LN2 : null; }

  /* Voices allowed now: train voices that have every needed (kind, text) or at least `kinds`, in a stable
     per-player order truncated by breadth (variety widens as accuracy holds). */
  function voicePool(opts) {
    opts = opts || {};
    var X = idx();
    var ck = (opts.kinds || []).join(',') + '|' + (opts.order || '') + '|' + (opts.avoid || []).join(',');
    X.vpCache = X.vpCache || {};
    var base = !opts.filter && X.vpCache[ck];
    if (base) return truncate(base, opts);
    var list = X.voices.filter(function (v) {
      var vo = X.vdat[v];
      if (opts.filter && !opts.filter(vo, v)) return false;
      if (opts.avoid && opts.avoid.indexOf(v) >= 0) return false;
      return (opts.kinds || []).every(function (k) { return kindsOf(v, k).length > 0; });
    });
    if (opts.order) {
      var r = ES.core.rng('voices:' + opts.order);
      list = C.shuffle(r, list);
    }
    if (!opts.filter) X.vpCache[ck] = list;
    return truncate(list, opts);
  }
  function truncate(list, opts) {
    if (opts.breadth === undefined) return list.slice();
    var minN = opts.minN || 4;
    var nKeep = Math.max(Math.min(minN, list.length), Math.round(minN + opts.breadth * (list.length - minN)));
    return list.slice(0, nKeep);
  }

  /* Maskers by similarity level: 0 other sex; 1 same sex, ≥ 2 semitones apart; 2 same sex, closest pitch
     (< 2 semitones where possible); 3 near-twin (the target's own voice, pitch-shifted ~1 semitone). */
  function maskers(rng, target, level, count, pool, needs, wide) {
    var X = idx(), tv = X.vdat[target], out = [];
    var cand = pool.filter(function (v) { return v !== target && (!needs || needs(v)); });
    var extra = (wide || []).filter(function (v) { return v !== target && cand.indexOf(v) < 0 && (!needs || needs(v)); });
    // the variety-limited pool first; voices outside it only when the pool lacks the wanted kind
    function bySex(same) {
      var a = cand.filter(function (v) { return (X.vdat[v].sex === tv.sex) === same && out.every(function (o) { return o.v !== v; }); });
      if (a.length) return a;
      return extra.filter(function (v) { return (X.vdat[v].sex === tv.sex) === same && out.every(function (o) { return o.v !== v; }); });
    }
    var lvl = level;
    while (out.length < count) {
      var left = cand.filter(function (v) { return out.indexOf(v) < 0; });
      var pickV = null, fx = null;
      if (lvl >= 3 && out.filter(function (o) { return o.v === target; }).length < 2) {
        pickV = target; fx = [{ type: 'resample', ratio: out.length % 2 ? 0.94 : 1.06 }];
      } else if (lvl === 0) {
        pickV = C.pick(rng, bySex(false));
      } else if (lvl === 1) {
        var far = bySex(true).filter(function (v) { var s = semis(X.vdat[v].f0, tv.f0); return s === null || Math.abs(s) >= 2; });
        pickV = C.pick(rng, far.length ? far : bySex(true));
      } else {
        var same = bySex(true);
        same.sort(function (a, b) { return Math.abs(semis(X.vdat[a].f0, tv.f0) || 0) - Math.abs(semis(X.vdat[b].f0, tv.f0) || 0); });
        pickV = C.pick(rng, same.slice(0, 3));
      }
      if (!pickV) {
        // not enough voices of the wanted kind: fall back one level easier, record what was used
        if (lvl > 0) { lvl--; continue; }
        pickV = C.pick(rng, left);
        if (!pickV) break;
      }
      if (pickV !== target) { cand = cand.filter(function (v) { return v !== pickV; }); extra = extra.filter(function (v) { return v !== pickV; }); }
      out.push({ v: pickV, fx: fx, level: lvl });
    }
    // the trial's similarity is that of its most similar masker (it drives the informational masking)
    var used = out.length ? Math.max.apply(null, out.map(function (o) { return o.level; })) : level;
    return { list: out, level: Math.min(level, used) };
  }

  function bed(rng, kinds) {
    var X = idx(), have = (kinds || Object.keys(X.beds)).filter(function (k) { return X.beds[k] && X.beds[k].length; });
    var k = C.pick(rng, have);
    return k ? { kind: k, id: C.pick(rng, X.beds[k]) } : null;
  }
  // Babble from other train voices' sentences when no bed clip exists.
  function babbleClips(rng, avoidVoices, n) {
    return C.shuffle(rng, sentenceVoices(avoidVoices)).slice(0, n).map(function (v) { return C.pick(rng, kindsOf(v, 'sentence')); });
  }
  // The items an answer can come from with this voice pool (any clip by a pool voice; clipsOf(it) → clip ids), and
  // their answer distribution: foils follow it, so a word that was right before is no likelier to be right again
  // (review ST-03). Memoised per list name and pool.
  function reach(name, items, pool, clipsOf) {
    var X = idx(), key = 'reach:' + name + ':' + items.length + ':' + pool.slice().sort().join(',');
    X.poolCache = X.poolCache || {};
    if (X.poolCache[key]) return X.poolCache[key];
    var inPool = {}; pool.forEach(function (v) { inPool[v] = 1; });
    var get = clipsOf || function (it) { return I.adapt.clipsOf(it); };
    var out = items.filter(function (it) { return get(it).some(function (id) { return inPool[X.man[id].voice]; }); });
    out.key = key;
    X.poolCache[key] = out;
    return out;
  }
  function distOf(name, list, getAns) {
    var X = idx(), key = 'dist:' + name + ':' + (list.key || list.length);
    X.poolCache = X.poolCache || {};
    return X.poolCache[key] || (X.poolCache[key] = C.answerDist(list, getAns));
  }
  // A slot's answer distribution: over the reachable items when they hold ≥ 4 different answers, else over all.
  function slotDist(name, reachable, all, getAns) {
    var d = distOf(name, reachable, getAns);
    return d.support.length >= 4 || reachable === all ? d : distOf(name + ':all', all, getAns);
  }
  // Background bed spec (review M3): 'babble' = one train sentence clip per talker, from voices other than `avoid`
  // ({kind:'babble', clips, db}; never a recorded bed id, which the renderer cannot split into talkers); any other
  // kind = a recorded bed of that kind ({kind:'ambience', bed:id, db}). With fewer than 3 babble talkers in the build
  // the recorded crowd bed stands in as an ambience, else speech-shaped noise. Talkers: o.talkers (default 6).
  // Returns null when no listed kind exists in the build (the caller picks its default).
  function sentenceVoices(avoid) { var X = idx(); return X.voices.filter(function (v) { return (avoid || []).indexOf(v) < 0 && kindsOf(v, 'sentence').length > 0; }); }
  function bedSpec(rng, kinds, o) {
    o = o || {};
    var X = idx(), db = o.db || 0, rec = X.beds.babble || [];
    var have = (kinds || []).filter(function (k) { return k === 'babble' ? sentenceVoices(o.avoid).length >= 3 || rec.length > 0 : X.beds[k] && X.beds[k].length; });
    var k = C.pick(rng, have);
    if (!k) return null;
    if (k !== 'babble') return { kind: 'ambience', bed: C.pick(rng, X.beds[k]), db: db };
    var clips = babbleClips(rng, o.avoid, o.talkers || 6);
    if (clips.length >= 3) return { kind: 'babble', clips: clips, db: db };
    return rec.length ? { kind: 'ambience', bed: C.pick(rng, rec), db: db } : { kind: 'ssn', db: db };
  }
  // Talkers in a babble bed: 6, and 4–8 once variety is wide (talker count is one of the masker variations, PLAN §3).
  function bedTalkers(rng, breadth) { return breadth >= 0.6 ? 4 + 2 * Math.floor(rng.next() * 3) : 6; }

  // Synthetic training rooms: seeds 1…9999 only (probes use ≥ 10000 or measured responses). Size words map to fixed
  // lengths in the renderer (CONTRACTS §12 R1); the talker distance must stay ≤ 0.8 × the room length.
  var SIZES = ['small', 'medium', 'large', 'hall'], LEN = { small: 5, medium: 10, large: 22, hall: 38 };
  function fitSize(size, dist) {
    var i = Math.max(0, SIZES.indexOf(size));
    while (i < SIZES.length - 1 && dist > 0.8 * LEN[SIZES[i]]) i++;
    return SIZES[i];
  }
  function room(rng, rt60, dist, sizeHint) {
    var size = sizeHint || (rt60 >= 1.7 ? 'hall' : rt60 >= 0.8 ? 'large' : rt60 >= 0.5 ? 'medium' : 'small');
    return { rt60: rt60, dist: dist, size: fitSize(size, dist), seed: 1 + C.ri(rng, 9999) };
  }

  /* An item (with .text) and a voice from `pool` that has its clip of `kind`; tries items in random order.
     Returns { item, voice, clip } or null. avoidVoices are skipped when possible. */
  function itemVoice(rng, items, kind, pool, avoidVoices) {
    var X = idx(), inPool = {}, avoid = {};
    pool.forEach(function (v) { inPool[v] = 1; });
    (avoidVoices || []).forEach(function (v) { avoid[v] = 1; });
    var order = C.shuffle(rng, items), fallback = null;
    for (var i = 0; i < order.length && i < 80; i++) {
      var it = order[i], ids = kind === 'any' && I.adapt ? I.adapt.clipsOf(it) : (X.byKT[kind + '|' + C.norm(it.text)] || []);
      var vs = ids.filter(function (id) { return inPool[X.man[id].voice]; });
      if (!vs.length) continue;
      var fresh = vs.filter(function (id) { return !avoid[X.man[id].voice]; });
      var id = C.pick(rng, fresh.length ? fresh : vs);
      var hit = { item: it, voice: X.man[id].voice, clip: id };
      if (fresh.length) return hit;
      if (!fallback) fallback = hit;
    }
    return fallback;
  }
  // Unique words at `keys` positions across items (the answer pool of an exercise), probe words removed.
  function keyPool(name, items, getKeys) {
    var X = idx();
    X.poolCache = X.poolCache || {};
    if (X.poolCache['keys:' + name]) return X.poolCache['keys:' + name];
    var seen = {}, out = [];
    (items || []).forEach(function (it) {
      getKeys(it).forEach(function (w) { var t = C.norm(w); if (t && !seen[t] && !X.probeWords[t]) { seen[t] = 1; out.push(t); } });
    });
    X.poolCache['keys:' + name] = out;
    return out;
  }

  I.data = { itemVoice: itemVoice, keyPool: keyPool, idx: idx, clip: clip, textOf: textOf, voice: voice, has: has, clipFor: clipFor, kindsOf: kindsOf, pool: pool,
    isProbeWord: isProbeWord, neighbours: neighbours, semis: semis, voicePool: voicePool, maskers: maskers, bed: bed,
    babbleClips: babbleClips, bedSpec: bedSpec, bedTalkers: bedTalkers, reach: reach, distOf: distOf, slotDist: slotDist, room: room, fitSize: fitSize, ROOM_LEN: LEN, reset: function () { cache = null; } };
})(typeof window !== 'undefined' ? window : globalThis);
