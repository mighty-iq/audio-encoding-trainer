"""Probe material for the Lab (never used in training): an original five-slot word matrix and six short
story passages with five multiple-choice questions each. Words and names here appear in no training list
(validate.py checks the matrix against the training vocabulary)."""

# Slot keys follow the Lab's reader (js/lab): name, verb, num, adj, obj. Words were chosen by us: common,
# picturable, <= 7 letters, disjoint from every training answer word (training numbers are one to nine), and
# checked against the published British English matrix test (Hall 2006, University of Southampton MSc
# dissertation, Table 2.1): no word and no verb lemma in common (a first draft shared 7 adjectives, 3 verbs and
# 2 numbers with it and was changed). The American English matrix list could not be opened (bot check).
# Round 2 (review ST-04): finds, holds and sticks were replaced by hugs, wipes and dolls. Under the open-vocabulary
# rule no take of finds or sticks by af_kore, or of holds by bm_lewis, passed after every cutting and rendering
# fallback. The new words are one syllable like the other verbs, pass from carrier sentences for both talkers, and
# appear nowhere in the training texts. Lists stay alphabetical (the Lab shows them in this order). The v2 carrier
# sentences were rendered with the round-1 words and are kept: the cutter reads the words stored with each one.
MATRIX_VERSION = 2
MATRIX = {
    'name': ['alma', 'boris', 'clara', 'dennis', 'elsa', 'frank', 'greta', 'hugo', 'irene', 'oscar'],
    'verb': ['brings', 'counts', 'hugs', 'moves', 'needs', 'picks', 'sorts', 'takes', 'wipes', 'wraps'],
    'num': ['eleven', 'fifteen', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'],
    'adj': ['bright', 'brown', 'heavy', 'new', 'plain', 'round', 'soft', 'warm', 'wet', 'white'],
    'obj': ['bowls', 'bricks', 'buttons', 'coins', 'cups', 'dolls', 'gloves', 'knives', 'shirts', 'towels'],
}
# the published British English base matrix, kept only to test for overlap (validate.py and __main__)
HALL_2006 = {
    'name': ['peter', 'kathy', 'lucy', 'alan', 'rachel', 'barry', 'steven', 'thomas', 'hannah', 'nina'],
    'verb': ['got', 'sees', 'bought', 'gives', 'sold', 'likes', 'has', 'kept', 'wins', 'wants'],
    'num': ['three', 'nine', 'five', 'eight', 'four', 'six', 'two', 'ten', 'twelve', 'some'],
    'adj': ['large', 'small', 'old', 'dark', 'thin', 'green', 'cheap', 'pink', 'red', 'big'],
    'obj': ['desks', 'chairs', 'shoes', 'toys', 'spoons', 'mugs', 'ships', 'rings', 'tins', 'beds'],
}
HALL_LEMMAS = {'get', 'see', 'buy', 'give', 'sell', 'like', 'have', 'keep', 'win', 'want'}
SLOTS = ['name', 'verb', 'num', 'adj', 'obj']
# slot permutations (multipliers coprime with 10) so that every word appears equally often per voice
_STEP = {'name': 1, 'verb': 3, 'num': 7, 'adj': 9, 'obj': 1}
_OFF = {'name': 0, 'verb': 1, 'num': 4, 'adj': 6, 'obj': 3}


def matrix_sentences(n, form=0):
    """n sentences (multiples of 10 keep the design balanced); `form` shifts the design for another set."""
    out = []
    for i in range(n):
        words = []
        for s in SLOTS:
            k = (i * _STEP[s] + _OFF[s] + form * (2 if s == 'obj' else 1) + (i // 10) * (s == 'obj')) % 10
            words.append(MATRIX[s][k])
        text = f'{words[0].capitalize()} {" ".join(words[1:])}.'
        out.append({'id': f'mxv{MATRIX_VERSION}-{form}-{i + 1:02d}', 'text': text, 'words': words})
    return out


STORIES = [
    {'id': 'story-1', 'title': 'The market', 'text': (
        "Early on Saturday, Lena and her neighbour Paul walked to the market by the river. They wanted fruit for "
        "a picnic. The first stall had only sour green apples, so they bought six ripe pears and a small bag of "
        "plums. Just then it began to rain hard. They ran to the bakery and waited under its red awning, sharing "
        "a warm cheese roll. After about twenty minutes the sky cleared. Paul suddenly realised that he had left "
        "his umbrella at the fruit stall. When they went back, the farmer was already holding it up and laughing. "
        "By then the grass in the park was soaking wet, so they had the picnic on Lena's balcony instead."),
     'questions': [
        {'q': 'Who was laughing at the fruit stall?', 'options': ['the farmer', 'Paul', 'Lena', 'her neighbour'], 'answer': 0},
        {'q': 'What did they buy at the first stall?', 'options': ['pears and plums', 'sour green apples', 'a warm cheese roll', 'six green apples'], 'answer': 0},
        {'q': 'Where did they wait during the rain?', 'options': ['at the bakery', 'by the river', 'in the park', 'at the fruit stall'], 'answer': 0},
        {'q': 'What had Paul left behind?', 'options': ['his umbrella', 'the plums', 'the roll', 'the pears'], 'answer': 0},
        {'q': 'Where did they have the picnic?', 'options': ['on the balcony', 'in the park', 'by the river', 'under the red awning'], 'answer': 0},
     ],
     'keywords': ['paul', 'pears', 'plums', 'bakery', 'umbrella', 'balcony']},
    {'id': 'story-2', 'title': 'The evening train', 'text': (
        "Martin was taking the evening train to visit his grandmother. At the station, a voice announced that the "
        "seven fifteen service would leave from platform nine instead of platform four. Martin hurried down the "
        "stairs with his heavy blue suitcase. On the train he found a seat next to a woman who was knitting a long "
        "yellow scarf. She told him she was a music teacher and that she knitted on every journey. Halfway through "
        "the trip, the train stopped for half an hour because of a fallen tree on the line. Martin phoned his "
        "grandmother to say he would be late. She laughed and said she would keep the soup warm and leave the "
        "porch light on."),
     'questions': [
        {'q': 'Which platform did the train leave from?', 'options': ['nine', 'four', 'seven', 'fifteen'], 'answer': 0},
        {'q': 'What did Martin carry down the stairs?', 'options': ['his blue suitcase', 'a long yellow scarf', 'the warm soup', 'the porch light'], 'answer': 0},
        {'q': 'Who was knitting?', 'options': ['a music teacher', "Martin's grandmother", 'Martin on the train', 'a voice at the station'], 'answer': 0},
        {'q': 'What was on the line?', 'options': ['a fallen tree', 'a suitcase', 'a light', 'a scarf'], 'answer': 0},
        {'q': 'What would his grandmother leave on?', 'options': ['the porch light', 'the warm soup', 'the evening train', 'the music'], 'answer': 0},
     ],
     'keywords': ['nine', 'four', 'blue', 'yellow', 'scarf', 'tree', 'soup']},
    {'id': 'story-3', 'title': 'The brown dog', 'text': (
        "On Tuesday evening, Agnes noticed a small brown dog sitting outside the corner shop. It had a red collar "
        "but no name tag. She gave it some water and asked the shopkeeper if he knew the owner. He thought the dog "
        "lived near the school, three streets away. Agnes walked there with the dog trotting happily beside her. "
        "At the school gate she met a boy holding a lead and looking worried. His name was Henry, and the dog was "
        "called Biscuit. Henry explained that Biscuit had slipped out when the postman opened the garden gate. To "
        "say thank you, Henry's father invited Agnes in for tea and a slice of lemon cake."),
     'questions': [
        {'q': 'Where did Agnes find the dog?', 'options': ['at the corner shop', 'at the school gate', 'by the garden gate', 'near the school'], 'answer': 0},
        {'q': 'What was red?', 'options': ['the collar', 'the garden gate', 'the name tag', 'the lemon cake'], 'answer': 0},
        {'q': "What was the dog's name?", 'options': ['Biscuit', 'Henry', 'Agnes', 'Tuesday'], 'answer': 0},
        {'q': 'Who opened the garden gate?', 'options': ['the postman', 'Henry', 'Agnes', 'the boy'], 'answer': 0},
        {'q': "What did Henry's father offer Agnes?", 'options': ['tea and cake', 'some water', 'a red collar', 'a name tag'], 'answer': 0},
     ],
     'keywords': ['brown', 'red', 'collar', 'school', 'biscuit', 'postman', 'lemon']},
    {'id': 'story-4', 'title': 'The surprise', 'text': (
        "June wanted to surprise her friend Walter for his fortieth birthday. She booked a table for eight people "
        "at a small Italian restaurant on the harbour, for Friday at half past seven. Everyone agreed to arrive "
        "early and hide behind the long curtain near the window. On Friday, Walter's sister kept him busy by "
        "asking him to help her move a bookshelf. The plan almost failed when the restaurant called to say that "
        "the oven was broken. The cook offered to make cold dishes instead, and nobody minded. When Walter walked "
        "in at a quarter to eight, the whole group jumped out and sang. He laughed so hard that he dropped his "
        "glasses into the salad."),
     'questions': [
        {'q': 'Where was the restaurant?', 'options': ['on the harbour', 'by the window', 'behind the curtain', "at his sister's"], 'answer': 0},
        {'q': "What did Walter's sister ask him to help with?", 'options': ['a bookshelf', 'the birthday salad', 'the long curtain', 'the broken oven'], 'answer': 0},
        {'q': 'What went wrong at the restaurant?', 'options': ['the oven was broken', 'the window was broken', 'the table was booked', 'the salad was cold'], 'answer': 0},
        {'q': 'Where did everyone hide?', 'options': ['behind the curtain', 'under the table', 'by the window', 'near the harbour'], 'answer': 0},
        {'q': 'What did Walter drop?', 'options': ['his glasses', 'the salad', 'the table', 'the dishes'], 'answer': 0},
     ],
     'keywords': ['fortieth', 'eight', 'curtain', 'bookshelf', 'oven', 'glasses']},
    {'id': 'story-5', 'title': 'The museum', 'text': (
        "Last winter, Ruth took her two nephews to the science museum. They started in the room with the old steam "
        "engines, where a guide in a green jacket showed them how a piston works. The younger boy, Simon, wanted "
        "to see the dinosaurs, but that hall was closed for repairs. Instead they visited the space gallery and "
        "stood inside a model of a rocket. At noon they ate sandwiches on the museum steps, even though it was "
        "cold. In the afternoon there was a short show about lightning, and the presenter made a spark jump "
        "between two metal balls. On the way home, Simon said that next time he wanted to bring his own notebook "
        "and draw everything."),
     'questions': [
        {'q': 'Who took the boys to the museum?', 'options': ['Ruth', 'Simon', 'the guide', 'the presenter'], 'answer': 0},
        {'q': 'What was green?', 'options': ['the jacket', 'the rocket', 'a piston', 'the notebook'], 'answer': 0},
        {'q': 'Why could they not see the dinosaurs?', 'options': ['the hall was closed', 'the museum was cold', 'the show was short', 'the steps were cold'], 'answer': 0},
        {'q': 'Where did they eat lunch?', 'options': ['on the museum steps', 'in the space gallery', 'inside a model rocket', 'in the steam engine room'], 'answer': 0},
        {'q': 'What was the afternoon show about?', 'options': ['lightning', 'dinosaurs', 'steam engines', 'a rocket'], 'answer': 0},
     ],
     'keywords': ['ruth', 'green', 'dinosaurs', 'repairs', 'steps', 'lightning']},
    {'id': 'story-6', 'title': 'The cooking class', 'text': (
        "Every Thursday, Nick goes to a cooking class above the old fire station. This week the teacher, a tall "
        "woman called Olive, showed the group how to make fresh pasta. They mixed flour and eggs by hand, then "
        "rolled the dough until it was so thin that they could see the table through it. Nick's dough kept "
        "tearing, so Olive told him to add a spoonful of water and wait ten minutes. While the dough rested, they "
        "made a sauce from tomatoes, garlic and basil. At the end of the evening, each student took home a box of "
        "pasta. Nick gave half of his to his downstairs neighbour, who had lent him a rolling pin."),
     'questions': [
        {'q': 'Where is the cooking class?', 'options': ['above the fire station', 'next to the fire station', 'below the fire station', "at his neighbour's"], 'answer': 0},
        {'q': 'What did they mix by hand?', 'options': ['flour and eggs', 'garlic and basil', 'tomatoes and basil', 'dough and water'], 'answer': 0},
        {'q': 'What did Olive tell Nick to add?', 'options': ['a spoonful of water', 'a spoonful of flour', 'a spoonful of basil', 'a spoonful of garlic'], 'answer': 0},
        {'q': 'What was in the sauce?', 'options': ['tomatoes, garlic, basil', 'flour, eggs and water', 'eggs, garlic and flour', 'tomatoes, eggs and dough'], 'answer': 0},
        {'q': "Who got half of Nick's pasta?", 'options': ['his neighbour', 'Olive', 'the teacher', 'a student'], 'answer': 0},
     ],
     'keywords': ['fire', 'olive', 'pasta', 'water', 'garlic', 'neighbour']},
    {'id': 'story-7', 'title': 'The bike ride', 'text': (
        "On a bright Sunday in May, Vera and her cousin Leo set off on their bikes to the lake. Leo had packed two "
        "apples, a flask of tea and a map that was ten years old. After an hour they reached a fork in the road. "
        "The map showed a bridge to the left, but a sign said the bridge was closed, so they took the forest path "
        "on the right. It was steep and muddy, and Vera's front tyre went flat near a small farm. A farmer lent "
        "them a pump and told them a shortcut through his orchard. They reached the lake just before noon, ate "
        "the apples on the jetty, and watched a heron catch a fish."),
     'questions': [
        {'q': 'What had Leo packed?', 'options': ['apples and tea', 'a pump and a map', 'a fish and a flask', 'a sign and a map'], 'answer': 0},
        {'q': 'Why did they not take the bridge?', 'options': ['it was closed', 'it was steep and muddy', 'it was ten years old', 'it was on the left'], 'answer': 0},
        {'q': 'What went wrong on the forest path?', 'options': ['a flat tyre', 'a closed bridge', 'a lost flask', 'an old map'], 'answer': 0},
        {'q': 'What did the farmer tell them about?', 'options': ['a shortcut', 'the bridge', 'the lake', 'the forest path'], 'answer': 0},
        {'q': 'What did they watch at the lake?', 'options': ['a heron', 'a farmer', 'an orchard', 'the bridge'], 'answer': 0},
     ],
     'keywords': ['leo', 'bridge', 'closed', 'tyre', 'pump', 'orchard', 'heron']},
    {'id': 'story-8', 'title': 'The power cut', 'text': (
        "Late on Wednesday night, the lights in Edith's building went out during a storm. She found a candle in the "
        "kitchen drawer, but there were no matches, so she knocked on her neighbour's door. Her neighbour, an old "
        "sailor called Tom, had a wind-up radio and a box of matches from an old hotel by the sea. They sat on the stairs "
        "and listened to the news, which said that a falling branch had hit a power line. Tom told stories about a "
        "storm he had sailed through when he was nineteen. At two in the morning the fridge hummed and the lights "
        "came back on. Edith gave Tom a jar of her plum jam to say thank you."),
     'questions': [
        {'q': 'When did the lights go out?', 'options': ['on Wednesday night', 'at two', 'during the news', 'after the storm'], 'answer': 0},
        {'q': 'What did Edith need from her neighbour?', 'options': ['matches', 'a candle', 'a radio', 'a jar of jam'], 'answer': 0},
        {'q': 'What had caused the power cut?', 'options': ['a falling branch', 'the old hotel fridge', 'the radio in the kitchen', 'the kitchen candle'], 'answer': 0},
        {'q': 'When did the lights come back on?', 'options': ['two in the morning', 'on Wednesday night', 'during the storm', 'after the news'], 'answer': 0},
        {'q': 'What did Edith give Tom?', 'options': ['a jar of jam', 'a candle', 'the radio', 'a kitchen drawer'], 'answer': 0},
     ],
     'keywords': ['wednesday', 'candle', 'matches', 'radio', 'branch', 'two', 'plum']},
    {'id': 'story-9', 'title': 'The football match', 'text': (
        "Every Saturday, Peter plays football for a small team called the Rovers. This week they played against "
        "the best team in the league, who had not lost a game all year. It rained so hard that the ball kept "
        "stopping in the puddles. At half time the Rovers were losing by two goals. Their coach, a quiet woman named "
        "Grace, told them to pass the ball along the ground and stay away from the muddy middle. In the second "
        "half, Peter scored with his left foot, and the goalkeeper saved a penalty in the last minute. The game "
        "ended two each. Afterwards, both teams shared hot chocolate in the clubhouse."),
     'questions': [
        {'q': 'What is the team called?', 'options': ['the Rovers', 'the league', 'the best team', 'the clubhouse'], 'answer': 0},
        {'q': 'Where did both teams drink hot chocolate?', 'options': ['the clubhouse', 'the ground', 'the muddy middle', 'the puddles'], 'answer': 0},
        {'q': 'What did the coach tell them to do?', 'options': ['pass along the ground', 'stay in the middle', 'save the penalty', 'score with the left foot'], 'answer': 0},
        {'q': 'How did Peter score?', 'options': ['with his left foot', 'from a penalty', 'at half time', 'from the middle'], 'answer': 0},
        {'q': 'What happened in the last minute?', 'options': ['a penalty was saved', 'Peter scored with his foot', 'the ball kept stopping', 'the Rovers lost a game'], 'answer': 0},
     ],
     'keywords': ['rovers', 'puddles', 'grace', 'ground', 'left', 'penalty', 'chocolate']},
    {'id': 'story-10', 'title': 'The new flat', 'text': (
        "When Arthur moved into his new flat, he found that the previous owner had left behind a parrot. The bird "
        "was grey with a red tail, and it could say three things: hello, good morning, and where are my glasses. "
        "Arthur put a note on the board in the hallway, asking whether anyone knew the owner. Two days later, a "
        "woman phoned him from the coast. She had moved to be near her daughter, and the new building did not "
        "allow pets. She asked Arthur if he would keep the parrot, whose name was Captain. Arthur agreed, and every "
        "month she sends a parcel of sunflower seeds and a postcard of the sea."),
     'questions': [
        {'q': 'What was red?', 'options': ["the bird's tail", 'the postcard', 'the hallway board', 'the parcel'], 'answer': 0},
        {'q': 'What could the parrot say?', 'options': ['where are my glasses', 'where are my seeds', 'where is my daughter', 'where is the owner'], 'answer': 0},
        {'q': 'Where did Arthur put a note?', 'options': ['in the hallway', 'in the new building', 'on the postcard', 'in the parcel'], 'answer': 0},
        {'q': 'Why could the owner not keep the parrot?', 'options': ['pets were not allowed', 'her daughter said no', 'she moved to the sea', 'the bird was grey'], 'answer': 0},
        {'q': 'What does she send every month?', 'options': ['seeds and a postcard', 'glasses and a note', 'a parcel of glasses', 'a note'], 'answer': 0},
     ],
     'keywords': ['grey', 'red', 'glasses', 'hallway', 'coast', 'pets', 'captain', 'sunflower']},
]

TWOVOICES = {'IEO': 'eleven', 'TIE': 'exactly', 'IOM': 'meeting', 'IWW': 'wonder', 'TAI': 'airplane',
             'MTI': 'tomorrow', 'IWL': 'alarm clock', 'ITH': 'doctor', 'DFA': 'jacket', 'ITS': 'seen this',
             'TSI': 'slick', 'WSI': 'minutes'}


def vocab(key):
    if key == 'stories':
        # answers are stored first; the app shuffles options (index 0 = correct before shuffling)
        return [{'id': s['id'], 'title': s['title'], 'text': s['text'], 'questions': s['questions'], 'probe': True}
                for s in STORIES]
    if key == 'matrix':
        return dict(MATRIX, slots=SLOTS)
    if key == 'twovoices':
        import natural
        return [{'id': f'crema-{c.lower()}', 'text': natural.CREMA_SENT[c], 'key': k, 'probe': True}
                for c, k in TWOVOICES.items()]
    raise KeyError(key)


STOP = set('a an the his her their its to of at in on by and for from with it she he they was were is be that '
           'this up out off into over under behind near next above below inside during after before every some no not '
           'my me i you we us our there here so as but or'.split())


def _content(text):
    import re
    toks = [t[:-2] if t.endswith("'s") else t for t in re.findall(r"[a-z']+", text.lower())]
    return [t.strip("'") for t in toks if t.strip("'") and t.strip("'") not in STOP]


def option_cues():
    """Expected accuracy of answer-only responders (chance = 0.25 with 4 options): pick the longest option, the
    shortest option, or an option whose content words all occur in the passage (ties shared equally); and the
    number of questions that offer at least one lure the passage mentions."""
    res = {'longest': 0.0, 'shortest': 0.0, 'middle': 0.0, 'heard': 0.0, 'lure_mentioned': 0, 'questions': 0}
    for st in STORIES:
        heard = set(_content(st['text']))
        for q in st['questions']:
            opts, ans = q['options'], q['answer']
            lens = [len(o) for o in opts]
            for key, pick in (('longest', max(lens)), ('shortest', min(lens))):
                tied = [i for i, n in enumerate(lens) if n == pick]
                res[key] += (1 / len(tied)) if ans in tied else 0.0
            mid = [i for i, n in enumerate(lens) if min(lens) < n < max(lens)]
            res['middle'] += (1 / len(mid)) if ans in mid else (0.0 if mid else 0.25)
            ment = [i for i, o in enumerate(opts) if _content(o) and all(w in heard for w in _content(o))]
            res['heard'] += (1 / len(ment)) if ans in ment else (0.25 if not ment else 0.0)
            res['lure_mentioned'] += any(i != ans for i in ment)
            res['questions'] += 1
    n = res['questions']
    return {k: (round(v / n, 3) if k in ('longest', 'shortest', 'middle', 'heard') else v) for k, v in res.items()}


def overlap_with_published():
    """Words (and verb lemmas) the matrix shares with the published British English matrix (should be none)."""
    ours = {w for k in SLOTS for w in MATRIX[k]}
    theirs = {w for k in SLOTS for w in HALL_2006[k]}
    lemma = {w[:-1] if w.endswith('s') else w for w in MATRIX['verb']}
    return sorted(ours & theirs) + sorted(lemma & HALL_LEMMAS)


if __name__ == '__main__':
    print('overlap with the British English matrix:', overlap_with_published() or 'none')
    print('story option cues (chance 0.25):', option_cues())
    for s in STORIES:
        print(s['id'], len(s['text'].split()), 'words')
    print(matrix_sentences(3), matrix_sentences(2, form=1))
