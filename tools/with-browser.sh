#!/bin/sh
# Run a browser test while holding one of three machine-wide browser slots (at most three browsers at once).
# Usage: tools/with-browser.sh python3 tests/e2e/run_all.py ...
# Slot 1 is the classic lock file, so plain `flock /tmp/earshot-browser.lock` users keep working.
# Interactive sessions that keep one browser open for a long time should take a slot only while they drive it.
while :; do
  for lock in /tmp/earshot-browser.lock /tmp/earshot-browser.lock2 /tmp/earshot-browser.lock3; do
    flock -n -E 75 "$lock" "$@"
    rc=$?
    [ "$rc" -ne 75 ] && exit "$rc"   # 75 = slot busy: try the next slot
  done
  sleep 2
done
