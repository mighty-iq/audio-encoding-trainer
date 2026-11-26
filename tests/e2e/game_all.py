"""All of the game layer's browser suites under one browser lock (the lock queue is shared by every builder):
screens on fresh and long-term profiles, the weekly challenge, and a real session (skipped without real data).
Run: python3 tests/e2e/game_all.py   (no outer flock: harness.browser_lock takes /tmp/earshot-browser.lock itself)"""
import sys

from playwright.sync_api import sync_playwright

from harness import Checks, browser_lock, http_server, launch
import game_screens
import game_weekly
import game_session


def main():
    only = set(sys.argv[1:])
    c = Checks('game_all')
    with browser_lock(timeout=3600), sync_playwright() as pw, http_server() as base:
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
