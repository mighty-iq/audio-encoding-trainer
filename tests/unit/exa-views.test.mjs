// exA exercise views (js/ex/{crowd,far,strange,repair,strategies}.js) on the stimulus data as built (data/*.js; the
// fixture when absent): fix-round findings that need no browser. Run: node tests/unit/run.mjs exa
// FRESH-A (distinct tutorial items), P11 ("the voice you follow"), P17 (Repair sentences cased and punctuated),
// Repair's weak-clue step agreeing with its feedback, ST-08 (other-language model voices worded as such), Far's room
// outline clear of the "you" label (geometry at the field's ring scale), number foils never "sound like". MIT.
import { loadEngine, ENGINE_FILES } from '../sim/load.mjs';

const EXA = ['js/ex/crowd.js', 'js/ex/far.js', 'js/ex/repair.js', 'js/ex/strange.js', 'js/ex/strategies.js'];
export function setup() {
  return loadEngine({ realData: true, files: ENGINE_FILES.concat(['js/core/util.js', 'js/core/field.js'], EXA) });
}
const EXS = ['crowd', 'far', 'strange', 'repair'];
function key(t) { const m = t.meta || {}; return String(m.text || (m.items || []).join(' ')).toLowerCase().replace(/[^a-z0-9 ]+/g, ''); }
/** Tutorial trials in the shell runner's order: practice steps first, then the example. */
function tutorialTrials(ES, ex, tag) {
  const M = ES.ex[ex], st = M.tutorial.steps, out = {}, order = [];
  st.forEach((s, k) => { if (s.kind === 'practice') order.push(k); });
  st.forEach((s, k) => { if (s.kind === 'demo') order.push(k); });
  order.forEach((k) => { out[k] = M.tutorialTrial(st[k], k, ES.core.rng('tutorial:' + ex + ':' + k + ':' + tag)); });
  return out;
}
function right(ES, t) { return ES.engine.score(t, { picks: t.question.slots.map((s) => s.answer) }); }

export const tests = {
  'tutorials: the example and every practice step use their own item (FRESH-A)': (ES, assert) => {
    for (const ex of EXS) {
      for (const tag of ['a', 'b']) {
        const ts = tutorialTrials(ES, ex, tag), keys = Object.values(ts).filter(Boolean).map(key);
        assert.ok(keys.length >= 4, ex + ': every demo/practice step has a trial');
        assert.equal(new Set(keys).size, keys.length, ex + ' (' + tag + '): items repeat: ' + keys.join(' | '));
      }
    }
  },
  'crowd: the talker to follow is "the voice you follow", never "your voice" (P11)': (ES, assert) => {
    const M = ES.ex.crowd, t = M.tutorialTrial(M.tutorial.steps[2], 2, ES.core.rng('p11'));
    const miss = ES.engine.score(t, { picks: t.question.slots.map((s) => s.options.find((o) => String(o) !== String(s.answer))) });
    const pre = Object.assign({}, t, { meta: Object.assign({}, t.meta, { cue: 'preview' }), _exA: false });
    const text = JSON.stringify([M.helpData(), M.tips, M.tutorial.steps, t.feedback, M.review(t, miss), M.review(pre, miss),
      ES.ex.strategies.forEx('crowd')]);
    assert.ok(!/\byour voice\b|\byours\b/i.test(text), 'found "your voice": ' + (text.match(/.{40}\byour voice\b.{20}/i) || [''])[0]);
    assert.ok(/voice you follow/.test(text));
    assert.ok(/\(red\) said “/.test(t.feedback.text), 'the example line names the red dot: ' + t.feedback.text);
  },
  'repair: sentences start with a capital and end with a full stop (P17)': (ES, assert) => {
    const M = ES.ex.repair;
    for (let i = 0; i < 12; i++) {
      const t = M.tutorialTrial({ kind: 'practice', force: { dials: { gap: i % 4, context: i % 3 === 0 ? 2 : 0 } } }, 20 + i, ES.core.rng('p17:' + i));
      const w = M.review(t, right(ES, t)).words;
      assert.ok(/^[A-Z]/.test(w) && /[.!?]$/.test(w) && /\[[^\]]+\]/.test(w), 'not a sentence: ' + w);
    }
  },
  'repair: the weak-clue step and its feedback name the same context level': (ES, assert) => {
    const M = ES.ex.repair, st = M.tutorial.steps, k = st.length - 2, t = M.tutorialTrial(st[k], k, ES.core.rng('clue'));
    const line = M.review(t, right(ES, t)).text;
    if (/little away/.test(st[k].text)) assert.ok(/little context/.test(line), st[k].text + ' / ' + line);
    else if (/clue is weaker/.test(st[k].text)) assert.ok(/some context/.test(line), st[k].text + ' / ' + line);
    else assert.ok(!/context/i.test(st[k].text), st[k].text);
  },
  'strange: other-language model voices worded as such (ST-08); shown when the build has them (C12)': (ES, assert) => {
    const M = ES.ex.strange, V = ES.data.voices, A = ES.engine.items.adapt;
    const has = A.voicesWith(A.susItems()).some((v) => V[v] && !A.isNative(V[v]));
    assert.equal(M.families().includes('accent'), has, 'families() follows the voices');
    const h = M.helpData(), all = JSON.stringify([h, M.short, M.card.trains, M.tips, M.tutorial.steps, ES.ex.strategies.forEx('strange')]);
    assert.ok(!/(mild|moderate|strong) accent|\bAccents\b|[A-Z][a-z]+ speaker/.test(all), 'accent-strength or speaker wording: ' +
      (all.match(/.{30}((mild|moderate|strong) accent|Accents|[A-Z][a-z]+ speaker).{20}/) || [''])[0]);
    if (!has) return;
    assert.equal(h.dials.accent.label, 'Voices from other-language models');
    assert.ok(/^easiest, quiet → hardest, /.test(h.dials.accent.range), h.dials.accent.range);
    for (let i = 0; i < 6; i++) {
      const t = M.tutorialTrial({ kind: 'practice', force: { dials: { accent: i } } }, 30 + i, ES.core.rng('st08:' + i));
      if (t.meta.family !== 'accent') continue;
      const p = t.question.prompt, r = M.review(t, right(ES, t)).text;
      assert.ok(/^A (voice from an? [A-Z][a-z]+ model reading English|talker whose first language is [A-Z])/.test(p), p);
      assert.ok(!/accent/i.test(p + r), p + ' / ' + r);
    }
  },
  'far: the room outline keeps its back wall clear of "you" and the talker inside': (ES, assert) => {
    const M = ES.ex.far, nice = ES.ui.field.niceRings, sizes = { small: 5, medium: 10, large: 22, hall: 38 };
    for (const s of Object.keys(sizes)) {
      for (const dist of ES.engine.dials.far[0].values.filter((x) => x <= 0.8 * sizes[s])) {
        const t = { ex: 'far', audio: { room: { size: s, rt60: 1, dist }, parts: [] }, picture: { voices: [{ id: 'v0', role: 'target', az: 0, dist }] },
          question: { slots: [] }, feedback: {}, meta: {} };
        const p = M.prepare(t).picture, k = 86 / nice(p.maxDist).outer;
        assert.ok((p.room.d / 2 - p.room.cy) * k >= 19.8, s + ' ' + dist + ' m: back wall at the "you" label');
        assert.ok((p.room.cy + p.room.d / 2 - dist) * k >= 8.8, s + ' ' + dist + ' m: far wall through the talker');
        assert.ok(p.room.d <= sizes[s] * 1.25, s + ' ' + dist + ' m: room drawn ' + p.room.d + ' m');
      }
    }
  },
  'feedback: number foils are plain words, never "sounds like" (CONTRACTS §5)': (ES, assert) => {
    const K = ES.ex._kit, t = { question: { slots: [{ label: 'Number' }, { label: 'Word' }] } };
    const line = K.missLine(t, 0, { picked: 'nine', answer: 'four', correct: false, foil: 'number' }, null);
    assert.ok(!/sounds like/.test(line) && /“four”/.test(line), line);
    assert.ok(/sounds like/.test(K.missLine(t, 1, { picked: 'cap', answer: 'cup', correct: false, foil: 'neighbour' }, null)));
  }
};
