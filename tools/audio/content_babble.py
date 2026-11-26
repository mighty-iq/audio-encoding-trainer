"""Original everyday sentences used only to build babble and background talkers (never scored).
They avoid the training nouns and call signs where possible so a masker word is not mistaken for a target."""

BABBLE = [
    'We could take the early bus if the weather holds up.',
    'I already told them the meeting moved to Thursday afternoon.',
    'She said the new place opens later than the old one.',
    'Honestly I think the second option was much better.',
    'They painted the kitchen over the long weekend.',
    'If you see the manager, ask about the parking permit.',
    'My brother keeps forgetting where he leaves his wallet.',
    'The film was fine, but the ending felt rushed.',
    'We should probably order before the kitchen closes.',
    'He finally fixed the leak under the bathroom sink.',
    'Do you remember the name of that little bakery?',
    'Let me check the timetable online first.',
    'The music upstairs went on until almost midnight.',
    'I would rather walk, it is only ten minutes from here.',
    'Somebody left a basket of oranges on the front step.',
    'We ran out of milk again this morning.',
    'The tickets were cheaper than I expected.',
    'Could you send me the photos from the trip?',
    'The garden looks so different after all that rain.',
    'Her new job starts at the beginning of next month.',
    'I think the printer upstairs is broken again.',
    'They want to visit the museum while it is quiet.',
    'Turn left after the bridge and keep going straight.',
    'The soup tastes better the day after you make it.',
    'Nobody expected the shop to sell out so quickly.',
    'We spent most of the evening talking about school.',
    'Just leave the parcels by the entrance and I will sort them.',
    'The concert started late, so we missed the first song.',
    'It gets really cold here once the sun goes down.',
    'I wonder if the library is open on holidays.',
    'He plays the guitar every evening after dinner.',
    'Shall we sit outside, or is it too windy?',
    'The new neighbours seem friendly enough so far.',
    'Remind me to call my aunt before the weekend.',
    'That was the loudest thunder I have ever heard.',
    'They are building a playground next to the station.',
    'I keep meaning to learn how to swim properly.',
    'The coffee machine at work makes a terrible noise.',
    'We could share a taxi if you are going that way.',
    'Everyone agreed the dessert was the best part.',
]


def items():
    return [{'id': f'babble-{i + 1:03d}', 'text': t} for i, t in enumerate(BABBLE)]
