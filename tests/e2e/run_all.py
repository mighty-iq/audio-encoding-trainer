#!/usr/bin/env python3
"""Earshot browser tests (Chromium via Playwright), run under the machine-wide browser lock.

    tools/with-browser.sh python3 tests/e2e/run_all.py              the shell suites (shell_*.py)
    tools/with-browser.sh python3 tests/e2e/run_all.py open layout  only suites whose name contains a filter
    tools/with-browser.sh python3 tests/e2e/run_all.py --all        also every other owner's suite (STANDALONE)
    tools/with-browser.sh python3 tests/e2e/run_all.py --only=lab   only the STANDALONE suites whose file name has "lab"
    tools/with-browser.sh python3 tests/e2e/run_all.py --strict     fail on page errors from other owners' files too
Under the wrapper the run uses the wrapper's browser slot; started without it, it takes one slot itself. The other
owners' suites run one after another as subprocesses inside the same slot (one browser at a time).

Each in-process suite module defines run(h) -> harness.Checks, where h has .browser, .base (an http URL serving
the repository like GitHub Pages) and .args. Screenshots and reports go to tests/out/ (git-ignored).
"""
import importlib
import pathlib
import subprocess
import sys
import time

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import harness  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402

# Standalone scripts of other owners (run as subprocesses with --all or --only=…, inside the same slot).
STANDALONE = [
    ['audio_render.py', '--quick'],
    ['ex_a_tutorial.py'], ['ex_a_tutorial.py', '--miss'], ['ex_a_layout.py', '--quick'],
    ['ex_b_tutorial.py'], ['ex_b_layout.py', '--quick'], ['ex_b_map.py'], ['ex_b_own.py'], ['ex_b_sound.py'],
    ['lab_e2e.py'],
    ['game_all.py', '--held'],
]


class H:
    pass


def main():
    args = [a for a in sys.argv[1:]]
    flags = {a for a in args if a.startswith('--')}
    filters = [a for a in args if not a.startswith('--')]
    only = [a.split('=', 1)[1] for a in flags if a.startswith('--only=')]
    suites = [] if only else sorted(p.stem for p in HERE.glob('shell_*.py'))
    if filters:
        suites = [s for s in suites if any(f in s for f in filters)]
    extra = [c for c in STANDALONE if '--all' in flags or any(o in c[0] for o in only)]
    harness.OUT.mkdir(parents=True, exist_ok=True)
    failed, warned, total = [], 0, 0
    t0 = time.time()
    with harness.browser_lock():
        with sync_playwright() as pw, harness.http_server() as base:
            h = H()
            h.browser, h.base, h.args = harness.launch(pw), base, flags
            for name in suites:
                t1 = time.time()
                try:
                    checks = importlib.import_module(name).run(h)
                except Exception as e:  # a crashed suite is one failure with its reason
                    checks = harness.Checks(name)
                    checks.ok(False, 'suite crashed', repr(e)[:500])
                if '--strict' in flags:
                    for w in checks.warnings:
                        checks.ok(False, 'strict: ' + w[:200])
                total += len(checks.items)
                bad = checks.failed
                print(f"{'✗' if bad else '✓'} {name}: {len(checks.items) - len(bad)}/{len(checks.items)} passed ({time.time() - t1:.1f} s)", flush=True)
                for _, n, d in bad:
                    print(f'    ✗ {n}' + (f' — {d}' if d else ''), flush=True)
                for w in checks.warnings:
                    print(f'    ! {w}', flush=True)
                warned += len(checks.warnings)
                failed += [(name, n) for _, n, _ in bad]
            h.browser.close()
        for cmd in extra:
            script = HERE / cmd[0]
            if not script.exists():
                continue
            t1 = time.time()
            r = subprocess.run([sys.executable, str(script)] + cmd[1:], cwd=str(harness.ROOT))
            print(f"{'✗' if r.returncode else '✓'} {' '.join(cmd)} (exit {r.returncode}, {time.time() - t1:.0f} s)", flush=True)
            if r.returncode:
                failed.append((' '.join(cmd), 'exit code'))
    ran = [c for c in extra if (HERE / c[0]).exists()]
    bad_sa = len([f for f in failed if f[1] == 'exit code'])
    print(f'\n{total - len([f for f in failed if f[1] != "exit code"])}/{total} checks passed, {warned} warnings'
          + (f'; other owners\' suites: {len(ran) - bad_sa}/{len(ran)} passed' if ran else '') + f', {time.time() - t0:.0f} s')
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
