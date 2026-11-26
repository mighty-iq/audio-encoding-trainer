"""Matrix probe words: cut every word of the rendered matrix sentences (held-out voices) at the synthesiser's
word boundaries, refined to the quietest 5 ms within 30 ms, and keep for each voice and word the take that the
recogniser identifies with the quietest edges. The check is closed-set, like the probe: the recognition must be
closer (in phonemes) to the right word than to any other word of its slot. A word with no good take is
synthesised on its own (two forms, two speeds). Output: kind 'word', set and pack 'probe' (db 'words').
Usage: python3 -I tools/audio/cut_matrix.py
"""
import sys

import numpy as np

sys.path.insert(0, __import__('os').path.dirname(__file__))
import asr  # noqa: E402
import content_probe as CP  # noqa: E402
import tts  # noqa: E402
from common import (SR, Log, Results, active_level_db, env_db, fade, load_audio, rms_db, save_clip, trim,  # noqa: E402
                    wav_path)
from natural import shipped  # noqa: E402

SLOT_OF = {w: s for s in CP.SLOTS for w in CP.MATRIX[s]}


def ipa_dist(a, b):
    """Edit distance between espeak-ng pronunciations of two (possibly unknown) spellings."""
    import lexicon
    pa, pb = lexicon.espeak_ipa(a), lexicon.espeak_ipa(b)
    return lexicon.edit_distance(pa, pb)


def closed_ok(word, heard):
    """Closed-set check (the probe offers the 10 words of the slot): exact recognition, or a recognition that is
    closer to the right word than to every other word of its slot and at most two phonemes from it."""
    from common import norm_words
    h = norm_words(heard)
    if not h:
        return False
    if asr.score(word, heard)['ok']:
        return True
    said = ''.join(h)
    opts = CP.MATRIX[SLOT_OF[word]]
    d = {w: ipa_dist(said, w) for w in opts}
    best = min(d.values())
    return d[word] == best and d[word] <= 2 and sum(1 for v in d.values() if v == best) == 1


def refine(x, t, reach=0.03):
    e = env_db(x, SR, win=0.01, hop=0.0025)
    i0, i1 = max(0, int((t - reach) / 0.0025)), min(len(e), int((t + reach) / 0.0025) + 1)
    return int(((i0 + int(np.argmin(e[i0:i1]))) * 0.0025 + 0.005) * SR) if i1 > i0 else int(t * SR)


def edges(y):
    e = env_db(y, SR, win=0.01, hop=0.005)
    pk = float(e.max())
    n = int(0.01 * SR)
    return max(rms_db(y[:n]) - pk, rms_db(y[-n:]) - pk)


def candidates(row):
    x = load_audio(wav_path(row['id']))
    wt, words = row.get('wt'), row.get('words')
    if not wt or len(wt) != len(words):
        return []
    out = []
    for k, w in enumerate(words):
        a = 0 if k == 0 else refine(x, (wt[k - 1][1] + wt[k][0]) / 2)
        b = len(x) if k == len(words) - 1 else refine(x, (wt[k][1] + wt[k + 1][0]) / 2)
        if b - a < int(0.12 * SR):
            continue
        y = fade(trim(x[a:b], pad=0.02), SR, 6.0, 8.0)
        out.append((w, y, row['id']))
    return out


def main():
    log = Log('cut-matrix')
    import render_phrases
    render_phrases.run(['matrix'])          # the current matrix version's sentences (resumable)
    sents = Results('sentences')
    res = Results('words')
    rec = asr.recogniser('parakeet')
    prefix = f'mxv{CP.MATRIX_VERSION}-'
    rows = [r for r in sents.values() if r.get('ok') and 'matrix' in (r.get('tags') or [])
            and str(r.get('item', '')).startswith(prefix)]
    by_voice = {}
    for r in rows:
        by_voice.setdefault(r['voice'], []).append(r)
    for v, rs in sorted(by_voice.items()):
        best = {}
        for r in rs:
            for w, y, src in candidates(r):
                cid = f'kokoro.{v}.word.{w}'
                if res.get(cid, {}).get('ok') and wav_path(cid).exists():
                    continue
                heard, _ = rec.run(shipped(y))
                if not closed_ok(w, heard):
                    continue
                q = edges(y)
                if w not in best or q < best[w][0]:
                    best[w] = (q, y, src, heard)
        for w in sorted(SLOT_OF):
            cid = f'kokoro.{v}.word.{w}'
            if res.get(cid, {}).get('ok') and wav_path(cid).exists():
                continue
            how = 'cut'
            if w not in best:
                how = 'isolated'
                eng = tts.engine('kokoro')
                for form in ('{}.', '{}!'):
                    for sp in (1.0, 0.92):
                        y = trim(eng.synth(form.format(w.capitalize()), v, speed=sp))
                        heard, _ = rec.run(shipped(y))
                        if closed_ok(w, heard):
                            best[w] = (edges(y), y, 'isolated', heard)
                            break
                    if w in best:
                        break
            if w not in best:
                res.put({'id': cid, 'src': 'kokoro', 'voice': v, 'kind': 'word', 'text': w, 'ok': False})
                log('DROPPED', cid)
                continue
            q, y, src, heard = best[w]
            save_clip(cid, y)
            res.put({'id': cid, 'src': 'kokoro', 'voice': v, 'kind': 'word', 'text': w, 'ok': True, 'heard': heard,
                     'dur': round(len(y) / SR, 3), 'adb': round(active_level_db(y), 2), 'pack': 'probe',
                     'set': 'probe', 'item': f'matrix-{SLOT_OF[w]}', 'tags': ['matrix', SLOT_OF[w], how],
                     'edge': round(q, 1), 'from': src})
        kept = sum(1 for w in SLOT_OF if res.get(f'kokoro.{v}.word.{w}', {}).get('ok'))
        log(f'{v}: {kept}/{len(SLOT_OF)} matrix words')


if __name__ == '__main__':
    main()
