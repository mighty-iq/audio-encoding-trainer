#!/bin/sh
# Run a browser test while holding one of two machine-wide browser slots (at most two browsers at once).
# Usage: tools/with-browser.sh python3 tests/e2e/run_all.py ...
# Slot 1 is the classic lock file, so plain `flock /tmp/earshot-browser.lock` users keep working.
while :; do
  for lock in /tmp/earshot-browser.lock /tmp/earshot-browser.lock2; do
    if flock -n "$lock" -c 'true' 2>/dev/null; then
      flock -n "$lock" "$@" && exit 0
      rc=$?
      [ "$rc" -ne 1 ] && exit "$rc"   # 1 = lock lost to a racer: try again
    fi
  done
  sleep 2
done
