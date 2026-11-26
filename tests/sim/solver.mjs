// Independent solver for generated trials. It never calls the generators' helpers (items/common, items/data):
// it builds its own index of ES.data and derives each answer from the audio parts, the manifest and the vocab,
// then checks: exactly one correct option per slot, answer among options, options unique, no homophone of the
// answer, masker words differ from target words, foil labels true, no probe content, dial levels in range, and
// that the audio matches the dial settings.
const HOMO = [['two', 'to', 'too'], ['four', 'for', 'fore'], ['eight', 'ate'], ['one', 'won'], ['night', 'knight'], ['sail', 'sale'],
  ['tail', 'tale'], ['pear', 'pair'], ['bear', 'bare'], ['tea', 'tee'], ['knows', 'nose'], ['hole', 'whole'], ['road', 'rode'],
  ['plain', 'plane'], ['cent', 'scent', 'sent'], ['hear', 'here'], ['meet', 'meat'], ['son', 'sun'], ['whine', 'wine'], ['mail', 'male']];
export const norm = (t) => String(t ?? '').toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
function homophone(a, b) { a = norm(a); b = norm(b); return a === b || HOMO.some((g) => g.includes(a) && g.includes(b)); }
const has = (text, w) => (' ' + norm(text) + ' ').includes(' ' + norm(w) + ' ');
const ROOM_LEN = { small: 5, medium: 10, large: 22, hall: 38 };

export function buildIndex(ES) {
  const D = ES.data, clips = D.manifest.clips, voices = D.voices, V = D.vocab;
  const probeWords = new Set();
  Object.values(V.matrix || {}).forEach((a) => a.forEach((w) => probeWords.add(norm(w))));
  const nb = {};
  Object.entries(V.neighbours || {}).forEach(([k, a]) => { nb[norm(k)] = new Set(a.map(norm)); });
  const echoByText = new Map((V.echo || []).map((it) => [norm(it.text), it]));
  const repairByText = new Map((V.repair || []).map((it) => [norm(it.text), it]));
  return { clips, voices, V, probeWords, nb, echoByText, repairByText };
}

function dialsOf(ES, ex) { return ES.engine.dials[ex]; }
function val(ES, ex, id, i) { const d = dialsOf(ES, ex).find((x) => x.id === id); return d.values[i]; }

// Every clip a spec references, with where it came from.
function allClips(spec) {
  const out = [];
  const walk = (a, where) => {
    if (!a) return;
    (a.parts || []).forEach((p) => out.push([p.clip, where + ':part']));
    (a.beds || []).forEach((b) => { if (b.bed) out.push([b.bed, where + ':bed']); (b.clips || []).forEach((c) => out.push([c, where + ':babble'])); });
    if (a.live) { out.push([a.live.target.clip, where + ':live']); (a.live.decoys || []).forEach((d) => out.push([d.clip, where + ':decoy'])); if (a.live.bed && a.live.bed.bed) out.push([a.live.bed.bed, where + ':bed']); }
  };
  walk(spec.audio, 'audio');
  (spec.feedback.replays || []).forEach((r, i) => walk(r.audio, 'replay' + i));
  return out;
}

export function checkSpec(ES, X, spec) {
  const err = [];
  const E = (m) => err.push(spec.ex + ': ' + m);
  const ex = spec.ex, slots = spec.question.slots, C = X.clips;
  // --- probe content and clip validity
  for (const [id, where] of allClips(spec)) {
    const c = C[id];
    if (!c) { E('unknown clip ' + id + ' at ' + where); continue; }
    if (c.set !== 'train') E('probe clip ' + id);
    if (c.voice && (!X.voices[c.voice] || X.voices[c.voice].set !== 'train')) E('probe or unknown voice ' + c.voice);
    if (c.asr && c.asr.ok === false) E('clip failed ASR ' + id);
  }
  const room = spec.audio.room; if (room && !(room.seed >= 1 && room.seed < 10000)) E('room seed outside training range');
  // --- dial levels in range
  const dset = spec.setting.dials;
  for (const [id, v] of Object.entries(dset)) {
    const d = dialsOf(ES, ex).find((x) => x.id === id);
    if (!d) { E('unknown dial ' + id); continue; }
    if (v === null || v === undefined) continue;
    if (v < d.min - 1e-9 || v > d.max + 1e-9) E('dial ' + id + ' out of range ' + v);
    if (d.kind === 'ord' && Math.abs(v - Math.round(v)) > 1e-9) E('ordinal dial ' + id + ' not integer ' + v);
    if (d.kind === 'cont' && Math.abs(v / d.step - Math.round(v / d.step)) > 1e-6) E('dial ' + id + ' off step ' + v);
  }
  // --- slot structure
  slots.forEach((sl, i) => {
    if (sl.kind === 'locate') return;
    const opts = sl.options.map(norm);
    if (new Set(opts).size !== opts.length) E('slot ' + i + ' duplicate options');
    if (opts.filter((o) => o === norm(sl.answer)).length !== 1) E('slot ' + i + ' answer not exactly once among options');
    if (opts.length < 2) E('slot ' + i + ' has fewer than two options');
    sl.options.forEach((o) => { if (norm(o) !== norm(sl.answer) && homophone(o, sl.answer)) E('slot ' + i + ' homophone foil ' + o); });
    sl.options.forEach((o) => { if (X.probeWords.has(norm(o))) E('probe word as option ' + o); });
    const foilKeys = Object.keys(sl.foils || {}).map(norm).sort(), others = opts.filter((o) => o !== norm(sl.answer)).sort();
    if (JSON.stringify(foilKeys) !== JSON.stringify(others)) E('slot ' + i + ' foils do not label exactly the wrong options');
  });
  const parts = spec.audio.parts || [];
  const textOf = (p) => (C[p.clip] || {}).text || '';
  const target = parts.filter((p) => p.role === 'target'), maskers = parts.filter((p) => p.role === 'masker');
  const spoken = new Set(maskers.flatMap((p) => (C[p.clip] && C[p.clip].kind === 'phrase' ? (C[p.clip].words || []) : [textOf(p)]).map(norm)));
  const labelCheck = (sl, i, extra = {}) => {
    for (const [f, type] of Object.entries(sl.foils || {})) {
      const k = norm(f), isMask = spoken.has(k) || (extra.decoys && extra.decoys.has(k));
      const isNb = (X.nb[norm(sl.answer)] || new Set()).has(k);
      const isCtx = extra.context ? extra.context(k) : false;
      if (type === 'masker' && !isMask) E('slot ' + i + ' foil ' + f + ' labelled masker but not spoken');
      if (isMask && type !== 'masker' && type !== 'context') E('slot ' + i + ' spoken foil ' + f + ' labelled ' + type);
      if (type === 'neighbour' && !isNb && !extra.voiceNb) E('slot ' + i + ' foil ' + f + ' labelled neighbour but is not');
      if (type === 'context' && !isCtx) E('slot ' + i + ' foil ' + f + ' labelled context but is not');
      if (type === 'random' && (isMask || (isNb && !extra.voiceNb) || isCtx)) E('slot ' + i + ' foil ' + f + ' labelled random but is ' + (isMask ? 'spoken' : isNb ? 'a neighbour' : 'context'));
    }
  };
  if (ex === 'crowd') {
    const kindT = (k) => target.filter((p) => C[p.clip].kind === k).map(textOf);
    let [tName] = kindT('name'), [tWord] = kindT('word'), [tNum] = kindT('number');
    const ph = target.find((p) => C[p.clip].kind === 'phrase' && (C[p.clip].words || []).length === 3);
    if (ph) [tName, tWord, tNum] = C[ph.clip].words;
    const said = (p) => C[p.clip].kind === 'phrase' ? (C[p.clip].words || []).map(norm) : [norm(textOf(p))];
    if (norm(slots[0].answer) !== norm(tWord)) E('word answer is not the target word');
    if (slots[1] && norm(slots[1].answer) !== norm(tNum)) E('number answer is not the target number');
    const tv = C[target[0].clip].voice;
    if (target.some((p) => C[p.clip].voice !== tv)) E('target parts from several voices');
    const mv = {};
    maskers.forEach((p) => { const key = C[p.clip].voice + '|' + JSON.stringify(p.fx || null) + '|' + p.az; (mv[key] = mv[key] || []).push(p); });
    const groups = Object.values(mv);
    const askedNum = !!slots[1];
    groups.forEach((g) => {
      g.forEach((p) => said(p).forEach((t) => { if (t === norm(tWord) || (askedNum && t === norm(tNum)) || t === norm(tName)) E('masker says a target word ' + t); }));
      if (Math.abs(g[0].db + dset.tmr) > 1e-9) E('masker level ' + g[0].db + ' does not match tmr ' + dset.tmr);
    });
    const wantMaskers = val(ES, 'crowd', 'talkers', dset.talkers), lone = (spec.meta.relaxed || []).includes('no other talker');
    if (lone ? groups.length !== 0 || !spec.setting.noUpdate : groups.length !== wantMaskers) E('masker count ' + groups.length + ' vs talkers ' + wantMaskers);
    if (spec.meta.cue === 'callsign' && !norm(spec.question.prompt).includes(norm(tName))) E('prompt lacks the call sign');
    const nums = new Set(ES.data.vocab.numbers.map(norm)), allW = maskers.flatMap(said).filter((w) => askedNum || !nums.has(w));
    if (new Set(allW).size !== allW.length) E('two maskers say the same word');
    if (dset.similar === 3 && !maskers.some((p) => C[p.clip].voice === tv && p.fx)) E('near-twin level without a shifted copy of the target voice');
    if (dset.similar === 0 && groups.some((g) => X.voices[C[g[0].clip].voice].sex === X.voices[tv].sex)) E('other-sex level with a same-sex masker');
    if (dset.space !== undefined && dset.space !== null && groups.length) {
      const sep = val(ES, 'crowd', 'space', dset.space), tAz = target[0].az;
      const far = Math.max(...groups.map((g) => Math.abs(g[0].az - tAz)));
      if (Math.abs(far - sep) > 1e-6) E('spatial separation ' + far + ' vs ' + sep);
    }
    slots.forEach((sl, i) => labelCheck(sl, i));
  }
  if (ex === 'far' || ex === 'strange') {
    const t = target[0], text = textOf(t);
    const a = slots.map((s) => s.answer);
    if (!a.every((w) => has(text, w))) E('answer not in the target phrase');
    if (a.length > 1 && norm(a[0]) === norm(a[1])) E('both slots have the same answer');
    slots.forEach((sl, i) => sl.options.forEach((o) => { if (norm(o) !== norm(sl.answer) && has(text, o)) E('foil ' + o + ' is also in the phrase'); }));
    const cue = parts.find((p) => p.role === 'cue');
    if (cue) slots.forEach((sl) => sl.options.forEach((o) => { if (norm(o) !== norm(sl.answer) && has(textOf(cue), o)) E('foil ' + o + ' is in the room cue'); }));
    if (ex === 'far') {
      if (Math.abs(room.rt60 - val(ES, 'far', 'rt60', dset.rt60)) > 1e-9) E('rt60 mismatch');
      if (Math.abs(room.dist - val(ES, 'far', 'dist', dset.dist)) > 1e-9) E('distance mismatch');
      if (room.dist > 0.8 * ROOM_LEN[room.size] + 1e-9) E('distance ' + room.dist + ' does not fit a ' + room.size + ' room');
      if (Math.abs(spec.audio.beds[0].db + dset.noise) > 1e-9) E('noise level mismatch');
    } else {
      const fam = Object.keys(dset);
      if (fam.length !== 1) E('strange trial with ' + fam.length + ' family dials');
      const f = fam[0], v = val(ES, 'strange', f, dset[f]), fx = t.fx || [];
      const want = { fast: ['wsola', 'rate', v], whisper: ['whisper'], phone: ['band', 'lo', v && v.lo], muffled: ['lowpass', 'f', v], vocoded: ['vocode', 'bands', v] }[f];
      if (want && !fx.some((x) => x.type === want[0] && (want.length < 3 || x[want[1]] === want[2]))) E('family ' + f + ' fx mismatch');
      if (f === 'accent') { const vo = X.voices[C[t.clip].voice], a = String(vo.accent || '').toLowerCase(); if (['us', 'gb', 'au', 'ca', 'ie', 'nz'].includes(a) || (/english/.test(a) && !/accent|l1|non-?native/.test(a))) E('accent trial with a native voice'); }
      if (f === 'accent' && v.snr !== null && Math.abs(spec.audio.beds[0].db + v.snr) > 1e-9) E('accent babble level mismatch');
    }
    slots.forEach((sl, i) => labelCheck(sl, i));
  }
  if (ex === 'repair') {
    const t = target[0], c = C[t.clip], mask = (t.fx || []).find((x) => x.type === 'mask');
    if (!mask || !c.wt) { E('repair without mask or word times'); return err; }
    const hit = c.words.filter((w, i) => c.wt[i][0] < mask.t1 && c.wt[i][1] > mask.t0);
    if (hit.length !== 1) E('mask covers ' + hit.length + ' words');
    else if (norm(hit[0]) !== norm(slots[0].answer)) E('answer is not the masked word');
    const k = c.words.findIndex((w) => norm(w) === norm(slots[0].answer)), w = c.wt[k];
    const frac = (mask.t1 - mask.t0) / (w[1] - w[0]);
    if (Math.abs(frac - val(ES, 'repair', 'gap', dset.gap)) > 0.02) E('gap fraction ' + frac.toFixed(2) + ' vs dial');
    const item = X.repairByText.get(norm(c.text));
    slots[0].options.forEach((o) => { if (norm(o) !== norm(slots[0].answer) && has(c.text, o)) E('foil ' + o + ' occurs in the sentence'); });
    labelCheck(slots[0], 0, { context: (kk) => !!item && (item.alts || []).map(norm).includes(kk) });
  }
  if (ex === 'echo') {
    const t = target[0], text = textOf(t), item = X.echoByText.get(norm(text));
    if (!item) {
      // a message made from a call-sign phrase: every answer is a word of it, no foil is, one slot per word
      if (!(spec.meta.relaxed || []).includes('call-sign phrases')) { E('echo message not in vocab'); return err; }
      const w = (C[t.clip].words || []).map(norm);
      slots.forEach((sl, i) => {
        if (!w.includes(norm(sl.answer))) E('fallback answer not in the phrase');
        sl.options.forEach((o) => { if (norm(o) !== norm(sl.answer) && w.includes(norm(o))) E('fallback foil in the phrase'); });
      });
      if (new Set(slots.map((s) => norm(s.answer))).size !== slots.length) E('two questions with one answer');
      if (slots.length - 2 !== dset.details && !(slots.length < 2)) E('details dial vs questions');
      return err;
    }
    if (item.facts.length - 2 !== dset.details) E('details dial ' + dset.details + ' vs ' + item.facts.length + ' facts');
    slots.forEach((sl, i) => {
      const facts = item.facts.filter((f) => f.q === sl.label);
      if (facts.length !== 1) { E('question ' + sl.label + ' matches ' + facts.length + ' facts'); return; }
      if (norm(facts[0].value) !== norm(sl.answer)) E('echo answer is not the fact');
      const same = item.facts.filter((f) => f.cat === facts[0].cat && f !== facts[0]).map((f) => norm(f.value));
      sl.options.forEach((o) => { if (same.includes(norm(o))) E('another fact of the same kind among options'); });
      labelCheck(sl, i, { context: (kk) => has(text, kk) });
    });
  }
  if (ex === 'seek') {
    const L = spec.audio.live, wOf = (id) => C[id].kind === 'phrase' && (C[id].words || []).length === 3 ? norm(C[id].words[1]) : norm(C[id].text), tw = wOf(L.target.clip);
    const loc = slots[0], ws = slots[1];
    if (loc.kind !== 'locate' || Math.abs(loc.answer.x - L.target.x) > 1e-9 || Math.abs(loc.answer.y - L.target.y) > 1e-9) E('locate answer is not the target position');
    if (Math.abs(loc.answer.r - val(ES, 'seek', 'size', dset.size)) > 1e-9) E('radius vs size dial');
    if (norm(ws.answer) !== tw) E('word answer is not the target word');
    if (L.decoys.length !== val(ES, 'seek', 'decoys', dset.decoys)) E('decoy count vs dial');
    const dw = new Set(L.decoys.map((d) => wOf(d.clip)));
    if (dw.has(tw)) E('a decoy calls the target word');
    L.decoys.forEach((d) => { if (Math.hypot(d.x - L.target.x, d.y - L.target.y) < 2 * loc.answer.r) E('decoy inside the target zone'); });
    [L.target, ...L.decoys].forEach((p) => { if (Math.abs(p.x) > 1 || Math.abs(p.y) > 1) E('position outside the field'); });
    if (Math.abs(L.target.db - dset.snr) > 1e-9) E('target level vs snr dial');
    labelCheck(ws, 1, { decoys: dw });
  }
  if (ex === 'voices') {
    const task = spec.meta.task, sl = slots[0], nameOf = (v) => (X.voices[v].cast || {}).name;
    if (task === 'who') {
      const tv = C[target[0].clip].voice;
      if (norm(sl.answer) !== norm(nameOf(tv))) E('who: answer is not the talker');
      if (sl.options.length !== val(ES, 'voices', 'cast', dset.cast)) E('who: option count vs cast dial');
      const castByName = {}; Object.entries(X.voices).forEach(([v, vo]) => { if (vo.cast && vo.set === 'train') castByName[norm(vo.cast.name)] = v; });
      sl.options.forEach((o) => { if (!castByName[norm(o)]) E('who: option is not a cast name ' + o); });
      if (target.some((p) => C[p.clip].voice !== tv)) E('who: several talkers');
      if (dset.similar >= 1) sl.options.forEach((o) => { const v = castByName[norm(o)]; if (v && X.voices[v].sex !== X.voices[tv].sex) E('who: other-sex option at same-sex level'); });
      for (const [f, type] of Object.entries(sl.foils)) {
        const v = castByName[norm(f)], a = X.voices[tv], b = X.voices[v];
        const close = a.sex === b.sex && Math.abs(12 * Math.log2(a.f0 / b.f0)) < 2;
        if ((type === 'neighbour') !== close) E('who: voice foil label ' + type + ' for ' + f);
      }
    } else if (task === 'meet') {
      const tv = C[target[0].clip].voice;
      if (norm(sl.answer) !== norm(nameOf(tv))) E('meet: answer is not the new voice');
      if (!spec.setting.noUpdate) E('meet trial would move thresholds');
    } else if (task === 'find') {
      const fw = (p) => C[p.clip].kind === 'phrase' && (C[p.clip].words || []).length === 3 ? norm(C[p.clip].words[1]) : norm(textOf(p));
      if (norm(sl.answer) !== fw(target[0])) E('find: answer is not the friend\'s word');
      maskers.forEach((p) => { if (fw(p) === norm(sl.answer)) E('find: masker says the answer'); if (Math.abs(p.db + dset.snr) > 1e-9) E('find: masker level vs snr'); });
      labelCheck(sl, 0);
    } else E('unknown voices task ' + task);
  }
  return err;
}

// Random settings across every dial range, then generate and check `seeds` trials per generator.
export function randomSetting(ES, ex, rng) {
  const dials = {}, ds = ES.engine.dials[ex];
  const pickLevel = (d) => d.kind === 'ord' ? Math.floor(rng.next() * (d.max + 1)) : Math.round((d.min + rng.next() * (d.max - d.min)) / d.step) * d.step;
  let hp = false;
  if (ex === 'strange') { const d = ds[Math.floor(rng.next() * ds.length)]; dials[d.id] = pickLevel(d); }
  else ds.forEach((d) => { if (d.requires === 'headphones') { hp = rng.next() < 0.5; if (hp) dials[d.id] = pickLevel(d); } else dials[d.id] = pickLevel(d); });
  return { dials, hp, breadth: [0, 0.3, 0.6, 1][Math.floor(rng.next() * 4)] };
}

export function runSolver(ES, { seeds = 10000, gens = ES.engine.exercises } = {}) {
  const X = buildIndex(ES), report = {}, cast = ES.engine.items.voices.cast();
  for (const ex of gens) {
    const r = { n: 0, fail: 0, errors: {}, ms: 0 };
    const t0 = performance.now();
    for (let s = 0; s < seeds; s++) {
      const rng = ES.core.rng('solver:' + ex + ':' + s), st = randomSetting(ES, ex, rng.fork('set'));
      const ctx = { breadth: st.breadth, headphones: st.hp, playerSeed: 'solver' + (s % 7), met: ex === 'voices' ? cast.slice(0, 6 + (s % 20)) : undefined,
        task: ex === 'voices' ? ['who', 'who', 'find', 'meet'][s % 4] : undefined, learner: ES.engine.learner };
      let spec;
      try { spec = ES.engine.items[ex].make(rng.fork('make'), { dials: st.dials, focus: Object.keys(st.dials)[0] }, ctx); }
      catch (e) { r.fail++; r.errors['throw: ' + e.message] = (r.errors['throw: ' + e.message] || 0) + 1; continue; }
      const errs = checkSpec(ES, X, spec);
      r.n++;
      if (errs.length) { r.fail++; errs.forEach((m) => { const k = m.replace(/[0-9.-]+/g, '#'); r.errors[k] = (r.errors[k] || 0) + 1; }); }
    }
    r.ms = Math.round((performance.now() - t0) / seeds * 1000) / 1000;
    report[ex] = r;
  }
  return report;
}
