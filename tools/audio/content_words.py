"""Original closed-set vocabulary for Crowd, Far, Seek and Voices (training only).

Call signs: 16 two-syllable names with distinct onsets (8 usually female, 8 usually male).
Nouns: common, concrete, picturable one-syllable nouns grouped by rhyme (same rime, different onset).
The selection is ours; it copies no clinical word list. Phonetic neighbours are computed from CMUdict.
"""

NAMES = ['bella', 'daisy', 'felix', 'gavin', 'harper', 'jasper', 'kevin', 'logan',
         'molly', 'nora', 'parker', 'ruby', 'sasha', 'tyler', 'victor', 'wendy']

NUMBERS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']

RHYMES = {
    'at': ['cat', 'hat', 'bat', 'rat'],
    'oat': ['boat', 'coat', 'goat'],
    'ake': ['cake', 'lake', 'snake', 'rake'],
    'ug': ['mug', 'rug', 'bug', 'jug'],
    'air': ['chair', 'bear', 'pear', 'hair'],
    'ock': ['sock', 'rock', 'lock', 'clock'],
    'ee': ['bee', 'tree', 'key', 'knee'],
    'ane': ['plane', 'train', 'chain', 'crane'],
    'ar': ['car', 'jar', 'star'],
    'an': ['fan', 'pan', 'van', 'can'],
    'um': ['drum', 'plum', 'gum'],
    'ig': ['pig', 'wig', 'fig'],
    'ose': ['nose', 'rose', 'hose'],
    'one': ['phone', 'bone', 'cone'],
    'oot': ['boot', 'suit', 'fruit'],
    'og': ['dog', 'frog', 'log'],
    'ing': ['ring', 'king', 'wing'],
    'ish': ['fish', 'dish'],
    'ouse': ['house', 'mouse'],
    'oon': ['moon', 'spoon'],
    'ip': ['ship', 'lip', 'chip'],
    'ed': ['bed', 'bread', 'shed'],
    'ail': ['nail', 'tail', 'snail'],
    'all': ['ball', 'wall'],
    'ook': ['book', 'hook'],
    'ag': ['bag', 'flag'],
    'ape': ['tape', 'grape', 'cape'],
    'est': ['nest', 'vest', 'chest'],
    'ice': ['rice', 'dice'],
    'oor': ['door', 'floor'],
    'ool': ['pool', 'tool', 'stool'],
    'orn': ['horn', 'corn'],
    'eel': ['wheel', 'seal'],
    'art': ['cart', 'dart', 'heart'],
    'amp': ['lamp', 'stamp'],
    'ie': ['pie', 'tie', 'fly'],
    'ap': ['cap', 'map'],
    'en': ['pen', 'hen'],
    'oo': ['shoe', 'zoo'],
    'uck': ['duck', 'truck'],
    'ass': ['glass', 'grass'],
    'ate': ['plate', 'gate'],
    'and': ['hand', 'sand'],
    'ab': ['crab', 'cab'],
    'ox': ['box', 'fox'],
    'ell': ['bell', 'shell'],
}

NOUNS = [w for fam in RHYMES.values() for w in fam]

# Carrier used to synthesise word tokens inside a phrase (TTS garbles isolated words); the
# phrase is cut into its words and every cut word is checked by speech recognition.
CARRIER = '{name}, {noun}, {number}.'


def check():
    """Content sanity checks; returns a list of problems (empty when fine)."""
    import lexicon
    probs = []
    seen = set()
    for w in NOUNS:
        if w in seen:
            probs.append(f'duplicate noun {w}')
        seen.add(w)
        if not lexicon.known(w):
            probs.append(f'noun not in CMUdict: {w}')
        elif lexicon.syllables(w) != 1:
            probs.append(f'noun not one syllable: {w}')
    onsets = {}
    for n in NAMES:
        if not lexicon.known(n):
            probs.append(f'name not in CMUdict: {n}')
            continue
        if lexicon.syllables(n) != 2:
            probs.append(f'name not two syllables: {n}')
        o = lexicon.onset(n)
        if o in onsets:
            probs.append(f'names share onset {o}: {n}, {onsets[o]}')
        onsets[o] = n
    for fam, ws in RHYMES.items():
        # the cot/caught merger makes dog/frog/log one rhyme for most listeners
        keys = {tuple('AA' if ph == 'AO' else ph for ph in lexicon.rhyme_key(w)) for w in ws}
        if len(keys) > 1:
            probs.append(f'family {fam} rhymes differ: {keys}')
    for i, a in enumerate(NOUNS):
        for b in NOUNS[i + 1:]:
            if lexicon.same_word(a, b):
                probs.append(f'homophones inside the set: {a}/{b}')
    return probs


if __name__ == '__main__':
    p = check()
    print(len(NAMES), 'names', len(NUMBERS), 'numbers', len(NOUNS), 'nouns in', len(RHYMES), 'families')
    print('\n'.join(p) if p else 'content checks: ok')
