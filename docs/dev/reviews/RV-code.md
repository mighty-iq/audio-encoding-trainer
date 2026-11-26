# RV-code: logic and robustness review of the frozen snapshot (commit e079caf)

Reviewed 2026-11-26 20:00 UTC (`date -u`) by an agent that did not build the code. Scope: js/**, index.html,
tools/build-single.mjs, checked against docs/dev/CONTRACTS.md, docs/dev/briefs/phase3.md (RV-code) and PLAN §7–8.

**Counts: 2 high, 11 medium, 9 low.**

How it was checked: I read every core, ui, engine and audio module, plus the Lab runner and exporter and the game
record and weekly. I ran Node scripts against the snapshot's own loaders (tests/sim/load.mjs, and makeWindow /
sharedStorage from tests/unit/run.mjs). I ran Chromium through Python Playwright via tools/with-browser.sh, on two
pages: index.html over file:// with the real packs, and dist/earshot.srcdoc.html built in the snapshot. Unit suite
on this commit: 162 pass, 2 fail (engine-realdata.test.mjs, see M2).

## High

### H1: Plateau breakers are announced but never applied, so the same message repeats after every set
- **Where:** js/ui/session.js:262–266 calls `ES.engine.plateau.check()` only. `ES.engine.plateau.apply()`
  (js/engine/plateau.js:142–152) is never called anywhere in js/**. Only tests/sim/run.mjs:121–123 and a unit test call it.
- **What goes wrong:** check() has no side effects by design ("apply() changes the learner state"). Because apply()
  is never called:
  - breadth is never widened, no focus dial is forced, anchors are never boosted and no exercise is rested;
  - `plat[ex].at` and `plat[ex].k` stay unset, so the 3-session spacing guard (plateau.js:102) never holds and the
    breaker order never advances.

  Once a stall is detected, every later set of that exercise shows "A plateau, and what changes next … Next sets
  bring in more voices…" with a Chimera plateau invitation, and nothing changes. The standing rule ("change something
  for a stated reason") is not met. The breaker statistics in docs/dev/progress/engine.md come from the simulation
  loop, which does call apply().
- **Failing case:** Node, engine loader, fixture data, with a flat log built as in tests/unit/engine-items.test.mjs.
  For k = 9…16 sessions, `check()` without apply returns
  `variety variety variety variety variety variety variety variety`. Afterwards the learner's breadth is `{}` and plat
  is `{}`. The same loop with apply returns `variety - - focus - - anchors -`.
- **Fix:** in finishSet, after check() returns non-null, call
  `E().plateau.apply(set.exId, pl, { log: store().peek('log') })` and then saveLearner(). Add a session-level test:
  the next check returns null, breadth rises by 0.3, and the next breaker is 'focus'.

### H2: A sound that never played is treated as heard (training trials, Lab probes, Seek)
- **Where:**
  - js/audio/render.js:336: with no audio context, `ended` resolves `{ok:false, reason:'no-audio'}`.
  - js/audio/render.js:346–347: with a suspended or interrupted context, the watchdog resolves
    `{ok:false, reason:'timeout'}` after duration + 2.5 s.
  - js/ui/trialview.js:27–31 maps every end to `{silent:false}`. openAnswer (line 130) therefore shows the normal
    "Your answer:", and the response is scored and recorded (session.record updates the learner).
  - js/lab/runner.js:119 and :169 notice `ok === false` and show "Sound is unavailable here.", but still enable the
    panel and record the trial into the probe estimate (saved run, trend, verdict).
  - js/ex/seek-scene.js:184–187 starts the live scene without checking the context state.
- **What goes wrong:** the audio context can be suspended or interrupted mid-session: a phone call, another app taking
  audio focus, a Bluetooth switch, or an unlock that did not take. The trials then play silently but still count.
  Thresholds drift toward easy, and Lab estimates absorb blind guesses.
- **Failing case:** Chromium with the real packs. Start a one-set Crowd session, then on the play route run
  `c = ES.audio.ctx.raw(); c.resume = () => Promise.resolve(); c.suspend()`. The trial reaches state 'answer' with the
  status "Your answers:" while `ES.audio.ctx.state()` is 'suspended'. After one pick, `ES.engine.learner.state.n` goes
  from 0 to 1 and the set records the result.
- **Fix:**
  - Trialview: pass `{silent: !(r && r.ok)}` through from ES.audio.play, or check `ctx.state === 'running'` before
    playing. On a silent play, never call cfg.score or onResult. Show a "No sound came through: tap to play again"
    button whose tap calls ES.audio.ctx.unlock(), then replay.
  - Lab runner: void the trial and retry. Never record it.
  - Seek: unlock the context in the grab gesture and wait for 'running' before begin().
  - Optionally use ES.audio.ctx.onState to pause the trial when the state leaves 'running'.

## Medium

### M1: Two tabs: each tab's learner save overwrites the other tab's training
- **Where:**
  - js/engine/learner.js:301–304: save() is `store.set('learner', self.state)`, the whole in-memory state.
  - js/core/store.js:49–57: a `storage` event or refresh() adopts the other tab's record and sets baseRaw.
  - js/core/store.js:167–176: flush() merges only when the stored text differs from baseRaw.
  - js/ui/session.js:297–299: the engine learner is reloaded only outside a set.
- **What goes wrong:** tab A is in a set, or paused on the play screen, while tab B trains.
  1. A adopts B's record into its store cache, but A's engine learner keeps its old state.
  2. A's next answer saves that old state. The stored text equals baseRaw, so no merge runs and B's dial posteriors
     are reverted.
  3. B then does the same to A.

  The contract's "storage event merge by record id" never happens for the learner.
- **Failing case:** Node, two windows on the repo's `sharedStorage()` shim with core, engine and fixture loaded. Tab A
  runs 12 Crowd trials and saves after each. Tab B runs 12 Far trials without reloading, as it would in a set.
  Stored dials afterwards: `far.dist` and `far.noise` only. `crowd.tmr`, `crowd.similar` and `crowd.talkers` are lost,
  and `n` is 12.
- **Fix:** make save() merge: `store.update('learner', r => merge(r, self.state))`, newest `at` per dial and cond
  entry, max for best and n. Alternatively, reload the learner between trials when a remote change arrives. See also L8.

### M2: Voices "find" trials with no target voice, a "null" key and answer null
- **Where:** js/engine/items/voices.js:83–89 and 103–105. When no met voice has call-sign phrases, the target falls
  back to such a voice, and `tw` and `tclip` stay null. In this build, 8 of the 20 cast voices have only 2 sentence
  clips: af_alloy, af_aoede, af_nova, af_sky, am_echo, am_liam, am_onyx, bf_alice.
- **What goes wrong:** the first voices a player meets come from a seeded shuffle of the cast, so meeting two
  phrase-less voices first is plausible (about 1 in 7 orders). Once breadth ≥ 0.4 (immediately in Variety mode),
  25 % of Voices trials are 'find' trials. For such a player, a 'find' trial is broken:
  - parts are `[{clip:null, role:'target'}, maskers…]`;
  - options are `[null, "heart", "fruit", "car"]` and the answer is null;
  - the feedback says "Selma said “null”.".

  The renderer drops the null part, so only the crowd is heard. The "null" key is scored wrong, and the snr dial learns
  from the trial. This is the failure in tests/unit/engine-realdata.test.mjs ("one voice per sex", "a single voice":
  `C[p.clip]` undefined), and it is why the unit suite is red on this commit.
- **Failing case:** Node, real data:

  ```js
  ES.engine.items.voices.make(ES.core.rng('find0'),
    { dials: { cast: 0, similar: 0, snr: 12, length: 0 }, focus: 'snr' },
    { met: ['kokoro.af_alloy', 'kokoro.af_aoede'], task: 'find', playerSeed: 'p' })
  ```

  This returns the question above, and 40 of 40 such trials lack a target clip. Through flow in Variety mode with
  met = alloy + echo, 1 of 8 'find' trials had no target.
- **Fix:** pick the 'find' target only among met voices that have a usable clip. If there is none, fall back to 'who'
  or 'meet' and list the change in meta.relaxed. Keep the real-data test green.

### M3: Every "babble" bed plays as steady speech-shaped noise
- **Where:**
  - The generators emit `{kind:'babble', bed:<clip id>}` when a recorded babble bed exists: js/engine/items/crowd.js:116–118,
    echo.js:73–74, strange.js:75–76, voices.js:108–109 and seek.js:57–59.
  - The renderer's babble kind reads only `clips`: js/audio/render-prep.js:133–137 (bedClips) and 141–144, which falls
    back with "babble bed without clips; speech-shaped noise used". js/audio/live.js:30–37 loads beds through the same
    bedClips.
- **What goes wrong:** the build has exactly one bed:babble clip, so `X.bed(…, ['babble'])` always returns it and the
  talker-clip path (X.babbleClips) is never used. On the real build, with 800 random settings per generator, every
  babble bed lacked clips: crowd 347/347, strange 114/114, echo 140/140, voices 335/335.

  Crowd at breadth < 0.3 uses only 'babble', so it plays speech-shaped noise from the first session. The levels are
  correct, but the masker is steady noise instead of babble, which is not the condition the exercise and its bet
  describe. The warning only lands in report.warnings, which nothing reads.
- **Failing case:** render any Crowd spec made at breadth 0.2. `report.warnings` contains "babble bed without clips;
  speech-shaped noise used".
- **Fix:** either the generators send a recorded babble bed as `{kind:'ambience', bed:id}`, or render-prep treats
  `bed.bed` for kind 'babble' like ambience (bedClips returns `[bed.bed]`). Add a test that no generator spec
  produces that warning.

### M4: The "overnight check" repeats at the start of every session of the day
- **Where:**
  - js/engine/planner.js:37–61: overnight() looks only for sessions on an earlier day.
  - js/engine/planner.js:85 and 91: session() adds the overnight set whenever fresh ears does not apply.
  - The Home card repeats it through js/game/returns.js `upcoming()`.
- **What goes wrong:** PLAN §7 says the *first* set of a day re-tests yesterday's hardest condition. Instead, the
  second and third sessions open with "Yesterday's hardest: …" again. The condition has been practised today, and
  today's voices are not avoided. The game reports an overnight result each time.
- **Failing case:** Node, real data. Log one session yesterday (crowd, focus tmr, end −4) and one earlier today.
  `planner.session({now, log, …}).sets[0]` is a crowd overnight set with the text "Yesterday's hardest: your voice vs
  the others at -4 dB, now with a voice you did not hear yesterday." A third session gives the same set again.
- **Fix:** in overnight(), return null when a session has already started today.

### M5: "Delete everything" is undone by the session that is waiting (and by other tabs in a set)
- **Where:**
  - js/ui/screens/settings-data.js:82–85: deleteAll() wipes the store, then calls session.abandon().
  - js/ui/session.js:294: when the session has finished sets, abandon() calls finish().
  - js/ui/session.js:280–289: finish() runs writeLog, which writes the session and the waiting set's trial rows back
    after the wipe.
  - Other tabs: js/ui/session.js:297–299 skips the learner reload in a set, so their next save rewrites the learner
    and their writeLog rewrites the log.
- **Failing case:** Chromium, real packs.
  1. Start a session of 2 Crowd sets × 2 trials.
  2. Finish set 1, then answer 1 trial of set 2.
  3. Tap Pause, open Settings, tap Delete everything and confirm.

  Afterwards localStorage still holds `earshot.v1.log` with 1 session (1 set) and `earshot.v1.trials` with 1 row.
- **Fix:** discard the session before the wipe without writing, for example with `abandon({discard:true})`. When a
  remote `$wipe` arrives, also drop the in-memory session and learner even during a set, then route Home.

### M6: A skipped trial is drawn again identically; three skips turn the set into demo tones and drop its real trials from the log
- **Where:**
  - js/ui/session.js:207–213: skip() clears sc.pending. After 3 skips it sets `set.exId = 'demo'` and `set.sc = null`.
  - js/engine/flow.js:50–55: the next draw uses the same sc.i forks, the same learner state and the same setting.seed.
  - js/ui/screens/play.js:66.
- **What goes wrong:** after a render or decode failure, "Skip this trial" brings back the same clips, beds and seed,
  which fail again. After three tries the rest of the set is demo tone trials. finishSet then logs a fallback entry
  with ex 'demo' and mixed counts instead of flow.end, so the real trials' summary (idx, foci, pbs) is lost while the
  learner keeps their updates. No trial is ever replaced, so a "replacement cap" has nothing to cap.
- **Failing case:** Node, real data, 120 sets. After 3 answered trials, clear sc.pending twice and draw again. All
  120 replacement draws use identical parts and beds.
- **Fix:**
  - Keep a skip counter on the flow context and fork the draw with it (`'m' + sc.i + ':' + skips`).
  - Exclude the failing clips for the rest of the set.
  - Cap replacements at about 3 per set, then end the set through flow.end as a partial set instead of switching to
    demo trials.

### M7: Pause replays the same stimulus, as often as the player likes (training and Lab)
- **Where:**
  - js/ui/trialview.js:255–273: a pause during listen, loading or prime makes resume play the cached buffer again
    from the start.
  - js/lab/runner.js:254–264: Resume replays the current Lab trial, including the whole ~60 s Story passage.
  - js/ui/screens/play.js:45–49: a hidden tab also pauses.
- **What goes wrong:** a stimulus heard partly and then again in full (or many times: Pause, Resume, Pause …) is
  scored as a one-listen trial. That biases learner thresholds and Lab estimates, most of all Story, whose questions
  then follow a second hearing. Nothing is voided or replaced, and there is no cap.
- **Failing case:** in any keyword trial, tap Pause during "Listen…", then Resume. The same buffer plays again. This
  repeats without limit, and the answer is then scored normally through flow.answer.
- **Fix:** void an interrupted stimulus once more than about 0.5 s of it has played.
  - Training: draw a replacement at the same level.
  - Lab: run.next() at the same level, marking the voided item.
  - Cap replacements at about 2 per set or run. Past the cap, count the trial as heard, or leave the run unsaved.
  - At minimum, flag such trials `replayed:true` so that the learner and the probe estimate can skip them.

### M8: Weekly Night Out trials update the learner, including replays of items the player already knows
- **Where:**
  - js/game/weekly.js:72: the weekly setting is `{warmup:false, anchor:false}`, with no noUpdate.
  - js/ui/session.js:148–150 (plan.make) and 202: record() calls L.update for every trial that has no flow.
  - js/game/ui.js:155 invites the player to "play again for practice", and the replay repeats the identical 24 trials.
- **What goes wrong:** the first run already feeds a fixed easy-to-hard ramp into the player's posteriors and their
  edge and breadth history. Each practice replay feeds the same items again, with answers the player knows. That
  pushes thresholds up (Crowd tmr toward −9 dB, and so on), so the next edge trials come out too hard.
- **Fix:** set `setting.noUpdate = true` on weekly trials (the learner already honours it), and keep weekly trials
  out of `recent` and `edge`. Alternatively, update only on the first complete run.

### M9: Damaged imports with wrong types inside learner fields are accepted, then break every set of that exercise
- **Where:**
  - js/core/store-schema.js:290–296: recent, cond, path, plat, edge and cast are `T.any`, so sanitize lets any type
    through.
  - js/engine/learner.js:76–80: load() copies them unchecked.
  - js/engine/learner.js:210–220: the update pushes onto recent and edge and writes into cond entries.
  - js/engine/path.js:67–70.
- **Failing case:** Node. store.importAll a backup whose learner has one bad value, then run a Crowd set through flow.
  Every import reports ok with 0 repaired; the set then fails:

  | Bad value | Error when the Crowd set runs |
  |---|---|
  | `recent.crowd = "x"` | "rec.push is not a function" |
  | `edge.crowd = {}` | "er.push is not a function" |
  | `cond['crowd:base'] = 5` | "Cannot create property 'n' on number '5'" |
  | `path.crowd = "x"` (Path mode) | "Cannot read properties of undefined (reading 'mix')" |

  In the app, a throw from flow.next leads to three skips and then demo tones for every Crowd set. A throw from
  flow.answer makes the trial view fall back to the demo scorer, and the same pending trial repeats. The bad record is
  persisted, so it survives reloads.
- **Fix:** give these maps typed schemas:
  - recent and edge: arrays of numbers between 0 and 1, capped at 30 and 20;
  - cond: {n: int ≥ 0, acc: 0–1, at};
  - path: {i, hist, run, n, best}.

  Have learner.load() drop entries of the wrong shape, and add these cases to the import tests.

### M10: The log outgrows browser storage long before its 3,000-session cap
- **Where:** js/core/store-schema.js:300–304: `log.sessions` is capped at 3000 entries, each holding the whole
  flow.end output with end, avg, sd, foci and voices. Also js/core/store.js:17.
- **What goes wrong:** measured with the real engine, a 5-set session entry is about 2.9 K characters, and one set
  entry is up to 0.74 K. At the cap that is about 8.8 M characters for the log alone. The store's own near-full mark
  (3.5 M characters, store.js:17) is reached after about 1,200 sessions, and typical per-origin localStorage limits
  are about the same size or lower. From then on every log write fails. "Not saved" stays on for good, the session
  history exists only in memory, and the only way out the app offers is Delete everything.
- **Fix:**
  - Compact older sessions: keep full entries for about the last 200 sessions, and per-set {ex, n, correct, focus,
    idx, end} for the rest, dropping voices, sd and avg.
  - Cap the log by size, not only by count.
  - Test a simulated 3-year log against a quota of about 2.5 M characters.

### M11: Sessions live only in memory, and "End set" counts a partial set as a full one
- **Where:**
  - js/ui/session.js:11: the session object S exists only in memory.
  - js/ui/session.js:198 and 214–221: trial rows are written only at set end.
  - js/ui/session.js:271–278: endSetEarly() calls finishSet() with n = the results so far, which triggers the PB,
    plateau and venue-best logic and counts the session.
- **What goes wrong:**
  - A reload or tab discard mid-session (frequent on phones) loses the plan, the player's place in it and the
    waiting set's trial rows, although the learner kept those trials. There is no stored plan to resume from. The
    next Start builds a new plan and repeats the overnight or fresh-ears set (see M4).
  - "End set" after a single trial logs a one-trial set. That set can raise "New personal best" and feeds plateau
    windows and venue bests.
  - The Lab, by contrast, never saves an interrupted run.
- **Fix:**
  - Between trials, persist a small `session` record: {id, plan, setIndex, results, rows, flow snapshot}. Offer
    "Resume session" after a reload.
  - Mark sets ended early `partial:true` and keep them out of PB, plateau and venue-best updates, or require at least
    10 scored trials.

## Low

- **L1: a replay can start under the Pause sheet** (js/ui/trialview.js:192, 226–228, 256–266).
  - What goes wrong: pause() stops only a replay that is already playing. A replay that is still rendering starts
    under the Pause sheet, or in a hidden tab, once its render ends.
  - Failing case (Chromium): delay renders by 2.5 s, tap a replay, then tap Pause. 3.5 s later the page reports
    `sheetOpen:true`, `playing:true` and `data-playing:"replay"`.
  - Fix: on pause(), bump a replay token, and check it in the `get().then` callbacks of replay() and playSeq().
- **L2: the tutorial ignores a hidden tab** (js/ui/tutorial.js).
  - What goes wrong: there is no visibilitychange handling and no Pause, so a demo or practice sound keeps playing in
    a hidden tab. The clock pauses; the trial does not.
  - Fix: handle a hidden tab the way play.js onVis does.
- **L3: the Lab runner misses a hidden tab during loading** (js/lab/runner.js:48).
  - What goes wrong: the handler pauses only in 'listen' and 'answer'. If the tab is hidden during 'loading', the
    probe sound plays in the background when the render ends. On return the answer panel waits, with no pause sheet.
  - Fix: include 'loading' in the check (openPause already handles that state).
- **L4: the output level can fall up to 1.5 dB below out.db** (js/audio/render.js:195–204).
  - What goes wrong: the mix is not re-normalised after limiting and rebalancing. In 4 of 84 real specs rendered in
    Chromium, the output active level was −20.28 to −21.49 dBFS (the contract says −20 ± 0.25). TMR and SNR stayed
    within ±0.02 dB.
  - Fix: after the second limiter pass, re-measure and rescale.
- **L5: save results are misreported** (js/core/store.js:205–206).
  - What goes wrong: set() returns the result of flushAll(), so a key that was written is reported as not saved while
    another key fails. The Lab result panel then shows "not saved on this device" (js/lab/runner.js:222, 234).
    Conversely, importAll reports "Imported" even when nothing reached storage.
  - Fix: return the key's own flush result, and report persistence per key.
- **L6: newer-version records are served unchecked** (js/core/store.js:51).
  - What goes wrong: a record from a newer schema is cached raw and served by get() and peek() as if it were v1.
    Screens that assume the v1 shape can throw in read-only mode.
  - Fix: serve v1 defaults for reading and keep the newer record aside.
- **L7: renders have no timeout** (js/ui/trialview.js:99–106, js/lab/runner.js:115).
  - What goes wrong: if decodeAudioData or startRendering hangs, the trial shows "Getting the sound ready…" with no
    Skip button; the only way out is Pause, then End set.
  - Fix: race the render against about 15 s and fall back to the error state, which offers Skip.
- **L8: some merge rules do not do what they say** (js/core/store-schema.js:291–297, 312).
  - learner path, plat, edge and cast merge as "newest by `at`", but those records carry no `at`, so the last writer
    wins.
  - game.pbs merges as last-writer-wins, so a better best from another tab can be lost.
  - learner.n merges as max, so two tabs undercount the total.
  - Fix: stamp `at` when writing those records, and use max for pbs.
- **L9: Focus-mode sets reuse `focus` for a flag** (js/engine/planner.js:101).
  - What goes wrong: these sets carry `focus: true`, and js/ui/session.js:115 passes it to flow.start as a focus-dial
    id; the controller compares `d.id === true`, which never matches. Harmless today, but it breaks the §5 meaning of
    `focus`.
  - Fix: rename the flag, for example `focusEx`.

## Looked solid
- **Level math:** I rendered 84 real specs from six generators in Chromium. Reported TMR and SNR were within
  ±0.02 dB of the spec, and peaks were ≤ −1 dBFS.
- **No HTML injection sinks:** text goes in only through textContent or createTextNode; the `html` option of
  ES.core.util.el is never used, and there is no eval or string timer.
- **Exports:**
  - The backup leaves out the playtest record and device facts.
  - The pooled export uses a random id and relative days, with no record ids or times. The nickname and device facts
    appear only when ticked.
  - Probe trial arrays carry no timestamps.
  - exportAll never reads IndexedDB.
  - The CSV export guards against formula injection.
- **Store basics:**
  - Blocked storage switches to memory mode with a lasting banner.
  - When storage is full, writes stay in memory and are retried.
  - Corrupt records are kept aside; newer-version keys make the tab read-only.
  - `$wipe` and `clear()` propagate to other tabs.
  - hold() and release() stay balanced (held is false after long runs).
- **Long run:** 160 real trials over 8 sets and six exercises, with playback shortened. The heap held at about 12 MB,
  DOM nodes and document listeners stayed flat, and the clip cache stayed capped at 60 s.
- **Sandboxed srcdoc build:** it boots in memory mode with the banner, in-app links and Back work, a real Far trial
  reaches the answer state, and there were no console errors.
- **Active-time clock:** pause reasons stack and clear independently. Hidden-tab, menu and away time never counts,
  and idle time is capped at 60 s.
- **Chimera invitations** queue during sets and appear only between sets.
- **Randomness:** sfc32 with labelled forks; no Math.random in the engine or the DSP; replays reuse the trial seed.

## Notes
- js/ex/voices-own.js and js/ex/missions.js are not in this snapshot, so own-voice recording and storage were not
  reviewed. Store.wipe does delete the `earshot-own` database.
- The Node and browser checks above were one-off scripts kept outside the repository. Each failing case is described
  in enough detail to rebuild as a test.
