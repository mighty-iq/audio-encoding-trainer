/* Data fixture with the schema of CONTRACTS §6 (data/voices.js, data/vocab.js, data/manifest.js) plus the fields
   the engine asks for in docs/dev/requests.md. Synthetic and deterministic: no audio, no real people.
   Used by engine tests and simulations until the stimuli pipeline lands. Words and sentences are original. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  ES.data = ES.data || {};
  if (ES.data.manifest && !ES.data.__fixture) return; // real data present: leave it alone

  // ---- tiny deterministic helpers (independent of ES.core.rng) ----
  function h32(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
  function u01(s) { return (h32(s) % 100000) / 100000; }
  function slug(t) { return String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function words(t) { return String(t).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').trim().split(/\s+/); }

  // ---- vocabulary ----
  var names = ['Arrow', 'Bishop', 'Comet', 'Delta', 'Falcon', 'Gecko', 'Harbor', 'Juno', 'Kestrel', 'Lynx', 'Meteor', 'Nova'];
  var numbers = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
    'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'eighty'];
  var numNb = {
    one: ['nine', 'ten'], two: ['ten', 'three'], three: ['two', 'thirteen'], four: ['forty', 'fourteen'], five: ['nine', 'fifty'],
    six: ['sixteen', 'sixty'], seven: ['eleven', 'seventeen'], eight: ['eighty', 'eighteen'], nine: ['five', 'one'],
    ten: ['two', 'twenty'], eleven: ['seven', 'seventeen'], twelve: ['twenty', 'two'], thirteen: ['thirty', 'fourteen'],
    fourteen: ['forty', 'fifteen'], fifteen: ['fifty', 'sixteen'], sixteen: ['sixty', 'six'], seventeen: ['seven', 'eleven'],
    eighteen: ['eighty', 'eight'], twenty: ['twelve', 'thirty'], thirty: ['thirteen', 'forty'], forty: ['fourteen', 'four'],
    fifty: ['fifteen', 'sixty'], sixty: ['sixteen', 'fifty'], eighty: ['eighteen', 'eight']
  };
  // Repair alternatives are answers of other items (closed set). Nouns with real-word phonetic neighbours (minimal pairs or rhymes)
  var nounNb = {
    cup: ['cap', 'pup', 'cut'], bag: ['bat', 'rag', 'back'], hat: ['cat', 'hut', 'ham'], map: ['mop', 'nap', 'mat'],
    pen: ['pin', 'ten', 'pan'], box: ['fox', 'bus', 'rocks'], key: ['tea', 'knee', 'bee'], ring: ['wing', 'rim', 'king'],
    bell: ['shell', 'ball', 'belt'], coat: ['goat', 'coast', 'boat'], boot: ['boat', 'suit', 'root'], cake: ['lake', 'gate', 'cape'],
    lamp: ['camp', 'ramp', 'lap'], rope: ['soap', 'road', 'robe'], ship: ['chip', 'sheep', 'sip'], fork: ['cork', 'fort', 'pork'],
    sock: ['rock', 'sack', 'shock'], bowl: ['goal', 'bone', 'pole'], drum: ['plum', 'drug', 'thumb'], flag: ['flat', 'drag', 'flap'],
    frog: ['fog', 'dog', 'log'], horn: ['corn', 'thorn', 'horse'], jar: ['car', 'jam', 'star'], kite: ['white', 'kit', 'night'],
    leaf: ['beef', 'leash', 'reef'], lock: ['dock', 'lake', 'log'], mask: ['task', 'mass', 'flask'], nail: ['mail', 'tail', 'nine'],
    nest: ['vest', 'net', 'chest'], pear: ['chair', 'bear', 'pie'], pipe: ['wipe', 'pine', 'type'], sail: ['tail', 'scale', 'sale'],
    seal: ['wheel', 'meal', 'seat'], sign: ['line', 'mine', 'sight'], spoon: ['moon', 'spoil', 'soon'], tent: ['cent', 'ten', 'dent'],
    toy: ['boy', 'tie', 'coin'], tray: ['train', 'play', 'tree'], vase: ['face', 'base', 'case'], wing: ['king', 'win', 'sing'],
    bread: ['bed', 'red', 'thread'], brush: ['bush', 'rush', 'blush'], chain: ['train', 'chair', 'cane'], clock: ['flock', 'cloak', 'lock'],
    cloud: ['crowd', 'loud', 'clown'], coin: ['corn', 'join', 'cone'], comb: ['home', 'cone', 'code'], crown: ['clown', 'brown', 'cloud'],
    desk: ['disk', 'dusk', 'deck'], dish: ['fish', 'wish', 'ditch'], door: ['floor', 'four', 'core'], duck: ['truck', 'dock', 'luck'],
    fan: ['van', 'pan', 'fun'], fence: ['tense', 'hence', 'face'], glove: ['love', 'globe', 'dove'], house: ['mouse', 'horse', 'blouse'],
    knife: ['wife', 'night', 'life'], milk: ['silk', 'mill', 'mint'], plate: ['gate', 'plane', 'late'], shoe: ['zoo', 'shoot', 'two'],
    sink: ['pink', 'link', 'zinc'], soup: ['hoop', 'suit', 'loop'], stone: ['phone', 'bone', 'stove'], tooth: ['truth', 'boot', 'youth']
  };
  // Closed set: every neighbour is itself a rendered word, and the relation is symmetric, so a foil is never a
  // word that could not be an answer (a "never the answer" shortcut otherwise appears; see requests.md).
  Object.keys(nounNb).forEach(function (w) {
    nounNb[w].forEach(function (n) { if (!nounNb[n]) nounNb[n] = []; if (nounNb[n].indexOf(w) < 0) nounNb[n].push(w); });
  });
  ['four', 'two', 'nine', 'ten'].forEach(function (n) { delete nounNb[n]; });
  Object.keys(nounNb).forEach(function (w) { nounNb[w] = nounNb[w].filter(function (n) { return nounNb[n] && n !== w; }); });
  var nouns = Object.keys(nounNb).filter(function (w) { return nounNb[w].length; });
  var keyNouns = nouns; // phrase keys cover the whole closed noun set, so neighbour foils are possible answers
  var adjs = ['green', 'quiet', 'round', 'sharp', 'empty', 'heavy', 'bright', 'soft', 'cold', 'tall'];
  var verbs = ['paints', 'folds', 'finds', 'lifts', 'hides', 'sells', 'burns', 'sends', 'drops', 'pulls'];
  var sus = [], phrases = [], i;
  for (i = 0; i < 120; i++) {
    var n1 = keyNouns[(2 * i) % keyNouns.length], n2 = keyNouns[(2 * i + 1 + 2 * (i % 7)) % keyNouns.length];
    if (n2 === n1) n2 = keyNouns[(i * 13 + 6) % keyNouns.length];
    var st = 'the ' + adjs[i % adjs.length] + ' ' + n1 + ' ' + verbs[(i * 3) % verbs.length] + ' a ' + n2;
    sus.push({ id: 'sus-' + i, text: st, words: words(st), keys: [2, 5] });
    var tpl = i % 3;
    var pt = tpl === 0 ? 'please bring the ' + n1 + ' to the ' + n2
      : tpl === 1 ? 'the ' + n1 + ' is next to the ' + n2 : 'can you pass me the ' + n1 + ' and the ' + n2;
    var pw = words(pt);
    phrases.push({ id: 'phr-' + i, text: pt, words: pw, keys: [pw.indexOf(n1), pw.lastIndexOf(n2)] });
  }
  var repair = [
    ['she poured the milk into a cup', 'cup', 'hi', ['vase', 'plate']], ['he locked the door with a key', 'key', 'hi', ['coin', 'comb']],
    ['we ate the soup with a spoon', 'spoon', 'hi', ['plate', 'cup']], ['the boat had a white sail', 'sail', 'hi', ['rope', 'bell']],
    ['she wore a hat on her head', 'hat', 'hi', ['crown', 'mask']], ['he lit the room with a lamp', 'lamp', 'hi', ['pipe', 'comb']],
    ['the bird sat on its nest', 'nest', 'hi', ['fence', 'stone']], ['put the flowers in the vase', 'vase', 'hi', ['sink', 'cup']],
    ['the queen wore a golden crown', 'crown', 'hi', ['hat', 'mask']], ['he washed his hands in the sink', 'sink', 'hi', ['vase', 'cup']],
    ['she carried her books in a bag', 'bag', 'mid', ['hat', 'cup']], ['there was a stone on the path', 'stone', 'mid', ['coin', 'frog']],
    ['he found a coin under the desk', 'coin', 'mid', ['key', 'comb']], ['the children drew a cloud', 'cloud', 'mid', ['frog', 'crown']],
    ['she left the plate by the window', 'plate', 'mid', ['cup', 'vase']], ['we heard a bell in the distance', 'bell', 'mid', ['frog', 'pipe']],
    ['he kept the rope in the shed', 'rope', 'mid', ['bag', 'pipe']], ['they painted the fence last week', 'fence', 'mid', ['plate', 'sail']],
    ['the next word is comb', 'comb', 'lo', ['coin', 'nest']], ['they talked about the frog', 'frog', 'lo', ['bell', 'cloud']],
    ['she thought about the glove', 'glove', 'lo', ['stone', 'lamp']], ['he pointed at the pipe', 'pipe', 'lo', ['rope', 'bag']],
    ['we did not mention the mask', 'mask', 'lo', ['hat', 'sail']], ['you will now hear the word tooth', 'tooth', 'lo', ['key', 'spoon']]
  ].map(function (r, k) {
    var w = words(r[0]);
    return { id: 'rep-' + k, text: r[0], words: w, key: w.lastIndexOf(r[1]), pred: r[2], alts: r[3] };
  });
  var people = ['Anna', 'Ben', 'Carla', 'Dev', 'Ella', 'Femi', 'Gita', 'Hugo', 'Ines', 'Jonah', 'Kira', 'Luca'];
  var places = ['cafe', 'station', 'library', 'bakery', 'cinema', 'museum', 'harbour', 'market'];
  var times = ['half past six', 'seven fifteen', 'eight o clock', 'nine thirty', 'ten to five', 'quarter past two'];
  var days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  var items = ['umbrella', 'ticket', 'charger', 'notebook', 'scarf', 'camera'];
  var plats = ['four', 'seven', 'eleven', 'fifteen', 'twenty', 'thirty'];
  var echo = [];
  for (i = 0; i < 80; i++) {
    var nf = 2 + (i % 4), f = [];
    var who = people[i % people.length], pl = places[(i * 3) % places.length], tm = times[(i * 5) % times.length];
    var dy = days[(i * 7) % days.length], it = items[(i * 11) % items.length], pf = plats[(i * 13) % plats.length];
    var parts = ['meet ' + who]; f.push({ cat: 'name', value: who, q: 'Who will you meet?' });
    parts.push('at the ' + pl); f.push({ cat: 'place', value: pl, q: 'Where will you meet?' });
    if (nf >= 3) { parts.push('at ' + tm); f.push({ cat: 'time', value: tm, q: 'At what time?' }); }
    if (nf >= 4) { parts.push('on ' + dy); f.push({ cat: 'day', value: dy, q: 'Which day?' }); }
    if (nf >= 5) { parts.push('and bring the ' + it); f.push({ cat: 'item', value: it, q: 'What should you bring?' }); }
    if (i % 5 === 4 && nf < 5) { parts.push('from platform ' + pf); f.push({ cat: 'number', value: pf, q: 'Which platform?' }); }
    var et = parts.join(' ');
    echo.push({ id: 'echo-' + i, text: et, words: words(et), facts: f });
  }
  var catValues = { name: people, place: places, time: times, day: days, item: items, number: plats };
  var matrix = { name: ['Abel', 'Bea', 'Cyrus', 'Dana', 'Elio', 'Fern', 'Gus', 'Hana', 'Ivo', 'Jade'],
    verb: ['buys', 'finds', 'gives', 'holds', 'keeps', 'likes', 'lends', 'owns', 'sees', 'wants'],
    num: ['nine', 'twelve', 'many', 'few', 'some', 'nineteen', 'seventy', 'ninety', 'several', 'dozens'],
    adj: ['blue', 'big', 'old', 'new', 'odd', 'wet', 'dry', 'cheap', 'fine', 'red'],
    obj: ['kites', 'chairs', 'shoes', 'rings', 'spoons', 'bikes', 'cars', 'books', 'cups', 'plants'] };
  var stories = [{ id: 'story-0', text: 'a short passage for the probe only' }, { id: 'story-1', text: 'another passage for the probe only' }];

  // ---- voices ----
  var voices = {}, castNames = ['Maya', 'Omar', 'Lena', 'Tariq', 'Sofia', 'Felix', 'Nadia', 'Ravi', 'Ines', 'Hugo', 'Zara', 'Mateo',
    'Priya', 'Jonas', 'Aiko', 'Diego', 'Elif', 'Kofi', 'Mila', 'Oscar', 'Rosa', 'Sami', 'Talia', 'Viktor', 'Wren', 'Yusuf',
    'Amara', 'Bruno', 'Celia', 'Dario'];
  var ci = 0;
  function addVoice(id, src, sex, accent, set, tier) {
    var f0 = sex === 'f' ? 165 + Math.round(u01(id + 'f0') * 75) : 88 + Math.round(u01(id + 'f0') * 55);
    var v = { src: src, sex: sex, accent: accent, set: set, f0: f0, licence: src === 'kokoro' ? 'Apache-2.0' : src === 'piper-libritts' ? 'CC-BY-4.0' : 'fixture' };
    if (tier) v.tier = tier;
    if (set === 'train' && ci < castNames.length && src !== 'cremad') { v.cast = { name: castNames[ci], blurb: 'A fixture voice.' }; ci++; }
    voices[id] = v;
  }
  for (i = 1; i <= 10; i++) { addVoice('kokoro.f' + (i < 10 ? '0' : '') + i, 'kokoro', 'f', i % 3 ? 'us' : 'gb', 'train'); addVoice('kokoro.m' + (i < 10 ? '0' : '') + i, 'kokoro', 'm', i % 3 ? 'us' : 'gb', 'train'); }
  ['es', 'fr', 'it', 'zh', 'hi', 'ja', 'pt'].forEach(function (a, k) { addVoice('kokoro.' + a + '_f', 'kokoro', 'f', a, 'train', 1 + (k % 3)); addVoice('kokoro.' + a + '_m', 'kokoro', 'm', a, 'train', 1 + ((k + 1) % 3)); });
  for (i = 101; i <= 112; i++) addVoice('piper.p' + i, 'piper-libritts', i % 2 ? 'f' : 'm', 'us', 'train');
  for (i = 1; i <= 4; i++) addVoice('speechocean.s0' + i, 'speechocean', i % 2 ? 'f' : 'm', 'zh', 'train', 2 + (i % 2));
  for (i = 1; i <= 4; i++) addVoice('cremad.a10' + (10 + i), 'cremad', i % 2 ? 'f' : 'm', 'us', 'train');
  ['kokoro.fp1', 'kokoro.mp1', 'piper.p901', 'piper.p902'].forEach(function (id, k) { addVoice(id, id.split('.')[0] === 'piper' ? 'piper-libritts' : 'kokoro', k % 2 ? 'm' : 'f', 'us', 'probe'); });
  for (i = 1; i <= 4; i++) addVoice('audiomnist.d0' + i, 'audiomnist', i % 2 ? 'm' : 'f', 'de', 'probe');
  addVoice('kokoro.ko_f', 'kokoro', 'f', 'ko', 'probe', 2);

  // ---- manifest ----
  var clips = {};
  function addClip(voice, kind, text, extra) {
    var id = voice + '.' + kind + '.' + slug(text);
    if (clips[id]) id += '.2';
    var w = words(text), dur = 0.18 + 0.3 * w.length;
    var c = { pack: voices[voice].set === 'probe' ? 'probe' : 'core', voice: voice, kind: kind, text: text, words: w,
      dur: Math.round(dur * 100) / 100, adb: -23 + Math.round(u01(id + 'a') * 40) / 10, set: voices[voice].set,
      asr: { ok: u01(id + 'asr') > 0.03 }, diff: Math.round((u01(id + 'd') * 4 - 2) * 10) / 10 };
    if (w.length > 1) c.wt = w.map(function (_, k) { return [Math.round((0.09 + 0.3 * k) * 100) / 100, Math.round((0.09 + 0.3 * k + 0.26) * 100) / 100]; });
    for (var k in extra) c[k] = extra[k];
    clips[id] = c;
    return id;
  }
  Object.keys(voices).forEach(function (v) {
    var vo = voices[v];
    if (vo.set === 'probe') {
      numbers.slice(0, 10).forEach(function (n) { addClip(v, 'digit', n); });
      ['Abel buys nine blue kites', 'Bea finds twelve old chairs'].forEach(function (s) { addClip(v, 'sentence', s); });
      return;
    }
    if (vo.src === 'cremad') { phrases.slice(0, 8).forEach(function (p) { addClip(v, 'sentence', p.text); }); return; }
    names.forEach(function (n) { addClip(v, 'name', n); });
    numbers.forEach(function (n) { addClip(v, 'number', n); });
    nouns.forEach(function (n) { addClip(v, 'word', n); });
    [sus, phrases, repair, echo].forEach(function (list, li) {
      list.forEach(function (it) { if (u01(v + it.id + li) < 0.55) addClip(v, 'sentence', it.text); });
    });
    if (vo.cast) addClip(v, 'intro', 'hi I am ' + vo.cast.name + ' nice to meet you');
  });
  ['babble', 'cafe', 'party', 'street', 'station', 'hall', 'hum', 'babble'].forEach(function (b, k) {
    clips['bed.' + b + '.' + k] = { pack: 'core', voice: null, kind: 'bed', bed: b, text: b, words: [], dur: 12, adb: -26, set: 'train', asr: { ok: true } };
  });
  clips['bed.cafe.probe'] = { pack: 'probe', voice: null, kind: 'bed', bed: 'cafe', text: 'cafe', words: [], dur: 12, adb: -26, set: 'probe', asr: { ok: true } };

  var vocabNb = {};
  Object.keys(nounNb).forEach(function (k) { vocabNb[k] = nounNb[k]; });
  Object.keys(numNb).forEach(function (k) { vocabNb[k] = numNb[k]; });
  var intros = {};
  Object.keys(voices).forEach(function (v) { if (voices[v].cast) intros[v] = 'hi I am ' + voices[v].cast.name + ' nice to meet you'; });
  var rhymes = { at: ['hat', 'cat', 'bat', 'mat', 'flat'], ing: ['ring', 'wing', 'king', 'sing'], ail: ['nail', 'sail', 'tail', 'mail', 'scale'] };

  ES.data.voices = voices;
  ES.data.vocab = { names: names, numbers: numbers, nouns: nouns, rhymes: rhymes, neighbours: vocabNb, sus: sus, phrases: phrases,
    repair: repair, echo: echo, echoValues: catValues, intros: intros, stories: stories, matrix: matrix };
  ES.data.manifest = { version: 'fixture-1', clips: clips };
  ES.data.packs = { core: { bytes: 0, exercises: ['crowd', 'far', 'strange', 'repair', 'echo', 'seek', 'voices'] }, probe: { bytes: 0, exercises: [] } };
  ES.data.__fixture = true;
})(typeof window !== 'undefined' ? window : globalThis);
