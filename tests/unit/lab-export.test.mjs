// Lab exports and import: backup round trip, every older shape, damaged files, CSV, the pooled community format.
export const scripts = ['js/core/ns.js', 'js/core/util.js', 'js/core/rng.js', 'js/core/store-schema.js', 'js/core/store.js', 'tests/fixtures/lab-data.js',
  'js/lab/stats.js', 'js/lab/materials.js', 'js/lab/procedures.js', 'js/lab/probes.js', 'js/lab/probes-more.js',
  'js/lab/schedule.js', 'js/lab/records.js', 'js/lab/export.js'];

const DAY = 864e5, T0 = Date.UTC(2026, 10, 2, 18, 0);
function seed(ES) {
  const s = ES.core.store;
  s.update('profile', (p) => { p.nickname = 'ear-owl'; p.settings.mode = 'focus'; });
  s.update('lab', (r) => {
    r.runs = [
      { id: 'run_a', probe: 'matrix', at: T0, end: T0 + 180000, practice: true, kind: 'baseline', proc: 'matrix-1', est: { m: -4.5, s: 0.6 }, n: 20, unit: 'dB', trials: [[0, 2, 5, 5, 0]], hp: false },
      { id: 'run_b', probe: 'matrix', at: T0 + DAY, end: T0 + DAY + 175000, practice: false, kind: 'baseline', proc: 'matrix-1', est: { m: -6.1, s: 0.5 }, n: 20, unit: 'dB', trials: [], hp: false },
      { id: 'run_c', probe: 'rooms', at: T0 + 2 * DAY, practice: true, kind: 'baseline', proc: 'rooms-1', est: { m: 15.05, s: 2 }, n: 12, unit: 'dB*', extra: { metres: 5.66, note: 'x' } },
      { id: 'run_d', probe: 'story', at: T0 + 3 * DAY, practice: true, kind: 'baseline', est: { m: 80, s: 18 }, n: 1, extra: { story: 'story-f0', effort: 4 } }
    ];
    r.pid = 'p0123456789';
  });
  s.update('log', (l) => { l.sessions = [{ id: 'sess_1', start: T0 - 3600e3, end: T0 - 2700e3, activeMs: 840000, mode: 'edge', sets: [{ ex: 'crowd', n: 20, correct: 14 }, { ex: 'far', n: 20, correct: 12 }] }]; });
  s.update('diary', (d) => { d.entries = [{ week: '2026-W45', at: T0 + 3 * DAY, items: [{ id: 'loud', v: 2 }, { id: 'far', v: 4 }, { id: 'unusual', v: null }, { id: 'memory', v: 3 }, { id: 'effort', v: 3 }] }]; });
}
const strip = (rec) => JSON.parse(JSON.stringify(rec));

export const tests = {
  'backup round trip: export, delete everything, import → the same records'(ES, assert) {
    return ES.core.store.init({ force: true }).then(() => {
      seed(ES);
      const before = { lab: strip(ES.core.store.get('lab')), log: strip(ES.core.store.get('log')), diary: strip(ES.core.store.get('diary')), profile: strip(ES.core.store.get('profile')) };
      const file = ES.lab.exporter.json();
      assert.equal(file.obj.format, 'earshot-backup');
      assert.equal(file.obj.fv, 1);
      assert.ok(!('playtest' in file.obj.records), 'the playtest record is never in a backup');
      ES.core.store.wipe();
      assert.equal(ES.core.store.get('lab').runs.length, 0);
      const rep = ES.lab.exporter.importJson(file.text);
      assert.ok(rep.ok, rep.message);
      ['lab', 'log', 'diary'].forEach((k) => assert.deepEqual(strip(ES.core.store.get(k)), before[k], k));
      assert.equal(ES.core.store.get('profile').nickname, 'ear-owl');
      assert.ok(/Nothing on this device was deleted/.test(rep.message));
    });
  },
  'older shapes import: a backup without a version, bare records, a localStorage dump, old run fields'(ES, assert) {
    return ES.core.store.init({ force: true }).then(() => {
      const runs = [{ id: 'old1', probe: 'digits', at: T0, practice: true, m: -8, sd: 0.9 }, { id: 'old2', probe: 'digits', at: T0 + DAY, m: -9, sd: 0.8 }];
      let rep = ES.lab.exporter.importJson(JSON.stringify({ app: 'Earshot', records: { lab: { runs } } }));
      assert.ok(rep.ok && rep.kind === 'backup0', JSON.stringify(rep));
      const list = ES.lab.records.runsOf(ES.lab.records.all(), 'digits');
      assert.deepEqual(list.map((r) => [r.id, r.est.m, r.est.s, r.unit]), [['old1', -8, 0.9, 'dB'], ['old2', -9, 0.8, 'dB']]);
      ES.core.store.wipe();
      rep = ES.lab.exporter.importJson(JSON.stringify({ lab: { v: 1, runs: [runs[0]] }, diary: { entries: [] } }));
      assert.ok(rep.ok && rep.kind === 'records', JSON.stringify(rep));
      ES.core.store.wipe();
      const env = JSON.stringify({ rev: 3, at: T0, by: 'tab', rec: { v: 1, runs: [runs[1]] } });
      rep = ES.lab.exporter.importJson(JSON.stringify({ 'earshot.v1.lab': env }));
      assert.ok(rep.ok && rep.kind === 'storage', JSON.stringify(rep));
      assert.equal(ES.lab.records.all()[0].id, 'old2');
    });
  },
  'damaged and wrong files are refused or repaired safely, nothing is deleted'(ES, assert) {
    return ES.core.store.init({ force: true }).then(() => {
      seed(ES);
      const good = ES.lab.exporter.json().text, n0 = ES.core.store.get('lab').runs.length;
      const X = ES.lab.exporter;
      assert.equal(X.importJson(good.slice(0, Math.floor(good.length / 2))).kind, 'damaged');
      assert.equal(X.importJson('').kind, 'empty');
      assert.equal(X.importJson('run_id,probe\n1,matrix').kind, 'csv');
      assert.equal(X.importJson(JSON.stringify({ format: 'earshot-pooled', fv: 1, probes: [] })).kind, 'pooled');
      assert.equal(X.importJson(JSON.stringify({ format: 'earshot-backup', fv: 9, records: {} })).kind, 'newer');
      assert.equal(X.importJson(JSON.stringify({ hello: 'world' })).kind, 'unknown');
      assert.equal(ES.core.store.get('lab').runs.length, n0, 'nothing changed');
      // one damaged record inside a backup: the rest still imports and the report says so
      const obj = JSON.parse(good); obj.records.diary = '{broken'; obj.records.lab.runs.push({ id: 'new1', probe: 'matrix', at: T0 + 9 * DAY, est: { m: -7, s: 0.5 } });
      const rep = X.importJson(JSON.stringify(obj));
      assert.ok(rep.ok, rep.message);
      assert.ok(rep.skipped.some((s) => s.key === 'diary'), JSON.stringify(rep.skipped));
      assert.equal(ES.core.store.get('lab').runs.length, n0 + 1);
      // prototype pollution attempts change nothing
      X.importJson('{"records":{"lab":{"runs":[],"__proto__":{"polluted":1}},"__proto__":{"polluted":2}}}');
      assert.equal(({}).polluted, undefined);
      // BOM and surrounding text are tolerated
      assert.ok(X.importJson('﻿  ' + good + '\n').ok);
    });
  },
  'CSV: one row per run and per session; quotes, commas and formula-like text are safe'(ES, assert) {
    return ES.core.store.init({ force: true }).then(() => {
      seed(ES);
      ES.core.store.update('lab', (r) => { r.runs.push({ id: '=cmd|x', probe: 'matrix', at: T0 + 5 * DAY, kind: 'extra', est: { m: -6.4, s: 0.5 }, n: 20, proc: 'a,"b"' }); });
      const runs = ES.lab.exporter.csv('runs'), lines = runs.text.trim().split('\r\n');
      assert.equal(lines[0].split(',')[0], 'run_id');
      assert.equal(lines.length, 1 + 5);
      assert.ok(lines.some((l) => l.startsWith("'=cmd|x,")), 'formula guard');
      assert.ok(lines.some((l) => l.includes('"a,""b"""')), 'quotes and commas escaped');
      assert.ok(lines.some((l) => /,-6\.1,0\.5,dB,−6\.1 dB,/.test(l)), 'numbers stay numbers; shown value in units');
      assert.ok(lines.some((l) => l.includes(',5.7 m,')), 'rooms shown in metres');
      const ses = ES.lab.exporter.csv('sessions').text.trim().split('\r\n');
      assert.equal(ses.length, 2);
      assert.ok(ses[1].includes(',14,') && ses[1].includes(',40,26,crowd far,'), ses[1]);
      assert.ok(/^[\w-]+\.csv$/.test(runs.name));
    });
  },
  'pooled format: no ids, no name, no device facts unless switched on; days relative to the start'(ES, assert) {
    return ES.core.store.init({ force: true }).then(() => {
      seed(ES);
      const X = ES.lab.exporter, plain = X.pooled({}), text = plain.text, o = plain.obj;
      assert.equal(o.format, 'earshot-pooled');
      assert.equal(o.pid, 'p0123456789');
      assert.ok(!('nickname' in o) && !text.includes('ear-owl'), 'no nickname unless ticked');
      assert.ok(!('device' in o) && !/userAgent|"ua"|"tz"|"lang"/.test(text), 'no device facts unless switched on');
      ['run_a', 'run_b', 'sess_1'].forEach((id) => assert.ok(!text.includes(id), 'no record id ' + id));
      assert.ok(!text.includes(String(T0)) && !text.includes(new Date(T0).toISOString()), 'no absolute times');
      assert.deepEqual(o.probes.map((p) => p.day), [1 / 24, 1 + 1 / 24, 2 + 1 / 24, 3 + 1 / 24].map((d) => Math.round(d * 100) / 100));
      assert.equal(o.training[0].week, 0); assert.equal(o.training[0].sessions, 1); assert.equal(o.training[0].activeMin, 14);
      assert.deepEqual(o.diary[0].items, { loud: 2, far: 4, unusual: null, memory: 3, effort: 3 });
      assert.ok(o.probes[2].extra.metres === 5.66 && !('note' in o.probes[2].extra), 'only known numeric extras');
      const withNick = X.pooled({ nickname: true, device: true }).obj;
      assert.equal(withNick.nickname, 'ear-owl');
      assert.ok(withNick.device && 'ua' in withNick.device && 'tz' in withNick.device);
      assert.equal(X.importJson(text).kind, 'pooled');
    });
  },
  'display values match the units of each probe'(ES, assert) {
    const X = ES.lab.exporter;
    assert.equal(X.showValue('matrix', -6.14), '−6.1 dB');
    assert.equal(X.showValue('rooms', 6.02 * 3), '8 m');
    assert.equal(X.showValue('rooms', 6.02 * 4), '16 m');
    assert.equal(X.showValue('newvoice', 61.4), '61\u00a0%');
    assert.equal(X.showValue('diary', 3.25), '3.3 of 5');
  }
};
