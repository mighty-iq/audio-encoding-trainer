# Earshot — built by the Chimera community: https://discord.gg/chmr

**Earshot is a free listening trainer for the moments conversations break:** one voice buried under other voices,
a voice smeared by distance and echo, and a voice that sounds unfamiliar. It also trains holding on to what you heard.
It runs in the browser, on phones and desktops, offline, and keeps all your data on your device.

## Play
- Online: https://mighty-iq.github.io/audio-encoding-trainer/ (installs to your home screen and opens offline after the first visit).
- Offline file: `earshot.html` (one self-contained file; open it in any modern browser, phone or desktop).
- Headphones help but are not required; only the 3D-direction levels need them.

## What you train
Short, game-like trials adapt on several dials at once — how loud the crowd is, how alike the voices are, how many
talk at once, how far away and echoey the room is, how unusual the voice — and widen the variety of voices, rooms and
noises as you succeed. Each exercise names the carry-over bet it makes:

| Exercise | What you do | The bet |
|---|---|---|
| Crowd | Follow one voice while others talk over it | Attention control and voice cues against competing talkers |
| Far | Catch words across echoing rooms and halls | Adapting to rooms, trained across many rooms |
| Strange voices | Voices from other-language models reading English, fast, whispered, phone-quality and robot-like speech | Variety that trains adapting to new voices |
| Repair | Rebuild words lost under bursts of noise | A general strategy: hold the sentence, then repair it |
| Echo | Hear a message once in a busy place, answer after a pause | Listening under memory load, on real-life content |
| Seek | Move through a noisy room to find a faint voice | Sound-guided movement and head-turn practice (new bet) |
| Voices | Get to know voices, then pick your friend out of a crowd | Fast voice familiarity, with voices from your life (new bet) |
| Missions | One real-world listening task a week | Explicit bridging to real conversations |

Home → Exercises lists all eight: play a set of one (its tutorial first) or see how it works.

## See what carries over
The Lab runs short checks with voices, rooms and materials you never train on — real recorded voices included —
in a five-block baseline that starts after your first session, then weekly, and reports your own trend with its margin of error. These numbers are personal
progress measures, not clinical or normed scores. Earshot is not a hearing test; if you notice hearing changes, see
an audiologist.

## Progression modes and game
Edge (default), Path, Variety, Focus and Free modes share one learner record. A Night out map of venues, a cast of
voices, growth in real units (dB and metres) and a seeded weekly challenge everyone plays identically keep it fun —
with no streaks and nothing that punishes a missed day.

## Privacy
Everything stays in your browser. Backups and the optional community export carry no name (only a nickname if you
type one) and no device, language or time-zone details unless you switch them on.

## Research
Every design choice and the evidence behind it are explained in the player guide ([PDF](docs/Earshot-Guide.pdf)) and in `docs/research/`.

## Licences
Code: MIT (`LICENSE`). Texts and guide: CC BY-SA 4.0 (`LICENSE-TEXTS.md`). Voices, recordings, noises, word lists and
fonts keep their own licences: `LICENSES-ASSETS.md` and About → Credits in the app.

## Develop
Plain JavaScript classic scripts, no build step to run. Tests: `node tests/unit/run.mjs`; browser suites
`tools/with-browser.sh python3 tests/e2e/run_all.py`; single file: `node tools/build-single.mjs` → `dist/earshot.html`.
Developer notes: `CLAUDE.md` and `docs/dev/`.
