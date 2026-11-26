/* Lab test fixture: probe materials with the shapes requested from stimuli (docs/dev/requests.md, lab → stimuli):
   probe voices (set 'probe'), matrix words per probe voice (kind 'word'), digits (kind 'digit'), two-voices
   sentences (kind 'sentence' + vocab.twovoices), stories with questions (kind 'story' + vocab.stories), a probe
   café bed, and vocab.probeVoices. Synthetic and deterministic: no audio here (tests/fixtures/lab-audio.js holds
   synthetic sounds for browser tests), no real people. All texts are original fixture text.
   Loads after the real data or the engine's data fixture and only fills what is missing; never touches training
   clips. Test fixture only; never shipped. MIT licence. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var D = ES.data = ES.data || {};
  D.voices = D.voices || {};
  D.manifest = D.manifest || { version: 'lab-fixture-1', clips: {} };
  D.manifest.clips = D.manifest.clips || {};
  D.vocab = D.vocab || {};
  var V = D.voices, C = D.manifest.clips, VO = D.vocab;

  function h32(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
  function u01(s) { return (h32(s) % 100000) / 100000; }
  function slug(t) { return String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function words(t) { return String(t).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').trim().split(/\s+/); }
  function voice(id, src, sex, accent) {
    if (!V[id]) V[id] = { src: src, sex: sex, accent: accent, set: 'probe', f0: sex === 'f' ? 190 : 115, licence: 'fixture' };
    return id;
  }
  function clip(v, kind, text, dur, extra) {
    var id = v + '.' + kind + '.' + slug(text);
    if (C[id]) return id;
    var c = { pack: 'probe', voice: v, kind: kind, text: text, words: words(text), dur: dur, adb: -23, set: 'probe', asr: { ok: true },
      diff: Math.round((u01(id) * 2 - 1) * 10) / 10 };
    if (extra) for (var k in extra) c[k] = extra[k];
    C[id] = c;
    return id;
  }

  // ---- Matrix vocabulary (only if the data have none): five slots of ten words, ≤ 7 letters, disjoint from training
  if (!VO.matrix || !VO.matrix.obj) {
    VO.matrix = {
      name: ['Alma', 'Boris', 'Cleo', 'Dmitri', 'Esme', 'Farid', 'Greta', 'Hamid', 'Iris', 'Jonas'],
      verb: ['brings', 'counts', 'draws', 'fixes', 'gets', 'moves', 'orders', 'rents', 'takes', 'wins'],
      num: ['no', 'few', 'some', 'many', 'several', 'dozens', 'plenty', 'seventy', 'ninety', 'nineteen'],
      adj: ['amber', 'big', 'cheap', 'dusty', 'fancy', 'giant', 'golden', 'hollow', 'plain', 'rusty'],
      obj: ['apples', 'baskets', 'candles', 'helmets', 'ladders', 'magnets', 'pillows', 'rockets', 'saddles', 'wagons']
    };
  }
  var kore = voice('kokoro.af_kore', 'kokoro', 'f', 'us'), lewis = voice('kokoro.bm_lewis', 'kokoro', 'm', 'gb');
  var river = voice('kokoro.af_river', 'kokoro', 'f', 'us'), jess = voice('kokoro.af_jessica', 'kokoro', 'f', 'us');
  [kore, lewis, river, jess].forEach(function (v) {
    Object.keys(VO.matrix).forEach(function (slot) {
      VO.matrix[slot].forEach(function (w) { clip(v, 'word', w, Math.round((0.32 + 0.05 * Math.min(4, String(w).length - 2)) * 100) / 100); });
    });
  });
  VO.probeVoices = VO.probeVoices || { matrix: [kore, lewis], rooms: [kore, lewis], newvoice: [river, jess], story: [kore, lewis] };

  // ---- Digits: six recorded talkers (fixture stand-ins), 'zero' … 'nine'
  var DIG = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  ['f', 'm', 'f', 'm', 'f', 'm'].forEach(function (sex, i) {
    var v = voice('audiomnist.p0' + (i + 1), 'audiomnist', sex, i % 2 ? 'de' : 'us');
    DIG.forEach(function (d) { clip(v, 'digit', d, 0.42); });
  });

  // ---- Two voices: original fixture sentences with one-word answer labels, eight recorded talkers
  if (!VO.twovoices || !VO.twovoices.length) {
    VO.twovoices = [
      ['The red kettle is on the stove', 'kettle'], ['We will leave before the rain starts', 'rain'],
      ['My brother lost his blue umbrella', 'umbrella'], ['Please close the window in the hall', 'window'],
      ['The train was late again this morning', 'train'], ['She bought fresh bread at the market', 'bread']
    ].map(function (x, i) { return { id: 'tv-' + i, text: x[0], key: x[1] }; });
  }
  ['f', 'f', 'f', 'f', 'm', 'm', 'm', 'm'].forEach(function (sex, i) {
    var v = voice('cremad.p0' + (i + 1), 'cremad', sex, 'us');
    VO.twovoices.forEach(function (it) { clip(v, 'sentence', it.text, 1.6); });
  });

  // ---- Stories: original fixture passages with five questions each
  if (!VO.stories || !VO.stories.some(function (s) { return s && s.questions; })) {
    VO.stories = [
      { id: 'story-f0', title: 'The late ferry', text: 'Mara missed the six o clock ferry because her bike had a flat tyre. She waited at the harbour cafe, where a fisherman told her the next boat left at seven. He said the fog would lift by then. Mara bought a cup of soup and a map of the island. When the seven o clock ferry arrived, it was painted green and only half full.',
        questions: [{ q: 'Why did Mara miss the first ferry?', options: ['A flat tyre', 'She overslept', 'The road was closed', 'She lost her ticket'], answer: 'A flat tyre' },
          { q: 'When did the next boat leave?', options: ['At seven', 'At six', 'At eight', 'At half past six'], answer: 'At seven' },
          { q: 'Who told her about the next boat?', options: ['A fisherman', 'A waiter', 'The captain', 'Her friend'], answer: 'A fisherman' },
          { q: 'What did she buy?', options: ['Soup and a map', 'Tea and a cake', 'A ticket and a hat', 'Bread and cheese'], answer: 'Soup and a map' },
          { q: 'What colour was the ferry?', options: ['Green', 'White', 'Red', 'Blue'], answer: 'Green' }] },
      { id: 'story-f1', title: 'The garden club', text: 'The garden club meets every Thursday in the old school hall. This week Tomas brought forty tomato plants, and Ines brought a box of tulip bulbs from her aunt. The club voted to plant the bulbs by the library before the first frost. Afterwards they shared a lemon cake. Next week they will repair the broken fence near the pond.',
        questions: [{ q: 'Where does the club meet?', options: ['The old school hall', 'The library', 'A church', 'The town square'], answer: 'The old school hall' },
          { q: 'How many tomato plants did Tomas bring?', options: ['Forty', 'Fourteen', 'Four', 'Twenty'], answer: 'Forty' },
          { q: 'Where did the tulip bulbs come from?', options: ['Her aunt', 'A shop', 'The market', 'Her neighbour'], answer: 'Her aunt' },
          { q: 'Where will they plant the bulbs?', options: ['By the library', 'By the pond', 'At the school', 'In the park'], answer: 'By the library' },
          { q: 'What will they do next week?', options: ['Repair a fence', 'Paint the hall', 'Sell plants', 'Plant trees'], answer: 'Repair a fence' }] },
      { id: 'story-f2', title: 'The lost dog', text: 'On Sunday morning a small brown dog walked into the bakery on Hill Street. It wore a red collar with the name Pepper. The baker gave it water and called the number on the tag. A woman arrived twenty minutes later on a scooter. She said Pepper had chased a cat across the bridge and got lost. She bought two loaves to say thank you.',
        questions: [{ q: 'Where did the dog walk in?', options: ['A bakery', 'A library', 'A school', 'A bank'], answer: 'A bakery' },
          { q: 'What was the dog called?', options: ['Pepper', 'Ginger', 'Buddy', 'Max'], answer: 'Pepper' },
          { q: 'How did the owner arrive?', options: ['On a scooter', 'By bus', 'On foot', 'By car'], answer: 'On a scooter' },
          { q: 'What had the dog chased?', options: ['A cat', 'A ball', 'A bird', 'A bicycle'], answer: 'A cat' },
          { q: 'What did the owner buy?', options: ['Two loaves', 'A cake', 'Six rolls', 'Some coffee'], answer: 'Two loaves' }] }
    ];
  }
  VO.stories.forEach(function (s) { if (s.questions) [kore, lewis].forEach(function (v) { clip(v, 'story', s.title || s.id, 50, { story: s.id, words: [] }); }); });
  if (!Object.keys(C).some(function (id) { return C[id].kind === 'bed' && C[id].set === 'probe'; })) {
    C['bed.cafe.probe'] = { pack: 'probe', voice: null, kind: 'bed', bed: 'cafe', text: 'cafe', words: [], dur: 12, adb: -26, set: 'probe', asr: { ok: true } };
  }
  D.packs = D.packs || {};
  if (!D.packs.probe) D.packs.probe = { bytes: 0, exercises: [] };
  D.__labFixture = true;
})(typeof window !== 'undefined' ? window : globalThis);
