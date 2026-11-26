// Game layer: Progress series from the log, the hooks that reach the Chimera invitation (milestone, venue best), and
// a scan of every player-facing string in js/game for streak, lives or absence wording (R5 §6; the owner's rules).
import fs from 'node:fs';
import path from 'node:path';
import { spawnGame, trainDial } from './game-env.mjs';
import { ROOT } from './game-load.mjs';
export { setup } from './game-env.mjs';

const DAY = 86400000;

export const tests = {
  'series: one point per session and dial, estimates only, oldest first'(ES, assert) {
    const t0 = Date.UTC(2026, 9, 1);
    const log = { sessions: [
      { id: 'b', start: t0 + DAY, end: t0 + DAY + 9e5, sets: [{ ex: 'crowd', end: { tmr: -2, talkers: 1.4 }, sd: { tmr: 1.1, talkers: 0.6 }, ctxKey: 'crowd' }] },
      { id: 'a', start: t0, end: t0 + 9e5, sets: [
        { ex: 'crowd', end: { tmr: 1 }, sd: { tmr: 2 }, ctxKey: 'crowd' },
        { ex: 'crowd', end: { tmr: 0 }, sd: { tmr: 1.5 }, ctxKey: 'crowd' },
        { ex: 'far', end: { dist: 3 }, kind: 'weekly' },
        { ex: 'far', end: { dist: 4 } }] },
      { id: 'd', start: t0 + 2 * DAY, end: t0 + 2 * DAY + 1, demo: true, sets: [{ ex: 'crowd', end: { tmr: -9 }, sd: { tmr: 1 } }] }] };
    const S = ES.game.milestones.series(log);
    assert.deepEqual(S.crowd.crowd.tmr.map((p) => p.y), [0, -2], 'last set of each session; demo sessions left out');
    assert.equal(S.crowd.crowd.tmr[0].s, 1.5);
    assert.equal(S.crowd.crowd.talkers.length, 1);
    assert.equal(S.far, undefined, 'weekly and fallback entries hold trial levels, not estimates');
    assert.equal(ES.game.milestones.bestOf('crowd', 'tmr', S.crowd.crowd.tmr), -2);
    const sum = { sessions: [{ id: 'x', start: t0, end: t0 + 1, sets: [{ ex: 'far', end: { ex: 'far', dials: [{ id: 'dist', m: 4.2, s: 0.5, n: 9 }, { id: 'rt60', m: 3, s: 1, n: 0 }] } }] }] };
    assert.deepEqual(ES.game.milestones.series(sum).far.far, { dist: [{ t: t0 + 1, y: 4.2, s: 0.5 }] }, 'summary-shaped entries too');
  },
  async 'set:done → one milestone invitation at most, and a venue best invites only without the engine’s pb'(ES0, assert, env) {
    const ES = await spawnGame(env), got = [];
    ['milestone', 'pb'].forEach((k) => ES.hooks.on(k, (p) => got.push([k, p])));
    trainDial(ES, 'crowd', 'tmr', { tmr: 2, talkers: 0, similar: 0 }, Array(30).fill(1));
    ES.game.core.update((r) => { r.venues.cafe = { open: 1, best: 9 }; });
    const entry = { ex: 'crowd', n: 20, correct: 15, pb: false, ctxKey: 'crowd' };
    ES.game.record.onSet({ set: entry, index: 0, session: 's', results: [], demo: false });
    assert.ok(got.filter((g) => g[0] === 'milestone').length <= 1);
    const ms = got.find((g) => g[0] === 'milestone');
    assert.ok(ms && /^Milestone: /.test(ms[1].title) && ms[1].text.length > 10, JSON.stringify(got));
    const pb = got.find((g) => g[0] === 'pb');
    assert.ok(pb && /New best at the café/.test(pb[1].text), 'venue best invitation: ' + JSON.stringify(pb));
    got.length = 0;
    trainDial(ES, 'crowd', 'tmr', { tmr: -2, talkers: 0, similar: 0 }, Array(30).fill(1));
    ES.game.record.onSet({ set: Object.assign({}, entry, { pb: true }), index: 1, session: 's', results: [], demo: false });
    assert.equal(got.filter((g) => g[0] === 'pb').length, 0, 'the engine’s own pb already invited');
  },
  'no streak, lives or absence-warning wording in any player-facing string'(ES, assert) {
    const dir = path.join(ROOT, 'js', 'game'), bad = /\bstreaks?\b|\blives\b|\blife left|you missed|don.t break|keep (it|your) going|lose your|come back or|days? in a row|chain/i;
    fs.readdirSync(dir).filter((f) => f.endsWith('.js')).forEach((f) => {
      const src = fs.readFileSync(path.join(dir, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      const strings = src.match(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"/g) || [];
      strings.forEach((s) => assert.ok(!bad.test(s), f + ': ' + s));
    });
  },
  'every share text and the card footer name the Chimera link; texts carry no raw numbers from nowhere'(ES, assert) {
    const W = ES.game.weekly;
    for (let w = 1; w <= 52; w += 7) {
      const wk = '2027-W' + String(w).padStart(2, '0'), r = { weekly: {} };
      W.recordStop(r, wk, w % 4, '101010', 5);
      const t = W.shareText(W.result(wk, r));
      assert.ok(t.endsWith('Built by the Chimera community: https://discord.gg/chmr'), t);
    }
    const src = fs.readFileSync(path.join(ROOT, 'js', 'game', 'share.js'), 'utf8');
    assert.ok(src.includes("'Built by the Chimera community · discord.gg/chmr'"));
  }
};
