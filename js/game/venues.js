/* ES.game.venues — the Night out map's logic (pure; loads in Node with the engine).
   earshot(venue): the level of the venue's headline dial at which the engine's model predicts 72 % right with the
   venue's other dials pinned (crowd: voice-vs-others in dB; far: distance in metres; phone: line quality), read on
   its careful side (the 90 % bound of its own uncertainty, see condEarshot) and never beyond the hardest level
   of that dial the player has actually heard (fix round 2: RV-play P2, FRESH-B C3). Shown only once that dial has data from the player's own
   trials (n ≥ MIN_N) and has been tested; a fresh profile shows nothing invented.
   Openings: a venue opens when the venue before it on its line reaches `opens.at` and the venue itself is within
   reach (its own earshot exists); an opening is stored and never undone (a break or a bad day closes nothing). plan(id): a set at the venue, adaptive on its headline dial with
   the other dials pinned (the shell's start(opts) passes plan.pin and plan.focus to the engine's flow.start). */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  ES.game = ES.game || {};
  var MIN_N = 3;

  function D() { return ES.game.data; }
  function K() { return ES.game.core; }
  function E() { return ES.engine || {}; }
  function venueOf(v) { return typeof v === 'string' ? D().venue(v) : v; }

  /** Pins that are active in the player's context (space only with headphones), snapped to the dial's range. */
  function pinsFor(cond, ck) {
    var L = K().learner(), out = {}, d0 = K().dialDef(cond.ex, cond.dial);
    var act = L && L.active ? L.active(cond.ex, { ctxKey: ck, family: d0 && d0.family ? d0.family : null }) : [];
    act.forEach(function (d) {
      var v = cond.pin && cond.pin[d.id];
      if (v === undefined || d.id === cond.dial) return;
      out[d.id] = d.kind === 'ord' ? Math.max(d.min, Math.min(d.max, Math.round(v))) : Math.max(d.min, Math.min(d.max, v));
    });
    return out;
  }
  function pAt(cond, ck, pins, x, shift) {
    var d = K().dialDef(cond.ex, cond.dial), dials = {};
    Object.keys(pins).forEach(function (k) { dials[k] = pins[k]; });
    dials[cond.dial] = x;
    return K().predict(cond.ex, dials, { ctxKey: ck, family: d.family || undefined, shift: shift });
  }
  // The level where the model predicts the target, on a "harder is up" axis u = dir·x that runs a whole scale beyond
  // both ends (the model is defined there): −Infinity when even far below the easiest level misses, +Infinity above.
  function solveU(cond, ck, pins, d, shift) {
    var target = K().model().target, uE = d.dir * (d.dir > 0 ? d.min : d.max), uH = d.dir * (d.dir > 0 ? d.max : d.min);
    var ext = uH - uE, lo = uE - ext, hi = uH + ext, f = function (u) { return pAt(cond, ck, pins, d.dir * u, shift); };
    var pl = f(lo);
    if (pl === null) return null;
    if (pl < target) return -Infinity;
    if (f(hi) >= target) return Infinity;
    for (var it = 0; it < 36; it++) { var mid = (lo + hi) / 2; if (f(mid) >= target) lo = mid; else hi = mid; }
    return lo;
  }

  /** Earshot for a condition {ex, pin, dial}: {status:'none'|'below'|'in'|'beyond', x, text, n, s, u0}. The careful
      side: the solved level moved toward easy by Z (core.Z, the one-sided 90 % bound) times its own SD, combined over
      the dials in play (each dial's estimate moved one SD toward easy, one at a time; the shifts add in quadrature,
      the delta method), so the uncertainty of several dials is counted once, not stacked. */
  function condEarshot(cond, opts) {
    opts = opts || {};
    var d = K().dialDef(cond.ex, cond.dial), L = K().learner();
    if (!d || !L) return { status: 'none', x: null, text: '–', n: 0 };
    var ck = opts.ctxKey || K().ctxKey(cond.ex), e = K().est(cond.ex, d, ck);
    var out = { status: 'none', x: null, text: '–', n: e.n, s: e.s, ex: cond.ex, dial: cond.dial, ctxKey: ck };
    var tested = K().testedMax(cond.ex, cond.dial);
    if (e.n < (opts.minN === undefined ? MIN_N : opts.minN) || tested === null) return out;
    var pins = pinsFor(cond, ck), easy = d.dir > 0 ? d.min : d.max, hard = d.dir > 0 ? d.max : d.min;
    var u0 = solveU(cond, ck, pins, d, null);
    if (u0 === null) return out;
    var uc = u0;
    if (isFinite(u0)) {
      var act = L.active(cond.ex, { ctxKey: ck, family: d.family || null }), v2 = 0;
      act.forEach(function (a) {
        if (a.id !== d.id && pins[a.id] === undefined) return;          // a dial at its comfort level moves with its estimate
        var sh = {}; sh[a.id] = 1;
        var u = solveU(cond, ck, pins, d, sh), du = u === null ? 0 : u0 - u;
        v2 += isFinite(du) ? du * du : Infinity;
      });
      uc = u0 - K().Z * Math.sqrt(v2);
    }
    out.u0 = u0;
    if (!(uc >= d.dir * easy - 1e-9)) { out.status = 'below'; out.x = easy; out.text = outOfReach(cond.ex, d, easy); return out; }
    if (uc >= d.dir * hard) { out.status = 'beyond'; out.x = hard; out.text = topOfScale(cond.ex, d, hard); return cap(out, cond, d, tested); }
    var x = d.dir * uc;
    if (d.kind !== 'ord') x = d.dir * Math.floor(uc * 2 + 1e-9) / 2;  // half-dB display steps, never past the careful edge
    out.status = 'in';
    out.x = Math.round(x * 100) / 100;
    out.text = K().levelText(cond.ex, d, out.x);
    return cap(out, cond, d, tested);
  }
  // Never claim beyond the hardest level heard: the earshot stops there ("so far").
  function cap(out, cond, d, tested) {
    if (d.dir * (out.x - tested) <= 1e-9) return out;
    out.status = 'in'; out.x = tested; out.capped = true;
    out.text = K().levelText(cond.ex, d, tested);
    return out;
  }
  // Plain words for the ends of a scale (RV-play P10): "not yet" when even the easiest level is beyond reach.
  function outOfReach() { return 'not yet'; }
  function topOfScale(ex, d, hard) {
    var t = K().levelText(ex, d, hard);
    if (d.unit === 'm') return t + '+';
    return d.kind === 'cont' ? (d.dir < 0 ? '≤ ' : '≥ ') + t : t + ' (top)';
  }
  function earshot(v, opts) { v = venueOf(v); return v ? condEarshot(v.head, opts) : null; }

  /** Does earshot e (of venue v's head dial) reach the threshold `at`? */
  function reaches(v, e, at) {
    var d = K().dialDef(v.head.ex, v.head.dial);
    if (!d || !e || e.status === 'none' || e.status === 'below' || e.x === null) return false;
    if (e.status === 'beyond') return true;
    return d.dir * (e.x - at) >= -1e-9;
  }
  function venueName(v) { v = venueOf(v); return v ? v.name.toLowerCase() : ''; }
  function atText(v, at) { var vv = venueOf(v); return K().levelText(vv.head.ex, vv.head.dial, at); }
  function inReach(e) { return !!e && (e.status === 'in' || e.status === 'beyond'); }
  /** "Opens when your earshot at the café reaches 0 dB or better and the restaurant itself is within reach." */
  function ruleText(v) {
    v = venueOf(v);
    if (!v || !v.opens) return 'Open from the start.';
    var from = D().venue(v.opens.from);
    return 'Opens when your earshot at the ' + venueName(from) + ' reaches ' + atText(from, v.opens.at) + ' or better and the ' +
      venueName(v) + ' itself is within reach.';
  }

  /** All venues with their state: {id, name, line, step, open, openedAt, earshot, best, next, rule}. */
  function state(opts) {
    opts = opts || {};
    var rec = opts.rec || K().rec(), stored = rec.venues || {}, out = [], byId = {};
    D().VENUES.forEach(function (v) {
      var e = earshot(v, opts), sv = stored[v.id] || {};
      var s = { id: v.id, name: v.name, line: v.line, step: v.step, venue: v, earshot: e, openedAt: sv.open || 0, best: sv.best, bestAt: sv.bestAt || 0,
        open: !v.opens || !!sv.open, newly: false, next: false, rule: ruleText(v) };
      out.push(s); byId[v.id] = s;
    });
    // walk each line in order so a chain can open in one pass (an imported profile may open several at once)
    out.forEach(function (s) {
      var v = s.venue;
      if (s.open || !v.opens) return;
      var from = byId[v.opens.from];
      if (from && from.open && reaches(from.venue, from.earshot, v.opens.at) && inReach(s.earshot)) { s.open = true; s.newly = true; }
    });
    out.forEach(function (s) {
      var v = s.venue;
      if (!s.open && v.opens && byId[v.opens.from] && byId[v.opens.from].open) {
        s.next = true;
        s.from = byId[v.opens.from];
        s.at = v.opens.at;
        s.atText = atText(s.from.venue, v.opens.at);
      }
    });
    return out;
  }
  function newlyOpen(opts) { return state(opts).filter(function (s) { return s.newly; }); }

  /** The home teaser: the next venue to open (Many voices first, the owner's top priority), as {name, text}. */
  function next(opts) {
    var st = state(opts), cand = st.filter(function (s) { return s.next; });
    var measured = st.some(function (s) { return s.earshot && s.earshot.status !== 'none'; });
    if (!measured) return { id: 'cafe', name: 'Café, lecture hall and phone line', text: 'Three venues are open from the start. Your earshot at each one appears after your first sets there.' };
    if (!cand.length) return { id: null, name: 'Every venue is open', text: 'Twelve venues, all within your earshot. Keep pushing the numbers: each one is where you get about 7 in 10 right.' };
    var order = { crowd: 0, far: 1, phone: 2 };
    cand.sort(function (a, b) { return order[a.line] - order[b.line] || a.step - b.step; });
    var c = cand[0], fe = c.from.earshot, now = fe && fe.status === 'below' ? ' (not within reach yet)' : fe && fe.status !== 'none' ? ' (now ' + fe.text + ')' : '';
    return { id: c.id, name: c.name, text: 'Opens when your earshot at the ' + venueName(c.from.venue) + ' reaches ' + c.atText + ' or better' + now + '.' };
  }

  // ---- words for a condition, generated from the dial definitions so every number matches the code
  function lvl(ex, id, i) { var d = K().dialDef(ex, id); return d && d.levels ? d.levels[Math.max(d.min, Math.min(d.max, Math.round(i)))] : ''; }
  function speechVsNoise(db) {
    if (db > 0) return 'speech ' + K().num(db, 1) + ' dB above the noise';
    if (db < 0) return 'noise ' + K().num(-db, 1) + ' dB above the speech';
    return 'speech as loud as the noise';
  }
  function describe(cond, opts) {
    opts = opts || {};
    var p = cond.pin || {}, ex = cond.ex, hp = opts.headphones !== undefined ? opts.headphones : K().headphones(), parts = [];
    if (ex === 'crowd') {
      parts.push(lvl(ex, 'talkers', p.talkers || 0));
      var sim = lvl(ex, 'similar', p.similar || 0);
      parts.push(sim === 'near-twin voice' ? 'near-twin voices' : sim === 'other sex' ? 'of the other sex' : sim);
      if (hp && p.space !== undefined) parts.push(lvl(ex, 'space', p.space) === 'same place' ? 'all in the same place' : lvl(ex, 'space', p.space) + ' apart');
    } else if (ex === 'far') {
      parts.push(lvl(ex, 'rt60', p.rt60 || 0) + ' of echo');
      parts.push(speechVsNoise(p.noise || 0));
    } else if (ex === 'strange') {
      var d = K().dialDef(ex, cond.dial);
      parts.push(d && d.levels ? d.levels[d.min] + ' → ' + d.levels[d.max] : cond.dial);
    } else {
      Object.keys(p).forEach(function (k) { var t = lvl(ex, k, p[k]); if (t) parts.push(t); });
    }
    return parts.filter(Boolean).join(' · ');
  }
  /** What the earshot number means, in words. */
  function meaning(cond, e) {
    if (!e || e.status === 'none') return 'Not measured yet: play a set here and your number appears.';
    if (e.status === 'below') return 'Not within reach yet: even the easiest level here is still too hard. Your sessions start easier and build toward it.';
    var d = K().dialDef(cond.ex, cond.dial), x = e.x, so = e.capped ? ' That is the hardest you have heard so far; it can grow as harder trials come.' : '';
    if (e.status === 'beyond') return 'Even the hardest level here (' + K().levelText(cond.ex, d, x) + ') goes right more than 7 times in 10.';
    if (cond.ex === 'crowd' && cond.dial === 'tmr') {
      return (x < 0 ? 'You follow the voice when each other voice is up to ' + K().num(-Math.round(x * 2) / 2, 1) + ' dB louder than it, about 7 times in 10.'
        : x > 0 ? 'You follow the voice when it is ' + K().num(Math.round(x * 2) / 2, 1) + ' dB louder than each other voice, about 7 times in 10.'
          : 'You follow the voice when it is as loud as each other voice, about 7 times in 10.') + so;
    }
    if (cond.ex === 'far' && cond.dial === 'dist') return 'You catch the words from up to ' + K().levelText('far', d, x) + ' away here, about 7 times in 10.' + so;
    return 'You get about 7 in 10 right with ' + plainLevel(cond.ex, cond.dial, x) + '.' + so;
  }
  /** A level in plain words, for cards and stops ("a robot voice with 6 bands", "the others 3 dB louder"). */
  function plainLevel(ex, dial, x) {
    var d = K().dialDef(ex, dial);
    if (!d || typeof x !== 'number') return '';
    var t = K().levelText(ex, d, x), i = d.kind === 'ord' ? Math.max(d.min, Math.min(d.max, Math.floor(x + 1e-9))) : null, v = i !== null && d.values ? d.values[i] : x;
    var key = ex + '.' + dial;
    if (key === 'crowd.tmr') return x < 0 ? 'the others ' + K().num(-x, 1) + ' dB louder' : x > 0 ? 'the voice you follow ' + K().num(x, 1) + ' dB louder' : 'all voices equally loud';
    if (key === 'far.dist') return 'the voice ' + t + ' away';
    if (key === 'far.rt60') return t + ' of echo';
    if (key === 'far.noise' || key === 'echo.snr' || key === 'voices.snr') return speechVsNoise(x);
    if (key === 'strange.accent' || key === 'strange.whisper') {
      var snr = key === 'strange.accent' ? v && v.snr : v, who = key === 'strange.accent' ? K().phrase(t) : 'a whisper';
      return who + (snr === null || snr === undefined ? ' in quiet' : ', speech ' + (snr > 0 ? K().num(snr, 1) + ' dB above' : snr < 0 ? K().num(-snr, 1) + ' dB below' : 'as loud as') + ' the babble');
    }
    if (key === 'strange.fast') return 'speech at ' + t + ' speed';
    if (key === 'strange.phone') return K().phrase(t);
    if (key === 'strange.muffled') return 'speech muffled to ' + t;
    if (key === 'strange.vocoded') return 'a robot voice with ' + t;
    if (key === 'repair.gap') return t + ' of a word lost';
    if (key === 'repair.gate') return t.replace(' kept', '') + ' of the sentence kept';
    if (key === 'repair.fill') return t + ' in the gaps';
    if (key === 'echo.rate') return t === 'normal' ? 'normal speed' : t + ' speed';
    if (key === 'echo.delay') return t + ' before the questions';
    if (key === 'seek.snr') return 'a voice at ' + t + ' up close';
    if (key === 'seek.size') return 'a ' + t + ' target';
    if (key === 'seek.gap') return 'a call every ' + t;
    if (key === 'voices.cast') return t + ' to choose from';
    return t;
  }

  // ---- venue sets
  function supports() {
    var s = ES.ui && ES.ui.session, sup = s && s.supports || {};
    return { start: !!(sup.plan || sup.sets), make: !!sup.make, pin: !!(E().controller && E().controller.supports && E().controller.supports.pin) };
  }
  /** A session plan for one set at the venue (headline condition), or null when the venue is unknown. */
  function plan(id, opts) {
    opts = opts || {};
    var v = venueOf(id);
    if (!v) return null;
    var cond = opts.cond || v.head, meta = (E().dialMeta || {})[cond.ex] || {}, ck = K().ctxKey(cond.ex);
    var d = K().dialDef(cond.ex, cond.dial);
    var set = { exId: cond.ex, trials: meta.setTrials || 20, kind: 'venue', venue: v.id, pin: pinsFor(cond, ck), focus: cond.dial,
      family: d && d.family ? d.family : null, title: v.name + ' · ' + (opts.cond && cond.label ? cond.label : exName(cond.ex)), interlude: null };
    return { kind: 'venue', title: set.title, sets: [set], done: { name: 'venue', params: { id: v.id, after: true } } };
  }
  function exName(ex) {
    var X = ES.ex && ES.ex[ex];
    return (X && X.name) || { crowd: 'Crowd', far: 'Far', strange: 'Strange voices', repair: 'Repair', echo: 'Echo', seek: 'Seek', voices: 'Voices' }[ex] || ex;
  }
  /** Can this build make the condition? Strange's accent family needs accented training voices (RV-claims C12:
      without them the generator plays another family, so the row and the weekly stop would promise accents). */
  function condAvailable(cond) {
    if (!cond || cond.ex !== 'strange' || cond.dial !== 'accent') return true;
    var I = E().items || {}, A = I.adapt, X = I.data;
    try {
      if (!A || !X || typeof A.isNative !== 'function') return false;
      var idx = X.idx();
      return idx.voices.some(function (v) { return !A.isNative(X.voice(v)); });
    } catch (e) { return false; }
  }
  /** Venues whose head or "also here" conditions use exercise ex (conditions this build can make). */
  function forExercise(ex) {
    return D().VENUES.filter(function (v) { return [v.head].concat(v.also).some(function (c) { return c.ex === ex && condAvailable(c); }); });
  }

  ES.game.venues = { MIN_N: MIN_N, list: function () { return D().VENUES.slice(); }, get: venueOf, earshot: earshot, condEarshot: condEarshot,
    reaches: reaches, inReach: inReach, venueName: venueName, atText: atText, plainLevel: plainLevel, state: state, newlyOpen: newlyOpen, next: next, ruleText: ruleText, describe: describe, meaning: meaning,
    pinsFor: pinsFor, plan: plan, supports: supports, forExercise: forExercise, condAvailable: condAvailable, exName: exName, speechVsNoise: speechVsNoise };
})(typeof window !== 'undefined' ? window : globalThis);
