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


def main():
    log = Log('fix-wt')
    res = Results('sentences')
    rec = asr.recogniser('parakeet')
    rows = [r for r in res.values() if r.get('ok') and r['kind'] in KINDS and r['src'] != 'kokoro'
            and r.get('wt_src') != 'asr+energy']
    fixed = 0
    for r in rows:
        x = load_audio(wav_path(r['id']))
        words = r.get('words') or norm_words(r.get('say', r['text']))
        _, hw = rec.run(shipped(x))
        if len(hw) != len(words):
            continue
        starts = refine_onsets(x, [max(0.0, t) for _, t in hw])
        _, end = speech_bounds(x)
        ends = starts[1:] + [round(end / SR, 3)]
        row = dict(r, wt=[[a, b] for a, b in zip(starts, ends)], wt_src='asr+energy')
        res.put(row)
        fixed += 1
    log(f'refined word times of {fixed} of {len(rows)} clips')


if __name__ == '__main__':
    main()
