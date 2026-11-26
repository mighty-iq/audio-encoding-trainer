# Fix round 1 (lead; 2026-11-26 20:15 UTC)

Inputs: docs/dev/reviews/RV-code.md (H1–H2, M1–M11, L1–L9) and docs/dev/reviews/RV-claims.md (C01–C40), both on
snapshot e079caf, plus docs/dev/fixlist.md. **Rule: each builder fixes every finding whose file is in its owned
paths** (CONTRACTS §1 + §11 owners), plus the cross-owner items assigned below. Verify each fix with a test that fails
before and passes after where practical; mark each finding id in your progress note as fixed / not reproduced /
declined (with reason). Commit with `TZ=UTC git commit -m ... -- <own paths>`; never push; browser runs through
`tools/with-browser.sh`. Copy fixes follow RV-claims' evidence (research notes), not memory.

## Lead rulings for cross-owner findings (binding)
- **H2 (sound that never played counts as heard):** `ES.audio.play()` returning `ok:false` (or rejecting) means the
  trial did not happen: no answer panel as if heard, no scoring, no learner update, no Lab estimate. Show "The sound
  didn't play — tap to try again" with a retry that re-unlocks audio. Shell fixes js/ui/trialview.js (and any shared
  helper); lab fixes the probe runner; exB fixes Seek.
- **H1:** the session calls `plateau.apply()` right after a breaker is chosen (shell); the engine documents the call.
- **M1 (two tabs):** the store merges the `learner` key per dial record (newer `at` wins) instead of writing the whole
  object; same for `recent` (merge by trial time) — shell's store.
- **M3 (babble beds):** the engine sends `{kind:'babble', clips:[…], db}` with one train-set clip id per talker in the
  bed (talker count from the dial); `bed:<id>` stays for ambience beds only. Engine fixes generators; audio needs no
  change.
- **M4:** the overnight check runs only in the first session of a calendar day (engine planner).
- **M6/M7/M11 (skips, pauses, reloads):** the session plan is stored at session start and resumed after a reload; a
  skipped or voided trial is replaced by a NEW trial (cap: 3 replacements per set, then the set ends early and is
  logged as partial); resuming after a pause replays the stimulus at most once per trial, a second pause voids the
  trial (never charged to the player); "End set" with fewer than half its trials answered is logged as partial and
  never counts as a completed set. Shell owns session/flow wiring; engine adds any flow support needed; lab applies the
  same pause rule in probes.
- **M8:** Weekly Night Out trials never update the learner (also not on replays): game passes `learn:false`; the
  engine's flow and the shell's session honour it.
- **M9:** imports validate nested types of every key; a damaged file is refused with a clear message and nothing
  changes (lab importer + shell store schema guard).
- **M10:** the store compacts the session log (older sessions → compact summaries; trials ring buffer as specified)
  and keeps the total under the near-full mark for ≥ 3,000 sessions (shell).
- **M2 (Voices "find" with null target):** the engine never builds a find trial for a voice without call-sign
  phrases; stimuli renders call-sign phrases for every cast voice.
- **C01/C02 (licences, credits):** lead added LICENSE and LICENSE-TEXTS.md. Stimuli writes `data/credits.js`
  (`ES.data.credits` = list of {asset, source, licence, licence URL, attribution text}) generated from the ledger,
  with licence URLs, covering every shipped source (incl. DEMAND CC BY-SA 3.0, OFL fonts, CMUdict). Shell shows it in
  About → Credits inside the app (works offline and in previews) and keeps the licence lines (MIT, CC BY-SA 4.0).
- **C06 (Free mode):** shell builds a small Free picker (choose an exercise; optional dial overrides within each
  dial's range; a "coach suggests" line from the learner's current edge) — or the setting text must not promise it.
  Build it.
- **C30 and Chimera lines:** say only that Earshot was built by the Chimera community on Discord and invite the player
  (https://discord.gg/chmr). No claims that the community helps with plateaus or pools data (shell).

## Assignments
- shell: H1, H2 (trialview), M1, M5, M6, M7, M9 (schema), M10, M11, C02 (About → Credits), C06, C30, and every
  RV-code/RV-claims finding in js/core, js/ui, css, index.html, tools/build-*; fixlist shell items.
- engine: M2, M3, M4, M8 (flow support), M6/M11 flow support, every finding in js/engine (incl. C03, C04, C05, C10,
  C24, C33), fixlist `chooseFamily` item.
- lab: H2 (probe runner), M7 (probe pause rule), M9 (importer), every finding in js/lab (C07, C13–C15, C20, C34,
  C38), "About 1 minutes".
- game: M8 (`learn:false`), every finding in js/game (C19, C25, C31), remove the FALLBACK once the shell hooks exist.
- exA: every finding in js/ex/{crowd,far,strange,repair,strategies}.js (C12, C16, C18, C21, C22, C36, C39), Far's
  room outline near "you".
- exB: H2 (Seek), every finding in js/ex/{echo,seek,voices,voices-own,missions}.js (C08, C09, C17, C23, C32, C37).
- stimuli: M2 (call-sign phrases for every cast voice), C11 (ledger accurate for what ships), C35 (matrix originality
  note), data/credits.js.
