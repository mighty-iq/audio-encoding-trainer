"""Natural talkers: AudioMNIST digits (MIT; training + held-out probe talkers), CREMA-D neutral sentences
(ODbL/DbCL; probe only, held-out actors) and LibriVox read speech from the DNS-Challenge 2020 mirror (public
domain; kept only where two recognisers agree). Raw files stay in ../corpora; outputs go to db 'natural'.
Talker metadata (sex, accent label, age band) is written to tools/audio/natural_voices.json.
Usage: python3 -I tools/audio/natural.py audiomnist|cremad|librivox
"""
import json
import random
import subprocess
import sys

sys.path.insert(0, __import__('os').path.dirname(__file__))
import asr  # noqa: E402
from common import (CORPORA, REPO, SR, Log, Results, active_level_db, code_level, load_audio, mp3_decode,  # noqa: E402
                    mp3_encode, save_clip, trim, wav_path)


def shipped(x):
    """The clip as the app will decode it (MP3 round trip); every recogniser check runs on this."""
    return mp3_decode(mp3_encode(code_level(x)))

META = REPO / 'tools' / 'audio' / 'natural_voices.json'
DIGITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']

# AudioMNIST talker ids: probe talkers are held out of training (digits probe); accent labels are ours.
AM_PROBE = ['43', '56', '52', '03', '05', '10', '37', '38']    # 3 female, 5 male
AM_TRAIN = ['12', '28', '36', '26', '47', '60', '07', '09', '14', '15', '18', '19', '24', '25', '27', '32',
            '35', '41', '42', '01']
AM_ACCENT = {'german': 'German', 'german/spanish': 'German and Spanish', 'south korean': 'Korean',
             'spanish': 'Spanish', 'madras': 'South Indian', 'levant': 'Levantine Arabic', 'english': 'native English',
             'chinese': 'Chinese', 'brasilian': 'Brazilian Portuguese', 'egyptian_american?': 'Egyptian and American',
             'italian': 'Italian', 'south african': 'South African English', 'arabic': 'Arabic', 'danish': 'Danish',
             'french': 'French', 'tamil': 'Tamil'}

CREMA_SENT = {'IEO': "It's eleven o'clock.", 'TIE': 'That is exactly what happened.',
              'IOM': "I'm on my way to the meeting.", 'IWW': 'I wonder what this is about.',
              'TAI': 'The airplane is almost full.', 'MTI': 'Maybe tomorrow it will be cold.',
              'IWL': 'I would like a new alarm clock.', 'ITH': "I think I have a doctor's appointment.",
              'DFA': "Don't forget a jacket.", 'ITS': "I think I've seen this before.",
              'TSI': 'The surface is slick.', 'WSI': "We'll stop in a couple of minutes."}
CREMA_URL = 'https://media.githubusercontent.com/media/CheyneyComputerScience/CREMA-D/master/AudioWAV/'
CREMA_CANDIDATES = 14       # actors scanned; the 8 clearest (4 female, 4 male) are kept


def age_band(a):
    try:
        a = int(a)
    except (TypeError, ValueError):
        return None
    return f'{a // 10 * 10}s' if 15 < a < 100 else None


def load_meta():
    return json.load(open(META)) if META.exists() else {}


def save_meta(meta):
    json.dump(meta, open(META, 'w'), indent=1, sort_keys=True)


def audiomnist(log, res, rec, meta):
    root = CORPORA / 'audiomnist' / 'repo' / 'data'
    info = json.load(open(root / 'audioMNIST_meta.txt'))
    for spk in AM_PROBE:          # training digits are not built: no generator reads them (budget)
        probe = spk in AM_PROBE
        m = info[spk]
        vid = f's{spk}'
        meta[f'audiomnist.{vid}'] = {'sex': 'f' if m['gender'] == 'female' else 'm',
                                     'accent': f"English with a {AM_ACCENT.get(m['accent'].lower(), m['accent'])} accent"
                                     if m['accent'].lower() not in ('english', 'south african')
                                     else AM_ACCENT[m['accent'].lower()],
                                     'ageBand': age_band(m['age'])}
        digits = DIGITS if probe else DIGITS[1:]
        for d, word in enumerate(DIGITS):
            if word not in digits:
                continue
            cid = f'audiomnist.{vid}.digit.{word}'
            if res.get(cid, {}).get('ok') and wav_path(cid).exists():
                continue
            takes = list(range(50))
            random.Random(cid).shuffle(takes)
            kept = False
            for t in takes[:6]:
                x = trim(load_audio(root / spk / f'{d}_{spk}_{t}.wav'))
                heard, _ = rec.run(shipped(x))
                if asr.score(word, heard)['ok'] and 0.2 < len(x) / SR < 1.3:
                    save_clip(cid, x)
                    res.put({'id': cid, 'src': 'audiomnist', 'voice': vid, 'kind': 'digit', 'text': word,
                             'ok': True, 'heard': heard, 'take': t, 'dur': round(len(x) / SR, 3),
                             'adb': round(active_level_db(x), 2), 'pack': 'probe' if probe else 'natural',
                             'set': 'probe' if probe else 'train', 'tags': ['natural']})
                    kept = True
                    break
            if not kept:
                res.put({'id': cid, 'src': 'audiomnist', 'voice': vid, 'kind': 'digit', 'text': word, 'ok': False})
                log('DROPPED', cid)
        log(f'audiomnist {spk} done')


def fetch(url, dst):
    if dst.exists() and dst.stat().st_size > 1000:
        return True
    dst.parent.mkdir(parents=True, exist_ok=True)
    r = subprocess.run(['curl', '-sSfL', '--max-time', '120', '-o', str(dst), url], capture_output=True)
    return r.returncode == 0 and dst.exists() and dst.read_bytes()[:4] == b'RIFF'


def cremad(log, res, rec, meta):
    import csv
    root = CORPORA / 'cremad' / 'repo'
    demo = {r['ActorID']: r for r in csv.DictReader(open(root / 'VideoDemographics.csv'))}
    rng = random.Random('earshot-cremad')
    fem = sorted(a for a, r in demo.items() if r['Sex'] == 'Female')
    mal = sorted(a for a, r in demo.items() if r['Sex'] == 'Male')
    cands = rng.sample(fem, CREMA_CANDIDATES // 2) + rng.sample(mal, CREMA_CANDIDATES // 2)
    score = {}
    for a in cands:
        ok = 0
        for code, text in CREMA_SENT.items():
            cid = f'cremad.a{a}.sentence.{code.lower()}'
            r = res.get(cid)
            if r is None:
                f = CORPORA / 'cremad' / 'wav' / f'{a}_{code}_NEU_XX.wav'
                if not fetch(CREMA_URL + f.name, f):
                    log('fetch failed', f.name)
                    continue
                x = trim(load_audio(f))
                heard, _ = rec.run(shipped(x))
                sc = asr.score(text, heard)
                r = {'id': cid, 'src': 'cremad', 'voice': f'a{a}', 'kind': 'sentence', 'text': text, 'ok': sc['ok'],
                     'heard': heard, 'dur': round(len(x) / SR, 3), 'adb': round(active_level_db(x), 2),
                     'pack': 'probe', 'set': 'probe', 'item': f'crema-{code.lower()}', 'tags': ['natural']}
                if sc['ok']:
                    save_clip(cid, x)
                res.rows[cid] = r      # held back until the actor is chosen (written below)
            ok += bool(r['ok'])
        score[a] = ok
        log(f'cremad actor {a}: {ok}/12 clear')
    chosen = sorted([a for a in cands if a in fem], key=lambda a: -score[a])[:4] + \
        sorted([a for a in cands if a in mal], key=lambda a: -score[a])[:4]
    for a in cands:
        for code in CREMA_SENT:
            cid = f'cremad.a{a}.sentence.{code.lower()}'
            r = dict(res.rows.get(cid) or {'id': cid, 'ok': False})
            if a not in chosen:
                r['ok'] = False
                r['note'] = 'actor not chosen'
            res.put(r)
        if a in chosen:
            d = demo[a]
            meta[f'cremad.a{a}'] = {'sex': 'f' if d['Sex'] == 'Female' else 'm', 'accent': 'US English (actor)',
                                    'ageBand': age_band(d['Age'])}
    log('cremad chosen', chosen)


def main(argv):
    what = argv[1]
    log = Log(f'natural-{what}')
    res = Results('natural')
    rec = asr.recogniser('parakeet')
    meta = load_meta()
    if what == 'audiomnist':
        audiomnist(log, res, rec, meta)
    elif what == 'cremad':
        cremad(log, res, rec, meta)
    elif what == 'librivox':
        import natural_librivox
        natural_librivox.run(log, res, meta)
    save_meta(meta)


if __name__ == '__main__':
    main(sys.argv)
