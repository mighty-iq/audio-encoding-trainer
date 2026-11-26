// ES.core.util: formatting with true minus signs, ISO weeks, equality, statistics.
export const scripts = ['js/core/ns.js', 'js/core/util.js'];
const at = (y, m, d) => new Date(y, m - 1, d, 12).getTime();

export const tests = {
  'fmtDb uses a true minus sign and at most one decimal'(ES, assert) {
    const U = ES.core.util;
    assert.equal(U.fmtDb(-6), '−6 dB');
    assert.equal(U.fmtDb(2.5), '+2.5 dB');
    assert.equal(U.fmtDb(0), '0 dB');
    assert.equal(U.fmtDb(-0.04), '0 dB');
    assert.equal(U.fmtDb(-12.25), '−12.3 dB');
    assert.equal(U.fmtDb(NaN), '– dB');
  },
  'fmtM and fmtClock'(ES, assert) {
    const U = ES.core.util;
    assert.equal(U.fmtM(12), '12 m');
    assert.equal(U.fmtM(1.5), '1.5 m');
    assert.equal(U.fmtM(32.4), '32 m');
    assert.equal(U.fmtClock(125000), '2:05');
    assert.equal(U.fmtClock(0), '0:00');
  },
  'weekKey follows ISO-8601 weeks'(ES, assert) {
    const U = ES.core.util;
    assert.equal(U.weekKey(at(2026, 1, 1)), '2026-W01');
    assert.equal(U.weekKey(at(2026, 12, 31)), '2026-W53');
    assert.equal(U.weekKey(at(2027, 1, 3)), '2026-W53');
    assert.equal(U.weekKey(at(2027, 1, 4)), '2027-W01');
    assert.equal(U.weekKey(at(2021, 1, 3)), '2020-W53');
    assert.equal(U.weekKey(at(2026, 11, 26)), '2026-W48');
    assert.equal(U.dayKey(at(2026, 3, 9)), '2026-03-09');
  },
  'deepEqual ignores undefined fields and compares arrays in order'(ES, assert) {
    const U = ES.core.util;
    assert.ok(U.deepEqual({ a: 1, b: undefined }, { a: 1 }));
    assert.ok(U.deepEqual([1, { x: [2] }], [1, { x: [2] }]));
    assert.ok(!U.deepEqual([1, 2], [2, 1]));
    assert.ok(!U.deepEqual({ a: 1 }, { a: '1' }));
    assert.ok(U.deepEqual(NaN, NaN));
  },
  'statistics and helpers'(ES, assert) {
    const U = ES.core.util;
    assert.equal(U.mean([1, 2, 3]), 2);
    assert.ok(Number.isNaN(U.mean([])));
    assert.equal(U.round(U.sd([2, 4, 4, 4, 5, 5, 7, 9]), 4), 2.1381);
    assert.equal(U.clamp(5, 0, 3), 3);
    assert.equal(U.plural(1, 'session'), '1 session');
    assert.equal(U.plural(2, 'entry', 'entries'), '2 entries');
    assert.ok(U.badKey('__proto__') && U.badKey('constructor') && !U.badKey('toString'));
    assert.match(U.uid('s'), /^s_[0-9a-z]+$/);
    assert.notEqual(U.uid('s'), U.uid('s'));
  }
};
