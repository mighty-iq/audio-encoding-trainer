# Progress: audio (resumable notes; newest at the bottom; times UTC)

## 2026-11-26 — plan of the audio module (intent; written before the code)
Files (load order; the shell's tools/build-index.mjs lists them, `dsp/reverb.js` comes in through its `dsp/*`):
`js/audio/ctx.js`, `dsp/core.js` (levels, rng fallback), `dsp/fft.js`, `dsp/filter.js`, `dsp/tsm.js` (wsola,
resample), `dsp/vocode.js`, `dsp/whisper.js`, `dsp/noise.js` (ssn, pink, ltasOf, gate), `dsp/room.js` (geometry,
critical distance, Schroeder, air absorption, hrtfLite), `dsp/mix.js` (limiter, placement), `dsp/reverb.js` (room
model, rir, reverb), `assets.js`, `render-prep.js` (fx, beds, room models), `render-native.js` (HRTF pass,
AudioBuffer helpers), `render.js` (pipeline, calibration, report, play), `live.js` (Seek scene).

## 2026-11-26 18:06 — state: everything in CONTRACTS §4 exists; Node tests pass; browser tests pass except timing
How it works (decisions, each cheap to change):
- Render rate 16 kHz (`ES.audio.RENDER_SR`, the packs' rate). Clips decode in a 16 kHz OfflineAudioContext (no
  gesture needed, no resampling). Playback: the browser resamples the 16 kHz buffer to the device rate.
- Stems: every part's direct sound, its room sound and every bed are separate stereo stems, each calibrated by
  measurement before mixing; the mix goes to `out.db` (active level, default −20 dBFS) and a look-ahead limiter
  holds peaks ≤ −1 dBFS. If the limiter cuts > 0.3 dB, stems are rebalanced by their measured level change and the
  mix is redone once, so SNR/TMR stay exact.
- Level definitions (report values are measured the same way): part `db` = active level (P.56-style) at the ears
  (mean of both ears' power) re the reference (target 0); bed `db` = RMS over the target's span re the target's
  reference. Every active level is measured as if followed by 0.5 s of silence (`D.SOURCE_TAIL`): without that, a
  clip measured alone and the same clip near the end of a trial differ by up to 0.25 dB (P.56 hangover).
- Rooms (CONTRACTS §12 R1 sizes): `room.levels` 'ear' (default; engine's request: each part's direct + room sound
  arrives at its db, distance only sets DRR = 20·log10(dc/dist) and air absorption beyond 10 m) or 'source' (db at
  1 m; the direct sound falls 6 dB per doubling, the room sound stays constant). dc = 0.057·√(2V/RT60).
  `part.dist` overrides `room.dist`. `room.ir` = measured clip id(s) (direct sound cut, rest used as room sound).
- Room model (`dsp/reverb.js`): first-order reflections as sparse taps at 16 kHz; higher orders + diffuse tail
  (independent noise per ear and band, own decay per band, faded in over √V ms) at 8 kHz, convolved by one packed
  complex FFT per source (both ears from one inverse FFT), interpolated back. `D.rir` composes the same model at
  16 kHz (unit energy per channel); `D.reverb` matches convolution with it to −49 dB on speech-band input. The late
  field has no energy above ~3.6 kHz (high frequencies decay fastest in real rooms). Chosen because Chrome's
  ConvolverNode cost ~40–70 ms for 4 stems of 3 s (and is CPU-throttled too).
- Beds: ssn (FFT-shaped, LTAS = bed.ltas | from 'target'/'parts' | ES.data.ltas | generic default; stereo =
  real/imag of one inverse FFT), pink, babble (N clips at equal active level, random offsets, looped with 20 ms
  crossfades; stereo: each talker at a seeded azimuth with integer ITD + broadband ILD), ambience (bed clip looped;
  right ear from an offset half a clip away). In a room: ssn/pink are coloured by the room spectrum; babble/ambience
  are reverberated. Beds' transients are held ≤ 15 dB above their RMS (iterated), so the output limiter rarely acts.
- Seeds: `D.rng` uses ES.core.rng when loaded (else a local sfc32); each part and bed gets a child stream labelled
  `role:clip#k` / `bed:kind#k`, so a "target alone" replay processes the target exactly as in the mix.
- fx: wsola `rate` = speed factor (CONTRACTS §12 R2; `speed` alias; valid 0.67–3, clamped with a warning),
  resample (ratio = output/input length), vocode, whisper, band, tilt (dB/oct above 500 Hz), gate, mask (engine's
  request: one stretch [t0,t1] filled with noise at db or silence, 10 ms ramps), lowpass, highpass.
- Spatial: 'hrtf' = PannerNode HRTF in an OfflineAudioContext (latency measured once and compensated; silence →
  falls back to hrtfLite with a warning); 'ild' = hrtfLite (Woodworth ITD + Brown–Duda head shadow + rear cut);
  'mono'. Azimuth: 0 ahead, +90 right.
- Report: {snrDb, tmrDb (vs loudest masker), tmrAllDb, outDb, peakDb, limitDb, bedCrestDb, targetDb, bedDb (dBFS),
  drrDb, dc, rt60, levels, dur, span, sr, spatial, seed, parts:[{role, clip, db, dist, drrDb, airDb}], warnings,
  tm (ms per stage), ms}. `opts.stems` true → role stems; 'all' → every stem (tests).
- Extras: `ES.audio.render.clips(spec)` (ids to preload), `ES.audio.stop()`, `assets.samples/level/pin/stats/
  setLimit/clear`, `ctx.volume(db)/onState/now/supported`, `live.scene(...).snrAt(x,y)/state()`.

Tests: `node tests/unit/run.mjs audio` (23 tests: levels, filters, wsola duration/landmark/F0, resample,
vocoder bands, whisper periodicity, ssn ±2 dB per third octave, pink slope, gate duty, room sizes, RT, reverb vs
convolution, hrtfLite, limiter, render pipeline with stubbed assets). Browser: `flock /tmp/earshot-browser.lock
python3 tests/e2e/audio_render.py [--quick]` (fixture `tests/fixtures/audio-fixture.js` from
`tests/e2e/audio_fixture_build.py`; page `tests/e2e/audio_page.html`; NumPy checker `tests/e2e/audio_p56.py`).

Dead end: native ConvolverNode per stem (too slow, see above). An FDN reverb was considered and not needed.

## 2026-11-26 18:50 — speed work and playback
- Room path: sources reverberate in pairs (two real signals share one forward FFT, separated by conjugate symmetry;
  one inverse FFT per source gives both ears), outputs stop at the trial end, interpolation has a bounds-free inner
  loop. Level meter: specialised mono/stereo loops, histogram bins from a fast log2 (quartic, error < 0.001 dB),
  bins reused while the held maximum does not change. hrtfLite: 8-tap fractional delay.
- HRTF: for a static source the browser's HRTF panner is a fixed filter, so `ES.audio.native.hrirTable(sr)`
  captures it once (72 azimuths, 5° apart, 128-sample kernels starting 16 samples before the latency-compensated
  arrival; at 16 kHz Chrome's HRIR energy lies within ~70 samples) and trials apply it in JS by block FFT
  convolution (`D.convStereo`, two blocks per forward FFT). No offline render per trial any more; the native pass
  (`N.run`) stays for 'conv' jobs. `ES.audio.warm()` prebuilds the table. If the table fails (no output, no
  OfflineAudioContext) renders use hrtfLite with a warning. Offline contexts in flight are held until they finish and
  time out (reject → fallback) instead of hanging: one full e2e run once stalled on an HRTF render in a long-lived
  page (not reproducible in 24 repeated renders on a fresh page); the guard makes such a stall impossible.
- CPU time per render in Node (3 s, room + 3 parts + babble bed in the room): ild ≈ 40 ms (same room), ≈ 60 ms (new
  room: model ≈ 4.5 ms medium, 16 ms hall, cached per room); mono ≈ 36 ms. Chromium, 4× CPU throttling, fastest
  of 10 (load average 3.1 on 2 CPUs): hrtf 205 ms, mono 175 ms (before the overlap change); medians are 250–400 ms
  because other builders' jobs share the 2 CPUs. The e2e check judges the fastest run and prints the load.
- Playback: `ES.audio.play` upsamples 16 kHz buffers ×k when the device rate is an integer multiple (48 kHz: ×3,
  Kaiser-windowed sinc, 12 zero crossings; images > 50 dB down at 13 kHz; ≈ 5 ms CPU per channel for 3 s; cached per
  buffer); other rates are left to the browser. `opts.hq === false` skips it.
- Requests posted: engine (done), lead (report and spec additions for CONTRACTS §4), shell/lab (ack), shell
  (replays should reuse the trial's seed, or replay the rendered buffer when the audio object is the trial's own).

Open (for the lead): Safari and Firefox are untested here (HRTF in a 16 kHz OfflineAudioContext, 16 kHz decoding);
both fall back safely (hrtfLite; a 48/44.1 kHz decode context makes everything render at that rate, slower).
