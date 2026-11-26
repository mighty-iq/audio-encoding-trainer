# Brief: Lab — probes, statistics, exports (wave 2)

Owner paths: js/lab/**, tests/unit/lab*, tests/e2e/lab_*.py, docs/dev/progress/lab.md.
Read: PLAN §8, CONTRACTS §5–7 and §11, docs/research/R4 (procedures, slopes, SDs, practice effects, reliable change,
remote testing, headphone checks), R1 (measurement numbers), STIMULI.md (probe materials and held-out sets).
- Probes (alternate forms by seed; probe content only): Matrix (Bayesian adaptive, 20 sentences, word scoring,
  steady speech-shaped noise), Digits (triplets, 1-up/1-down 2 dB, 24 triplets, SRT = mean of trials 5–25), Two
  voices (natural sentences vs two talkers, adaptive TMR), Rooms (held-out rooms, distance ladder), New voice
  (held-out degradation family, accuracy and adaptation slope over 16 items), Story (passage in café noise at fixed
  SNR, 5 questions), Diary (5 original weekly items; event check-ins). First run of each = practice.
- Schedule: baseline (practice + 2 measured runs per core probe within the first 3–5 days, one block a day after
  training), then a weekly check-in (~8 min); never blocks training; reminders without penalties.
- Statistics: per-run estimate with SD; trend across runs (Bayesian linear with a practice term) → gain ± 90 %
  interval and a verdict ("clear gain", "likely", "not yet clear") against the smallest detectable change (2.77 × SD,
  ÷√k when averaging); simulated tests show a true 1.5 dB gain is flagged "clear" within 4 weekly check-ins in most
  simulated players and a zero gain rarely is.
- Headphone check (anti-phase method, generic) that unlocks spatial dials; manual override with a note.
- Exports: versioned JSON backup (all store keys except own voices), CSV of probe runs and sessions, a pooled
  community format (no name except an optional nickname; no user agent, locale or timezone unless switched on);
  import of every older version; copy-box fallback where downloads are blocked; Chimera invitation after an export.
- Screens via ES.ui.screens: lab (due probes, history, trend charts with intervals), probe (runner), report.
Commit own paths only; never push; progress in docs/dev/progress/lab.md.
