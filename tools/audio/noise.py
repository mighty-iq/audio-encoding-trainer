"""Background beds: loopable ambiences cut from MS-SNSD (DEMAND scenes, CC BY-SA 3.0; Freesound clips, CC0)
and a party bed made here (a synthetic club beat under CC0 crowd babble). Each bed is a seamless loop (the
tail is cross-faded into the head), normalised to -24 dBFS RMS; the manifest `adb` of a bed holds its RMS
level and `bed` its category (babble, cafe, party, street, station, hall, hum). One café bed from a scene
never used in training is kept for the Story probe (set 'probe').
Usage: python3 -I tools/audio/noise.py
"""
import math
import sys

import numpy as np

sys.path.insert(0, __import__('os').path.dirname(__file__))
from common import CORPORA, SR, Log, Results, load_audio, rms_db, save_clip, wav_path  # noqa: E402

LOOP_S, XFADE_S, LEVEL = 10.0, 0.5, -24.0
# bed id -> (MS-SNSD file, pseudo-voice, preferred start s, category, set). DEMAND scene names: Cafe = SCAFE,
# CafeTeria = PCAFETER, Restaurant = PRESTO, Station = PSTATION, Square = SPSQUARE, Traffic = STRAFFIC, Metro = TMETRO.
SCENES = {
    'cafe': ('Cafe_1', 'demand', 40.0, 'cafe', 'train'),
    'hall': ('CafeTeria_1', 'demand', 60.0, 'hall', 'train'),
    'street': ('Traffic_1', 'demand', 70.0, 'street', 'train'),
    'square': ('Square_1', 'demand', 20.0, 'street', 'train'),
    'station': ('Station_1', 'demand', 50.0, 'station', 'train'),
    'metro': ('Metro_1', 'demand', 25.0, 'station', 'train'),
    'babble': ('Babble_1', 'freesound', 0.0, 'babble', 'train'),
    'hum': ('AirConditioner_1', 'freesound', 2.0, 'hum', 'train'),
    'cafe-probe': ('Restaurant_1', 'demandprobe', 100.0, 'cafe', 'probe'),
}


def evenness(x):
    """Spread of 0.5-s RMS levels (dB); lower = steadier bed."""
    n = SR // 2
    lv = [rms_db(x[i:i + n]) for i in range(0, len(x) - n, n)]
    return float(np.std(lv))


def best_start(x, want, length):
    """Steadiest window near the preferred start (search +-30 s in 5-s steps)."""
    n = int(length * SR)
    cands = []
    for s in np.arange(max(0.0, want - 30), want + 31, 5.0):
        a = int(s * SR)
        if a + n <= len(x):
            cands.append((evenness(x[a:a + n]), a))
    return min(cands)[1] if cands else 0


def make_loop(x):
    n, f = int(LOOP_S * SR), int(XFADE_S * SR)
    seg = x[:n + f].astype(np.float64)
    ramp = 0.5 - 0.5 * np.cos(np.linspace(0, math.pi, f))
    head = seg[:f] * ramp + seg[n:n + f] * (1 - ramp)    # tail fades into the head
    y = np.concatenate([head, seg[f:n]])
    return (y * 10 ** ((LEVEL - rms_db(y)) / 20)).astype(np.float32)


def club_beat(seed=7):
    """Four-on-the-floor kick, off-beat hats and a simple bass line at 124 bpm (synthesised, original)."""
    rng = np.random.default_rng(seed)
    n = int(LOOP_S * SR)
    beat = 60.0 / 124
    y = np.zeros(n)
    t = np.arange(int(0.35 * SR)) / SR
    kick = np.sin(2 * math.pi * (50 + 90 * np.exp(-t * 30)) * t) * np.exp(-t * 9)
    th = np.arange(int(0.06 * SR)) / SR
    hat = rng.standard_normal(len(th)) * np.exp(-th * 70)
    hat = np.diff(np.concatenate([[0], hat]))                  # crude high-pass
    bass_notes = [55.0, 55.0, 65.4, 49.0]
    k = 0
    pos = 0.0
    while pos < LOOP_S:
        i = int(pos * SR)
        y[i:i + len(kick)] += kick[:max(0, min(len(kick), n - i))]
        j = int((pos + beat / 2) * SR)
        if j < n:
            y[j:j + len(hat)] += 0.25 * hat[:max(0, min(len(hat), n - j))]
        f0 = bass_notes[(k // 4) % 4]
        tb = np.arange(int(beat * 0.45 * SR)) / SR
        bass = 0.35 * np.sign(np.sin(2 * math.pi * f0 * tb)) * np.exp(-tb * 4)
        jb = int((pos + beat / 2) * SR)
        if jb < n:
            y[jb:jb + len(bass)] += bass[:max(0, min(len(bass), n - jb))]
        pos += beat
        k += 1
    # light low-pass of the square bass by a moving average
    y = np.convolve(y, np.ones(4) / 4, 'same')
    return (y * 10 ** ((LEVEL - rms_db(y)) / 20)).astype(np.float32)


def put(res, cid, src, vid, bed, cat, set_, y, log, source=''):
    save_clip(cid, y)
    res.put({'id': cid, 'src': src, 'voice': vid, 'kind': 'bed', 'text': bed, 'words': [], 'ok': True,
             'bed': cat, 'dur': round(len(y) / SR, 3), 'adb': round(rms_db(y), 2),
             'pack': 'probe' if set_ == 'probe' else 'beds', 'set': set_, 'tags': ['loop', cat], 'source': source})
    log(f'bed {bed} ({cat}, {set_}): {source} evenness {evenness(y):.2f} dB')


def main():
    log = Log('beds')
    res = Results('beds')
    for bed, (fname, vid, start, cat, set_) in SCENES.items():
        cid = f'ms-snsd.{vid}.bed.{bed}'
        if res.get(cid, {}).get('ok') and wav_path(cid).exists():
            continue
        src = CORPORA / 'ms-snsd' / 'wav' / f'{fname}.wav'
        if not src.exists():
            log('missing', src.name)
            continue
        x = load_audio(src)
        a = best_start(x, start, LOOP_S + XFADE_S)
        put(res, cid, 'ms-snsd', vid, bed, cat, set_, make_loop(x[a:]), log, f'{fname}.wav @ {a / SR:.1f} s')
    cid = 'synth.earshot.bed.party'
    if not (res.get(cid, {}).get('ok') and wav_path(cid).exists()):
        beat = club_beat()
        crowd = load_audio(CORPORA / 'ms-snsd' / 'wav' / 'Babble_2.wav')
        crowd = make_loop(crowd[best_start(crowd, 0.0, LOOP_S + XFADE_S):])
        y = beat + crowd * 10 ** (-2 / 20)
        y = (y * 10 ** ((LEVEL - rms_db(y)) / 20)).astype(np.float32)
        put(res, cid, 'synth', 'earshot', 'party', 'party', 'train', y, log, 'club beat (generated) + Babble_2.wav')


if __name__ == '__main__':
    main()
