// Lab: statistics, procedures, materials and probe definitions (pure; CONTRACTS §0, §11; PLAN §8).
export const scripts = ['js/core/ns.js', 'js/core/util.js', 'js/core/rng.js', 'tests/fixtures/lab-data.js',
  'js/lab/stats.js', 'js/lab/materials.js', 'js/lab/procedures.js', 'js/lab/probes.js', 'js/lab/probes-more.js'];

function respond(t, n, good = true) {
  if (t.ui.kind === 'matrix') return { picks: t.answer.map((w, i) => (good && (n + i) % 4 ? w : t.ui.columns[i].options[(n + i) % 10])) };
  if (t.ui.kind === 'keypad') return { digits: good ? t.answer.slice() : ['0', '0', '0'] };
  if (t.ui.kind === 'choice') return { pick: good && n % 3 ? t.answer : t.ui.options[0] };
  if (t.ui.kind === 'story') return { answers: t.answer.map((a, j) => (j < 3 ? a : 'x')), effort: 5 };
  if (t.ui.kind === 'diary') return { ratings: { loud: 2, far: 4, unusual: null, memory: 3, effort: 5 } };
  return {};
}
function runAll(ES, id, form, seed, good) {
  const run = ES.lab.probes[id].make(form, ES.core.rng(seed), { playerSeed: 'p1' });
  const trials = [];
  let t, n = 0;
  while ((t = run.next())) { trials.push(t); run.record(t, respond(t, n++, good)); if (n > 100) throw new Error('runaway ' + id); }
  return { run, trials, fin: run.finish() };
}

export const tests = {
  'normal quantiles and the reliable-change table of R4 (2.77 × σ / √k)'(ES, assert) {
    const S = ES.lab.stats;
    assert.ok(Math.abs(S.qnorm(0.975) - 1.95996) < 1e-4);
    assert.ok(Math.abs(S.Phi(1.6449) - 0.95) < 1e-4);
    // R4 facts table F: σ 0.5 → 1.39 (k 1), 0.98 (k 2), 0.69 (k 4); σ 0.7 → 1.94; σ 1.0 → 2.77
    assert.equal(S.round(S.sdcSimple(0.5, 1), 2), 1.39);
    assert.equal(S.round(S.sdcSimple(0.5, 2), 2), 0.98);
    assert.equal(S.round(S.sdcSimple(0.5, 4), 2), 0.69);
    assert.equal(S.round(S.sdcSimple(0.7, 1), 2), 1.94);
    assert.equal(S.round(S.sdcSimple(1.0, 1), 2), 2.77);
  },
  'grid posterior recovers a simulated threshold within its interval'(ES, assert) {
    const S = ES.lab.stats, r = ES.core.rng('grid');
    let inside = 0;
    for (let k = 0; k < 40; k++) {
      const th = -9 + 6 * r.next(), G = S.grid(ES.lab.probes.matrix.grid);
      let x = 2;
      for (let i = 0; i < 20; i++) {
        let c = 0; for (let w = 0; w < 5; w++) if (r.next() < S.p(x, th, 0.15, 0.1, 0.02)) c++;
        G.update(x, c, 5, 1);
        const e = G.estimate(); x = Math.round(S.levelAt(i % 2 ? 0.5 : 0.7, e.m, e.slope) * 2) / 2;
      }
      const e = G.estimate();
      if (e.lo90 <= th && th <= e.hi90) inside++;
      assert.ok(e.s > 0.2 && e.s < 1.5, 'posterior SD ' + e.s);
    }
    assert.ok(inside >= 30, 'coverage of the 90 % interval: ' + inside + '/40');
  },
  'staircase SRT is the mean of trials 5–25 (the 25th is the next level)'(ES, assert) {
    const T = ES.lab.procedures.staircase({ start: 0, step: 2, n: 24 });
    const pattern = [1, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0];
    pattern.forEach((c) => T.record(T.next(), !!c));
    assert.equal(T.levels.length, 25);
    const want = T.levels.slice(4, 25).reduce((a, b) => a + b, 0) / 21;
    assert.equal(T.srt(), want);
    assert.equal(T.levels[1], -2);
    assert.equal(T.levels[5], -6);  // four correct then one wrong: 0 −2 −4 −6 −8 then up to −6
  },
  'trend: no verdict before the first check-in; clear gain, decline and a flat line'(ES, assert) {
    const S = ES.lab.stats, o = { better: -1, sigmaX: 0.3, practice: { c0: 0.5, sd: 0.4, q: 0.35 } };
    assert.equal(S.trend([{ t: 0, y: -5, s: 0.5, r: 1, practice: true }], o).verdict, 'none');
    assert.equal(S.trend([{ t: 0, y: -5, s: 0.5, r: 1, practice: true }, { t: 1, y: -6, s: 0.5, r: 2 }], o).verdict, 'baseline');
    assert.equal(S.trend([{ t: 1, y: -6, s: 0.5, r: 2 }, { t: 2, y: -6.2, s: 0.5, r: 3 }], o).verdict, 'early');
    const mk = (ys) => [{ t: 0, y: -5, s: 0.5, r: 1, practice: true }].concat(ys.map((y, i) => ({ t: [1, 2, 9, 16, 23, 30][i], y, s: 0.5, r: i + 2 })));
    const up = S.trend(mk([-6.5, -6.6, -7.2, -7.6, -8.1, -8.6]), o);
    assert.equal(up.verdict, 'clear');
    assert.ok(up.gain > 1.2 && up.lo90 > 0 && up.gain >= up.sdc, JSON.stringify({ g: up.gain, lo: up.lo90, sdc: up.sdc }));
    const flat = S.trend(mk([-6.5, -6.6, -6.4, -6.7, -6.5, -6.6]), o);
    assert.equal(flat.verdict, 'unclear');
    assert.ok(flat.lo90 < 0 && flat.hi90 > 0);
    const down = S.trend(mk([-7, -7.1, -6.2, -5.6, -5, -4.4]), o);
    assert.equal(down.verdict, 'lower');
    const band = up.band(30);
    assert.ok(band.lo < band.m && band.m < band.hi && band.m < -7.5, 'band in natural units (dB): ' + JSON.stringify(band));
  },
  'every probe runs end to end on fixture materials and gives an estimate'(ES, assert) {
    for (const id of ES.lab.probeOrder) {
      assert.ok(ES.lab.probes[id].available().ok, id + ' available on fixtures');
      const { fin, trials } = runAll(ES, id, 1, 'e2e:' + id, true);
      assert.ok(trials.length === ES.lab.probes[id].n, id + ': ' + trials.length + ' trials');
      assert.ok(fin.est && typeof fin.est.m === 'number' && isFinite(fin.est.m), id + ' estimate ' + JSON.stringify(fin.est));
      assert.ok(fin.est.s > 0, id + ' SD');
      assert.equal(fin.n, trials.length);
    }
  },
  'probe trials use probe-set clips only (500 forms across all probes)'(ES, assert) {
    const M = ES.lab.materials;
    let clips = 0;
    for (const id of ES.lab.probeOrder) {
      for (let f = 0; f < (id === 'story' || id === 'diary' ? 10 : 80); f++) {
        const { trials, run } = runAll(ES, id, f, 'clips:' + id + ':' + f, f % 2 === 0);
        const specs = trials.map((t) => t.audio).concat(run.preview ? [run.preview.audio] : []).filter(Boolean);
        specs.forEach((a) => {
          (a.parts || []).forEach((p) => { clips++; assert.ok(M.isProbeClip(p.clip), id + ' uses ' + p.clip); });
          (a.beds || []).forEach((b) => { if (b.bed) assert.ok(M.isProbeClip(b.bed), id + ' bed ' + b.bed); });
          if (a.room) assert.ok(a.room.seed >= 10000, 'held-out room seed ' + a.room.seed);
        });
      }
    }
    assert.ok(clips > 5000, 'clips checked: ' + clips);
  },
  'alternate forms: the same seed repeats exactly, a new form changes words and noise'(ES, assert) {
    const a = runAll(ES, 'matrix', 3, 'form-a', true).trials, b = runAll(ES, 'matrix', 3, 'form-a', true).trials, c = runAll(ES, 'matrix', 4, 'form-b', true).trials;
    assert.deepEqual(a.map((t) => t.answer), b.map((t) => t.answer));
    assert.deepEqual(a.map((t) => t.seed), b.map((t) => t.seed));
    const same = a.filter((t, i) => t.answer.join() === c[i].answer.join()).length;
    assert.ok(same <= 1, 'sentences shared between two forms: ' + same);
    // a slot never repeats its word in consecutive sentences
    a.slice(1).forEach((t, i) => t.answer.forEach((w, j) => assert.notEqual(w, a[i].answer[j])));
  },
  'matrix levels: noise level follows the track, bed referenced to the sentence mean'(ES, assert) {
    const run = ES.lab.probes.matrix.make(0, ES.core.rng('lv'), {});
    const t = run.next();
    assert.equal(t.level, ES.lab.probes.matrix.grid.mu + 8);   // an easy first sentence
    const mean = t.audio.parts.reduce((s, p) => s + p.db, 0) / t.audio.parts.length;
    assert.ok(Math.abs(mean) < 0.05, 'word corrections centred: ' + mean);
    assert.ok(t.audio.parts.every((p) => Math.abs(p.db) <= 6));
    assert.equal(Math.round((t.audio.beds[0].db + t.audio.parts[0].db) * 100) / 100, -t.level);
    assert.equal(t.audio.out.db, -20);   // constant output level whatever the SNR
  },
  'two voices: a known target voice, two same-sex maskers, intrusions recorded'(ES, assert) {
    const run = ES.lab.probes.twovoices.make(0, ES.core.rng('tv'), {});
    assert.ok(run.preview && run.preview.audio.parts[0].clip);
    const t = run.next();
    const v = t.meta.voices, sex = (id) => ES.data.voices[id].sex;
    assert.equal(v.length, 3);
    assert.ok(sex(v[1]) === sex(v[0]) && sex(v[2]) === sex(v[0]));
    assert.equal(new Set(t.meta.items).size, 3, 'three different sentences');
    assert.ok(t.audio.parts.slice(1).every((p) => p.db === -t.level));
    const r = run.record(t, { pick: t.meta.items[1] });
    assert.equal(r.score, 0); assert.equal(r.intrusion, 1);
  },
  'rooms: distance on a log scale inside the held-out hall; estimate in dB* and metres'(ES, assert) {
    const P = ES.lab.probes.rooms, { trials, fin } = runAll(ES, 'rooms', 0, 'rooms', true);
    trials.forEach((t) => { assert.ok(t.dist >= 0.5 && t.dist <= 0.8 * 22, 'distance ' + t.dist); assert.equal(t.audio.room.levels, 'source'); });
    assert.equal(trials[0].dist, 1);
    assert.ok(Math.abs(P.metres(fin.est.m) - fin.extra.metres) < 0.05 * fin.extra.metres + 0.02);
  },
  'new voice: tone-vocoded, never the training noise carrier; accuracy and slope'(ES, assert) {
    const { trials, fin } = runAll(ES, 'newvoice', 0, 'nv', true);
    trials.forEach((t) => t.audio.parts.forEach((p) => assert.equal(p.fx[0].carrier, 'tone')));
    assert.ok(fin.est.m > 0 && fin.est.m <= 100);
    assert.ok(typeof fin.extra.slope10 === 'number');
  },
  'story rotates passages across forms; diary averages answered items only'(ES, assert) {
    const ids = [0, 1, 2, 3].map((f) => runAll(ES, 'story', f, 's' + f, true).fin.extra.story);
    assert.equal(new Set(ids.slice(0, 3)).size, 3);
    assert.equal(ids[3], ids[0]);
    const d = runAll(ES, 'diary', 0, 'd', true).fin;
    assert.equal(d.extra.answered, 4);
    assert.equal(d.est.m, 3.5);
  }
};
