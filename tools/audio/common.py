"""Shared helpers for the Earshot stimulus pipeline (build time only; nothing here ships).

Paths are relative to the repository: raw corpora sit in ../corpora and scratch renders in ../stimwork
(override with EARSHOT_CORPORA / EARSHOT_WORK). Audio inside the pipeline is float32 mono at 16 kHz.
"""
import datetime
import json
import math
import os
import pathlib
import re
import subprocess
import time

import numpy as np
import soundfile as sf
from scipy.signal import lfilter, resample_poly

REPO = pathlib.Path(__file__).resolve().parents[2]
CORPORA = pathlib.Path(os.environ.get('EARSHOT_CORPORA', REPO.parent / 'corpora'))
WORK = pathlib.Path(os.environ.get('EARSHOT_WORK', REPO.parent / 'stimwork'))
STAGE = WORK / 'stage'        # pack.py and registry.py write here; validate.py --publish copies to REPO
SR = 16000
MP3_KBPS = 24


def utc_now():
    return datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M UTC')


class Log:
    """Append-only text log under WORK/logs, one line per event, UTC times."""

    def __init__(self, name):
        (WORK / 'logs').mkdir(parents=True, exist_ok=True)
        self.path = WORK / 'logs' / f'{name}.log'

    def __call__(self, *parts):
        line = f"{utc_now()} {' '.join(str(p) for p in parts)}"
        print(line, flush=True)
        with open(self.path, 'a') as f:
            f.write(line + '\n')


class Results:
    """Resumable record store: one JSON object per line, keyed by 'id'; the last line for an id wins."""

    def __init__(self, name):
        (WORK / 'db').mkdir(parents=True, exist_ok=True)
        self.path = WORK / 'db' / f'{name}.jsonl'
        self.rows = {}
        if self.path.exists():
            for line in self.path.read_text().splitlines():
                if line.strip():
                    r = json.loads(line)
                    self.rows[r['id']] = r

    def __contains__(self, key):
        return key in self.rows

    def get(self, key, default=None):
        return self.rows.get(key, default)

    def put(self, row):
        self.rows[row['id']] = row
        with open(self.path, 'a') as f:
            f.write(json.dumps(row, ensure_ascii=True) + '\n')

    def values(self):
        return list(self.rows.values())


# ---------------------------------------------------------------- audio basics

def resample(x, sr_in, sr_out=SR):
    if sr_in == sr_out:
        return np.asarray(x, dtype=np.float32)
    g = math.gcd(int(sr_in), int(sr_out))
    return resample_poly(np.asarray(x, dtype=np.float64), sr_out // g, sr_in // g).astype(np.float32)


def load_audio(path, sr=SR):
    x, s = sf.read(str(path), dtype='float32', always_2d=True)
    return resample(x.mean(axis=1), s, sr)


def wav_path(clip_id):
    return WORK / 'wav' / f'{clip_id}.wav'


def save_clip(clip_id, x):
    p = wav_path(clip_id)
    p.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(p), np.clip(x, -1, 1), SR, subtype='FLOAT')
    return p


def db(x):
    return 20 * math.log10(max(float(x), 1e-12))


def rms_db(x):
    return db(math.sqrt(float(np.mean(np.square(x, dtype=np.float64)))) if len(x) else 0.0)


def env_db(x, sr=SR, win=0.02, hop=0.005):
    """Short-time RMS level in dB on a hop grid (frame i centred at i*hop + win/2)."""
    w, h = int(win * sr), int(hop * sr)
    if len(x) < w:
        return np.array([rms_db(x)])
    c = np.concatenate([[0.0], np.cumsum(np.square(x, dtype=np.float64))])
    starts = np.arange(0, len(x) - w + 1, h)
    e = (c[starts + w] - c[starts]) / w
    return 10 * np.log10(np.maximum(e, 1e-12))


def active_level_db(x, sr=SR):
    """Active speech level in dBFS after ITU-T P.56 method B: envelope from two cascaded one-pole
    smoothers (time constant 30 ms) of |x|, hangover 200 ms, margin 15.9 dB, thresholds on a 0.5 dB grid,
    linear interpolation where (long-term level over active samples - threshold) crosses the margin."""
    x = np.asarray(x, dtype=np.float64)
    if len(x) < sr * 0.05:
        return rms_db(x)
    g = math.exp(-1.0 / (sr * 0.03))
    q = lfilter([1 - g], [1, -g], lfilter([1 - g], [1, -g], np.abs(x)))
    hang = int(0.2 * sr)
    energy = float(np.sum(x * x))
    if energy <= 0:
        return -120.0
    levels = np.arange(-100.0, 0.25, 0.5)
    prev = None
    for c_db in levels:
        above = (q >= 10 ** (c_db / 20)).astype(np.int32)
        if not above.any():
            break
        cs = np.concatenate([[0], np.cumsum(above)])
        idx = np.arange(1, len(x) + 1)
        active = (cs[idx] - cs[np.maximum(idx - hang, 0)]) > 0
        n_act = int(active.sum())
        a_db = 10 * math.log10(energy / n_act)
        diff = a_db - c_db
        if diff <= 15.9:
            if prev is None:
                return a_db
            (pa, pd) = prev
            t = (pd - 15.9) / (pd - diff) if pd != diff else 0.0
            return pa + t * (a_db - pa)
        prev = (a_db, diff)
    return prev[0] if prev else rms_db(x)


def fade(x, sr=SR, ms_in=5.0, ms_out=5.0):
    x = np.array(x, dtype=np.float32)
    for n, sl in ((int(sr * ms_in / 1000), slice(None)), (int(sr * ms_out / 1000), slice(None, None, -1))):
        n = min(n, len(x) // 2)
        if n > 0:
            ramp = (0.5 - 0.5 * np.cos(np.linspace(0, math.pi, n))).astype(np.float32)
            x[sl][:n] *= ramp
    return x


def speech_bounds(x, sr=SR, rel_db=-42.0, min_run=0.03):
    """First and last sample of speech: frames within rel_db of the loudest frame, ignoring
    isolated blips shorter than min_run."""
    e = env_db(x, sr, win=0.01, hop=0.0025)
    on = e > (e.max() + rel_db)
    hop = int(0.0025 * sr)
    need = max(1, int(min_run / 0.0025))
    idx = np.flatnonzero(on)
    if len(idx) == 0:
        return 0, len(x)
    # drop leading/trailing runs that are too short to be speech
    runs, start = [], idx[0]
    for a, b in zip(idx[:-1], idx[1:]):
        if b != a + 1:
            runs.append((start, a))
            start = b
    runs.append((start, idx[-1]))
    good = [r for r in runs if r[1] - r[0] + 1 >= need] or runs
    s = good[0][0] * hop
    e_ = min(len(x), good[-1][1] * hop + int(0.01 * sr))
    return s, e_


def trim(x, sr=SR, pad=0.03, rel_db=-42.0):
    """Trim silence to `pad` seconds each side, with short fades at the new edges."""
    s, e = speech_bounds(x, sr, rel_db)
    p = int(pad * sr)
    y = np.asarray(x[max(0, s - p):min(len(x), e + p)], dtype=np.float32)
    return fade(y, sr, 3.0, 8.0)


def peak_normalise(x, peak_db=-1.0):
    m = float(np.max(np.abs(x))) if len(x) else 0.0
    return x if m <= 0 else (x * (10 ** (peak_db / 20) / m)).astype(np.float32)


# ---------------------------------------------------------------- MP3 (ffmpeg / libmp3lame)

MP3_VERSION = 'v3'      # bump when the encoder settings change (invalidates cached MP3s)
CODE_LEVEL = -24.0      # active level (dBFS) every clip is scaled to before encoding


def code_level(x, kind='speech'):
    """Scale a clip to CODE_LEVEL active level (beds: RMS) with the peak kept at or below -1 dBFS, so quiet
    recordings are not thinned by the encoder's absolute-threshold model; levels are re-measured after decoding."""
    x = np.asarray(x, dtype=np.float32)
    lv = rms_db(x) if kind == 'bed' else active_level_db(x)
    g = 10 ** ((CODE_LEVEL - lv) / 20)
    pk = float(np.max(np.abs(x))) * g if len(x) else 0.0
    if pk > 10 ** (-1 / 20):
        g *= 10 ** (-1 / 20) / pk
    return (x * g).astype(np.float32)


def mp3_encode(x, kbps=MP3_KBPS):
    """16 kHz mono CBR MP3 with an Info frame carrying the LAME gapless fields (encoder delay and padding),
    so decoders return exactly the original samples; no ID3 tags, no metadata. ffmpeg can write the Info
    frame only to a seekable file, hence the temporary files."""
    import tempfile
    with tempfile.TemporaryDirectory() as td:
        src, dst = pathlib.Path(td) / 'x.f32', pathlib.Path(td) / 'x.mp3'
        src.write_bytes(np.asarray(x, dtype='<f4').tobytes())
        cmd = ['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1',
               '-i', str(src), '-c:a', 'libmp3lame', '-b:a', f'{kbps}k', '-ar', str(SR), '-ac', '1',
               '-map_metadata', '-1', '-id3v2_version', '0', '-write_id3v1', '0', '-write_xing', '1', str(dst)]
        subprocess.run(cmd, capture_output=True, check=True)
        return dst.read_bytes()


def mp3_decode(data):
    cmd = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-f', 'mp3', '-i', '-', '-f', 'f32le', '-ac', '1',
           '-ar', str(SR), '-']
    r = subprocess.run(cmd, input=data, capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype='<f4').copy()


# ---------------------------------------------------------------- text

ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven',
        'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
ORD = {'1st': 'first', '2nd': 'second', '3rd': 'third', '4th': 'fourth', '5th': 'fifth', '6th': 'sixth',
       '7th': 'seventh', '8th': 'eighth', '9th': 'ninth', '10th': 'tenth', '11th': 'eleventh',
       '12th': 'twelfth', '13th': 'thirteenth', '14th': 'fourteenth', '15th': 'fifteenth',
       '20th': 'twentieth', '21st': 'twenty first', '30th': 'thirtieth'}


def num_words(n):
    n = int(n)
    if n < 20:
        return ONES[n]
    if n < 100:
        return TENS[n // 10] + ('' if n % 10 == 0 else ' ' + ONES[n % 10])
    if n < 1000:
        rest = n % 100
        return ONES[n // 100] + ' hundred' + ('' if rest == 0 else ' ' + num_words(rest))
    if n < 10000 and n % 100 == 0 and n % 1000 != 0:
        return num_words(n // 100) + ' hundred'
    if n < 1000000:
        rest = n % 1000
        return num_words(n // 1000) + ' thousand' + ('' if rest == 0 else ' ' + num_words(rest))
    return ' '.join(ONES[int(d)] for d in str(n))


def _digits_to_words(m):
    s = m.group(0)
    if s in ORD:
        return ' ' + ORD[s] + ' '
    if ':' in s:
        h, mi = s.split(':')
        return ' ' + num_words(h) + ' ' + ('' if mi == '00' else ('oh ' + ONES[int(mi)] if mi[0] == '0' else num_words(mi))) + ' '
    if re.fullmatch(r'\d+(st|nd|rd|th)', s):
        return ' ' + num_words(re.sub(r'\D', '', s)) + ' '
    if len(s) == 4 and 1100 <= int(s) <= 2099:   # read as a year or a door number: "nineteen eighty"
        a, b = int(s[:2]), int(s[2:])
        return ' ' + num_words(a) + ' ' + ('hundred' if b == 0 else ('oh ' + ONES[b] if b < 10 else num_words(b))) + ' '
    return ' ' + num_words(s) + ' '


ROMAN = {'ii': 'two', 'iii': 'three', 'iv': 'four', 'v': 'five', 'vi': 'six', 'vii': 'seven',
         'viii': 'eight', 'ix': 'nine', 'x': 'ten'}


def norm_words(text):
    """Lower-case word list for comparison: digits spelled out, punctuation dropped, hyphens split."""
    t = text.lower().replace('’', "'").replace('—', ' ').replace('-', ' ')
    t = re.sub(r'(\d),(\d{3})', r'\1\2', t)
    t = re.sub(r'\d+:\d\d|\d+(?:st|nd|rd|th)\b|\d+', _digits_to_words, t)
    t = t.replace('%', ' percent ').replace('&', ' and ')
    t = re.sub(r"[^a-z' ]+", ' ', t)
    words = [ROMAN.get(w, w) for w in (w.strip("'") for w in t.split())]
    return [w for w in words if w]


def slug(text, maxlen=32):
    s = re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')
    return s[:maxlen].rstrip('-') or 'x'


def write_js(path, prefix, obj):
    """Write `prefix = <json>;` as a classic script (ASCII only; stable key order)."""
    path = pathlib.Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    body = json.dumps(obj, ensure_ascii=True, separators=(',', ':'), sort_keys=False)
    path.write_text(f'// Generated by tools/audio — do not edit by hand.\n{prefix} = {body};\n')
    return path.stat().st_size


def timer():
    t0 = time.time()
    return lambda: round(time.time() - t0, 2)
