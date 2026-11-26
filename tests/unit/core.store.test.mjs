// ES.core.store: persistence, blocked and full storage, newer versions, corrupt data, two tabs, import/export.
export const scripts = ['js/core/ns.js', 'js/core/util.js', 'js/core/rng.js', 'js/core/store-schema.js', 'js/core/store-merge.js', 'js/core/store.js'];
const P = 'earshot.v1.';
const env1 = (env, storage) => env.spawn({ storage });

export const tests = {
  async 'persistent: set/get round trip in a versioned envelope'(ES0, assert, env) {
    const st = env.makeStorage(), { ES } = env1(env, st);
    const r = await ES.core.store.init();
    assert.deepEqual(r, { mode: 'persistent', reason: 'ok' });
    assert.equal(ES.core.store.update('profile', (p) => { p.settings.theme = 'dark'; }), true);
    const raw = JSON.parse(st.getItem(P + 'profile'));
    assert.ok(raw.rev >= 1 && raw.at > 0 && raw.by && raw.rec.v === 1);
    assert.equal(raw.rec.settings.theme, 'dark');
    const copy = ES.core.store.get('profile');
    copy.settings.theme = 'light';
    assert.equal(ES.core.store.get('profile').settings.theme, 'dark', 'get returns a copy');
    assert.equal(ES.core.store.status().saved, true);
  },
  async 'blocked storage → memory mode, nothing thrown, lasting not-saved state'(ES0, assert, env) {
    const { ES } = env1(env, null);
    const r = await ES.core.store.init();
    assert.deepEqual(r, { mode: 'memory', reason: 'blocked' });
    assert.equal(ES.core.store.set('profile', { nickname: 'x' }), false);
    assert.equal(ES.core.store.get('profile').nickname, 'x');
    const s = ES.core.store.status();
    assert.equal(s.saved, false);
    assert.equal(s.lastError, 'blocked');
  },
  async 'storage full: the write fails, memory keeps it, status says not saved; freeing space recovers'(ES0, assert, env) {
    const st = env.makeStorage({ quota: 300000 }), { ES } = env1(env, st);
    st.setItem('other-app', 'x'.repeat(296000));
    await ES.core.store.init();
    assert.equal(ES.core.store.status().nearFull, true, 'early warning from the headroom probe');
    const ok = ES.core.store.update('profile', (p) => { p.nickname = 'n'.repeat(30); p.notes = 'y'.repeat(9000); });
    assert.equal(ok, false);
    let s = ES.core.store.status();
    assert.equal(s.saved, false);
    assert.equal(s.lastError, 'quota');
    assert.equal(ES.core.store.get('profile').nickname.length, 30);
    st.removeItem('other-app');
    assert.equal(ES.core.store.update('profile', (p) => { p.nickname = 'ok'; }), true);
    s = ES.core.store.status();
    assert.equal(s.saved, true);
    assert.equal(s.lastError, null);
    assert.equal(JSON.parse(st.getItem(P + 'profile')).rec.nickname, 'ok');
  },
  async 'a record from a newer schema makes this tab read-only'(ES0, assert, env) {
    const st = env.makeStorage();
    const newer = JSON.stringify({ rev: 3, at: 1, by: 't', rec: { v: 99, settings: { theme: 'dark' }, shiny: true } });
    st.setItem(P + 'profile', newer);
    const { ES } = env1(env, st);
    const r = await ES.core.store.init();
    assert.equal(r.mode, 'memory');
    assert.equal(r.reason, 'newer');
    const s = ES.core.store.status();
    assert.equal(s.readOnly, true);
    assert.equal(s.newerVersion, true);
    assert.equal(ES.core.store.set('log', { sessions: [{ id: 'z', start: 1 }] }), false);
    assert.equal(st.getItem(P + 'log'), null, 'nothing written');
    assert.equal(st.getItem(P + 'profile'), newer, 'newer record untouched');
    assert.equal(ES.core.store.importAll({ records: {} }).error, 'read-only');
    assert.equal(ES.core.store.wipe().ok, false);
  },
  async 'keys of a newer app generation (earshot.v2.*) also make it read-only'(ES0, assert, env) {
    const st = env.makeStorage();
    st.setItem('earshot.v2.profile', '{}');
    const { ES } = env1(env, st);
    assert.equal((await ES.core.store.init()).reason, 'newer');
  },
  async 'corrupt JSON is kept aside and replaced by defaults'(ES0, assert, env) {
    const st = env.makeStorage();
    st.setItem(P + 'log', '{"rev":1,"rec":{"sessions":[{"id":');
    const { ES } = env1(env, st);
    await ES.core.store.init();
    assert.deepEqual(ES.core.store.status().corrupt, ['log']);
    assert.equal(st.getItem(P + 'log.corrupt'), '{"rev":1,"rec":{"sessions":[{"id":');
    assert.deepEqual(ES.core.store.get('log').sessions, []);
    assert.equal(ES.core.store.update('log', (l) => { l.sessions.push({ id: 'a', start: 1, end: 2 }); }), true);
  },
  async 'two tabs: events bring clean tabs up to date; a stale write merges field by field'(ES0, assert, env) {
    const shared = env.sharedStorage();
    const A = env1(env, shared).ES, B = env1(env, shared).ES;
    await A.core.store.init(); await B.core.store.init();
    let seen = 0;
    B.hooks.on('store:changed', (ev) => { if (ev.source === 'remote') seen++; });
    A.core.store.update('profile', (p) => { p.settings.theme = 'dark'; });
    shared.flush();
    assert.equal(B.core.store.peek('profile').settings.theme, 'dark');
    assert.ok(seen >= 1);
    const stale = B.core.store.get('profile');
    A.core.store.update('profile', (p) => { p.settings.sessionMin = 20; });
    stale.settings.mode = 'path';
    assert.equal(B.core.store.set('profile', stale), true);
    const stored = JSON.parse(shared.map.get(P + 'profile')).rec;
    assert.equal(stored.settings.sessionMin, 20, 'A’s change survives B’s stale write');
    assert.equal(stored.settings.mode, 'path');
    assert.equal(stored.settings.theme, 'dark');
    shared.flush();
    assert.equal(A.core.store.peek('profile').settings.mode, 'path');
    A.core.store.update('log', (l) => { l.sessions.push({ id: 'a1', start: 10, end: 20 }); });
    B.core.store.update('log', (l) => { l.sessions.push({ id: 'b1', start: 11, end: 21 }); });
    shared.flush();
    assert.deepEqual(A.core.store.peek('log').sessions.map((s) => s.id), ['a1', 'b1']);
  },
  async 'a tab holding unsaved changes merges an incoming event, then writes on release'(ES0, assert, env) {
    const shared = env.sharedStorage();
    const A = env1(env, shared).ES, B = env1(env, shared).ES;
    await A.core.store.init(); await B.core.store.init();
    B.core.store.hold();
    B.core.store.update('profile', (p) => { p.settings.mode = 'variety'; });
    assert.equal(shared.map.has(P + 'profile'), false, 'held: nothing written yet');
    A.core.store.update('profile', (p) => { p.settings.theme = 'light'; });
    shared.flush();
    B.core.store.release();
    const stored = JSON.parse(shared.map.get(P + 'profile')).rec;
    assert.equal(stored.settings.mode, 'variety');
    assert.equal(stored.settings.theme, 'light');
  },
  async 'export → import into a fresh device; import merges and never deletes'(ES0, assert, env) {
    const A = env1(env, env.makeStorage()).ES;
    await A.core.store.init();
    A.core.store.update('log', (l) => { l.sessions.push({ id: 's1', start: 1, end: 2, activeMs: 5 }); });
    A.core.store.update('profile', (p) => { p.nickname = 'Ear'; p.settings.theme = 'dark'; });
    const backup = A.core.store.exportAll();
    assert.equal(backup.format, 'earshot-backup');
    assert.ok(!('playtest' in backup.records), 'no playtest data (device facts) in backups');
    assert.match(backup.exportedAt, /Z$/);
    const C = env1(env, env.makeStorage()).ES;
    await C.core.store.init();
    C.core.store.update('log', (l) => { l.sessions.push({ id: 'c1', start: 3, end: 4 }); });
    const rep = C.core.store.importAll(JSON.stringify(backup));
    assert.equal(rep.ok, true);
    assert.deepEqual(C.core.store.peek('log').sessions.map((s) => s.id), ['s1', 'c1']);
    assert.equal(C.core.store.peek('profile').nickname, 'Ear');
    assert.equal(C.core.store.peek('profile').settings.theme, 'dark');
  },
  async 'import refuses or repairs damaged input safely'(ES0, assert, env) {
    const { ES } = env1(env, env.makeStorage());
    await ES.core.store.init();
    const S = ES.core.store;
    for (const bad of ['', 'hello', '{"records":', '[]', '42', 'null']) assert.equal(S.importAll(bad).ok, false, JSON.stringify(bad));
    assert.equal(S.importAll(null).ok, false);
    assert.equal(S.importAll({ records: { profile: { v: 99 } } }).error, 'newer-version');
    const r1 = S.importAll({ records: { profile: 'not json', log: { sessions: 'no', v: 1 } } });
    assert.equal(r1.ok, false, 'a damaged backup is refused whole (fix round 1, M9)');
    assert.equal(r1.error, 'damaged');
    assert.deepEqual(r1.damaged.map((d) => d.key).sort(), ['log', 'profile']);
    const wrapped = 'Here is my backup:\n' + JSON.stringify({ records: { profile: { v: 1, nickname: 'Wrapped' } } }) + '\nthanks';
    assert.equal(S.importAll(wrapped).ok, true);
    assert.equal(S.peek('profile').nickname, 'Wrapped');
    const dump = { 'earshot.v1.profile': JSON.stringify({ rev: 2, at: 1, by: 'x', rec: { v: 1, nickname: 'Dump' } }) };
    assert.equal(S.importAll(dump).ok, true);
    assert.equal(S.peek('profile').nickname, 'Dump');
    const evil = '{"records":{"profile":{"v":1,"__proto__":{"polluted":true},"tutorials":{"__proto__":{"x":1}}}}}';
    S.importAll(evil);
    assert.equal(({}).polluted, undefined);
    assert.equal(S.status().saved, true);
  },
  async 'wipe removes every Earshot key; the other tab resets on the event'(ES0, assert, env) {
    const shared = env.sharedStorage();
    const A = env1(env, shared).ES, B = env1(env, shared).ES;
    await A.core.store.init(); await B.core.store.init();
    A.core.store.update('profile', (p) => { p.nickname = 'gone'; });
    shared.map.set('unrelated', 'keep');
    shared.flush();
    assert.equal(B.core.store.peek('profile').nickname, 'gone');
    assert.equal(A.core.store.wipe().ok, true);
    assert.deepEqual(Array.from(shared.map.keys()), ['unrelated']);
    shared.flush();
    assert.equal(B.core.store.peek('profile').nickname, '');
    assert.equal(A.core.store.peek('profile').nickname, '');
  },
  async 'hold/release: nothing is written while a stimulus plays'(ES0, assert, env) {
    const st = env.makeStorage(), { ES } = env1(env, st);
    await ES.core.store.init();
    ES.core.store.hold();
    ES.core.store.update('trials', (t) => { t.rows.push([1, 'crowd', 'tmr', -3, 1, 1, 0]); });
    assert.equal(st.getItem(P + 'trials'), null);
    assert.equal(ES.core.store.status().held, true);
    ES.core.store.release();
    assert.equal(JSON.parse(st.getItem(P + 'trials')).rec.rows.length, 1);
  }
};
