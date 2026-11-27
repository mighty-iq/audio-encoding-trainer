// ES.core.router: registered screens win over placeholders, stack navigation, listeners, deep-link rules.
export const scripts = ['js/core/ns.js', 'js/core/util.js', 'js/core/router.js'];
function screen(log, name, extra) {
  return Object.assign({ mount(el, params) { log.push(['mount', name, params]); }, unmount() { log.push(['unmount', name]); } }, extra || {});
}

export const tests = {
  'go mounts, back unmounts and returns; current reflects the top'(ES, assert, env) {
    const { ES: E, win } = env.spawn();
    const log = [], R = E.core.router;
    E.ui.screens.home = screen(log, 'home');
    E.ui.screens.settings = screen(log, 'settings');
    assert.equal(R.go('home'), true);
    R.go('settings', { tab: 'data' });
    assert.deepEqual(R.current(), { name: 'settings', params: { tab: 'data' } });
    assert.equal(win.location.hash, '#settings');
    R.back();
    assert.equal(R.current().name, 'home');
    assert.deepEqual(log.map((x) => x[0] + ':' + x[1]), ['mount:home', 'unmount:home', 'mount:settings', 'unmount:settings', 'mount:home']);
  },
  'a registered screen wins over the shell placeholder, whatever the load order'(ES, assert, env) {
    const { ES: E } = env.spawn();
    const log = [];
    E.ui.screens.home = screen(log, 'home');
    E.ui.placeholders.lab = screen(log, 'lab-placeholder');
    E.core.router.go('lab');
    assert.equal(log[log.length - 1][1], 'lab-placeholder');
    E.ui.screens.lab = screen(log, 'lab-real');
    E.core.router.go('lab');
    assert.equal(log[log.length - 1][1], 'lab-real');
  },
  'unknown names fall back to home; replace and reset shape the stack'(ES, assert, env) {
    const { ES: E } = env.spawn();
    const log = [], R = E.core.router;
    E.ui.screens.home = screen(log, 'home');
    E.ui.screens.play = screen(log, 'play');
    E.ui.screens.results = screen(log, 'results');
    R.go('nowhere');
    assert.equal(R.current().name, 'home');
    R.go('play');
    R.go('results', {}, { replace: true });
    assert.equal(R.depth(), 2);
    R.go('home', {}, { reset: true });
    assert.equal(R.depth(), 1);
    R.back();
    assert.equal(R.current().name, 'home');
  },
  'no duplicate entries: a screen returned to after a set is one entry, so one Back leaves it (FRESH-A #1, B D1)'(ES, assert, env) {
    const { ES: E } = env.spawn();
    const R = E.core.router;
    ['home', 'map', 'venue', 'play', 'results', 'weekly'].forEach((n) => { E.ui.screens[n] = screen([], n); });
    R.go('home'); R.go('map'); R.go('venue', { id: 'cafe' });
    for (let k = 0; k < 3; k++) {                    // three sets, each started from the venue and returning to it
      R.go('play', { set: 0 });
      R.go('results', { set: 0 }, { replace: true });
      R.go('venue', { id: 'cafe', after: true }, { replace: true });
    }
    assert.equal(R.depth(), 3);
    assert.deepEqual(R.current(), { name: 'venue', params: { id: 'cafe', after: true } });
    R.back();
    assert.equal(R.current().name, 'map');
    R.go('venue', { id: 'cafe' }); R.go('venue', { id: 'park' });   // two different venues stay two entries
    assert.equal(R.depth(), 4);
    R.go('weekly'); R.go('play'); R.go('weekly', {}, { replace: true });
    assert.equal(R.depth(), 5);
    R.back();
    assert.deepEqual(R.current(), { name: 'venue', params: { id: 'park' } });
  },
  'listeners and the route hook fire on every entry'(ES, assert, env) {
    const { ES: E } = env.spawn();
    const R = E.core.router, seen = [];
    E.ui.screens.home = screen([], 'home');
    E.ui.screens.about = screen([], 'about');
    const off = R.on('about', (r) => seen.push('about:' + r.name));
    R.on('*', (r) => seen.push('*:' + r.name));
    E.hooks.on('route', (r) => seen.push('hook:' + r.name));
    R.go('home'); R.go('about');
    off();
    R.go('about');
    assert.deepEqual(seen, ['*:home', 'hook:home', 'about:about', '*:about', 'hook:about', '*:about', 'hook:about']);
  },
  'session screens are never deep-linked; start honours a linkable hash'(ES, assert, env) {
    const { ES: E, win } = env.spawn();
    const R = E.core.router;
    ['home', 'play', 'settings'].forEach((n) => { E.ui.screens[n] = screen([], n); });
    E.ui.screens.probe = screen([], 'probe', { deepLink: false });
    assert.equal(R.linkable('settings'), true);
    assert.equal(R.linkable('play'), false);
    assert.equal(R.linkable('probe'), false);
    win.location.hash = '#play';
    R.start('home');
    assert.equal(R.current().name, 'home');
    win.location.hash = '#settings';
    R.start('home');
    assert.equal(R.current().name, 'settings');
  },
  'a screen that throws on mount does not break navigation'(ES, assert, env) {
    const { ES: E } = env.spawn();
    const R = E.core.router;
    E.ui.screens.home = screen([], 'home');
    E.ui.screens.bad = { mount() { throw new Error('boom'); } };
    const origError = console.error;
    console.error = () => {};
    try { R.go('bad'); } finally { console.error = origError; }
    assert.equal(R.current().name, 'bad');
    assert.ok(E._errors.some((e) => /boom/.test(e.msg)));
    R.back();
    assert.equal(R.current().name, 'home');
  }
};
