#!/usr/bin/env python3
"""Shared helpers for the exB browser tests (Echo, Seek, Voices, voices from your life, Missions). MIT licence.

build_page() writes tests/out/exb/<name>: index.html's own script list (the real shell, engine, audio and game
code), with the fixture world by default (tests/fixtures/data-fixture.js + audio-fixture.js and an alias that
gives every data-fixture clip one of the synthetic fixture sounds, so ES.audio.render and ES.audio.live really
play) or the real data/ and audio/ packs with real=True. A hook keeps each prepared Echo/Voices trial in
window.__exbTrials (answers for the simulated player); Seek's running scene is ES.ex._seekScene.current.
Run every browser test through the two-slot wrapper: tools/with-browser.sh python3 tests/e2e/ex_b_<name>.py
"""
import json
import pathlib
import re
import time

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / 'tests' / 'out' / 'exb'
MINE = ['js/ex/echo.js', 'js/ex/missions.js', 'js/ex/seek-scene.js', 'js/ex/seek.js', 'js/ex/voices.js', 'js/ex/voices-own.js']
FIXTURES = ['tests/fixtures/data-fixture.js', 'tests/fixtures/audio-fixture.js']
SIZES = {'phone-s': (360, 640), 'phone': (390, 844), 'desktop': (1366, 768)}

ALIAS = r"""<script>
/* exB test page only: every data-fixture clip gets a synthetic fixture sound (tests/fixtures/audio-fixture.js). */
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
/* exB test page only: keep each prepared trial so the simulated player knows the answers. */
(function () {
  window.__exbTrials = [];
  ['echo', 'voices'].forEach(function (id) {
    var M = window.ES && ES.ex && ES.ex[id];
    if (!M || typeof M.prepare !== 'function' || M.__wrapped) return;
    var orig = M.prepare;
    M.prepare = function (t) {
      var out = orig.call(M, t) || t;
      if (out && out.question) {
        var rec = window.__exbTrials, last = rec[rec.length - 1];
        if (!last || last.id !== out.id) rec.push({ id: out.id, ex: id, task: out.meta && out.meta.task, prompt: out.question.prompt,
          answers: out.question.slots.map(function (s) { return String(s.answer); }),
          options: out.question.slots.map(function (s) { return s.options.map(String); }),
          foils: out.question.slots.map(function (s) { return s.foils || {}; }), dials: out.setting && out.setting.dials,
          delayMs: out.question.delayMs || 0 });
      }
      return out;
    };
    M.__wrapped = true;
  });
})();
</script>"""


def build_page(name='page.html', head_extra='', real=False, config=None):
    """Write the test page and return its file:// URL."""
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    a, b = html.index('<!-- scripts:begin -->'), html.index('<!-- scripts:end -->')
    srcs = re.findall(r'<script src="([^"]+)"></script>', html[a:b])
    if not real:   # generated packs may be mid-rebuild: keep only data/ltas.js, and only when it exists
        srcs = [s for s in srcs if not (s.startswith('audio/') or (s.startswith('data/') and not (s == 'data/ltas.js' and (ROOT / s).exists())))]
    missing = [s for s in MINE if s not in srcs and (ROOT / s).exists()]
    if missing:   # the index lags behind new files: put them where js/ex/* belongs (before js/ui/)
        present = [s for s in srcs if s.startswith('js/ex/')]
        srcs = [s for s in srcs if not s.startswith('js/ex/')]
        at = next((i for i, s in enumerate(srcs) if s.startswith('js/ui/')), len(srcs))
        srcs = srcs[:at] + sorted(set(present + missing)) + srcs[at:]
    first_audio = next(i for i, s in enumerate(srcs) if not s.startswith('js/core/'))
    up = '../../../'
    tags = []
    for i, s in enumerate(srcs):
        if i == first_audio and not real:
            tags += ['<script src="%s%s"></script>' % (up, f) for f in FIXTURES]
            tags.append(ALIAS)
        if s == 'js/app.js':
            tags.append(HOOK)
        tags.append('<script src="%s%s"></script>' % (up, s))
    cfg = {'testBuild': False}
    cfg.update(config or {})
    head = html[:a].replace('href="css/', 'href="%scss/' % up)
    head = head.replace('<head>', '<head>\n<script>window.ES_CONFIG = %s;</script>' % json.dumps(cfg) + head_extra, 1)
    page = head + '<!-- scripts:begin -->\n' + '\n'.join(tags) + '\n' + html[b:]
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    path.write_text(page, encoding='utf-8')
    return path.as_uri()


def launch(p, extra_args=None):
    return p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'] + (extra_args or []))


_ERRORS = {}


def new_page(browser, size='phone-s', scheme='light', **kw):
    w, h = SIZES[size]
    ctx = browser.new_context(viewport={'width': w, 'height': h}, color_scheme=scheme, device_scale_factor=1,
                              has_touch=size != 'desktop', is_mobile=size != 'desktop', **kw)
    page = ctx.new_page()
    errs = _ERRORS.setdefault(id(page), [])
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.on('console', lambda m: errs.append('console.error: ' + m.text) if m.type == 'error' else None)
    return ctx, page


def errors(page):
    return list(_ERRORS.get(id(page), []))


def boot(page, url):
    """Open the app and close the Chimera welcome (full on a fresh profile, light later)."""
    page.goto(url)
    page.wait_for_selector('html.ready', timeout=20000)
    try:
        page.wait_for_selector('.sheet-chimera', timeout=6000)
        page.click('.sheet-chimera .btn-primary')
        page.wait_for_selector('.sheet-chimera', state='detached', timeout=5000)
    except Exception:
        pass


def start_set(page, ex_id, trials=4, plan=None):
    """Start a session whose only set is ex_id (the planner is replaced for the test); a fresh profile goes
    through the exercise's tutorial first. plan: extra set fields (e.g. a venue's pin and focus)."""
    page.evaluate("""([ex, n, extra]) => {
      ES.engine.planner = ES.engine.planner || {};
      ES.engine.planner.session = function () { var s = Object.assign({ exId: ex, trials: n }, extra || {}); return { sets: [s] }; };
      ES.ui.session.start();
    }""", [ex_id, trials, plan or {}])


def route(page):
    return page.evaluate("() => (ES.core.router.current() || {}).name")


def state(page):
    return page.evaluate("""() => {
      var b = document.querySelector('.trial-body');
      var cap = document.querySelector('.tut-card');
      return { trial: b ? b.getAttribute('data-state') : null, mode: b ? b.getAttribute('data-mode') : null,
        step: cap ? cap.getAttribute('data-step') : null, route: ES.core.router.current() && ES.core.router.current().name,
        cont: !!document.querySelector('[data-continue]:not([disabled])'), next: !!document.querySelector('[data-next]:not([disabled])'),
        playing: b ? b.getAttribute('data-playing') : null, seek: !!document.querySelector('.sk-body') };
    }""")


def last_trial(page):
    return page.evaluate("() => (window.__exbTrials || []).slice(-1)[0] || null")


def answer(page, picks):
    """Tap the given option text in each slot (pointer events, like a finger)."""
    for si, word in enumerate(picks):
        keys = page.locator('.answer-slot[data-slot="%d"] .key' % si)
        key = keys.filter(has_text=re.compile('^\\s*\\d?\\s*%s\\s*$' % re.escape(word), re.I))
        if key.count() == 0:
            key = keys.filter(has_text=word)
        key.first.click()


def seek_peek(page):
    return page.evaluate("() => { var s = ES.ex._seekScene && ES.ex._seekScene.current; return s ? s.peek() : null; }")


def field_xy(page, fx, fy):
    """Screen coordinates (CSS px) of a Seek field point (field units, +y up)."""
    return page.evaluate("""([x, y]) => {
      var svg = document.querySelector('.sk-field'), m = svg.getScreenCTM(), p = svg.createSVGPoint();
      p.x = x * 90; p.y = -y * 90; p = p.matrixTransform(m); return [p.x, p.y];
    }""", [fx, fy])


def seek_walk(page, to=None, steps=24, pause=0.02, hold_s=0.0):
    """Grab yourself and drag to `to` (field units; default the voice), then let go. Returns the peek before release."""
    pk = seek_peek(page)
    if to is None:
        to = (pk['answer']['x'], pk['answer']['y'])
    x0, y0 = field_xy(page, pk['pos']['x'], pk['pos']['y'])
    x1, y1 = field_xy(page, to[0], to[1])
    page.mouse.move(x0, y0)
    page.mouse.down()
    for i in range(1, steps + 1):
        page.mouse.move(x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps)
        time.sleep(pause)
    if hold_s:
        time.sleep(hold_s)
    before = seek_peek(page)
    page.mouse.up()
    return before


def fits(page):
    """True when the page needs no scrolling (vertical or horizontal)."""
    return page.evaluate("""() => {
      var d = document.documentElement, s = document.scrollingElement || d;
      return { ok: s.scrollHeight <= innerHeight + 1 && s.scrollWidth <= innerWidth + 1, h: s.scrollHeight, vh: innerHeight,
               w: s.scrollWidth, vw: innerWidth };
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
        self.rows.append((name, bool(ok), detail if isinstance(detail, (str, int, float, bool, type(None))) else str(detail)))
        print(('PASS ' if ok else 'FAIL ') + name + (': ' + str(detail) if detail not in ('', None) else ''), flush=True)
        return ok

    def done(self):
        bad = [r for r in self.rows if not r[1]]
        print('%s: %d checks, %d failed, %.0f s' % (self.title, len(self.rows), len(bad), time.time() - self.t0))
        OUT.mkdir(parents=True, exist_ok=True)
        (OUT / (self.title + '.json')).write_text(json.dumps(self.rows, indent=1))
        return 1 if bad else 0
