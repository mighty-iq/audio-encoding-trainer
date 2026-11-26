"""Echo messages (training): 60 original voicemail- and announcement-style messages built from eight
templates and closed slot pools (names, places, times, numbers, objects). Each message lists its details
with a question, so the app can ask 2-3 of them after a pause; foils come from the same pool."""
import random

CALLERS = ['Alex', 'Jamie', 'Sam', 'Charlie', 'Morgan', 'Taylor', 'Casey', 'Jordan', 'Riley', 'Quinn', 'Avery', 'Drew']
PLACES = ['the north gate', 'the side entrance', 'the main hall', 'the old bridge', 'the library steps',
          'the corner cafe', 'the bus shelter', 'the car park', 'the fountain', 'the ticket office',
          'the back door', 'the clock tower', 'the bike racks', 'the food court', 'the east exit', 'the boat house']
TIMES = ['half past six', 'a quarter to eight', 'ten fifteen', 'seven thirty', 'noon', 'nine o\'clock',
         'twenty past five', 'a quarter past four', 'eight o\'clock', 'half past nine', 'ten to three',
         'six fifteen', 'two thirty', 'five o\'clock', 'eleven thirty', 'a quarter to one']
OBJECTS = ['the blue folder', 'a torch', 'two folding chairs', 'the spare keys', 'an extension cable',
           'the canvas bag', 'some cash', 'your library card', 'a warm jumper', 'the guest list', 'a phone charger',
           'three bottles of water', 'the spiral notebook', 'a picnic blanket']
TOWNS = ['Ashby', 'Millbrook', 'Fernhill', 'Riverside', 'Elmstead', 'Kingsford', 'Westbury', 'Oakham']
FOODS = ['the vegetable soup', 'a cheese sandwich', 'the fish stew', 'a lemon tart', 'the chicken salad',
         'a mushroom pizza', 'the pancakes', 'a portion of chips', 'the bean burger', 'a fruit salad']
DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
COLOURS = ['red', 'green', 'blue', 'yellow', 'orange', 'purple']
STREETS = ['Elm Road', 'Mill Lane', 'Station Road', 'Park Street', 'Church Walk', 'Hill Avenue', 'Brook Street',
           'Oak Drive']
DIGITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
NUMBER_WORDS = ['two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
                'fourteen', 'fifteen', 'sixteen', 'eighteen', 'twenty', 'twenty-one', 'twenty-four']

# slot -> (engine fact category, question); one value per category per message
QUESTIONS = {'caller': ('name', 'Who left the message?'), 'place': ('place', 'Where?'),
             'time': ('time', 'At what time?'), 'object': ('item', 'What should you bring?'),
             'day': ('day', 'Which day?'), 'town': ('place', 'Where is the train going?'),
             'food': ('item', 'What should you order?'), 'street': ('place', 'Which street?'),
             'platform': ('number', 'Which platform?'), 'table': ('number', 'Which table?'),
             'house': ('number', 'Which house number?'), 'bus': ('number', 'Which bus is cancelled?'),
             'people': ('number', 'For how many people?')}

TEMPLATES = [
    ('t1', "Hi, it's {caller}. Meet me at {place} at {time}, and bring {object}.",
     ['caller', 'place', 'time', 'object']),
    ('t2', 'This is {caller}. The meeting has moved to {place}, on {day} at {time}.',
     ['caller', 'place', 'day', 'time']),
    ('t3', 'Attention please. The train to {town} will now leave from platform {platform} at {time}.',
     ['town', 'platform', 'time']),
    ('t4', "Hey, {caller} here. I'm at table {table}, near {place}. Could you order me {food}?",
     ['caller', 'table', 'place', 'food']),
    ('t5', 'Message from {caller}. Your table for {people} is booked for {day} at {time}.',
     ['caller', 'people', 'day', 'time']),
    ('t6', 'Hello, this is {caller} from the shop. Your order is ready at {place}. Please collect it before {time}.',
     ['caller', 'place', 'time']),
    ('t7', "It's {caller}. The party is at number {house}, {street}. It starts at {time}, so bring {object}.",
     ['caller', 'house', 'street', 'time', 'object']),
    ('t8', 'Quick note from {caller}. Bus {bus} is cancelled, so meet me at {place} on {day}.',
     ['caller', 'bus', 'place', 'day']),
]
POOLS = {'caller': CALLERS, 'place': PLACES, 'time': TIMES, 'object': OBJECTS, 'town': TOWNS, 'food': FOODS,
         'day': DAYS, 'street': STREETS, 'platform': NUMBER_WORDS[:12], 'table': NUMBER_WORDS,
         'house': NUMBER_WORDS, 'bus': NUMBER_WORDS, 'people': NUMBER_WORDS[:10]}
N_ITEMS = 60


def items():
    import common
    rng = random.Random('earshot-echo')
    out = []
    for i in range(N_ITEMS):
        tid, tpl, slots = TEMPLATES[i % len(TEMPLATES)]
        vals = {}
        for sl in slots:
            if sl == 'place' and tid == 't6':
                vals[sl] = rng.choice(['the ticket office', 'the main hall', 'the corner cafe', 'the food court',
                                       'the side entrance', 'the back door'])
            else:
                vals[sl] = rng.choice(POOLS[sl])
        text = tpl.format(**vals)
        facts = [{'cat': QUESTIONS[sl][0], 'value': vals[sl], 'q': QUESTIONS[sl][1], 'slot': sl} for sl in slots]
        out.append({'id': f'echo-{i + 1:03d}', 'template': tid, 'text': text, 'words': common.norm_words(text),
                    'facts': facts})
    return out


def values():
    """Foil pools per fact category (the engine draws options from these)."""
    return {'name': CALLERS, 'place': PLACES + TOWNS + STREETS, 'time': TIMES, 'day': DAYS,
            'item': OBJECTS + FOODS, 'number': NUMBER_WORDS}


def vocab(key):
    if key == 'echo':
        return items()
    if key == 'echoValues':
        return values()
    raise KeyError(key)


if __name__ == '__main__':
    for it in items()[:9]:
        print(it['id'], it['text'])
