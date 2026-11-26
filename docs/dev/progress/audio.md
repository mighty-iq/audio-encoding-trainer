# Progress: audio (resumable notes; newest at the bottom; times UTC)

## 2026-11-26 — plan of the audio module (intent; written before the code)
Files (load order; the shell's index.html must list them in this order):
`js/audio/ctx.js`, `js/audio/dsp/core.js` (levels, rng fallback), `dsp/fft.js`, `dsp/filter.js`, `dsp/tsm.js`
(wsola, resample), `dsp/vocode.js`, `dsp/whisper.js`, `dsp/noise.js` (ssn, pink, ltasOf, gate), `dsp/room.js`
(rir, hrtfLite, room geometry, air absorption), `dsp/mix.js` (limiter, placement helpers), `js/audio/assets.js`,
`js/audio/render-prep.js` (sources, fx, beds), `js/audio/render.js` (native pass, calibration, mix, report, play),
`js/audio/live.js` (Seek scene).

Key choices (each is cheap to change; reasons in brackets):
- Everything renders at 16 kHz (`ES.audio.RENDER_SR`), the native rate of the packs. Clips are decoded in a 16 kHz
  OfflineAudioContext so no resampling happens before DSP [cost: JS DSP and convolution at a third of 48 kHz].
- Stems: every part's direct path, its reverberant path and every bed are rendered as separate stereo stems
  (one OfflineAudioContext with 2 channels per stem when HRTF or a room needs native nodes; plain JS otherwise),
  then each stem is calibrated by measurement. So TMR/SNR are exact by construction, whatever HRTF or room do.
- Level semantics: part `db` = active level of the part's direct sound at the ears (binaural mean power), re the
  reference where the target is 0. In a room the direct sound is `db + 20·log10(1 m / dist)`; the reverberant
  energy is constant (`db + 20·log10(1 m / dc)`), so DRR = 20·log10(dc/dist) falls 6 dB per doubling. Bed `db` =
  RMS at the ears over the target's span, re the target's reference level. Report values are measured at the ears.
- Active level: ITU-T P.56-style (two-stage 30 ms envelope, 200 ms hangover, 15.9 dB margin), measured by the
  renderer on the decoded, processed signal (cached per clip); the manifest `adb` is a fallback only.
- `wsola(x, sr, rate)`: `rate` = output duration / input duration (0.33 = three times as fast; 1.5 = slower).
  `resample(x, ratio)`: `ratio` = output length / input length (pitch moves by 1/ratio, like tape speed).
- Azimuth: degrees, 0 = ahead, +90 = right, −90 = left, ±180 = behind.
