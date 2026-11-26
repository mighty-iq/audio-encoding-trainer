"""Build-time intelligibility in speech-shaped noise (an objective proxy, not a human norm):
- tier (1-3) for accented and non-native voices: recogniser word accuracy on up to 10 of the voice's
  sentences at 0 dB SNR, split into thirds among those voices (1 = clearest); tools/audio/voice_tiers.json;
- diff (dB) for matrix probe words: recogniser accuracy at 0, +3 and +6 dB SNR (around the recogniser's own 50 %
  point; it needs about 10 dB more SNR than people) over three noise seeds, turned into a level offset with a
  slope of 10 %/dB and capped at +-3 dB (db 'intel'; pack.py copies it into the manifest).
Usage: python3 -I tools/audio/intel.py tiers|matrix
"""
import json
import sys

import numpy as np

sys.path.insert(0, __import__('os').path.dirname(__file__))
import asr  # noqa: E402
import plan as P  # noqa: E402
from common import REPO, SR, STAGE, WORK, Log, Results, active_level_db, load_audio, norm_words, wav_path  # noqa: E402

PAD = 0.3


def ssn(n, seed):
    """Speech-shaped noise: white noise filtered to the training LTAS (data/ltas.js written by registry.py)."""
    f = STAGE / 'data' / 'ltas.js'
    t = (f if f.exists() else REPO / 'data' / 'ltas.js').read_text().split('\n')[1]
    lt = json.loads(t[t.index('= {', t.rindex('||', 0, 200)) + 2:].rstrip().rstrip(';'))
    mag = 10 ** (np.array(lt['mag']) / 20)
    rng = np.random.default_rng(seed)
    nf = 1 << int(np.ceil(np.log2(n + 1)))
    spec = np.fft.rfft(rng.standard_normal(nf))
    freqs = np.fft.rfftfreq(nf, 1 / SR)
    spec *= np.interp(freqs, np.fft.rfftfreq(lt['nfft'], 1 / SR), mag)
    y = np.fft.irfft(spec, nf)[:n]
    return (y / np.sqrt(np.mean(y ** 2))).astype(np.float32)


def mix(x, snr_db, seed):
    """Speech at its active level, noise RMS at (level - snr) dB, with PAD seconds of noise either side."""
    p = int(PAD * SR)
    a = active_level_db(x)
    y = np.concatenate([np.zeros(p, np.float32), x, np.zeros(p, np.float32)])
    noise = ssn(len(y), seed) * 10 ** ((a - snr_db) / 20)
    out = y + noise
    return (out / max(1.0, float(np.max(np.abs(out))) / 0.95)).astype(np.float32)


def accuracy(rec, text, y):
    heard, _ = rec.run(y, pad=0.0)
    e = norm_words(text)
    d, _ = asr.align(e, norm_words(heard))
    return max(0.0, 1 - d / max(1, len(e)))


def tiers(log):
    rec = asr.recogniser('parakeet')
    rows = [r for db in ('sentences',) for r in Results(db).values() if r.get('ok')]
    accented = [f'kokoro.{v}' for v in P.ACCENT_KEPT]
    score = {}
    for vid in accented:
        src, v = vid.split('.', 1)
        mine = [r for r in rows if r['src'] == src and r['voice'] == v and r['kind'] in ('phrase', 'sentence')][:10]
        acc = [accuracy(rec, r['text'], mix(load_audio(wav_path(r['id'])), 0.0, k)) for k, r in enumerate(mine)]
        if acc:
            score[vid] = round(float(np.mean(acc)), 3)
            log(vid, 'accuracy at 0 dB', score[vid], f'({len(acc)} clips)')
    order = sorted(score, key=lambda k: -score[k])
    out = {}
    for i, vid in enumerate(order):
        out[vid] = {'tier': 1 + (3 * i) // max(1, len(order)), 'acc0dB': score[vid]}
    json.dump(out, open(REPO / 'tools' / 'audio' / 'voice_tiers.json', 'w'), indent=1, sort_keys=True)
    log('tiers', {k: v['tier'] for k, v in out.items()})


def matrix(log):
    rec = asr.recogniser('parakeet')
    res = Results('intel')
    words = [r for r in Results('words').values() if r.get('ok') and 'matrix' in (r.get('tags') or [])]
    for r in words:
        if (res.get(r['id']) or {}).get('v') == 2:
            continue
        x = load_audio(wav_path(r['id']))
        hits = [accuracy(rec, r['text'], mix(x, snr, seed)) for snr in (0.0, 3.0, 6.0) for seed in (1, 2, 3)]
        res.put({'id': r['id'], 'p': round(float(np.mean(hits)), 3), 'v': 2})
    by_voice = {}
    for r in words:
        by_voice.setdefault(r['voice'], []).append(r['id'])
    for v, ids in by_voice.items():
        ps = [res.get(i)['p'] for i in ids if (res.get(i) or {}).get('v') == 2]
        mean = float(np.mean(ps))
        for i in ids:
            row = res.get(i)
            if (row or {}).get('v') != 2:
                continue
            row['diff'] = round(float(np.clip((mean - row['p']) / 0.10, -3, 3)), 1)
            res.put(row)
        log(v, f'mean p {mean:.2f} over {len(ps)} words')


if __name__ == '__main__':
    (tiers if sys.argv[1] == 'tiers' else matrix)(Log(f'intel-{sys.argv[1]}'))
    _ = WORK
