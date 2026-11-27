#!/usr/bin/env python3
"""Shared helpers for the exA browser tests (Crowd, Far, Strange voices, Repair). MIT licence.

build_page() writes tests/out/exa/page.html: index.html's own script list (so the shell, engine and audio code
are the real ones), plus js/ex/{crowd,far,repair,strange,strategies}.js if the index does not list them yet, plus
the test fixtures (tests/fixtures/data-fixture.js, audio-fixture.js) and a small alias script that gives every
data-fixture clip one of the synthetic fixture sounds (no recordings), so ES.audio.render really renders.
A hook wraps ES.ex[id].prepare to keep the last prepared trial in window.__exaTrials (answers for the simulated
player). Run every browser test in a browser slot: tools/with-browser.sh python3 tests/e2e/ex_a_<name>.py
"""
import json
import pathlib
import re
import shutil
import subprocess
import time

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / 'tests' / 'out' / 'exa'
EXA = ['js/ex/crowd.js', 'js/ex/far.js', 'js/ex/repair.js', 'js/ex/strange.js', 'js/ex/strategies.js']
FIXTURES = ['tests/fixtures/data-fixture.js', 'tests/fixtures/audio-fixture.js']
EXERCISES = ['crowd', 'far', 'strange', 'repair']
SIZES = {'phone-s': (360, 640), 'phone': (390, 844), 'desktop': (1366, 768), 'landscape': (640, 360)}

ALIAS = r"""<script>
/* exA test page only: every data-fixture clip gets a synthetic fixture sound (tests/fixtures/audio-fixture.js). */
(function () {
  var ES = window.ES, c = ES.data.manifest.clips, P = ES.packs, F = P.fixture || {};
  var SHORT = ['fx.a.phrase.two', 'fx.b.phrase.two', 'fx.c.phrase.two', 'fx.tone.1k'];
  var LONG = ['fx.a.phrase.one', 'fx.b.phrase.one', 'fx.c.phrase.one', 'fx.d.phrase.one', 'fx.e.phrase.one'];
  function h(s) { var x = 2166136261; for (var i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619) >>> 0; } return x; }
  P.alias = P.alias || {};
  Object.keys(c).forEach(function (id) {
    if (id.indexOf('fx.') === 0) return;
    var k = c[id].kind, pool = k === 'bed' ? ['fx.bed.cafe'] : /sentence|intro|phrase|story/.test(k) ? LONG : SHORT;
    var src = pool[h(id) % pool.length];
    if (F[src]) { P.alias[id] = F[src]; c[id].pack = 'alias'; }
  });
})();
</script>"""

HOOK = r"""<script>
/* exA test page only: keep each prepared trial so the simulated player knows the answers. */
(function () {
  window.__exaTrials = [];
  ['crowd', 'far', 'strange', 'repair'].forEach(function (id) {
    var M = window.ES && ES.ex && ES.ex[id];
    if (!M || typeof M.prepare !== 'function' || M.__wrapped) return;
    var orig = M.prepare;
    M.prepare = function (t) {
      var out = orig.call(M, t) || t;
      if (out && out.question) {
        var rec = window.__exaTrials, last = rec[rec.length - 1];
        if (!last || last.id !== out.id) rec.push({ id: out.id, ex: id, prompt: out.question.prompt,
          answers: out.question.slots.map(function (s) { return String(s.answer); }),
          options: out.question.slots.map(function (s) { return s.options.map(String); }),
          foils: out.question.slots.map(function (s) { return s.foils || {}; }), dials: out.setting && out.setting.dials });
      }
      return out;
    };
    M.__wrapped = true;
  });
})();
</script>"""


def build_page(name='page.html', head_extra='', real=False, head=False):
    """Write the test page and return (file:// URL, exA files the index lacked). real=False (default): the real
    data/ and audio/ packs are left out and the fixtures stand in (all four exercises, deterministic); real=True:
    index.html's own data and packs (whatever the stimuli pipeline has built so far). head=True: every other owner's
    code (index.html, css, fonts, js except js/ex/{crowd,far,repair,strange,strategies}.js) comes from the last commit
    (git archive HEAD into tests/out/exa/head/), so exA's working copy is tested apart from others' unfinished edits."""
    base = ROOT
    if head:
        hd = OUT / 'head'
        shutil.rmtree(hd, ignore_errors=True)
        hd.mkdir(parents=True)
        arc = subprocess.run(['git', 'archive', 'HEAD', 'index.html', 'css', 'fonts', 'js'], cwd=ROOT, capture_output=True, check=True)
        subprocess.run(['tar', '-x', '-C', str(hd)], input=arc.stdout, check=True)
        base = hd
    html = (base / 'index.html').read_text(encoding='utf-8')
    a, b = html.index('<!-- scripts:begin -->'), html.index('<!-- scripts:end -->')
    srcs = re.findall(r'<script src="([^"]+)"></script>', html[a:b])
    if not real:   # generated packs may be mid-rebuild: keep only data/ltas.js, and only when it exists
        srcs = [s for s in srcs if not (s.startswith('audio/') or (s.startswith('data/') and not (s == 'data/ltas.js' and (ROOT / s).exists())))]
    missing = [s for s in EXA if s not in srcs]
    if missing:   # the shell's index lags behind new files: put them where js/ex/* belongs (before js/ui/)
        present = [s for s in srcs if s.startswith('js/ex/')]
        srcs = [s for s in srcs if not s.startswith('js/ex/')]
        at = next((i for i, s in enumerate(srcs) if s.startswith('js/ui/')), len(srcs))
        ex_all = sorted(set(present + missing))
        srcs = srcs[:at] + ex_all + srcs[at:]
    first_audio = next(i for i, s in enumerate(srcs) if not s.startswith('js/core/'))
    up = '../../../'
    def src_of(s):   # exA files, fixtures and generated packs from the working tree; the rest from base
        return up + s if (not head or s in EXA or s.startswith(('data/', 'audio/', 'tests/'))) else 'head/' + s
    tags = []
    for i, s in enumerate(srcs):
        if i == first_audio and not real:
            tags += ['<script src="%s"></script>' % src_of(f) for f in FIXTURES]
            tags.append(ALIAS)
        if s == 'js/app.js':
            tags.append(HOOK)
        tags.append('<script src="%s"></script>' % src_of(s))
    head_html = html[:a].replace('href="css/', 'href="%scss/' % ('head/' if head else up))
    head_html = head_html.replace('<head>', '<head>\n<script>window.ES_CONFIG = { testBuild: false };</script>' + head_extra, 1)
    page = head_html + '<!-- scripts:begin -->\n' + '\n'.join(tags) + '\n' + html[b:]
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    path.write_text(page, encoding='utf-8')
    return path.as_uri(), missing


def launch(p):
    return p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])


def new_page(browser, size='phone-s', scheme='light'):
    w, h = SIZES[size]
    ctx = browser.new_context(viewport={'width': w, 'height': h}, color_scheme=scheme, device_scale_factor=1,
                              has_touch=size != 'desktop', is_mobile=size != 'desktop')   # landscape = a sideways phone
    page = ctx.new_page()
    errs = _ERRORS.setdefault(id(page), [])
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.on('console', lambda m: errs.append('console.error: ' + m.text) if m.type == 'error' else None)
    return ctx, page


_ERRORS = {}


def errors(page):
    return list(_ERRORS.get(id(page), []))


def boot(page, url):
    """Open the app and close the Chimera welcome (full on a fresh profile)."""
    page.goto(url)
    page.wait_for_selector('html.ready', timeout=20000)
    page.wait_for_selector('.sheet-chimera', timeout=10000)
    page.click('.sheet-chimera .btn-primary')
    page.wait_for_selector('.sheet-chimera', state='detached', timeout=5000)


def start_set(page, ex_id, trials=4):
    """Start a session whose only set is ex_id (the planner is replaced for the test); a fresh profile goes
    through the exercise's tutorial first."""
    page.evaluate("""([ex, n]) => {
      ES.engine.planner = ES.engine.planner || {};
      ES.engine.planner.session = function () { return { sets: [{ exId: ex, trials: n }] }; };
      ES.ui.session.start();
    }""", [ex_id, trials])


def state(page):
    return page.evaluate("""() => {
      var b = document.querySelector('.trial-body');
      var cap = document.querySelector('.tut-card');
      return { trial: b ? b.getAttribute('data-state') : null, mode: b ? b.getAttribute('data-mode') : null,
        step: cap ? cap.getAttribute('data-step') : null, route: ES.core.router.current() && ES.core.router.current().name,
        cont: !!document.querySelector('[data-continue]:not([disabled])'), next: !!document.querySelector('[data-next]:not([disabled])'),
        playing: b ? b.getAttribute('data-playing') : null };
    }""")


def last_trial(page):
    return page.evaluate("() => (window.__exaTrials || []).slice(-1)[0] || null")


def answer(page, picks):
    """Tap the given option text in each slot (pointer events, like a finger)."""
    for si, word in enumerate(picks):
        key = page.locator('.answer-slot[data-slot="%d"] .key' % si).filter(has_text=re.compile('^\\s*\\d?\\s*%s\\s*$' % re.escape(word)))
        if key.count() == 0:
            key = page.locator('.answer-slot[data-slot="%d"] .key' % si).filter(has_text=word)
        key.first.click()


def fits(page):
    """True when nothing needs scrolling: not the page, not a scrolling box inside the app (RV-play-a11y A1: the trial
    body scrolled internally), and every key, Next button and feedback line lies inside the window."""
    return page.evaluate("""() => {
      var d = document.documentElement, s = document.scrollingElement || d, inner = [], out = [];
      Array.prototype.forEach.call(document.querySelectorAll('#app *'), function (n) {
        var cs = getComputedStyle(n);
        if (/(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 1) inner.push((n.className || n.tagName) + ' +' + (n.scrollHeight - n.clientHeight));
      });
      Array.prototype.forEach.call(document.querySelectorAll('.answer .key, [data-next], .fb-head, .fb-text, .fb-words, .replay'), function (n) {
        if (n.offsetParent === null) return;
        var r = n.getBoundingClientRect();
        if (r.top < -1 || r.bottom > innerHeight + 1 || r.left < -1 || r.right > innerWidth + 1) out.push((n.className || n.tagName).split(' ')[0] + '@' + Math.round(r.top) + '..' + Math.round(r.bottom));
      });
      return { ok: s.scrollHeight <= innerHeight + 1 && s.scrollWidth <= innerWidth + 1 && !inner.length && !out.length,
               h: s.scrollHeight, vh: innerHeight, w: s.scrollWidth, vw: innerWidth, inner: inner.slice(0, 3), outside: out.slice(0, 4) };
    }""")


def shot(page, name):
    OUT.mkdir(parents=True, exist_ok=True)
    p = OUT / (name + '.png')
    page.screenshot(path=str(p))
    return p


class Report:
    def __init__(self, title):
        self.title, self.rows, self.t0 = title, [], time.time()

    def check(self, name, ok, detail=''):
        self.rows.append((name, bool(ok), detail))
        print(('PASS ' if ok else 'FAIL ') + name + (': ' + str(detail) if detail else ''), flush=True)
        return ok

    def done(self):
        bad = [r for r in self.rows if not r[1]]
        print('%s: %d checks, %d failed, %.0f s' % (self.title, len(self.rows), len(bad), time.time() - self.t0))
        (OUT / (self.title + '.json')).write_text(json.dumps(self.rows, indent=1))
        return 1 if bad else 0
