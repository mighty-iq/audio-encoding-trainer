// Lab against the real stimuli (data/*.js, not the fixture): every listening probe has materials, trials use
// existing probe-set clips only, and the stimuli changes of fix round 2 break nothing (RV-stimuli ST-06, ST-07).
// MIT licence.
import { CORE, LAB_PURE } from './lab-scripts.mjs';
export const scripts = CORE.concat(['data/voices.js', 'data/vocab.js', 'data/manifest.js'], LAB_PURE);

const LISTENING = ['matrix', 'digits', 'twovoices', 'rooms', 'newvoice', 'story'];
const ROLES = ['matrix', 'digits', 'twovoices', 'rooms', 'newvoice', 'story'];
const DROPPED = ['kokoro.af_jessica', 'kokoro.af_river'];   // ST-06: matrix word clips the stimuli builder drops

function respond(t, n) {
  if (t.ui.kind === 'matrix') return { picks: t.answer.map((w, i) => ((n + i) % 3 ? w : t.ui.columns[i].options[0])) };
  if (t.ui.kind === 'keypad') return { digits: n % 3 ? t.answer.slice() : ['0', '0', '0'] };
  if (t.ui.kind === 'choice') return { pick: n % 3 ? t.answer : t.ui.options[0] };
  if (t.ui.kind === 'story') return { answers: t.answer.map((a, j) => (j < 3 ? a : 'x')), effort: 4 };
  return {};
}
function runAll(ES, id, form, seed) {
  const run = ES.lab.probes[id].make(form, ES.core.rng(seed), { playerSeed: 'p-real' });
  const trials = [];
  let t, n = 0;
  while ((t = run.next())) { trials.push(t); run.record(t, respond(t, n++)); if (n > 100) throw new Error('runaway ' + id); }
  return { run, trials, fin: run.finish() };
}
/** Every clip one form of each listening probe uses; asserts they exist in the manifest and are probe-set clips. */
function clipsUsed(ES, assert, label) {
  const M = ES.lab.materials, man = ES.data.manifest.clips, used = new Set();
  for (const id of LISTENING) {
    for (let f = 0; f < 3; f++) {
      const { trials, run, fin } = runAll(ES, id, f, label + ':' + id + ':' + f);
      assert.ok(trials.length > 0 && Number.isFinite(fin.est.m), label + ': ' + id + ' form ' + f + ' runs to an estimate');
      trials.map((t) => t.audio).concat(run.preview ? [run.preview.audio] : []).filter(Boolean).forEach((a) => {
        (a.parts || []).forEach((p) => { used.add(p.clip); assert.ok(man[p.clip] && M.isProbeClip(p.clip), label + ': ' + id + ' uses ' + p.clip); });
        (a.beds || []).forEach((b) => { if (b.bed) { used.add(b.bed); assert.ok(man[b.bed] && M.isProbeClip(b.bed), label + ': ' + id + ' bed ' + b.bed); } });
      });
    }
  }
  return used;
}
function snapshot(ES) {
  const K = ES.lab.probeKit, X = ES.lab.materials.idx();
  return {
    available: LISTENING.map((id) => [id, !!ES.lab.probes[id].available().ok]),
    matrixVoices: X.matrix.voices.slice(),
    roles: ROLES.map((r) => [r, K.voicesFor(r)]),
    digits: X.digits.voices.slice(),
    stories: X.stories.map((s) => s.id),
    bed: X.cafe
  };
}

export const tests = {
  'real data: every listening probe has materials; Matrix voices have every word of every slot'(ES, assert) {
    const M = ES.lab.materials, X = M.idx();
    for (const id of LISTENING) assert.ok(ES.lab.probes[id].available().ok, id + ' available with the real stimuli');
    assert.ok(X.matrix.voices.length >= 1, 'at least one complete Matrix voice');
    X.matrix.voices.forEach((v) => X.matrix.slots.forEach((s) => X.matrix.words[s].forEach((w) =>
      assert.ok(M.clip(v, 'word', w), v + ' has ' + s + ' "' + w + '"'))));
    assert.ok(X.cafe && ES.data.manifest.clips[X.cafe].kind === 'bed', 'the Story bed is a probe bed');
    clipsUsed(ES, assert, 'real');
  },
  'ST-06: dropping the af_jessica and af_river matrix clips changes no probe (incomplete voices were never used)'(ES, assert) {
    const M = ES.lab.materials, man = ES.data.manifest.clips;
    M.reset();
    const before = snapshot(ES), usedBefore = clipsUsed(ES, assert, 'before');
    DROPPED.forEach((v) => assert.ok(!before.matrixVoices.includes(v), v + ' is not a Matrix voice (one word short)'));
    usedBefore.forEach((c) => assert.ok(!DROPPED.includes(man[c] && man[c].voice), 'no trial uses ' + c));
    const gone = Object.keys(man).filter((k) => DROPPED.includes(man[k].voice));
    gone.forEach((k) => assert.ok(man[k].kind === 'word', k + ' is a matrix word clip'));
    gone.forEach((k) => { delete man[k]; });   // what the stimuli builder's ST-06 change does (a no-op once it has landed)
    M.reset();
    assert.deepEqual(snapshot(ES), before, 'availability, voices per role, stories and bed unchanged');
    clipsUsed(ES, assert, 'after');
  },
  'ST-07: Story options stay shuffled per form and are scored by their text, whatever their length'(ES, assert) {
    const X = ES.lab.materials.idx();
    let moved = 0, n = 0;
    for (let f = 0; f < 8; f++) {
      const a = runAll(ES, 'story', f, 'st07:a:' + f).trials[0], b = runAll(ES, 'story', f, 'st07:b:' + f).trials[0];
      const st = X.stories.find((s) => s.id === a.meta.items[0]);
      assert.equal(a.meta.items[0], b.meta.items[0], 'same form, same story');
      a.ui.questions.forEach((q, j) => {
        n++;
        const src = st.questions[j].options.map(String);
        assert.deepEqual(q.options.slice().sort(), src.slice().sort(), 'the options are the story\'s own, all of them');
        assert.ok(q.options.includes(q.answer), 'the answer is one of the options');
        if (q.options.join('|') !== b.ui.questions[j].options.join('|')) moved++;
      });
      const all = runAll(ES, 'story', f, 'st07:a:' + f);
      const run = ES.lab.probes.story.make(f, ES.core.rng('st07:a:' + f), { playerSeed: 'p-real' }), t = run.next();
      assert.equal(run.record(t, { answers: t.answer.slice(), effort: 3 }).k, t.answer.length, 'right answers score 5 of 5');
      assert.ok(all.fin.est.m >= 0 && all.fin.est.m <= 100);
    }
    assert.ok(moved >= n / 2, 'options shuffled differently in most questions across seeds (' + moved + '/' + n + ')');
  }
};
