"""LibriVox read speech (public domain) from the DNS-Challenge 2020 mirror (branch interspeech2020/master,
datasets/clean; Git LFS, fetched file by file). Each 31-s clip is transcribed, cut into single sentences at
pauses, and a sentence is kept only when Parakeet and Whisper agree word for word. Used as natural
background talkers (pack 'babble'). Reader sex is estimated from F0 (no metadata exists)."""
import random
import re

import numpy as np

import asr
from common import CORPORA, SR, active_level_db, env_db, load_audio, norm_words, save_clip, trim, wav_path
from natural import fetch, shipped
from registry import f0_median

BASE = 'https://media.githubusercontent.com/media/microsoft/DNS-Challenge/interspeech2020/master/'
N_READERS = 14
PER_READER = 1
MIN_S, MAX_S = 2.2, 6.5


def sentences(x, rec):
    """[(start, end, text)] sentence spans from Parakeet's punctuation and token times."""
    z = rec.rec.create_stream()
    z.accept_waveform(SR, x)
    rec.rec.decode_stream(z)
    r = z.result
    toks, ts = list(r.tokens), list(r.timestamps)
    out, cur, start = [], '', None
    for i, (tok, t) in enumerate(zip(toks, ts)):
        if start is None:
            start = t
        cur += tok
        if tok.strip() in ('.', '?', '!') and i + 1 < len(toks):
            out.append((start, ts[i + 1], cur.strip()))
            cur, start = '', None
    return out


def cut(x, a, b):
    """Cut [a, b] seconds with the edges moved to the quietest 20 ms nearby."""
    e = env_db(x, SR, win=0.02, hop=0.005)

    def quiet(t, before, after):
        i0, i1 = max(0, int((t - before) / 0.005)), min(len(e), int((t + after) / 0.005) + 1)
        return (i0 + int(np.argmin(e[i0:i1]))) * 0.005 + 0.01 if i1 > i0 else t
    s, f = quiet(a, 0.25, 0.05), quiet(b, 0.05, 0.25)
    return x[int(s * SR):int(f * SR)]


def run(log, res, meta):
    files = (CORPORA / 'dns-librivox' / 'files.txt').read_text().split()
    clean = [f for f in files if f.startswith('datasets/clean/') and f.endswith('.wav')]
    readers = {}
    for f in clean:
        m = re.search(r'reader_(\d+)', f)
        if m:
            readers.setdefault(m.group(1), []).append(f)
    rng = random.Random('earshot-librivox')
    pick = rng.sample(sorted(readers), N_READERS * 2)
    p_rec, w_rec = asr.recogniser('parakeet'), asr.recogniser('whisper')
    done = 0
    for rd in pick:
        if done >= N_READERS:
            break
        vid = f'r{rd}'
        have = [k for k in res.rows if k.startswith(f'librivox.{vid}.') and res.rows[k].get('ok')]
        if len(have) >= PER_READER:
            done += 1
            continue
        f = sorted(readers[rd])[0]
        local = CORPORA / 'dns-librivox' / 'wav' / f.split('/')[-1]
        if not fetch(BASE + f, local):
            log('fetch failed', f)
            continue
        x = load_audio(local)
        kept = len(have)
        for (a, b, text) in sentences(x, p_rec):
            if kept >= PER_READER:
                break
            if not (MIN_S <= b - a <= MAX_S) or len(norm_words(text)) < 5:
                continue
            y = trim(cut(x, a, b))
            ys = shipped(y)
            p_txt, _ = p_rec.run(ys)
            w_txt, _ = w_rec.run(ys)
            d, errs = asr.align(norm_words(p_txt), norm_words(w_txt))
            if d != 0 or not norm_words(p_txt):
                log(vid, 'disagree', errs[:4])
                continue
            kept += 1
            cid = f'librivox.{vid}.sentence.seg-{kept}'
            save_clip(cid, y)
            res.put({'id': cid, 'src': 'librivox', 'voice': vid, 'kind': 'sentence', 'text': p_txt, 'ok': True,
                     'heard': w_txt, 'dur': round(len(y) / SR, 3), 'adb': round(active_level_db(y), 2),
                     'pack': 'babble', 'set': 'train', 'tags': ['babble', 'natural'], 'source': f.split('/')[-1]})
        if kept:
            f0 = f0_median(np.concatenate([load_audio(wav_path(k)) for k in res.rows
                                           if k.startswith(f'librivox.{vid}.') and res.rows[k].get('ok')]))
            sex = 'f' if f0 and f0 >= 165 else ('m' if f0 and f0 <= 150 else 'u')
            meta[f'librivox.{vid}'] = {'sex': sex, 'accent': 'English (volunteer reader)', 'f0': f0}
            done += 1
            log(f'librivox reader {rd}: {kept} sentences, f0 {f0}')
