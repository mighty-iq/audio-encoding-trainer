"""Shared helpers for the game layer's browser tests (Python Playwright; see harness.py for the lock and server).

The test page is index.html with its script block rebuilt from the files on disk (tools/build-index.mjs --list), so the
game scripts load even while the shell's index.html is stale; it lives in tests/out/ (git-ignored) with <base href="/">
and is served by harness.http_server from the repository root.
The long-term profile comes from tests/fixtures/game-longterm.js (simulated learner, no real player data), with every
time shifted so the last session ended one day before now.
"""
import json
import pathlib
import re
import subprocess
import time

from harness import ROOT, OUT

DAY = 86400000


def build_page():
    OUT.mkdir(parents=True, exist_ok=True)
    scripts = subprocess.run(['node', str(ROOT / 'tools' / 'build-index.mjs'), '--list'], capture_output=True, text=True, check=True).stdout.split()
    html = (ROOT / 'index.html').read_text(encoding='utf8')
    a, b = html.index('<!-- scripts:begin -->'), html.index('<!-- scripts:end -->') + len('<!-- scripts:end -->')
    block = '\n'.join('<script src="%s"></script>' % s for s in scripts)
    html = html[:a] + block + html[b:]
    html = html.replace('<head>', '<head>\n<base href="/">', 1)
    page = OUT / 'game-index.html'
    page.write_text(html, encoding='utf8')
    return 'tests/out/game-index.html'


def _shift(obj, delta, keys=('start', 'end', 'at', 'open', 'bestAt')):
    if isinstance(obj, dict):
        for k, v in list(obj.items()):
            if k in keys and isinstance(v, (int, float)) and v > 1e12:
                obj[k] = v + delta
            elif k == 'h' and isinstance(v, list):
                obj[k] = [[p[0] + delta, p[1]] if isinstance(p, list) and p and p[0] > 1e12 else p for p in v]
            else:
                _shift(v, delta, keys)
    elif isinstance(obj, list):
        for x in obj:
            _shift(x, delta, keys)


def longterm_records(now_ms=None):
    """{learner, log, game, trials, profile} records for harness.preset(), times shifted to end one day before now.
    The trial rows matter: earshots and milestones never go beyond a level the player was tested at."""
    src = (ROOT / 'tests' / 'fixtures' / 'game-longterm.js').read_text(encoding='utf8')
    body = json.loads(re.search(r'window\.GAME_LONGTERM = (\{.*\});', src, re.S).group(1))
    now_ms = now_ms or int(time.time() * 1000)
    delta = now_ms - DAY - body['t1']
    learner, log, game = body['learner'], body['log'], body['game']
    _shift(learner, delta)
    _shift(log, delta)
    _shift(game, delta)
    game['badges'] = {k: v + delta for k, v in game.get('badges', {}).items()}
    trials = {'v': 1, 'rows': [[r[0] + delta] + r[1:] for r in body.get('trials', {}).get('rows', [])]}
    profile = {'v': 1, 'createdAt': body['t0'] + delta, 'nickname': '', 'welcomeSeen': now_ms - DAY,
               'settings': {'theme': 'system', 'mode': 'edge', 'sessionMin': 15, 'headphones': False, 'playtest': False, 'captions': False},
               'tutorials': {'crowd': True, 'far': True, 'strange': True, 'repair': True, 'echo': True, 'seek': True, 'voices': True}}
    return {'learner': learner, 'log': log, 'game': game, 'trials': trials, 'profile': profile}


def game_errors(tab):
    """Page errors attributed to js/game files (others are reported as warnings by the caller)."""
    mine, other = [], []
    for e in tab.errors:
        (mine if 'js/game/' in (e.get('where') or '') + (e.get('text') or '') else other).append(e['text'][:300])
    return mine, other


def goto(page, base, screen, params=None):
    page.goto(base + '/' + build_page.path + '#' + screen if screen else base + '/' + build_page.path)
    page.wait_for_function("() => window.ES && ES.app && ES.app.booted", timeout=20000)
    if params is not None:
        page.evaluate('([n, p]) => ES.core.router.go(n, p)', [screen, params])
    page.wait_for_timeout(150)


build_page.path = 'tests/out/game-index.html'
