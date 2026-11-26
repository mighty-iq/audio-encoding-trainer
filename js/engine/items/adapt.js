/* Earshot engine — adapter between the stimulus data as built (data/*.js) and the generators. It reads both the
   field names the engine first asked for (tests/fixtures/data-fixture.js) and the ones tools/audio writes:
   call-sign phrase clips ("Daisy, dish, three." with word times) instead of separate word clips; sus items with
   `keywords`/`slots`; repair items with a keyword and a high- and a low-predictability sentence; echo items with
   `slots` [{type, value, q}]; accents as text ("US English (synthetic)"). Results are cached per data build.
   ready(ex) says whether an exercise has material, so the planner only schedules exercises that can run. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var E = ES.engine, I = E.items, C = I.common, X = I.data;
  var NATIVE = { us: 1, gb: 1, uk: 1, au: 1, ca: 1, ie: 1, nz: 1 };

  function words(t) { return C.norm(t).split(' ').filter(Boolean); }
  function cache() { var x = X.idx(); x.adapt = x.adapt || {}; return x.adapt; }
  function memo(key, fn) { var c = cache(); if (!(key in c)) c[key] = fn(); return c[key]; }

  function isNative(vo) {
    if (!vo) return true;
    var a = String(vo.accent || '').toLowerCase();
    if (NATIVE[a]) return true;
    if (/accent|l1|non-?native|second language|foreign/.test(a)) return false;
    return /english/.test(a) && /(us|uk|british|american|australian|irish|canadian|scottish|english \()/.test(a);
  }
  // Call-sign phrases: [name, word, number] spoken by one voice (train set, ASR-checked).
  function callsign() {
    return memo('callsign', function () {
      var x = X.idx(), V = x.vocab || {}, names = {}, nums = {}, out = [];
      (V.names || []).forEach(function (w) { names[C.norm(w)] = 1; });
      (V.numbers || []).forEach(function (w) { nums[C.norm(w)] = 1; });
      Object.keys(x.byVK).forEach(function (vk) {
        if (vk.split('|')[1] !== 'phrase') return;
        x.byVK[vk].forEach(function (id) {
          var c = x.man[id], w = (c.words || []).map(C.norm);
          var tagged = (c.tags || []).indexOf('callsign') >= 0 || (w.length === 3 && names[w[0]] && nums[w[2]]);
          if (!tagged || w.length !== 3 || x.probeWords[w[1]] || x.probeWords[w[2]]) return;
          out.push({ clip: id, voice: c.voice, name: w[0], word: w[1], number: w[2], text: c.text, words: w });
        });
      });
      return out;
    });
  }
  function callsignBy(voice) {
    var m = memo('callsignBy', function () { var o = {}; callsign().forEach(function (p) { (o[p.voice] = o[p.voice] || []).push(p); }); return o; });
    return m[voice] || [];
  }
  function hasWordClips() {
    return memo('wordClips', function () { var x = X.idx(); return Object.keys(x.byVK).some(function (k) { return /\|(word|name|number)$/.test(k); }); });
  }
  // Crowd, Seek and Voices use call-sign phrases when the build has no separate word clips.
  function phraseMode() { return !hasWordClips() && callsign().length > 0; }

  function farItems() {
    return memo('far', function () {
      var V = X.idx().vocab || {};
      if (V.phrases && V.phrases.length) return V.phrases.map(function (it) { return { id: it.id, text: it.text, words: it.words || words(it.text), keys: it.keys, kind: 'sentence' }; });
      // the build's call-sign phrases, unique by text: ask for the word and the number
      var seen = {}, out = [];
      callsign().forEach(function (p) { var k = C.norm(p.text); if (!seen[k]) { seen[k] = 1; out.push({ id: 'cs:' + k, text: p.text, words: p.words, keys: [1, 2], kind: 'phrase' }); } });
      return out;
    });
  }
  function susItems() {
    return memo('sus', function () {
      return ((X.idx().vocab || {}).sus || []).map(function (it) {
        var w = it.words || words(it.text), keys = it.keys;
        if (!keys) {
          var sl = it.slots || {}, kw = it.keywords || [], a = sl.subject || kw[0], b = sl.object || kw[kw.length - 1];
          keys = [w.indexOf(C.norm(a)), w.lastIndexOf(C.norm(b))];
        }
        return { id: it.id, text: it.text, words: w, keys: keys, kind: 'sentence' };
      }).filter(function (it) { return it.keys.length >= 2 && it.keys[0] >= 0 && it.keys[1] >= 0 && it.keys[0] !== it.keys[1]; });
    });
  }
  function repairItems() {
    return memo('repair', function () {
      var out = [];
      ((X.idx().vocab || {}).repair || []).forEach(function (it) {
        if (it.text) { out.push({ id: it.id, text: it.text, words: it.words || words(it.text), key: it.key, pred: it.pred, alts: it.alts || [], foils: it.foils || null, kind: 'sentence' }); return; }
        ['hi', 'lo'].forEach(function (p) {
          if (!it[p]) return;
          var w = words(it[p]), k = w.lastIndexOf(C.norm(it.keyword));
          if (k >= 0) out.push({ id: it.id + ':' + p, text: it[p], words: w, key: k, pred: p, alts: it.alts || [], foils: it.foils || null, kind: 'sentence' });
        });
      });
      return out;
    });
  }
  function echoItems() {
    return memo('echo', function () {
      return ((X.idx().vocab || {}).echo || []).map(function (it) {
        var facts = it.facts || (it.slots || []).map(function (s) { return { cat: s.type || s.cat, value: s.value, q: s.q }; });
        return { id: it.id, text: it.text, words: it.words || words(it.text), facts: facts, kind: 'sentence' };
      }).filter(function (it) { return it.facts.length >= 2; });
    });
  }
  // Clips for an item's text, in any of the kinds a build may use for sentences.
  var SENT = ['sentence', 'phrase'];
  function clipsOf(it) {
    var x = X.idx(), t = C.norm(it.text), out = [];
    (it.kind ? [it.kind].concat(SENT.filter(function (k) { return k !== it.kind; })) : SENT).forEach(function (k) { (x.byKT[k + '|' + t] || []).forEach(function (id) { out.push(id); }); });
    return out;
  }
  function voicesWith(items) {
    var x = X.idx(), vs = {};
    items.forEach(function (it) { clipsOf(it).forEach(function (id) { vs[x.man[id].voice] = 1; }); });
    return Object.keys(vs);
  }
  function anyClips(v) { return ['word', 'sentence', 'phrase', 'intro'].some(function (k) { return X.kindsOf(v, k).length > 0; }); }

  function ready(ex) {
    return memo('ready:' + ex, function () {
      var x = X.idx();
      if (ex === 'crowd') return phraseMode() ? voicesCount(callsign()) >= 2 : x.voices.filter(function (v) { return X.kindsOf(v, 'word').length && X.kindsOf(v, 'number').length && X.kindsOf(v, 'name').length; }).length >= 2;
      if (ex === 'far') return voicesWith(farItems()).length >= 1;
      if (ex === 'strange') return voicesWith(susItems()).length >= 1;
      if (ex === 'repair') return repairItems().some(function (it) { return clipsOf(it).some(function (id) { var c = x.man[id]; return c.wt && c.wt[it.key]; }); });
      if (ex === 'echo') return voicesWith(echoItems()).length >= 1;
      if (ex === 'seek') return phraseMode() ? voicesCount(callsign()) >= 2 : x.voices.filter(function (v) { return X.kindsOf(v, 'word').length; }).length >= 2;
      if (ex === 'voices') return x.voices.filter(function (v) { var vo = x.vdat[v]; return vo.cast && vo.cast.name && anyClips(v); }).length >= 2;
      return false;
    });
  }
  function voicesCount(list) { var s = {}; list.forEach(function (p) { s[p.voice] = 1; }); return Object.keys(s).length; }

  I.adapt = { isNative: isNative, callsign: callsign, callsignBy: callsignBy, phraseMode: phraseMode, farItems: farItems, susItems: susItems,
    repairItems: repairItems, echoItems: echoItems, clipsOf: clipsOf, voicesWith: voicesWith, ready: ready, anyClips: anyClips, words: words };
})(typeof window !== 'undefined' ? window : globalThis);
