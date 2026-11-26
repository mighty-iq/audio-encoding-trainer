"""Independent level measurement for the audio e2e tests (NumPy). ITU-T P.56 method B style active level, written
separately from js/audio/dsp/core.js (sorted envelope instead of a histogram) so the two cross-check each other.
Levels are 10*log10(mean square) re 1.0, averaged over channels. MIT licence."""
import base64

import numpy as np
from scipy.ndimage import maximum_filter1d
from scipy.signal import lfilter


def f32(b64):
    return np.frombuffer(base64.b64decode(b64), dtype='<f4').astype(np.float64)


def chans(x):
    x = np.asarray(x, dtype=np.float64)
    return x[None, :] if x.ndim == 1 else x


def rms_db(x, a=None, b=None):
    x = chans(x)[:, a:b]
    ms = np.mean(x ** 2)
    return 10 * np.log10(ms) if ms > 0 else -200.0


def active_db(x, sr, tc=0.03, hang=0.2, margin=15.9):
    x = chans(x)
    p = np.mean(x ** 2, axis=0)
    E, n = p.sum(), p.size
    if E <= 0:
        return -200.0
    g = np.exp(-1 / (tc * sr))
    env = lfilter([1 - g], [1, -g], lfilter([1 - g], [1, -g], np.sqrt(p)))
    H = max(1, int(round(hang * sr)))
    m = maximum_filter1d(env, size=H, origin=(H - 1) // 2, mode='constant', cval=0.0)  # trailing window [i-H+1, i]
    ms = np.sort(m[m > 1e-9])
    if not ms.size:
        return -200.0
    top = 20 * np.log10(ms[-1])
    prev = None
    for cdb in np.arange(top - 120, top + 0.001, 0.02):
        A = ms.size - np.searchsorted(ms, 10 ** (cdb / 20), side='left')
        if A <= 0:
            break
        L = 10 * np.log10(E / A)
        d = L - cdb
        if d <= margin:
            if prev is None:
                return L
            t = (prev[0] - margin) / (prev[0] - d)
            return prev[1] + t * (L - prev[1])
        prev = (d, L)
    return 10 * np.log10(E / n)


def energy(x):
    return float(np.mean(np.sum(chans(x) ** 2, axis=1)))
