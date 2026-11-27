"""Matrix probe words for the Lab's two matrix talkers (af_kore: Matrix and Rooms; bm_lewis: New voice).

Each word is cut from the talker's rendered matrix sentences with wide margins: the cut lies at the quietest
5 ms between 5 and 60 ms outside the word's synthesiser times (before its onset, after its offset), so onsets
and codas stay whole. A take is kept only when open-vocabulary recognition of the shipped audio (level-
normalised, MP3 round trip) hears exactly that word, as for every other clip; among passing takes the one with
the quietest edges wins. Words with no passing take try, in order: six new carrier sentences, a wider cut
after the word (120 ms), carriers with commas around the word, short final-position carriers, then isolated
synthesis; the method is kept in the clip's tags. Words no longer in the matrix stay out of the pack.
Output: kind 'word', set and pack 'probe' (db 'words'). Usage: python3 -I tools/audio/cut_matrix.py
"""
import random
import sys

import numpy as np

sys.path.insert(0, __import__('os').path.dirname(__file__))
import asr  # noqa: E402
import content_probe as CP  # noqa: E402
import tts  # noqa: E402
from common import SR, Log, Results, active_level_db, env_db, fade, load_audio, rms_db, save_clip, trim, wav_path  # noqa: E402
from natural import shipped  # noqa: E402

VOICES = ['af_kore', 'bm_lewis']          # af_river and af_jessica are not built (review ST-06)
SLOT_OF = {w: s for s in CP.SLOTS for w in CP.MATRIX[s]}
NEAR, FAR = 0.005, 0.06


def ipa_dist(a, b):
    """Edit distance between espeak-ng pronunciations of two (possibly unknown) spellings."""
    import lexicon
    return lexicon.edit_distance(lexicon.espeak_ipa(a), lexicon.espeak_ipa(b))


def word_ok(word, heard):
    return asr.score(word, heard)['ok']


def quietest(x, lo, hi):
    e = env_db(x, SR, win=0.01, hop=0.0025)
    a, b = max(0, int(lo / 0.0025)), min(len(e), int(hi / 0.0025) + 1)
    if b <= a:
        return int(max(0.0, lo) * SR)
    return int(((a + int(np.argmin(e[a:b]))) * 0.0025 + 0.005) * SR)


def edges(y):
    e = env_db(y, SR, win=0.01, hop=0.005)
    pk = float(e.max())
    n = int(0.01 * SR)
    return max(rms_db(y[:n]) - pk, rms_db(y[-n:]) - pk)


def takes(x, wt, words, only=None):
    """(word, clip) for each word: margins outside the synthesiser's word times."""
    out = []
    for k, w in enumerate(words):
        if only and w != only:
            continue
        a = 0 if k == 0 else quietest(x, wt[k][0] - FAR, wt[k][0] - NEAR)
        if k == len(words) - 1:     # last word: end at the quietest point after it (drops a trailing breath)
            b = min(len(x), quietest(x, wt[k][1] + NEAR, min(len(x) / SR, wt[k][1] + max(FAR, 0.12))) + int(0.03 * SR))
        else:
            b = quietest(x, wt[k][1] + NEAR, wt[k][1] + FAR)
        if b - a >= int(0.15 * SR):
            out.append((w, fade(trim(x[a:b], pad=0.03), SR, 5.0, 8.0)))
    return out


def judge(rec, w, y):
    heard, _ = rec.run(shipped(y))
    return (edges(y), y, heard) if word_ok(w, heard) else None


def extra(v, w, rec, eng, log, n=6):
    """New carrier sentences with the word in its slot; first passing take."""
    slot = SLOT_OF[w]
    rng = random.Random(f'extra2-{v}-{w}')
    import render_phrases as RP
    for k in range(n):
        words = [w if s == slot else rng.choice(CP.MATRIX[s]) for s in CP.SLOTS]
        text = f'{words[0].capitalize()} {" ".join(words[1:])}.'
        x, spans = eng.synth_timed(text, v, speed=(1.0, 0.95, 1.05)[k % 3])
        y0, off = RP.trim_with_offset(x)
        wt = RP.word_times({'text': text, 'words': words}, spans, off, [], len(y0) / SR)
        if not wt:
            continue
        for _, y in takes(y0, wt, words, only=w):
            got = judge(rec, w, y)
            if got:
                log(v, w, 'extra carrier', repr(text))
                return got + (f'extra:{text}',)
    return None


def paused(v, w, rec, eng, log, n=6):
    """Carriers with commas around the word, so the model pauses on both sides of it."""
    import render_phrases as RP
    slot = SLOT_OF[w]
    k = CP.SLOTS.index(slot)
    rng = random.Random(f'paused-{v}-{w}')
    for i in range(n):
        words = [w if s == slot else rng.choice(CP.MATRIX[s]) for s in CP.SLOTS]
        parts = [x.capitalize() if j == 0 else x for j, x in enumerate(words)]
        if k > 0:
            parts[k - 1] += ','
        if k < len(parts) - 1:
            parts[k] += ','
        text = ' '.join(parts) + '.'
        x, spans = eng.synth_timed(text, v, speed=(1.0, 0.95, 1.05)[i % 3], clause=0.25)
        y0, off = RP.trim_with_offset(x)
        wt = RP.word_times({'text': text, 'words': words}, spans, off, [], len(y0) / SR)
        if not wt:
            continue
        for _, y in takes(y0, wt, words, only=w):
            got = judge(rec, w, y)
            if got:
                log(v, w, 'paused carrier', repr(text))
                return got + (f'paused:{text}',)
    return None


def final(v, w, rec, eng, log):
    """Short carriers: the word between two light words ("She finds it.") or at the end ("The word is finds.");
    the recogniser hears these words reliably in such frames even where it mishears a bare word."""
    import render_phrases as RP
    for text in (f'She {w} it.', f'They {w} it.', f'The word is {w}.', f'I said {w}.', f'Next one, {w}.'):
        words = [t.strip('.,').lower() for t in text.split()]
        for sp in (1.0, 0.9, 0.8):
            x, spans = eng.synth_timed(text, v, speed=sp)
            y0, off = RP.trim_with_offset(x)
            wt = RP.word_times({'text': text, 'words': words}, spans, off, [], len(y0) / SR)
            if not wt:
                continue
            for _, y in takes(y0, wt, words, only=w):
                got = judge(rec, w, y)
                if got:
                    log(v, w, 'final-position carrier', repr(text), sp)
                    return got + (f'final:{text}',)
    return None


def isolated(v, w, rec, eng):
    for form in ('{}.', '{}!', '"{}."', '{}...'):
        for sp in (1.0, 0.92, 1.08, 0.85, 0.75):
            y = trim(eng.synth(form.format(w.capitalize()), v, speed=sp))
            got = judge(rec, w, y)
            if got:
                return got + ('isolated',)
    return None


def main():
    log = Log('cut-matrix')
    import render_phrases
    render_phrases.run(['matrix'])          # the current matrix version's sentences (resumable)
    sents = Results('sentences')
    res = Results('words')
    rec = asr.recogniser('parakeet')
    eng = tts.engine('kokoro')
    prefix = f'mxv{CP.MATRIX_VERSION}-'
    for r in list(res.values()):            # voices not built any more stay out of the pack
        if r.get('voice') not in VOICES and r.get('pack') != 'none' and 'matrix' in (r.get('tags') or []):
            res.put(dict(r, pack='none', note='not built (ST-06)'))
        elif r.get('text') not in SLOT_OF and r.get('pack') != 'none' and 'matrix' in (r.get('tags') or []):
            res.put(dict(r, pack='none', note='word replaced in the matrix (ST-04)'))
    for v in VOICES:
        rows = [r for r in sents.values() if r.get('ok') and r['voice'] == v and 'matrix' in (r.get('tags') or [])
                and str(r.get('item', '')).startswith(prefix) and r.get('wt')]
        todo = [w for w in sorted(SLOT_OF)
                if not (res.get(f'kokoro.{v}.word.{w}', {}).get('ok') and wav_path(f'kokoro.{v}.word.{w}').exists())]
        for w in todo:
            best = None
            for r in rows:
                if w not in r['words']:
                    continue
                x = load_audio(wav_path(r['id']))
                for _, y in takes(x, r['wt'], r['words'], only=w):
                    got = judge(rec, w, y)
                    if got and (best is None or got[0] < best[0]):
                        best = got + (r['id'],)
            how = 'cut'
            if best is None:
                best, how = extra(v, w, rec, eng, log), 'extra'
            if best is None:
                global FAR
                far0, FAR = FAR, 0.12                     # wider window after the word
                for r in rows:
                    if best is None and w in r['words']:
                        x = load_audio(wav_path(r['id']))
                        for _, y in takes(x, r['wt'], r['words'], only=w):
                            got = judge(rec, w, y)
                            if got and (best is None or got[0] < best[0]):
                                best, how = got + (r['id'],), 'cut-wide'
                FAR = far0
            if best is None:
                best, how = paused(v, w, rec, eng, log), 'paused'
            if best is None:
                best, how = final(v, w, rec, eng, log), 'final'
            if best is None:
                best, how = isolated(v, w, rec, eng), 'isolated'
            cid = f'kokoro.{v}.word.{w}'
            if best is None:
                res.put({'id': cid, 'src': 'kokoro', 'voice': v, 'kind': 'word', 'text': w, 'ok': False})
                log('DROPPED', cid)
                continue
            q, y, heard, src = best
            save_clip(cid, y)
            res.put({'id': cid, 'src': 'kokoro', 'voice': v, 'kind': 'word', 'text': w, 'ok': True, 'heard': heard,
                     'dur': round(len(y) / SR, 3), 'adb': round(active_level_db(y), 2), 'pack': 'probe',
                     'set': 'probe', 'item': f'matrix-{SLOT_OF[w]}', 'tags': ['matrix', SLOT_OF[w], how],
                     'edge': round(q, 1), 'from': src, 'rule': 'open'})
            log(v, w, how, repr(heard))
        kept = sum(1 for w in SLOT_OF if res.get(f'kokoro.{v}.word.{w}', {}).get('ok'))
        log(f'{v}: {kept}/{len(SLOT_OF)} matrix words')


if __name__ == '__main__':
    main()
