#!/usr/bin/env python3
"""exB browser test: how Echo, Voices, Seek, Missions and the voices-from-your-life screen look and fit, at
360×640 (light and dark), 640×360 landscape (dark; light too without --quick), 390×844 and 1366×768. Trials are mounted the way Play mounts them (a .trial with
its bar and host) from generator trials with fixed settings, so every variant is covered: Echo with two and three
questions (listening, the hold, answering, a miss with the message's words), Voices meet / who / find (a miss shows
the pitch comparison), Seek with decoys and the head-turn view (preview, search, word, reveal). Help sheets: the
dial ranges they print equal the ladders in js/engine/dials.js. Missions: the check-in writes the week's record,
feeds the diary once and shows its share line with the Chimera link; Home shows the mission card.
Run:  tools/with-browser.sh python3 tests/e2e/ex_b_layout.py [--quick]
Outputs: tests/out/exb/layout-*.png, ex_b_layout.json. MIT licence."""
import pathlib
import sys
import time

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import ex_b_common as C  # noqa: E402

MOUNT = r"""([ex, dials, ctx, seed]) => {
  var app = document.getElementById('app'); ES.core.router.go('home', {}, { reset: true });
  app.innerHTML = '';
  document.documentElement.classList.add('in-trial');
  var host = ES.core.util.el('div', { class: 'trial-host' });
  app.appendChild(ES.core.util.el('div', { class: 'trial', 'data-ex': ex }, [ES.core.util.el('header', { class: 'trial-bar' },
    [ES.core.util.el('div', { class: 'tb-mid' }, [ES.core.util.el('div', { class: 'tb-line' }, [ES.core.util.el('span', { class: 'tb-title' }, ex)])])]), host]));
  var t = ES.engine.items[ex].make(ES.core.rng(seed), { dials: dials, focus: Object.keys(dials)[0], anchor: false, warmup: false, seed: seed }, ctx || {});
  t.ex = ex; if (t.seed == null) t.seed = seed;
  window.__lay = { t: t };
  if (ex === 'seek') window.__lay.v = ES.ex.seek.run(host, t, { score: function (x, r) { return ES.engine.score(x, r); } });
  else window.__lay.v = ES.ui.trialView.run(host, { trial: t, mode: 'set', autoNext: false, score: function (x, r) { return ES.engine.score(x, r); } });
  return { slots: t.question.slots.length, task: t.meta && t.meta.task, decoys: t.audio.live ? t.audio.live.decoys.length : null, turn: t.audio.live ? !!t.audio.live.headTurn : null };
}"""


def body_state(page):
    return page.evaluate("() => { var b = document.querySelector('.trial-body'); return b ? b.getAttribute('data-state') : null; }")


def wait_state(page, states, timeout=15):
    t0 = time.time()
    while time.time() - t0 < timeout:
        s = body_state(page)
        if s in states:
            return s
        time.sleep(0.08)
    return body_state(page)


def answers(page):
    return page.evaluate("() => window.__lay.t.question.slots.map(function (s) { return String(s.answer); })")


def wrong(page):
    return page.evaluate("""() => window.__lay.t.question.slots.map(function (s) {
      var f = Object.keys(s.foils || {}).filter(function (k) { return s.foils[k] !== 'random'; })[0];
      return String(f != null ? f : s.options.map(String).filter(function (o) { return o !== String(s.answer); })[0]); })""")


def check_fit(rep, page, name):
    f = C.fits(page)
    rep.check(name + ' fits without scrolling', f['ok'], f)


def keyword(rep, page, tag, ex, dials, ctx, seed, miss):
    info = page.evaluate(MOUNT, [ex, dials, ctx, seed])
    name = '%s %s%s' % (tag, ex, (' ' + info['task']) if info.get('task') else ' %d slots' % info['slots'])
    s = wait_state(page, ['listen', 'hold', 'answer'])
    if ex == 'echo':
        hid = page.evaluate("() => getComputedStyle(document.querySelector('.trial-answer')).visibility")
        rep.check(name + ': questions hidden while the message plays', s in ('listen', 'hold') and hid == 'hidden', [s, hid])
        C.shot(page, 'layout-%s-%s-listen' % (tag, ex))
        if wait_state(page, ['hold', 'answer']) == 'hold':
            C.shot(page, 'layout-%s-%s-hold' % (tag, ex))
    s = wait_state(page, ['answer'], 25)
    rep.check(name + ': reaches the answer state', s == 'answer', s)
    check_fit(rep, page, name + ' (answer)')
    C.shot(page, 'layout-%s-%s-answer' % (tag, name.split(' ', 1)[1].replace(' ', '-')))
    C.answer(page, wrong(page) if miss else answers(page))
    wait_state(page, ['feedback'])
    time.sleep(0.4)
    check_fit(rep, page, name + ' (feedback)')
    fb = page.evaluate("() => (document.querySelector('.trial-feedback') || {}).innerText || ''")
    if ex == 'voices' and info.get('task') == 'meet':
        n = page.evaluate("() => document.querySelectorAll('.trial-answer .key').length")
        rep.check(name + ': a meeting offers only the new name', n == 1, n)
    if ex == 'echo':
        rep.check(name + ': feedback shows the message words', page.locator('.fb-words').count() == 1, fb[:120])
    if ex == 'voices' and miss and info.get('task') == 'who':
        rep.check(name + ': a miss names both voices and their pitch', 'not' in fb and ('Hz' in fb or 'pitch' in fb), fb[:160])
    C.shot(page, 'layout-%s-%s-feedback' % (tag, name.split(' ', 1)[1].replace(' ', '-')))
    page.evaluate("() => window.__lay.v.abort()")
    return fb


def seek(rep, page, tag, dials, ctx, seed):
    info = page.evaluate(MOUNT, ['seek', dials, ctx, seed])
    name = '%s seek (%d decoys%s)' % (tag, info['decoys'], ', head turn' if info['turn'] else '')
    s = wait_state(page, ['preview', 'search'])
    if info['decoys']:
        C.shot(page, 'layout-%s-seek-preview' % tag)
    s = wait_state(page, ['search'], 15)
    rep.check(name + ': search', s == 'search', s)
    pr = page.evaluate("() => (document.querySelector('.trial-prompt') || {}).textContent || ''")
    rep.check(name + ': the prompt says how close counts', 'inside your ring (within ' in pr and page.locator('.sk-ring').count() == 1, pr)
    check_fit(rep, page, name + ' (search)')
    C.shot(page, 'layout-%s-seek-search' % tag)
    C.seek_walk(page, steps=14, pause=0.02, hold_s=0.2)
    wait_state(page, ['word'])
    check_fit(rep, page, name + ' (word)')
    C.shot(page, 'layout-%s-seek-word' % tag)
    C.answer(page, [C.seek_peek(page)['word']])
    wait_state(page, ['feedback'])
    check_fit(rep, page, name + ' (feedback)')
    fb = page.evaluate("() => document.querySelector('.trial-feedback').innerText")
    if info['turn']:
        rep.check(name + ': feedback reports the head turn', 'ear' in fb, fb[:200])
    rep.check(name + ': reveal shows the voice and every decoy', page.locator('.sk-t').count() == 1 and page.locator('.sk-d').count() == info['decoys'])
    rep.check(name + ': feedback marks Found and Named separately', page.locator('.sk-head .sk-part').count() == 2, fb[:80])
    C.shot(page, 'layout-%s-seek-feedback' % tag)
    page.evaluate("() => window.__lay.v.abort()")


CLEAN = "() => { document.querySelectorAll('#app > .trial').forEach(function (n) { n.remove(); }); document.documentElement.classList.remove('in-trial'); }"


def cards(rep, page, tag):
    got = page.evaluate("""() => ['echo:delay', 'echo:snr', 'seek:snr', 'seek:decoys', 'voices:similar', 'voices:cast'].map(function (k) {
      var a = k.split(':'), c = ES.ex.strategies.pick(a[0], { dial: a[1] }); return c ? c.id : null; })""")
    rep.check(tag + ': plateau strategy cards come from exB for its dials', got == ['echo.slot', 'echo.after', 'seek.halve', 'seek.voice', 'voices.cues', 'voices.ten'], got)


def helps(rep, page, tag):
    want = {'echo': ['+20 dB → −8 dB', '2 details → 5 details', 'normal → 1.6×', '1 s → 10 s'],
            'voices': ['2 voices → 6 voices', '+30 dB → −6 dB', 'a sentence → one word'],
            'seek': ['+15 dB → −12 dB', 'none → 4 decoys', 'within 2.5 m down to within 0.9 m']}
    page.evaluate(CLEAN)
    page.evaluate("() => { ES.core.router.go('settings', {}, { reset: true }); }")
    for ex, frags in want.items():
        page.evaluate("(ex) => { window.__h = ES.ex[ex].openHelp(); }", ex)
        page.wait_for_selector('.sheet-help', timeout=5000)
        txt = page.inner_text('.sheet-help').replace(' ', ' ')
        miss = [f for f in frags if f not in txt]
        rep.check('%s help %s: ranges match js/engine/dials.js' % (tag, ex), not miss, miss)
        C.shot(page, 'layout-%s-help-%s' % (tag, ex))
        page.evaluate("() => window.__h.close()")
        time.sleep(0.2)


def missions(rep, page, tag):
    page.evaluate(CLEAN)
    page.evaluate("() => ES.core.router.go('missions', {}, { reset: true })")
    page.wait_for_selector('[data-mission-check]', timeout=5000)
    C.shot(page, 'layout-%s-missions' % tag)
    page.click('[data-tried="true"]')
    page.click('[data-rate="7"]')
    page.click('[data-helped="yes"]')
    page.click('[data-mission-save]')
    page.wait_for_selector('[data-mission-done]', timeout=5000)
    rec = page.evaluate("() => { var c = ES.ex.missions.current(); return c.rec; }")
    rep.check(tag + ' missions: the check-in is stored for the week', bool(rec) and rec.get('done') is True and rec.get('rating') == 7 and rec.get('helped') == 'yes', rec)
    ev = page.evaluate("() => ((ES.core.store.peek('diary') || {}).events || []).filter(function (e) { return e.source === 'mission'; })")
    rep.check(tag + ' missions: one diary event from the check-in', len(ev) == 1 and ev[0].get('v') == 4, ev)
    share = page.evaluate("() => ES.ex.missions.shareText(ES.ex.missions.current().mission, ES.ex.missions.current().rec)")
    rep.check(tag + ' missions: the share line carries the Chimera link', 'https://discord.gg/chmr' in share, share)
    C.shot(page, 'layout-%s-missions-done' % tag)
    page.evaluate("() => ES.core.router.go('home', {}, { reset: true })")
    page.wait_for_selector('.home', timeout=5000)
    rep.check(tag + ' Home shows the mission card', page.locator('[data-mission-card]').count() == 1)
    bb = page.locator('[data-mission-open]').first.bounding_box()
    rep.check(tag + ' Home: the mission button is at least 44 px tall', bool(bb) and bb['height'] >= 44 and bb['width'] >= 44, bb)
    page.evaluate("() => ES.core.router.go('voices-own', {}, { reset: true })")
    page.wait_for_selector('.own-add', timeout=5000)
    C.shot(page, 'layout-%s-own' % tag)


def main():
    quick = '--quick' in sys.argv
    rep = C.Report('ex_b_layout' + ('_quick' if quick else ''))
    url = C.build_page('layout.html')
    combos = [('phone-s', 'light'), ('phone-s', 'dark'), ('landscape', 'dark')] + ([] if quick else [('phone', 'light'), ('phone', 'dark'), ('desktop', 'dark'), ('desktop', 'light'), ('landscape', 'light')])
    with sync_playwright() as p:
        b = C.launch(p)
        for size, scheme in combos:
            tag = '%s-%s' % (size, scheme)
            ctx, page = C.new_page(b, size, scheme)
            C.boot(page, url)
            cast = page.evaluate("() => ES.engine.items.voices.cast().slice(0, 6)")
            keyword(rep, page, tag, 'echo', {'snr': 8, 'details': 0, 'rate': 0, 'delay': 1}, {}, 'lay-e2', False)
            keyword(rep, page, tag, 'echo', {'snr': 6, 'details': 2, 'rate': 1, 'delay': 0}, {}, 'lay-e3', True)
            keyword(rep, page, tag, 'voices', {'cast': 2, 'similar': 0, 'snr': 30, 'length': 0}, {'task': 'meet', 'met': cast[:2]}, 'lay-vm', False)
            keyword(rep, page, tag, 'voices', {'cast': 4, 'similar': 1, 'snr': 10, 'length': 0}, {'task': 'who', 'met': cast}, 'lay-vw', True)
            keyword(rep, page, tag, 'voices', {'cast': 3, 'similar': 0, 'snr': 6, 'length': 0}, {'task': 'find', 'met': cast[:3]}, 'lay-vf', True)
            seek(rep, page, tag, {'snr': 8, 'decoys': 2, 'size': 1, 'gap': 1}, {'headphones': True, 'breadth': 1}, 'lay-s1')
            if not quick or scheme == 'light':
                cards(rep, page, tag)
                helps(rep, page, tag)
                missions(rep, page, tag)
            errs = C.errors(page)
            rep.check(tag + ': no page errors', not errs, errs[:4])
            ctx.close()
        b.close()
    return rep.done()


if __name__ == '__main__':
    sys.exit(main())
