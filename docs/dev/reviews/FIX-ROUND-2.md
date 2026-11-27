# Fix round 2 — routing (lead, 2026-11-26 23:50 UTC)

Sources: RV-stimuli (ST-), RV-play-a11y (P-, A-), FRESH-A (FA-), FRESH-B (FB-). Each owner reports in its progress
note and in requests.md. Status is filled at the end of the round.

| Owner | Items | Status |
|---|---|---|
| engine | ST-02 Repair without a central answer; ST-03 pool-matched foils (all exercises); Echo answer balance and matrix-word exclusion (a185d3b); ST-11 Repair mask lead; solver number words; FA Echo variety (≥ 8 distinct messages per set, not the tutorial's message); FB-C1 every exercise within the first three sessions; session count = ≥ 1 answered trial; P10 planner copy; P11 dial label || done (a185d3b, e519238): cues within chance + 0.05 per bin, solver 0 failures / 10,000 seeds |
| stimuli | ST-04 matrix re-cuts; ST-06 drop unused probe clips; ST-07 Story options; ST-08 accent labels; ST-10 F0; ST-11 missing word times; ST-12 intros and phrases; ST-13 CREMA-D levels; ST-14 ledger; P12 cast conjugation || done (1f54600): 1,200 clips, 89 voices, 8.235 MB MP3; matrix 50/50 per talker after three word swaps |
| shell | download helper (artifact capability + copy fallback); A1 landscape; P1/P16 failures move on; P7 End set; one session definition; Back stack; tutorial Continue; answer-key focus/hover; Exercises list + Seek in Free; P3 shared formatter; P5 headline; header and Note overlap; A2–A6; P6; P8; P9; P13; P14 || done (fe51b23, ff62544, 12f2120, aa6dfa2, b2f617f) incl. P4 Path display |
| game | P2 milestones (conservative, tested, ≤ 2 per screen) + FB-C3; P3 switch to the shared formatter; P10 copy; P15 cast wall; P12 blurb capitals; A3 targets; FB-D1/D2 venue links in a session; P18 overnight wording || done (f4bac78; cast label by the lead 2026-11-27): overclaim ≤ 9.4 % per exercise |
| exB | FB-C2 Seek scoring rule visible and consistent; ST-12 meet fallback; P10 Seek card; A3 mission link; A7 Echo field; Echo tutorial new message; "drag" not "finger"; Voices intro progress, repeats, option positions || done (bff71f5); option positions unbiased (χ² 0.09) |
| exA | tutorial items not reused (Crowd, Far); Repair step 5 wording, capitals; P11 "the voice you follow"; Crowd radar name on phones; ST-08 accent wording; landscape check || done (70d6830) |
| lab | Story copy (~40 s, restaurant); P10 Lab wording; test-aid captions in the Lab runner (test builds); ST-06 check || done (1017f58) |
| lead | test-aid caption cleared per trial and names the voice (0161f6b and next); guide claims (Story, accents, milestones, Path, headline) after the round; independent guide check || done (0161f6b, a751450); guide rounds 220923a, 4077279; PWA + in-app notice added (e501113…b5f8352) |

Decided not to change: voice ids keep dataset speaker numbers (ST-15); one talker per probe (ST-06); single file
13.24 MB for 1.0 (ST-09, lazy packs in PLAN-v1.1.md).
