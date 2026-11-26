#!/bin/sh
# Run a browser test while holding one of two machine-wide browser slots (at most two browsers at once).
# Usage: tools/with-browser.sh python3 tests/e2e/run_all.py ...
# Slot 1 is the classic lock file, so plain `flock /tmp/earshot-browser.lock` users keep working.
while :; do
  for lock in /tmp/earshot-browser.lock /tmp/earshot-browser.lock2; do
    flock -n -E 75 "$lock" "$@"
    rc=$?
    [ "$rc" -ne 75 ] && exit "$rc"   # 75 = slot busy: try the other slot
  done
  sleep 2
done
