"""CMUdict helpers (raw cmudict.dict from github.com/cmusphinx/cmudict, BSD-style licence; the GPL PyPI
package is not used). Pronunciations are ARPAbet tuples with stress digits removed unless asked."""
import functools
import re

from common import CORPORA

DICT = CORPORA / 'cmudict' / 'cmudict.dict'
VOWELS = {'AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW'}

# ASR spellings that are the same word for our purposes (names and informal forms)
ALIASES = {
    'sacha': 'sasha', 'norah': 'nora', 'tylor': 'tyler', 'kevan': 'kevin', 'gavan': 'gavin',
    'felics': 'felix', 'loggan': 'logan', 'mollie': 'molly', 'rubie': 'ruby', 'wendi': 'wendy',
    'daisey': 'daisy', 'py': 'pie', 'pi': 'pie', 'rai': 'rye', 'okay': 'ok', 'o': 'oh', 'grey': 'gray', 'theatre': 'theater', 'centre': 'center',
    'colour': 'color', 'favourite': 'favorite', 'neighbour': 'neighbor', 'jewellery': 'jewelry',
    'pyjamas': 'pajamas', 'mum': 'mom', 'whisky': 'whiskey', 'tyre': 'tire', 'kerb': 'curb',
    'storey': 'story', 'travelling': 'traveling', 'travelled': 'traveled', 'cancelled': 'canceled',
}


@functools.lru_cache(maxsize=1)
def _load():
    d = {}
    for line in DICT.read_text(encoding='latin-1').splitlines():
        if not line or line.startswith(';;;'):
            continue
        line = line.split('#')[0].strip()
        parts = line.split()
        w = re.sub(r'\(\d+\)$', '', parts[0]).lower()
        d.setdefault(w, []).append(tuple(parts[1:]))
    return d


def prons(word, stress=False):
    out = _load().get(word.lower(), [])
    if stress:
        return out
    return [tuple(re.sub(r'\d', '', p) for p in pr) for pr in out]


def known(word):
    return bool(_load().get(word.lower()))


def canon(word):
    w = word.lower().strip("'")
    return ALIASES.get(w, w)


@functools.lru_cache(maxsize=20000)
def espeak_ipa(word):
    """espeak-ng pronunciation without stress or length marks (build time only), for words CMUdict lacks."""
    import tts
    return re.sub('[\u02c8\u02cc\u02d0.]', '', tts.phonemise(word))


def same_word(a, b):
    """True when two spellings are the same spoken word (identical, alias or homophone). Words missing
    from CMUdict (ASR spellings such as 'Chayne') are compared by their espeak-ng pronunciation."""
    a, b = canon(a), canon(b)
    if a == b:
        return True
    pa, pb = set(prons(a)), set(prons(b))
    if pa and pb:
        return bool(pa & pb)
    if not a.isalpha() or not b.isalpha():
        return False
    return espeak_ipa(a) == espeak_ipa(b)


def syllables(word):
    p = prons(word, stress=True)
    return min(sum(1 for ph in pr if ph[-1].isdigit()) for pr in p) if p else None


def rhyme_key(word):
    """Phonemes from the last stressed vowel to the end (primary pronunciation)."""
    p = prons(word, stress=True)
    if not p:
        return None
    pr = p[0]
    idx = [i for i, ph in enumerate(pr) if ph[-1] in '12']
    i = idx[-1] if idx else 0
    return tuple(re.sub(r'\d', '', ph) for ph in pr[i:])


def edit_distance(a, b):
    m, n = len(a), len(b)
    d = list(range(n + 1))
    for i in range(1, m + 1):
        prev, d[0] = d[0], i
        for j in range(1, n + 1):
            cur = d[j]
            d[j] = min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] != b[j - 1]))
            prev = cur
    return d[n]


def phon_distance(a, b):
    pa, pb = prons(a), prons(b)
    if not pa or not pb:
        return 99
    return min(edit_distance(x, y) for x in pa for y in pb)


def neighbours(word, pool, max_dist=1):
    """Words in pool one phoneme away (substitution, insertion or deletion), closest first."""
    out = []
    for w in pool:
        if w == word:
            continue
        dd = phon_distance(word, w)
        if dd <= max_dist:
            out.append((dd, w))
    return [w for _, w in sorted(out)]


def onset(word):
    p = prons(word)
    if not p:
        return None
    pr = p[0]
    out = []
    for ph in pr:
        if ph in VOWELS:
            break
        out.append(ph)
    return tuple(out)
