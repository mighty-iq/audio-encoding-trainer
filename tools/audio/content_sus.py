"""Semantically unpredictable phrases for Strange voices (training): "The candle folds the river."
Five words, three keywords (subject, verb, object) drawn from closed slot lists, so context cannot stand in
for listening and every slot has a closed answer set. Original; generated with a fixed seed."""
import random

SUS_NOUNS = ['window', 'ladder', 'pillow', 'carpet', 'river', 'kettle', 'mirror', 'candle', 'garden', 'rabbit',
             'pencil', 'basket', 'wagon', 'jacket', 'ticket', 'bottle', 'hammer', 'blanket', 'castle', 'dragon',
             'engine', 'feather', 'forest', 'island', 'lemon', 'magnet', 'needle', 'onion', 'puzzle', 'rocket',
             'saddle', 'tiger', 'tunnel', 'wallet', 'whistle', 'lantern', 'monkey', 'parrot', 'pumpkin', 'turtle']
SUS_VERBS = ['sings', 'paints', 'kicks', 'folds', 'chases', 'follows', 'washes', 'lifts', 'pulls', 'pushes',
             'drops', 'throws', 'catches', 'carries', 'hides', 'crosses', 'builds', 'breaks', 'cleans', 'closes',
             'opens', 'fixes', 'fills', 'warms', 'reads', 'draws', 'drinks', 'eats', 'bends', 'shakes']
N_ITEMS = 150


def items():
    rng = random.Random('earshot-sus')
    nouns = SUS_NOUNS[:]
    verbs = SUS_VERBS[:]
    out, seen = [], set()
    i = 0
    while len(out) < N_ITEMS:
        if i % len(nouns) == 0:
            rng.shuffle(nouns)
        if i % len(verbs) == 0:
            rng.shuffle(verbs)
        s = nouns[i % len(nouns)]
        o = nouns[(i * 7 + 3) % len(nouns)]
        v = verbs[i % len(verbs)]
        i += 1
        if s == o or (s, v, o) in seen:
            continue
        seen.add((s, v, o))
        k = len(out) + 1
        out.append({'id': f'sus-{k:03d}', 'text': f'The {s} {v} the {o}.', 'words': ['the', s, v, 'the', o],
                    'keys': [1, 4], 'keywords': [s, v, o], 'slots': {'subject': s, 'verb': v, 'object': o}})
    return out


def vocab(key):
    if key == 'sus':
        return items()
    raise KeyError(key)


def pools():
    return {'nouns': SUS_NOUNS, 'verbs': SUS_VERBS}


if __name__ == '__main__':
    its = items()
    print(len(its), its[:3])
    from collections import Counter
    c = Counter(w for it in its for w in it['keywords'])
    print('min/max uses', min(c.values()), max(c.values()))
