#!/usr/bin/env python3
"""Browser tests for the Lab (Chromium via Playwright). Run inside the browser lock:
    flock /tmp/earshot-browser.lock python3 tests/e2e/lab_e2e.py [filter …]
Checks: the Lab overview (cards, due block) at phone and desktop sizes, light and dark; a baseline block through the
real buttons; every probe end to end (real rendering of probe trials, fast playback); probe trials fit 360×640 without
scrolling (matrix, keypad, choice, story question, diary); the anti-phase headphone check (pass, fail, manual override
with a note); exports (download, blocked downloads → copy box, Chimera invitation), import of a backup and of a damaged
file; the report (verdict, chart tooltip on hover and keyboard focus, table view); the diary; blocked storage.
Screenshots in tests/out/lab/. Exit code 1 on any failure. MIT licence."""
import json
import sys
import time

import lab_common as C
from playwright.sync_api import sync_playwright

H = C.H
DAY = 864e5
checks = H.Checks('lab')
tabs = []


def shot(page, name):
    C.OUT.mkdir(parents=True, exist_ok=True)
    page.screenshot(path=str(C.OUT / (name + '.png')))


def tab(browser, base, rel, **kw):
    t = C.open_page(browser, base, rel, **kw)
    tabs.append(t)
    return t


def history(t_end_days_ago=0, gain=1.6):
    """A matrix history: practice, two baseline runs, four weekly check-ins with a clear gain."""
    now = int(time.time() * 1000) - t_end_days_ago * DAY
    days = [-31, -30, -29, -22, -15, -8, -1]
    ys = [-4.6, -6.0, -6.2, -6.6 - gain * 0.25, -6.6 - gain * 0.5, -6.6 - gain * 0.75, -6.6 - gain]
    runs = [{'id': 'h%d' % i, 'probe': 'matrix', 'at': int(now + d * DAY), 'end': int(now + d * DAY + 180000), 'practice': i == 0,
             'kind': 'baseline' if i < 3 else 'weekly', 'proc': 'matrix-1', 'est': {'m': y, 's': 0.5}, 'n': 20, 'unit': 'dB', 'hp': False}
            for i, (d, y) in enumerate(zip(days, ys))]
    return {'v': 1, 'runs': runs, 'pid': 'ptestpool01'}


def t_overview(browser, base, rel):
    for scheme in ('light', 'dark'):
        for size in ('phone', 'phone-s', 'desktop'):
            t = tab(browser, base, rel, viewport=C.SIZES[size], scheme=scheme, records={'log': C.session_log(1)})
            p = t.page
            C.go(p, 'lab')
            p.wait_for_selector('[data-lab-screen=overview]')
            n = p.locator('[data-lab-card]').count()
            checks.eq(n, 7, 'overview shows 7 probe cards (%s %s)' % (size, scheme))
            due = p.get_attribute('[data-lab-due]', 'data-lab-due')
            checks.eq(due, 'baseline', 'a baseline block is due after the first session (%s %s)' % (size, scheme))
            wide = p.evaluate('() => document.scrollingElement.scrollWidth <= innerWidth + 1')
            checks.ok(wide, 'no sideways scroll on the overview (%s %s)' % (size, scheme))
            shot(p, 'overview-%s-%s' % (size, scheme))
            p.context.close()


def t_baseline_block(browser, base, rel):
    t = tab(browser, base, rel, records={'log': C.session_log(1)})
    p = t.page
    C.go(p, 'lab')
    p.locator('[data-lab-start-block]').click()
    p.wait_for_selector('[data-lab-start]')
    checks.ok('practice' in p.inner_text('.lab-panel').lower(), 'the first run is introduced as practice')
    n1 = C.run_open_probe(p)
    checks.eq(n1, 20, 'matrix practice: 20 sentences answered')
    checks.ok('practice run' in p.inner_text('.lab-panel').lower(), 'result says it was a practice run')
    p.locator('[data-lab-next]').click()
    n2 = C.run_open_probe(p)
    checks.eq(n2, 24, 'digits practice: 24 triplets answered')
    p.locator('[data-lab-back]').click()
    p.wait_for_selector('[data-lab-screen=overview]')
    runs = p.evaluate("() => ES.core.store.get('lab').runs.map(r => [r.probe, r.practice, r.kind, typeof r.est.m, r.n])")
    checks.eq(runs, [['matrix', True, 'baseline', 'number', 20], ['digits', True, 'baseline', 'number', 24]], 'both runs saved as baseline practice')
    checks.eq(p.get_attribute('[data-lab-due]', 'data-lab-due'), 'none', 'one block a day: nothing more due today')
    plays = p.evaluate('() => window.__labPlays || 0')
    checks.ok(plays >= 44, 'every trial was rendered and played (%d plays)' % plays)
    shot(p, 'overview-after-block')
    p.context.close()


def t_all_probes(browser, base, rel):
    t = tab(browser, base, rel, records={'log': C.session_log(1)})
    p = t.page
    for pid in ['matrix', 'digits', 'twovoices', 'rooms', 'newvoice', 'story', 'diary']:
        C.go(p, 'report', {'probe': pid})
        p.locator('[data-lab-run-now="%s"]' % pid).click()
        p.wait_for_selector('[data-lab-start]')
        try:
            n = C.run_open_probe(p)
        except Exception as e:  # noqa: BLE001
            checks.ok(False, pid + ' runs end to end', str(e)[:300]); shot(p, 'fail-' + pid); continue
        txt = p.inner_text('.lab-panel')
        checks.ok(('saved' in txt.lower()) and ('±' in txt or pid in ('diary',)), pid + ' runs end to end and shows its result (%d trials)' % n, txt[:200])
        p.locator('[data-lab-back]').click()
    got = p.evaluate("() => ES.core.store.get('lab').runs.map(r => r.probe)")
    checks.eq(sorted(got), sorted(['matrix', 'digits', 'twovoices', 'rooms', 'newvoice', 'story']), 'six probe runs saved')
    diary = p.evaluate("() => ES.core.store.get('diary').entries.map(e => e.items.map(i => i.v))")
    checks.eq(diary, [[4, 4, None, 4, 4]], 'the diary week saved with "did not happen" as null')
    C.go(p, 'lab')
    shot(p, 'overview-after-all')
    p.context.close()


def fit(p, name):
    m = p.evaluate("""() => { const se = document.scrollingElement, b = document.querySelector('[data-lab-done], .lab-answer');
      const r = b ? b.getBoundingClientRect() : null; return { sh: se.scrollHeight, ih: innerHeight, sw: se.scrollWidth, iw: innerWidth, bottom: r ? Math.round(r.bottom) : null }; }""")
    checks.ok(m['sh'] <= m['ih'] + 1 and m['sw'] <= m['iw'] + 1 and m['bottom'] is not None and m['bottom'] <= m['ih'], name + ' fits without scrolling', json.dumps(m))


def t_fit(browser, base, rel):
    for scheme in ('light', 'dark'):
        t = tab(browser, base, rel, viewport=C.SIZES['phone-s'], scheme=scheme, records={'log': C.session_log(1)})
        p = t.page
        for pid, label in [('matrix', 'matrix grid'), ('digits', 'keypad'), ('twovoices', 'choice list'), ('story', 'story question'), ('diary', 'diary item')]:
            C.go(p, 'report', {'probe': pid})
            p.locator('[data-lab-run-now="%s"]' % pid).click()
            p.locator('[data-lab-start]').click()
            if pid == 'twovoices':
                p.wait_for_selector('[data-lab-begin]:not([disabled])', timeout=20000)
                shot(p, 'fit-preview-%s' % scheme)
                p.locator('[data-lab-begin]').click()
            sel = {'story': '[data-lab-kind=question]', 'diary': '[data-lab-kind=diary]'}.get(pid)
            if sel:
                p.wait_for_selector(sel, timeout=30000)
            else:
                p.wait_for_function("() => { const s = ES.lab.runner.state(); return s && s.state === 'answer'; }", timeout=20000)
            p.wait_for_timeout(150)
            fit(p, '%s at 360×640 (%s)' % (label, scheme))
            shot(p, 'fit-%s-%s' % (pid, scheme))
            if pid in ('matrix',):   # the pause sheet, then leave without saving
                p.locator('[data-lab-pause]').click()
                p.wait_for_selector('[data-lab-end]')
                shot(p, 'fit-pause-%s' % scheme)
                p.locator('[data-lab-end]').click()
            else:
                p.evaluate("() => ES.core.router.go('lab', {}, { reset: true })")
            p.wait_for_timeout(150)
        left = p.evaluate("() => ({ runs: ES.core.store.get('lab').runs.length, inSet: !!ES.ui.inSet, trial: document.documentElement.classList.contains('in-trial') })")
        checks.eq(left, {'runs': 0, 'inSet': False, 'trial': False}, 'leaving runs unfinished saves nothing and restores the page (%s)' % scheme)
        p.context.close()


def t_hpcheck(browser, base, rel):
    t = tab(browser, base, rel)
    p = t.page
    C.go(p, 'lab')

    def rounds(right):
        p.locator('[data-hp-start]').click() if p.locator('[data-hp-start]').count() else None
        for k in range(6):
            p.wait_for_selector('[data-hp-key="1"]:not([disabled])', timeout=10000)
            ans = p.evaluate('(k) => ES.lab.hpcheck.last.trials[k].answer', k)
            p.locator('[data-hp-key="%d"]' % (ans if right else (ans % 3) + 1)).click()
            p.wait_for_timeout(420)
        p.wait_for_selector('[data-hp-result]')
        return p.get_attribute('[data-hp-result]', 'data-hp-result')
    p.locator('[data-lab-hpcheck]').click()
    shot(p, 'hpcheck-intro')
    checks.eq(rounds(True), 'pass', 'headphone check: right answers pass')
    s = p.evaluate("() => ES.core.store.get('profile').settings")
    checks.ok(s['headphones'] is True and s['hpCheck']['result'] == 'pass' and s['hpCheck']['score'] == '6/6', 'a pass unlocks the direction dials', json.dumps(s.get('hpCheck')))
    shot(p, 'hpcheck-pass')
    p.locator('[data-hp-done]').click()
    p.locator('[data-lab-hpcheck]').click()
    checks.eq(rounds(False), 'fail', 'headphone check: a speaker-like pattern fails')
    checks.eq(p.evaluate("() => ES.core.store.get('profile').settings.headphones"), False, 'a fail keeps the direction dials off')
    shot(p, 'hpcheck-fail')
    p.locator('.lab-hp-manual summary').last.click()
    p.locator('[data-hp-note]').last.fill('wired earbuds')
    p.locator('[data-hp-manual]').last.click()
    s = p.evaluate("() => ES.core.store.get('profile').settings")
    checks.ok(s['headphones'] is True and s['hpCheck']['result'] == 'manual' and s['hpCheck']['note'] == 'wired earbuds', 'manual override with a note', json.dumps(s.get('hpCheck')))
    checks.ok('by hand' in p.inner_text('[data-lab-hp]'), 'the Lab shows the manual state')
    p.context.close()


def t_export_import(browser, base, rel):
    t = tab(browser, base, rel, records={'lab': history(), 'log': C.session_log(2), 'profile': {'v': 1, 'nickname': 'ear-owl', 'settings': {}}})
    p = t.page
    C.go(p, 'lab')
    p.locator('[data-lab-export-open]').click()
    with p.expect_download() as dl:
        p.locator('[data-lab-export="json"]').click()
    checks.ok(dl.value.suggested_filename.startswith('earshot-backup-') and dl.value.suggested_filename.endswith('.json'), 'backup downloads as earshot-backup-<date>.json')
    p.wait_for_selector('[data-lab-export-done]')
    inv = p.locator('.sheet [data-invite="export"] a[href="https://discord.gg/chmr"]')
    checks.ok(inv.count() == 1 and inv.get_attribute('target') == '_blank', 'Chimera invitation after an export (new tab)')
    shot(p, 'export-done')
    backup = p.evaluate('() => ES.lab.exportUi.last.text')
    checks.eq(json.loads(backup)['format'], 'earshot-backup', 'backup text is the versioned backup')
    H.close_sheets(p)
    for kind in ('csv-runs', 'csv-sessions'):
        p.locator('[data-lab-export-open]').click()
        with p.expect_download():
            p.locator('[data-lab-export="%s"]' % kind).click()
        H.close_sheets(p)
    head = p.evaluate("() => ES.lab.exportUi.last.text.split('\\r\\n')[0]")
    checks.ok(head.startswith('session_id,'), 'sessions CSV has its header')
    p.locator('[data-lab-export-open]').click()
    p.locator('[data-lab-pool-device]').check()
    with p.expect_download():
        p.locator('[data-lab-export="pooled"]').click()
    pool = json.loads(p.evaluate('() => ES.lab.exportUi.last.text'))
    checks.ok(pool['format'] == 'earshot-pooled' and 'device' in pool and 'nickname' not in pool and pool['pid'] == 'ptestpool01', 'pooled: device only when ticked, no nickname unless ticked')
    H.close_sheets(p)
    # downloads blocked and clipboard refused → the copy box
    p.evaluate("""() => { URL.createObjectURL = () => { throw new Error('blocked'); };
      if (navigator.clipboard) navigator.clipboard.writeText = () => Promise.reject(new Error('no'));
      document.execCommand = () => false; }""")
    p.locator('[data-lab-export-open]').click()
    p.locator('[data-lab-export="json"]').click()
    p.wait_for_selector('[data-lab-export-done]')
    checks.ok('blocked' in p.inner_text('[data-lab-export-done]').lower(), 'blocked downloads are said plainly')
    p.locator('[data-lab-copy]').click()
    p.wait_for_selector('textarea.copybox')
    checks.eq(p.input_value('textarea.copybox'), p.evaluate('() => ES.lab.exportUi.last.text'), 'the copy box holds the whole backup')
    shot(p, 'export-copybox')
    H.close_sheets(p)
    # import: wipe, then paste the backup; a damaged file changes nothing
    p.evaluate('() => ES.core.store.wipe()')
    C.go(p, 'lab')
    p.locator('[data-lab-import-open]').click()
    p.locator('[data-lab-import-text]').fill(backup[: len(backup) // 2])
    p.locator('[data-lab-import-run]').click()
    checks.ok('damaged' in p.inner_text('[data-lab-import-result]'), 'a damaged file is refused in plain words')
    p.locator('[data-lab-import-text]').fill(backup)
    p.locator('[data-lab-import-run]').click()
    checks.ok('Imported' in p.inner_text('[data-lab-import-result]'), 'the backup imports')
    checks.eq(p.evaluate("() => ES.core.store.get('lab').runs.length"), 7, 'all runs restored')
    shot(p, 'import-done')
    p.context.close()


def t_report(browser, base, rel):
    for scheme, size in (('light', 'phone'), ('dark', 'phone'), ('light', 'desktop'), ('dark', 'desktop')):
        t = tab(browser, base, rel, viewport=C.SIZES[size], scheme=scheme, records={'lab': history(), 'log': C.session_log(5)})
        p = t.page
        C.go(p, 'report', {'probe': 'matrix'})
        p.wait_for_selector('[data-lab-report=matrix]')
        checks.eq(p.get_attribute('[data-lab-verdict-head]', 'data-lab-verdict-head'), 'clear', 'a clear 1.6 dB gain reads "clear" (%s %s)' % (size, scheme))
        checks.ok(p.locator('.sheet, [data-invite="milestone"]').count() >= 1, 'Chimera invitation at a clear gain')
        pts = p.locator('.lab-chart .lc-pt').count()
        checks.eq(pts, 7, 'every run drawn (%s %s)' % (size, scheme))
        p.locator('.lab-chart .lc-hit').nth(3).hover()
        tip = p.locator('.lab-tip')
        checks.ok(tip.is_visible() and 'dB' in tip.inner_text(), 'tooltip on hover')
        shot(p, 'report-%s-%s' % (size, scheme))
        p.locator('.lab-chart .lc-hit').nth(6).focus()
        checks.ok(tip.is_visible() and 'Run 7' in tip.inner_text(), 'tooltip on keyboard focus')
        p.locator('.lab-details summary').click()
        checks.eq(p.locator('[data-lab-table=matrix] tbody tr').count(), 7, 'table view lists every run')
        p.context.close()


def t_diary(browser, base, rel):
    t = tab(browser, base, rel)
    p = t.page
    C.go(p, 'diary')
    p.locator('[data-lab-sit="loud"]').click()
    p.locator('[data-lab-event-form] [data-scale="2"]').click()
    p.locator('[data-lab-helped="closer"]').click()
    p.locator('[data-lab-helped="face"]').click()
    p.locator('[data-lab-event-save]').click()
    p.wait_for_timeout(200)
    ev = p.evaluate("() => ES.core.store.get('diary').events.map(e => [e.sit, e.v, e.helped])")
    checks.eq(ev, [['loud', 2, ['closer', 'face']]], 'a listening moment is logged')
    shot(p, 'diary')
    p.context.close()


def t_blocked(browser, base, rel):
    t = tab(browser, base, rel, block_storage=True)
    p = t.page
    C.go(p, 'report', {'probe': 'diary'})
    p.locator('[data-lab-run-now="diary"]').click()
    C.run_open_probe(p)
    checks.ok('not saved on this device' in p.inner_text('.lab-panel').lower(), 'blocked storage: the result says it is not saved')
    p.context.close()


def t_weekly(browser, base, rel):
    """A finished baseline 9 days ago: the weekly check-in lists the Matrix twice (not yet clear) and an honest length."""
    now = int(time.time() * 1000) - 9 * DAY
    steps = [('matrix', 3), ('digits', 3), ('twovoices', 3), ('rooms', 2), ('newvoice', 2), ('story', 1)]
    runs, k = [], 0
    for pid, n in steps:
        for j in range(n):
            k += 1
            runs.append({'id': 'b%d' % k, 'probe': pid, 'at': now + k * 60000, 'end': now + k * 60000 + 30000, 'practice': j == 0, 'kind': 'baseline',
                         'est': {'m': -6 if pid in ('matrix', 'digits', 'twovoices') else 12 if pid == 'rooms' else 60, 's': 0.6}, 'n': 10})
    diary = {'v': 1, 'entries': [{'week': 'w0', 'at': now, 'items': [{'id': 'loud', 'v': 3}, {'id': 'far', 'v': 3}, {'id': 'memory', 'v': 3}]}], 'events': []}
    t = tab(browser, base, rel, records={'lab': {'v': 1, 'runs': runs}, 'diary': diary, 'log': C.session_log(3, now - 3600000)})
    p = t.page
    C.go(p, 'lab')
    checks.eq(p.get_attribute('[data-lab-due]', 'data-lab-due'), 'weekly', 'a weekly check-in is due after the baseline')
    items = p.evaluate("() => [...document.querySelectorAll('[data-lab-due-item]')].map(li => li.getAttribute('data-lab-due-item'))")
    checks.eq(items[:3], ['matrix', 'twovoices', 'matrix:2'], 'the Matrix runs twice while its verdict is not clear')
    txt = p.inner_text('[data-lab-due]').lower()
    checks.ok('second run' in txt and ('about 12 min' in txt or 'about 11 min' in txt), 'the card names the second run and an honest length', txt[:200])
    shot(p, 'weekly-due')
    p.locator('[data-lab-start-block]').click()
    p.wait_for_selector('[data-lab-start]')
    p.evaluate("() => ES.core.router.go('probe', { items: ES.core.router.current().params.items, kind: 'weekly', i: 2, done: [] }, { replace: true })")
    p.wait_for_selector('[data-lab-start]')
    checks.ok('second run' in p.inner_text('.lab-panel .eyebrow').lower(), 'the runner introduces the second Matrix run')
    p.context.close()


SUITES = [('overview', t_overview), ('weekly', t_weekly), ('baseline', t_baseline_block), ('probes', t_all_probes), ('fit', t_fit), ('hpcheck', t_hpcheck),
          ('export', t_export_import), ('report', t_report), ('diary', t_diary), ('blocked', t_blocked)]


def main():
    filters = [a for a in sys.argv[1:] if not a.startswith('--')]
    rel = C.build_page()
    t0 = time.time()
    with sync_playwright() as pw, H.http_server() as base:
        browser = H.launch(pw)
        for name, fn in SUITES:
            if filters and not any(f in name for f in filters):
                continue
            try:
                fn(browser, base, rel)
            except Exception as e:  # noqa: BLE001
                checks.ok(False, name + ' suite ran', repr(e)[:400])
        browser.close()
    lab_errors = []
    for tb in tabs:
        mine, other = tb.split()
        for w, text in other:
            if w == 'lab':
                lab_errors.append(text)
    checks.ok(not lab_errors, 'no page errors from js/lab', '; '.join(lab_errors[:5]))
    for ok, name, detail in checks.items:
        print(('PASS  ' if ok else 'FAIL  ') + name + ('' if ok else '  ' + detail))
    others = sorted({w + ': ' + x for tb in tabs for w, x in tb.split()[1] if w != 'lab'})
    for o in others[:10]:
        print('WARN  other owner: ' + o)
    print('%d checks, %d failed, %.0f s' % (len(checks.items), len(checks.failed), time.time() - t0))
    return 1 if checks.failed else 0


if __name__ == '__main__':
    sys.exit(main())
