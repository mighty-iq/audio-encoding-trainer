"""Build-time speech synthesis: Kokoro-82M (Apache-2.0) and Piper en_US-libritts-high (904 speakers,
trained from scratch on LibriTTS, CC BY 4.0 data), both run with onnxruntime. Text is phonemised with
espeak-ng through `phonemizer` at build time only; no synthesiser or phonemiser ships in the app."""
import glob
import json
import re

import numpy as np
import onnxruntime as ort

from common import CORPORA, SR, resample

THREADS = 2


def _session(path):
    so = ort.SessionOptions()
    so.intra_op_num_threads = THREADS
    so.inter_op_num_threads = 1
    return ort.InferenceSession(str(path), sess_options=so, providers=['CPUExecutionProvider'])


class KokoroTTS:
    """Kokoro with the duration output exposed (see kokoro_timed.py): real pauses after commas and
    full stops, and phoneme timings for clean word cuts."""
    src = 'kokoro'
    # espeak forms that the recogniser mishears in British voices; replaced by an equally British variant
    FIX = {'en-gb': {'wˈɒn': 'wˈʌn'}}

    def __init__(self):
        from kokoro_onnx import Kokoro
        d = CORPORA / 'kokoro'
        model = d / 'kokoro-v1.0.int8.timed.onnx'
        if not model.exists():
            model = d / 'kokoro-v1.0.int8.onnx'
        self.k = Kokoro.from_session(_session(model), str(d / 'voices-v1.0.bin'))

    def voices(self):
        return sorted(self.k.get_voices())

    def lang_for(self, voice):
        return 'en-gb' if voice.startswith('b') else 'en-us'

    def ipa(self, text, lang):
        ph = self.k.tokenizer.phonemize(text, lang)
        for a, b in self.FIX.get(lang, {}).items():
            ph = re.sub(r'(?<![^\s,.;:!?])' + re.escape(a) + r'(?![^\s,.;:!?])', b, ph)
        return ph

    def synth_timed(self, text, voice, speed=1.0, lang=None, clause=0.1, sentence=0.3):
        """(audio 16 kHz, [(start_s, end_s) per word]); pauses after commas/stops are topped up to
        `clause`/`sentence` seconds where the model already left a quiet gap."""
        lang = lang or self.lang_for(voice)
        a, sr, tm = self.k.create_timed(self.ipa(text, lang), voice=voice, speed=speed, lang=lang,
                                        is_phonemes=True, clause_pause=clause, sentence_pause=sentence)
        words, cur = [], None
        for t in tm:
            if t.phoneme in ' ,.;:!?\u2014\u2026"()':
                cur = None
                continue
            if cur is None:
                cur = [t.start, t.end]
                words.append(cur)
            else:
                cur[1] = t.end
        return resample(a, sr, SR), [tuple(w) for w in words]

    def synth(self, text, voice, speed=1.0, lang=None):
        return self.synth_timed(text, voice, speed, lang)[0]


_ESPEAK = {}


def phonemise(text, lang='en-us'):
    """espeak-ng IPA with stress marks and punctuation kept (same front end Piper voices were trained on)."""
    if lang not in _ESPEAK:
        import espeakng_loader
        from phonemizer.backend import EspeakBackend
        from phonemizer.backend.espeak.wrapper import EspeakWrapper
        EspeakWrapper.set_library(espeakng_loader.get_library_path())
        EspeakWrapper.set_data_path(espeakng_loader.get_data_path())
        _ESPEAK[lang] = EspeakBackend(lang, preserve_punctuation=True, with_stress=True,
                                      language_switch='remove-flags')
    out = _ESPEAK[lang].phonemize([text], strip=True)[0]
    return ' '.join(out.split())


class PiperTTS:
    src = 'piper-libritts'

    def __init__(self):
        d = glob.glob(str(CORPORA / 'piper-libritts-high' / 'vits-piper-*'))[0]
        self.cfg = json.load(open(f'{d}/en_US-libritts-high.onnx.json'))
        self.ids = self.cfg['phoneme_id_map']
        self.speakers = self.cfg['speaker_id_map']          # 'p<LibriTTS reader>' -> sid
        self.sess = _session(f'{d}/en_US-libritts-high.onnx')
        self.sr = self.cfg['audio']['sample_rate']
        inf = self.cfg['inference']
        self.noise_scale, self.noise_w = inf['noise_scale'], inf['noise_w']

    def voices(self):
        return sorted(self.speakers, key=lambda k: self.speakers[k])

    def to_ids(self, ipa):
        ids = list(self.ids['^'])
        for ch in ipa:
            if ch in self.ids:
                ids += self.ids[ch] + self.ids['_']
        return ids + self.ids['$']

    def synth(self, text, voice, speed=1.0, noise_scale=None, noise_w=None):
        ids = self.to_ids(phonemise(text))
        sid = self.speakers[voice] if isinstance(voice, str) else int(voice)
        scales = np.array([self.noise_scale if noise_scale is None else noise_scale, 1.0 / speed,
                           self.noise_w if noise_w is None else noise_w], dtype=np.float32)
        out = self.sess.run(None, {'input': np.array([ids], dtype=np.int64),
                                   'input_lengths': np.array([len(ids)], dtype=np.int64),
                                   'scales': scales, 'sid': np.array([sid], dtype=np.int64)})[0]
        return resample(out.reshape(-1), self.sr, SR)


_ENGINES = {}


def engine(src):
    if src not in _ENGINES:
        _ENGINES[src] = KokoroTTS() if src == 'kokoro' else PiperTTS()
    return _ENGINES[src]
