// Audio DSP unit tests: levels, filters, time-scale modification, resampling, vocoder, whisper.
// Run: node tests/unit/run.mjs audio   (scripts: core ns/util/rng + js/audio/* in index order)
const SR = 16000;
const db = (x) => 20 * Math.log10(x);

function sine(D, f, sec, amp, sr = SR) { const n = Math.round(sec * sr), y = new Float32Array(n); for (let i = 0; i < n; i++) y[i] = amp * Math.sin(2 * Math.PI * f * i / sr); return y; }
// harmonic complex (voiced, vowel-like): F0 f0, harmonics 1/k up to 4 kHz, two formant-ish peaks
function voiced(f0, sec, sr = SR) {
  const n = Math.round(sec * sr), y = new Float32Array(n);
  for (let k = 1; k * f0 < 4000; k++) {
    const f = k * f0, g = (1 / k) * (1 + 2 * Math.exp(-(((f - 700) / 200) ** 2)) + 1.5 * Math.exp(-(((f - 1200) / 250) ** 2)));
    for (let i = 0; i < n; i++) y[i] += g * Math.sin(2 * Math.PI * f * i / sr + k);
  }
  return y;
}
function bandDb(D, x, lo, hi) { const sp = D.psd(x, SR, { n: 2048 }); return 10 * Math.log10(D.bandPower(sp, lo, hi) + 1e-30); }
function near(assert, a, b, tol, what) { assert.ok(Math.abs(a - b) <= tol, `${what}: ${a.toFixed(3)} vs ${b.toFixed(3)} (tol ${tol})`); }

export const tests = [
  { name: 'activeDb: continuous signals equal their RMS', fn(ES, assert) {
    const D = ES.audio.dsp, s = sine(D, 440, 2, 0.1), w = D.white(2 * SR, D.rng(1));
    near(assert, D.activeDb(s, SR), D.rmsDb(s), 0.2, 'sine');
    near(assert, D.activeDb(w, SR), D.rmsDb(w), 0.2, 'white noise');
    near(assert, D.rmsDb(s), db(0.1 / Math.SQRT2), 0.01, 'sine rms');
  } },
  { name: 'activeDb: pauses do not lower the level; scale and channels behave', fn(ES, assert) {
    const D = ES.audio.dsp, n = 6 * SR, b = new Float32Array(n), on = sine(D, 300, 0.8, 0.1);
    for (let k = 0; k < 4; k++) b.set(on, Math.round(k * 1.5 * SR));
    const lv = D.activeLevel(b, SR);
    assert.ok(lv.db > D.rmsDb(b) + 1, 'active level above the long-term RMS of a signal with pauses');
    near(assert, lv.db, D.rmsDb(on), 1.5, 'bursts with 0.7 s gaps');
    near(assert, D.activeDb(D.scale(b, 2), SR) - lv.db, 6.0206, 0.01, 'scale by 2');
    near(assert, D.activeDb([b, b], SR), lv.db, 0.01, 'identical stereo = mono');
    assert.equal(D.activeDb(new Float32Array(1000), SR), D.FLOOR_DB, 'silence');
  } },
  { name: 'activeDb: a clip measured with SOURCE_TAIL equals the same clip inside a longer timeline', fn(ES, assert) {
    const D = ES.audio.dsp, v = voiced(130, 1.2), padded = D.place(4 * SR, v, SR);
    near(assert, D.activeDb(v, SR, { tail: D.SOURCE_TAIL }), D.activeDb(padded, SR), 0.01, 'tail-corrected');
  } },
  { name: 'biquad and Butterworth responses', fn(ES, assert) {
    const D = ES.audio.dsp, lp = D.biquad('lowpass', 1000, Math.SQRT1_2, SR);
    near(assert, D.freqz(lp, 100, SR), 0, 0.1, 'LP pass band'); near(assert, D.freqz(lp, 1000, SR), -3.01, 0.05, 'LP -3 dB point');
    const b4 = D.butter('lowpass', 1000, 4, SR);
    near(assert, D.freqz(b4, 1000, SR), -3.01, 0.05, 'order 4 at fc'); assert.ok(D.freqz(b4, 4000, SR) < -45, 'order 4 two octaves up');
    const hs = D.biquad('highshelf', 3000, 0.7071, SR, -6);
    near(assert, D.freqz(hs, 7900, SR), -6, 0.5, 'high shelf');
  } },
  { name: 'band, lowpass and tilt act on the right frequencies', fn(ES, assert) {
    const D = ES.audio.dsp, f1 = sine(D, 1000, 1, 0.1), f2 = sine(D, 100, 1, 0.1), f3 = sine(D, 6000, 1, 0.1);
    near(assert, D.rmsDb(D.band(f1, SR, 300, 3400)), D.rmsDb(f1), 0.5, 'phone band passes 1 kHz');
    assert.ok(D.rmsDb(D.band(f2, SR, 300, 3400)) < D.rmsDb(f2) - 20, 'phone band cuts 100 Hz');
    assert.ok(D.rmsDb(D.band(f3, SR, 300, 3400)) < D.rmsDb(f3) - 20, 'phone band cuts 6 kHz');
    const t4 = sine(D, 4000, 1, 0.1), t5 = sine(D, 500, 1, 0.1);
    near(assert, D.rmsDb(D.tilt(t4, SR, -6)) - D.rmsDb(D.tilt(t5, SR, -6)), -18, 0.5, 'tilt -6 dB/oct over 3 octaves above 500 Hz');
  } },
  { name: 'wsola: speed factor sets the duration within 2 % (length and a landmark) and keeps F0 within 3 %', fn(ES, assert) {
    const D = ES.audio.dsp, base = voiced(140, 2.0), x = new Float32Array(base.length);
    for (let i = 0; i < x.length; i++) x[i] = base[i] * (i < 0.8 * SR ? 0.15 : 1); // a level step at 0.8 s
    for (const speed of [0.67, 1.5, 2, 3]) {
      const y = D.wsola(x, SR, speed);
      near(assert, y.length / x.length, 1 / speed, 0.02 / speed, `length ratio at speed ${speed}`);
      const env = (a, t) => D.rmsDb(a, Math.round(t * SR), Math.round(t * SR) + 160);
      let step = 0; for (let t = 0.05; t < y.length / SR - 0.05; t += 0.005) if (env(y, t) > env(base, 1.0) - 6) { step = t; break; }
      near(assert, step * speed, 0.8, 0.8 * 0.02 + 0.016, `landmark at speed ${speed}`);
      const f0 = D.f0(y, SR, 80, 300, Math.round(0.3 * y.length), 1600).hz;
      near(assert, f0 / 140, 1, 0.03, `F0 at speed ${speed}`);
    }
  } },
  { name: 'resample: ratio sets length, F0 moves by 1/ratio', fn(ES, assert) {
    const D = ES.audio.dsp, x = voiced(150, 1.0);
    for (const r of [0.94, 1.06]) {
      const y = D.resample(x, r);
      assert.equal(y.length, Math.round(x.length * r));
      near(assert, D.f0(y, SR, 80, 300, 4000, 3200).hz, 150 / r, 1.5, `F0 after ratio ${r}`);
      near(assert, D.rmsDb(y), D.rmsDb(x), 0.3, 'level kept');
    }
  } },
  { name: 'vocoder: band energies follow the input (+-1.5 dB), deterministic', fn(ES, assert) {
    const D = ES.audio.dsp, n = 3 * SR, x = new Float32Array(n), edges = D.vocoderEdges(8, 100, 7500), lv = [0, -4, -9, -3, -12, -6, -15, -20];
    for (let b = 0; b < 8; b++) {
      const nb = D.filter(D.white(n, D.rng('v' + b)), D.vocoderBand(SR, edges[b], edges[b + 1])), g = D.db2g(lv[b]);
      for (let i = 0; i < n; i++) x[i] += g * nb[i];
    }
    const y = D.vocode(x, SR, { bands: 8 }, D.rng(3)), y2 = D.vocode(x, SR, { bands: 8 }, D.rng(3));
    for (let b = 0; b < 8; b++) {
      const an = D.vocoderBand(SR, edges[b], edges[b + 1]);
      near(assert, D.rmsDb(D.filter(y, an)), D.rmsDb(D.filter(x, an)), 1.5, `band ${b}`);
    }
    assert.deepEqual(Array.from(y.subarray(1000, 1010)), Array.from(y2.subarray(1000, 1010)), 'same rng, same output');
    const t = D.vocode(x, SR, { bands: 4, carrier: 'tone' }, D.rng(3));
    assert.ok(t.length === n && D.rmsDb(t) > D.rmsDb(x) - 3, 'tone carriers');
  } },
  { name: 'whisper: periodicity removed, spectral envelope kept', fn(ES, assert) {
    const D = ES.audio.dsp, x = voiced(120, 1.5), y = D.whisper(x, SR, {}, D.rng(9));
    const px = D.periodicity(x, SR), py = D.periodicity(y, SR);
    assert.ok(px > 0.8, 'input is periodic: ' + px.toFixed(2));
    assert.ok(py < 0.35, 'whisper has no periodicity: ' + py.toFixed(2));
    const lx = D.ltasOf(x, SR), ly = D.ltasOf(y, SR), a = [], b = [];
    lx.forEach((p, i) => { if (p[0] >= 400 && p[0] <= 3200) { a.push(p[1]); b.push(ly[i][1]); } });
    const ma = a.reduce((s, v) => s + v, 0) / a.length, mb = b.reduce((s, v) => s + v, 0) / b.length;
    let sab = 0, saa = 0, sbb = 0; a.forEach((v, i) => { sab += (v - ma) * (b[i] - mb); saa += (v - ma) ** 2; sbb += (b[i] - mb) ** 2; });
    assert.ok(sab / Math.sqrt(saa * sbb) > 0.7, 'LTAS 400-3200 Hz correlates with the input');
  } }
];
