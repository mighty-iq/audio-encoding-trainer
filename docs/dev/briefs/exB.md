# Brief: exercise views B — Echo, Seek, Voices, Missions (wave 2)

Owner paths: js/ex/echo.js, js/ex/seek.js, js/ex/voices.js, js/ex/voices-own.js, js/ex/missions.js,
tests/e2e/ex_b_*.py, docs/dev/progress/exB.md.
Read: CONTRACTS §4 (audio.live), §5, §7 (own voices in IndexedDB), §8, §11; PLAN §6 (exercises 5–8);
docs/research/R3 (§7 head turning, §10 voice familiarity), R1 (partner-voice training in existing apps).

- Echo (keyword view): message heard once in noise → a short pause with a neutral screen → 2–3 questions about
  details; feedback replays the message with its text.
- Seek (custom view): hold and drag in the field to find a faint repeating voice whose clarity rises with
  proximity; release to name its word; later levels add decoy voices and a head-turn view (rotate the listener;
  the better ear improves when facing ~30° toward the talker). Touch acts on release; keyboard arrows + Enter work.
  Nothing decorative moves while sound plays except the player's own cursor.
- Voices (custom + keyword): meet cast members (short intros), "who is talking" (keyword), "find your friend"
  (a familiar voice among unfamiliar maskers); own voices: record (getUserMedia only where allowed) or import an
  audio file (voice note) with a consent line ("only with the speaker's permission"), stored in IndexedDB,
  never exported, deletable; graceful messages where recording is blocked (sandboxed previews).
- Missions (custom): one real-world listening task per week from a list grounded in the notes (back to the noise,
  turn ~30° toward the talker, watch faces, ask a targeted repeat, close the distance), a 20-second check-in
  (did you try it, how much you followed 0–10), stored in `missions`; feeds the diary.
Tests as in exA. Commit own paths only; never push; progress in docs/dev/progress/exB.md.
