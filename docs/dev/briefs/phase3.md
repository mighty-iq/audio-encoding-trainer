# Phase 3 briefs — independent reviews, fresh-player tests, guide (lead launches; reviewers never built the thing)

Common rules for every reviewer: work on a frozen copy (`git worktree add /tmp/rv-<name> <commit>`), never edit the
live tree; browser runs through `tools/with-browser.sh`; findings to `docs/dev/reviews/RV-<name>.md` with severity
(high / medium / low), file:line, a failing case and a suggested fix; ≤ 40-line reply. Repository-relative paths,
`date -u` times, no personal data, no quotes from the owner's private brief.

## RV-code (logic and robustness)
Read js/** against CONTRACTS.md. Hunt: storage (blocked, full, newer version, two tabs, merge rules for every field,
import of damaged/old files), timing (stimulus onset, voided trials, pauses during countdowns and replays, hidden tab,
active-time clock), audio (decode failures, context suspended, memory growth over a 30-minute run, nothing rendered
during playback), engine/flow (paused or interrupted sets never count; resume from the stored plan; replacement caps),
routing in sandboxed previews, event listeners and DOM growth over long runs.

## RV-play (play-through over simulated days)
Fresh profile → tutorials → sessions in every mode over ≥ 14 simulated days (clock shifted): progression feels
right, plateau messages appear with reasons, venues open, weekly challenge identical twice, fresh-ears and overnight
check never punish absence, Chimera pop-up full then light, invitations only between sets, no dead ends ("moved on",
never "mastered" when a pool runs out). Screenshots at 360×640, 390×844, 1366×768, light and dark.

## RV-claims (claims against code and research)
Every text the player or guide sees (Help sheets, tutorials, strategy cards, bets, plateau messages, Lab verdicts,
About, README, guide drafts): each number matches the code; each research claim matches docs/research notes (and the
reading depth); no promises of outcomes; no clinical or IQ framing; no commercial trainer names; accurate licence and
credit lines; Chimera text exactly as allowed.

## RV-stimuli (items and audio validity)
data/** and audio/**: ASR verification logs and pass rates; train/probe disjointness (voices, talkers, items, probe
families); foils plausible and correctly typed (numbers vs phonetic neighbours); shortcut cues in option sets on the
REAL data per level (answer frequency, length, position, heard-word); level normalisation; licences ledger complete
(every source, attribution text, no Lessac-based voices, no AudioSet, no NC/ND/GPL assets); budget per pack.

## RV-a11y (texts, accessibility, phone feel)
Contrast in light/dark, focus order and visible focus, dialogs trap focus and Esc closes the top one, labels for
screen readers, never colour alone, touch targets ≥ 44 px, no scroll in trials at 360×640, reduced motion respected,
≤ 3 flashes per second, plain-language copy, two-minute start per exercise.

## Fresh-player tests (one agent per exercise group; phone and desktop)
The agent may open only the app (dist/earshot.html) and plays from screenshots; it cannot hear, so it switches on
Settings → captions (dev aid that shows what was said after each trial). Report: time to first correct trial, any
confusion, dead ends, unreadable captions, swallowed taps.

## Guide (PDF) and announcement
Guide from HTML with headless Chromium (two passes for the table of contents), CC BY-SA 4.0, metadata author "Chimera
community", UTC dates, clickable references and the Discord link; chapters: what Earshot trains and why, how to
train (modes, sessions, dose), each exercise and its bet with the research behind it, measurement (probes, verdicts,
what the numbers are and are not), the game layer and why there are no streaks, safety (volume, when to see an
audiologist), privacy (on-device data), credits and licences, references. Discord post < 2,000 characters with
placeholders for links.
