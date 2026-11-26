"""Repair sentences (training): 80 original pairs ending in the same keyword. 'hi' = the context predicts
the keyword; 'lo' = a neutral frame that does not. Keywords avoid the Crowd nouns, the phrase nouns and the
probe matrix. Word times in the manifest let the app gate or cover any word."""

HI = [
    ('oven', 'She baked the cake for an hour in the oven.'),
    ('honey', 'The bees filled the jar with golden honey.'),
    ('kite', 'On windy days the children fly a kite.'),
    ('snow', 'In winter the mountains are covered with snow.'),
    ('sugar', 'She likes her coffee with cream and sugar.'),
    ('thunder', 'After the lightning we heard the thunder.'),
    ('passport', 'At the border you must show your passport.'),
    ('dentist', 'My tooth hurts, so I am calling the dentist.'),
    ('umbrella', 'It is raining, so take your umbrella.'),
    ('library', 'To borrow some books, she went to the library.'),
    ('butter', 'He spread his toast with a thick layer of butter.'),
    ('helmet', 'Never ride a bike without wearing a helmet.'),
    ('airport', 'We took a taxi to catch our flight at the airport.'),
    ('teeth', 'Before bed, do not forget to brush your teeth.'),
    ('ocean', 'The whale swam far out in the deep blue ocean.'),
    ('alarm', 'I woke up late because I did not hear the alarm.'),
    ('soap', 'Wash your hands with warm water and soap.'),
    ('menu', 'The waiter brought us water and the menu.'),
    ('wedding', 'The bride wore a long white dress at her wedding.'),
    ('eggs', 'The hen sat quietly on her eggs.'),
    ('stairs', 'The lift was broken, so we took the stairs.'),
    ('salt', 'The soup needs a little pepper and salt.'),
    ('coffee', 'Every morning he drinks a mug of black coffee.'),
    ('ink', 'The printer stopped because it ran out of ink.'),
    ('tent', 'When we go camping we sleep in a tent.'),
    ('wool', 'The farmer sheared the sheep for their wool.'),
    ('mail', 'The postman delivers the morning mail.'),
    ('tide', 'The boats float again when in comes the tide.'),
    ('brakes', 'The car stopped fast when he hit the brakes.'),
    ('bucket', 'She carried water from the well in a bucket.'),
    ('jungle', 'Monkeys and parrots live high up in the jungle.'),
    ('mustard', 'On his hot dog he put ketchup and mustard.'),
    ('cheese', 'The little mouse nibbled a piece of cheese.'),
    ('saw', 'To cut the planks, he used a sharp saw.'),
    ('compass', 'Lost in the woods, she checked her map and compass.'),
    ('lawn', 'Every Sunday he mows the lawn.'),
    ('ice', 'Her drink was cold because it was full of ice.'),
    ('smoke', 'Firefighters ran into the building full of smoke.'),
    ('battery', 'The torch went dark because of a flat battery.'),
    ('bridge', 'To cross the river we walked over the bridge.'),
    ('stage', 'At the end, the actors bowed together on the stage.'),
    ('score', 'At the end of the match we checked the score.'),
    ('vote', 'On election day every citizen can cast a vote.'),
    ('cough', 'She stayed at home with a fever and a cough.'),
    ('lunch', 'At noon the workers stopped for lunch.'),
    ('scissors', 'She cut the paper with a pair of scissors.'),
    ('sheep', 'The dog helped the farmer round up the sheep.'),
    ('thread', 'To sew on the patch she needed a needle and thread.'),
    ('diary', 'Every night she writes about her day in her diary.'),
    ('fuel', 'The plane had to land because it was low on fuel.'),
    ('receipt', 'After I paid, the cashier handed me the receipt.'),
    ('beach', 'In summer we swim and play on the beach.'),
    ('violin', 'She played the melody with a bow on her violin.'),
    ('doorbell', 'The visitor arrived and rang the doorbell.'),
    ('haircut', 'My hair is far too long, I need a haircut.'),
    ('desert', 'Camels can walk for days across the desert.'),
    ('medicine', 'The doctor told him to take his medicine.'),
    ('tissue', 'When you sneeze, please use a tissue.'),
    ('sleeves', 'It was warm, so he rolled up his sleeves.'),
    ('joke', 'Everyone laughed out loud at the funny joke.'),
    ('roof', 'The builders fixed the tiles on the roof.'),
    ('wind', 'The leaves were blown away by the wind.'),
    ('watch', 'To check the time, he looked at his watch.'),
    ('puddle', 'The boy jumped right into the muddy puddle.'),
    ('screws', 'He fixed the shelf with a drill and some screws.'),
    ('cinema', 'We bought popcorn before the film at the cinema.'),
    ('salad', 'For a light lunch she made a green salad.'),
    ('cookies', 'After school the children had milk and cookies.'),
    ('homework', 'After school she sat down to do her homework.'),
    ('bath', 'The baby splashed happily in the bath.'),
    ('breakfast', 'In the morning I eat toast for breakfast.'),
    ('purse', 'She paid for the bus with money from her purse.'),
    ('envelope', 'He wrote the address on the front of the envelope.'),
    ('ribbon', 'She tied the present with a shiny ribbon.'),
    ('chalk', 'The teacher wrote on the board with chalk.'),
    ('anchor', 'To stop the ship, the sailors dropped the anchor.'),
    ('glue', 'He fixed the broken vase with some glue.'),
    ('sky', 'The plane flew high up in the sky.'),
    ('nets', 'At dawn the fishermen pulled in their nets.'),
    ('leash', 'Before the walk she clipped on the dog\'s leash.'),
    ('juice', 'For breakfast he drinks orange juice.'),
    ('seatbelt', 'Before you drive off, fasten your seatbelt.'),
    ('rain', 'After the long dry summer the farmers prayed for rain.'),
    ('fence', 'The cows could not get out because of the fence.'),
    ('garage', 'He parked the car in the garage.'),
    ('piano', 'She practised her scales every day on the piano.'),
    ('shampoo', 'She washed her hair with a new shampoo.'),
    ('nurse', 'In the hospital he was looked after by a nurse.'),
    ('prize', 'The winner of the race received a prize.'),
    ('storm', 'The ships stayed in the harbour during the storm.'),
    ('laptop', 'He typed his report on his laptop.'),
    ('pocket', 'He kept his hands warm in his coat pocket.'),
    ('flowers', 'For her birthday he bought a bunch of flowers.'),
    ('mittens', 'To keep her hands warm she wore woolly mittens.'),
    ('hiccups', 'He drank some water to get rid of his hiccups.'),
    ('soup', 'On cold days there is nothing like hot soup.'),
    ('sink', 'After dinner he washed the pots in the sink.'),
    ('balloons', 'For the party they blew up lots of balloons.'),
    ('cereal', 'Each morning she pours milk on her cereal.'),
    ('paint', 'The walls looked new after a fresh coat of paint.'),
]

LO_FRAMES = [
    'She kept talking about the {}.', 'We had not noticed the {}.', 'He asked me about the {}.',
    'Nobody mentioned the {}.', 'They were looking at the {}.', 'I could not remember the {}.',
    'She pointed out the {}.', 'He would not describe the {}.', 'You should think about the {}.',
    'We spent a while discussing the {}.', 'They were surprised by the {}.', 'He wrote a note about the {}.',
    'I heard them mention the {}.', 'She did not care about the {}.', 'He kept staring at the {}.',
    'We could not agree on the {}.', 'They forgot all about the {}.', 'She drew a picture of the {}.',
    'He told a story about the {}.', 'I was reading about the {}.',
]


def lo_text(i, kw):
    return LO_FRAMES[i % len(LO_FRAMES)].format(kw)


# keywords left out to keep the audio budget (their sentences stay here for later builds)
DROPPED = {'saw', 'tide', 'vote', 'nets', 'leash', 'receipt', 'mustard', 'chalk', 'ribbon', 'purse', 'hiccups',
           'mittens', 'shampoo', 'seatbelt', 'doorbell', 'fuel', 'wool', 'mail', 'ink', 'ice'}


def pairs():
    import lexicon
    pool = [k for k, _ in HI if k not in DROPPED]
    out = []
    for i, (kw, hi) in enumerate(HI):
        if kw in DROPPED:
            continue
        assert hi.rstrip('.').split()[-1].lower().strip("'") == kw, (kw, hi)
        near = sorted((lexicon.phon_distance(kw, o), o) for o in pool if o != kw)
        out.append({'id': f'repair-{i + 1:03d}', 'keyword': kw, 'hi': hi, 'lo': lo_text(i, kw),
                    'foils': [o for _, o in near[:3]]})
    return out


def sentences():
    """The engine's shape: one item per sentence, key = index of the keyword in words, pred 'hi' | 'lo',
    alts = keywords of other items (closed set), foils = nearest-sounding keywords."""
    import random
    from common import norm_words
    ps = pairs()
    kws = [p['keyword'] for p in ps]
    rng = random.Random('earshot-repair')
    out = []
    for p in ps:
        others = [k for k in kws if k != p['keyword'] and k not in p['foils']]
        alts = rng.sample(others, 2)
        for pred in ('hi', 'lo'):
            w = norm_words(p[pred])
            out.append({'id': f"{p['id']}-{pred}", 'pair': p['id'], 'text': p[pred], 'words': w,
                        'key': len(w) - 1 - w[::-1].index(p['keyword']), 'keyword': p['keyword'], 'pred': pred,
                        'alts': alts, 'foils': p['foils']})
    return out


def vocab(key):
    if key == 'repair':
        return sentences()
    raise KeyError(key)


if __name__ == '__main__':
    ps = pairs()
    ss = sentences()
    print(len(ps), 'pairs', len(ss), 'sentences', ss[0], ss[1])
    assert len({p['keyword'] for p in ps}) == len(ps)
