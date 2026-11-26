"""Encode verified clips as MP3 (16 kHz mono, 24 kbps CBR), measure them as the browser will decode them,
and write audio/pack-<name>.js, data/manifest.js and data/packs.js.

Every row of the render databases (../stimwork/db/*.jsonl) with ok=True becomes one clip. A row carries
its pack and set, or they follow from its voice (word tokens). MP3 bytes are cached by WAV content hash.
Usage: python3 -I tools/audio/pack.py [--asr]   (--asr re-checks every decoded MP3 with the recogniser)
"""
import base64
import hashlib
import json
import sys

sys.path.insert(0, __import__('os').path.dirname(__file__))
import plan as P  # noqa: E402
from common import (MP3_VERSION, SR, STAGE, WORK, Log, Results, active_level_db, code_level, load_audio,  # noqa: E402
                    mp3_decode, mp3_encode, norm_words, rms_db, utc_now, wav_path, write_js)

DBS = ['words', 'sentences', 'natural', 'beds']
MANIFEST_VERSION = 1
BUDGET = 8.5e6

# which exercises read which pack (for data/packs.js; the app decides what to load)
PACK_EXERCISES = {
    'starter': ['crowd', 'far', 'seek', 'voices'],
    'words2': ['crowd', 'far', 'seek', 'voices', 'strange'],
    'natural': ['strange', 'crowd', 'voices'],
    'strange': ['strange'],
    'repair': ['repair'],
    'echo': ['echo'],
    'cast': ['voices', 'game'],
    'babble': ['crowd', 'echo', 'repair', 'far', 'seek'],
    'beds': ['crowd', 'echo', 'far', 'seek', 'repair', 'strange', 'voices'],
    'far': ['far'],
    'probe': ['lab'],
}


def word_pack(row):
    v = row['voice']
    if v in P.PROBE_ALL:
        return 'probe'
    return 'starter' if (row['src'] == 'kokoro' and v in P.STARTER) else 'words2'


def rows():
    out = []
    for name in DBS:
        if (WORK / 'db' / f'{name}.jsonl').exists():
            for r in Results(name).values():
                if r.get('ok') and r.get('pack') != 'none' and wav_path(r['id']).exists():
                    r = dict(r, _db=name)
                    if name == 'words':
                        r.setdefault('pack', word_pack(r))
                        r.setdefault('set', 'probe' if r['voice'] in P.PROBE_ALL else 'train')
                    out.append(r)
    if (WORK / 'db' / 'intel.jsonl').exists():          # difficulty offsets from intel.py (matrix words)
        intel = Results('intel')
        for r in out:
            d = intel.get(r['id'], {}).get('diff')
            if d is not None:
                r['diff'] = d
    return sorted(out, key=lambda r: r['id'])


def wav_hash(cid):
    return MP3_VERSION + hashlib.sha256(wav_path(cid).read_bytes()).hexdigest()[:14]


def encode(cid, cache, kind='speech'):
    """(mp3 bytes, decoded float audio) for a clip; cached under ../stimwork/mp3 by WAV hash."""
    h = wav_hash(cid)
    mp = WORK / 'mp3' / f'{cid}.{h}.mp3'
    if mp.exists():
        data = mp.read_bytes()
    else:
        mp.parent.mkdir(parents=True, exist_ok=True)
        for old in mp.parent.glob(f'{cid}.*.mp3'):
            old.unlink()
        data = mp3_encode(code_level(load_audio(wav_path(cid)), kind))
        mp.write_bytes(data)
    key = f'{cid}.{h}'
    if key in cache:
        return data, None, cache[key]
    y = mp3_decode(data)
    return data, y, None


def main(argv):
    log = Log('pack')
    check_asr = '--asr' in argv
    meas = Results('mp3meas')           # measurements of decoded MP3s, keyed by clip id + wav hash
    cache = {r['id']: r for r in meas.values()}
    rec = None
    packs, manifest, stats, rejects = {}, {}, {}, []
    for r in rows():
        cid = r['id']
        data, y, m = encode(cid, cache, 'bed' if r['kind'] == 'bed' else 'speech')
        key = f'{cid}.{wav_hash(cid)}'
        rule = 'closed' if ('matrix' in (r.get('tags') or []) and r['kind'] == 'word') else 'open'
        if m is not None and rule == 'closed' and m.get('rule') != 'closed':
            m = None                  # measured before matrix words had their closed-set rule: check again
        if m is None or (check_asr and 'asr' not in m):
            if y is None:
                y = mp3_decode(data)
            m = {'id': key, 'dur': round(len(y) / SR, 3),
                 'adb': round(rms_db(y) if r['kind'] == 'bed' else active_level_db(y), 2)}
            if check_asr and r['kind'] not in ('bed', 'rir'):
                import asr
                rec = rec or asr.recogniser('parakeet')
                heard, _ = rec.run(y)
                sc = asr.score(r.get('asr_text', r['text']), heard, r.get('keywords'))
                ok = sc['ok'] or (r.get('wer_max', 0) >= sc['wer'] and sc['kw_ok'])
                if 'matrix' in (r.get('tags') or []) and r['kind'] == 'word':
                    import cut_matrix          # the probe is closed-set: same rule as when the word was cut
                    ok = cut_matrix.closed_ok(r['text'], heard)
                m.update({'asr': bool(ok), 'heard': heard, 'wer': sc['wer'], 'rule': rule})
            meas.put(m)
        if check_asr and m.get('asr') is False:
            rejects.append({'id': cid, 'db': r['_db'], 'heard': m.get('heard'), 'text': r['text']})
            continue
        pk = r['pack']
        packs.setdefault(pk, {})[cid] = base64.b64encode(data).decode('ascii')
        e = {'pack': pk, 'voice': f"{r['src']}.{r['voice']}", 'kind': r['kind'], 'text': r['text'],
             'words': r.get('words') or norm_words(r['text']), 'dur': m['dur'], 'adb': m['adb'],
             'set': r.get('set', 'train'), 'asr': {'ok': bool(m.get('asr', r.get('ok')))}}
        for opt in ('item', 'wt', 'rate', 'diff', 'tags', 'bed'):
            if r.get(opt) is not None:
                e[opt] = r[opt]
        manifest[cid] = e
        s = stats.setdefault(pk, {'clips': 0, 'bytes': 0, 'dur': 0.0})
        s['clips'] += 1
        s['bytes'] += len(data)
        s['dur'] += m['dur']
    # clips the recogniser misses after MP3 coding go back to their render step (marked not ok)
    for rj in rejects:
        db = Results(rj['db'])
        row = dict(db.get(rj['id']))
        row.update({'ok': False, 'why': 'mp3-asr', 'heard_mp3': rj['heard']})
        db.put(row)
        log('REJECT (MP3 ASR)', rj['id'], '|', rj['heard'])
    json.dump(rejects, open(WORK / 'pack_rejects.json', 'w'), indent=1)
    for d in ('audio', 'data'):
        (STAGE / d).mkdir(parents=True, exist_ok=True)
        for f in (STAGE / d).glob('*.js'):
            f.unlink()
    reg = {}
    for pk, clips in sorted(packs.items()):
        size = write_js(STAGE / 'audio' / f'pack-{pk}.js',
                        f"window.ES = window.ES || {{}}; ES.packs = ES.packs || {{}}; ES.packs['{pk}']", clips)
        s = stats[pk]
        reg[pk] = {'bytes': s['bytes'], 'file': f'audio/pack-{pk}.js', 'fileBytes': size, 'clips': s['clips'],
                   'dur': round(s['dur'], 1), 'exercises': PACK_EXERCISES.get(pk, [])}
        log(f"pack {pk}: {s['clips']} clips, {s['dur']:.1f} s, {s['bytes'] / 1e6:.3f} MB mp3, {size / 1e6:.3f} MB js")
    write_js(STAGE / 'data' / 'manifest.js', 'window.ES = window.ES || {}; ES.data = ES.data || {}; ES.data.manifest',
             {'version': MANIFEST_VERSION, 'sr': SR, 'kbps': 24, 'built': utc_now(), 'clips': manifest})
    write_js(STAGE / 'data' / 'packs.js', 'window.ES = window.ES || {}; ES.data = ES.data || {}; ES.data.packs', reg)
    total = sum(s['bytes'] for s in stats.values())
    log(f'TOTAL {len(manifest)} clips, {total / 1e6:.3f} MB mp3 (budget {BUDGET / 1e6:.1f} MB); '
        f'{len(rejects)} rejected after MP3 coding')
    json.dump({'total_bytes': total, 'packs': reg}, open(WORK / 'pack-summary.json', 'w'), indent=1)
    json.dump({'version': MANIFEST_VERSION, 'clips': manifest}, open(WORK / 'manifest.json', 'w'))
    return 0 if total <= BUDGET else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv))
