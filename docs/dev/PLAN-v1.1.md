# Earshot 1.1 backlog (one line per deferred item, added when it is decided; times UTC)

Each line: what, why it was deferred, where the detail is.

## Loading and size
- Load sound packs lazily on Pages: today all ten packs (~11.4 MB) load before the app starts on a first visit,
  behind "Earshot is loading…". Deferred 2026-11-26: the audio and engine layers assume every pack is present at
  start; changing that late was riskier than the one-time wait. (DECISIONS 2026-11-26 22:51 UTC)
- Single-file HTML back under 12 MB (now 13.24 MB): lazy packs above, or a lower bitrate for the probe pack.

## Stimuli (docs/dev/STIMULI.md)
- Training digits from real recorded talkers (AudioMNIST training talkers): no generator reads them yet; the 80
  held-out digits serve the Lab only.
- Accented read speech from a second open corpus (speechocean762, licence confidence medium-high): not built.
- Measured room responses next to the synthetic rooms: not built (rooms are synthetic only).
- Lab stories of 45–60 s (now 35–40 s): costs about 0.4 MB; the budget was full.
- Bulk renders (Repair, Echo, Far, non-accented SUS) on ~40 Piper voices instead of 20, for more talker variety.
- Item difficulty and accent tiers from human ratings or listening data; today they come from recogniser accuracy
  in noise, an objective stand-in.
- Fill the gaps: af_jessica lacks the matrix word "shirts", af_river "sticks"; ff_siwis (Anouk) has no intro.
