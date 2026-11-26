# Earshot (working name) — tool memory

Free listening trainer for the Chimera community (https://discord.gg/chmr): understanding speech in loud
multi-talker places, at a distance, and from unusual talkers, plus encoding what was heard.
Repository: github.com/mighty-iq/audio-encoding-trainer (the owner may rename it once the name is chosen).
Branches: work on `build`; `main` only by merge with the owner's yes. GitHub Pages serves `main` from the root.

## Fixed requirements (from the owner's standing rules; RULES.md has the full text, git-ignored)
- Chimera pop-up on open (full welcome first launch, light one-tap later), clickable https://discord.gg/chmr in a
  new tab; permanent link in the UI; link in README line 1, guide, tutorial end, every share text; invitations at
  personal bests, milestones, plateaus, exports; never during a training block.
- No Duolingo-style streaks; no punishment for missed days. Timed stimuli stay clean (nothing decorative runs).
- Default mode holds difficulty at the edge on every dimension that matters; several progression modes on one record.
- Plateau detection from the log, with a stated change. Transfer portfolio, each exercise tagged with its bet.
- Probes: near/mid/far, baselines, alternate forms, poolable export; individual gains visible within weeks.
- Two-minute start, tested on a fresh agent. Playtest mode in test builds (off by default at release).
- Deliverables: repo for Pages, one self-contained offline HTML, PDF guide, Discord post < 2,000 chars, build log.
- Licences: code MIT; texts and guide CC BY-SA 4.0; no GPL/AGPL/NC assets; no copied test items or clinical clones;
  no names of commercial trainers in the app.
- Data on the device only; versioned saves, export/import.
- Privacy: commits as `Claude <noreply@anthropic.com>` with `TZ=UTC`, no session links; pre-push hook
  `tools/githooks/pre-push` runs `tools/privacy_check.py` (enable: `git config core.hooksPath tools/githooks`;
  private values in the git-ignored `.privacy.local`). Repository-relative paths only in committed files.

## Map (planned; updated as code lands)
- `docs/research/` research notes R1–R6 + ACCESS.md (sources we could not open).
- `docs/dev/` PLAN.md (approved plan), STATE.md (live state), DECISIONS.md (append-only log).
- `tools/` build and check scripts; `tools/privacy_check.py` before every push.

## Commands
- Privacy check of what a push would publish: `python3 tools/privacy_check.py`
- (build, test and audio-pipeline commands are added here when they exist)
