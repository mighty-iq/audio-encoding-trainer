"""Render job lists: every clip the app ships, with its voice, text, pack and set. Deterministic.
Each job returns a list of items for render_phrases.py; ids follow CONTRACTS §6:
<src>.<voice>.<kind>.<slug>[.<n>]."""
import content_babble as CB
import content_echo as CE
import content_phrases as CF
import content_probe as CP
import content_repair as CR
import content_sus as CS
import plan as P

CALLSIGN_TAG = 'callsign'


def callsign_items(src, voices, n_per_voice, n_names, pack, seed, set_='train'):
    """Call-sign phrases 'Nora, boat, seven.': one noun per phrase, names and numbers cycling."""
    toks = P.word_tokens(voices, n_names=n_names, n_nouns=n_per_voice, seed=seed)
    out = []
    for v, t in toks.items():
        for i, noun in enumerate(t['word']):
            name, num = t['name'][i % len(t['name'])], t['number'][(i * 4 + len(v)) % 9]
            alts = []
            for k in (3, 7, 5, 2):    # same name and noun with another number, then another name too
                # (ids must stay stable across builds: k 3 and 7 are the first two alternatives ever used)
                nm = name if k in (3, 5) else t['name'][(i + 1 if k == 7 else i + 3) % len(t['name'])]
                nb = t['number'][(i * 4 + len(v) + k) % 9]
                alts.append({'id': f'{src}.{v}.phrase.{nm}-{noun}-{nb}', 'text': f'{nm.capitalize()}, {noun}, {nb}.',
                             'words': [nm, noun, nb]})
            out.append({'id': f'{src}.{v}.phrase.{name}-{noun}-{num}', 'src': src, 'voice': v, 'kind': 'phrase',
                        'text': f'{name.capitalize()}, {noun}, {num}.', 'words': [name, noun, num],
                        'pack': pack, 'set': set_, 'tags': [CALLSIGN_TAG], 'clause': 0.12, 'alts': alts})
    return out


def babble_items(src, voices, per_voice, pack='babble', offset=0):
    sents = CB.items()
    out = []
    k = offset
    for v in voices:
        for _ in range(per_voice):
            s = sents[k % len(sents)]
            k += 1
            out.append({'id': f'{src}.{v}.sentence.{s["id"]}', 'src': src, 'voice': v, 'kind': 'sentence',
                        'text': s['text'], 'pack': pack, 'set': 'train', 'item': s['id'], 'tags': ['babble']})
    return out


def rot(voices, i, k=0):
    return voices[(i + k) % len(voices)]


def text_items(kind, pairs, voices, pack, set_='train', tags=None, extra=None, alts=2, stride=1):
    """pairs: [(item_id, text, fields)] -> one clip per item, voices in rotation; alts = other voices."""
    out = []
    for i, (iid, text, fields) in enumerate(pairs):
        vs = [rot(voices, i * stride, k) for k in range(alts + 1)]
        def mk(src_v):
            src, v = src_v
            return {'id': f'{src}.{v}.{kind}.{iid}', 'src': src, 'voice': v}
        it = dict(mk(vs[0]), kind=kind, text=text, pack=pack, set=set_, item=iid, **(fields or {}), **(extra or {}))
        if tags:
            it['tags'] = tags
        it['alts'] = [mk(x) for x in vs[1:] if x != vs[0]]
        out.append(it)
    return out


def kokoro(vs):
    return [('kokoro', v) for v in vs]


def piper(vs):
    return [('piper-libritts', v) for v in vs]


def job_starter():
    return callsign_items('kokoro', P.STARTER, n_per_voice=20, n_names=6, pack='starter', seed='earshot-starter')


def job_babble1():
    return babble_items('kokoro', P.WAVE2_KOKORO[:8], per_voice=2)


def job_wave2():
    return callsign_items('kokoro', P.WAVE2_KOKORO, n_per_voice=8, n_names=4, pack='words2', seed='earshot-wave2')


def job_piper_cs():
    return callsign_items('piper-libritts', P.PIPER_TRAIN, n_per_voice=5, n_names=3, pack='words2', seed='earshot-piper')


def job_babble2():
    return babble_items('piper-libritts', P.PIPER_TRAIN, per_voice=1, offset=16)


def cast_callsign_items():
    """Call-sign phrases for cast voices that no other job covers (the accented Kokoro voices), so every cast
    voice can appear in Crowd and in the Voices 'find your friend' trials."""
    covered = set(P.STARTER) | set(P.WAVE2_KOKORO)
    vs = [vid.split('.', 1)[1] for vid, _, _ in P.cast_voices()
          if vid.startswith('kokoro.') and vid.split('.', 1)[1] not in covered]
    return callsign_items('kokoro', vs, n_per_voice=4, n_names=3, pack='words2', seed='earshot-cast-cs')


def job_intros():
    out = cast_callsign_items()
    for vid, c in P.cast().items():
        src, v = vid.split('.', 1)
        line = c['intro'].split('. ', 1)[1]
        out.append({'id': f'{vid}.intro.{c["name"].lower()}', 'src': src, 'voice': v, 'kind': 'intro',
                    'text': c['intro'], 'pack': 'cast', 'set': 'train', 'item': 'intro', 'tags': ['cast', c['venue']],
                    'name': c['name'], 'wer_max': 0.2,
                    'alts': [{'id': f'{vid}.intro.{c["name"].lower()}-2', 'text': f'Hello, my name is {c["name"]}. {line}'},
                             {'id': f'{vid}.intro.{c["name"].lower()}-3', 'text': f"I'm {c['name']}. {line}"},
                             {'id': f'{vid}.intro.{c["name"].lower()}-4', 'text': f'My name is {c["name"]}. {line}'}]})
    return out


def job_sus():
    its = CS.items()
    acc = kokoro(P.ACCENT_KEPT)
    std = piper(P.PIPER_TRAIN)                  # bulk renders on the fast Piper voices; Kokoro for accents
    n_acc = 90 if acc else 0
    a = [(it['id'], it['text'], {'keywords': it['keywords']}) for it in its[:n_acc]]
    b = [(it['id'], it['text'], {'keywords': it['keywords']}) for it in its[n_acc:]]
    out = text_items('phrase', a, acc, 'strange', tags=['sus', 'accent'], extra={'lang': 'en-us'}) if a else []
    return out + text_items('phrase', b, std, 'strange', tags=['sus'])


def job_repair():
    vs = piper(P.PIPER_TRAIN)
    out = []
    for i, it in enumerate(CR.sentences()):
        j = i // 2                     # both versions of a pair by the same voice (alternatives follow on)
        rv = vs[j % len(vs):] + vs[:j % len(vs)]
        out += text_items('sentence', [(it['id'], it['text'], {'keywords': [it['keyword']]})], rv, 'repair',
                          tags=['repair', it['pred']])
    return out


def job_far():
    vs = piper(P.PIPER_TRAIN)
    pairs = [(it['id'], it['text'], {'words': it['words']}) for it in CF.items()]
    return text_items('sentence', pairs, vs, 'far', tags=['far'], stride=3)


def job_echo():
    vs = piper(P.PIPER_TRAIN) + kokoro(P.STARTER[::3])     # mostly Piper, a few featured Kokoro voices
    pairs = [(m['id'], m['text'], {'words': m['words']}) for m in CE.items()]
    return text_items('sentence', pairs, vs, 'echo', tags=['echo'], stride=5)


MATRIX_VOICES = ['af_kore', 'bm_lewis', 'af_river', 'af_jessica']   # Lab: Matrix + Rooms; New voice


def job_matrix():
    """Matrix sentences by the held-out voices, rendered only to cut their words (cut_matrix.py); the
    sentences themselves do not ship (pack 'none')."""
    out = []
    for form, v in enumerate(MATRIX_VOICES):
        for s in CP.matrix_sentences(20, form):
            out.append({'id': f'kokoro.{v}.sentence.{s["id"]}', 'src': 'kokoro', 'voice': v, 'kind': 'sentence',
                        'text': s['text'], 'words': s['words'], 'pack': 'none', 'set': 'probe', 'item': s['id'],
                        'tags': ['matrix', f'form{form}'], 'clause': 0.1})
    return out


def job_stories():
    out = []
    for i, st in enumerate(CP.STORIES):
        v = P.PROBE_KOKORO[i % 2]
        out.append({'id': f'kokoro.{v}.story.{st["id"]}', 'src': 'kokoro', 'voice': v, 'kind': 'story',
                    'text': st['text'], 'pack': 'probe', 'set': 'probe', 'item': st['id'], 'keywords': st['keywords'],
                    'wer_max': 0.06, 'sentence': 0.35, 'speed': 0.95, 'tags': ['story']})
    return out


JOBS = {
    'starter': job_starter, 'babble1': job_babble1, 'wave2': job_wave2, 'piper_cs': job_piper_cs,
    'babble2': job_babble2, 'intros': job_intros, 'sus': job_sus, 'repair': job_repair, 'echo': job_echo,
    'matrix': job_matrix, 'stories': job_stories, 'far': job_far,
}
