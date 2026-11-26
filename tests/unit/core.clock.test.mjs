// ES.core.clock: one active-time clock with an idle limit, hidden-tab pauses and stacked pause reasons.
export const scripts = ['js/core/ns.js', 'js/core/util.js', 'js/core/clock.js'];
function fake(ES) { const t = { now: 1000 }; return { t, c: ES.core.clock.create(() => t.now) }; }

export const tests = {
  'counts while running and stops at pause'(ES, assert) {
    const { t, c } = fake(ES);
    c.start();
    t.now += 5000;
    assert.equal(c.activeMs(), 5000);
    c.pause('menu');
    t.now += 30000;
    assert.equal(c.activeMs(), 5000);
    c.resume('menu');
    t.now += 1000;
    assert.equal(c.activeMs(), 6000);
  },
  'idle limit: counts up to 60 s without input, then stops until the next input'(ES, assert) {
    const { t, c } = fake(ES);
    c.start();
    t.now += 10000; c.input();
    t.now += 200000;
    assert.equal(c.activeMs(), 70000);
    assert.deepEqual(c.reasons(), ['idle']);
    assert.equal(c.isRunning(), false);
    c.input();
    t.now += 2000;
    assert.equal(c.activeMs(), 72000);
  },
  'a second pause keeps the first pause start; every reason must clear'(ES, assert) {
    const { t, c } = fake(ES);
    c.start();
    t.now += 4000;
    c.pause('menu');
    const first = c.pausedSince();
    t.now += 3000;
    c.pause('hidden');
    assert.equal(c.pausedSince(), first);
    c.resume('hidden');
    t.now += 1000;
    assert.equal(c.activeMs(), 4000, 'still paused for the menu');
    c.resume('menu');
    t.now += 1000;
    assert.equal(c.activeMs(), 5000);
  },
  'an idle pause followed by a hidden tab keeps the idle start'(ES, assert) {
    const { t, c } = fake(ES);
    c.start();
    t.now += 90000;
    c.pause('hidden');
    assert.equal(c.activeMs(), 60000);
    assert.equal(c.pausedSince(), 1000 + 60000);
    c.resume('hidden');
    assert.equal(c.isRunning(), false, 'idle still holds');
    c.input();
    t.now += 500;
    assert.equal(c.activeMs(), 60500);
  },
  'resume() clears all reasons; stop returns the total and restart counts from zero'(ES, assert) {
    const { t, c } = fake(ES);
    c.start();
    t.now += 1000;
    c.pause('a'); c.pause('b');
    c.resume();
    t.now += 1000;
    assert.equal(c.stop(), 2000);
    t.now += 5000;
    assert.equal(c.activeMs(), 2000);
    c.start();
    t.now += 700;
    assert.equal(c.activeMs(), 700);
  }
};
