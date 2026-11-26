"""Validate the generated data against docs/dev/CONTRACTS.md §6 and the stimulus rules:
schema of every manifest entry, packs <-> manifest consistency, train/probe separation (voices and probe
content), ASR pass rate of kept clips (>= 98 %), and the audio budget (<= 8.5 MB of MP3).
Usage: python3 -I tools/audio/validate.py [--publish]   (checks the staged set in ../stimwork/stage; exit 1 on
any failure; report in ../stimwork/validate.json). --publish copies a valid staged set into data/ and audio/,
file by file with an atomic rename, and removes pack files the new set no longer has.
"""
import base64
import json
import re
import sys

sys.path.insert(0, __import__('os').path.dirname(__file__))
import os  # noqa: E402
import shutil  # noqa: E402

from common import REPO, STAGE, WORK, Log  # noqa: E402

KINDS = {'word', 'name', 'number', 'phrase', 'sentence', 'digit', 'intro', 'story', 'bed', 'rir'}
SRCS = {'kokoro', 'piper-libritts', 'librivox', 'audiomnist', 'cremad', 'speechocean', 'ms-snsd', 'synth'}
ID_RE = re.compile(r'^[a-z0-9-]+\.[a-z0-9_-]+\.[a-z]+\.[a-z0-9-]+(\.[0-9]+)?$')
BUDGET = 8.5e6
BEDS = {'babble', 'cafe', 'party', 'street', 'station', 'hall', 'hum'}


def js_obj(path):
    """Parse a generated classic script `<prefix> = <json>;` (the JSON starts after the last ' = ' of line 2)."""
    line = path.read_text().split('\n', 2)[1]
    j = line.rindex('||', 0, 200)
    i = min(k for k in (line.find('= {', j), line.find('= [', j)) if k >= 0)
    return json.loads(line[i + 2:].rstrip().rstrip(';'))


def publish(log):
    for d in ('data', 'audio'):
        (REPO / d).mkdir(exist_ok=True)
        new = {f.name for f in (STAGE / d).glob('*.js')}
        for f in sorted((STAGE / d).glob('*.js')):
            tmp = REPO / d / f'.{f.name}.tmp'
            shutil.copyfile(f, tmp)
            os.replace(tmp, REPO / d / f.name)
        for f in (REPO / d).glob('*.js'):
            if f.name not in new:
                f.unlink()
    log('published the staged set to data/ and audio/')


def main(argv=()):
    log = Log('validate')
    errs, warn = [], []
    root = STAGE
    man = js_obj(root / 'data' / 'manifest.js')
    voices = js_obj(root / 'data' / 'voices.js')
    vocab = js_obj(root / 'data' / 'vocab.js')
    reg = js_obj(root / 'data' / 'packs.js')
    clips = man['clips']
    packs = {}
    for pk in reg:
        packs[pk] = js_obj(root / 'audio' / f'pack-{pk}.js')
    # schema
    for cid, e in clips.items():
        if not ID_RE.match(cid) or cid != cid.lower() or not cid.isascii():
            errs.append(f'bad clip id {cid}')
        for k, typ in (('pack', str), ('voice', str), ('kind', str), ('text', str), ('words', list), ('dur', float),
                       ('adb', float), ('set', str), ('asr', dict)):
            if not isinstance(e.get(k), (typ, int) if typ is float else typ):
                errs.append(f'{cid}: field {k} missing or wrong type')
        if e.get('kind') not in KINDS:
            errs.append(f'{cid}: kind {e.get("kind")}')
        if e.get('set') not in ('train', 'probe'):
            errs.append(f'{cid}: set {e.get("set")}')
        if not cid.startswith(e.get('voice', '?') + '.'):
            errs.append(f'{cid}: id does not start with its voice {e.get("voice")}')
        if e.get('voice') not in voices:
            errs.append(f'{cid}: voice {e.get("voice")} not in voices.js')
        elif voices[e['voice']]['set'] != e.get('set'):
            errs.append(f'{cid}: set differs from its voice')
        if e.get('pack') not in packs or cid not in packs.get(e.get('pack'), {}):
            errs.append(f'{cid}: not in pack {e.get("pack")}')
        if e.get('kind') == 'bed' and e.get('bed') not in BEDS:
            errs.append(f'{cid}: bed category {e.get("bed")}')
        if e.get('kind') != 'bed' and not (-45 < e.get('adb', 0) < -3):
            warn.append(f'{cid}: unusual active level {e.get("adb")}')
    for pk, d in packs.items():
        for cid, b64 in d.items():
            if cid not in clips:
                errs.append(f'pack {pk}: clip {cid} not in the manifest')
            raw = base64.b64decode(b64[:8])
            if not (raw[:2] == b'\xff\xf3' or raw[:2] == b'\xff\xf2' or raw[:2] == b'\xff\xfb' or raw[:3] == b'ID3'):
                errs.append(f'pack {pk}: {cid} does not start with an MP3 frame')
    for vid, v in voices.items():
        if v.get('src') not in SRCS:
            errs.append(f'voice {vid}: src {v.get("src")}')
        if v.get('set') not in ('train', 'probe') or not v.get('licence'):
            errs.append(f'voice {vid}: set/licence missing')
    # train/probe separation: probe voices only in probe clips (checked above), probe packs hold only probes
    for cid, e in clips.items():
        if (e['pack'] == 'probe') != (e['set'] == 'probe'):
            errs.append(f'{cid}: pack {e["pack"]} with set {e["set"]}')
    probe_items = set()
    for s in vocab.get('stories', []):
        probe_items.add(s['id'])
    for key in ('sus', 'phrases', 'repair', 'echo', 'twovoices'):
        for it in vocab.get(key, []):
            if isinstance(it, dict) and it.get('probe'):
                probe_items.add(it['id'])
    for cid, e in clips.items():
        if e.get('item') in probe_items and e['set'] != 'probe':
            errs.append(f'{cid}: probe item {e["item"]} in a training clip')
    mx = vocab.get('matrix') or {}
    if mx:
        train_words = set(vocab['nouns']) | set(vocab['names'])
        train_words |= set(vocab['numbers'])
        for it in vocab.get('sus', []):
            train_words |= set(it.get('keywords', []))
        for it in vocab.get('repair', []):
            train_words.add(it['keyword'])
        for slot in ('name', 'verb', 'num', 'adj', 'obj'):
            clash = sorted(set(mx.get(slot, [])) & train_words)
            if clash:
                errs.append(f'matrix {slot} words also used in training: {clash}')
    import content_probe
    if content_probe.overlap_with_published():
        errs.append(f'matrix shares words with the published British English matrix: {content_probe.overlap_with_published()}')
    import registry
    creds = {c['key'] for c in js_obj(root / 'data' / 'credits.js')} if (root / 'data' / 'credits.js').exists() else set()
    for vid in voices:
        if registry.credit_key(vid) not in creds:
            errs.append(f'no credit for the source of voice {vid}')
    # ASR pass rate of kept speech clips
    speech = [e for e in clips.values() if e['kind'] not in ('bed', 'rir')]
    ok = sum(1 for e in speech if e['asr']['ok'])
    rate = ok / max(1, len(speech))
    if rate < 0.98:
        errs.append(f'ASR pass rate {rate:.3f} < 0.98')
    total = sum(p['bytes'] for p in reg.values())
    if total > BUDGET:
        errs.append(f'audio budget exceeded: {total / 1e6:.3f} MB > {BUDGET / 1e6:.1f} MB')
    rep = {'clips': len(clips), 'voices': len(voices), 'asr_pass': round(rate, 4), 'mp3_bytes': total,
           'packs': {k: {'clips': v['clips'], 'bytes': v['bytes'], 'dur': v['dur']} for k, v in reg.items()},
           'errors': errs[:200], 'n_errors': len(errs), 'warnings': warn[:100], 'n_warnings': len(warn)}
    json.dump(rep, open(WORK / 'validate.json', 'w'), indent=1)
    for e in errs[:30]:
        log('ERROR', e)
    log(f'validate: {len(clips)} clips, {len(voices)} voices, ASR pass {rate:.2%}, {total / 1e6:.3f} MB; '
        f'{len(errs)} errors, {len(warn)} warnings')
    if errs:
        return 1
    if '--publish' in argv:
        publish(log)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
