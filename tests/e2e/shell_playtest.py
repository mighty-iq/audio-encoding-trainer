"""Playtest report saved for the developer (test builds inside a claude.ai artifact): a stand-in `window.claude`
appears late (1.5 s); the report object is written to doc playtest/<deviceId> off the trial screens, nothing is
written during a set, Settings says "Saved for the developer", and a failing database leaves one error entry."""
from harness import Checks, new_tab, file_url, wait_ready, close_sheets, wait_state, answer_current

FAKE = """window.__dbWrites = [];
setTimeout(function () {
  window.claude = { use: function (name) { return Promise.resolve(name === 'db' ? { doc: function (path) { return { set: function (obj) {
    if (window.__dbFail) return Promise.reject(new Error('quota'));
    window.__dbWrites.push({ path: path, obj: obj, at: Date.now() }); return Promise.resolve(); } }; } } : null); } };
}, 1500);"""


def run(h):
    c = Checks('playtest')
    tab = new_tab(h.browser, viewport=(390, 844), config={'testBuild': True}, init=FAKE)
    pg = tab.page
    pg.goto(file_url())
    wait_ready(pg)
    close_sheets(pg)
    try:
        pg.wait_for_function('() => window.__dbWrites.length >= 1', timeout=9000)
        ok = True
    except Exception:
        ok = False
    c.ok(ok, 'a late artifact runtime is found and the report is written')
    if ok:
        w = pg.evaluate('window.__dbWrites[0]')
        dev = pg.evaluate("localStorage.getItem('earshot.v1.$device')")
        c.eq(w['path'], 'playtest/' + str(dev), 'doc path is playtest/<deviceId kept in localStorage>')
        c.ok('Earshot playtest report' in w['obj'].get('text', ''), 'the object carries the report text')
        c.ok(w['obj'].get('device', {}).get('ua'), 'the object carries device facts')
        c.eq(w['obj'].get('deviceId'), dev, 'the object names its device id')
    pg.click('[data-start]')
    pg.wait_for_selector('[data-skip-tutorial]', timeout=8000)
    pg.click('[data-skip-tutorial]')
    wait_state(pg, 'answer', 15000)
    before = pg.evaluate('window.__dbWrites.length')
    for _ in range(2):
        answer_current(pg, True)
        wait_state(pg, 'feedback')
        pg.click('[data-next]')
        wait_state(pg, 'answer', 15000)
    pg.wait_for_timeout(2500)
    c.eq(pg.evaluate('window.__dbWrites.length'), before, 'nothing is written during a set')
    pg.click('[data-pause]')
    pg.click('[data-end-set]')
    pg.wait_for_selector('.results', timeout=8000)
    for label in ('Fun 5', 'Clarity 4', 'Difficulty 2'):
        pg.click(f'[aria-label="{label}"]')
    try:
        pg.wait_for_function('(n) => window.__dbWrites.length > n', arg=before, timeout=8000)
        ok2 = True
    except Exception:
        ok2 = False
    c.ok(ok2, 'between sets the report is written again')
    last = pg.evaluate('window.__dbWrites.slice(-1)[0].obj')
    c.ok(len(last.get('ratings', [])) >= 1, 'the written report includes the ratings')
    pg.evaluate("() => { ES.ui.session.abandon(); ES.core.router.go('settings', {}, { reset: true }); }")
    pg.wait_for_selector('[data-db-status]')
    c.eq(pg.inner_text('[data-db-status]').strip(), 'Saved for the developer', 'Settings → Playtest says it was saved')
    # A failing database: one error entry, nothing thrown, the app goes on.
    pg.evaluate('window.__dbFail = true; ES.core.playtest.db.save();')
    pg.wait_for_timeout(800)
    errs = pg.evaluate("ES.core.store.peek('playtest').errors.map(e => e.msg)")
    c.ok(any('Saving the playtest report failed' in e for e in errs), 'a failed write leaves a playtest error entry', errs[-3:])
    mine, other = tab.split()
    c.ok(not mine, 'no page errors from shell files', mine[:5])
    for who, text in other:
        c.warn(f'error from {who}: {text}')
    pg.context.close()

    # Without the runtime: nothing to connect, no errors.
    tab = new_tab(h.browser, viewport=(390, 844), config={'testBuild': True})
    pg = tab.page
    pg.goto(file_url())
    wait_ready(pg)
    pg.wait_for_timeout(4600)
    c.eq(pg.evaluate('ES.core.playtest.db.status().state'), 'none', 'outside the artifact runtime the sync stays off')
    mine, other = tab.split()
    c.ok(not mine, 'no runtime: no page errors from shell files', mine[:5])
    pg.context.close()
    return c
