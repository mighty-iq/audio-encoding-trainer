#!/usr/bin/env python3
"""exA browser test: trial layout of Crowd, Far, Strange voices and Repair at 360×640, 390×844 and 1366×768, light
and dark, with the tutorial marked done. For each: the answer state and the feedback after a miss (the longest
feedback: the miss lines, the words and the automatic replays) need no scrolling; a right answer is accepted;
the Help sheet opens (the shell's, and exA's own openHelp() with every dial's real range); a Strange voices
text-first trial shows its words before the sound. Screenshots for review go to tests/out/exa/layout-*.png.
Run:  flock /tmp/earshot-browser.lock python3 tests/e2e/ex_a_layout.py [crowd ...] [--quick]
MIT licence."""
import pathlib
import sys
import time

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import ex_a_common as C  # noqa: E402


def skip_tutorials(page):
    page.evaluate("""() => ES.core.store.update('profile', function (r) {
      r.tutorials = r.tutorials || {}; ['crowd', 'far', 'strange', 'repair'].forEach(function (k) { r.tutorials[k] = true; }); })""")


def wait_state(page, want, timeout=15):
    t0 = time.time()
    while time.time() - t0 < timeout:
        s = C.state(page)
        if s['trial'] == want and (want != 'feedback' or s['playing'] != 'auto'):
            return s
        time.sleep(0.1)
    return C.state(page)


def run_one(b, url, ex, size, scheme, rep, full):
    ctx, page = C.new_page(b, size, scheme)
    C.boot(page, url)
    skip_tutorials(page)
    C.start_set(page, ex, 3)
    tag = '%s-%s-%s' % (ex, size, scheme)
    s = wait_state(page, 'answer')
    if s['trial'] != 'answer':
        s['errors'] = page.evaluate("() => (ES._errors || []).slice(-3).map(function (e) { return e.msg + ' | ' + String(e.stack || '').slice(0, 300); })")
    rep.check(tag + ': answer state reached', s['trial'] == 'answer', s)
    if s['trial'] != 'answer':
        ctx.close()
        return
    fit = C.fits(page)
    rep.check(tag + ': answering fits without scrolling', fit['ok'], fit)
    C.shot(page, 'layout-%s-answer' % tag)
    tr = C.last_trial(page)
    wrong = [next((w for w in o if w != a), a) for o, a in zip(tr['options'], tr['answers'])]
    C.answer(page, wrong)
    s = wait_state(page, 'feedback', 20)
    fit = C.fits(page)
    rep.check(tag + ': miss feedback fits without scrolling', fit['ok'], fit)
    C.shot(page, 'layout-%s-miss' % tag)
    if full:
        page.click('[data-next]')
        s = wait_state(page, 'answer')
        tr = C.last_trial(page)
        C.answer(page, tr['answers'])
        time.sleep(0.25)
        rep.check(tag + ': right answer accepted', page.evaluate("() => !!document.querySelector('.fb-head.is-right')"), tr['prompt'])
        # the shell's Help sheet from the "?" button
        wait_state(page, 'feedback', 20)
        page.click('[data-help]')
        page.wait_for_selector('.sheet-help', timeout=5000)
        C.shot(page, 'layout-%s-help-shell' % tag)
        page.keyboard.press('Escape')
        page.wait_for_selector('.sheet-help', state='detached', timeout=5000)
        # exA's own Help sheet: every dial with its real range
        page.evaluate("(ex) => ES.ex[ex].openHelp()", ex)
        page.wait_for_selector('.sheet-help .help-dials', timeout=5000)
        ranges = page.evaluate("""(ex) => {
          var want = ES.engine.dials[ex].map(function (d) { return ES.ex._kit.range(d); });
          var got = Array.prototype.map.call(document.querySelectorAll('.sheet-help .help-range'), function (n) { return n.textContent; });
          return { want: want, got: got };
        }""", ex)
        rep.check(tag + ': Help lists every dial with its range from the code', ranges['want'] == ranges['got'], ranges)
        C.shot(page, 'layout-%s-help' % tag)
        page.keyboard.press('Escape')
    errs = [e for e in C.errors(page) if 'favicon' not in e]
    rep.check(tag + ': no page errors', not errs, errs[:3])
    ctx.close()


def prime_check(b, url, rep):
    """A text-first aid trial (Strange voices) shows its words before the sound and keeps them static."""
    ctx, page = C.new_page(b, 'phone-s', 'light')
    C.boot(page, url)
    out = page.evaluate("""() => new Promise(function (resolve) {
      var M = ES.ex.strange, st = M.tutorial.steps.filter(function (s) { return s.kind === 'practice'; })[0];
      var t = M.tutorialTrial(st, 9, ES.core.rng('prime'));
      delete t._exA; t.setting.aid = 'text'; t = M.prepare(t);
      var host = document.createElement('div'); host.className = 'trial-host';
      document.getElementById('app').innerHTML = ''; document.getElementById('app').appendChild(host);
      var view = ES.ui.trialView.run(host, { trial: t, mode: 'practice', autoNext: false, score: function (tr, r) { return ES.engine.score(tr, r); } });
      var seen = [], t0 = Date.now();
      (function poll() {
        var b = document.querySelector('.trial-body'), p = document.querySelector('.trial-prime');
        seen.push({ ms: Date.now() - t0, state: b && b.getAttribute('data-state'), prime: p && !p.hidden ? p.textContent : null });
        if (Date.now() - t0 > 4000) { view.abort(); resolve({ text: t.meta.text, prime: t.prime, seen: seen }); } else setTimeout(poll, 100);
      })();
    })""")
    shown = [x for x in out['seen'] if x['prime']]
    first_listen = next((x['ms'] for x in out['seen'] if x['state'] == 'listen'), None)
    first_prime = next((x['ms'] for x in out['seen'] if x['state'] == 'prime'), None)
    rep.check('strange: text-first trial shows its words before the sound',
              bool(out['prime']) and bool(shown) and shown[0]['prime'] == out['text'] and first_prime is not None and
              first_listen is not None and first_listen - first_prime >= 1000,
              {'prime': out['prime'], 'first_prime_ms': first_prime, 'first_listen_ms': first_listen})
    ctx.close()


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    exs = args or C.EXERCISES
    quick = '--quick' in sys.argv
    url, missing = C.build_page(real='--real' in sys.argv)
    rep = C.Report('ex_a_layout')
    combos = [('phone-s', 'light', True), ('phone-s', 'dark', False), ('phone', 'light', False), ('desktop', 'dark', True)]
    if quick:
        combos = combos[:1]
    with sync_playwright() as p:
        b = C.launch(p)
        for ex in exs:
            for size, scheme, full in combos:
                try:
                    run_one(b, url, ex, size, scheme, rep, full)
                except Exception as e:  # noqa: BLE001
                    rep.check('%s-%s-%s: run' % (ex, size, scheme), False, str(e)[:300])
        if 'strange' in exs:
            prime_check(b, url, rep)
        b.close()
    return rep.done()


if __name__ == '__main__':
    sys.exit(main())
