/* Earshot engine — dials per exercise (CONTRACTS §5). Ordinal dials are ladders ordered easy → hard, so their
   model unit is the level index (0 … L−1) and dir = +1; continuous dials are in real units (dB).
   slope = logistic slope of the dial's component in logits per unit (index step or dB). Priors from R4:
   digits in steady noise ~13 %/dB, steady-noise sentences ~8–13 %/dB, one or two competing talkers ~4 %/dB
   (MacPherson & Akeroyd 2014), converted with slope ≈ 4 × (%/dB) / 100. Ordinal ladders are spaced so that
   each step costs roughly the same intelligibility (R2 §3.8, R3 §1–3, §10). prior = threshold prior {m, s};
   drift = per-trial SD of the random walk that lets the posterior follow learning; start = comfort = an easy, fixed
   level for first trials and tutorials (null for Strange family dials: a family is set only when chosen);
   margin = how far below a player's own edge the non-focus dials sit, in dial units (shown in help texts). */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  ES.engine = ES.engine || {};

  function ord(id, label, unit, values, labels, o) {
    var d = { id: id, label: label, unit: unit, kind: 'ord', min: 0, max: values.length - 1, step: 1, dir: 1,
      start: o.family ? null : (o.start || 0), slope: o.slope, comfort: o.family ? null : (o.start || 0), margin: 0, levels: labels, values: values,
      prior: o.prior, drift: o.drift || 0.035 };
    if (o.requires) d.requires = o.requires;
    if (o.family) d.family = o.family;
    return d;
  }
  function cont(id, label, unit, min, max, step, dir, o) {
    return { id: id, label: label, unit: unit, kind: 'cont', min: min, max: max, step: step, dir: dir,
      start: o.start, slope: o.slope, comfort: o.start, margin: 0, prior: o.prior, drift: o.drift || 0.08 };
  }
  function pct(v) { return Math.round(v * 100) + ' %'; }

  var D = {};
  D.crowd = [
    cont('tmr', 'Your voice vs the others', 'dB', -15, 12, 0.5, -1, { start: 8, slope: 0.18, prior: { m: -3, s: 5 } }),
    ord('talkers', 'Other voices', 'voices', [1, 2, 3], ['1 other voice', '2 other voices', '3 other voices'],
      { slope: 0.7, prior: { m: 2, s: 1 } }),
    ord('similar', 'Voice similarity', '', [0, 1, 2, 3], ['other sex', 'same sex', 'same sex, similar pitch', 'near-twin voice'],
      { slope: 0.6, prior: { m: 2, s: 1 } }),
    ord('space', 'Spatial separation', '°', [90, 45, 30, 20, 15, 10, 5, 0], ['90°', '45°', '30°', '20°', '15°', '10°', '5°', 'same place'],
      { slope: 0.22, prior: { m: 4, s: 2 }, requires: 'headphones' })
  ];
  D.far = [
    // ≤ 0.8 × room length (CONTRACTS §12 R1: small 5 m, medium 10 m, large 22 m, hall 38 m long), so 30 m is the top
    ord('dist', 'Distance', 'm', [1, 1.5, 2, 3, 4, 6, 8, 11, 16, 22, 30],
      ['1 m', '1.5 m', '2 m', '3 m', '4 m', '6 m', '8 m', '11 m', '16 m', '22 m', '30 m'], { start: 1, slope: 0.35, prior: { m: 5, s: 2.5 } }),
    ord('rt60', 'Echo (reverberation time)', 's', [0.3, 0.45, 0.6, 0.8, 1.0, 1.3, 1.7, 2.2, 3.0],
      ['0.3 s', '0.45 s', '0.6 s', '0.8 s', '1.0 s', '1.3 s', '1.7 s', '2.2 s', '3.0 s'], { start: 1, slope: 0.35, prior: { m: 4, s: 2.5 } }),
    cont('noise', 'Room noise (speech vs noise)', 'dB', -6, 30, 1, -1, { start: 24, slope: 0.22, prior: { m: 6, s: 6 }, drift: 0.1 })
  ];
  D.strange = [
    ord('accent', 'Accent in babble', '', [{ tier: 1, snr: null }, { tier: 1, snr: 10 }, { tier: 2, snr: 10 }, { tier: 2, snr: 6 },
      { tier: 3, snr: 6 }, { tier: 3, snr: 3 }, { tier: 3, snr: 0 }, { tier: 3, snr: -3 }],
      ['mild accent, quiet', 'mild accent, +10 dB', 'moderate accent, +10 dB', 'moderate accent, +6 dB',
        'strong accent, +6 dB', 'strong accent, +3 dB', 'strong accent, 0 dB', 'strong accent, −3 dB'],
      { slope: 0.45, prior: { m: 4, s: 2 }, family: 'accent' }),
    ord('fast', 'Fast speech', '×', [1.3, 1.5, 1.7, 1.9, 2.1, 2.3, 2.6, 3.0],
      ['1.3×', '1.5×', '1.7×', '1.9×', '2.1×', '2.3×', '2.6×', '3×'], { slope: 0.45, prior: { m: 4, s: 2 }, family: 'fast' }),
    ord('whisper', 'Whisper', 'dB', [null, 15, 10, 6, 3, 0],
      ['whisper, quiet', 'whisper, +15 dB', 'whisper, +10 dB', 'whisper, +6 dB', 'whisper, +3 dB', 'whisper, 0 dB'],
      { slope: 0.45, prior: { m: 2.5, s: 1.8 }, family: 'whisper' }),
    ord('phone', 'Phone line', '', [{ lo: 300, hi: 3400, snr: null }, { lo: 300, hi: 3400, snr: 15 }, { lo: 400, hi: 3000, snr: 12 },
      { lo: 500, hi: 2800, snr: 9 }, { lo: 600, hi: 2500, snr: 6 }, { lo: 700, hi: 2200, snr: 3 }],
      ['clear line', 'light hiss', 'thin line', 'thinner line', 'crackly line', 'bad line'],
      { slope: 0.45, prior: { m: 3, s: 1.8 }, family: 'phone' }),
    ord('muffled', 'Muffled (through a wall)', 'Hz', [3000, 2200, 1600, 1200, 900, 700, 550],
      ['3 kHz', '2.2 kHz', '1.6 kHz', '1.2 kHz', '900 Hz', '700 Hz', '550 Hz'], { slope: 0.45, prior: { m: 3.5, s: 2 }, family: 'muffled' }),
    ord('vocoded', 'Robot voice (vocoded)', 'bands', [16, 12, 10, 8, 6, 5, 4],
      ['16 bands', '12 bands', '10 bands', '8 bands', '6 bands', '5 bands', '4 bands'], { slope: 0.5, prior: { m: 4, s: 2 }, family: 'vocoded' })
  ];
  D.repair = [
    ord('gap', 'Word lost', '%', [0.3, 0.45, 0.6, 0.75, 0.9, 1.0], [0.3, 0.45, 0.6, 0.75, 0.9, 1.0].map(pct),
      { slope: 0.5, prior: { m: 3.2, s: 1.5 } }),
    ord('context', 'Context', '', ['hi', 'mid', 'lo'], ['strong context', 'some context', 'little context'],
      { slope: 0.7, prior: { m: 2, s: 1 } }),
    ord('gate', 'Broken-up sentence', '', [{ rate: 0, duty: 1 }, { rate: 4, duty: 0.75 }, { rate: 3, duty: 0.65 }, { rate: 2, duty: 0.55 },
      { rate: 1.5, duty: 0.5 }], ['whole sentence', '75 % kept', '65 % kept', '55 % kept', '50 % kept'],
      { slope: 0.4, prior: { m: 2.5, s: 1.2 } }),
    ord('fill', 'What fills the gaps', '', [{ fill: 'noise', db: 6 }, { fill: 'noise', db: 0 }, { fill: 'noise', db: -6 }, { fill: 'silence' }],
      ['loud noise', 'noise', 'soft noise', 'silence'], { slope: 0.25, prior: { m: 2.5, s: 1.2 } })
  ];
  D.echo = [
    cont('snr', 'Speech vs noise', 'dB', -8, 20, 0.5, -1, { start: 15, slope: 0.3, prior: { m: 2, s: 5 } }),
    ord('details', 'Details in the message', '', [2, 3, 4, 5], ['2 details', '3 details', '4 details', '5 details'],
      { slope: 0.5, prior: { m: 1.8, s: 1.2 } }),
    ord('rate', 'Speech rate', '×', [1.0, 1.15, 1.3, 1.45, 1.6], ['normal', '1.15×', '1.3×', '1.45×', '1.6×'],
      { slope: 0.35, prior: { m: 2, s: 1.5 } }),
    ord('delay', 'Wait before questions', 's', [1, 3, 6, 10], ['1 s', '3 s', '6 s', '10 s'], { slope: 0.25, prior: { m: 2, s: 1.5 } })
  ];
  D.seek = [
    cont('snr', 'Voice vs noise (up close)', 'dB', -12, 15, 0.5, -1, { start: 12, slope: 0.22, prior: { m: 0, s: 5 } }),
    ord('decoys', 'Decoy voices', 'voices', [0, 1, 2, 3, 4], ['none', '1 decoy', '2 decoys', '3 decoys', '4 decoys'],
      { slope: 0.4, prior: { m: 2, s: 1.5 } }),
    ord('size', 'Target size', '', [0.22, 0.17, 0.13, 0.1, 0.08], ['large', 'medium', 'small', 'smaller', 'tiny'],
      { slope: 0.3, prior: { m: 2, s: 1.5 } }),
    ord('gap', 'Pause between calls', 's', [1, 1.5, 2.2, 3, 4], ['1 s', '1.5 s', '2.2 s', '3 s', '4 s'],
      { slope: 0.25, prior: { m: 2, s: 1.5 } })
  ];
  D.voices = [
    ord('cast', 'Voices to choose from', 'voices', [2, 3, 4, 5, 6], ['2 voices', '3 voices', '4 voices', '5 voices', '6 voices'],
      { slope: 0.35, prior: { m: 2.5, s: 1.5 } }),
    ord('similar', 'Voice similarity', '', [0, 1, 2], ['mixed', 'same sex', 'same sex, similar pitch'], { slope: 0.6, prior: { m: 1.2, s: 1 } }),
    cont('snr', 'Speech vs noise', 'dB', -6, 30, 1, -1, { start: 30, slope: 0.2, prior: { m: 6, s: 6 }, drift: 0.1 }),
    ord('length', 'Clip length', '', ['sentence', 'phrase', 'word'], ['a sentence', 'a few words', 'one word'],
      { slope: 0.45, prior: { m: 1, s: 1 } })
  ];
  D.missions = [];

  // Exercise-level model constants. gamma = guess rate per slot (1 / options); fc = component level at which
  // non-focus dials sit ("comfort"); primary = the dB dial that absorbs item difficulty offsets.
  var META = {
    crowd: { gamma: 0.25, slots: 2, primary: 'tmr', hpContext: true, setTrials: 24, secPerTrial: 7 },
    far: { gamma: 0.25, slots: 2, primary: 'noise', setTrials: 20, secPerTrial: 9 },
    strange: { gamma: 0.25, slots: 2, primary: null, families: true, setTrials: 20, secPerTrial: 9 },
    repair: { gamma: 0.25, slots: 1, primary: null, setTrials: 22, secPerTrial: 8 },
    echo: { gamma: 0.25, slots: 3, primary: 'snr', setTrials: 10, secPerTrial: 18 },
    seek: { gamma: 0.155, slots: 2, primary: 'snr', setTrials: 6, secPerTrial: 30 },
    voices: { gamma: 0.25, slots: 1, primary: 'snr', setTrials: 22, secPerTrial: 8,
      gammaOf: function (dials) { var v = D.voices[0].values[Math.round(dials.cast || 0)] || 4; return 1 / v; } },
    missions: { gamma: 0, slots: 0, primary: null, setTrials: 0, secPerTrial: 0 }
  };
  // driftScale multiplies every dial's drift (1.5 tracked simulated learning best: docs/dev/progress/engine.md)
  var MODEL = { target: 0.72, anchor: 0.9, warm: 0.85, floor: 0.65, lapse: 0.04, fc: 0.92, driftScale: 1.5 };

  // Margins in dial units for the UI ("the other dials sit this far below your edge").
  function logit(p) { return Math.log(p / (1 - p)); }
  Object.keys(D).forEach(function (ex) {
    var m = META[ex], nTyp = Math.max(1, D[ex].filter(function (d) { return !d.requires && !d.family; }).length);
    if (m.families) nTyp = 1;
    var fT = (MODEL.target - m.gamma) / (1 - m.gamma - MODEL.lapse);
    var zStar = logit(Math.min(0.99, fT / Math.pow(MODEL.fc, nTyp - 1)));
    D[ex].forEach(function (d) { d.margin = Math.round(Math.max(0, logit(MODEL.fc) - zStar) / d.slope * 10) / 10; });
  });

  ES.engine.dials = D;
  ES.engine.dialMeta = META;
  ES.engine.model = MODEL;
  ES.engine.exercises = ['crowd', 'far', 'strange', 'repair', 'echo', 'seek', 'voices'];
})(typeof window !== 'undefined' ? window : globalThis);
