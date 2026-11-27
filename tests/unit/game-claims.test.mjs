// Game layer, fix round 2: what the game may claim (RV-play P2, P12, FRESH-B C1, C3). Milestones and venue earshots
// read the careful side of the estimate and never go beyond the hardest level the player has been tested at.
import { spawnGame, trainDial, logTrials } from './game-env.mjs';
export { setup } from './game-env.mjs';

function setDial(ES, key, m, s, n) { const L = ES.engine.learner; L.state.dials[key] = { m, s, n, at: Date.now() }; if (L.save) L.save(); }
let T = Date.now();                                 // trial rows are keyed by (time, exercise): one clock, no collisions
function heard(ES, ex, dial, levels) { logTrials(ES, levels.map((x) => [++T, ex, dial, x, 1, 1, 0])); }

export const tests = {
  async 'a milestone needs the careful side of the estimate and a level the player was tested at'(ES0, assert, env) {
    const ES = await spawnGame(env), M = ES.game.milestones, K = ES.game.core;
    setDial(ES, 'crowd.tmr', -4, 0.5, 20);
    assert.equal(K.claim('crowd', 'tmr'), null, 'no trials of that dial logged: no claim');
    assert.equal(M.reached('crowd', 'tmr', 0), false);
    heard(ES, 'crowd', 'tmr', [3, 0, -6]);
    const c = K.claim('crowd', 'tmr');
    assert.equal(c.careful, -4 + 1.28 * 0.5); assert.equal(c.tested, -6); assert.equal(c.value, c.careful); assert.equal(c.capped, false);
    assert.equal(M.reached('crowd', 'tmr', -3), true, 'careful side −3.36 dB passes −3 dB');
    assert.equal(M.reached('crowd', 'tmr', -6), false, 'the point estimate −4 dB alone is not enough for −6 dB');
    setDial(ES, 'crowd.tmr', -4, 2, 20);
    assert.equal(M.reached('crowd', 'tmr', -3), false, 'more uncertainty, a more careful claim');
    assert.equal(M.reached('crowd', 'tmr', 0), true);
    const ES2 = await spawnGame(env);
    setDial(ES2, 'crowd.tmr', -8, 0.5, 30);
    heard(ES2, 'crowd', 'tmr', [6, 3, -1]);
    const c2 = ES2.game.core.claim('crowd', 'tmr');
    assert.equal(c2.value, -1); assert.equal(c2.capped, true);
    assert.equal(ES2.game.milestones.reached('crowd', 'tmr', 0), true);
    assert.equal(ES2.game.milestones.reached('crowd', 'tmr', -3), false, 'never beyond the hardest level heard (FRESH-B C3)');
    setDial(ES2, 'far.dist', 8, 0.6, 30);
    heard(ES2, 'far', 'dist', [1, 2, 3]);
    assert.deepEqual(ES2.game.milestones.check().filter((m) => m.dial === 'dist').map((m) => m.id), ['far.dist@3'], 'Far: only “Across the table” after trials up to 3 m');
  },
  async 'venue earshots: careful, never beyond the hardest level heard, and say so'(ES0, assert, env) {
    const ES = await spawnGame(env), V = ES.game.venues;
    trainDial(ES, 'crowd', 'tmr', { tmr: 0, talkers: 0, similar: 0 }, Array(30).fill(1), { log: false });
    assert.equal(V.earshot('cafe').status, 'none', 'estimates without logged trials of that dial show nothing');
    heard(ES, 'crowd', 'tmr', [6, 3]);
    const e = V.earshot('cafe');
    assert.equal(e.status, 'in'); assert.equal(e.x, 3); assert.equal(e.capped, true); assert.equal(e.text, '+3 dB');
    assert.ok(/hardest you have heard so far/.test(V.meaning(ES.game.data.venue('cafe').head, e)), V.meaning(ES.game.data.venue('cafe').head, e));
    heard(ES, 'crowd', 'tmr', [-12]);
    const e2 = V.earshot('cafe');
    assert.ok(!e2.capped && e2.x < 3, 'uncapped once harder levels were heard: ' + JSON.stringify(e2));
    assert.ok(-e2.x <= e2.u0 + 1e-9, 'the careful earshot is never harder than the point solution');
    const rec = ES.engine.learner.state.dials['crowd.tmr'], s0 = rec.s;
    rec.s = s0 * 3;
    const e3 = V.earshot('cafe');
    assert.ok(e3.status === 'below' || e3.x > e2.x, 'more uncertainty → an easier earshot: ' + e2.x + ' vs ' + e3.x);
    rec.s = s0;
  },
  'every exercise has a place at a venue open from the start; Seek is at the lecture hall (FRESH-B C1)'(ES, assert) {
    const D = ES.game.data, V = ES.game.venues, start = D.VENUES.filter((v) => !v.opens);
    ['crowd', 'far', 'strange', 'repair', 'echo', 'seek', 'voices'].forEach((ex) => {
      assert.ok(start.some((v) => [v.head].concat(v.also).some((c) => c.ex === ex)), ex + ' at a start venue');
    });
    assert.ok(V.forExercise('seek').map((v) => v.id).includes('lecture'));
  },
  'cast news keeps a blurb’s own capitals (RV-play P12)'(ES, assert) {
    const f = ES.game.record._lowerFirst;
    assert.equal(f('Rings the bells on Sundays.'), 'rings the bells on Sundays.');
    assert.equal(f('BBC voice'), 'BBC voice', 'an acronym stays');
    assert.equal(f('Grew up in Lagos and Leeds'), 'grew up in Lagos and Leeds');
  },
  'levels in plain words for cards and stops (RV-play P10)'(ES, assert) {
    const P = ES.game.venues.plainLevel;
    assert.equal(P('crowd', 'tmr', -3), 'the others 3 dB louder');
    assert.equal(P('crowd', 'tmr', 2), 'the voice you follow 2 dB louder');
    assert.equal(P('far', 'noise', -2), 'noise 2 dB above the speech');
    assert.ok(/^the voice \d+(\.\d)? m away$/.test(P('far', 'dist', 4)), P('far', 'dist', 4));
    ES.game.milestones.LADDERS.forEach((row) => {
      const d = ES.engine.dialDef(row[0], row[1]);
      if (!d) return;
      row[2].forEach((at) => { const t = P(row[0], row[1], at); assert.ok(t && !/undefined|NaN|index/.test(t), row[0] + '.' + row[1] + '@' + at + ': ' + t); });
    });
    const bad = /\b(a|an) (a|an|the)\b|\bthe (a|an)\b/i;          // e.g. "You catch a a harder accented voice"
    ES.game.milestones.all().forEach((m) => assert.ok(!bad.test(m.name) && !bad.test(m.text), m.id + ': ' + m.text));
    ES.game.milestones.LADDERS.forEach((row) => row[2].forEach((at) => { const t = P(row[0], row[1], at); assert.ok(!bad.test(t), row[0] + '.' + row[1] + '@' + at + ': ' + t); }));
    assert.equal(ES.game.core.phrase('an easier accented voice, +10 dB'), 'an easier accented voice');
    assert.equal(ES.game.core.phrase('clear line'), 'a clear line');
  }
};
