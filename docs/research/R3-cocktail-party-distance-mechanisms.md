# R3 — Cocktail-party and distance listening: mechanisms, trainability, transfer

Research notes for the Earshot listening trainer. Evidence only, not design.
Started 2026-11-26 (UTC). Notes are written in our own words; quotes are short and rare.

Reading-depth tags used for every source:
- [full text] = the full article was read (source noted).
- [abstract only] = only the abstract / summary page was read.
- [secondary report] = the finding is taken from another paper or review that reports it (named).

Terms: SNR = signal-to-noise ratio; TMR = target-to-masker ratio; SRT = speech reception
threshold (SNR/TMR for 50% correct unless stated); SRM = spatial release from masking;
F0 = fundamental frequency (voice pitch); VTL = vocal-tract length; st = semitones;
ITD/ILD = interaural time/level difference; HRTF = head-related transfer function;
BRIR = binaural room impulse response; DRR = direct-to-reverberant ratio; RT60 = reverberation
time; TFS = temporal fine structure; CRM = Coordinate Response Measure corpus; NH/HI =
normal-hearing/hearing-impaired.

## Summary

1. Speech-on-speech is limited mostly by informational masking: same-voice / same-sex maskers cost 20–40 points vs different-sex; 2-talker babble is the worst talker count; real party SNRs sit near 0 dB.
2. Voice cues: ΔF0 0→12 st and VTL ratio up to 1.34 (≈5 st) help, superadditively; harmonicity adds a modest (~20%) segregation benefit; better F0 *discrimination* does not predict better speech-on-speech.
3. Spatial: SRM is ~7–9 dB for two speech maskers at ±90° and is the same with generic HRTFs over headphones as with individual HRTFs; 10–15° separations already release much IM; ILD/better-ear cues dominate for symmetric maskers.
4. Spatial training: deficit-targeted LiSN & Learn (15 min/day × 12 weeks, adaptive target level, headphones) improves spatial LiSN-S measures ~3 dB in children; ILD-discrimination training raised ILD-based SRM in adults (one study).
5. Head orientation is a teachable strategy: instructed ~30° turns gave 1–3 dB (up to 8 dB in a quiet room), and most listeners do not do it spontaneously.
6. Dip listening improves 2–4 dB within 2–3 short lists of practice in fluctuating maskers (none in steady noise); interrupted-speech training (5 sessions) transferred across gap types and lasted ~3 months.
7. Attention: knowing where to listen is worth 10–40 points; switching location between turns costs ~10 points; selective attention explains as much NH variance as binaural TFS; attention-training evidence is weak.
8. Context helps most at low-but-not-extreme SNRs and can repair earlier words; predictability norms shift with age; no study trains context use per se; narrative-in-babble training gave ~2 dB (CI users, uncontrolled).
9. Familiarity: ~10 min (≈80 sentences) of talker-ID training buys a significant intelligibility benefit; long-known voices give ~10–22%; not via finer F0/VTL; familiar maskers are not reliably easier.
10. Music: cross-sectional g = 0.58 shrinks to ~0 after bias adjustment; large replications null; randomized gains ≤0.5 dB; the brainstem "musician advantage" failed a preregistered six-site test.
11. Audiomotor: one placebo-controlled study (~28 h) reported ~25% more words in noise in older aided adults, not independently replicated and fading without practice; a gamified multi-task study gave d ≈ 0.7, lost by 1 month.
12. Distance: −6 dB per doubling (free field) and a falling DRR; air HF loss matters only beyond ~15 m; reverberation shrinks spatial benefits; listeners calibrate to a room within ~0.5–3 s (5–18% gain); multi-room training generalizes to new rooms.
13. Cognition: attention matters more than working-memory span in young NH; working-memory training did not transfer; a 40-h auditory-cognitive program gave 1.2 dB only in a hearing-impaired subgroup.
14. Age with matched audiograms: TFS and cognition decline while dip listening and spatial release stay intact; binaural TFS showed no practice effect — train the intact routes.
15. Transfer pattern: specificity is the default (talker, masker language, cue, condition); variability widens transfer; procedural learning inflates early gains; retention is mixed (3 months to < 1 month).

## 1. Energetic vs informational masking

**Definitions.** Energetic masking (EM): target and masker energy overlap in the same
time-frequency regions, so parts of the target never reach the auditory nerve in usable form.
Informational masking (IM): the extra masking left over once EM is accounted for — confusing
masker words for target words, not knowing which stream to follow, attention captured by an
intelligible masker. IM is usually estimated as the difference between a speech masker and a
noise masker with matched spectrum/envelope (Rosen et al. 2013 [full text, UCL repository PDF];
Bronkhorst 2015 [full text, Springer OA]).

**What makes IM worse**
- *Target–masker similarity.* In the CRM task (call sign + colour + number), different-sex vs
  same-sex interferers differed by about 20 percentage points at negative TMRs, and a same-voice
  interferer by about 40 points; with a same-sex interferer at 0 dB TMR, scores were about 60%,
  and most errors were the masker's colour/number — i.e., confusions, not inaudibility
  (Brungart 2001, [secondary report] via Bronkhorst 2015). Different-sex vs same-talker
  interference shifts the SRT by 6–10 dB (Festen & Plomp 1990, [secondary] via Bronkhorst 2015).
- *Number of talkers is non-monotonic.* With IEEE sentences (male target) in 1–16-talker male
  babble, babble was the most effective masker at every talker count, performance at −6 dB SNR
  was worst at **2 talkers**, and changes above 4 talkers were small; one talker leaves large
  dips (glimpses) while two talkers fill the dips *and* stay intelligible (Rosen et al. 2013,
  [full text]; n = 16 and 20; adaptive SRT: start −20 dB, 4 dB then 2 dB steps, 20 sentences per
  condition). With 2–10 female talkers, Freyman et al. 2004 also found the worst score at 2
  talkers ([secondary] via Rosen et al. 2013). Noise-vocoded babble masked about 4 dB more than
  speech-envelope-modulated noise — Rosen's clearest IM estimate (full text).
- *A second interferer can cost a lot even when quiet.* Adding a contralateral second talker cut
  CRM scores by up to 40 points even when it was 15 dB down (Brungart & Simpson 2002,
  [secondary] via Bronkhorst 2015); this "multi-talker penalty" appeared only when the
  interferer resembled the target and SNR was below 0 dB (Iyer et al. 2010, [secondary]).
- *Intelligible, native-language maskers.* CRM-like interferers were worst, forward or reversed
  English intermediate, foreign-language speech relatively easy (Iyer et al. 2010, [secondary]
  via Bronkhorst 2015). English listeners do better with Dutch than English maskers
  ("linguistic release from masking"; JASA Express Letters 2022, [abstract only], NSF PAR record).
- *Uncertainty.* With three talkers on a 120° arc, knowing *where* the target would be gave
  near-maximal performance; knowing only *who* (call sign) while uncertain of location cost
  10–40 points (Kidd et al. 2005, [secondary] via Bronkhorst 2015).
- *Being a non-native listener.* Late bilinguals need 4–5 dB higher SRTs than natives (Mayo et
  al. 1997, [secondary] via Bronkhorst 2015).
- Typical real cocktail-party SNRs are estimated near 0 dB (Plomp 1977, [secondary]).

**What makes IM smaller**
- *Perceived spatial separation* (precedence effect; no real better-ear advantage) released about
  8 dB for a speech masker but only about 1 dB for noise (Freyman et al. 2001, [secondary] via
  Bronkhorst 2015). With sine-vocoded speech maskers, the >20 dB colocated speech-vs-noise gap
  shrank to about 7 dB at 90° separation (Arbogast et al. 2002, [secondary]).
- *Voice differences* (F0, VTL; see §2), *foreign/unintelligible maskers*, *a priori knowledge
  of target location/voice*, and *familiar voices* (§7).
- *Individual differences are large.* With a target ahead and two maskers at ±15° (forward
  speech), adaptive 50% TMRs spanned ~15 dB across non-musicians (~5 dB in musicians); musicians
  averaged −15.1 vs −8.5 dB; thresholds for forward and reversed separated maskers correlated
  r = 0.59, suggesting a person-level IM susceptibility (Swaminathan et al. 2015, [full text,
  ScienceOpen PMC copy]; n = 12 + 12; cross-sectional).

**Does training reduce IM?**
- *Van Engen 2012* (dissertation chapter 5, [full text], Northwestern repository PDF): n = 56 in
  four groups — training in English 2-talker babble, Mandarin 2-talker babble, speech-shaped
  noise (SSN), or no training. Two days × ~30 min, 64 BKB sentences/day, feedback by showing the
  sentence text after each response; each listener trained and tested at their own HINT
  threshold −3 dB (mean −5.9 dB); four female training talkers. Babble-trained listeners beat
  SSN-trained listeners on the speech-in-babble post-test (log-odds +0.63); any training beat
  none (+1.10). Gains were **specific to the trained babble language** (no transfer between
  English and Mandarin babble) and larger for the trained talker than a new talker ("tuning in"
  and "tuning out"). Practical reading: train in speech maskers, not only steady noise, and vary
  masker languages/voices if generality is wanted.
- *JASA Express Letters 2022* ([abstract only]): transcription training with feedback in Dutch,
  English or white-noise maskers removed the pre-test advantage for foreign (Dutch) maskers —
  interpreted as reduced IM after training. Sample, SNRs and sessions not seen (see "Could not
  open").
- Musicians show less IM (Swaminathan 2015; also Oxenham et al. 2003, not opened) but those are
  cross-sectional (§8).
- Gap: no study we found trains IM resistance and then tests *untrained* masker types, voices
  and spatial layouts together with a follow-up — the clearest test of transfer for this
  mechanism.

## 2. Voice cues for segregation: F0, VTL, harmonicity

**Size of the benefit**
- Darwin, Brungart & Simpson 2003 (CRM; [secondary] via Bronkhorst 2015): changing the
  interferer's F0 by up to 1 octave (12 st) and its VTL by a ratio up to 1.34 (≈5 st) spans
  natural male–female differences. Scores rose monotonically with both; the F0 effect was
  somewhat larger; the combination was **superadditive** (both cues together help more than the
  sum).
- With monotonized speech, the gain is steepest for small ΔF0 (first few semitones), with a dip
  at exactly one octave where harmonics coincide (Brokx & Nooteboom 1982; Bird & Darwin 1998,
  [secondary] via Bronkhorst 2015).
- Flattening/altering the *target's* F0 contour raised SRT by up to 4 dB; altering the masker's
  contour had no effect (Binns & Culling 2007, [secondary]) — the target's intonation helps
  listeners follow it.
- Madsen et al. 2017 ([full text], Sci Rep OA): 30 musicians + 30 non-musicians; masker mean F0
  shifted 0, 1, 2, 4 or 8 st below the target; natural or monotonized contours; SSN or 2-talker
  masker, each at 60 dB SPL, overall SNR −3 dB. ΔF0 had a large effect (ηG² = 0.39) and
  interacted with contour; no musician advantage (§8). F0 difference limens (110 Hz tone) were
  much better in musicians (d = 1.10) but did **not** predict speech scores (R² = 0.02 once one
  outlier was excluded).

**Harmonicity**
- Popham et al. 2018 ([full text], Nature Communications OA): speech resynthesized
  (TANDEM-STRAIGHT) with each harmonic jittered by a random fraction of F0 (main condition ±30%;
  adjacent harmonics kept ≥30 Hz apart; harmonics above the 30th dropped). Inharmonic speech
  was as intelligible as normal speech alone and in SSN at −4 dB, but about 20% less
  intelligible when two same-gender talkers overlapped, lost more in 20-talker babble at +4 dB,
  and produced more intrusions from the uncued talker. Whispered (noise-excited) speech was far
  worse than inharmonic speech. Authors: harmonicity helps grouping/tracking but the effect is
  modest; other properties of voicing (spectral sparsity, voicing alternation) matter more.

**Sensitivity to the cues**
- NH listeners discriminated median-F0 and formant-spacing (VTL) shifts in natural sentences at
  Weber fractions of about 0.05–0.065 (≈1 st) at 90%-correct thresholds; pitch thresholds were
  worse than VTL thresholds (0.065 vs 0.049) (Holmes & Johnsrude 2023, [full text], UCL
  repository).
- VTL JNDs in vocoded (CI-simulation) speech are much larger: ~4.7–5.2 st, rising to ~7–9 st
  with simulated frequency shift (El Boghdady, Başkent & Gaudrain 2018, [full text of thesis
  chapter], CORE). Their 2019 CI study asked whether better F0/VTL sensitivity goes with better
  speech-on-speech intelligibility (El Boghdady et al. 2019) — [title/metadata only]; see
  "Could not open".
- F0 discrimination is very trainable: non-musicians' F0 difference limens started >6× larger
  than classical musicians'; with 4–8 h of adaptive 2-interval training (14 h total) they reached
  musician levels (Micheyl et al. 2006, [abstract only], UMN repository).

**Does training voice cues help segregation?**
- No direct evidence found. Hearing-science data dissociate the two: musicians' far better F0,
  ITD and attentive-tracking thresholds (d = 1.55, 0.68, 0.96) came with no speech-in-noise or
  speech-in-speech advantage (Madsen et al. 2019, [full text], Sci Rep OA, n = 32 + 32);
  familiar-voice intelligibility benefits (~22%) are not explained by finer F0/VTL
  discrimination (Holmes & Johnsrude 2023, [full text]); 30 min of implicit voice exposure did not
  improve F0+VTL JNDs, though pupil-measured effort for vocoded familiar voices fell (Biçer et al.,
  ISH 2022 poster on Zenodo 2024, [abstract-level record]).
- Implication for builders (evidence only): ΔF0 and ΔVTL are strong, controllable difficulty
  dimensions for speech-on-speech practice (0 → 12 st F0; VTL ratio 1.0 → 1.34; superadditive
  together), but "train the discrimination threshold, expect better segregation" is untested.

## 3. Spatial release from masking and spatial-hearing training

**Mechanisms** (Bronkhorst 2015, [full text], and studies it reports as [secondary]):
- *Head shadow / better-ear effect*: interaural level differences (ILDs) reach ~20 dB at
  ≥4 kHz, so the ear away from a masker gets a better SNR.
- *Binaural unmasking* from interaural time differences (ITDs): up to ~4 dB effective SNR gain
  (Bronkhorst & Plomp 1988). ITD and ILD gains combine sub-additively (Culling et al. 2004);
  spatial location and F0 combine additively (Du et al. 2011).
- *Better-ear glimpsing*: with maskers on both sides, the better ear switches moment to moment;
  a single-channel signal assembled from the better-ear time-frequency glimpses was as
  intelligible as the binaural original (Brungart & Iyer 2012).
- *Spatial attention / perceived separation*, which mainly releases IM (see §1: ~8 dB for speech
  vs ~1 dB for noise with precedence-effect separation).
- Overall SRM can reach ~10 dB (Bronkhorst 2000). A 10° separation was enough to maximise CRM
  scores (Brungart & Simpson 2007) — small separations go a long way when masking is
  informational. With two speech maskers at ±15°, SRM was 12–18 dB (Swaminathan et al. 2015,
  [full text]).
- Glyde et al. 2013 ([full text], CORE; JASA-EL): LiSN-S materials over headphones with KEMAR
  (non-individual) HRTFs, female target at 0°, two looped story maskers at 0° or ±90°, n = 12.
  ILD-only stimuli gave as much SRM as full cues; ITD-only gave significantly less, especially
  with same-voice maskers ("ILD dominance" for symmetric maskers, consistent with better-ear
  glimpsing). SRT procedure: start +7 dB, 2 dB steps, ≥17 scored sentences or SE < 1 dB.

**What works over headphones with generic HRTFs**
- Zenke & Rosen 2022 ([full text], UCL repository; JASA): two speech maskers (children's stories,
  65 dB SPL combined) at 0° or ±90°, male target at 0°, adaptive 1-up/1-down to 50% keywords.
  Adults (n = 17): SRM 8.8 dB (SD 2.6); colocated SRT −7.6, separated −16.4 dB. Children 7–12
  (n = 23): SRM 7.3 dB (SD 2.1), rising only ~0.3–0.4 dB/year. **SRM did not differ between
  individual HRTFs, generic heads (ARI large/small; KEMAR) and real loudspeakers.** A spherical
  head model (no pinnae) made separated SRTs ~2.6 dB worse. Caveat: only ±90° tested; small
  separations and front–back cases may be more sensitive to HRTF mismatch.
- Pure lateralization works for ILD-based better-ear benefit: a masker lateralized by a 6-dB ILD
  (±3 dB per ear) against a diotic target gave ~2–4 dB SRM in Gao et al. 2020 (below).
- Practical constraint (our inference): binaural cues need two-channel playback; a single earbud
  or a phone speaker removes ITD/ILD entirely.

**Spatial-hearing training — deficit-targeted programs (children)**
- *LiSN & Learn* (Cameron & Dillon 2011, JAAA 22:678–696, [abstract only], Macquarie record):
  9 children (6;9–11;4) who failed the LiSN-S; 15 min/day for 12 weeks at home; 3-D virtual
  environment over headphones; child identifies a word from a target sentence in distractor
  speech; weighted up-down adaptive rule on **target level**. In-game SRT improved ~10 dB;
  LiSN-S *spatially separated* conditions improved (η² 0.69–0.87) while colocated control
  conditions did not; no loss at 3-month follow-up; parent/child reports improved.
- *Randomized blinded study* (Cameron, Glyde & Dillon 2012, Audiology Research 2:e15,
  [abstract only], MDPI): 10 children (6;0–9;9) with spatial processing disorder; LiSN & Learn
  (n = 5) vs Earobics (n = 5); ~15 min/day, 12 weeks. LiSN-S spatial conditions improved only
  with LiSN & Learn (η² 0.75–0.95 vs 0.04–0.1); questionnaire gains larger. Very small sample.
- *Int J Audiol 2018* ("Remediation of spatial processing disorder", PMID 29378452,
  doi:10.1080/14992027.2018.1431403, [abstract only]; authors not verified): 16 children
  (6;3–10;0), 20–146 training games each. LiSN-S gains: different-voice ±90° +3.6 dB (2.0 SD),
  same-voice ±90° +3.2 dB, spatial advantage +2.9 dB, total advantage +3.3 dB; different-voice 0°
  +1.4 dB; talker advantage and same-voice 0° not significant. Gains held at a late follow-up;
  parent questionnaires improved.
- *Sound Storm* (Cameron & Dillon 2017, iPad app, NAL; [record only]): successor of LiSN & Learn,
  headphone 3-D environment, 10 levels in a space narrative.
- Pattern: deficit-targeted spatial training changes the *spatial* measures specifically, with
  real-life questionnaire gains — but samples are small and the developers ran the trials.

**Spatial-hearing training — adults**
- Gao, Yan, Huang, Li & Zhang 2020 ([full text], Sci Rep 10:19320, PDF mirror of the PMC copy):
  n = 83 young NH adults; 6–7 daily sessions of ~30 min (12 blocks × 60-trial staircases).
  *ILD discrimination* training (1-kHz low-pass AM noise, 0-dB standard, 3-down-1-up) improved
  identification of Mandarin words in speech-spectrum noise **only when the noise was
  lateralized** (6-dB ILD; SNRs −12 to −3 dB); ILD-based SRM rose from ~2.4 to ~3.8 dB, mostly at
  −12 dB SNR, and the gain correlated with ILD learning (r = 0.52). *ITD* training (150-µs test
  ITD) did not improve ITD thresholds and did not transfer. *F0 discrimination* training (see
  §2/§14) transferred to vowels in 6-talker male babble only when the target F0 was ~10 st above
  the babble's F0 range. A working-memory active control did not transfer. Authors' reading:
  transfer happens when the trained cue is the one that separates target from masker.
- Nisha, Kumar & Kumar 2023 ([full text, first ~60%], Frontiers in Neuroscience): virtual
  auditory space localization training with a generic HRTF set (white-noise bursts, 8 virtual
  positions, durations 2000 → 300 ms, 4 → 8 positions, advance at 70%), 5–8 sessions × ~30 min,
  adults 35–55 with mild–moderate hearing loss (27 trained vs 25 untrained, non-randomized).
  Localization RMS error fell from ~36° to ~10°; ITD/ILD thresholds and the SSQ spatial subscale
  improved; speech in noise was not tested.
- Amiri, Jarollahi, Jalaie & Sameni 2022 (Aud Vestib Res 31(4), [abstract only]): 32 NH adults
  aged 60–75 with self-reported speech-in-noise difficulty; 15 sessions of auditory spatial
  training vs control; better scores on an informational-masking test at 0, −5 and −10 dB SNR,
  maintained at 1 month. Training content and session length not seen.

**Head orientation — a teachable spatial strategy**
- Grange & Culling 2016 ([full text], Cardiff ORCA; JASA 139:703): target ahead, speech-shaped
  noise behind or to the side, low-reverberation room. Turning the head away from the target
  gave up to **8 dB** head-orientation benefit (HOB); model (Jelfs et al. 2011) fit r = 0.96. Only
  about half of listeners turned >10° spontaneously, and several turned the wrong way. After
  instruction, all turned and subjective SRTs improved 3.3 dB (2.5 dB predicted). A ~30° turn
  gives most of the benefit when the noise is in the rear hemifield and may keep lips visible.
- Grange et al. 2018 ([full text], Swansea repository; Trends in Hearing 22): instruction raised
  head movements ~5×; subjective SRM improved 1.6 dB (young NH), 0.8 dB (older NH), 1.2 dB (CI
  users). In a virtual restaurant (real BRIRs, ~400 ms reverberation, 9 interferers), a 30° turn
  gave 1.2–3.2 dB. Most clinicians and websites advise facing the talker squarely.

## 4. Glimpsing, listening in the dips, temporal fine structure

**Mechanism.** In a fluctuating masker, the target is momentarily audible in time-frequency
regions where the local SNR is favourable ("glimpses"); intelligibility tracks how many usable
glimpses there are and whether the listener can piece them together. Fluctuations in an
interferer can lower SRTs by up to ~10 dB (Bronkhorst 2000, [secondary] via Bronkhorst 2015).
Short-time SII models need frames of ~9–35 ms (frequency dependent) or ~4 ms with forward
masking included (Rhebergen & Versfeld 2005; Rhebergen et al. 2006, [secondary] via Bronkhorst
2015). One competing talker leaves large dips; a second talker fills many of them, which is why
2-talker babble is so hard (Rosen et al. 2013, [full text]).

**Is dip listening trainable?**
- Lie, Zekveld, Smits, Kramer & Versfeld 2024 ([full text], Amsterdam UMC repository; JASA
  156:341): 18 NH adults, Dutch sentences (female talker), six consecutive 13-sentence lists per
  masker condition, adaptive SRTs. Practice effects fitted with an exponential:
  stationary noise 0.3 dB (n.s.); **temporally modulated (interrupted) noise 3.1–4.3 dB**
  (duty cycles 50–65%); spectrally modulated noise ~2.2 dB. About 1–3.6 lists gave half the total
  learning; curves flattened after the 2nd–3rd list. Listeners with more masking release also
  learned more, and more slowly. Reading: the ability to exploit dips improves quickly with
  practice; steady noise offers nothing to learn. (Also a warning for test design: first-run
  SRTs in fluctuating noise are inflated by several dB.)
- Benard & Başkent 2013 ([full text], author-site PDF; PLoS ONE): 30 NH adults (10 per group).
  Sentences periodically interrupted at 1.5 Hz, 50% duty cycle (333 ms on/off, 10-ms ramps),
  gaps silent or filled with speech-shaped noise (70 dB SPL vs speech 60 dB SPL). Five
  sessions × 26 sentences; feedback = clear sentence, then the interrupted one again, with the
  text on screen. Trained groups gained 7.2–12 points vs 2.4–4 for untested controls;
  **training with one gap type transferred to the other**; gains held 42–127 days later
  (mean 92); rated effort fell. The noise-filled-gap "restoration" benefit (~9 points) was not
  changed by training.
- No study found that trains glimpsing per se (e.g., with checkerboard or gated maskers) and then
  tests untrained real babble or room speech. Under-tested (see §14).

**Temporal fine structure (TFS) and age**
- Füllgrabe, Moore & Stone 2015 ([full text], Frontiers in Aging Neuroscience): 21 older
  (60–79) vs 9 young adults with **matched normal audiograms** (≤20 dB HL to 6 kHz), matched
  education and performance IQ. Older listeners were ~10–12 points worse on consonants in
  steady or modulated noise and up to 22 points worse on sentences in colocated 2-talker babble;
  TFS sensitivity (monaural TFS1 at 1–2 kHz; binaural TFS-LF at 0.5–0.75 kHz) was lower in all
  conditions; envelope (AM detection) differences were only borderline. TFS alone explained ~51%
  of consonant-in-noise variance; TFS plus cognition explained 68% of sentence variance.
  **Modulation masking release (5-Hz modulated noise) and spatial release were not reduced by
  age** when audiograms were matched.
- Training TFS directly: we found no completed study that trained TFS sensitivity and measured
  speech in noise (one registered trial has no posted results; §13). Closest evidence: F0 discrimination training with unresolved harmonics (10th–20th)
  transferred to vowel identification in babble when F0 separated target and maskers (Gao et
  al. 2020, [full text]; §3). A 40-h commercial auditory/cognitive program changed envelope but
  not TFS encoding in the frequency-following response of older adults (Anderson et al. 2013,
  [full text]; §12).

## 5. Selective, sustained and switching attention

**Knowing where and who** (all [secondary] via Bronkhorst 2015, [full text]):
- Kidd et al. 2005: three talkers on a 120° arc; knowing the target's location in advance gave
  near-maximal scores even if the call sign came later; knowing only the call sign under
  location uncertainty cost 10–40 points.
- Spatial attention focuses within about ±9° in front, roughly twice as broad at 90°
  (Teder-Sälejärvi & Hillyard 1998); covert shifts can happen within 100–200 ms (Spence &
  Driver 1997).

**Build-up and continuity (relevant to sustained attention)**
- When the target stays in one place, performance improves over successive items: ~10 points
  across a digit sequence even with 1000-ms gaps between digits (Best et al. 2008, 2010), and
  across trials up to about the 30th trial (~160 s) in a fixed-location CRM task (Brungart &
  Simpson 2007, partly confounded with strategy change) ([secondary] via Bronkhorst 2015).
  Attention to a stream strengthens with continuity of location/voice; discontinuity resets it.
- We found little direct evidence on *sustained* (vigilance-type) attention as a separate
  limiter of speech-in-noise; see "Could not open" for the individual-differences paper below.

**Switching between talkers**
- Lin & Carlile 2015 ([full text], Frontiers in Neuroscience): 16 young NH adults; three
  simultaneous matrix sentences (same male talker) from −30°, 0°, +30° at 65 dB SPL, onsets
  staggered by 50 ms; each trial had two target sentences separated by a 350-ms "turn-taking"
  gap; the target either stayed or moved. A location switch cut word recall by ~10.7 points
  (second sentence 51.9% vs 68.4%), doubled masker confusions (9.2% → 18.8%) and cost 7–9 points
  on comprehension questions. The cost was spread evenly across words (no quick recovery).
- Task-switching studies show ~100 ms reaction-time costs for switching the attended talker,
  independent of a 100- vs 1000-ms cue lead (Koch et al. 2011, [secondary] via Bronkhorst 2015).

**Individual differences**
- Oberfeld & Klöckner-Nowotny 2016 (eLife 5:e16747; [abstract only], via the Mainz university
  bibliography and the Dryad dataset record — eLife blocks automated access): 50 young NH
  listeners identified sentences among spatially separated competing talkers. Auditory and
  visual selective-attention task scores together explained about as much variance as binaural
  TFS sensitivity; working-memory span, age and audiometric thresholds were not associated.
  Exact R² values not seen (see "Could not open").
- Dissociation: musicians' better "attentive tracking" of a voice-like source (d = 0.96) came
  without better speech-in-noise (Madsen et al. 2019, [full text]).

**Does attention training transfer?**
- EEG neurofeedback of selective attention (Front Hum Neurosci 2021, 15:676992; bioRxiv
  2020.07.04.188045, [full text of preprint]): 20 young NH adults randomized (10 + 10). Training
  = four weekly 1-h sessions, 120 trials each: a male voice saying "down" ×4 from +30°, a female
  voice saying "up" ×5 from −30°, and a bubbling distractor ahead; a visual cue named the target
  stream and a marker showed the EEG-decoded focus. Placebo group did a pitch-oddball task in the
  same scene. Untrained outcome: CVC words in multi-talker babble at −3 dB SNR. The trained group
  improved within-group (p = 0.04) and differed from placebo at post-test (p = 0.045), but the
  group × time interaction was not significant (p = 0.55) — weak evidence.
- A 40-h commercial auditory-cognitive program improved an attention battery (IVA+) and QuickSIN
  (by 1.2 dB, only in the hearing-impaired subgroup) vs an educational-DVD control (Anderson et
  al. 2013, [full text]; §12).
- Dichotic "interaural intensity difference" training (stronger ear attenuated so the weaker ear
  must carry the task): case series only — 2 patients, 12 × 30 min, improved dichotic and
  SPIN-R scores (Cline et al. 2021, JAAA, [abstract only]); 4 older adults, 7 weeks home
  version, improved left-ear dichotic digits, no speech-in-noise outcome (Shahidipour et al.
  2021, Aud Vestib Res, [abstract only]).
- A working-memory active control did not transfer to speech in noise (Gao et al. 2020,
  [full text]).
- Net: attention is a real limiter (switch costs ~10 points; location knowledge worth 10–40
  points; continuity build-up ~10 points), but training studies are small or uncontrolled. Cueing
  and switch structure are easy to manipulate in an app; the transfer bet is under-tested.

## 6. Linguistic context, prediction, repair, phonemic restoration

**How much context buys**
- Missing-phoneme recovery: ~50% for meaningful words vs ~20% for nonsense words; 70–90% in
  short everyday sentences; ~50% in meaningless sentences with normal syntax (Bronkhorst et al.
  1993, 2002, [secondary] via Bronkhorst 2015). Single sentences from one standard set differ by
  up to 4 dB in SRT (van Rooij & Plomp 1991, [secondary]) — item predictability is a large,
  often uncontrolled difficulty factor.
- Sun et al. 2022 ([full text], Frontiers in Aging Neuroscience): Mandarin repeat-and-recall
  test, high- vs low-context sentences, 2-talker babble or SSN at −10 to +15 dB SNR; younger
  (18–25, n = 54) vs older (50–65, n = 52) NH adults. Older adults leaned on context more
  (higher context share of their high-context score) and gained more context benefit for
  *repetition* at favourable SNRs, but less at −10 dB, and kept less context for later *recall*.
  Context helped most at low-but-not-extreme SNRs.
- Tinnemore, Gordon-Salant & Goupell 2025 ([full text], UMD repository; JASA 158:447): 36 NH
  adults aged 20–76; a deer/tear voice-onset continuum, 8-channel sine-vocoded, in SSN at +10 to
  −10 dB, with congruent, incongruent or neutral sentence context placed before or after the
  target. Context effects were largest at the hardest SNRs and, unexpectedly, larger when the
  target came first and the context afterwards (retroactive repair). Age did not change the size
  of the context effect; older listeners were slower.

- Rysop, Schmitt, Obleser & Hartwigsen 2022 ([full text], CORE; Cortex 154:269): German
  high- vs low-predictability sentence endings at six levels set relative to each person's SRT
  (−9 to +9 dB re SRT); 26 older (50–77) vs 26 young adults. Predictability shifted thresholds
  and slopes strongly; older adults gained as much from predictable context as young adults.
- Predictability must be normed for the actual listeners: when 200 "high-context" R-SPiN frames
  were re-normed by cloze in UK/US younger and older adults, only 48 met a ≥67% cloze criterion in
  all four groups (44 with the original word); older adults gave more predictable, lower-entropy
  completions (Whitley, Naylor & Hadley, [full text], Nottingham repository; year/journal not
  shown). Age differences in "context benefit" may partly be stimulus artefacts.

**Phonemic restoration**
- Filling silent gaps in interrupted speech with noise raised intelligibility by ~9 points
  (1.5-Hz, 50%-duty interruption; noise 10 dB above speech) — the restoration benefit — both
  before and after five training sessions (Benard & Başkent 2013, [full text]; §4). Training on
  interrupted speech improved scores 7–12 points, generalized across gap types and lasted ~3
  months, but did not enlarge the restoration benefit itself.

**Prediction and learning**
- Sohoglu & Davis 2016 ([full text], MRC CBU author PDF; PNAS): 21 adults; a written word shown
  for 200 ms, then the noise-vocoded spoken word ~1050 ms later. Matching text made speech sound
  clearer. Across 468 training trials (3/6/12 channels; clarity rating only, no feedback),
  report of *new* 6-channel words improved ~10% (individual range −5% to +22%); 1- and 24-channel
  speech showed no learning (too hard / too easy). The authors model both the immediate clarity
  effect and the learning as reducing prediction error — prior knowledge presented *before* the
  degraded token drives learning.
- Feedback in the form "clear version, then degraded again with text" was also used by Benard &
  Başkent 2013 and is a standard ingredient of successful degraded-speech training.

**Is context use trainable?**
- Green, Faulkner & Rosen 2019 ([full text], UCL repository; Trends in Hearing 23): connected-
  narrative training — phrases (2–10 words) from graded-reader stories (one male, one female
  talker) in 20-talker babble; listener picks the key words among similar-sounding foils; a
  wrong pick replays the phrase; SNR adapts on the foil rate per 10 phrases. 30 min/day, 6
  days/week, 4 weeks (~12 h) at home on tablets; 9 adult CI users; repeated baseline testing to
  absorb procedural learning. Sentence SRT in babble improved from 6.1 to 4.5 dB, and 4.1 dB at
  4-week follow-up (individual 0.5–3.2 dB), with new test talkers; vowels, consonants and digit
  span in noise did not change. No control group; same babble in training and test.
- We found no study that trains "context use" as a skill and then shows a larger context
  benefit on untrained materials. Context is mostly studied as an individual difference (larger
  reliance in older adults) rather than as a training target — an under-tested bet.

## 7. Voice familiarity

**Size of the benefit**
- Johnsrude et al. 2013 (Psych Sci; CRM task with long-married spouses, >18 years): familiar
  *target* voice improved sentence report by ~10–15%; a familiar *masker* also helped, driven by
  listeners aged ≤59 ([secondary] via Domingo et al. 2020).
- Domingo, Holmes & Johnsrude 2020 ([full text], UCL author manuscript; JEP: Applied): 16
  spouse couples (28–82 y) and 18 friend pairs (18–25 y); BUG matrix sentences with one
  same-sex competing talker, TMRs −6, −3, 0, +3 dB, diotic headphones, 240 trials per condition.
  Familiar target 69.3% vs both-unfamiliar 59.8% (+9.5 points); **no** release from masking by a
  familiar masker; the benefit did not grow with relationship length (r = −0.24, n.s.) — it
  plateaus early; larger F0 differences between the familiar and unfamiliar voices went with a
  larger benefit (rs = 0.26).
- Holmes & Johnsrude 2023 ([full text]): ~22% benefit for friends'/partners' voices at TMRs −6 to
  +3 dB, not explained by finer F0 or VTL discrimination (§2) — consistent with a cognitive
  account (familiar voices reduce processing demands / resist interference).
- Van Engen 2012 ([full text], dissertation): after only two ~30-min babble-training days,
  trained listeners were more accurate with a training talker than a new talker (§1).

**How fast it builds**
- Holmes, To & Johnsrude 2021 ([full text], UCL repository; Psychological Science): 50 young NH
  adults; three voices trained in one session with 78, 156 or 468 sentences (~10, 20, 60 min) of
  talker identification with feedback (702 trials, in quiet or in babble at 0 dB SNR — no
  difference). Test: BUG sentences with one unfamiliar competing talker at −6 and +3 dB TMR.
  The 60-min voice gave a 10–15% intelligibility benefit; **even ~10 min (78 sentences) produced a
  significant benefit** at both TMRs; the 10- and 20-min voices did not differ. Explicit
  recognition was ~73% hits for all three voices regardless of exposure — intelligibility gains
  and recognition dissociate.
- Biçer et al. (ISH 2022 poster, Zenodo 2024, [abstract-level record]): ~30 min of implicit
  exposure (audiobook chapters with comprehension questions) lowered pupil-measured effort for
  vocoded speech by that voice without changing F0+VTL JNDs.

**Implication (evidence only):** a talker-familiarization phase of ~10 min (≈80 sentences,
talker-ID task with feedback) is enough to buy a measurable target-voice benefit in
speech-on-speech; a familiar *masker* is not reliably easier to ignore. Whether training with
many voices builds a general "fast familiarization" skill that transfers to new voices is
untested.

## 8. Music training and speech in noise

**Cross-sectional evidence and its meta-analysis**
- Hennessy, Mack & Habibi 2022 ([full text], USC lab PDF; Hearing Research 416:108442):
  three-level meta-analysis of 31 cross-sectional studies (~62 effect sizes), NH adults,
  musicians with >6 years' training. Pooled Hedges' g = 0.58 (95% CI 0.42–0.74) favouring
  musicians; no moderation by masker type (babble, single talker, SSN, fluctuating, white),
  target type, context cues or IQ matching (older-adult studies looked larger, g ≈ 1.0, but not
  significant after correction). Heterogeneity moderate (between-study 53%). Multilevel Egger
  test near significance (p = 0.063); a bias-adjusted estimate was g = −0.29 (CI −1.22 to 0.64),
  i.e., not distinguishable from zero. The authors put the pooled difference at about 0.4 dB —
  below a 1-dB smallest detectable difference — and note it may reflect predisposition.
  Longitudinal/RCT studies were excluded as too few.
- Large, well-powered null results: Madsen et al. 2017 (60 young adults; ΔF0 0–8 st; SSN or
  2-talker masker; no group effect, p = 0.08 for the 2-talker masker; ~148 participants would be
  needed to detect the observed effect) and Madsen et al. 2019 (64 adults, loudspeaker array,
  ±15° separation, anechoic and reverberant; no group effect; ~554–1298 participants would be
  needed) ([full text] both, Sci Rep). Musicians had much better F0, ITD and tracking thresholds
  in the same people. Loutrari et al. 2023 ([full text], Cognitive Processing; 50 + 50, babble at
  +5 dB): a small musician advantage vanished once 13 amusic participants were excluded.
- Positive cross-sectional cases: Swaminathan et al. 2015 ([full text]; 12 + 12): musicians
  ~6 dB better with two *spatially separated intelligible* speech maskers (±15°) and SRM of
  17.7 vs 12.2 dB, but not in colocated or low-IM conditions — the advantage, where present,
  sits in informational masking and spatial segregation.
- Neural markers: a preregistered six-site study (Whiteford … Oxenham 2025, [full text], Nature
  Communications 16:7152; strict groups 74 musicians vs 88 non-musicians) found no musician
  advantage in brainstem frequency-following responses to /da/ in babble (d ≈ −0.06 to 0.02;
  Bayes factors favour the null ~5–9×) and no relation with years of training, failing to
  replicate the classic musician FFR enhancement; melody discrimination was strongly better in
  musicians (d = 1.63) but unrelated to FFR.

**Randomized / longitudinal studies (older adults)**
- Worschech et al. 2021 ([full text], Frontiers in Neuroscience): 156 NH adults 62–78,
  randomized to 6 months of piano lessons (1 h/week + ~40 min/day practice) vs music-culture
  lessons (active listening, no playing). Matrix test in SSN: both groups improved binaural SRT
  by ~0.14 dB (no group difference); a left-ear-only advantage for piano of ~0.4 dB; effects
  "relatively small" per the authors.
- Zendel, West, Belleville & Peretz 2019 (Neurobiology of Aging; [full text of bioRxiv
  preprint]): 45 adults 55–75 randomized to self-directed piano (≥30 min, ≥5 days/week, 6
  months), a video game (Super Mario 64) or no contact; French words in 4-talker babble at 0 dB
  and 15 dB SNR. Only the piano group improved, and only at 0 dB SNR; the critical group ×
  session × noise interaction was p = 0.064; video-game attrition was high (8 completers).
- Lo, Dubinsky, Gilmore, Wright-Whyte, Singh & Russo 2025 (Seminars in Hearing 46:125;
  [abstract only], Macquarie record): 47 older hearing-aid users randomized to 14 weeks of choir,
  music appreciation, or nothing (39 analysed). Choir improved *unaided* speech in noise and FFR
  vs control, not aided; choir vs appreciation did not differ.
- Child longitudinal studies (Slater et al. 2015; Habibi et al. 2016) and Dubinsky et al. 2019
  are cited by Hennessy et al. 2022 but were not opened here.

**Reading.** Music training reliably sharpens pitch, timing and tracking skills, but the
speech-in-noise payoff is small (≤0.5 dB in the largest RCT), inconsistent across replications,
and possibly an artefact of predisposition and publication bias. Where an advantage appears, it
is in speech-on-speech with spatial or voice cues (informational masking).

## 9. Audiomotor training

**The original claims**
- Whitton, Hancock & Polley 2014 (PNAS; closed-loop audiomotor game in mice and young adults
  improving detection of weak tones in noise) — not opened in this pass.
- Whitton, Hancock, Shannon & Polley 2017 (Current Biology 27:3237; [secondary report] via a
  ScienceDaily release of 2017-10-19 — full text blocked, see "Could not open"): 24 older adults
  (mean age 70) with mild-to-severe loss who had worn hearing aids for ~7 years; 3.5 h/week for
  8 weeks (~28 h). The game asked players to move a fingertip through a virtual soundscape and
  detect mismatches between the sound they predicted from their movement and what they heard.
  The placebo group played an auditory working-memory game, with expectations of benefit
  matched. The audiomotor group identified ~25% more words in sentences or digit sequences in
  high background noise (described as ~3× the benefit of their hearing aids); the placebo group
  did not improve; gains tracked in-game accuracy; **benefits did not persist without continued
  practice**.

**Replications and relatives**
- No independent direct replication of Whitton et al. 2017 surfaced in our searches.
- Lelo de Larrea-Mancera, Philipp, Stavropoulos, … Gallun & Seitz 2022 (J Cogn Enhanc;
  "Training with an auditory perceptual learning game transfers to speech in competition";
  [full text of the dissertation chapter], eScholarship): conceptually related gamified training,
  not audiomotor in the Whitton sense. 30 young adults without hearing complaints (15 + 15
  completers of 54 recruited); 30 × 25-min sessions (~12.5 h), two per day, at home on own
  devices. Game ("Listen"): spectro-temporal modulation up/down discrimination, spatialized
  left/right tasks, and 1-/2-back tone and vowel memory, each adaptive on one parameter. Active
  control: adaptive frequency discrimination. Outcomes: target with two male maskers colocated
  or separated at ±45°, TMR stepped +10 → −8 dB over 20 trials; digit triplets in white noise.
  The speech-in-competition composite improved in the game group (within d = 1.19) more than in
  controls (between-group d = 0.68, one-tailed p = 0.033; the authors note it would fail
  two-tailed); mean group differences 1.4 dB colocated, 2.9 dB separated, 1.6 dB digits;
  half the dose already sufficed; **not retained at 1 month** (d = 0.34, n.s.); expectations
  did not predict gains.
- Reaching-to-sound training in VR (Valzolgher et al. 2023, [full text], Eur Arch
  Otorhinolaryngol; crossover RCT, 17 unilateral CI users; 156 reaching trials to 13 virtual
  speakers over ±72°, free head movement, feedback until the right speaker was touched):
  untrained head-pointing localization error fell ~13° (52.6° → 39.3°) vs no change after a
  non-spatial reaching control; listeners also learned to turn the head more. No speech-in-noise
  outcome.

**Reading.** Audiomotor/closed-loop and gamified multi-task training show some of the largest
reported transfers to speech in noise (25% words in older aided listeners; ~0.7 SD in young
adults), with placebo or active controls — but samples are small (≤ 30), one-tailed or
single-lab, and gains fade within a month without practice. The "maintenance dose" question
is open.

## 10. Distance: level, DRR, reverberation, high-frequency loss; room adaptation; reverberant-speech training

**What distance does to the signal** ([secondary report] via the introduction of arXiv
2408.14198, "Combined assessment of auditory distance perception and externalization", 2024,
which cites the primary sources named here; the Kolarik et al. 2016 review was [abstract only]):
- *Level:* about −6 dB per doubling of distance in a free field; less in rooms, where the
  reverberant field stays roughly constant while the direct sound falls.
- *Direct-to-reverberant ratio (DRR):* falls with distance; works with one ear and one
  presentation (Bronkhorst & Houtgast 1999; Kopčo & Shinn-Cunningham 2011; Mershon & King 1975).
  Hearing loss leaves the level cue robust but weakens use of the reverberation cue (Kolarik et
  al. 2016, [abstract only]).
- *High frequencies:* air absorbs ~4 dB per 100 m at 4 kHz, so air-absorption spectral cues
  only matter beyond ~15 m; between 1 and 15 m spectral change carries little distance
  information (Kolarik et al. 2015; Little et al. 1992). At party/bar distances (1–10 m) the
  loss of "clarity" therefore comes mostly from the falling DRR and the room, not from air.
- *Near field (< 1 m):* low-frequency ILD becomes a distance cue for lateral sources; ITD is
  nearly distance-independent; beyond ~1 m binaural cues carry no distance information
  (Brungart 1999; Duda & Martens 1998).
- *Perception is compressed:* near sources are overestimated and far ones underestimated
  (Zahorik 2002; Zahorik et al. 2005).
- *Reverberation erodes spatial benefits:* the predicted maximum head-orientation benefit
  dropped from ~14 dB with anechoic HRIRs to ~9 dB with the room's BRIRs (Grange & Culling 2016,
  [full text]).
- *Reverberation damages specific cues:* in two very reverberant halls (T60 ≈ 2.5 and 3 s),
  final-consonant identification fell from 88% (anechoic) to 62% and 56%; place of articulation
  was transmitted worst (Vlahou, Ueno, Shinn-Cunningham & Kopčo 2021, [full text], CMU lab PDF;
  JSLHR).
- Talker behaviour (raising vocal effort with distance, Lombard speech) — not covered in this
  pass (search budget exhausted); see "Could not open".

**Rapid adaptation to a room ("prior listening")**
- Brandewie & Zahorik 2013 ([abstract only], UMN record; JASA-EL 134:EL265): with a spatially
  separated noise masker, hearing a carrier phrase in the same (virtual) room first improved
  intelligibility by **5–18%**, after as little as **850 ms** of exposure; the time course
  depended on reverberation and SNR; the effect was larger in reverberant rooms than in anechoic
  space. As reported by Vlahou et al. 2021 ([secondary]): the benefit levelled off after ~850 ms
  at low SNRs and ~2.7 s at higher SNRs; Brandewie & Zahorik 2010 found no further long-term
  improvement over many trials; switching from a more reverberant carrier to a less reverberant
  target was more disruptive than the reverse (2018).
- Brandewie 2012 (dissertation, Univ. of Louisville, [abstract only]): the benefit survived
  changing source/listener position between carrier and target (it depends on the room's general
  decay pattern, not specific early reflections); single-reflection echo thresholds did not
  predict it; proposed two processes — exposure to the speech pattern and "de-reverberation".
- Watkins' "sir/stir" constancy (described in Beeston, Brown & Watkins 2014, [full text],
  Sheffield author PDF; JASA 136:3072): context phrase and test word reverberated at "near"
  (0.32 m) or "far" (10 m); a far-reverberated *context* restores correct hearing of a
  far-reverberated test word (with 4-kHz low-pass speech, "stir"→"sir" errors fell from 23/60 to
  2/60). The effect is monaural, appears in the 3–4 kHz bands, and **most confusions were
  resolved after ~0.5 s of reverberant context** (linear over 0–500 ms).
- Vlahou et al. 2021 ([full text]): in very reverberant halls, a same-room carrier (2 or 4 VC
  syllables, 0.8 s apart) beat a different-room or anechoic carrier by ~1–7 points (largest in the
  less extreme hall); gains were in manner (stops) and voicing, not place; carrier length did not
  matter; an inconsistent carrier hurt about as much as a consistent one helped.

**Training with reverberant speech**
- Vlahou, Seitz & Kopčo 2019 ([full text], eScholarship; APP 81:935): 42 adults learned a Hindi
  dental–retroflex contrast through an implicit video-game procedure (target sounds paired with
  rewards). Rooms from BRIRs: office (T60 348 ms), classroom (528 ms), cafeteria (605 ms),
  bathroom (658 ms), anechoic. ~5 days × 600 trials. Training across **three rooms** (200 trials
  per room per day in random 40-trial blocks) produced ~7 points of learning that transferred to
  **untrained rooms** and untrained tokens (not to an untrained talker); training in a single
  room — anechoic or reverberant — produced no learning. Room *variability*, not reverberation
  per se, drove learning (small subgroups).
- Two conference items from the same group ([full text] of poster and abstract, author/project
  sites): with *supervised* 2AFC training with trial-by-trial feedback, one anechoic room gave
  about the same learning and transfer to untrained rooms as three reverberant rooms, and
  supervised training gave larger gains than the implicit game; room variability mattered for
  *implicit* learning (four daily 45-min sessions; 3-room group n = 15). In every variant,
  learning did not transfer to an untrained voice.
- We found no study that trains listeners on distant/reverberant speech *in noise* and tests
  untrained rooms and distances. Under-tested (see §14).

## 11. Audiovisual cues and lipreading training (brief)

- Seeing the talker changes listening behaviour: audiovisual presentation cut spontaneous head
  turns about sixfold, and listeners kept facing the talker (Grange et al. 2018, [full text]). A
  ~30° head turn did not impair lipreading, and head orientation plus lipreading together were
  reported to improve SRTs by up to 9 dB for CI users (Grange & Culling 2016a, [secondary] via
  Grange et al. 2018).
- Classic audiovisual-benefit studies (Sumby & Pollack 1954; MacLeod & Summerfield 1987; Ross et
  al. 2007) and the lipreading-training literature (e.g., Bernstein and colleagues' review in
  2022) were **not opened in this pass** because the search budget ran out. The widely cited
  qualitative pattern — visual speech helps most at low SNRs and lipreading is trainable with
  modest transfer — is from memory and must be verified before any design claim (see "Could not
  open").

## 12. Cognitive factors and cognitive training

**Associations**
- Young NH listeners: selective attention (auditory and visual) explained about as much variance
  in multi-talker sentence identification as binaural TFS sensitivity; working-memory span did not
  (Oberfeld & Klöckner-Nowotny 2016, [abstract only]). Working memory was not associated with
  speech-in-noise in younger NH listeners ([secondary] via Füllgrabe, Hearing Review 2015, which
  cites its reference 7 for this — probably Füllgrabe & Rosen 2016, not verified).
- Older NH listeners: cognition (memory, attention, processing speed composite) predicted
  sentence-in-babble scores beyond age, envelope and TFS; TFS plus cognition explained 68% of
  variance (Füllgrabe, Moore & Stone 2015, [full text]). The age-related deficits were not
  visible in SSQ/APHAB self-ratings (Füllgrabe 2015, Hearing Review, [full text]).
- Working memory predicted keyword identification in a babble post-test (Van Engen 2010,
  [full text]); older adults with lower backward digit span kept less context for recall (Sun et
  al. 2022, [full text]).
- The meta-analyses (Akeroyd 2008; Füllgrabe & Rosen 2016; Dryden et al. 2017) were **not
  opened** (search budget); see "Could not open".

**Cognitive training that measured speech in noise**
- Working-memory training as an active control did not improve F0 discrimination or speech in
  babble (Gao et al. 2020, [full text]); an auditory working-memory game was the placebo that
  did not improve word identification in Whitton et al. 2017 ([secondary]).
- Brain Fitness (Anderson et al. 2013, [full text], Northwestern lab PDF; Front Syst Neurosci
  7:97): 58 adults 55–79 (no hearing aids), 1 h/day × 5 days × 8 weeks (~40 h) of adaptive
  speeded auditory tasks (FM-sweep order with shrinking inter-stimulus interval, confusable
  syllables/words with adaptively stretched transitions, memory and story modules) vs an
  educational-DVD control. QuickSIN improved 1.22 dB in the hearing-impaired trained subgroup
  (below the test's 1.9-dB critical difference; NH subgroup n.s.); auditory memory and attention
  (IVA+) improved; envelope (not TFS) encoding in the FFR changed; no follow-up.
- In the gamified Listen study, the cognitive composite was unreliable (α = 0.41); only 2-back
  improved within the game group, not vs control (Lelo de Larrea-Mancera 2021, [full text]).
- Cogmed-type working-memory training studies with speech-in-noise outcomes (e.g., "Working
  memory training and speech in noise comprehension in older adults", Frontiers in Aging
  Neuroscience 2016) were seen only as titles — not opened.

**Reading.** Attention and general cognition correlate with multi-talker performance (more
clearly in older listeners); working-memory span is a weak predictor in young NH adults; pure
working-memory training has not transferred to speech in noise in the studies we could open.

## 13. Hidden hearing loss / cochlear synaptopathy and ageing

**Ageing with a normal audiogram**
- Older adults with audiograms matched to young adults (≤20 dB HL to 6 kHz) identify speech in
  noise 10–22 points worse, have poorer TFS sensitivity and somewhat lower cognition — but their
  **modulation masking release and spatial release are intact** (Füllgrabe, Moore & Stone 2015,
  [full text]).
- Binaural TFS (TFS-AF test: highest frequency at which a 180° interaural phase difference is
  still detected): older NH geometric mean ~892 Hz, about 490 Hz below the young NH mean;
  individual range 238–2698 Hz; **no practice effects over 15 runs in three sessions**; age mattered more than
  hearing loss (Füllgrabe & Moore 2017, [full text], CORE; Trends in Hearing 21). Preliminary
  lifespan data put the earliest binaural-TFS decline in people aged 30–39 (Füllgrabe 2015,
  Hearing Review, [full text]).
- A 40-h auditory-cognitive program changed envelope but not TFS encoding (Anderson et al. 2013,
  [full text]). A randomized trial of TFS-based training for speech in noise in adults 60–75 with
  mild–moderate loss (5 weeks × 3/week; outcome: speech-in-noise and TFS-LF) was registered in
  2019 (IRCT20190625044006N1, [registry record]); no results posted.

**Cochlear synaptopathy ("hidden hearing loss")**
- Not opened in this pass (search budget exhausted): the animal work (noise-induced loss of
  inner-hair-cell synapses without threshold shift), human temporal-bone evidence of age-related
  synapse loss, and the mixed human behavioural evidence (reviews 2019–2022). Listed in "Could
  not open"; no claims here.

**What training can and cannot address (our inference from the sources above, not a tested
claim):** training is unlikely to restore audibility, lost synapses or binaural TFS sensitivity
(no practice effect in TFS-AF; no TFS change after 40 h of training). The cues that stay intact
with age when audibility is matched — dip listening, spatial release — and the cognitive routes
(attention, context, voice familiarity) are the plausible training targets.

## 14. Under-tested ideas with a plausible mechanism (2018–2026 focus)

Each item: mechanism → best evidence (reading depth in the sections above) → what is untested.

1. **Train the cue that is doing the separating.** ILD-discrimination training raised ILD-based
   SRM (~2.4 → 3.8 dB) and F0-discrimination training (unresolved harmonics 10–20, roving
   120–240 Hz) improved vowels in babble only when the target's F0 sat ~10 st above the
   maskers' (Gao et al. 2020, §3). One lab, young adults, words/vowels. Untested: sentences among
   competing talkers, older listeners, retention, combining cues.
2. **Dip-listening practice.** Fluctuating-masker SRTs improve 2–4 dB within ~2–3 short lists,
   steady-noise SRTs do not (Lie et al. 2024, §4). Untested: does practice with gated or
   modulated maskers carry over to natural single-talker and babble dips?
3. **Room variability plus room calibration for distance listening.** Multi-room training
   generalizes to new rooms (Vlahou et al. 2019, §10); calibration to a room's reverberation
   takes ~0.5–3 s of prior speech (Beeston et al. 2014; Brandewie & Zahorik 2013). Untested:
   training on distant (low-DRR) speech *in babble* across many rooms and distances, with
   transfer to an untrained room.
4. **Learning to familiarize fast.** ~10 min of talker identification buys a target-voice
   benefit (Holmes et al. 2021, §7). Untested: whether practising with many new voices speeds up
   familiarization with the next new voice ("learning to learn" voices), and whether that helps
   with unusual talkers.
5. **Head-orientation strategy.** Instruction alone yields 1–3 dB (up to 8 dB in a quiet room
   with noise to the side/rear) (Grange & Culling 2016; Grange et al. 2018, §3). Untested:
   whether practising the strategy with simulated scenes over headphones transfers to real use.
6. **Prediction-first priming as a learning accelerator.** Text shown before degraded speech
   raises clarity and drives learning (Sohoglu & Davis 2016, §6). Tested with vocoded words, not
   with multi-talker babble or distant speech.
7. **Connected-narrative listening in babble.** ~2 dB SRT gain retained at 4 weeks in CI users
   (Green et al. 2019, §6); uncontrolled; untested in NH adults or with competing talkers.
8. **Masker variability against informational masking.** Babble-training effects are specific
   to the trained masker language and talker (Van Engen 2012, §1); training can erase the
   foreign-masker advantage (JASA-EL 2022, §1). Untested: whether a varied diet of masker
   languages, voices and talker counts builds general IM resistance.
9. **Closed-loop audiomotor play.** One study with a placebo game reported ~25% more words in
   noise in older aided adults (Whitton et al. 2017, §9) but no independent replication, and
   gains faded without practice. Untested: maintenance dosing.
10. **Cued attention-switch practice.** Location switches between turns cost ~10 points and
    double masker confusions (Lin & Carlile 2015, §5). Untested: whether switch practice lowers
    the cost and transfers to conversation-like listening (EEG neurofeedback evidence is weak).
11. **"Hold and repair" context training.** Later context resolves earlier degraded words,
    especially at the worst SNRs (Tinnemore et al. 2025, §6); predictability norms shift with age
    (Whitley et al., §6). Untested as a training target.
12. **TFS-based training.** A registered RCT (IRCT20190625044006N1, §13) has no posted
    results; binaural TFS showed no practice effect over 15 runs (Füllgrabe & Moore 2017).
    Low prior.
13. Two further candidates came up from memory but were **not verified in this pass**:
    figure-ground tasks with coherent tone "figures" in random tone clouds that predict
    speech-in-babble (Holmes & Griffiths 2019), and faster adaptation to a repeated ("frozen")
    babble than to varying babble (Felty, Buchwald & Pisoni 2009). See "Could not open".

## Cross-cutting: what the auditory-training literature says about transfer

(Built only from the studies opened above; the systematic reviews of computer-based auditory
training were not opened in this pass — see "Could not open".)

- **Specificity is the default.** Gains stick to the trained masker language and talker (Van
  Engen 2012), the trained voice (Vlahou et al. 2019 and poster), the trained cue (Gao et al.
  2020) and the trained spatial conditions (LiSN & Learn: separated conditions improved,
  colocated did not).
- **Variability widens transfer.** Multi-room training transferred to new rooms (Vlahou et al.
  2019); interrupted-speech training transferred across gap types (Benard & Başkent 2013); a
  narrative-in-babble program improved SRTs with new test talkers (Green et al. 2019).
- **Procedural learning is large and fast.** First runs in fluctuating maskers are 2–4 dB
  pessimistic (Lie et al. 2024); repeated baselines are needed before calling a change
  "learning" (Green et al. 2019).
- **Typical effect sizes.** 1–3 dB in SRT; 7–12 percentage points in fixed-SNR scores; d ≈ 0.7
  between groups for gamified training; LiSN-S spatial measures +3 dB (≈1.5–2 SD) in children
  with a spatial deficit.
- **Who gains most.** Listeners with a deficit or larger spread: children with spatial
  processing disorder (LiSN & Learn), the hearing-impaired subgroup in Anderson et al. 2013,
  larger asymmetry in Valzolgher et al. 2023; IM susceptibility varies ~15 dB among NH adults
  (Swaminathan et al. 2015).
- **Retention.** Held at ~3 months (Benard & Başkent 2013; Cameron & Dillon 2011) and 4 weeks
  (Green et al. 2019); lost by 1 month (Lelo de Larrea-Mancera 2021) or faded without practice
  (Whitton et al. 2017).
- **Dose used.** 2 × 30 min (Van Engen 2012); 5 × 26 sentences (Benard & Başkent 2013);
  6–7 × 30 min (Gao et al. 2020); 5–8 × 30 min (Nisha et al. 2023); 15 min/day × 12 weeks
  (LiSN & Learn); ~12 h (Green et al. 2019; Lelo de Larrea-Mancera 2021, half of which
  sufficed); ~28 h (Whitton et al. 2017); ~40 h (Anderson et al. 2013).
- **Feedback formats that worked.** Show the sentence text after the response (Van Engen 2012);
  play the clear version, then the degraded version with text (Benard & Başkent 2013); show text
  before the degraded audio (Sohoglu & Davis 2016); replay the item after a wrong pick (Green et
  al. 2019); talker-ID feedback for familiarization (Holmes et al. 2021).
- **Controls matter.** Active controls that did not transfer: working-memory training (Gao et
  al. 2020; Whitton et al. 2017), frequency discrimination (Lelo de Larrea-Mancera 2021),
  educational DVDs (Anderson et al. 2013), Earobics (Cameron et al. 2012), non-spatial reaching
  (Valzolgher et al. 2023).

## Could not open in full

Ranked roughly by how much a design would lean on them. "Need" = what to extract.

1. Whitton, Hancock, Shannon & Polley 2017, *Curr Biol* 27:3237 —
   doi:10.1016/j.cub.2017.09.014. Read: press release only. Need: game mechanics (target sound
   type, how movement maps to sound, adaptive rule), SNRs and test materials, dose details, effect
   sizes, decay data.
2. Oberfeld & Klöckner-Nowotny 2016, *eLife* 5:e16747 — doi:10.7554/eLife.16747 (eLife blocks
   automated access). Read: abstract. Need: attention tasks used, target/masker layout and
   levels, variance explained (R²) per predictor.
3. Brungart 2001, *JASA* 109:1101 — doi:10.1121/1.1345696. Read: secondary. Need: CRM
   performance vs TMR for same-talker / same-sex / different-sex and noise maskers; the plateau
   at negative TMRs.
4. Darwin, Brungart & Simpson 2003, *JASA* 114:2913 — doi:10.1121/1.1616924. Read: secondary.
   Need: performance per F0 step (st) and VTL ratio, and the superadditive combination data.
5. Cameron & Dillon 2011, *JAAA* 22:678 — doi:10.3766/jaaa.22.10.6 (publisher bot check). Read:
   abstract. Need: target/distractor azimuths, HRTF source, adaptive step sizes, game structure,
   LiSN-S changes in dB.
6. "Remediation of spatial processing disorder", *Int J Audiol* 2018 —
   doi:10.1080/14992027.2018.1431403, PMID 29378452. Read: abstract. Need: authors, protocol.
7. Brandewie & Zahorik 2010, *JASA* 128:291 — doi:10.1121/1.3436565; and Brandewie & Zahorik
   2013 full text (doi:10.1121/1.4816263). Read: abstracts/secondary. Need: rooms (T60s),
   carrier durations, SNRs, binaural vs monaural conditions, benefit size per room.
8. El Boghdady, Gaudrain & Başkent 2019, *JASA* 145:417 — doi:10.1121/1.5087693. Read: title
   only. Need: F0/VTL differences tested, correlations of JNDs with speech-on-speech.
9. Kolarik, Moore, Zahorik, Cirstea & Pardhan 2016, *APP* 78:373 —
   doi:10.3758/s13414-015-1015-1 (Springer page needed a permission that was not granted).
   Read: abstract. Need: distance-cue numbers (DRR vs distance, critical distance, vocal-effort
   cues).
10. "Perceptual learning alters effects of foreign language backgrounds in speech-in-speech
    recognition", *JASA Express Letters* 2(8), 2022 — doi:10.1121/10.0013422. Read: abstract.
    Need: authors, n, SNRs, sessions, effect sizes.
11. Lo, Dubinsky, Gilmore, Wright-Whyte, Singh & Russo 2025, *Semin Hear* 46:125 —
    doi:10.1055/s-0045-1811541. Read: abstract. Need: speech-in-noise test, dB changes.
12. Amiri, Jarollahi, Jalaie & Sameni 2022, *Aud Vestib Res* 31(4). Read: abstract. Need:
    training content, session length, test materials.
13. Lelo de Larrea-Mancera et al. 2022, *J Cogn Enhanc* (journal version). Read: dissertation
    chapter in full. Need: confirm the separated-masker azimuth and final statistics.
14. Neurofeedback attention training, *Front Hum Neurosci* 15:676992 (2021), PMID 34239430.
    Read: preprint in full. Need: author list (not verified here).
15. Not opened because the search budget ran out (no claims made from them):
    - Audiovisual and lipreading: Sumby & Pollack 1954 (*JASA* 26:212); MacLeod & Summerfield
      1987 (*Br J Audiol* 21:131); Ross et al. 2007 (*Cereb Cortex* 17:1147); Bernstein and
      colleagues' 2022 review of lipreading training (*Am J Audiol*).
    - Cognition: Akeroyd 2008 (*Int J Audiol* 47:S53); Füllgrabe & Rosen 2016 (*Front Psychol*
      7:1268); Dryden et al. 2017 (*Trends Hear* 21); working-memory training studies with
      speech-in-noise outcomes (Wayne et al. 2016, *Front Aging Neurosci*; Henshaw et al. 2021,
      *Ear Hear*).
    - Synaptopathy: Kujawa & Liberman 2009 (*J Neurosci* 29:14077); Liberman et al. 2016 (*PLoS
      ONE*); Bramhall et al. 2019 (*Hear Res*); Guest et al. 2018 (*Hear Res*); DiNino, Holt &
      Shinn-Cunningham 2022 (*Ear Hear*); Wu et al. 2019 (*Neuroscience*).
    - Auditory-training reviews/RCTs: Henshaw & Ferguson 2013 (*PLoS ONE*); Stropahl, Besser &
      Launer 2020 (*Ear Hear*); Saunders et al. 2016 LACE RCT (*Ear Hear*).
    - Others: Whitton, Hancock & Polley 2014 (*PNAS*); Kidd et al. 2005 (*JASA*); Holmes &
      Griffiths 2019 (*Sci Rep*, figure-ground and speech in noise); Felty, Buchwald & Pisoni
      2009 (*JASA-EL*, frozen babble); Woods & McDermott 2015 (*Curr Biol*, attentive tracking);
      Başkent & Gaudrain 2016 (*JASA-EL*, musicians and speech-on-speech); vocal effort vs
      distance (e.g., Traunmüller & Eriksson 2000, *JASA*); "Binaural-cue reweighting induced by
      discrimination training" (PMID 40369364, 2025).
16. Unidentified hits behind bot checks (not used): Thieme doi:10.1055/s-0045-1811532; ASHA
    doi:10.1044/2026_PERSP-25-00267 and doi:10.1044/2023_JSLHR-22-00621; eLife reviewed
    preprint 112403.

Access notes: PubMed Central and Europe PMC pages returned browser checks to the fetch tool;
HAL, eLife, Thieme and ASHA returned bot checks or errors. Open copies were found on publisher
OA pages and university repositories instead.

## References

Each entry lists the copy read and the reading depth.

- Amiri M, Jarollahi F, Jalaie S, Sameni SJ (2022). Auditory spatial training-induced changes in
  the release of informational masking in older adults. *Aud Vestib Res* 31(4).
  https://avr.tums.ac.ir/index.php/avr/article/view/1033 [abstract only]
- Anderson S, White-Schwoch T, Choi HJ, Kraus N (2013). Training changes processing of speech
  cues in older adults with hearing loss. *Front Syst Neurosci* 7:97.
  doi:10.3389/fnsys.2013.00097 [full text, Northwestern lab PDF]
- Beeston AV, Brown GJ, Watkins AJ (2014). Perceptual compensation for the effects of
  reverberation on consonant identification: evidence from studies with monaural stimuli. *JASA*
  136:3072–3084. doi:10.1121/1.4900596 [full text, Sheffield author PDF]
- Benard MR, Başkent D (2013). Perceptual learning of interrupted speech. *PLoS ONE* 8(3).
  https://dbspl.nl/pubs/ (author PDF) [full text]
- Biçer et al. (2022 poster; Zenodo 2024). Voice familiarity via training affects listening effort
  during a voice cue sensitivity task with vocoder degraded speech.
  https://zenodo.org/records/10997478 [record/abstract only]
- Brandewie E (2012). Factors affecting speech intelligibility improvement with exposure to
  reverberant room listening environments. PhD dissertation, University of Louisville.
  https://ir.library.louisville.edu/etd/141 [abstract only]
- Brandewie E, Zahorik P (2013). Time course of a perceptual enhancement effect for noise-masked
  speech in reverberant environments. *JASA* 134:EL265–EL270. doi:10.1121/1.4816263 [abstract
  only, UMN record]
- Bronkhorst AW (2015). The cocktail-party problem revisited: early processing and selection of
  multi-talker speech. *APP* 77:1465–1487. doi:10.3758/s13414-015-0882-9 [full text, Springer
  OA]
- Cameron S, Dillon H (2011). Development and evaluation of the LiSN & Learn auditory training
  software for deficit-specific remediation of binaural processing deficits in children:
  preliminary findings. *JAAA* 22:678–696. doi:10.3766/jaaa.22.10.6 [abstract only, Macquarie
  record]
- Cameron S, Dillon H (2017). *Sound Storm* (v1.1.9) [iPad software]. Australian Hearing / NAL.
  [record only, Macquarie]
- Cameron S, Glyde H, Dillon H (2012). Efficacy of the LiSN & Learn auditory training software:
  randomized blinded controlled study. *Audiology Research* 2:e15.
  https://www.mdpi.com/2039-4349/2/1/e15 [abstract only]
- Cline T, Colgrove N, Bush M, et al. (2021). Behavioral and hemodynamic changes following
  dichotic training in patients with neurological deficits of the auditory nervous system: a case
  series. *JAAA* 32:45–53. doi:10.1055/s-0040-1719095 [abstract only, UKY record]
- Domingo Y, Holmes E, Johnsrude IS (2020). The benefit to speech intelligibility of hearing a
  familiar voice. *J Exp Psychol: Applied*. Author manuscript:
  https://discovery-pp.ucl.ac.uk/10083754/ [full text]
- El Boghdady N, Başkent D, Gaudrain E (2018). Effect of frequency mismatch and band partitioning
  on vocal tract length perception in vocoder simulations of cochlear implant processing. *JASA*
  143(6). doi:10.1121/1.5041261 [full text of thesis chapter, CORE]
- El Boghdady N, Gaudrain E, Başkent D (2019). Does good perception of vocal characteristics
  relate to better speech-on-speech intelligibility for cochlear implant users? *JASA*
  145:417. doi:10.1121/1.5087693 [title/metadata only]
- Füllgrabe C (2015). Beyond audibility (Hearing Review roundtable, chapter 3).
  https://hearingreview.com/ [full text, secondary for cited studies]
- Füllgrabe C, Moore BCJ (2017). Evaluation of a method for determining binaural sensitivity to
  temporal fine structure (TFS-AF test) for older listeners with normal and impaired
  low-frequency hearing. *Trends Hear* 21. https://core.ac.uk/download/96621166.pdf [full text]
- Füllgrabe C, Moore BCJ, Stone MA (2015). Age-group differences in speech identification despite
  matched audiometrically normal hearing: contributions from auditory temporal processing and
  cognition. *Front Aging Neurosci* 6:347. doi:10.3389/fnagi.2014.00347 [full text, Frontiers]
- Gao X, Yan T, Huang T, Li X, Zhang Y-X (2020). Speech in noise perception improved by training
  fine auditory discrimination: far and applicable transfer of perceptual learning. *Sci Rep*
  10:19320. doi:10.1038/s41598-020-76295-9 [full text, PDF mirror of PMC7653913]
- Glyde H, Buchholz JM, Dillon H, Cameron S, Hickson L (2013). The importance of interaural time
  differences and level differences in spatial release from masking. *JASA* 134(2) EL.
  https://core.ac.uk/download/16695176.pdf [full text]
- Grange JA, Culling JF (2016). The benefit of head orientation to speech intelligibility in
  noise. *JASA* 139:703–712. https://orca.cardiff.ac.uk/91059/ [full text]
- Grange JA, Culling JF, Bardsley B, Mackinney LI, Hughes SE, Backhouse SS (2018). Turn an ear to
  hear: how hearing-impaired listeners can exploit head orientation to enhance their speech
  intelligibility in noisy social settings. *Trends Hear* 22. doi:10.1177/2331216518802701
  [full text, Swansea repository]
- Green T, Faulkner A, Rosen S (2019). Computer-based connected-text training of speech-in-noise
  perception for cochlear implant users. *Trends Hear* 23. doi:10.1177/2331216519843878
  [full text, UCL repository]
- Hennessy S, Mack WJ, Habibi A (2022). Speech-in-noise perception in musicians and non-musicians:
  a multi-level meta-analysis. *Hear Res* 416:108442. doi:10.1016/j.heares.2022.108442 [full
  text, USC lab PDF]
- Holmes E, Johnsrude IS (2023). Intelligibility benefit for familiar voices is not accompanied by
  better discrimination of fundamental frequency or vocal tract length. *Hear Res* 429:108704.
  doi:10.1016/j.heares.2023.108704 [full text, UCL repository]
- Holmes E, To G, Johnsrude IS (2021). How long does it take for a voice to become familiar? Speech
  intelligibility and voice recognition are differentially sensitive to voice training.
  *Psychol Sci*. doi:10.1177/0956797621991137 [full text, UCL repository]
- IRCT20190625044006N1 (registered 2019). The effect of rehabilitation training based on temporal
  fine structure on speech in noise perception performance on elderly with mild to moderate
  hearing loss. https://www.irct.ir/trial/40394 [registry record]
- Kolarik AJ, Moore BCJ, Zahorik P, Cirstea S, Pardhan S (2016). Auditory distance perception in
  humans: a review of cues, development, neuronal bases, and effects of sensory loss. *APP*
  78:373–395. doi:10.3758/s13414-015-1015-1 [abstract only, UEA repository]
- Lelo de Larrea-Mancera ES (2021). Perceptual learning: assessment and training across the
  mechanical senses (PhD dissertation, UC Riverside), ch. 4 = Lelo de Larrea-Mancera, Philipp,
  Stavropoulos, … Gallun, Seitz, "Training with an auditory perceptual learning game transfers to
  speech in competition", *J Cogn Enhanc* (2022); bioRxiv doi:10.1101/2021.01.26.428343.
  https://escholarship.org/content/qt7kw89480/ [full text of chapter]
- Lie S, Zekveld AA, Smits C, Kramer SE, Versfeld NJ (2024). Learning effects in speech-in-noise
  tasks: effect of masker modulation and masking release. *JASA* 156:341–349.
  https://pure.amsterdamumc.nl/ (repository PDF) [full text]
- Lin G, Carlile S (2015). Costs of switching auditory spatial attention in following
  conversational turn-taking. *Front Neurosci* 9:124. doi:10.3389/fnins.2015.00124 [full text]
- Lo CY, Dubinsky E, Gilmore SA, Wright-Whyte K, Singh G, Russo FA (2025). Choir singing and music
  appreciation training enhances unaided speech-in-noise perception and frequency following
  responses for older adult hearing aid users: a randomized controlled trial. *Semin Hear*
  46:125–140. doi:10.1055/s-0045-1811541 [abstract only, Macquarie record]
- Loutrari A, Alqadi A, Jiang C, … Liu F (2023/2024). Exploring the role of singing, semantics,
  and amusia screening in speech-in-noise perception in musicians and non-musicians. *Cogn
  Process* 25:147–161. doi:10.1007/s10339-023-01165-x [full text, Springer OA]
- Madsen SMK, Whiteford KL, Oxenham AJ (2017). Musicians do not benefit from differences in
  fundamental frequency when listening to speech in competing speech backgrounds. *Sci Rep*
  7:12624. doi:10.1038/s41598-017-12937-9 [full text, Springer OA]
- Madsen SMK, Marschall M, Dau T, Oxenham AJ (2019). Speech perception is similar for musicians
  and non-musicians across a wide range of conditions. *Sci Rep* 9:10404.
  doi:10.1038/s41598-019-46728-1 [full text, Nature OA PDF]
- Micheyl C, Delhommeau K, Perrot X, Oxenham AJ (2006). Influence of musical and psychoacoustical
  training on pitch discrimination. *Hear Res* 219:36–47. [abstract only, UMN record]
- Neurofeedback training of auditory selective attention enhances speech-in-noise perception
  (2021). *Front Hum Neurosci* 15:676992; bioRxiv doi:10.1101/2020.07.04.188045 [full text of
  preprint; author list not verified]
- Nisha KV, Uppunda AK, Kumar RT (2023). Spatial rehabilitation using virtual auditory space
  training paradigm in individuals with sensorineural hearing impairment. *Front Neurosci*
  16:1080398. doi:10.3389/fnins.2022.1080398 [full text, first ~60%]
- Oberfeld D, Klöckner-Nowotny F (2016). Individual differences in selective attention predict
  speech identification at a cocktail party. *eLife* 5:e16747. doi:10.7554/eLife.16747
  [abstract only, Mainz bibliography and Dryad records]
- Popham S, Boebinger D, Ellis DPW, Kawahara H, McDermott JH (2018). Inharmonic speech reveals the
  role of harmonicity in the cocktail party problem. *Nat Commun* 9:2122.
  doi:10.1038/s41467-018-04551-8 [full text, main body, Nature OA]
- "Remediation of spatial processing disorder (SPD)" (2018). *Int J Audiol*.
  doi:10.1080/14992027.2018.1431403, PMID 29378452 [abstract only; authors not verified]
- Rosen S, Souza P, Ekelund C, Majeed AA (2013). Listening to speech in a background of other
  talkers: effects of talker number and noise vocoding. *JASA* 133:2431–2443.
  doi:10.1121/1.4794379 [full text, UCL repository PDF]
- Rysop AU, Schmitt L-M, Obleser J, Hartwigsen G (2022). Age-related differences in the neural
  network interactions underlying the predictability gain. *Cortex* 154:269–286.
  https://core.ac.uk/download/516205599.pdf [full text]
- Shahidipour Z, Farahani S, Mohammadkhani G, Tavanai E, Rahbar N, Jalaie S (2021). Evaluating the
  effectiveness of dichotic training in the elderly adults: a single subject study. *Aud Vestib
  Res* 30(2). https://avr.tums.ac.ir/index.php/avr/article/view/901 [abstract only]
- Sohoglu E, Davis MH (2016). Perceptual learning of degraded speech by minimizing prediction
  error. *PNAS* 113:E1747–E1756. doi:10.1073/pnas.1523266113 [full text, MRC CBU PDF]
- Sun J, Zhang Z, Sun B, Liu H, Wei C, Liu Y (2022). The effect of aging on context use and
  reliance on context in speech: a behavioral experiment with Repeat–Recall Test. *Front Aging
  Neurosci* 14:924193. doi:10.3389/fnagi.2022.924193 [full text, Frontiers PDF]
- Swaminathan J, Mason CR, Streeter TM, Best V, Kidd G Jr, Patel AD (2015). Musical training,
  individual differences and the cocktail party problem. *Sci Rep* 5:11628. doi:10.1038/srep11628
  [full text, ScienceOpen copy of PMC]
- Tinnemore AR, Gordon-Salant S, Goupell MJ (2025). Context effects for degraded speech: effects
  of age, preceding or subsequent contextual cues, and signal-to-noise ratio. *JASA*
  158:447–460. doi:10.1121/10.0037182 [full text, UMD repository]
- Valzolgher C, et al. (2023). Training spatial hearing in unilateral cochlear implant users
  through reaching to sounds in virtual reality. *Eur Arch Otorhinolaryngol* 280:3661–3672.
  doi:10.1007/s00405-023-07886-1 [full text, Springer OA]
- Van Engen KJ (2010). Linguistic factors in speech-in-speech perception (PhD dissertation,
  Northwestern University), ch. 5 = Van Engen KJ (2012). Speech-in-speech recognition: a training
  study. *Lang Cogn Process* 27:1089–1107. doi:10.1080/01690965.2012.654644 [full text of
  dissertation chapter; journal page abstract only]
- Vlahou E, Seitz AR, Kopčo N (2019). Nonnative implicit phonetic training in multiple
  reverberant environments. *APP* 81:935–947. doi:10.3758/s13414-019-01680-0 [full text,
  eScholarship and Springer]
- Vlahou E, Seitz AR, Kopčo N (2014, ARO abstract; ~2015 poster). Adaptation to room
  reverberation in nonnative phonetic training; Nonnative phonetic category training in varying
  acoustic environments. Project/lab sites at upjs.sk [full text of abstract and poster]
- Vlahou E, Ueno K, Shinn-Cunningham BG, Kopčo N (2021). Calibration of consonant perception to
  room reverberation. *JSLHR*. doi:10.1044/2021_JSLHR-20-00396 [full text, CMU lab PDF]
- Whiteford KL, … Oxenham AJ (2025). Large-scale multi-site study shows no association between
  musical training and early auditory neural sound encoding. *Nat Commun* 16:7152.
  doi:10.1038/s41467-025-62155-5 [full text, BU lab PDF]
- Whitley A, Naylor G, Hadley LV (n.d., ≥2021). Used to be a dime, now it's a dollar: R-SPiN
  keyword predictability revisited 40 years on. Nottingham repository OutputFile/30490565 [full
  text; journal/year not shown]
- Whitton JP, Hancock KE, Shannon JM, Polley DB (2017). Audiomotor perceptual training enhances
  speech intelligibility in background noise. *Curr Biol* 27:3237–3247.
  doi:10.1016/j.cub.2017.09.014 [secondary report: ScienceDaily release 2017-10-19]
- Worschech F, Marie D, Jünemann K, … Altenmüller E (2021). Improved speech in noise perception in
  the elderly after 6 months of musical instruction. *Front Neurosci* 15:696240.
  doi:10.3389/fnins.2021.696240 [full text, Frontiers, first ~65%]
- Zendel BR, West GL, Belleville S, Peretz I (2019). Musical training improves the ability to
  understand speech-in-noise in older adults. *Neurobiol Aging*; preprint bioRxiv
  doi:10.1101/196030 [full text of preprint]
- Zenke K, Rosen S (2022). Spatial release of masking in children and adults in non-individualized
  virtual environments. *JASA* 152:3384–3395. doi:10.1121/10.0016360 [full text, UCL repository]
- arXiv 2408.14198 (2024). Combined assessment of auditory distance perception and
  externalization. https://arxiv.org/pdf/2408.14198 [full text; used as secondary for distance
  cues]
- Secondary-only primary studies (cited via Bronkhorst 2015, Rosen et al. 2013, Domingo et al.
  2020, Vlahou et al. 2021 or Grange et al. 2018, as marked in the text): Arbogast et al. 2002;
  Best et al. 2008, 2010; Binns & Culling 2007; Bird & Darwin 1998; Brokx & Nooteboom 1982;
  Bronkhorst 2000; Bronkhorst & Plomp 1988; Bronkhorst et al. 1993, 2002; Brungart 2001; Brungart
  & Iyer 2012; Brungart & Simpson 2002, 2007; Culling et al. 2004; Darwin, Brungart & Simpson
  2003; Du et al. 2011; Festen & Plomp 1990; Freyman et al. 2001, 2004; Grange & Culling 2016a;
  Iyer et al. 2010; Johnsrude et al. 2013; Kidd et al. 2005; Koch et al. 2011; Mayo et al. 1997;
  Plomp 1977; Rhebergen & Versfeld 2005; Rhebergen et al. 2006; Spence & Driver 1997;
  Teder-Sälejärvi & Hillyard 1998; van Rooij & Plomp 1991; Brandewie & Zahorik 2010, 2018.
