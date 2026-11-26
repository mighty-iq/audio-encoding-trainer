/* Earshot — exercise views A: shared kit and strategy cards (CONTRACTS §11; docs/dev/progress/exA.md).
   ES.ex._kit (non-enumerable): helpers that js/ex/{crowd,far,strange,repair}.js call inside functions only, so
   the load order among js/ex/* does not matter: dial wording from ES.engine.dials (ranges always match the code),
   the Help sheet, picture helpers, replay derivation, answer placement and tutorial trials.
   ES.ex.strategies (non-enumerable): strategy cards for the plateau breaker, each grounded in the research notes
   (docs/research/R2, R3); pick(exId, {dial, seen, headphones}) → {id, ex, title, text, tryIt}. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  ES.ex = ES.ex || {};

  function hide(key, val) {
    try { Object.defineProperty(ES.ex, key, { value: val, enumerable: false, configurable: true, writable: true }); }
    catch (e) { ES.ex[key] = val; }
  }
  function U() { return ES.core.util; }
  function clone(x) { return x == null ? x : JSON.parse(JSON.stringify(x)); }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function round(x, d) { var p = Math.pow(10, d || 0); return Math.round(x * p) / p; }
  function report(where, e) {
    if (root.console && console.error) console.error('[ex ' + where + ']', e);
    if (ES._keepError) ES._keepError({ at: Date.now(), kind: 'ex', msg: where + ': ' + String(e && e.message || e), stack: String(e && e.stack || '').slice(0, 800) });
  }
  function q(w) { return '“' + w + '”'; }

  /* ---- dials in plain words ---- */
  function dialsOf(ex) { var D = ES.engine && ES.engine.dials; return (D && D[ex]) || []; }
  function dialOf(ex, id) { var a = dialsOf(ex); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function easyEnd(d) { return d.kind === 'ord' ? 0 : d.dir < 0 ? d.max : d.min; }
  function hardEnd(d) { return d.kind === 'ord' ? (d.levels ? d.levels.length - 1 : d.max) : d.dir < 0 ? d.min : d.max; }
  /** A dial value in real units: the level's label for ladders, dB / m / unit for continuous dials. */
  function fmt(d, v) {
    if (!d || v == null || typeof v !== 'number' || isNaN(v)) return '';
    if (d.kind === 'ord') { var L = d.levels || []; return L.length ? String(L[clamp(Math.round(v), 0, L.length - 1)]) : String(v); }
    if (d.unit === 'dB') return U().fmtDb(v);
    if (d.unit === 'm') return U().fmtM(v);
    return U().fmtNum(v, 1) + (d.unit ? ' ' + d.unit : '');
  }
  function nb(s) { return String(s).replace(/ /g, '\u00a0'); }   // keep "−15 dB" or "3 other voices" on one line
  function range(d) { return nb(fmt(d, easyEnd(d))) + ' → ' + nb(fmt(d, hardEnd(d))); }
  /** The player's current edge on a dial in real units, once the learner has seen enough trials (else null). */
  function edge(ex, id) {
    var L = ES.engine && ES.engine.learner;
    if (!L || typeof L.est !== 'function') return null;
    try {
      var e = L.est(ex, id);
      return e && e.n >= 5 && typeof e.m === 'number' && isFinite(e.m) ? fmt(dialOf(ex, id), e.m) : null;
    } catch (err) { return null; }
  }
  /** Value of a dial in a trial's setting, in real units (ladders give the level's value, e.g. 8 for "8 m"). */
  function value(trial, ex, id) {
    var d = dialOf(ex, id), s = trial && trial.setting && trial.setting.dials;
    if (!d || !s || s[id] == null) return null;
    return d.kind === 'ord' && d.values ? d.values[clamp(Math.round(s[id]), 0, d.values.length - 1)] : s[id];
  }

  /** Venues of the Night out map that use exercise ex (the game layer owns the map); fallback when it is absent. */
  function venuesOf(ex, fallback) {
    var G = ES.game && ES.game.venues;
    if (G && typeof G.forExercise === 'function') {
      try { var v = G.forExercise(ex).map(function (x) { return x.id; }); if (v.length) return v; } catch (e) { /* fall back */ }
    }
    return fallback.slice();
  }

  /* ---- Help sheet: the goal, each dial in plain words with its real range, tips, the bet ---- */
  function helpBody(mod, el) {
    var u = U(), h = typeof mod.helpData === 'function' ? mod.helpData() : {}, notes = h.dials || {};
    el.appendChild(u.el('p', { class: 'lead' }, h.goal || mod.short || ''));
    var defs = dialsOf(mod.id).filter(function (d) { return notes[d.id] !== false; });
    if (defs.length) {
      el.appendChild(u.el('h3', { class: 'help-h' }, h.dialsTitle || 'What gets harder as you improve'));
      var dl = u.el('dl', { class: 'help-dials' });
      defs.forEach(function (d) {
        var e = edge(mod.id, d.id);
        dl.appendChild(u.el('dt', null, [u.el('span', null, d.label), d.requires === 'headphones' ? u.el('span', { class: 'help-tag' }, ' · headphones') : null]));
        dl.appendChild(u.el('dd', null, [notes[d.id] ? notes[d.id] + ' ' : '', u.el('span', { class: 'mono help-range' }, range(d)),
          e ? u.el('span', { class: 'help-edge' }, [' · your edge now: ', u.el('span', { class: 'mono' }, e)]) : null]));
      });
      el.appendChild(dl);
    }
    var tips = mod.tips || [];
    if (tips.length) {
      el.appendChild(u.el('h3', { class: 'help-h' }, 'Tips'));
      el.appendChild(u.el('ul', { class: 'tips' }, tips.map(function (t) { return u.el('li', null, t); })));
    }
    if (mod.bet) el.appendChild(u.el('p', { class: 'bet' }, [u.el('strong', null, mod.betNew ? 'The bet (new): ' : 'The bet: '), mod.bet]));
    if (h.why) el.appendChild(u.el('p', { class: 'help-why' }, h.why));
    return el;
  }
  /** The Help sheet. opts.actions (optional) replaces the single "Got it" button, e.g. Play's
      [{label:'Replay the tutorial', value:'tutorial'}, {label:'Back to the trial', kind:'primary', value:'resume'}];
      the returned handle's closed promise resolves with the chosen value. */
  function openHelp(mod, opts) {
    if (!ES.ui || typeof ES.ui.sheet !== 'function') return null;
    var acts = opts && opts.actions && opts.actions.length ? opts.actions : [{ label: 'Got it', kind: 'primary', value: 'ok' }];
    return ES.ui.sheet({ title: mod.name + ': how it works', cls: 'sheet-help', label: mod.name + ' help',
      body: function (b) { helpBody(mod, b); }, actions: acts });
  }

  /* ---- trial helpers ---- */
  function slotsOf(trial) { return (trial && trial.question && trial.question.slots) || []; }
  function optVal(o) { return String(o !== null && typeof o === 'object' ? (o.id != null ? o.id : o.value != null ? o.value : o.label) : o); }
  function answerIndex(s) { return (s.options || []).map(optVal).indexOf(String(s.answer)); }
  /** Move each slot's answer to key position pos[i] (tutorials: the right answer sits in a new key each time). */
  function placeAnswers(trial, pos) {
    slotsOf(trial).forEach(function (s, i) {
      var p = pos && pos[i], idx = answerIndex(s);
      if (p == null || idx < 0) return;
      var o = s.options.splice(idx, 1)[0];
      s.options.splice(clamp(p, 0, s.options.length), 0, o);
    });
    return trial;
  }
  /** Line for a wrong slot by foil type: neighbour "Word: “cap” sounds like “cup”."; context "“bowl” fits the
      sentence, but the sound was “cup”."; similar "“X” is a close one; it was “Y”."; number and random
      "Number: it was “seven”, not “nine”." (never "sounds like" for numbers). */
  function missLine(trial, i, r, who) {
    var s = slotsOf(trial)[i] || {}, lab = slotsOf(trial).length > 1 && s.label ? s.label + ': ' : '';
    if (r.picked == null) return lab + (who || 'It') + ' said ' + q(r.answer) + '.';
    if (r.foil === 'neighbour') return lab + q(r.picked) + ' sounds like ' + q(r.answer) + '.';
    if (r.foil === 'context') return lab + q(r.picked) + ' fits the sentence, but the sound was ' + q(r.answer) + '.';
    if (r.foil === 'similar') return lab + q(r.picked) + ' is a close one; it was ' + q(r.answer) + '.';
    // 'number' (another number of the set; numbers are not sound-alikes), 'random' and anything new: plain words
    return lab + (who ? who + ' said ' : 'it was ') + q(r.answer) + ', not ' + q(r.picked) + '.';
  }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  /* ---- replays: taken from the generator when it gives them, derived from trial.audio otherwise ---- */
  function findReplay(trial, re) {
    var rs = (trial && trial.feedback && trial.feedback.replays) || [];
    for (var i = 0; i < rs.length; i++) if (rs[i] && rs[i].audio && re.test(String(rs[i].label || ''))) return rs[i];
    return null;
  }
  /** The target (and its cue) alone: no other voices, no beds. */
  function audioAlone(a) {
    var b = clone(a) || {};
    b.parts = (b.parts || []).filter(function (p) { return p.role === 'target' || p.role === 'cue'; });
    b.beds = [];
    return b;
  }
  /** The target phrase up close: dry (no room), no noise, no cue sentence. */
  function audioNear(a) {
    var b = clone(a) || {}, t = (b.parts || []).filter(function (p) { return p.role === 'target'; });
    var shift = t.length ? Math.max(0, Math.min.apply(null, t.map(function (p) { return p.at || 0; })) - 0.3) : 0;
    b.parts = t.map(function (p) { p.at = round((p.at || 0) - shift, 3); delete p.room; return p; });
    b.beds = []; b.room = null;
    if (typeof b.dur === 'number') b.dur = round(Math.max(0.8, b.dur - shift), 2);
    return b;
  }
  /** The sentence whole: no lost word, no gating, no noise. */
  function audioClean(a) {
    var b = clone(a) || {};
    (b.parts || []).forEach(function (p) {
      if (p.fx) p.fx = p.fx.filter(function (f) { return !/^(mask|gate)$/.test(f && f.type); });
      if (p.fx && !p.fx.length) delete p.fx;
    });
    b.beds = [];
    return b;
  }

  /* ---- picture helpers (ES.ui.field model; static while sound plays) ---- */
  // Room sizes as the renderer builds them (CONTRACTS §12 R1): [length, width] in m; a number = length, width 0.7×.
  var ROOM_M = { small: [5, 4], medium: [10, 7], large: [22, 15], hall: [38, 24] };
  /** The room outline for the field: you stand inside the room facing the talker, who stands inside it too (the
      engine keeps dist ≤ 0.8 × length); minBack (m) keeps the back wall that far behind you, ahead (m, ≥ 0.3) the far
      wall that far beyond the talker. Returns
      {w, d, cx, cy, far, back} in metres (cy = centre ahead of you, far = wall ahead, back = wall behind). */
  function roomBox(size, dist, minBack, ahead) {
    var w, d, m = ROOM_M[size];
    if (m) { d = m[0]; w = m[1]; }
    else if (size && size.length === 3) { d = +size[0]; w = +size[1]; }
    else if (size && size.length === 2) { w = +size[0]; d = +size[1]; }
    else { d = typeof size === 'number' && size > 0 ? size : 8; w = 0.7 * d; }
    dist = dist || 0;
    var gap = Math.max(0.3, ahead || 0), floor = Math.max(0.3, minBack || 0), back = Math.max(Math.min(1.5, 0.15 * d), floor);
    if (dist + back + gap > d) back = Math.max(floor, Math.min(back, d - dist - gap));   // prefer the true room size
    if (dist + back + gap > d) d = Math.ceil((dist + back + gap) * 10) / 10;   // else draw it a little deeper behind you
    return { w: round(w, 1), d: round(d, 1), cx: 0, cy: round(d / 2 - back, 2), far: round(d - back, 2), back: round(back, 2) };
  }
  /** Voices that share a place (no direction cue, or the same azimuth) are drawn as a small group at one
      distance, 32° apart, the voice to follow in the middle: every dot and the call-sign label stay visible, and
      nobody looks nearer or farther (which would suggest a level difference). Mutates and returns voices. */
  function clusterSamePlace(voices, dist) {
    var groups = [];
    voices.forEach(function (v) {
      var g = null;
      for (var i = 0; i < groups.length && !g; i++) if (Math.abs((groups[i][0].az || 0) - (v.az || 0)) < 3) g = groups[i];
      if (g) g.push(v); else groups.push([v]);
    });
    groups.forEach(function (g) {
      if (g.length < 2) return;
      g.sort(function (a, b) { return (b.role === 'target') - (a.role === 'target'); });
      var az0 = g[0].az || 0;
      g.forEach(function (v, i) {
        v.dist = dist || v.dist || 1.5;
        v.az = az0 + (i === 0 ? 0 : (i % 2 ? 1 : -1) * 32 * Math.ceil(i / 2));
      });
    });
    return voices;
  }

  /* ---- tutorial trials: the generator with every dial forced (easy end unless the step says), else a SHIM ---- */
  function tutorialTrial(mod, step, i, rng) {
    var force = (step && step.force) || {}, dials = {};
    dialsOf(mod.id).forEach(function (d) { if (!d.requires && !d.family) dials[d.id] = easyEnd(d); });
    Object.keys(force.dials || {}).forEach(function (k) { dials[k] = force.dials[k]; });
    var setting = { dials: dials, focus: force.focus || null, anchor: true, warmup: true };
    var items = ES.engine && ES.engine.items && ES.engine.items[mod.id], t = null;
    if (!rng && ES.core && ES.core.rng) rng = ES.core.rng('tutorial:' + mod.id + ':' + i);
    if (items && typeof items.make === 'function') {
      try { t = items.make(rng, setting, { tutorial: true, force: force.items, mode: 'tutorial', breadth: 0 }); }
      catch (e) { report(mod.id + ' tutorial', e); }
    }
    if (!t && typeof mod.shim === 'function') t = mod.shim(rng, setting);   // SHIM until the generator lands
    if (!t) return null;
    if (!t.setting) t.setting = setting;
    if (t.seed == null) t.seed = rng && rng.seed;
    if (!t.ex) t.ex = mod.id;
    if (force.answerAt) placeAnswers(t, force.answerAt);
    return typeof mod.prepare === 'function' ? mod.prepare(t) : t;
  }

  hide('_kit', { clone: clone, clamp: clamp, round: round, report: report, q: q, cap: cap,
    venuesOf: venuesOf, dialsOf: dialsOf, dialOf: dialOf, easyEnd: easyEnd, hardEnd: hardEnd, fmt: fmt, range: range, edge: edge, value: value,
    helpBody: helpBody, openHelp: openHelp, slotsOf: slotsOf, answerIndex: answerIndex, placeAnswers: placeAnswers,
    missLine: missLine, findReplay: findReplay, audioAlone: audioAlone, audioNear: audioNear, audioClean: audioClean,
    ROOM_M: ROOM_M, roomBox: roomBox, clusterSamePlace: clusterSamePlace, tutorialTrial: tutorialTrial });

  /* ---- strategy cards (plateau breaker): one change to try, each from the notes ----
     Sources: crowd R3 §1 (most same-sex errors are the other voice's words), §3 (10–15° releases much
     informational masking), §5 (knowing where to listen worth 10–40 points; attention builds while a voice stays
     put); far R3 §10 (room adaptation in ~0.5–3 s; final consonants 88 % → 56–62 % in very echoey halls; direct
     sound −6 dB per doubling of distance against a constant reverberant field); strange R2 §3.3 (degraded–words–
     degraded replay = clear-speech replay > repetition), §1.0 (half the gain within ~3 sentences), §1.11 (accent
     costs open up in noise: ~80 % own accent vs 46–58 % others), §1.3 (adaptation carries to new words with the
     same sound change); repair R3 §6 (context after the gap helped more; noise in gaps ~9 points), §4
     (interrupted-speech practice carried across gap types and lasted ~3 months). */
  var CARDS = [
    { id: 'crowd.lock-on', ex: 'crowd', dial: 'talkers', title: 'Lock on at the call sign',
      text: 'The call sign is your anchor. From the call sign on, stay with that voice: its pitch and its pace. In lab studies attention kept building while the voice to follow stayed the same, and recall fell by about 10 points when it moved.',
      tryIt: 'Next set: listen only for the call sign at first, then follow that one voice and let the others go.' },
    { id: 'crowd.borrowed', ex: 'crowd', dial: 'similar', title: 'Wrong voice, not wrong ears',
      text: 'Many crowd mistakes are borrowed words: a real word from the wrong talker. In a classic study, reported in a review, most errors against one same-sex voice were that voice’s words. When feedback says a word came from another voice, the slip was in which voice you followed.',
      tryIt: 'Next set: after a miss, play your voice alone, then the mix, and listen for the moment the two voices cross.' },
    { id: 'crowd.space', ex: 'crowd', dial: 'space', requires: 'headphones', title: 'Listen toward the red dot',
      text: 'With headphones, where a voice stands is one of the strongest cues. In lab studies, knowing where the voice would be was worth 10 to 40 points over knowing only its call sign, and even 10 to 15 degrees between voices released much of the confusion.',
      tryIt: 'Next set: glance at the red dot before every sound and keep your listening on that side.' },
    { id: 'far.tune-in', ex: 'far', dial: 'rt60', title: 'Let the room tune you in',
      text: 'The first phrase is there so you can hear the room. Listeners adjust to a room within about half a second to three seconds, and speech in it then gets easier to catch, most of all with headphones.',
      tryIt: 'Next set: during the first phrase, notice how long the room rings after each word.' },
    { id: 'far.starts', ex: 'far', dial: 'dist', title: 'Catch the start of each word',
      text: 'Echo smears the ends of words. In two very echoey halls, final consonants were heard right 56 to 62 % of the time, against 88 % without echo. Hold on to each word’s first sound and its vowel, and let the phrase fill in the end.',
      tryIt: 'Next set: when a word ends in a blur, choose by its first sound and its vowel.' },
    { id: 'far.closer', ex: 'far', dial: 'noise', bridge: true, title: 'In real rooms, close the distance',
      text: 'Every halving of the distance gives a voice’s direct sound 6 dB more against the room’s echo. When a conversation matters, step closer or take the seat nearest the talker.',
      tryIt: 'This week: in one echoey place, take two steps toward the talker and notice the change.' },
    { id: 'strange.replay', ex: 'strange', title: 'The replay is the lesson',
      text: 'After each answer the words appear and the same voice plays again. Hearing a hard voice again while knowing its words trained listeners as well as hearing a clear version, and better than plain repetition.',
      tryIt: 'Next set: during each replay, match every word on screen to the sound as it passes.' },
    { id: 'strange.few', ex: 'strange', title: 'Give a new voice three tries',
      text: 'Getting used to a new kind of voice is fast and front-loaded: in one study half of the gain over 30 sentences came within the first three. The first few of a new kind are warm-ups and do not move your level.',
      tryIt: 'Next set: when a new kind of voice appears, stay relaxed through the first three and notice when it clicks.' },
    { id: 'strange.noise', ex: 'strange', dial: 'accent', needs: 'accent', title: 'Accents show up in noise',
      text: 'In quiet most accents are easy; in noise the differences open up. In one study English listeners in noise scored about 80 % with their own accent and 46 to 58 % with others, so accent trials run in babble.',
      tryIt: 'Next set: on accent trials, notice which sounds this voice changes; the same change tends to come back in new words.' },
    { id: 'repair.wait', ex: 'repair', dial: 'context', needs: 'sentences', title: 'Wait for the end of the sentence',
      text: 'The words after a gap can repair it. In one study context helped even more when it came after the unclear word than before it. Hold the whole sentence, then choose.',
      tryIt: 'Next set: do not decide at the gap; run the end of the sentence back in your head first.' },
    { id: 'repair.fill', ex: 'repair', dial: 'fill', title: 'Let the noise do the filling',
      text: 'When noise covers a gap, hearing tends to fill in what should be there; in silence the cut is obvious. Filling the gaps with noise raised scores by about 9 points in one study.',
      tryIt: 'Next set: on noisy gaps, go with the word you seem to hear, even if it feels like a guess.' },
    { id: 'repair.glimpse', ex: 'repair', dial: 'gate', title: 'Listen through the gaps',
      text: 'Chopped-up speech keeps its rhythm and gives glimpses of most words. In one study, practice with one kind of gap (silent or noise-filled) carried over to the other and lasted about three months.',
      tryIt: 'Next set: follow the beat of the sentence through the cuts instead of waiting for whole words.' }
  ];
  function card(id) { for (var i = 0; i < CARDS.length; i++) if (CARDS[i].id === id) return clone(CARDS[i]); return null; }
  function forEx(ex) { return CARDS.filter(function (c) { return c.ex === ex && playable(c); }).map(clone); }
  /** Whether this build can play what a card talks about (accented voices; Repair sentences with context). */
  function playable(c) {
    var M = ES.ex[c.ex];
    if (c.needs === 'accent') return !(M && typeof M.families === 'function') || M.families().indexOf('accent') >= 0;
    if (c.needs === 'sentences') return !(M && typeof M.hasSentences === 'function') || M.hasSentences();
    return true;
  }
  /** The card to show at a plateau: one for the stalled dial if there is one, else the first not yet seen. */
  function pick(ex, opts) {
    opts = opts || {};
    var seen = opts.seen || [];
    var ok = CARDS.filter(function (c) { return c.ex === ex && (!c.requires || (c.requires === 'headphones' && opts.headphones)) && playable(c); });
    var fresh = ok.filter(function (c) { return seen.indexOf(c.id) < 0; });
    var pool = fresh.length ? fresh : ok;
    var hit = opts.dial ? pool.filter(function (c) { return c.dial === opts.dial; })[0] : null;
    return clone(hit || pool[0] || null);
  }
  hide('strategies', { cards: CARDS, card: card, forEx: forEx, pick: pick });
})(typeof window !== 'undefined' ? window : globalThis);
