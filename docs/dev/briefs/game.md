# Brief: Game layer — Night out map, cast, weekly challenge, share cards, milestones (wave 2)

Owner paths: js/game/**, tests/unit/game*, tests/e2e/game_*.py, docs/dev/progress/game.md.
Read: PLAN §9, CONTRACTS §7, §8, §11, docs/research/R5 §5–7 (what helps and hurts: no running score during trials,
informational feedback, return bonus, no streaks, seeded shared challenges).
- Night out map: ~12 venues (café, restaurant, bar, house party, club, concert, station, stadium, cathedral, park,
  phone line, lecture hall), each a family of dial settings; unlocked by thresholds; each shows your earshot there in
  real units; drawn as a precise lab-style map in the Audiogram look (no stock illustrations).
- Cast: ~40 named voices (from data/voices.js cast fields) with cards that fill in as you meet and identify them.
- Growth: personal bests per venue and dial; milestone badges for abilities (not time); level-up lines in real
  units ("followed a voice at −6 dB"); Chimera invitations at personal bests, milestones, plateaus (shell's
  ES.core.chimera.invite, between sets only).
- Weekly Night Out: a seeded set (week number → seed) everyone plays identically; a result card as text (with
  https://discord.gg/chmr) and as a PNG drawn on a canvas, copy and download with fallbacks; no leaderboards.
- Return without punishment: "fresh ears" after ≥ 2 days away and the overnight check (planner hooks) framed as
  chances to see retained skill; no streaks, no lives, no warnings about absence.
- Screens via ES.ui.screens: map, venue, cast, weekly, progress (per-dial thresholds over time).
Commit own paths only; never push; progress in docs/dev/progress/game.md.
