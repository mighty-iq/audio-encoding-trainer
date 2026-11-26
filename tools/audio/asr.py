"""Build-time speech recognition used to verify every clip (sherpa-onnx, Apache-2.0).
Primary: NVIDIA Parakeet TDT 0.6B v2 (int8). Second opinion: Whisper base.en (for natural read speech)."""
import glob

import numpy as np

import lexicon
from common import CORPORA, SR, norm_words

PAD = 0.25


class Recogniser:
    def __init__(self, kind='parakeet', threads=2):
        import sherpa_onnx
        self.kind = kind
        if kind == 'parakeet':
            d = glob.glob(str(CORPORA / 'asr-parakeet' / 'sherpa-onnx-nemo-parakeet*'))[0]
            self.rec = sherpa_onnx.OfflineRecognizer.from_transducer(
                encoder=f'{d}/encoder.int8.onnx', decoder=f'{d}/decoder.int8.onnx', joiner=f'{d}/joiner.int8.onnx',
                tokens=f'{d}/tokens.txt', num_threads=threads, model_type='nemo_transducer')
        else:
            d = glob.glob(str(CORPORA / 'asr-whisper' / 'sherpa-onnx-whisper-base.en'))[0]
            self.rec = sherpa_onnx.OfflineRecognizer.from_whisper(
                encoder=f'{d}/base.en-encoder.int8.onnx', decoder=f'{d}/base.en-decoder.int8.onnx',
                tokens=f'{d}/base.en-tokens.txt', num_threads=threads, language='en', task='transcribe')

    def run(self, x, pad=PAD):
        z = np.zeros(int(pad * SR), dtype=np.float32)
        y = np.concatenate([z, np.asarray(x, dtype=np.float32), z])
        st = self.rec.create_stream()
        st.accept_waveform(SR, y)
        self.rec.decode_stream(st)
        r = st.result
        words = []
        toks = list(getattr(r, 'tokens', []) or [])
        ts = list(getattr(r, 'timestamps', []) or [])
        if toks and len(ts) == len(toks):
            for tok, t in zip(toks, ts):
                if tok.startswith(' ') or not words:
                    words.append([tok.strip(), t - pad])
                else:
                    words[-1][0] += tok
        return r.text.strip(), [(w, t) for w, t in words if norm_words(w)]


def align(expected, heard):
    """Word-level edit alignment; a word matches when it is the same spoken word (alias or homophone)."""
    e, h = expected, heard
    n, m = len(e), len(h)
    d = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        d[i][0] = i
    for j in range(m + 1):
        d[0][j] = j
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            c = 0 if lexicon.same_word(e[i - 1], h[j - 1]) else 1
            d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c)
    # backtrack for the list of errors
    i, j, errs = n, m, []
    while i > 0 or j > 0:
        if i > 0 and j > 0 and d[i][j] == d[i - 1][j - 1] + (0 if lexicon.same_word(e[i - 1], h[j - 1]) else 1):
            if not lexicon.same_word(e[i - 1], h[j - 1]):
                errs.append(f'{e[i - 1]}>{h[j - 1]}')
            i, j = i - 1, j - 1
        elif i > 0 and d[i][j] == d[i - 1][j] + 1:
            errs.append(f'-{e[i - 1]}')
            i -= 1
        else:
            errs.append(f'+{h[j - 1]}')
            j -= 1
    return d[n][m], list(reversed(errs))


def _joinable(expected, heard):
    """ASR sometimes writes two words as one ("pancake") or one as two; accept when the letters agree."""
    return ''.join(expected) == ''.join(heard)


def score(expected_text, heard_text, keywords=None):
    """{ok, wer, errs, kw_ok}: ok when no word differs; keywords (if given) must all be heard. A possessive the
    recogniser adds to a word ("Tyler's bee" for "Tyler, bee") counts as the plain word."""
    e = norm_words(expected_text)
    h = [w[:-2] if w.endswith("'s") and w[:-2] in e and w not in e else w for w in norm_words(heard_text)]
    dist, errs = align(e, h)
    if dist and _joinable(e, h):
        dist, errs = 0, []
    wer = dist / max(1, len(e))
    kw_ok = True
    if keywords:
        hs = set(lexicon.canon(w) for w in h)
        for k in keywords:
            if not any(lexicon.same_word(k, w) for w in hs):
                kw_ok = False
    return {'ok': dist == 0, 'wer': round(wer, 3), 'errs': errs[:6], 'kw_ok': kw_ok}


_REC = {}


def recogniser(kind='parakeet'):
    if kind not in _REC:
        _REC[kind] = Recogniser(kind)
    return _REC[kind]
