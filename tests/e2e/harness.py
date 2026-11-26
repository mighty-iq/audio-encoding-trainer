"""Shared helpers for Earshot's browser tests (Python Playwright, Chromium).

Every browser run holds one of two machine-wide slots (/tmp/earshot-browser.lock or …lock2; at most two browsers).
Page errors are attributed to the file in their stack: errors from shell-owned files fail the shell tests,
errors from other owners' files are reported as warnings (pass --strict to fail on them too).
Outputs (screenshots, reports) go to tests/out/, which git ignores.
"""
import contextlib
import fcntl
import functools
import http.server
import json
import os
import pathlib
import re
import threading
import time

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / 'tests' / 'out'
LOCK = '/tmp/earshot-browser.lock'
LOCKS = (LOCK, LOCK + '2')     # two slots: at most two browsers machine-wide
SHELL = ('index.html', 'js/core/', 'js/ui/', 'js/app.js', 'css/', 'earshot.html', 'earshot.srcdoc.html')


class Checks:
    """Collects named pass/fail results for one suite."""
    def __init__(self, suite):
        self.suite, self.items, self.warnings = suite, [], []

    def ok(self, cond, name, detail=''):
        self.items.append((bool(cond), name, '' if cond else str(detail)))
        return bool(cond)

    def eq(self, a, b, name):
        return self.ok(a == b, name, f'{a!r} != {b!r}')

    def warn(self, text):
        self.warnings.append(text)

    @property
    def failed(self):
        return [i for i in self.items if not i[0]]


def inherited_slot():
    """True when this process holds an open descriptor on a slot file, inherited from tools/with-browser.sh or
    flock(1), which keep the lock for their child."""
    want = {os.path.realpath(p) for p in LOCKS}
    try:
        for fd in os.listdir('/proc/self/fd'):
            try:
                if os.path.realpath(os.readlink('/proc/self/fd/' + fd)) in want:
                    return True
            except OSError:
                pass
    except OSError:
        return False
    return False


@contextlib.contextmanager
def browser_lock(timeout=1800):
    """Hold one of the two machine-wide browser slots (the protocol of tools/with-browser.sh: slot 1 is the
    classic lock file, slot 2 its sibling), so at most two browsers run at once. Gives up after `timeout` s.
    Under tools/with-browser.sh (or flock) the process inherits the wrapper's slot: then it takes no second one."""
    if inherited_slot():
        yield
        return
    t0, held = time.time(), None
    while held is None:
        for path in LOCKS:
            f = open(path, 'a+')
            try:
                fcntl.flock(f, fcntl.LOCK_EX | fcntl.LOCK_NB)
                held = f
                break
            except BlockingIOError:
                f.close()
        if held is None:
            if time.time() - t0 > timeout:
                raise TimeoutError('both browser slots stayed busy for %d s' % timeout)
            time.sleep(1)
    try:
        yield
    finally:
        fcntl.flock(held, fcntl.LOCK_UN)
        held.close()


class _Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


@contextlib.contextmanager
def http_server(root=ROOT):
    """Serve the repository like GitHub Pages does (static files) on a free local port."""
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(_Quiet, directory=str(root)))
    th = threading.Thread(target=srv.serve_forever, daemon=True)
    th.start()
    try:
        yield f'http://127.0.0.1:{srv.server_address[1]}'
    finally:
        srv.shutdown()
        srv.server_close()


def launch(pw):
    return pw.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])


def owner(rel):
    """'shell' for shell-owned files, else the area (audio, engine, ex, data, …)."""
    m = re.search(r'(js/app\.js|js/[a-z]+/|css/|index\.html|dist/|data/|audio/)', rel or '')
    if not m:
        return 'shell'
    seg = m.group(1)
    if seg in ('js/app.js', 'css/', 'index.html', 'dist/', 'js/core/', 'js/ui/'):
        return 'shell'
    return seg[3:-1] if seg.startswith('js/') else seg.rstrip('/')


_DIST = {}


def dist_owner(path, line):
    """Map a line of a single-file build back to the script it came from (markers `<script>/* src */`)."""
    f = pathlib.Path(path)
    if not f.exists():
        return 'shell'
    key = (str(f), f.stat().st_mtime)
    if key not in _DIST:
        marks = []
        for i, text in enumerate(f.read_text(encoding='utf8', errors='replace').split('\n'), 1):
            m = re.match(r'<script>/\* (\S+) \*/', text)
            if m:
                marks.append((i, m.group(1)))
        _DIST.clear()
        _DIST[key] = marks
    src = 'index.html'
    for start, name in _DIST[key]:
        if start <= line:
            src = name
    return owner(src)


def who(where):
    m = re.search(r'(?:file://|https?://[^/\s]+)(/[^\s:)]+)(?::(\d+))?', where or '')
    if not m:
        return 'shell'
    path, line = m.group(1), int(m.group(2) or 0)
    if path.endswith(('earshot.html', 'earshot.srcdoc.html')) and line:
        local = ROOT / 'dist' / pathlib.Path(path).name
        return dist_owner(str(local), line)
    return owner(path)


class Tab:
    """A page plus everything it reported: page errors and console errors with their source files."""
    def __init__(self, page):
        self.page, self.errors = page, []
        page.on('pageerror', self._pageerror)
        page.on('console', self._console)

    def _pageerror(self, err):
        stack = getattr(err, 'stack', '') or ''
        self.errors.append({'kind': 'pageerror', 'text': f'{err.name}: {err.message}' if hasattr(err, 'name') else str(err), 'where': stack})

    def _console(self, msg):
        if msg.type != 'error':
            return
        loc = msg.location or {}
        url = (loc.get('url') or '') + (':' + str(loc.get('lineNumber', 0) + 1) if loc.get('url') else '')
        self.errors.append({'kind': 'console', 'text': msg.text, 'where': url + ' ' + msg.text})

    def split(self):
        """(shell errors, other owners' errors) as (owner, text) pairs."""
        mine, other = [], []
        for e in self.errors:
            w = who(e['where'])
            (mine if w == 'shell' else other).append((w, e['text'][:300]))
        return mine, other


def new_tab(browser, viewport=(390, 844), scheme='light', config=None, init=None, block_storage=False, context=None, touch=False, real=False):
    """A page in a new context. Shell suites run the demo session (config demo) unless real=True."""
    ctx = context or browser.new_context(viewport={'width': viewport[0], 'height': viewport[1]}, color_scheme=scheme,
                                         device_scale_factor=1, has_touch=touch, is_mobile=False)
    if context is None:
        cfg = dict(config or {})
        if not real:
            cfg.setdefault('demo', True)
        if cfg:
            ctx.add_init_script('window.ES_CONFIG = Object.assign(window.ES_CONFIG || {}, ' + json.dumps(cfg) + ');')
        if block_storage:
            ctx.add_init_script("Object.defineProperty(window, 'localStorage', { configurable: true, get: function () { "
                                "throw new DOMException('The document is sandboxed.', 'SecurityError'); } });")
        if init:
            ctx.add_init_script(init)
    return Tab(ctx.new_page())


def preset(records):
    """An init script that writes Earshot records before the app loads (only when not present yet)."""
    js = []
    for key, rec in records.items():
        env = json.dumps({'rev': 1, 'at': 1, 'by': 'test', 'rec': rec})
        js.append(f"if (localStorage.getItem('earshot.v1.{key}') === null) localStorage.setItem('earshot.v1.{key}', {json.dumps(env)});")
    return 'try {' + ''.join(js) + '} catch (e) {}'


def file_url(rel='index.html'):
    return (ROOT / rel).as_uri()


def wait_ready(page, timeout=15000):
    page.wait_for_function("() => window.ES && ES.app && ES.app.booted && document.documentElement.classList.contains('ready')", timeout=timeout)


def close_sheets(page):
    """Dismiss the Chimera pop-up (full or light) and any other sheet with its primary button."""
    for _ in range(4):
        btn = page.locator('.sheet .sheet-actions .btn-primary')
        if not btn.count():
            break
        btn.last.click()
        page.wait_for_timeout(120)


def shot(page, name, full=False):
    OUT.mkdir(parents=True, exist_ok=True)
    p = OUT / f'{name}.png'
    page.screenshot(path=str(p), full_page=full)
    return p


def layout(page):
    return page.evaluate("""() => {
      const se = document.scrollingElement;
      const box = (s) => { const n = document.querySelector(s); if (!n) return null; const r = n.getBoundingClientRect();
        return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), h: Math.round(r.height), w: Math.round(r.width) }; };
      return { sh: se.scrollHeight, ih: innerHeight, sw: se.scrollWidth, iw: innerWidth,
        field: box('.trial-field'), text: box('.trial-text'), answer: box('.trial-answer'), actions: box('.trial-actions'), bar: box('.trial-bar') };
    }""")


def trial_state(page):
    return page.evaluate("() => { const b = document.querySelector('.trial-body'); return b ? b.getAttribute('data-state') : null; }")


def wait_state(page, states, timeout=12000):
    states = [states] if isinstance(states, str) else list(states)
    page.wait_for_function("(s) => { const b = document.querySelector('.trial-body'); return b && s.includes(b.getAttribute('data-state')); }",
                           arg=states, timeout=timeout)


def answer_current(page, right=True):
    """Tap the right (or a wrong) option in every slot of the running trial; returns the picks."""
    slots = page.evaluate("""() => { const t = ES.ui.trialView.current.trial;
      return t.question.slots.map(s => ({ answer: String(s.answer), options: s.options.map(o => String(o && typeof o === 'object' ? (o.id ?? o.value) : o)) })); }""")
    picks = []
    for si, s in enumerate(slots):
        idx = s['options'].index(s['answer']) if right else next(i for i, o in enumerate(s['options']) if o != s['answer'])
        page.locator(f'.answer-slot[data-slot="{si}"] .key[data-opt="{idx}"]').click()
        picks.append(s['options'][idx])
    return picks
