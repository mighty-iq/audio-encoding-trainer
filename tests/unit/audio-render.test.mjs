// Render pipeline unit tests in Node: the assets layer is replaced by synthetic clips and AudioBuffer by a plain
// object (no Web Audio here, so 'hrtf' falls back to 'ild'). Levels are checked on the returned stems.
// Run: node tests/unit/run.mjs audio
const SR = 16000;
function near(assert, a, b, tol, what) { assert.ok(Math.abs(a - b) <= tol, `${what}: ${(+a).toFixed(3)} vs ${(+b).toFixed(3)} (tol ${tol})`); }

function speechlike(D, sec, f0, seed) { // harmonic source, syllable envelope, pauses
  const n = Math.round(sec * SR), y = new Float32Array(n), r = D.rng('clip' + seed);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, f = f0 * (1 + 0.05 * Math.sin(2 * Math.PI * 0.8 * t));
    ph += 2 * Math.PI * f / SR;
    let v = 0; for (let k = 1; k * f0 < 3500; k++) v += Math.sin(k * ph) / k;
    const syl = Math.max(0, Math.sin(2 * Math.PI * 3.5 * t + seed)) ** 0.7, gap = (t % 1.1) > 0.85 ? 0 : 1;
    y[i] = 0.05 * v * syl * gap * (t > 0.05 && t < sec - 0.05 ? 1 : 0);
  }
  return y;
}
function setup(ES) {
  const A = ES.audio, D = A.dsp, clips = {};
  [['t', 1.8, 130, 1], ['m1', 1.6, 210, 2], ['m2', 1.7, 100, 3], ['b1', 2.5, 115, 4], ['b2', 2.6, 170, 5], ['b3', 2.4, 145, 6]]
    .forEach(([id, s, f0, seed]) => { clips[id] = speechlike(D, s, f0, seed); });
  const clicks = D.scale(D.pink(4 * SR, D.rng('amb')), 0.03);
  for (let k = 0; k < 12; k++) { const p = Math.round((0.2 + 0.3 * k) * SR); for (let i = 0; i < 400; i++) clicks[p + i] += 0.6 * Math.exp(-i / 60) * (i % 2 ? 1 : -1); }
  clips.amb = clicks;
  A.assets = {
    sampleRate: () => SR,
    samples: (id) => clips[id] ? Promise.resolve(clips[id]) : Promise.reject(new Error('missing clip ' + id)),
    level: (id) => clips[id] ? Promise.resolve(D.activeDb(clips[id], SR, { tail: D.SOURCE_TAIL })) : Promise.reject(new Error('missing clip ' + id))
  };
  A.native.makeBuffer = (chs, sr) => ({ numberOfChannels: chs.length, sampleRate: sr, length: chs[0].length, duration: chs[0].length / sr, getChannelData: (c) => chs[c] });
  return A;
}
function measure(D, res) {
  const st = res.stems, rep = res.report, a = Math.round(rep.span[0] * SR), b = Math.round(rep.span[1] * SR);
  const T = { tail: D.SOURCE_TAIL }, out = { target: D.activeDb(st.target, SR, T) };
  if (st.bed) out.snr = out.target - D.rmsDb(st.bed, a, b);
  if (res.stemList) {
    const per = {};
    res.stemList.forEach((s) => { if (s.kind === 'bed') return; const k = s.role + ':' + s.clip; per[k] = per[k] ? [D.addInto(per[k][0], s.ch[0]), D.addInto(per[k][1], s.ch[1])] : [Float32Array.from(s.ch[0]), Float32Array.from(s.ch[1])]; });
    const m = Object.keys(per).filter((k) => k.startsWith('masker:')).map((k) => D.activeDb(per[k], SR, T));
    if (m.length) out.tmr = out.target - Math.max(...m);
  }
  return out;
}
const BAB = { kind: 'babble', clips: ['b1', 'b2', 'b3'] };

export const tests = [
  { name: 'render (mono, ild, hrtf->ild): TMR and SNR exact to 0.05 dB, output -20 dB, peaks <= -1 dBFS', async fn(ES, assert) {
    const A = setup(ES), D = A.dsp;
    for (const spatial of ['mono', 'ild', 'hrtf']) {
      const spec = { audio: { spatial, parts: [{ clip: 't', at: 0.4, db: 0, role: 'target' }, { clip: 'm1', at: 0.5, db: -2, role: 'masker', az: 60 },
        { clip: 'm2', at: 0.45, db: -5, role: 'masker', az: -40 }], beds: [Object.assign({ db: -4 }, BAB)] } };
      const res = await A.render(spec, { seed: 3, stems: 'all' }), m = measure(D, res), r = res.report;
      near(assert, m.tmr, 2, 0.05, spatial + ' TMR'); near(assert, m.snr, 4, 0.05, spatial + ' SNR');
      near(assert, r.tmrDb, m.tmr, 0.05, spatial + ' report TMR'); near(assert, r.snrDb, m.snr, 0.05, spatial + ' report SNR');
      near(assert, D.activeDb([res.buffer.getChannelData(0), res.buffer.getChannelData(1)], SR, { tail: D.SOURCE_TAIL }), -20, 0.05, spatial + ' output');
      assert.ok(D.peak([res.buffer.getChannelData(0), res.buffer.getChannelData(1)]) <= D.db2g(-1) + 1e-7, spatial + ' peak');
      if (spatial === 'hrtf') assert.ok(r.spatial === 'ild' && r.warnings.length === 1, 'hrtf falls back to ild without Web Audio');
    }
  } },
  { name: 'render in a room, levels ear: TMR/SNR exact, DRR = 20 log10(dc/dist) + air loss', async fn(ES, assert) {
    const A = setup(ES), D = A.dsp;
    for (const [size, rt, dist] of [['medium', 0.7, 3], ['hall', 2.2, 14]]) {
      const spec = { audio: { spatial: 'ild', room: { rt60: rt, dist, size, seed: 4 }, parts: [{ clip: 't', at: 0.3, db: 0, role: 'target', room: true },
        { clip: 'm1', at: 0.4, db: -3, role: 'masker', az: 50, room: true, dist: 2 }], beds: [Object.assign({ db: -2, room: true }, BAB)] } };
      const res = await A.render(spec, { seed: 9, stems: 'all' }), m = measure(D, res), r = res.report;
      near(assert, m.tmr, 3, 0.05, size + ' TMR'); near(assert, m.snr, 2, 0.05, size + ' SNR');
      let ed = 0, er = 0; res.stemList.forEach((s) => { if (s.role === 'target') { if (s.kind === 'dir') ed += D.energy(s.ch); else er += D.energy(s.ch); } });
      near(assert, 10 * Math.log10(ed / er), 20 * Math.log10(r.dc / dist) + (r.parts[0].airDb || 0), 0.05, size + ' DRR');
    }
  } },
  { name: 'render in a room, levels source: direct sound and DRR fall 6 dB per doubling; SNR falls', async fn(ES, assert) {
    const A = setup(ES), D = A.dsp, got = [];
    for (const dist of [2, 4]) {
      const spec = { audio: { spatial: 'mono', room: { rt60: 0.6, dist, size: 'medium', seed: 2, levels: 'source' },
        parts: [{ clip: 't', at: 0.3, db: 0, role: 'target', room: true }], beds: [{ kind: 'ssn', db: -10 }] } };
      const res = await A.render(spec, { seed: 5, stems: 'all' }), r = res.report;
      const dir = res.stemList.find((s) => s.kind === 'dir'), bed = res.stemList.find((s) => s.kind === 'bed');
      const a = Math.round(r.span[0] * SR), b = Math.round(r.span[1] * SR);
      got.push([D.activeDb(dir.ch, SR, { tail: D.SOURCE_TAIL }) - D.rmsDb(bed.ch, a, b), r.drrDb, r.snrDb]);
    }
    near(assert, got[0][0] - got[1][0], 6.02, 0.05, 'direct sound per doubling');
    near(assert, got[0][1] - got[1][1], 6.02, 0.01, 'DRR per doubling');
    assert.ok(got[1][2] < got[0][2], 'SNR falls with distance');
  } },
  { name: 'render: same seed same output; other seed other noise; peaky beds are tamed, SNR stays exact', async fn(ES, assert) {
    const A = setup(ES), D = A.dsp;
    const spec = { audio: { spatial: 'ild', parts: [{ clip: 't', at: 0.3, db: 0, role: 'target' }], beds: [{ kind: 'ambience', bed: 'amb', db: 2 }] } };
    const r1 = await A.render(spec, { seed: 1, stems: true }), r2 = await A.render(spec, { seed: 1 }), r3 = await A.render(spec, { seed: 2 });
    const x1 = r1.buffer.getChannelData(0), x2 = r2.buffer.getChannelData(0), x3 = r3.buffer.getChannelData(0);
    assert.ok(x1.every((v, i) => v === x2[i]), 'identical for the same seed');
    assert.ok(x1.some((v, i) => v !== x3[i]), 'different for another seed');
    near(assert, measure(D, r1).snr, -2, 0.05, 'SNR with a transient-rich bed');
    assert.ok(r1.report.bedCrestDb < -3 && r1.report.peakDb <= -1, 'bed transients held: ' + r1.report.bedCrestDb);
  } },
  { name: 'render: every fx type keeps levels; wsola rate is a speed factor', async fn(ES, assert) {
    const A = setup(ES), D = A.dsp;
    const fxs = [{ type: 'wsola', rate: 2 }, { type: 'wsola', rate: 0.67 }, { type: 'resample', ratio: 1.06 }, { type: 'vocode', bands: 6 },
      { type: 'whisper' }, { type: 'band', lo: 300, hi: 3400 }, { type: 'tilt', db: -8 }, { type: 'gate', rateHz: 4, duty: 0.6, fill: 'silence' },
      { type: 'mask', t0: 0.5, t1: 0.8, fill: 'noise', db: 0 }, { type: 'lowpass', f: 1200 }, { type: 'highpass', f: 800 }];
    for (const fx of fxs) {
      const res = await A.render({ audio: { parts: [{ clip: 't', at: 0.1, db: 0, role: 'target', fx: [fx] }], beds: [{ kind: 'pink', db: -6 }] } }, { seed: 4, stems: true });
      near(assert, measure(D, res).snr, 6, 0.05, 'SNR with ' + fx.type);
      assert.deepEqual(res.report.warnings, [], 'no warnings for ' + JSON.stringify(fx));
    }
    const base = (await A.render({ audio: { parts: [{ clip: 't', at: 0, role: 'target' }] } })).report.dur;
    const fast = (await A.render({ audio: { parts: [{ clip: 't', at: 0, role: 'target', fx: [{ type: 'wsola', rate: 2 }] }] } })).report.dur;
    near(assert, (fast - 0.15) / (base - 0.15), 0.5, 0.01, 'rate 2 halves the duration');
    const warn = (await A.render({ audio: { parts: [{ clip: 't', at: 0, role: 'target', fx: [{ type: 'wsola', rate: 5 }] }] } })).report.warnings;
    assert.ok(warn.length === 1 && /outside/.test(warn[0]), 'out-of-range rate is clamped with a warning');
  } },
  { name: 'render: missing target clip rejects; missing babble clip only warns', async fn(ES, assert) {
    const A = setup(ES);
    await assert.rejects(A.render({ audio: { parts: [{ clip: 'nope', role: 'target' }] } }), /missing clip/);
    const res = await A.render({ audio: { parts: [{ clip: 't', role: 'target' }], beds: [{ kind: 'babble', clips: ['b1', 'nope'], db: 0 }] } });
    assert.ok(res.report.warnings.some((w) => /nope/.test(w)), 'warned');
  } }
];
