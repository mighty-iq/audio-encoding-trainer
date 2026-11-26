"""Everyday phrases for Far (training): the kind of thing someone says across a room. Each has two keywords
from the closed noun set (so phonetic-neighbour foils exist); the carrier words avoid the other nouns.
Original; nouns assigned with a fixed seed so every keyword is used once."""
import random

import content_words as CW

TEMPLATES = [
    'Could you pass me the {a} and the {b}?',
    'I left the {a} right next to the {b}.',
    'Have you seen the {a} or the {b} anywhere?',
    'Please put the {a} back behind the {b}.',
    'We still need a new {a} and a new {b}.',
    'Bring the {a} over here, and the {b} too.',
    'Do not forget the {a} and the {b} tomorrow.',
    'The {a} is somewhere under the {b}.',
]
N_ITEMS = 40


def items():
    from common import norm_words
    rng = random.Random('earshot-far-phrases')
    nouns = CW.NOUNS[:]
    rng.shuffle(nouns)
    out = []
    for i in range(N_ITEMS):
        a, b = nouns[2 * i], nouns[2 * i + 1]
        if CW_FAMILY.get(a) == CW_FAMILY.get(b):      # never two rhymes in one phrase
            b = nouns[(2 * i + 41) % len(nouns)]
        text = TEMPLATES[i % len(TEMPLATES)].format(a=a, b=b)
        w = norm_words(text)
        out.append({'id': f'far-{i + 1:03d}', 'text': text, 'words': w, 'keys': [w.index(a), len(w) - 1 - w[::-1].index(b)]})
    return out


CW_FAMILY = {w: f for f, ws in CW.RHYMES.items() for w in ws}


def vocab(key):
    if key == 'phrases':
        return items()
    raise KeyError(key)


if __name__ == '__main__':
    its = items()
    for it in its[:8]:
        print(it['id'], it['text'], it['keys'], [it['words'][k] for k in it['keys']])
