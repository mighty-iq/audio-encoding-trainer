// Audio DSP unit tests: speech-shaped and pink noise, gating, rooms (geometry, response, reverb), head model, limiter.
// Run: node tests/unit/run.mjs audio
const SR = 16000;
function near(assert, a, b, tol, what) { assert.ok(Math.abs(a - b) <= tol, `${what}: ${a.toFixed(3)} vs ${b.toFixed(3)} (tol ${tol})`); }
function corr(a, b, from = 0) { let s = 0, ea = 0, eb = 0; for (let i = from; i < a.length; i++) { s += a[i] * b[i]; ea += a[i] * a[i]; eb += b[i] * b[i]; } return s / Math.sqrt(ea * eb); }
// third-octave band powers of a signal vs those of an LTAS, both normalised to their total over the compared bands
function bandDiffs(D, x, ltas, lo, hi) {
  const sp = D.psd(x, SR, { n: 4096 }), cs = D.thirdOctaves(lo, hi), r = Math.pow(2, 1 / 6), m = [], l = [];
  for (const fc of cs) {
    m.push(D.bandPower(sp, fc / r, fc * r));
    let s = 0; for (let f = fc / r; f < fc * r; f += 1) s += Math.pow(10, D.ltasAt(ltas, f) / 10); l.push(s);
  }
  const sm = m.reduce((a, b) => a + b), sl = l.reduce((a, b) => a + b);
  return cs.map((fc, i) => [fc, 10 * Math.log10((m[i] / sm) / (l[i] / sl))]);
}

export const tests = [
  { name: 'ssn: spectrum within +-2 dB per third octave of the LTAS (default and custom); unit RMS; stereo decorrelated', fn(ES, assert) {
    const D = ES.audio.dsp;
    const custom = [[100, -20], [300, 0], [1000, -4], [2500, -12], [6000, -30]];
    for (const lt of [null, custom]) {
      const x = D.ssn(8 * SR, SR, lt, D.rng(2));
      near(assert, D.rmsDb(x), 0, 0.01, 'unit RMS');
      for (const [fc, d] of bandDiffs(D, x, lt || D.LTAS_DEFAULT, 100, 6300)) near(assert, d, 0, 2, `band ${Math.round(fc)} Hz`);
    }
    const st = D.ssn(4 * SR, SR, null, D.rng(4), { stereo: true });
    assert.ok(Math.abs(corr(st[0], st[1])) < 0.05, 'stereo channels decorrelated');
    const loop = D.ssn(3 * SR, SR, null, D.rng(4), { loop: true });
    assert.equal(loop.length, 65536, 'loop length is the FFT period');
    const a = D.ssn(SR, SR, null, D.rng(7)), b = D.ssn(SR, SR, null, D.rng(7)), c = D.ssn(SR, SR, null, D.rng(8));
    assert.equal(a[123], b[123], 'same seed, same noise'); assert.notEqual(a[123], c[123], 'other seed, other noise');
  } },
  { name: 'pink: -3 dB per octave (+-1 dB) from 100 Hz to 6.3 kHz', fn(ES, assert) {
    const D = ES.audio.dsp, x = D.pink(8 * SR, D.rng(3));
    for (const [fc, d] of bandDiffs(D, x, D.LTAS_PINK, 100, 6300)) near(assert, d, 0, 1, `band ${Math.round(fc)} Hz`);
  } },
  { name: 'gate: duty cycle within 2 %, explicit gaps, noise fill level', fn(ES, assert) {
    const D = ES.audio.dsp;
    for (const [rate, duty] of [[2, 0.3], [5, 0.5], [3, 0.7], [8, 0.5]]) {
      const g = D.gateMask(10 * SR, SR, { rateHz: rate, duty, rampMs: 5 }, D.rng(1));
      let on = 0; for (let i = 0; i < g.length; i++) if (g[i] >= 0.5) on++;
      near(assert, on / g.length, duty, 0.02, `duty at ${rate} Hz`);
    }
    const m = D.gateMask(2 * SR, SR, { gaps: [[0.5, 0.8]], rampMs: 10 });
    assert.equal(m[Math.round(0.65 * SR)], 0, 'inside the gap'); assert.equal(m[Math.round(0.2 * SR)], 1, 'outside the gap');
    near(assert, m[Math.round(0.5 * SR)], 0.5, 0.05, 'half gain at the gap edge');
    const x = D.white(2 * SR, D.rng(5)), y = D.gate(x, SR, { gaps: [[0.5, 1.0]], fill: 'noise', fillDb: 6, rampMs: 10 }, D.rng(6));
    near(assert, D.rmsDb(y, Math.round(0.6 * SR), Math.round(0.9 * SR)) - D.activeDb(x, SR), 6, 1, 'filler at +6 dB re the signal');
  } },
  { name: 'room sizes follow CONTRACTS R1; critical distance', fn(ES, assert) {
    const D = ES.audio.dsp;
    assert.deepEqual([D.roomDims('small').l, D.roomDims('small').w, D.roomDims('small').h], [5, 4, 2.7]);
    assert.deepEqual([D.roomDims('hall').l, D.roomDims('hall').w, D.roomDims('hall').h], [38, 24, 12]);
    const r8 = D.roomDims(8), r20 = D.roomDims(20);
    near(assert, r8.w, 5.6, 1e-9, 'width 0.7 L'); near(assert, r8.h, 3, 1e-9, 'height 3 m below 12 m'); near(assert, r20.h, 6, 1e-9, 'height 0.3 L');
    near(assert, D.critDist(0.5, 'medium'), 0.057 * Math.sqrt(2 * 10 * 7 * 3.2 / 0.5), 1e-9, 'dc medium');
  } },
  { name: 'rir: Schroeder RT within 15 %, unit energy, decorrelated tail, faster high-frequency decay', fn(ES, assert) {
    const D = ES.audio.dsp;
    for (const [rt, size] of [[0.3, 'small'], [0.6, 'medium'], [1.2, 'large'], [2.5, 'hall'], [0.9, 14]]) {
      const ir = D.rir(SR, { rt60: rt, size, seed: 3 });
      for (const ch of [0, 1]) {
        near(assert, D.energy(ir[ch]), 1, 0.01, `unit energy ${size}`);
        near(assert, D.schroederRT(ir[ch], SR) / rt, 1, 0.15, `RT ${size} ${rt} s ch${ch}`);
      }
      assert.ok(Math.abs(corr(ir[0], ir[1], Math.round(0.05 * SR))) < 0.2, 'tails decorrelated');
      const lo = D.schroederRT(D.band(ir[0], SR, 350, 700), SR), hi = D.schroederRT(D.band(ir[0], SR, 1700, 3000), SR);
      assert.ok(hi < lo, `2 kHz decays faster than 500 Hz (${hi.toFixed(2)} < ${lo.toFixed(2)})`);
    }
    const a = D.rir(SR, { rt60: 0.6, size: 'medium', seed: 1 }), b = D.rir(SR, { rt60: 0.6, size: 'medium', seed: 1 });
    assert.equal(a[0][2000], b[0][2000], 'deterministic for a seed');
  } },
  { name: 'reverb: equals convolution with the composed rir for speech-band input (error < -40 dB)', fn(ES, assert) {
    const D = ES.audio.dsp, m = D.roomModel(SR, { rt60: 0.8, size: 'medium', seed: 2 }), ir = D.composeRir(m);
    const x = D.lowpass(D.white(SR, D.rng(1)), SR, 3000, 8), y = D.reverb(x, m);
    for (const ch of [0, 1]) {
      let e = 0, d = 0;
      for (let i = 0; i < y[ch].length; i += 3) { // direct convolution on a sample grid (slow but exact)
        let s = 0; const h = ir[ch];
        for (let k = Math.max(0, i - x.length + 1); k <= Math.min(i, h.length - 1); k++) s += h[k] * x[i - k];
        e += s * s; d += (s - y[ch][i]) ** 2;
      }
      assert.ok(10 * Math.log10(d / e) < -40, `channel ${ch}: ${(10 * Math.log10(d / e)).toFixed(1)} dB`);
    }
  } },
  { name: 'hrtfLite: right source is louder and earlier in the right ear; front is symmetric', fn(ES, assert) {
    const D = ES.audio.dsp, x = D.band(D.white(SR, D.rng(2)), SR, 2000, 6000);
    const [l, r] = D.hrtfLite(x, SR, 90);
    assert.ok(D.rmsDb(r) - D.rmsDb(l) > 8, 'ILD at high frequencies');
    let best = 0, lag = 0;
    for (let k = -20; k <= 20; k++) { let s = 0; for (let i = 40; i < l.length - 40; i++) s += r[i] * l[i + k]; if (s > best) { best = s; lag = k; } }
    near(assert, lag / SR * 1000, 0.656, 0.1, 'ITD (ms), left ear late');
    const [l0, r0] = D.hrtfLite(x, SR, 0);
    near(assert, D.rmsDb(l0) - D.rmsDb(r0), 0, 0.01, 'front: no ILD');
    const [lm, rm] = D.hrtfLite(x, SR, -90);
    near(assert, D.rmsDb(lm) - D.rmsDb(rm), D.rmsDb(r) - D.rmsDb(l), 0.01, 'mirror');
  } },
  { name: 'limiter: no sample above the ceiling; untouched below it', fn(ES, assert) {
    const D = ES.audio.dsp, x = D.scale(D.ssn(2 * SR, SR, null, D.rng(1)), 0.4), y = D.scale(x, 0.9);
    const lim = D.limiterGain([x, y], SR, { ceilDb: -1 });
    assert.ok(lim.gain && lim.reductionDb < 0, 'limits');
    D.applyGain([x, y], lim.gain);
    assert.ok(D.peak([x, y]) <= D.db2g(-1) + 1e-6, 'peak ' + D.peakDb([x, y]).toFixed(3));
    const q = D.scale(D.ssn(SR, SR, null, D.rng(2)), 0.01);
    assert.equal(D.limiterGain([q], SR, { ceilDb: -1 }).gain, null, 'quiet signal untouched');
  } }
];
