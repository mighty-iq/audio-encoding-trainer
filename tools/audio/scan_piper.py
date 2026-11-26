"""Scan Piper libritts-high speakers: render one test sentence per sampled speaker, measure median F0 and
recogniser accuracy, and choose a spread of clear voices by sex (F0) and pitch. The scan rows go to
../stimwork/db/piper_scan.jsonl; the choice is committed as tools/audio/piper_voices.json (read by plan.py).
Usage: python3 -I tools/audio/scan_piper.py [N_SAMPLE]
"""
import json
import random
import sys

sys.path.insert(0, __import__('os').path.dirname(__file__))
import asr  # noqa: E402
import tts  # noqa: E402
from common import REPO, Log, Results, trim  # noqa: E402
from registry import f0_median  # noqa: E402

TEST = 'We could meet near the old bridge after lunch, if the rain stops.'
N_TRAIN_F, N_TRAIN_M, N_PROBE_F, N_PROBE_M = 10, 10, 0, 0


def pick_spread(cands, n):
    """n voices spread evenly over the F0 range of the candidates (sorted by F0)."""
    cands = sorted(cands, key=lambda c: c['f0'])
    if len(cands) <= n:
        return cands
    idx = [round(i * (len(cands) - 1) / (n - 1)) for i in range(n)]
    return [cands[i] for i in sorted(set(idx))]


def main(argv):
    n = int(argv[1]) if len(argv) > 1 else 140
    log = Log('scan-piper')
    res = Results('piper_scan')
    eng = tts.engine('piper-libritts')
    rec = asr.recogniser('parakeet')
    spk = eng.voices()
    rng = random.Random('earshot-piper')
    sample = rng.sample(spk, n)
    for i, v in enumerate(sample):
        if v in res:
            continue
        x = trim(eng.synth(TEST, v))
        heard, _ = rec.run(x)
        sc = asr.score(TEST, heard)
        res.put({'id': v, 'f0': f0_median(x), 'wer': sc['wer'], 'heard': heard, 'dur': round(len(x) / 16000, 2)})
        if (i + 1) % 20 == 0:
            log(f'scanned {i + 1}/{n}')
    rows = [r for r in res.values() if r['f0'] and r['wer'] == 0 and 1.8 < r['dur'] < 5.5]
    fem = [r for r in rows if r['f0'] >= 175]
    mal = [r for r in rows if r['f0'] <= 150]
    probe_f = pick_spread(fem, 3)[1:1 + N_PROBE_F] if N_PROBE_F else []
    probe_m = pick_spread(mal, 3)[1:1 + N_PROBE_M] if N_PROBE_M else []
    pid = {r['id'] for r in probe_f + probe_m}
    train_f = pick_spread([r for r in fem if r['id'] not in pid], N_TRAIN_F)
    train_m = pick_spread([r for r in mal if r['id'] not in pid], N_TRAIN_M)
    choice = {'train': {r['id']: {'sex': 'f', 'f0': r['f0']} for r in train_f},
              'probe': {r['id']: {'sex': 'f', 'f0': r['f0']} for r in probe_f}}
    choice['train'].update({r['id']: {'sex': 'm', 'f0': r['f0']} for r in train_m})
    choice['probe'].update({r['id']: {'sex': 'm', 'f0': r['f0']} for r in probe_m})
    json.dump(choice, open(REPO / 'tools' / 'audio' / 'piper_voices.json', 'w'), indent=1, sort_keys=True)
    log(f'{len(rows)} clear of {len(res.values())}; chose {len(choice["train"])} train, {len(choice["probe"])} probe '
        f'(female {len(fem)}, male {len(mal)} candidates)')


if __name__ == '__main__':
    main(sys.argv)
