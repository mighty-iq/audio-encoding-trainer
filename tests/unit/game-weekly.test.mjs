// Game layer: the Weekly Night Out (js/game/weekly.js) — identical for everyone, independent of the player's record,
// share text always with the Chimera link, first complete run = the week's card.
import { spawnGame, trainDial } from './game-env.mjs';
export { setup } from './game-env.mjs';

const json = (x) => JSON.stringify(x);
function allTrials(ES, wk) { return [0, 1, 2, 3].map((k) => ES.game.weekly.trials(wk, k)); }

export const tests = {
  'week keys are ISO weeks of the local calendar'(ES, assert) {
    const W = ES.game.weekly;
    assert.equal(W.weekKey(new Date(2026, 0, 1, 12).getTime()), '2026-W01');     // Thursday 1 Jan 2026
    assert.equal(W.weekKey(new Date(2026, 10, 26, 12).getTime()), '2026-W48');
    assert.equal(W.weekKey(new Date(2027, 0, 3, 12).getTime()), '2026-W53');     // Sunday after a 53-week year
    assert.ok(W.validWeek('2026-W48') && !W.validWeek('2026-48') && !W.validWeek(null));
    assert.equal(W.weekLabel('2026-W08'), 'Week 8, 2026');
  },
  'a route has four stops, one per exercise, ramps easy → hard within each dial'(ES, assert) {
    for (const wk of ['2026-W48', '2026-W49', '2027-W01', '2030-W20']) {
      const rt = ES.game.weekly.route(wk);
      assert.deepEqual(rt.stops.map((s) => s.ex).sort(), ['crowd', 'far', 'repair', 'strange']);
      rt.stops.forEach((s) => {
        const d = ES.engine.dialDef(s.ex, s.dial);
        assert.equal(s.ramp.length, 6);
        s.ramp.forEach((x, i) => {
          assert.ok(x >= d.min && x <= d.max, wk + ' ' + s.ex + ' rung in range');
          if (i) assert.ok(d.dir * (x - s.ramp[i - 1]) > 0, wk + ' ' + s.ex + ' each rung harder');
        });
        assert.ok(!('space' in s.pins), 'no headphone-only dial');
      });
    }
  },
  async 'same week → identical trials in two separate runs; another week differs'(ES0, assert, env) {
    const A = await spawnGame(env), B = await spawnGame(env);
    const ta = allTrials(A, '2026-W48'), tb = allTrials(B, '2026-W48');
    assert.equal(json(ta), json(tb));
    assert.equal(ta.flat().length, 24);
    const tc = allTrials(B, '2026-W49');
    assert.notEqual(json(tc), json(ta));
    assert.equal(json(A.game.weekly.route('2026-W48')), json(B.game.weekly.route('2026-W48')));
  },
  async 'the player’s record and settings change nothing in the challenge'(ES0, assert, env) {
    const A = await spawnGame(env), B = await spawnGame(env);
    trainDial(B, 'crowd', 'tmr', { tmr: -6, talkers: 1, similar: 1 }, Array(40).fill(1));
    trainDial(B, 'far', 'dist', { dist: 6, rt60: 3, noise: 9 }, Array(40).fill(0.5));
    B.core.store.update('profile', (p) => { p.settings.headphones = true; p.settings.mode = 'variety'; });
    B.engine.learner.state.seed = 'someone-else';
    B.engine.learner.state.breadth = { crowd: 1, far: 1, strange: 1, repair: 1 };
    assert.equal(json(allTrials(B, '2026-W48')), json(allTrials(A, '2026-W48')));
  },
  'every trial is a playable TrialSpec tagged with its stop and rung'(ES, assert) {
    allTrials(ES, '2026-W48').forEach((stop, k) => stop.forEach((t, i) => {
      assert.deepEqual(t.meta.weekly, { week: '2026-W48', stop: k, rung: i });
      assert.ok(t.question.slots.length >= 1 && t.audio.parts.length >= 1, 'trial ' + k + '.' + i);
      assert.equal(t.setting.anchor, false); assert.equal(t.setting.warmup, false);
      assert.ok(/^Stop \d of 4 · /.test(t.meta.levelText));
    }));
    assert.equal(ES.game.weekly.available('2026-W48').ok, true);
  },
  'share text always carries the Chimera link, with or without results'(ES, assert) {
    const W = ES.game.weekly;
    for (const wk of ['2026-W48', '2026-W50', '2027-W10']) {
      const empty = W.result(wk, { weekly: {} });
      assert.ok(W.shareText(empty).includes('https://discord.gg/chmr'));
      const r = { weekly: {} };
      [0, 1, 2, 3].forEach((k) => W.recordStop(r, wk, k, k % 2 ? '111010' : '110000', 1000 + k));
      const res = W.result(wk, r), txt = W.shareText(res, { nickname: 'Kestrel' });
      assert.ok(txt.includes('https://discord.gg/chmr'));
      assert.ok(txt.includes(wk) && txt.includes('Kestrel') && txt.includes('✓✓✓✕✓✕'));
      assert.ok(txt.includes('12/24'), txt);
      assert.ok(!/Infinity|NaN|undefined/.test(txt));
      assert.ok(txt.split('\n').length <= 8, 'short enough for a chat message');
    }
  },
  'the first complete run is the card; later runs are practice'(ES, assert) {
    const W = ES.game.weekly, r = { weekly: {} };
    [0, 1, 2].forEach((k) => W.recordStop(r, '2026-W48', k, '111100', 10 + k));
    assert.equal(W.result('2026-W48', r).complete, false);
    const last = W.recordStop(r, '2026-W48', 3, '100000', 20);
    assert.ok(last.complete && !last.practice);
    const cardOf = (x) => json({ stops: x.stops, right: x.right, n: x.n, at: x.at, complete: x.complete });
    const card = cardOf(W.result('2026-W48', r));
    const again = W.recordStop(r, '2026-W48', 0, '111111', 30);
    assert.ok(again.practice);
    assert.equal(cardOf(W.result('2026-W48', r)), card);
    assert.equal(W.result('2026-W48', r).practice.length, 1, 'the practice run is kept apart');
    assert.equal(W.result('2026-W48', r).right, 13);
  },
  'the plan holds the stops still to play, each with its six fixed trials'(ES, assert) {
    const W = ES.game.weekly, r = { weekly: {} };
    W.recordStop(r, '2026-W48', 1, '110000', 5);
    const p = W.plan('2026-W48', { rec: r });
    assert.equal(p.kind, 'weekly');
    assert.deepEqual(p.sets.map((s) => s.stop), [0, 2, 3]);
    const s0 = p.sets[0], t = s0.make(2);
    assert.equal(json(t), json(W.trials('2026-W48', 0)[2]));
    t.question.prompt = 'changed';
    assert.notEqual(W.trials('2026-W48', 0)[2].question.prompt, 'changed', 'make() hands out copies');
  }
};
