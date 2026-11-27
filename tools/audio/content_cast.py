"""The cast (training): named voices with a one-line role at a Night-out venue and a short spoken intro.
Cast names are kept apart from call signs, Echo callers, story and matrix names."""

FEMALE = ['Ines', 'Marta', 'Freya', 'Rosa', 'Tess', 'Zoe', 'Ada', 'Selma', 'Rhea', 'Carmen', 'Ingrid', 'Leila',
          'Elif', 'Hana', 'Mei', 'Priya', 'Nadia', 'Lucia', 'Sofia', 'Anouk', 'Yara', 'Lotte']
MALE = ['Omar', 'Theo', 'Emil', 'Tomas', 'Jonah', 'Owen', 'Bruno', 'Kai', 'Ivan', 'Malik', 'Samir', 'Rafael',
        'Kenji', 'Ravi', 'Arjun', 'Diego', 'Marco', 'Pablo', 'Yusuf', 'Luca', 'Anton', 'Felipe']
# preferred first names for voices whose accent label suggests one (purely a naming choice)
ACCENT_NAMES = {'Hindi': (['Priya', 'Nadia'], ['Ravi', 'Arjun']), 'Spanish': (['Lucia'], ['Diego']),
                'French': (['Anouk'], ['Felipe']), 'Italian': (['Sofia'], ['Marco']),
                'Portuguese': (['Yara'], ['Rafael']), 'Japanese': (['Hana'], ['Kenji']),
                'Mandarin': (['Mei', 'Lotte'], ['Kai', 'Anton'])}

ROLES = [
    ('cafe', 'I run the little cafe on the corner.'),
    ('station', 'I sell tickets at the station.'),
    ('bar', 'I pour the drinks at the bar on the square.'),
    ('party', 'I throw the loudest house parties on our street.'),
    ('club', 'I play records at the club on Fridays.'),
    ('concert', 'I play bass in the band at the concert hall.'),
    ('restaurant', 'I wait tables at the busy restaurant downtown.'),
    ('stadium', 'I coach the youth team at the stadium.'),
    ('cathedral', 'I sing in the choir at the cathedral.'),
    ('park', 'I walk dogs in the park every morning.'),
    ('phone', 'I answer calls on the help line.'),
    ('lecture', 'I teach the evening class in the lecture hall.'),
    ('cafe', 'I bake the bread for the cafe before sunrise.'),
    ('station', 'I make the announcements at the station.'),
    ('bar', 'I run the quiz night at the bar.'),
    ('party', 'I always end up in the kitchen at parties.'),
    ('club', 'I check the coats at the club.'),
    ('concert', 'I tune the pianos before every concert.'),
    ('restaurant', 'I cook in the kitchen of the noodle bar.'),
    ('stadium', 'I sell drinks in the stands at the stadium.'),
    ('cathedral', 'I give the tours at the cathedral.'),
    ('park', 'I fix bikes at the stall in the park.'),
    ('phone', 'I call my family every Sunday night.'),
    ('lecture', 'I study history and sit in the front row.'),
    ('cafe', 'I write my novel at the window table of the cafe.'),
    ('station', 'I drive the night bus from the station.'),
    ('bar', 'I play the old piano at the bar.'),
    ('party', 'I bring the snacks to every party.'),
    ('club', 'I work the door at the club.'),
    ('concert', 'I sing in a small folk group.'),
    ('restaurant', 'I own the pizza place near the harbour.'),
    ('stadium', 'I commentate the matches on local radio.'),
    ('cathedral', 'I ring the bells on Sundays.'),
    ('park', 'I play chess on the benches in the park.'),
    ('phone', 'I sell insurance on the phone, sorry.'),
    ('lecture', 'I run the science club at the lecture hall.'),
    ('cafe', 'I deliver the coffee beans to every cafe in town.'),
    ('station', 'I repair the escalators at the station.'),
    ('bar', 'I tell the same three jokes at the bar.'),
    ('party', 'I know everyone at every party.'),
    ('club', 'I dance until they turn the lights on.'),
    ('concert', 'I sell the programmes at the concert hall.'),
    ('restaurant', 'I make the desserts at the French bistro.'),
    ('stadium', 'I keep the grass green at the stadium.'),
]


VERBS = {'run', 'sell', 'pour', 'throw', 'play', 'wait', 'coach', 'sing', 'walk', 'answer', 'teach', 'bake', 'make',
         'end', 'check', 'tune', 'cook', 'give', 'fix', 'call', 'study', 'sit', 'write', 'drive', 'bring', 'work',
         'own', 'commentate', 'ring', 'deliver', 'repair', 'tell', 'know', 'dance', 'keep'}


def conjugate(v):
    """Third person singular: study -> studies, fix -> fixes, coach -> coaches, run -> runs."""
    if v.endswith('y') and v[-2:-1] not in 'aeiou':
        return v[:-1] + 'ies'
    if v.endswith(('s', 'sh', 'ch', 'x', 'z', 'o')):
        return v + 'es'
    return v + 's'


def third_person(line):
    """'I study history and sit in the front row.' -> 'Studies history and sits in the front row.' (card text):
    every verb of the first-person clause is conjugated, and my/our become their."""
    w = line.split()
    assert w[0] == 'I', line
    w = w[1:]
    k = 1 if w[0] == 'always' else 0
    w[k] = conjugate(w[k])
    for i in range(1, len(w)):
        if w[i - 1] == 'and' and w[i] in VERBS:
            w[i] = conjugate(w[i])
    rest = ' '.join(w).replace(' my ', ' their ').replace(' our ', ' their ')
    return rest[0].upper() + rest[1:]


def assign(voices):
    """voices: [(voice_id, sex, accent_label)] in a fixed order -> {voice_id: {name, venue, blurb, intro}}."""
    used = set()
    fem, mal = [n for n in FEMALE], [n for n in MALE]
    out = {}
    for i, (vid, sex, acc) in enumerate(voices):
        pref = ACCENT_NAMES.get(acc, ([], []))[0 if sex == 'f' else 1]
        pool = [n for n in pref if n not in used] + [n for n in (fem if sex == 'f' else mal) if n not in used]
        name = pool[0]
        used.add(name)
        venue, line = ROLES[i % len(ROLES)]
        out[vid] = {'name': name, 'venue': venue, 'blurb': third_person(line), 'intro': f"Hi, I'm {name}. {line}"}
    return out


def vocab(key):
    if key == 'intros':
        return [{'id': 'intro', 'template': "Hi, I'm {name}. {line}", 'roles': [{'venue': v, 'line': l} for v, l in ROLES]}]
    raise KeyError(key)
