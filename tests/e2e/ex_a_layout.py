#!/usr/bin/env python3
"""exA browser test: trial layout of Crowd, Far, Strange voices and Repair at 360×640, 390×844 and 1366×768, light
and dark, with the tutorial marked done. For each: the answer state and the feedback after a miss (the longest
feedback: the miss lines, the words and the automatic replays) need no scrolling; a right answer is accepted;
the Help sheet opens (the shell's, and exA's own openHelp() with every dial's real range); a Strange voices
text-first trial shows its words before the sound. Screenshots for review go to tests/out/exa/layout-*.png.
Run:  tools/with-browser.sh python3 tests/e2e/ex_a_layout.py [crowd ...] [--quick] [--real] [--head]
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
          var shown = (ES.ex[ex].helpData().dials) || {};   // rows the build cannot play are hidden (C12, C36)
          var want = ES.engine.dials[ex].filter(function (d) { return shown[d.id] !== false; }).map(function (d) { return ES.ex._kit.range(d); });
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


def review_checks(b, url, rep):
    """Fix round 1 (docs/dev/reviews/FIX-ROUND-1.md): C12, C16, C18, C21, C22, C36, C39, number foils, Far's room
    outline clear of the "you" label. Each check failed on the code before the fix."""
    ctx, page = C.new_page(b, 'phone-s', 'light')
    C.boot(page, url)
    r = page.evaluate("""() => {
      var S = ES.ex.strategies, A = ES.engine.items.adapt, out = {};
      // number foils: plain words, never "sounds like" (CONTRACTS §5)
      var t = ES.ex.crowd.tutorialTrial(ES.ex.crowd.tutorial.steps[2], 2, ES.core.rng('num'));
      var res = { slots: [{ picked: 'nine', answer: 'four', correct: false, foil: 'number' }], correct: false, prop: 0, intrusions: 0 };
      out.number = ES.ex._kit.missLine(t, 0, res.slots[0], 'Kevin');
      // C16, C18, C21, C22, C39: flagged phrases gone, replacements present
      var card = function (id) { return S.card(id).text; };
      out.c16 = card('crowd.borrowed'); out.c16tip = ES.ex.crowd.tips.join(' ');
      out.c18 = card('crowd.lock-on'); out.c18space = card('crowd.space');
      out.c21 = card('repair.glimpse'); out.c22 = card('far.tune-in'); out.c22tip = ES.ex.far.tips[0];
      out.c39 = ES.ex.strange.helpData().why;
      // C12: a build without accented voices (simulated: every voice counts as native)
      var nat = A.isNative; A.isNative = function () { return true; };
      var st = ES.ex.strange.tutorial.steps, fam = ES.ex.strange.families ? ES.ex.strange.families() : ['accent (no families())'];
      out.c12 = { fams: fam, last: st[4].force.dials, text: st[4].text, short: ES.ex.strange.short,
        accentRow: ES.ex.strange.helpData().dials.accent, goal: ES.ex.strange.helpData().goal,
        cards: S.forEx('strange').map(function (c) { return c.id; }) };
      var tt = ES.ex.strange.tutorialTrial(st[4], 4, ES.core.rng('c12'));
      out.c12.family = tt && tt.meta && tt.meta.family;
      A.isNative = nat;
      out.c12with = ES.ex.strange.tutorial.steps[4].force.dials;
      out.c12acc = ES.ex.strange.families ? ES.ex.strange.families().indexOf('accent') >= 0 : true;
      // C36: a build without Repair sentences (simulated: no repair items)
      var ri = A.repairItems; A.repairItems = function () { return []; };
      var h = ES.ex.repair.helpData();
      out.c36 = { ctxRow: h.dials.context, why: h.why, tips: ES.ex.repair.tips, bet: ES.ex.repair.bet,
        cards: S.forEx('repair').map(function (c) { return c.id; }) };
      A.repairItems = ri;
      // Far: back wall clear of the "you" label for every room size and ladder distance the engine can send
      var sizes = { small: 5, medium: 10, large: 22, hall: 38 }, bad = [], n = 0, host = document.createElement('div');
      host.style.cssText = 'position:fixed;left:0;top:0;width:300px;height:300px'; document.body.appendChild(host);
      Object.keys(sizes).forEach(function (sz) {
        ES.engine.dials.far[0].values.filter(function (d) { return d <= 0.8 * sizes[sz]; }).forEach(function (dist) {
          var tr = { ex: 'far', audio: { room: { size: sz, rt60: 1, dist: dist }, parts: [] }, picture: { voices: [{ id: 'v0', role: 'target', az: 0, dist: dist }] },
            question: { slots: [] }, feedback: {}, meta: {} };
          var pic = ES.ex.far.prepare(tr).picture, svg = ES.ui.field(null, pic);
          host.innerHTML = ''; host.appendChild(svg); n++;
          var room = svg.querySelector('.f-room'), lab = svg.querySelector('.f-you-label'), dot = svg.querySelector('.f-target .f-dot');
          var rb = +room.getAttribute('y') + +room.getAttribute('height'), lb = lab.getBBox(), top = +room.getAttribute('y');
          var inside = +dot.getAttribute('cy') - 7 >= top;
          if (rb < lb.y + lb.height + 1 || !inside) bad.push(sz + ' ' + dist + ' m: wall ' + rb.toFixed(1) + ' label ' + (lb.y + lb.height).toFixed(1) + (inside ? '' : ' talker outside'));
        });
      });
      host.remove();
      out.far = { n: n, bad: bad };
      return out;
    }""")
    rep.check('fix1 number foil: plain line, no "sounds like"', 'sounds like' not in r['number'] and '“four”' in r['number'], r['number'])
    rep.check('fix1 C16: borrowed-words copy narrowed', 'Most crowd mistakes' not in r['c16'] and 'reported in a review' in r['c16']
              and 'heard clearly' not in r['c16'] and 'reported in a review' in r['c16tip'], r['c16'][:120])
    rep.check('fix1 C18: call-sign card without the 10–40 point figure; kept for headphones', '10 to 40' not in r['c18']
              and 'where it sits' not in r['c18'] and '10 to 40' in r['c18space'], r['c18'][:120])
    rep.check('fix1 C21: gap transfer wording', 'every word' not in r['c21'] and 'silent or noise-filled' in r['c21'], r['c21'][:120])
    rep.check('fix1 C22: room adaptation qualified for headphones', 'most of all with headphones' in r['c22'] and
              'most of all with headphones' in r['c22tip'], r['c22'][-60:])
    rep.check('fix1 C39: bet worded as a bet', r['c39'].startswith('Our bet:') and 'should train' not in r['c39'], r['c39'][:80])
    c = r['c12']
    rep.check('fix1 C12: no accented voices → no accent promised anywhere', 'accent' not in c['fams'] and 'accent' not in c['last']
              and 'accent' not in c['text'].lower() and 'Accents' not in c['short'] and c['accentRow'] is False and
              'accent' not in c['goal'] and 'strange.noise' not in c['cards'] and c['family'] == 'muffled', c)
    rep.check('fix1 C12: the last Strange practice matches the build (accent with accented voices, else a wall)',
              ('accent' in r['c12with']) == r['c12acc'] and (r['c12acc'] or 'muffled' in r['c12with']), [r['c12acc'], r['c12with']])
    c = r['c36']
    rep.check('fix1 C36: no Repair sentences → no context row, sentence, tip or card', c['ctxRow'] is False and 'context' not in c['why']
              and not any('Wait for the end' in x for x in c['tips']) and 'repair.wait' not in c['cards'] and 'sentence' not in c['bet'], c)
    rep.check('fix1 Far: back wall clear of the "you" label, talker inside (all %d layouts)' % r['far']['n'], not r['far']['bad'], r['far']['bad'][:4])
    ctx.close()


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    exs = args or C.EXERCISES
    quick = '--quick' in sys.argv
    url, missing = C.build_page(real='--real' in sys.argv, head='--head' in sys.argv)
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
        review_checks(b, url, rep)
        b.close()
    return rep.done()


if __name__ == '__main__':
    sys.exit(main())
