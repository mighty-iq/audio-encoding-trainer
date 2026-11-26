"""Probe material for the Lab (never used in training): an original five-slot word matrix and six short
story passages with five multiple-choice questions each. Words and names here appear in no training list
(validate.py checks the matrix against the training vocabulary)."""

# slot keys follow the Lab's reader (js/lab): name, verb, num, adj, obj; every word <= 7 letters and disjoint from
# the training answer words (numbers here start at ten; training numbers are one to nine)
MATRIX = {
    'name': ['alma', 'boris', 'clara', 'dennis', 'elsa', 'frank', 'greta', 'hugo', 'irene', 'oscar'],
    'verb': ['buys', 'finds', 'gets', 'has', 'holds', 'keeps', 'needs', 'sees', 'sells', 'wants'],
    'num': ['ten', 'eleven', 'twelve', 'fifteen', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'eighty'],
    'adj': ['big', 'cheap', 'dark', 'green', 'heavy', 'new', 'old', 'red', 'small', 'white'],
    'obj': ['bowls', 'bricks', 'buttons', 'coins', 'cups', 'gloves', 'knives', 'shirts', 'sticks', 'towels'],
}
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
        out.append({'id': f'mx{form}-{i + 1:02d}', 'text': text, 'words': words})
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
        {'q': 'Who went to the market with Lena?', 'options': ['Paul', 'Simon', 'her sister', 'Henry'], 'answer': 0},
        {'q': 'What did they buy at the first stall?',
         'options': ['pears and plums', 'green apples', 'cherries', 'a melon'], 'answer': 0},
        {'q': 'Where did they wait during the rain?',
         'options': ['under the bakery awning', 'in the library', 'at the bus stop', 'under a tree'], 'answer': 0},
        {'q': 'What had Paul left behind?', 'options': ['his umbrella', 'his wallet', 'his keys', 'his hat'],
         'answer': 0},
        {'q': 'Where did they have the picnic?',
         'options': ["on Lena's balcony", 'in the park', 'by the river', "at Paul's house"], 'answer': 0}],
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
        {'q': 'Which platform did the train leave from?', 'options': ['nine', 'four', 'seven', 'two'], 'answer': 0},
        {'q': "What colour was Martin's suitcase?", 'options': ['blue', 'black', 'red', 'green'], 'answer': 0},
        {'q': 'What was the woman knitting?',
         'options': ['a yellow scarf', 'a blue hat', 'a pair of socks', 'a green jumper'], 'answer': 0},
        {'q': 'Why did the train stop?',
         'options': ['a fallen tree on the line', 'a broken signal', 'a power cut', 'snow on the tracks'],
         'answer': 0},
        {'q': 'What did his grandmother promise?',
         'options': ['to keep the soup warm', 'to meet him at the station', 'to bake a cake', 'to call a taxi'],
         'answer': 0}],
     'keywords': ['nine', 'four', 'blue', 'yellow', 'scarf', 'tree', 'soup']},
    {'id': 'story-3', 'title': 'The brown dog', 'text': (
        "On Tuesday evening, Agnes noticed a small brown dog sitting outside the corner shop. It had a red collar "
        "but no name tag. She gave it some water and asked the shopkeeper if he knew the owner. He thought the dog "
        "lived near the school, three streets away. Agnes walked there with the dog trotting happily beside her. "
        "At the school gate she met a boy holding a lead and looking worried. His name was Henry, and the dog was "
        "called Biscuit. Henry explained that Biscuit had slipped out when the postman opened the garden gate. To "
        "say thank you, Henry's father invited Agnes in for tea and a slice of lemon cake."),
     'questions': [
        {'q': 'Where did Agnes find the dog?',
         'options': ['outside the corner shop', 'in the park', 'at the school gate', 'by the bus stop'], 'answer': 0},
        {'q': "What colour was the dog's collar?", 'options': ['red', 'blue', 'green', 'black'], 'answer': 0},
        {'q': "What was the dog's name?", 'options': ['Biscuit', 'Buttons', 'Pepper', 'Muffin'], 'answer': 0},
        {'q': 'How did the dog get out?',
         'options': ['the postman opened the gate', 'a door was left open', 'it jumped a fence', 'its lead broke'],
         'answer': 0},
        {'q': "What did Henry's father offer Agnes?",
         'options': ['tea and lemon cake', 'a reward', 'a lift home', 'coffee and biscuits'], 'answer': 0}],
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
        {'q': 'Which birthday was Walter having?', 'options': ['fortieth', 'fiftieth', 'thirtieth', 'sixtieth'],
         'answer': 0},
        {'q': 'How many people was the table for?', 'options': ['eight', 'six', 'ten', 'twelve'], 'answer': 0},
        {'q': "How did Walter's sister keep him busy?",
         'options': ['moving a bookshelf', 'shopping for shoes', 'a trip to the cinema', 'fixing her car'],
         'answer': 0},
        {'q': 'What went wrong at the restaurant?',
         'options': ['the oven was broken', 'the table was double booked', 'the cook was ill', 'the lights went out'],
         'answer': 0},
        {'q': 'What did Walter drop?', 'options': ['his glasses', 'his phone', 'his keys', 'his drink'], 'answer': 0}],
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
        {'q': 'Who took the boys to the museum?', 'options': ['Ruth', 'Edith', 'Olive', 'Vera'], 'answer': 0},
        {'q': "What colour was the guide's jacket?", 'options': ['green', 'red', 'grey', 'yellow'], 'answer': 0},
        {'q': 'Why could they not see the dinosaurs?',
         'options': ['the hall was closed for repairs', 'they ran out of time', 'it was too crowded',
                     'the tickets were sold out'], 'answer': 0},
        {'q': 'Where did they eat lunch?',
         'options': ['on the museum steps', 'in the museum cafe', 'in the park', 'on the bus'], 'answer': 0},
        {'q': 'What was the afternoon show about?', 'options': ['lightning', 'volcanoes', 'the moon', 'magnets'],
         'answer': 0}],
     'keywords': ['ruth', 'green', 'dinosaurs', 'repairs', 'steps', 'lightning']},
    {'id': 'story-6', 'title': 'The cooking class', 'text': (
        "Every Thursday, Nick goes to a cooking class above the old fire station. This week the teacher, a tall "
        "woman called Olive, showed the group how to make fresh pasta. They mixed flour and eggs by hand, then "
        "rolled the dough until it was so thin that they could see the table through it. Nick's dough kept "
        "tearing, so Olive told him to add a spoonful of water and wait ten minutes. While the dough rested, they "
        "made a sauce from tomatoes, garlic and basil. At the end of the evening, each student took home a box of "
        "pasta. Nick gave half of his to his downstairs neighbour, who had lent him a rolling pin."),
     'questions': [
        {'q': 'Where is the cooking class?',
         'options': ['above the old fire station', 'in a school kitchen', 'behind the library', 'in a restaurant'],
         'answer': 0},
        {'q': 'What did they make this week?', 'options': ['fresh pasta', 'bread', 'dumplings', 'pizza'], 'answer': 0},
        {'q': 'What did Olive tell Nick to add?',
         'options': ['a spoonful of water', 'more flour', 'an egg', 'some oil'], 'answer': 0},
        {'q': 'What was in the sauce?',
         'options': ['tomatoes, garlic and basil', 'cream and mushrooms', 'cheese and pepper', 'onions and peas'],
         'answer': 0},
        {'q': "Who got half of Nick's pasta?",
         'options': ['his downstairs neighbour', 'his sister', 'the teacher', 'a friend from work'], 'answer': 0}],
     'keywords': ['fire', 'olive', 'pasta', 'water', 'garlic', 'neighbour']},
    {'id': 'story-7', 'title': 'The bike ride', 'text': (
        "On a bright Sunday in May, Vera and her cousin Leo set off on their bikes to the lake. Leo had packed two "
        "apples, a flask of tea and a map that was ten years old. After an hour they reached a fork in the road. "
        "The map showed a bridge to the left, but a sign said the bridge was closed, so they took the forest path "
        "on the right. It was steep and muddy, and Vera's front tyre went flat near a small farm. A farmer lent "
        "them a pump and told them a shortcut through his orchard. They reached the lake just before noon, ate "
        "the apples on the jetty, and watched a heron catch a fish."),
     'questions': [
        {'q': 'Who went with Vera?', 'options': ['her cousin Leo', 'her brother Sam', 'her friend June', 'her uncle'],
         'answer': 0},
        {'q': 'Why did they not take the bridge?',
         'options': ['a sign said it was closed', 'the map was wrong', 'it was too steep', 'a farmer warned them'],
         'answer': 0},
        {'q': 'What went wrong on the forest path?',
         'options': ["Vera's front tyre went flat", 'Leo lost the map', 'the chain broke', 'it started to snow'],
         'answer': 0},
        {'q': 'What did the farmer lend them?', 'options': ['a pump', 'a torch', 'a rope', 'a spanner'], 'answer': 0},
        {'q': 'What did they watch at the lake?',
         'options': ['a heron catching a fish', 'children swimming', 'a sailing race', 'two swans'], 'answer': 0}],
     'keywords': ['leo', 'bridge', 'closed', 'tyre', 'pump', 'orchard', 'heron']},
    {'id': 'story-8', 'title': 'The power cut', 'text': (
        "Late on Wednesday night, the lights in Edith's building went out during a storm. She found a candle in the "
        "kitchen drawer, but there were no matches, so she knocked on her neighbour's door. Her neighbour, an old "
        "sailor called Tom, had a wind-up radio and a box of matches from an old hotel by the sea. They sat on the stairs "
        "and listened to the news, which said that a falling branch had hit a power line. Tom told stories about a "
        "storm he had sailed through when he was nineteen. At two in the morning the fridge hummed and the lights "
        "came back on. Edith gave Tom a jar of her plum jam to say thank you."),
     'questions': [
        {'q': 'When did the lights go out?', 'options': ['Wednesday night', 'Tuesday morning', 'Friday evening',
                                                          'Sunday afternoon'], 'answer': 0},
        {'q': 'What did Edith need from her neighbour?', 'options': ['matches', 'a candle', 'a torch', 'batteries'],
         'answer': 0},
        {'q': 'What had caused the power cut?',
         'options': ['a falling branch hit a power line', 'lightning hit the building', 'a flood in the cellar',
                     'a broken fuse'], 'answer': 0},
        {'q': 'When did the lights come back on?', 'options': ['at two in the morning', 'at midnight', 'at dawn',
                                                               'at four in the morning'], 'answer': 0},
        {'q': 'What did Edith give Tom?', 'options': ['a jar of plum jam', 'a cake', 'a bottle of wine',
                                                      'a new radio'], 'answer': 0}],
     'keywords': ['wednesday', 'candle', 'matches', 'radio', 'branch', 'two', 'plum']},
    {'id': 'story-9', 'title': 'The football match', 'text': (
        "Every Saturday, Peter plays football for a small team called the Rovers. This week they played against "
        "the best team in the league, who had not lost a game all year. It rained so hard that the ball kept "
        "stopping in the puddles. At half time the Rovers were losing by two goals. Their coach, a quiet woman named "
        "Grace, told them to pass the ball along the ground and stay away from the muddy middle. In the second "
        "half, Peter scored with his left foot, and the goalkeeper saved a penalty in the last minute. The game "
        "ended two each. Afterwards, both teams shared hot chocolate in the clubhouse."),
     'questions': [
        {'q': 'What is the name of the team?', 'options': ['the Rovers', 'the Rangers', 'the Lions', 'the Comets'],
         'answer': 0},
        {'q': 'What was the score at half time?',
         'options': ['the Rovers were two goals down', 'it was nil all', 'the Rovers were one goal up',
                     'it was one each'], 'answer': 0},
        {'q': 'What did the coach tell them?',
         'options': ['to pass along the ground', 'to shoot from far away', 'to defend more', 'to run faster'],
         'answer': 0},
        {'q': 'How did Peter score?', 'options': ['with his left foot', 'with a header', 'from a penalty',
                                                  'with his right foot'], 'answer': 0},
        {'q': 'How did the game end?', 'options': ['two each', 'three two to the Rovers', 'one nil to the other team',
                                                   'nil all'], 'answer': 0}],
     'keywords': ['rovers', 'puddles', 'grace', 'ground', 'left', 'penalty', 'chocolate']},
    {'id': 'story-10', 'title': 'The new flat', 'text': (
        "When Arthur moved into his new flat, he found that the previous owner had left behind a parrot. The bird "
        "was grey with a red tail, and it could say three things: hello, good morning, and where are my glasses. "
        "Arthur put a note on the board in the hallway, asking whether anyone knew the owner. Two days later, a "
        "woman phoned him from the coast. She had moved to be near her daughter, and the new building did not "
        "allow pets. She asked Arthur if he would keep the parrot, whose name was Captain. Arthur agreed, and every "
        "month she sends a parcel of sunflower seeds and a postcard of the sea."),
     'questions': [
        {'q': "What colour was the parrot's tail?", 'options': ['red', 'green', 'yellow', 'blue'], 'answer': 0},
        {'q': 'Which of these could the parrot say?',
         'options': ['where are my glasses', 'pretty bird', 'what time is it', 'good night'], 'answer': 0},
        {'q': 'Where did Arthur put a note?', 'options': ['on the board in the hallway', 'on the front door',
                                                         'in the local paper', 'at the shop'], 'answer': 0},
        {'q': 'Why could the owner not keep the parrot?',
         'options': ['her new building did not allow pets', 'she was allergic', 'the bird was too loud',
                     'she was travelling'], 'answer': 0},
        {'q': 'What does she send every month?',
         'options': ['sunflower seeds and a postcard', 'money for food', 'a new cage', 'photos of her daughter'],
         'answer': 0}],
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


if __name__ == '__main__':
    for s in STORIES:
        print(s['id'], len(s['text'].split()), 'words')
    print(matrix_sentences(3), matrix_sentences(2, form=1))
