"""Refine word times (`wt`) of clips whose synthesiser gives no durations (Piper) or that are natural speech:
the recogniser's word onsets (80 ms frames) are moved to the quietest 5 ms within 120 ms before to 40 ms after
each onset; a word ends where the next begins (the last at the end of speech). Writes `wt` and
`wt_src: 'asr+energy'` back to the render database. Resumable. Usage: python3 -I tools/audio/fix_wt.py
"""
import sys

import numpy as np

sys.path.insert(0, __import__('os').path.dirname(__file__))
import asr  # noqa: E402
from common import SR, Log, Results, env_db, load_audio, norm_words, speech_bounds, wav_path  # noqa: E402
from natural import shipped  # noqa: E402

KINDS = ('phrase', 'sentence', 'intro')


def refine_onsets(x, starts):
    e = env_db(x, SR, win=0.01, hop=0.0025)
    out = []
    for i, t in enumerate(starts):
        if i == 0:
            s, _ = speech_bounds(x)
            out.append(round(max(0.0, s / SR - 0.01), 3))
            continue
        lo = max(out[-1] + 0.05, t - 0.12)
        hi = t + 0.04
        a, b = int(lo / 0.0025), min(len(e), int(hi / 0.0025) + 1)
        k = a + int(np.argmin(e[a:b])) if b > a else int(t / 0.0025)
        out.append(round(k * 0.0025 + 0.005, 3))
    return out


def aligned_starts(words, hw, dur):
    """Start time per expected word from a word-level alignment with the recogniser's words; expected words
    without a match get times interpolated between their matched neighbours."""
    import lexicon
    hs = [norm_words(w)[0] if norm_words(w) else '' for w, _ in hw]
    n, m = len(words), len(hs)
    D = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        D[i][0] = i
    for j in range(m + 1):
        D[0][j] = j
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            D[i][j] = min(D[i - 1][j] + 1, D[i][j - 1] + 1,
                          D[i - 1][j - 1] + (0 if lexicon.same_word(words[i - 1], hs[j - 1]) else 1))
    i, j, match = n, m, {}
    while i > 0 and j > 0:
        c = 0 if lexicon.same_word(words[i - 1], hs[j - 1]) else 1
        if D[i][j] == D[i - 1][j - 1] + c:
            match[i - 1] = max(0.0, hw[j - 1][1])
            i, j = i - 1, j - 1
        elif D[i][j] == D[i - 1][j] + 1:
            i -= 1
        else:
            j -= 1
    if len(match) < max(2, n // 2):
        return None
    known = sorted(match)
    out = []
    for k in range(n):
        if k in match:
            out.append(match[k])
            continue
        lo = max([q for q in known if q < k], default=None)
        hi = min([q for q in known if q > k], default=None)
        t0 = match[lo] if lo is not None else 0.0
        t1 = match[hi] if hi is not None else dur
        a, b = (lo if lo is not None else -1), (hi if hi is not None else n)
        out.append(t0 + (t1 - t0) * (k - a) / (b - a))
    return out


def main():
    log = Log('fix-wt')
    res = Results('sentences')
    rec = asr.recogniser('parakeet')
    rows = [r for r in res.values() if r.get('ok') and r['kind'] in KINDS
            and ((r['src'] != 'kokoro' and r.get('wt_src') != 'asr+energy') or not r.get('wt'))]
    fixed = 0
    for r in rows:
        x = load_audio(wav_path(r['id']))
        words = r.get('words') or norm_words(r.get('say', r['text']))
        _, hw = rec.run(shipped(x))
        if len(hw) == len(words):
            raw = [max(0.0, t) for _, t in hw]
        else:
            raw = aligned_starts(words, hw, len(x) / SR)
            if raw is None:
                continue
        starts = refine_onsets(x, raw)
        _, end = speech_bounds(x)
        ends = starts[1:] + [round(end / SR, 3)]
        row = dict(r, wt=[[a, b] for a, b in zip(starts, ends)], wt_src='asr+energy')
        res.put(row)
        fixed += 1
    log(f'refined word times of {fixed} of {len(rows)} clips')


if __name__ == '__main__':
    main()
