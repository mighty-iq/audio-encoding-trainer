#!/usr/bin/env python3
"""Earshot browser tests (Chromium via Playwright), run under the machine-wide browser lock.

    python3 tests/e2e/run_all.py              the shell suites (shell_*.py)
    python3 tests/e2e/run_all.py open layout  only suites whose name contains a filter
    python3 tests/e2e/run_all.py --all        also every other owner's standalone script listed in STANDALONE
    python3 tests/e2e/run_all.py --strict     fail on page errors from other owners' files too

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

# Standalone scripts of other owners (run as subprocesses with --all, inside the same lock).
STANDALONE = [['audio_render.py', '--quick']]


class H:
    pass


def main():
    args = [a for a in sys.argv[1:]]
    flags = {a for a in args if a.startswith('--')}
    filters = [a for a in args if not a.startswith('--')]
    suites = sorted(p.stem for p in HERE.glob('shell_*.py'))
    if filters:
        suites = [s for s in suites if any(f in s for f in filters)]
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
        if '--all' in flags:
            for cmd in STANDALONE:
                script = HERE / cmd[0]
                if not script.exists():
                    continue
                r = subprocess.run([sys.executable, str(script)] + cmd[1:], cwd=str(harness.ROOT))
                print(f"{'✗' if r.returncode else '✓'} {cmd[0]} (exit {r.returncode})", flush=True)
                if r.returncode:
                    failed.append((cmd[0], 'exit code'))
    print(f'\n{total - len([f for f in failed if f[1] != "exit code"])}/{total} checks passed, {warned} warnings, {time.time() - t0:.0f} s')
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
