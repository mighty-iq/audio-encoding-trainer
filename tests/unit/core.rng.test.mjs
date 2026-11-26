// ES.core.rng / ES.core.hash: determinism matters (weekly challenges must be identical for every player).
export const scripts = ['js/core/ns.js', 'js/core/util.js', 'js/core/rng.js'];

export const tests = {
  'hash values are stable across versions'(ES, assert) {
    assert.equal(ES.core.hash('earshot'), 1522127520);
    assert.equal(ES.core.hash(''), 2872998923);
    assert.equal(ES.core.hash('weekly:2026-W48'), 4227295017);
  },
  'the same seed gives the same sequence; known first draws'(ES, assert) {
    const a = ES.core.rng('earshot'), b = ES.core.rng('earshot');
    const xa = [a.next(), a.next(), a.next()], xb = [b.next(), b.next(), b.next()];
    assert.deepEqual(xa, xb);
    assert.deepEqual(xa.map((x) => x.toFixed(10)), ['0.2655716219', '0.6675742376', '0.5518361819']);
    const n = ES.core.rng(42);
    assert.deepEqual([n.int(1, 6), n.int(1, 6), n.int(1, 6)], [6, 5, 2]);
  },
  'different seeds differ; numbers and their strings are different seeds'(ES, assert) {
    assert.notEqual(ES.core.rng('a').next(), ES.core.rng('b').next());
    assert.notEqual(ES.core.rng(1).next(), ES.core.rng('1').next());
  },
  'fork streams are independent of draws on the parent'(ES, assert) {
    const p1 = ES.core.rng('s'), p2 = ES.core.rng('s');
    p2.next(); p2.next(); p2.next();
    const f1 = p1.fork('items'), f2 = p2.fork('items');
    assert.deepEqual([f1.next(), f1.next()], [f2.next(), f2.next()]);
    assert.notEqual(p1.fork('a').next(), p1.fork('b').next());
  },
  'int is inclusive and covers its range evenly'(ES, assert) {
    const r = ES.core.rng('int'), counts = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 60000; i++) { const v = r.int(1, 6); assert.ok(v >= 1 && v <= 6); counts[v - 1]++; }
    counts.forEach((c) => assert.ok(Math.abs(c - 10000) < 450, 'bucket ' + c));
    assert.equal(r.int(5, 5), 5);
  },
  'next stays in [0, 1)'(ES, assert) {
    const r = ES.core.rng('unit');
    for (let i = 0; i < 20000; i++) { const x = r.next(); assert.ok(x >= 0 && x < 1); }
  },
  'shuffle returns a permutation and leaves the input alone'(ES, assert) {
    const r = ES.core.rng('sh'), a = [1, 2, 3, 4, 5, 6, 7, 8];
    const s = r.shuffle(a);
    assert.deepEqual(a, [1, 2, 3, 4, 5, 6, 7, 8]);
    assert.deepEqual(s.slice().sort((x, y) => x - y), a);
    assert.equal(r.shuffle([]).length, 0);
  },
  'weighted respects zero weights and proportions'(ES, assert) {
    const r = ES.core.rng('w'), n = { a: 0, b: 0, c: 0 };
    for (let i = 0; i < 30000; i++) n[r.weighted(['a', 'b', 'c'], [1, 0, 3])]++;
    assert.equal(n.b, 0);
    assert.ok(Math.abs(n.c / n.a - 3) < 0.25);
    assert.ok(['x', 'y'].includes(r.weighted(['x', 'y'], [0, 0])));
    assert.equal(r.pick([]), undefined);
  }
};
