# Earshot — build contracts (Phase 2). One owner per file; cross-owner needs go to docs/dev/requests.md (append-only).

## 0. Ground rules (all builders)
- Plain JavaScript, classic scripts, one global namespace `ES`. No ES modules, no `fetch`/XHR of local files, no
  required service worker, no build step to run. `index.html` lists every script in load order (§9).
- Must run from `file://`, GitHub Pages, a sandboxed `srcdoc` iframe (opaque origin) and phones (360 px up).
- Never use alert/confirm/prompt. Guard storage, clipboard, downloads, pop-ups, microphone (all may be blocked).
- Pure logic (no DOM) lives in functions that load in Node for unit tests: `tests/unit/*.test.mjs`, run by
  `node tests/unit/run.mjs` (loads the listed scripts into a `vm` context with a minimal `window`).
- Seeded randomness only (ES.core.rng). No Math.random in engine, generators or DSP.
- During a stimulus: no saves, no DOM re-renders, no observers, no decorative motion. Save between trials or sets.
- Files ≤ ~400 lines; split when larger. Write large files in chunks of ≤400 lines per tool call.
- Copy: confident, curious, accurate; numbers in texts match the code. No commercial trainer names in the app.
- Commit only your own paths with `TZ=UTC git commit -- <paths>` (the index is shared by all builders), author `Claude <noreply@anthropic.com>`, message ends with
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` (no session link). Only the lead pushes.
- Repository-relative paths and UTC times in every committed file. No personal data anywhere.

## 1. Owners (wave 1)
| Owner | Paths |
|---|---|
| shell | `index.html`, `css/**`, `fonts/**`, `js/core/**`, `js/ui/**`, `js/app.js`, `tools/build-*.mjs`, `tests/unit/core*`, `tests/e2e/**` (harness + shell tests) |
| audio | `js/audio/**`, `tests/unit/audio*`, `tests/e2e/audio_*.py` |
| stimuli | `tools/audio/**`, `data/**` (generated), `audio/**` (generated packs), `docs/dev/STIMULI.md`, `LICENSES-ASSETS.md` |
| engine | `js/engine/**`, `tests/unit/engine*`, `tests/sim/**` |
| lead | `docs/dev/*` (except STIMULI.md), `CLAUDE.md`, `README.md`, integration fixes, `js/ex/**` until wave 2 |
Wave 2 (later): exA `js/ex/{crowd,far,strange,repair}.js`; exB `js/ex/{echo,seek,voices,missions}.js`;
lab `js/lab/**`; game `js/game/**`. Each will get its own brief.

## 2. Namespace skeleton (`js/core/ns.js`, shell)
`window.ES = { VERSION:'0.1.0', core:{}, audio:{}, engine:{}, ex:{}, lab:{}, game:{}, ui:{}, data:{}, packs:{}, hooks:{} }`.
`ES.hooks.on(name, fn)` / `ES.hooks.emit(name, payload)`: events `trial:done`, `set:done`, `session:done`,
`pb`, `milestone`, `plateau`, `export`, `store:changed`, `route`.

## 3. Core API (shell)
- `ES.core.util`: `clamp, lerp, round(x,d), sum, mean, sd, el(tag,attrs,children), esc(s), fmtDb(x), fmtM(x),
  uid(prefix), debounce(fn,ms), copy(obj)`.
- `ES.core.rng(seed|string)` → `{ next(), int(a,b), float(a,b), pick(a), shuffle(a), weighted(items,weights), fork(label) }`;
  `ES.core.hash(string)` → uint32. Algorithm: sfc32 seeded by hash; fork derives a child seed from label.
- `ES.core.store`: `init()→Promise<{mode:'persistent'|'memory',reason}>`, `get(key)`, `set(key,obj)→bool`,
  `update(key,fn)`, `status()→{mode,saved,lastError,bytes,nearFull,newerVersion}`, `exportAll()`, `importAll(obj)`,
  `wipe()`, plus `peek(key)` (no copy), `hold()`/`release()` (writes wait during stimuli), `flush()`;
  hooks `store:status`, `app:ready`, `tutorial:done`, `results:interlude`. Keys and schemas in §7. Prefix `earshot.v1.`; revision counter; `storage` event merge by record id;
  every field has a merge rule; a record from a newer schema → read-only memory mode with a lasting banner.
- `ES.core.clock`: one active-time clock: `start()`, `pause(reason)`, `resume()`, `activeMs()`, `input()`;
  idle limit 60 s; hidden tab pauses; a second pause keeps the first start.
- `ES.core.router`: in-memory; mirrors `#name` in try/catch; `go(name, params)`, `back()`, `current()`, `on(name, fn)`.
- `ES.ui`: `sheet({title, body, actions})` (focus trap, Esc closes top only), `toast(text)`, `confirm(text)→Promise<bool>`,
  `button(label, opts)`, `field(svg, model)` (the earshot field picture, §8), `answerPanel(slots, onDone)` (§5).
- `ES.core.chimera`: `URL='https://discord.gg/chmr'`, `welcome(full)`, `linkEl(label)`, `invite(kind, ctx)`
  (kinds: pb, milestone, plateau, export) — never during a set.
- `ES.core.playtest`: `enabled()`, `rate(exId,{fun,clarity,difficulty})`, `note(screenId,text)`, `error(e)`,
  `frames(stats)`, `reportText()` (device, frame timing, errors, performance, time played, last screen).

## 4. Audio API (audio)
- `ES.audio.ctx`: `ensure()` (create/resume; call inside a user gesture), `unlock()→Promise`, `sampleRate()`,
  `master()` (gain → limiter → destination), `outDb` default −20 dBFS active level.
- `ES.audio.assets`: `has(id)`, `meta(id)` (manifest entry, §6), `buffer(id)→Promise<AudioBuffer>` (lazy base64 decode
  from `ES.packs`, LRU cache ≤ 60 s of audio), `preload(ids)`, `release(ids)`.
- `ES.audio.dsp` (pure; Float32Array in/out; `sr` argument; Node-testable):
  `activeDb(x,sr)`, `rmsDb(x)`, `peak(x)`, `biquad(type,f,q,sr,gainDb)`, `filter(x,coefs)`, `band(x,sr,lo,hi)`,
  `tilt(x,sr,dbPerOct)`, `wsola(x,sr,rate)`, `resample(x,ratio)`, `vocode(x,sr,{bands,lo,hi,carrier,envHz},rng)`,
  `whisper(x,sr,{order},rng)`, `ssn(n,sr,ltas,rng)`, `pink(n,rng)`, `gate(x,sr,{rateHz,duty,rampMs,fill},rng)`,
  `rir(sr,{rt60,size,seed})→[L,R]`, `hrtfLite(x,sr,azDeg)→[L,R]` (ITD+ILD fallback when no PannerNode HRTF).
- `ES.audio.render(spec, {seed})` → `Promise<{buffer, report}>`; `report = {snrDb, tmrDb, outDb, peakDb, ms}`.
  Renders offline (OfflineAudioContext) into one stereo buffer; output active level = `spec.out.db` (default −20),
  peak ≤ −1 dBFS; levels are exact to ±0.25 dB. `ES.audio.play(buffer)→{stop, ended:Promise}` plays it once.
- Spec additions implemented by audio (2026-11-26): `part.dist` (m, direct-path distance), `room.levels`
  ('ear' default: levels re the listener, DRR = 20·log10(dc/dist), air loss beyond 10 m; 'source' option), `room.ir`
  (supplied impulse response for held-out probe rooms), bed `ltas` / `from` / `fadeMs`, fx `{type:'highpass', f}` and
  `{type:'mask', t0, t1, fill, db}`; `report` adds per-stem measured levels. `ES.audio.warm()` prebuilds the HRIR and
  FFT tables (called once after the first unlock); `ES.audio.native.hrtfOk` records whether browser HRTF works (else
  the ITD/ILD head model is used).
- `ES.audio.live` (Seek only): `scene({bed, target, decoys})` → `{start(), stop(), listener(x,y,headingDeg)}`.

## 5. Engine API (engine)
- `ES.engine.dials[exId]` = array of `{ id, label, unit, kind:'cont'|'ord', min, max, step, dir:+1|−1 (+1 = higher
  is harder), start, slope, comfort, requires? ('headphones'), levels? (ordinal labels) }`.
- `ES.engine.learner`: per (exId, dialId) a Bayesian grid posterior over threshold (level where p = target with other
  dials at comfort); `est(ex,dial)→{m,s,n}`, `predict(ex,dials,offsetDb)→p`, `update(trial,result)`, `summary(ex)`
  (values in real units for the UI). Warm-up items (first 3–6 of a new condition) do not update thresholds.
- `ES.engine.controller.next(exId, ctx)` → `{ dials, focus, anchor, warmup }`; `ctx = {mode, rng, recent, breadth}`.
  Edge: one focus dial at the edge (target p ≈ 0.72), others at comfort; anchor every 4th–5th trial (p ≈ 0.9) and
  after two consecutive errors; focus chosen by recent learning progress. Path / Variety / Focus / Free per PLAN §7.
- `ES.engine.items[exId].make(rng, setting, ctx)` → TrialSpec (below). Generators never reuse probe-set content.
- `ES.engine.score(trial, response)` → `{ slots:[{picked, answer, correct, foil}], correct (all slots), prop, intrusions }`.
- `ES.engine.plateau.check(exId)` → `null | {reason, breaker:{kind, dial?, text}}`.
- `ES.engine.planner.session(opts)` → `{ sets:[{exId, trials, focus?, interlude}] }`; `overnight()`, `freshEars()`.

TrialSpec (the contract between generator, renderer and views):
```
{ id, ex, seed, setting:{dials, focus, anchor, warmup},
  audio: { out:{db:-20}, dur?, spatial:'hrtf'|'ild'|'mono',
           parts:[{clip, at, db, role:'target'|'masker'|'cue'|'decoy', az?, room?:true, fx?:[...]}],
           beds:[{kind:'ssn'|'babble'|'ambience'|'pink', db, clips?, bed?, room?:true}],
           room:{rt60, dist, size, seed} | null },
  // levels: part db = active speech level re the reference (target 0); bed db = RMS re the target's active level.
  // fx: {type:'wsola',rate} {type:'resample',ratio} {type:'vocode',bands,carrier} {type:'whisper'}
  //     {type:'band',lo,hi} {type:'tilt',db} {type:'gate',rateHz,duty,fill} {type:'lowpass',f}
  question: { prompt, slots:[{label, options:[...], answer, foils:{word:'masker'|'neighbour'|'context'|'random'}}] },
  feedback: { text, replays:[{label, audio}] },        // e.g. "Target alone", "Again with the words"
  picture: { voices:[{id, role, az, dist, label}], room? },  // what the field shows (static during playback)
  meta: { items:[...], voices:[...], family?, probe:false } }
```

## 6. Data (stimuli; generated files, never hand-edited)
- `data/voices.js` → `ES.data.voices[voiceId] = { src, sex, accent, ageBand?, set:'train'|'probe', cast?:{name,blurb},
  licence }` (src: kokoro, piper-libritts, librivox, audiomnist, cremad, speechocean).
- `data/manifest.js` → `ES.data.manifest = { version, clips:{ [clipId]: { pack, voice, kind:'word'|'name'|'number'|
  'phrase'|'sentence'|'digit'|'intro'|'story'|'bed'|'rir', text, words:[...], dur, adb, set, asr:{ok}, diff? } } }`
  (`adb` = active speech level dBFS; `diff` = difficulty offset dB from an objective model, optional).
- `data/vocab.js` → `ES.data.vocab = { names, numbers, nouns, rhymes:{family:[...]}, neighbours:{word:[...]},
  sus:[...], repair:[...], echo:[...], intros:[...], stories:[...], matrix:{...} }` with ids matching clip ids.
- `data/packs.js` → `ES.data.packs = { name:{bytes, exercises:[...]} }`; `audio/pack-<name>.js` →
  `ES.packs['<name>'] = { [clipId]: '<base64 mp3>' }`. MP3, 16 kHz mono, ~24 kbps. Total audio ≤ 8.5 MB raw.
- Clip ids: `<src>.<voice>.<kind>.<text-slug>[.<n>]`, ASCII, lowercase.

## 7. Store keys (v1; each record carries `v`)
- `profile`: `{v, createdAt, nickname, settings:{theme, mode:'edge', sessionMin:15, headphones:false, hpCheck,
  volumeSet, playtest, captions}, welcomeSeen, tutorials:{exId:true}, cards}` (cards: strategy cards already shown)
- `learner`: `{v, dials:{'ex.dial':{m,s,n,at}}, breadth:{ex:0..1}, recent:{ex:[0|1 × 30]}}`
- `log`: `{v, sessions:[{id, start, end, activeMs, mode, sets:[{ex, n, correct, focus, end:{dial:value}, pb}]}]}`
- `trials`: ring buffer of the last 3,000 trials, compact arrays `[t, ex, focus, level, correct, prop, intrusions]`
- `lab`: `{v, runs:[{id, probe, form, at, practice, est:{m,s}, n, trials:[compact]}]}`
- `game`: `{v, venues:{id:{at,best}}, cast:{voice:{met, seen, idOk}}, badges:{id:at}, pbs:{key:val}, weekly:{wk:{...}}}`
- `diary`: `{v, entries:[{week, at, items:[...]}], events:[...]}`; `missions`: `{v, weeks:{wk:{id, done, rating}}}`
- Own voices: IndexedDB `earshot-own` (blobs), never exported, deletable from Settings.
- `playtest` (shell): ratings, notes, errors, frame stats, sets, screens; never in backups; copied via the report.

## 8. Look (Audiogram) — shell implements tokens; everyone uses them
Light: bg #FAFAF7, surface #FFFFFF, surface-2 #F1F1EC, ink #15171B, ink-2 #474C54, ink-3 #686E77, rule #DCDDD7,
grid rgba(21,23,27,.055); target red #C8372B; others blue #2A56CF; correct #18744D. Dark: bg #111317, surface
#181B20, surface-2 #1F2329, ink #ECEDEE, ink-2 #B9BDC3, rule #2B3037, red #FF6B5D, blue #86A6FF, correct #53C98F.
Type: Archivo (text) + JetBrains Mono (numbers, dB, m), both OFL, embedded woff2. Sizes 13/15/17/24/36 px.
The field: range rings around "you", the target voice as a red dot, others blue, rooms as an outline; static
while sound plays. Never colour alone: ✓/✕ glyphs and text. Touch targets ≥44 px. A trial (field, prompt,
answer panel, replays) fits 360×640 without scrolling. Avoid: gradient heroes, emoji badges, mascots, confetti,
streak flames, glass cards, icon-card grids, purple gradients.

## 9. Script load order (index.html)
core (ns, util, rng, store, clock, router, ui, field, answer, chimera, playtest) → data (voices, vocab, manifest,
packs registry) → audio packs → audio (ctx, dsp/*, assets, render, live) → engine (dials, learner, items/*, score,
controller, plateau, planner) → lab/* → game/* → ex/* → ui/screens/* → app.js.

## 10. Commands
- Unit: `node tests/unit/run.mjs` · Sim: `node tests/sim/run.mjs` · E2E: `python3 tests/e2e/run_all.py`
  (Chromium; at most two browsers at once: wrap runs in `flock /tmp/earshot-browser.lock`).
- Single file: `node tools/build-single.mjs` → `dist/earshot.html` (everything inlined; ≤ 12 MB).
- Stimuli: `python3 tools/audio/build_all.py` (see docs/dev/STIMULI.md); raw corpora live outside the repo.
- Privacy before push (lead): `python3 tools/privacy_check.py`.

## 11. Screen registry and wave-2 modules (added 2026-11-26 17:05 UTC)
- Shell: `ES.ui.screens[name] = { mount(root, params), unmount() }`. The router mounts a registered screen if present,
  else the shell's placeholder. Wave-2 modules register their own screens (lab, probe, map, cast, weekly, progress,
  missions, diary) without editing js/ui/**.
- Exercise modules (`js/ex/<id>.js`): `ES.ex[id] = { id, name, short, bet, betNew, venues:[...], view:'keyword'|'custom',
  feedback:'standard'|'popout', tutorial:{ steps:[...] }, custom?(root, api) }`. The shell's Play screen runs every
  'keyword' exercise from TrialSpecs (crowd, far, strange, repair, echo, voices' who-is-talking); 'custom' views
  (seek, voices' meet/record, missions) receive `api = { engine, audio, ui, done(result), rate() }`.
- Tutorial steps (two-minute start): `{ kind:'caption'|'demo'|'practice', text, force?:{dials, items}, minMs:3000,
  then?:'tap'|'auto' }`; the shell's tutorial runner plays them (captions ≥ 3 s, the next action always stated,
  practice answers vary their slot, the demo shows every foil type the practice uses). The tutorial ends with the
  Chimera link.
- Lab (`js/lab/**`): `ES.lab = { probes:{id:{name, distance, minutes, make(form, rng)}}, schedule(state)→{due, baseline},
  stats:{runEstimate, trend}, exporter:{json, csv, pooled, importJson} }` + screens.
- Game (`js/game/**`): `ES.game = { venues, cast, weekly, share, milestones }` + screens; hooks into `ES.hooks`
  events (`set:done`, `session:done`, `pb`, `milestone`, `plateau`, `export`).

## 12. Lead rulings (binding; added 2026-11-26 17:31 UTC)
- R1 `room.size`: a word — 'small' | 'medium' | 'large' | 'hall'. The renderer maps words to shoebox dimensions
  (length × width × height, m): small 5 × 4 × 2.7, medium 10 × 7 × 3.2, large 22 × 15 × 6, hall 38 × 24 × 12, and
  derives the critical distance from these and rt60. A number is also accepted (length in m; width 0.7 × length;
  height 3 m below 12 m length, else 0.3 × length). The engine keeps distances inside the room (dist ≤ 0.8 × length).
- R2 `{type:'wsola', rate}`: rate is the SPEED factor — 2 means twice as fast, output duration = input / rate.
  Valid 0.67–3. (The DSP function may keep its own duration-ratio argument; render-prep converts.)
- R3 Times in every committed file come from `date -u`; the container clock is local.
