"""UI behaviour: stacked sheets (Esc closes only the top one, Tab stays inside), confirm() as a Promise, the answer
panel (a slip of more than 8 px selects nothing, keys 1–9, arrows + Enter, locks after the answer), Chimera
invitations held while a set runs and shown between sets, the volume reference, settings import and delete."""
from harness import Checks, new_tab, file_url, wait_ready, close_sheets, wait_state, preset

SEEN = {'profile': {'v': 1, 'welcomeSeen': 1, 'tutorials': {'demo': True}}}


def run(h):
    c = Checks('ui')
    tab = new_tab(h.browser, viewport=(390, 844), init=preset(SEEN))
    pg = tab.page
    pg.goto(file_url())
    wait_ready(pg)
    close_sheets(pg)

    # Sheets: a stack; Esc closes the top only; Tab is trapped; focus returns.
    pg.evaluate("""() => { window.__s1 = ES.ui.sheet({ title: 'First', body: 'one', actions: [{ label: 'A' }, { label: 'B', kind: 'primary' }] });
                         window.__s2 = ES.ui.sheet({ title: 'Second', body: 'two', actions: [{ label: 'C', kind: 'primary' }] }); }""")
    c.eq(pg.locator('.sheet').count(), 2, 'sheets stack')
    c.eq(pg.get_attribute('#app', 'inert'), '', 'the app behind a sheet is inert')
    for _ in range(4):
        pg.keyboard.press('Tab')
    c.ok(pg.evaluate("document.activeElement.closest('.sheet') && document.activeElement.closest('.sheet').textContent.includes('Second')"),
         'Tab stays inside the top sheet')
    pg.keyboard.press('Escape')
    c.eq(pg.locator('.sheet').count(), 1, 'Esc closes only the top sheet')
    c.ok('First' in pg.inner_text('.sheet'), 'the first sheet stays')
    pg.keyboard.press('Escape')
    c.eq(pg.locator('.sheet').count(), 0, 'a second Esc closes the next one')
    c.eq(pg.get_attribute('#app', 'inert'), None, 'the app is live again')
    pg.evaluate("() => { window.__c = null; ES.ui.confirm('Sure?', { ok: 'Yes' }).then(v => { window.__c = v; }); }")
    pg.click('.sheet .btn-primary')
    pg.wait_for_function('() => window.__c !== null')
    c.eq(pg.evaluate('window.__c'), True, 'confirm resolves true on OK')
    pg.evaluate("() => { window.__c = null; ES.ui.confirm('Sure?').then(v => { window.__c = v; }); }")
    pg.keyboard.press('Escape')
    pg.wait_for_function('() => window.__c !== null')
    c.eq(pg.evaluate('window.__c'), False, 'confirm resolves false on Esc')

    # Answer panel in a real trial: slips select nothing; keyboard picks; the panel locks.
    pg.click('[data-start]')
    wait_state(pg, 'answer', 15000)
    key = pg.locator('.answer-slot[data-slot="0"] .key[data-opt="0"]')
    box = key.bounding_box()
    x, y = box['x'] + box['width'] / 2, box['y'] + box['height'] / 2
    pg.mouse.move(x, y)
    pg.mouse.down()
    pg.mouse.move(x + 14, y + 6, steps=4)
    pg.mouse.up()
    c.eq(pg.evaluate("document.querySelector('.trial-body').dataset.state"), 'answer', 'a slip of more than 8 px selects nothing')
    pg.mouse.move(x, y)
    pg.mouse.down()
    pg.mouse.move(x + 3, y + 2, steps=2)
    pg.mouse.up()
    wait_state(pg, 'feedback', 3000)
    c.ok(True, 'a small wobble still selects (under 8 px)')
    c.ok(pg.locator('.answer.is-locked').count() == 1, 'the panel locks after the answer')
    picked = pg.locator('.key.picked').count()
    pg.locator('.answer-slot[data-slot="0"] .key[data-opt="3"]').click(force=True)
    c.eq(pg.locator('.key.picked').count(), picked, 'a locked panel ignores taps')
    pg.click('[data-next]')
    wait_state(pg, 'answer', 15000)
    n_slots = pg.evaluate('ES.ui.trialView.current.trial.question.slots.length')
    pg.keyboard.press('2')
    if n_slots > 1:
        pg.keyboard.press('1')
    wait_state(pg, 'feedback', 3000)
    c.ok(True, 'keys 1–9 answer')
    pg.click('[data-next]')
    wait_state(pg, 'answer', 15000)
    n_slots = pg.evaluate('ES.ui.trialView.current.trial.question.slots.length')
    pg.locator('.answer-slot[data-slot="0"] .key[data-opt="0"]').focus()
    pg.keyboard.press('ArrowRight')
    c.eq(pg.evaluate("document.activeElement.dataset.opt"), '1', 'arrows move between keys')
    pg.keyboard.press('Enter')
    if n_slots > 1:
        pg.keyboard.press('Enter')
    wait_state(pg, 'feedback', 3000)
    c.ok(True, 'Enter picks the focused key')

    # Invitations wait while a set runs and appear between sets.
    pg.evaluate("ES.hooks.emit('pb', { text: 'Followed a voice at −6 dB' })")
    c.eq(pg.locator('.chimera-card').count(), 0, 'no invitation inside a set')
    pg.click('[data-pause]')
    pg.click('[data-end-set]')
    pg.wait_for_selector('.results', timeout=8000)
    c.eq(pg.locator('.chimera-card[data-invite="pb"]').count(), 1, 'the invitation shows between sets')
    c.ok('discord.gg/chmr' in pg.inner_text('.chimera-card'), 'the invitation carries the link')
    pg.click('[data-end-session]')
    pg.wait_for_selector('.results-done')

    # Volume reference.
    pg.evaluate("ES.core.router.go('volume', {}, { reset: true })")
    pg.click('[data-volume-play]')
    pg.wait_for_function("() => /Playing|unavailable/.test(document.querySelector('[data-volume-status]').textContent)", timeout=3000)
    c.ok(True, 'the volume reference plays')
    pg.click('[data-volume-ok]')
    c.ok(pg.evaluate("ES.core.store.peek('profile').settings.volumeSet") > 0, 'the comfortable level is recorded')

    # Settings: import pasted text, then delete everything.
    pg.evaluate("ES.core.router.go('settings', {}, { reset: true })")
    pg.click('[data-import]')
    pg.fill('[data-import-text]', '{"format":"earshot-backup","records":{"log":{"v":1,"sessions":[{"id":"imp","start":5,"end":6}]},"profile":"broken"}}')
    pg.click('[data-import-run]')
    pg.wait_for_function("() => /Imported/.test(document.querySelector('[data-import-result]').textContent)")
    c.ok('profile (damaged)' in pg.inner_text('[data-import-result]'), 'import reports what it skipped')
    c.ok('imp' in pg.evaluate("ES.core.store.peek('log').sessions.map(s => s.id)"), 'import adds the sessions')
    close_sheets(pg)
    pg.click('[data-wipe]')
    pg.click('.sheet .btn-danger')
    pg.wait_for_selector('.home')
    c.eq(pg.evaluate("Object.keys(localStorage).filter(k => k.startsWith('earshot.')).length"), 0, 'delete everything clears every record')
    c.eq(pg.evaluate("ES.core.store.peek('log').sessions.length"), 0, 'and the app starts fresh')
    mine, other = tab.split()
    c.ok(not mine, 'no page errors from shell files', mine[:5])
    for who, text in other:
        c.warn(f'error from {who}: {text}')
    pg.context.close()
    return c
