# STATE (rewritten at every milestone; under 100 lines; times UTC)

Updated: 2026-11-26 23:25 UTC

## Phase
3 — review, fix, release. Every builder finished fix round 1; the final stimulus set is in (eab5150: 1,306 clips,
87 voices, 8.48 MB MP3). Phase-3 reviews: RV-stimuli done (15 findings, 4 high); FRESH-A, FRESH-B and RV-play-a11y
running. Fix round 2 started for engine, stimuli and shell.

## Running subagents (IDs in the lead's container notes)
- FRESH-A, FRESH-B (fresh players; snap2 75c28ba, then snap4 09a8ff3 for the exercises that lacked packs),
  RV-play-a11y (snap4) → docs/dev/reviews/FRESH-A.md, FRESH-B.md, RV-play-a11y.md.
- Engine round 2: Echo answer balance, pool-matched foils (ST-03), Repair without a central answer (ST-02), Repair
  mask lead (ST-11), solver number words. Stimuli round 2: matrix re-cuts (ST-04), drop unused probe clips (ST-06),
  Story options (ST-07), accent labels (ST-08), F0 (ST-10), intros (ST-12), CREMA-D levels (ST-13), ledger (ST-14).
  Shell round 2: one download helper (artifact `downloads` capability + copy fallback) for backups, cards, exports.

## Done since the last milestone
- Snapshots for review: /tmp/rv-snap2 (75c28ba), /tmp/rv-snap3 (eab5150), /tmp/rv-snap4 (09a8ff3, all ten packs).
- ST-01 (four packs unlisted in index.html) fixed by the shell (8d79e75); the pre-push hook now runs
  build-index --check and build-licences --check.
- Echo never asks for or offers a Lab matrix word (a185d3b); unit 192/192.
- Browser suites on 09a8ff3: 528/529 shell checks (m11 reload hang under load, retried 3×) and 11/11 other owners'.
- Test build republished from 2bd6a8d (13.24 MB, all packs); artifact declares db + downloads.
- Release checklist page source ready (lead's container folder outside the repo; 12 pass/fail checks, db + copy fallback).
- Browser slots raised to three; backlog file docs/dev/PLAN-v1.1.md started.

## Next three steps
1. Read FRESH-A, FRESH-B, RV-play-a11y → fix round 2 for exA, exB, game, lab, shell, guide (claims: Story length
   ~40 s and restaurant scene, accent wording); rerun shell_round1 m11 on a quiet machine.
2. After round 2: full unit + browser suites, new test build, independent guide-vs-code check, guide rebuild.
3. Release: version 1.0.0, release build (playtest off), URLs in guide and announcement, VERIFY.md table, release
   checklist page, build log + playbook merge (draft in the lead's container notes); owner's yes → main.

## Open questions
- Owner to rename the repo to Earshot (taps sent); URLs use audio-encoding-trainer until then.
- Single file 13.24 MB vs the 12 MB target (hard limit 16 MiB met); lazy packs in the 1.1 backlog.

## Last verified
- 2bd6a8d test build: file:// at 390×844, no page errors, welcome sheet with discord.gg/chmr.
- privacy_check clean on every push (last push after 2bd6a8d).

## Dead ends
- gh CLI token invalid; api.github.com refused → no repo rename by API (owner renames in Settings).
- Hugging Face/OpenSLR/Zenodo blocked. Piper models fine-tuned from Lessac rejected (research-only data).
- sherpa-onnx 2.0.3 has no espeak front end for Piper models → run ONNX via onnxruntime + build-time phonemiser.
- Web-search budget is shared by all agents and ran out in research; WebFetch of URLs not from a search needs the
  owner's approval prompts → plan future research with few agents and known URLs.
- Single TTS words (50–85 % recognised) and word cutting from phrases → whole call-sign phrases with word times.
