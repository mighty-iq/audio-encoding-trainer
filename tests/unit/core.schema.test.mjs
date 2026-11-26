// ES.core.storeSchema: the schema guard (repairs, never throws, passes unknown fields) and the 3-way merge.
export const scripts = ['js/core/ns.js', 'js/core/util.js', 'js/core/store-schema.js'];

export const tests = {
  'defaults for every key carry v and the documented fields'(ES, assert) {
    const SC = ES.core.storeSchema;
    const p = SC.defaultRecord('profile');
    assert.equal(p.v, 1);
    assert.equal(p.settings.mode, 'edge');
    assert.equal(p.settings.sessionMin, 15);
    assert.equal(p.settings.theme, 'system');
    assert.deepEqual(SC.defaultRecord('trials').rows, []);
    for (const k of Object.keys(SC.SCHEMAS)) assert.equal(SC.defaultRecord(k).v, SC.current(k));
  },
  'wrong types are repaired, ranges clamped, unknown fields kept'(ES, assert) {
    const SC = ES.core.storeSchema, rep = { fixed: 0, dropped: 0 };
    const r = SC.sanitizeRecord('profile', { v: 1, nickname: 42, settings: { theme: 'neon', sessionMin: '20', mode: 'path', extra: { a: 1 } },
      tutorials: { crowd: true, far: 'yes' }, future: [1, 2] }, rep);
    assert.equal(r.nickname, '42');
    assert.equal(r.settings.theme, 'system');
    assert.equal(r.settings.sessionMin, 20);
    assert.equal(r.settings.mode, 'path');
    assert.deepEqual(r.settings.extra, { a: 1 });
    assert.deepEqual(r.future, [1, 2]);
    assert.ok(rep.fixed >= 3);
    const c = SC.sanitizeRecord('profile', { settings: { sessionMin: 999 } });
    assert.equal(c.settings.sessionMin, 60);
  },
  'garbage never throws and yields defaults'(ES, assert) {
    const SC = ES.core.storeSchema;
    for (const bad of [null, undefined, 7, 'x', [], [1, 2], { settings: 'no' }, { sessions: 'no' }]) {
      for (const k of Object.keys(SC.SCHEMAS)) { const r = SC.sanitizeRecord(k, bad); assert.equal(r.v, SC.current(k)); }
    }
    let deep = {}; const top = deep;
    for (let i = 0; i < 200; i++) { deep.x = {}; deep = deep.x; }
    assert.doesNotThrow(() => SC.sanitizeRecord('game', { venues: { a: top } }));
  },
  'prototype keys are dropped'(ES, assert) {
    const SC = ES.core.storeSchema;
    const evil = JSON.parse('{"v":1,"__proto__":{"polluted":1},"tutorials":{"__proto__":{"p":1},"crowd":true},"settings":{"constructor":{"x":1}}}');
    const r = SC.sanitizeRecord('profile', evil);
    const vmObjectProto = Object.getPrototypeOf(ES.core);
    assert.equal(vmObjectProto.polluted, undefined);
    assert.equal(r.polluted, undefined);
    assert.equal(Object.getPrototypeOf(r), vmObjectProto);
    assert.equal(r.tutorials.crowd, true);
    assert.ok(!Object.prototype.hasOwnProperty.call(r.tutorials, '__proto__'));
    assert.ok(!Object.prototype.hasOwnProperty.call(r.settings, 'constructor'));
  },
  'lists dedupe by id, sort and cap; rows keep the newest'(ES, assert) {
    const SC = ES.core.storeSchema;
    const log = SC.sanitizeRecord('log', { sessions: [{ id: 'b', start: 20 }, { id: 'a', start: 10 }, { id: 'b', start: 20, end: 30 }, 'junk', null] });
    assert.deepEqual(log.sessions.map((s) => s.id), ['a', 'b']);
    assert.equal(log.sessions[1].end, 30);
    const rows = []; for (let i = 0; i < 3100; i++) rows.push([i, 'crowd', 'tmr', -i / 10, 1, 1, 0]);
    rows.push(['bad'], [5]);
    const t = SC.sanitizeRecord('trials', { rows });
    assert.equal(t.rows.length, 3000);
    assert.equal(t.rows[0][0], 100);
    assert.equal(t.rows[2999][0], 3099);
  },
  'merge3: a side that did not change a field yields'(ES, assert) {
    const SC = ES.core.storeSchema;
    const base = SC.defaultRecord('profile');
    const ours = JSON.parse(JSON.stringify(base)); ours.settings.theme = 'dark';
    const theirs = JSON.parse(JSON.stringify(base)); theirs.settings.sessionMin = 20;
    const m = SC.mergeRecord('profile', base, ours, theirs, { oursNewer: false });
    assert.equal(m.settings.theme, 'dark');
    assert.equal(m.settings.sessionMin, 20);
  },
  'merge3: both changed → field rules (lww, max, or, newest)'(ES, assert) {
    const SC = ES.core.storeSchema;
    const base = SC.defaultRecord('profile');
    const ours = JSON.parse(JSON.stringify(base)), theirs = JSON.parse(JSON.stringify(base));
    ours.settings.theme = 'dark'; theirs.settings.theme = 'light';
    ours.welcomeSeen = 5; theirs.welcomeSeen = 9;
    ours.tutorials.crowd = true; theirs.tutorials.far = true;
    assert.equal(SC.mergeRecord('profile', base, ours, theirs, { oursNewer: true }).settings.theme, 'dark');
    const m = SC.mergeRecord('profile', base, ours, theirs, { oursNewer: false });
    assert.equal(m.settings.theme, 'light');
    assert.equal(m.welcomeSeen, 9);
    assert.deepEqual(m.tutorials, { crowd: true, far: true });
    const lb = { v: 1, dials: { 'crowd.tmr': { m: 0, s: 2, n: 5, at: 100 } } };
    const lo = { v: 1, dials: { 'crowd.tmr': { m: -1, s: 1.5, n: 9, at: 300 } } };
    const lt = { v: 1, dials: { 'crowd.tmr': { m: -2, s: 1.8, n: 7, at: 200 } } };
    assert.deepEqual(SC.mergeRecord('learner', lb, lo, lt, { oursNewer: false }).dials['crowd.tmr'], { m: -1, s: 1.5, n: 9, at: 300 });
  },
  'merge3: lists union by id; rows union; deletions stick'(ES, assert) {
    const SC = ES.core.storeSchema;
    const base = { v: 1, sessions: [{ id: 'a', start: 1, end: 2 }] };
    const ours = { v: 1, sessions: [{ id: 'a', start: 1, end: 2 }, { id: 'b', start: 3, end: 4 }] };
    const theirs = { v: 1, sessions: [{ id: 'a', start: 1, end: 2 }, { id: 'c', start: 5, end: 6 }] };
    assert.deepEqual(SC.mergeRecord('log', base, ours, theirs, {}).sessions.map((s) => s.id), ['a', 'b', 'c']);
    const rb = { v: 1, rows: [[1, 'x', '', 0, 1, 1, 0], [2, 'x', '', 0, 1, 1, 0]] };
    const ro = { v: 1, rows: [[2, 'x', '', 0, 1, 1, 0], [3, 'x', '', 0, 0, 0, 0]] };
    const rt = { v: 1, rows: [[1, 'x', '', 0, 1, 1, 0], [2, 'x', '', 0, 1, 1, 0], [4, 'x', '', 0, 1, 1, 0]] };
    assert.deepEqual(SC.mergeRecord('trials', rb, ro, rt, {}).rows.map((r) => r[0]), [2, 3, 4]);
    const mb = { v: 1, tutorials: { crowd: true } }, mo = { v: 1, tutorials: {} }, mt = { v: 1, tutorials: { crowd: true } };
    assert.deepEqual(SC.merge3(SC.descOf('profile'), mb, mo, mt, {}).tutorials, {});
  },
  'migrate flags newer records and leaves current ones alone'(ES, assert) {
    const SC = ES.core.storeSchema;
    assert.equal(SC.migrate('profile', { v: 2 }).newer, true);
    assert.equal(SC.migrate('profile', { v: 1, a: 1 }).newer, false);
    assert.equal(SC.migrate('profile', { a: 1 }).rec.a, 1);
  }
};
