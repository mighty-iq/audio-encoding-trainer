"""The asset plan: which voices exist, which set they belong to (train/probe) and which tokens each renders.
Deterministic (fixed seeds), so a rebuild produces the same plan. Generated data never hand-edited."""
import json
import pathlib
import random

import content_words as cw

KOKORO_LICENCE = 'Kokoro-82M weights, Apache-2.0'
PIPER_LICENCE = 'Piper en_US-libritts-high voice (LibriTTS data, CC BY 4.0)'

# Kokoro English voices: (id, sex, accent). Grades from the model's voice list decide the starter order.
KOKORO_EN = [
    ('af_heart', 'f', 'US'), ('af_bella', 'f', 'US'), ('af_nicole', 'f', 'US'), ('af_sarah', 'f', 'US'),
    ('am_michael', 'm', 'US'), ('am_fenrir', 'm', 'US'), ('am_puck', 'm', 'US'), ('am_eric', 'm', 'US'),
    ('bf_emma', 'f', 'UK'), ('bf_isabella', 'f', 'UK'), ('bm_george', 'm', 'UK'), ('bm_fable', 'm', 'UK'),
    # second wave (train)
    ('af_aoede', 'f', 'US'), ('af_alloy', 'f', 'US'), ('af_nova', 'f', 'US'), ('af_sky', 'f', 'US'),
    ('am_liam', 'm', 'US'), ('am_onyx', 'm', 'US'), ('am_echo', 'm', 'US'), ('bf_alice', 'f', 'UK'),
    ('bf_lily', 'f', 'UK'), ('bm_daniel', 'm', 'UK'),
    # held out for probes (never in training packs)
    ('af_kore', 'f', 'US'), ('bm_lewis', 'm', 'UK'), ('af_river', 'f', 'US'), ('af_jessica', 'f', 'US'),
]
STARTER = [v for v, _, _ in KOKORO_EN[:12]]
WAVE2_KOKORO = [v for v, _, _ in KOKORO_EN[12:22]]
PROBE_KOKORO = ['af_kore', 'bm_lewis']          # matrix + story probes
PROBE_KOKORO_SPARE = ['af_river', 'af_jessica']  # spare probe voices (new-voice probe)
PROBE_ALL = set(PROBE_KOKORO + PROBE_KOKORO_SPARE)  # grows as probe talkers are chosen (see below)

# Kokoro voices of other languages reading English (accent variety for Strange voices); kept only if
# ASR accuracy stays high on their renders. Accent labels describe the voice model, not a person.
KOKORO_ACCENT = [
    ('hf_alpha', 'f', 'Hindi'), ('hf_beta', 'f', 'Hindi'), ('hm_omega', 'm', 'Hindi'), ('hm_psi', 'm', 'Hindi'),
    ('ef_dora', 'f', 'Spanish'), ('em_alex', 'm', 'Spanish'), ('ff_siwis', 'f', 'French'),
    ('if_sara', 'f', 'Italian'), ('im_nicola', 'm', 'Italian'), ('pf_dora', 'f', 'Portuguese'),
    ('pm_alex', 'm', 'Portuguese'), ('jf_alpha', 'f', 'Japanese'), ('jm_kumo', 'm', 'Japanese'),
    ('zf_xiaobei', 'f', 'Mandarin'), ('zm_yunjian', 'm', 'Mandarin'), ('zf_xiaoni', 'f', 'Mandarin'),
    ('zm_yunxi', 'm', 'Mandarin'),
]


def _rot(items, n, k, offset):
    return [items[(offset + i) % len(items)] for i in range(k)] if n else []


def word_tokens(voices, n_names, n_nouns, n_numbers=9, seed='earshot-words'):
    """Spread names and nouns over voices so each token appears in about the same number of voices."""
    rng = random.Random(seed)
    names = cw.NAMES[:]
    nouns = cw.NOUNS[:]
    rng.shuffle(names)
    rng.shuffle(nouns)
    nums = cw.NUMBERS[:]
    out = {}
    for i, v in enumerate(voices):
        out[v] = {
            'name': _rot(names, 1, n_names, i * n_names),
            'word': _rot(nouns, 1, n_nouns, i * n_nouns),
            'number': nums[:n_numbers] if n_numbers >= 9 else _rot(nums, 1, n_numbers, i * n_numbers),
        }
    return out



# ---------------------------------------------------------------- build inputs written by the scans

_HERE = pathlib.Path(__file__).resolve().parent


def _load(name):
    p = _HERE / name
    return json.load(open(p)) if p.exists() else {}


_PIPER = _load('piper_voices.json')                 # scan_piper.py: {'train': {pid: {sex, f0}}, 'probe': {...}}
PIPER_TRAIN = sorted(_PIPER.get('train', {}), key=lambda k: (_PIPER['train'][k]['sex'], _PIPER['train'][k]['f0']))
PIPER_PROBE = sorted(_PIPER.get('probe', {}))
PIPER_VOICES = {**_PIPER.get('train', {}), **_PIPER.get('probe', {})}
NATURAL_VOICES = _load('natural_voices.json')       # natural.py: {'<src>.<id>': {sex, accent, ageBand}}
_ACC = _load('accent_voices.json')                  # scan_accent.py
ACCENT_KEPT = [v for v, _, _ in KOKORO_ACCENT if _ACC.get(v, {}).get('keep')]
PROBE_ALL |= set(PIPER_PROBE)


def cast_voices():
    """The ~40 named cast voices (all training voices): starter, second-wave Kokoro, accented Kokoro, Piper."""
    acc = {v: (s, a) for v, s, a in KOKORO_ACCENT}
    en = {v: (s, a) for v, s, a in KOKORO_EN}
    out = [(f'kokoro.{v}', en[v][0], en[v][1]) for v in STARTER + WAVE2_KOKORO]
    out += [(f'kokoro.{v}', acc[v][0], acc[v][1]) for v in ACCENT_KEPT[:10]]
    pf = [v for v in PIPER_TRAIN if PIPER_VOICES[v]['sex'] == 'f']
    pm = [v for v in PIPER_TRAIN if PIPER_VOICES[v]['sex'] == 'm']
    for f, m in zip(pf[::4], pm[::4]):
        out += [(f'piper-libritts.{f}', 'f', 'US'), (f'piper-libritts.{m}', 'm', 'US')]
    return out


def cast():
    import content_cast
    return content_cast.assign(cast_voices())
