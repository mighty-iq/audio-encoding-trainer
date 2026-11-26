/* ES.lab.materials — the index of probe materials over ES.data (CONTRACTS §6). Only voices and clips marked
   set:'probe' (and ASR-verified) are ever used, so probe content never comes from training sets; held-out rooms
   use seeds ≥ 10000 (training rooms use 1–9999). Rebuilt when the manifest changes. Pure; loads in Node.
   Shapes read (fixture: tests/fixtures/lab-data.js; requested from stimuli in docs/dev/requests.md):
   vocab.matrix {name, verb, num, adj, obj: [words]} + clips kind 'word' per probe voice; clips kind 'digit'
   ('zero'…'nine'); vocab.twovoices [{id, text, key}] + clips kind 'sentence'; vocab.stories [{id, title, text,
   questions:[{q, options, answer}]}] + clips kind 'story'; a probe bed (kind 'bed', bed 'cafe'). MIT licence. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var L = ES.lab = ES.lab || {};
  var SLOTS = ['name', 'verb', 'num', 'adj', 'obj'];
  var SLOT_LABEL = { name: 'Name', verb: 'Verb', num: 'Number', adj: 'Kind', obj: 'Object' };
  var DIGITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  var NATURAL = { audiomnist: 1, cremad: 1, speechocean: 1, librivox: 1 };
  var cache = null;

  function norm(t) { return String(t == null ? '' : t).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function digitWord(t) { var s = norm(t); return /^[0-9]$/.test(s) ? DIGITS[+s] : s; }

  function build() {
    var D = ES.data || {}, man = (D.manifest && D.manifest.clips) || {}, voices = D.voices || {}, vocab = D.vocab || {};
    var ver = D.manifest && D.manifest.version, nClips = Object.keys(man).length;
    if (cache && cache.man === man && cache.voices === voices && cache.vocab === vocab && cache.ver === ver && cache.nClips === nClips) return cache;
    var X = { man: man, voices: voices, vocab: vocab, ver: ver, nClips: nClips, byVKT: {}, byKind: {}, beds: [], rirs: [], probeVoices: [] };
    Object.keys(voices).forEach(function (v) { if (voices[v] && voices[v].set === 'probe') X.probeVoices.push(v); });
    X.probeVoices.sort();
    Object.keys(man).forEach(function (id) {
      var c = man[id];
      if (!c || c.set !== 'probe' || (c.asr && c.asr.ok === false)) return;
      if (c.kind === 'bed') { X.beds.push(id); return; }
      if (c.kind === 'rir') { X.rirs.push(id); return; }
      if (!c.voice || !voices[c.voice] || voices[c.voice].set !== 'probe') return;
      var t = c.kind === 'digit' ? digitWord(c.text) : norm(c.text);
      var k = c.voice + '|' + c.kind + '|' + t;
      if (!X.byVKT[k]) X.byVKT[k] = id;
      if (c.kind === 'story' && c.story) X.byVKT[c.voice + '|story-id|' + c.story] = id;
      (X.byKind[c.kind] = X.byKind[c.kind] || []).push(id);
    });
    X.beds.sort(); X.rirs.sort();

    // Matrix: probe voices with a clip for every word of every slot.
    var mx = vocab.matrix || {}, slots = SLOTS.filter(function (s) { return Array.isArray(mx[s]) && mx[s].length >= 4; });
    X.matrix = { slots: slots, words: {}, voices: [] };
    slots.forEach(function (s) { X.matrix.words[s] = mx[s].map(String); });
    if (slots.length === SLOTS.length) {
      X.matrix.voices = X.probeVoices.filter(function (v) {
        return slots.every(function (s) { return X.matrix.words[s].every(function (w) { return !!X.byVKT[v + '|word|' + norm(w)]; }); });
      });
    }
    // Digits: probe voices with at least 8 of the ten digits; natural talkers first.
    X.digits = { voices: [], words: {} };
    X.probeVoices.forEach(function (v) {
      var have = DIGITS.filter(function (d) { return !!X.byVKT[v + '|digit|' + d]; });
      if (have.length >= 8) { X.digits.voices.push(v); X.digits.words[v] = have; }
    });
    var nat = X.digits.voices.filter(function (v) { return NATURAL[voices[v].src]; });
    if (nat.length >= 2) X.digits.voices = nat;
    // Two voices: probe sentences said by probe voices; a voice counts with ≥ 4 of the items.
    var tv = (vocab.twovoices || []).filter(function (it) { return it && it.id && it.text && it.key; });
    X.twovoices = { items: tv, voices: [], bySex: { f: [], m: [] }, has: {} };
    X.probeVoices.forEach(function (v) {
      var ids = tv.filter(function (it) { return !!X.byVKT[v + '|sentence|' + norm(it.text)]; }).map(function (it) { return it.id; });
      if (ids.length >= 4) { X.twovoices.voices.push(v); X.twovoices.has[v] = ids; (X.twovoices.bySex[voices[v].sex === 'm' ? 'm' : 'f']).push(v); }
    });
    // Stories: passages with questions and at least one probe clip.
    X.stories = (vocab.stories || []).filter(function (s) { return s && s.id && Array.isArray(s.questions) && s.questions.length >= 3; }).map(function (s) {
      var vs = X.probeVoices.filter(function (v) { return !!(X.byVKT[v + '|story-id|' + s.id] || X.byVKT[v + '|story|' + norm(s.text)]); });
      return { id: s.id, title: s.title || '', text: s.text || '', questions: s.questions, voices: vs };
    }).filter(function (s) { return s.voices.length; });
    X.cafe = X.beds.filter(function (id) { return (man[id].bed || '') === 'cafe'; })[0] || X.beds[0] || null;
    cache = X;
    return X;
  }

  function idx() { return build(); }
  function clip(voice, kind, text) { var X = idx(); return X.byVKT[voice + '|' + kind + '|' + (kind === 'digit' ? digitWord(text) : norm(text))] || null; }
  function storyClip(voice, story) { var X = idx(); return X.byVKT[voice + '|story-id|' + story.id] || X.byVKT[voice + '|story|' + norm(story.text)] || null; }
  function meta(id) { var c = idx().man[id]; return c || null; }
  function dur(id, fallback) { var c = meta(id); return c && isFinite(c.dur) && c.dur > 0 ? +c.dur : fallback; }
  function voice(v) { return idx().voices[v] || null; }
  /** Every clip a trial uses, checked: true when all are probe-set clips of probe-set voices (or probe beds). */
  function isProbeClip(id) {
    var X = idx(), c = X.man[id];
    if (!c || c.set !== 'probe') return false;
    if (c.kind === 'bed' || c.kind === 'rir') return true;
    return !!(c.voice && X.voices[c.voice] && X.voices[c.voice].set === 'probe');
  }
  /** Synthetic voices are labelled as synthetic in the app (PLAN §15). */
  function synthetic(v) { var vo = voice(v); return !!vo && (vo.src === 'kokoro' || vo.src === 'piper-libritts'); }

  L.materials = { idx: idx, clip: clip, storyClip: storyClip, meta: meta, dur: dur, voice: voice, isProbeClip: isProbeClip,
    synthetic: synthetic, norm: norm, digitWord: digitWord, SLOTS: SLOTS, SLOT_LABEL: SLOT_LABEL, DIGITS: DIGITS,
    reset: function () { cache = null; } };
})(typeof window !== 'undefined' ? window : globalThis);
