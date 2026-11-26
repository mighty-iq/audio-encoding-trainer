#!/usr/bin/env python3
"""Shared helpers for the Lab's browser tests. MIT licence.

build_page() writes tests/out/lab/page.html: every script of the app in tools/build-index.mjs order (the real shell,
audio, engine and lab code), plus the Lab fixtures after the data scripts (tests/fixtures/lab-data.js: probe
materials; tests/fixtures/lab-audio.js: synthetic sounds) and a small alias script that gives every probe clip one of
the synthetic sounds (its manifest duration set to the sound's), so ES.audio.render really renders probe trials.
With window.__labFast (an init script) ES.audio.play resolves after 30 ms instead of playing, so long runs stay fast;
rendering is unchanged. The driver answers probe trials from ES.lab.runner.state() (the answers are never on screen).
Run every browser test inside the lock: flock /tmp/earshot-browser.lock python3 tests/e2e/lab_e2e.py
"""
import json
import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import harness as H  # noqa: E402

ROOT = H.ROOT
OUT = ROOT / 'tests' / 'out' / 'lab'
SIZES = {'phone-s': (360, 640), 'phone': (390, 844), 'desktop': (1366, 768)}
ALIAS = r"""<script>
/* Lab test page only: every probe clip of the fixture gets a synthetic sound (tests/fixtures/lab-audio.js). */
(function () {
  var ES = window.ES, c = ES.data.manifest.clips, P = ES.packs, F = P.labfx || {}, S = window.LAB_SOUNDS || {};
  var pools = {};
  Object.keys(S).forEach(function (k) { (pools[S[k].kind] = pools[S[k].kind] || []).push(k); });
  function h(s) { var x = 2166136261; for (var i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619) >>> 0; } return x; }
  Object.keys(c).forEach(function (id) {
    var m = c[id];
    if (m.set !== 'probe') return;
    var pool = pools[m.kind] || pools.word, src = pool[h(id) % pool.length];
    F[id] = F[src]; m.pack = 'labfx'; m.dur = S[src].dur;
  });
  if (window.__labFast && ES.audio && ES.audio.play) {
    ES.audio.__realPlay = ES.audio.play;
    ES.audio.play = function (buf) {
      window.__labPlays = (window.__labPlays || 0) + 1;
      var done, ended = new Promise(function (r) { done = r; }), t = setTimeout(function () { done({ ok: true }); }, 30);
      return { stop: function () { clearTimeout(t); done({ ok: true, stopped: true }); }, ended: ended, duration: buf && buf.duration || 0 };
    };
  }
})();
</script>"""


def build_page(name='page.html'):
    """Write the test page; returns its path relative to the repository root."""
    out = subprocess.run(['node', str(ROOT / 'tools' / 'build-index.mjs'), '--list'], capture_output=True, text=True, check=True).stdout.split()
    data_end = max(i for i, s in enumerate(out) if s.startswith('data/') or s.startswith('audio/')) if any(s.startswith(('data/', 'audio/')) for s in out) else 0
    srcs = out[:data_end + 1] + ['tests/fixtures/lab-data.js', 'tests/fixtures/lab-audio.js'] + out[data_end + 1:]
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    a, b = html.index('<!-- scripts:begin -->'), html.index('<!-- scripts:end -->') + len('<!-- scripts:end -->')
    up = '../../../'
    tags = '\n'.join('<script src="%s%s"></script>' % (up, s) for s in srcs) + '\n' + ALIAS
    page = html[:a] + tags + html[b:]
    page = page.replace('href="css/', 'href="%scss/' % up)
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / name).write_text(page, encoding='utf-8')
    return 'tests/out/lab/' + name


def session_log(n=1, t0=None):
    """A log record with n real (non-demo) training sessions, so the baseline can start."""
    import time
    t0 = t0 or int(time.time() * 1000) - 3 * 3600 * 1000
    return {'v': 1, 'sessions': [{'id': 's%d' % i, 'start': t0 + i * 60000, 'end': t0 + i * 60000 + 900000, 'activeMs': 840000, 'mode': 'edge',
                                  'sets': [{'ex': 'crowd', 'n': 20, 'correct': 14}]} for i in range(n)]}


def open_page(browser, base, rel, viewport=(390, 844), scheme='light', fast=True, records=None, block_storage=False, init=''):
    js = ('window.__labFast = true;' if fast else '') + (H.preset(records) if records else '') + init
    tab = H.new_tab(browser, viewport=viewport, scheme=scheme, real=True, init=js, block_storage=block_storage)
    tab.page.goto(base + '/' + rel)
    H.wait_ready(tab.page)
    H.close_sheets(tab.page)
    return tab


def go(page, name, params=None):
    page.evaluate('([n, p]) => ES.core.router.go(n, p || {})', [name, params or {}])
    page.wait_for_timeout(150)


def runner_state(page):
    return page.evaluate("() => { const s = ES.lab.runner.state(); if (!s) return null; const t = s.trial; return { state: s.state, probe: s.probe, "
                         "trial: t ? { i: t.i, kind: t.ui.kind, answer: t.answer, options: t.ui.options || null, questions: t.ui.questions || null } : null }; }")


def wait_for(page, js, timeout=20000, arg=None):
    page.wait_for_function(js, arg=arg, timeout=timeout)


def answer_trial(page, st, right=True):
    """Answer the current probe trial through the real buttons."""
    t = st['trial']
    if t['kind'] == 'matrix':
        for ci, w in enumerate(t['answer']):
            word = w if right or ci % 2 else None
            if word is None:
                word = page.evaluate('(ci) => ES.lab.runner.state().trial.ui.columns[ci].options.find((o, k) => o !== ES.lab.runner.state().trial.answer[ci])', ci)
            page.locator('.lab-key[data-col="%d"][data-word="%s"]' % (ci, word)).click()
        page.locator('[data-lab-done]').click()
    elif t['kind'] == 'keypad':
        digits = t['answer'] if right else ['0', '0', '0']
        for d in digits:
            page.locator('[data-digit="%s"]' % d).click()
    elif t['kind'] == 'choice':
        pick = t['answer'] if right else next(o for o in t['options'] if o != t['answer'])
        page.locator('.lab-choice [data-choice="%s"]' % pick).click()


def run_open_probe(page, right_every=3, timeout=180):
    """Drive the probe screen from its intro to the result panel. Returns the number of answered trials."""
    page.locator('[data-lab-start]').click()
    n, guard = 0, 0
    while guard < 400:
        guard += 1
        page.wait_for_function("() => { const s = ES.lab.runner.state(); return !s || ['answer', 'ready', 'done', 'error'].includes(s.state) || "
                               "document.querySelector('[data-lab-kind=question],[data-lab-kind=effort],[data-lab-kind=diary]'); }", timeout=timeout * 1000)
        st = runner_state(page)
        if not st or st['state'] == 'done':
            return n
        if st['state'] == 'error':
            raise AssertionError('runner error: ' + page.inner_text('.trial-host'))
        if st['state'] == 'ready':   # the two-voices preview
            page.locator('[data-lab-begin]').click()
            continue
        kind = page.evaluate("() => { const e = document.querySelector('.lab-stage'); return e && e.getAttribute('data-lab-kind'); }")
        if kind == 'question':
            q = page.evaluate("() => +document.querySelector('[data-lab-kind=question]').getAttribute('data-q')")
            ans = st['trial']['questions'][q]['answer']
            page.locator('.lab-choice [data-choice="%s"]' % ans.replace('"', '\\"')).click()
            page.wait_for_timeout(320)
            continue
        if kind == 'effort':
            page.locator('[data-scale="2"]').click()
            page.wait_for_timeout(300)
            continue
        if kind == 'diary':
            item = page.evaluate("() => document.querySelector('[data-lab-kind=diary]').getAttribute('data-item')")
            page.locator('[data-scale="%s"]' % ('none' if item == 'unusual' else '4')).click()
            page.wait_for_timeout(260)
            continue
        idx = st['trial']['i']
        answer_trial(page, st, right=(idx % right_every) != 0)
        n += 1
        page.wait_for_function('(i) => { const s = ES.lab.runner.state(); return !s || s.state === "done" || !s.trial || s.trial.i !== i || s.state === "answer" && false; }',
                               arg=idx, timeout=timeout * 1000)
    raise AssertionError('runner did not finish')
