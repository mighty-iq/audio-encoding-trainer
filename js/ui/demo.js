/* ES.ui.demo — stub trials made of tones, so the shell's flow can be walked and tested before the audio
   engine and generators land (the Play screen switches to real trials as soon as they are present).
   Two "voices" beep at once; the player counts the red one's beeps. A tiny staircase on the level of the
   blue voice stands in for the engine. It trains nothing and is labelled as a demo on screen. */
(function (ES) {
  'use strict';
  var U = ES.core.util;
  var SR = 22050, MIN_TMR = -12, MAX_TMR = 9;

  var ex = {
    id: 'demo', name: 'Tone demo', short: 'Two voices beep at once. Count the beeps of the red one.',
    bet: 'Flow check only: this demo trains nothing. Real exercises replace it when they are installed.',
    view: 'keyword', feedback: 'standard', venues: [],
    tutorial: { steps: [
      { kind: 'caption', text: 'Two voices beep at the same time. The red voice is the one to follow.', minMs: 3000, then: 'tap' },
      { kind: 'demo', text: 'Watch an example: listen, then see the right answer marked.', force: { dials: { tmr: 6 } } },
      { kind: 'practice', text: 'Your turn. Count the red beeps, then tap the number.', force: { dials: { tmr: 9 } } },
      { kind: 'practice', text: 'One more. The blue voice is louder now.', force: { dials: { tmr: 3 } } }
    ] },
    tips: ['The red dot in the picture is the voice to follow; blue dots are the others.',
      'The two voices have different pitches. Lock on to the red one’s pitch from its first beep.',
      'After an answer you can hear the red voice alone, then the mix again.']
  };

  /** make(rng, {dials:{tmr}, twoSlots, anchor, warmup}) → a TrialSpec-shaped demo trial. */
  function make(rng, opts) {
    opts = opts || {};
    var tmr = opts.dials && typeof opts.dials.tmr === 'number' ? opts.dials.tmr : typeof opts.tmr === 'number' ? opts.tmr : 6;
    tmr = U.clamp(tmr, MIN_TMR, MAX_TMR);
    var count = rng.int(1, 4), mcount = rng.int(1, 4);
    if (mcount === count) mcount = count % 4 + 1;
    var high = rng.chance(0.5);
    var ft = high ? rng.pick([740, 830, 880]) : rng.pick([392, 415, 440]);
    var fm = high ? rng.pick([370, 392, 415]) : rng.pick([784, 830, 932]);
    var beep = 0.11, gapT = 0.15 + rng.float(0, 0.05), gapM = 0.13 + rng.float(0, 0.07);
    var t0 = 0.25 + rng.float(0, 0.2), m0 = 0.18 + rng.float(0, 0.3), tOn = [], mOn = [], i;
    for (i = 0; i < count; i++) tOn.push(U.round(t0 + i * (beep + gapT), 4));
    for (i = 0; i < mcount; i++) mOn.push(U.round(m0 + i * (beep + gapM), 4));
    var dur = U.round(Math.max(tOn[tOn.length - 1], mOn[mOn.length - 1]) + beep + 0.3, 3);
    var azT = rng.pick([-40, -20, 20, 40]), azM = azT > 0 ? -rng.int(35, 75) : rng.int(35, 75);
    var foils = {};
    foils[String(mcount)] = 'masker';
    var slots = [{ label: 'Red beeps', options: ['1', '2', '3', '4'], answer: String(count), foils: foils }];
    if (opts.twoSlots) {
      slots.push({ label: 'Who beeped first?', options: ['Red', 'Blue'], answer: tOn[0] <= mOn[0] ? 'Red' : 'Blue', foils: {} });
    }
    return {
      id: 'demo:' + rng.seed, ex: 'demo', seed: rng.seed,
      setting: { dials: { tmr: tmr }, focus: 'tmr', anchor: !!opts.anchor, warmup: !!opts.warmup },
      audio: { demo: { ft: ft, fm: fm, tOn: tOn, mOn: mOn, beep: beep, dur: dur, tmr: tmr, azT: azT, azM: azM } },
      question: { prompt: 'Follow the red voice. How many times did it beep?', slots: slots },
      feedback: {
        text: 'Red beeped ' + U.plural(count, 'time') + '; blue beeped ' + U.plural(mcount, 'time') + '.',
        replays: [{ label: 'Red alone', audio: { only: 'target' } }, { label: 'Again', audio: { only: null } }]
      },
      picture: { voices: [{ id: 'red', role: 'target', az: azT, dist: 1.6, label: 'Red' }, { id: 'blue', role: 'masker', az: azM, dist: 2.4, label: 'Blue' }] },
      meta: { demo: true, probe: false, items: [String(count)], voices: ['red', 'blue'] }
    };
  }

  /** Render the demo stimulus. only: 'target' | 'masker' | null (both). Pure: Float32Array out. */
  function synth(trial, only, sr) {
    sr = sr || SR;
    var a = trial.audio.demo, n = Math.ceil(a.dur * sr), L = new Float32Array(n), R = new Float32Array(n);
    var ampT = 0.14, ampM = 0.14 * Math.pow(10, -a.tmr / 20), ramp = Math.round(0.01 * sr), len = Math.round(a.beep * sr);
    function beeps(onsets, f, amp, az) {
      var th = (U.clamp(az, -90, 90) + 90) / 180 * Math.PI / 2, gl = Math.cos(th), gr = Math.sin(th), w = 2 * Math.PI * f / sr;
      onsets.forEach(function (on) {
        var i0 = Math.round(on * sr);
        for (var k = 0; k < len && i0 + k < n; k++) {
          var env = k < ramp ? 0.5 - 0.5 * Math.cos(Math.PI * k / ramp) : k > len - ramp ? 0.5 - 0.5 * Math.cos(Math.PI * (len - k) / ramp) : 1;
          var s = amp * env * Math.sin(w * k);
          L[i0 + k] += s * gl;
          R[i0 + k] += s * gr;
        }
      });
    }
    if (only !== 'masker') beeps(a.tOn, a.ft, ampT, a.azT);
    if (only !== 'target') beeps(a.mOn, a.fm, ampM, a.azM);
    var pk = 0, i;
    for (i = 0; i < n; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
    if (pk > 0.89) { var g = 0.89 / pk; for (i = 0; i < n; i++) { L[i] *= g; R[i] *= g; } }
    return { L: L, R: R, sr: sr, duration: n / sr };
  }

  /** Same shape as ES.engine.score: { slots:[{picked, answer, correct, foil}], correct, prop, intrusions }. */
  function score(trial, resp) {
    var picks = (resp && resp.picks) || [];
    var slots = trial.question.slots.map(function (s, i) {
      var p = picks[i] == null ? null : String(picks[i]), ok = p !== null && p === String(s.answer);
      return { picked: p, answer: String(s.answer), correct: ok, foil: ok || p === null ? null : (s.foils && s.foils[p]) || 'random' };
    });
    var nOk = slots.filter(function (s) { return s.correct; }).length;
    return { slots: slots, correct: nOk === slots.length, prop: slots.length ? nOk / slots.length : 0,
      intrusions: slots.filter(function (s) { return s.foil === 'masker'; }).length };
  }
  /** The demo's stand-in staircase: 2 dB harder after a right answer, 4 dB easier after a wrong one. */
  function nextTmr(tmr, correct) { return correct ? Math.max(MIN_TMR, tmr - 2) : Math.min(MAX_TMR, tmr + 4); }
  function levelText(tmr) {
    return tmr >= 0 ? 'Blue ' + U.fmtNum(tmr) + ' dB quieter' : 'Blue ' + U.fmtNum(-tmr) + ' dB louder';
  }
  /** The demo session: two short sets. */
  function plan() { return { sets: [{ exId: 'demo', trials: 6 }, { exId: 'demo', trials: 6 }] }; }

  ES.ui.demo = { ex: ex, make: make, synth: synth, score: score, nextTmr: nextTmr, levelText: levelText, plan: plan,
    SR: SR, MIN_TMR: MIN_TMR, MAX_TMR: MAX_TMR,
    render: function (trial, only) { return Promise.resolve(synth(trial, only)); } };
})(window.ES);
