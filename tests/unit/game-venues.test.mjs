// Game layer: the Night out map's logic (js/game/data.js, core.js, venues.js).
import { spawnGame, trainDial } from './game-env.mjs';
export { setup } from './game-env.mjs';

const DAY = 86400000;
function crowdAt(ES, n, tmr, prop) { return trainDial(ES, 'crowd', 'tmr', { tmr, talkers: 0, similar: 0 }, Array(n).fill(prop)); }

export const tests = {
  'twelve venues on three lines, ids as the exercise modules use them'(ES, assert) {
    const ids = ES.game.data.ids;
    assert.deepEqual(ids.slice().sort(), ['bar', 'cafe', 'cathedral', 'club', 'concert', 'lecture', 'park', 'party', 'phone', 'restaurant', 'stadium', 'station']);
    assert.deepEqual(ES.game.data.LINES.map((l) => l.venues.length), [6, 5, 1]);
    ES.game.data.VENUES.forEach((v) => {
      if (v.opens) assert.ok(ES.game.data.venue(v.opens.from).line === v.line, v.id + ' opens from its own line');
    });
  },
  'every pin and threshold is a valid level of an existing dial'(ES, assert) {
    const E = ES.engine;
    ES.game.data.VENUES.forEach((v) => {
      [v.head].concat(v.also).forEach((c) => {
        const d = E.dialDef(c.ex, c.dial);
        assert.ok(d, v.id + ': dial ' + c.ex + '.' + c.dial);
        Object.keys(c.pin).forEach((k) => {
          const p = E.dialDef(c.ex, k);
          assert.ok(p, v.id + ': pin ' + c.ex + '.' + k);
          assert.ok(c.pin[k] >= p.min && c.pin[k] <= p.max, v.id + ': pin in range ' + k);
        });
      });
      if (v.opens) {
        const from = ES.game.data.venue(v.opens.from), d = E.dialDef(from.head.ex, from.head.dial);
        assert.ok(v.opens.at >= d.min && v.opens.at <= d.max, v.id + ': threshold in range');
      }
    });
  },
  'a fresh profile shows nothing invented: no earshot anywhere, three venues open'(ES, assert) {
    const st = ES.game.venues.state();
    st.forEach((s) => assert.equal(s.earshot.status, 'none', s.id));
    assert.deepEqual(st.filter((s) => s.open).map((s) => s.id).sort(), ['cafe', 'lecture', 'phone']);
    assert.equal(st.filter((s) => s.newly).length, 0);
    const nx = ES.game.venues.next();
    assert.ok(/Three venues are open/.test(nx.text));
    assert.equal(ES.game.venues.meaning(ES.game.data.venue('cafe').head, st[0].earshot).indexOf('Not measured yet'), 0);
  },
  async 'earshot appears in real units after trials and moves with ability'(ES0, assert, env) {
    const ES = await spawnGame(env);
    crowdAt(ES, 30, 0, 1);
    const e1 = ES.game.venues.earshot('cafe');
    assert.equal(e1.status, 'in');
    assert.ok(/dB$/.test(e1.text) && /^[+−]?\d/.test(e1.text), e1.text);
    const ES2 = await spawnGame(env);
    crowdAt(ES2, 30, 0, 0.5);
    const e2 = ES2.game.venues.earshot('cafe');
    assert.ok(e2.status === 'below' || e1.x < e2.x, 'more right answers at 0 dB → a harder (lower) earshot: ' + e1.x + ' vs ' + e2.x);
  },
  async 'openings follow the rule, are stored, and are never undone'(ES0, assert, env) {
    const ES = await spawnGame(env);
    crowdAt(ES, 40, -3, 1);
    const cafe = ES.game.venues.earshot('cafe');
    assert.ok(cafe.x <= 0, 'café earshot reaches 0 dB: ' + cafe.text);
    const st = ES.game.venues.state(), rest = st.find((s) => s.id === 'restaurant');
    assert.ok(rest.open && rest.newly, 'restaurant opens');
    ES.game.core.update((r) => { r.venues.restaurant = { open: 123 }; });
    crowdAt(ES, 60, 9, 0);                                  // a terrible run afterwards
    const again = ES.game.venues.state().find((s) => s.id === 'restaurant');
    assert.ok(again.open && !again.newly && again.openedAt === 123, 'stays open');
  },
  async 'time away never shrinks an earshot (no day-drift on game screens)'(ES0, assert, env) {
    const ES = await spawnGame(env);
    crowdAt(ES, 30, 0, 1);
    const before = ES.game.venues.earshot('cafe').x;
    const rec = ES.engine.learner.state.dials['crowd.tmr'];
    rec.at -= 25 * DAY;
    assert.equal(ES.game.venues.earshot('cafe').x, before);
  },
  'descriptions and rules quote the dial definitions'(ES, assert) {
    const V = ES.game.venues, D = ES.game.data;
    assert.equal(V.describe(D.venue('lecture').head), '0.6 s of echo · speech 21 dB above the noise');
    assert.equal(V.describe(D.venue('cafe').head, { headphones: false }), '1 other voice · of the other sex');
    assert.equal(V.describe(D.venue('cafe').head, { headphones: true }), '1 other voice · of the other sex · 90° apart');
    assert.ok(/at the café reaches \+4 dB or better and the restaurant itself is within reach/.test(V.ruleText('restaurant')), V.ruleText('restaurant'));
    assert.ok(/at the lecture hall reaches 2 m or better/.test(V.ruleText('park')), V.ruleText('park'));
    assert.equal(V.ruleText('cafe'), 'Open from the start.');
  },
  'a venue plan pins the venue’s dials and targets its headline dial'(ES, assert) {
    const p = ES.game.venues.plan('bar');
    assert.equal(p.kind, 'venue');
    assert.equal(p.sets.length, 1);
    const s = p.sets[0];
    assert.equal(s.exId, 'crowd'); assert.equal(s.focus, 'tmr'); assert.equal(s.venue, 'bar');
    assert.deepEqual(s.pin, { talkers: 1, similar: 1 }, 'no spatial pin without headphones');
    assert.deepEqual(p.done, { name: 'venue', params: { id: 'bar', after: true } });
  },
  async 'a venue set runs through the engine with the venue’s pins held'(ES0, assert, env) {
    const ES = await spawnGame(env);
    crowdAt(ES, 20, 3, 1);
    const s = ES.game.venues.plan('restaurant').sets[0], E = ES.engine;
    assert.ok(E.controller.supports && E.controller.supports.pin, 'the engine honours pins');
    const sc = E.flow.start(s.exId, { mode: 'edge', seed: 'venue-test', headphones: false, kind: s.kind, pin: s.pin, focus: s.focus, trials: 8 });
    let spec, i = 0;
    while ((spec = E.flow.next(sc))) {
      assert.equal(spec.setting.dials.talkers, 0, 'talkers pinned');
      assert.ok(spec.setting.dials.similar <= 1, 'similarity pinned (or eased by the floor)');
      const picks = spec.question.slots.map((x) => (i % 3 ? x.answer : x.options.find((o) => o !== x.answer)));
      E.flow.answer(sc, spec, { picks }); i++;
    }
    assert.equal(i, 8);
  }
};
