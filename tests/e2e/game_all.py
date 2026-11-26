"""All of the game layer's browser suites under one browser lock (the lock queue is shared by every builder):
screens on fresh and long-term profiles, the weekly challenge, and a real session (skipped without real data).
Run: tools/with-browser.sh python3 tests/e2e/game_all.py --held [screens|weekly|session]
     (--held: the wrapper already holds a browser slot; without it the harness takes one itself)."""
import contextlib
import sys

from playwright.sync_api import sync_playwright

from harness import Checks, browser_lock, http_server, launch
import game_screens
import game_weekly
import game_session


def main():
    args = sys.argv[1:]
    held = '--held' in args
    only = set(a for a in args if not a.startswith('--'))
    c = Checks('game_all')
    with (contextlib.nullcontext() if held else browser_lock(timeout=3600)), sync_playwright() as pw, http_server() as base:
        browser = launch(pw)
        try:
            for name, mod in (('screens', game_screens), ('weekly', game_weekly), ('session', game_session)):
                if only and name not in only:
                    continue
                try:
                    mod.run(c, browser, base)
                except Exception as e:      # one suite's crash must not hide the others' results
                    c.ok(False, name + ' crashed', repr(e)[:400])
        finally:
            browser.close()
    for ok, name, detail in c.items:
        print(('PASS ' if ok else 'FAIL ') + name + ('' if ok else '  -> ' + str(detail)[:400]))
    for w in sorted(set(c.warnings)):
        print('WARN ' + w)
    print('%d/%d passed' % (len(c.items) - len(c.failed), len(c.items)))
    sys.exit(1 if c.failed else 0)


if __name__ == '__main__':
    main()
