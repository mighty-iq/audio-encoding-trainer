"""Storage in the browser: blocked storage (memory mode, lasting banner, the app still runs), a record from a newer
version (read-only banner, nothing overwritten), full storage (early warning, then a lasting "not saved" banner),
and two tabs (a change in one shows in the other; changes to different fields in both tabs all survive)."""
import json

from harness import Checks, new_tab, wait_ready, close_sheets, wait_state, answer_current, preset, shot

FILL = """(() => { try {
  if (localStorage.getItem('zz-fill-0') !== null) return;
  const big = 'x'.repeat(1 << 19); let i = 0;
  try { for (; i < 64; i++) localStorage.setItem('zz-fill-' + i, big); } catch (e) {}
  const small = 'y'.repeat(1 << 12); let j = 0;
  try { for (; j < 4096; j++) localStorage.setItem('zz-small-' + j, small); } catch (e) {}
  for (let k = 0; k < 4; k++) localStorage.removeItem('zz-small-' + (j - 1 - k));
} catch (e) {} })();"""


def banner(pg):
    return pg.inner_text('#banners') if pg.locator('#banners .banner').count() else ''


def run(h):
    c = Checks('storage')
    url = h.base + '/index.html'

    # Blocked storage: memory mode, banner, a trial still runs.
    tab = new_tab(h.browser, viewport=(390, 844), block_storage=True)
    pg = tab.page
    pg.goto(url)
    wait_ready(pg)
    c.eq(pg.evaluate('ES.core.store.status().mode'), 'memory', 'blocked: memory mode')
    c.ok(pg.locator('.sheet-chimera-full').count() == 1, 'blocked: the full welcome still shows')
    close_sheets(pg)
    c.ok('not saved' in banner(pg).lower(), 'blocked: a lasting not-saved banner', banner(pg))
    shot(pg, 'storage_blocked_390')
    pg.click('[data-start]')
    pg.wait_for_selector('[data-skip-tutorial]', timeout=8000)
    pg.click('[data-skip-tutorial]')
    wait_state(pg, 'answer', 15000)
    c.ok(pg.locator('.tb-chip').count() == 1, 'blocked: a Not saved chip in the trial bar')
    answer_current(pg, True)
    wait_state(pg, 'feedback')
    c.ok(True, 'blocked: a trial runs and scores')
    mine, other = tab.split()
    c.ok(not mine, 'blocked: no page errors from shell files', mine[:5])
    for who, text in other:
        c.warn(f'blocked: error from {who}: {text}')
    pg.context.close()

    # A record from a newer version: read-only, untouched.
    newer = {'v': 99, 'settings': {'theme': 'dark'}, 'welcomeSeen': 1}
    tab = new_tab(h.browser, viewport=(390, 844), init=preset({'profile': newer}))
    pg = tab.page
    pg.goto(url)
    wait_ready(pg)
    close_sheets(pg)
    st = pg.evaluate('ES.core.store.status()')
    c.ok(st['readOnly'] and st['newerVersion'], 'newer: read-only mode', st)
    c.ok('newer version' in banner(pg).lower(), 'newer: a lasting banner says why', banner(pg))
    pg.evaluate("ES.core.store.update('profile', p => { p.nickname = 'x'; })")
    raw = json.loads(pg.evaluate("localStorage.getItem('earshot.v1.profile')"))
    c.eq(raw['rec']['v'], 99, 'newer: the newer record is never overwritten')
    pg.context.close()

    # Full storage: the headroom probe warns first; a failed write keeps a lasting not-saved banner.
    tab = new_tab(h.browser, viewport=(390, 844), init=FILL + preset({'profile': {'v': 1, 'welcomeSeen': 1}}))
    pg = tab.page
    pg.goto(url)
    wait_ready(pg)
    close_sheets(pg)
    st = pg.evaluate('ES.core.store.status()')
    c.ok(st['nearFull'], 'full: early warning before anything fails', st)
    pg.evaluate("ES.core.store.update('trials', t => { for (let i = 0; i < 3000; i++) t.rows.push([i + 1, 'demo', 'tmr', 0, 1, 1, 0]); })")
    st = pg.evaluate('ES.core.store.status()')
    c.ok(not st['saved'] and st['lastError'] == 'quota', 'full: the failed write is reported', st)
    c.ok('storage is full' in banner(pg).lower(), 'full: a lasting banner', banner(pg))
    c.eq(pg.evaluate("ES.core.store.peek('trials').rows.length"), 3000, 'full: the record stays in memory')
    shot(pg, 'storage_full_390')
    pg.evaluate("for (let i = 0; i < 64; i++) localStorage.removeItem('zz-fill-' + i)")
    pg.evaluate("ES.core.store.update('profile', p => { p.nickname = 'ok'; })")
    st = pg.evaluate('ES.core.store.status()')
    c.ok(st['saved'] and st['lastError'] is None, 'full: freeing space saves again', st)
    mine, other = tab.split()
    c.ok(not mine, 'full: no page errors from shell files', mine[:5])
    pg.context.close()

    # Two tabs in one browser.
    ctx = h.browser.new_context(viewport={'width': 390, 'height': 844})
    ctx.add_init_script('window.ES_CONFIG = { demo: true };')
    ctx.add_init_script(preset({'profile': {'v': 1, 'welcomeSeen': 1}}))
    a = new_tab(h.browser, context=ctx)
    b = new_tab(h.browser, context=ctx)
    for t in (a, b):
        t.page.goto(url + '#settings')
        wait_ready(t.page)
        close_sheets(t.page)
    a.page.click('.seg-btn[data-value="dark"]')
    b.page.wait_for_function("() => document.documentElement.getAttribute('data-theme') === 'dark'", timeout=5000)
    c.ok(True, 'two tabs: a theme change shows in the other tab')
    a.page.click('.seg-btn[data-value="20"]')
    b.page.wait_for_timeout(500)
    b.page.click('label[for="mode-path"]')
    a.page.wait_for_timeout(500)
    for name, t in (('A', a), ('B', b)):
        s = t.page.evaluate("ES.core.store.peek('profile').settings")
        c.ok(s['sessionMin'] == 20 and s['mode'] == 'path' and s['theme'] == 'dark', f'two tabs: tab {name} has every change', s)
    b.page.evaluate("ES.core.store.update('log', l => { l.sessions.push({ id: 'tab-b', start: 2, end: 3 }); })")
    a.page.evaluate("ES.core.store.update('log', l => { l.sessions.push({ id: 'tab-a', start: 1, end: 2 }); })")
    a.page.wait_for_timeout(300)
    ids = b.page.evaluate("ES.core.store.peek('log').sessions.map(s => s.id)")
    c.eq(sorted(ids), ['tab-a', 'tab-b'], 'two tabs: sessions logged in both survive')
    for name, t in (('A', a), ('B', b)):
        mine, other = t.split()
        c.ok(not mine, f'two tabs: no page errors in tab {name}', mine[:5])
    ctx.close()
    return c
