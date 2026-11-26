/* ES.game.data — the Night out: twelve venues, each a family of dial settings (pure data; loads in Node).
   Three lines leave "you": Many voices (Crowd: café → concert), Far & echoey (Far: lecture hall → cathedral) and the
   Phone line (Strange voices, phone family). Each venue has a headline condition — "your earshot here" is the level
   of its dial where the engine's model predicts 72 % right with the venue's other dials pinned — plus "also here"
   conditions from other exercises. Headline pins were calibrated with simulated learners through the engine's
   planner and flow (tests/unit/game-calibrate.mjs; docs/dev/progress/game.md) so each line climbs in steps a
   beginner can take; they differ from path.js STAGES where those were out of reach for the simulated population.
   A venue opens when the previous venue on its line reaches `opens.at` (the head dial's own units: dB, or a level
   index for ordinal dials such as distance) and the venue itself is within reach (the model finds a level of its
   dial with 72 % right); once open it never closes.
   Map geometry: each line is a ray from "you" (deg: 0 = up, + = right); a venue sits on ring `step + 1`. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  ES.game = ES.game || {};

  var LINES = [
    { id: 'crowd', name: 'Many voices', deg: 30, what: 'More voices, and voices more like the one you follow.' },
    { id: 'far', name: 'Far & echoey', deg: -30, what: 'Further away, with more echo and more room noise.' },
    { id: 'phone', name: 'Phone line', deg: 180, what: 'One voice through a narrowing line.' }
  ];

  // head: {ex, pin, dial} — the condition behind "your earshot here". also: more conditions found at the venue.
  var VENUES = [
    { id: 'cafe', name: 'Café', line: 'crowd', step: 0,
      flavour: 'A corner table, one conversation beside yours, cups and chatter behind.',
      head: { ex: 'crowd', pin: { talkers: 0, similar: 0, space: 0 }, dial: 'tmr' },
      also: [{ ex: 'strange', pin: {}, dial: 'accent', label: 'Accents' },
        { ex: 'repair', pin: { context: 0, gate: 0, fill: 0 }, dial: 'gap', label: 'Lost words, strong context' },
        { ex: 'echo', pin: { details: 0, rate: 0, delay: 0 }, dial: 'snr', label: 'Messages with two details' },
        { ex: 'voices', pin: { cast: 0, similar: 0, length: 0 }, dial: 'snr', label: 'Two voices to tell apart' }],
      opens: null },
    { id: 'restaurant', name: 'Restaurant', line: 'crowd', step: 1,
      flavour: 'The next table talks over yours, in a voice of the same sex.',
      head: { ex: 'crowd', pin: { talkers: 0, similar: 1, space: 1 }, dial: 'tmr' },
      also: [{ ex: 'far', pin: { rt60: 3, noise: 15 }, dial: 'dist', label: 'Across the room' },
        { ex: 'echo', pin: { details: 1, rate: 0, delay: 1 }, dial: 'snr', label: 'Messages with three details' },
        { ex: 'voices', pin: { cast: 1, similar: 0, length: 0 }, dial: 'snr', label: 'Three voices to tell apart' }],
      opens: { from: 'cafe', at: 0 } },
    { id: 'bar', name: 'Bar', line: 'crowd', step: 2,
      flavour: 'Two other conversations at the counter.',
      head: { ex: 'crowd', pin: { talkers: 1, similar: 1, space: 3 }, dial: 'tmr' },
      also: [{ ex: 'repair', pin: { context: 1, gate: 1, fill: 1 }, dial: 'gap', label: 'Lost words, some context' },
        { ex: 'echo', pin: { details: 2, rate: 1, delay: 1 }, dial: 'snr', label: 'Four details, a little faster' },
        { ex: 'voices', pin: { cast: 2, similar: 1, length: 1 }, dial: 'snr', label: 'Four similar voices' }],
      opens: { from: 'restaurant', at: -2 } },
    { id: 'party', name: 'House party', line: 'crowd', step: 3,
      flavour: 'Three voices around you in the kitchen, music through the wall.',
      head: { ex: 'crowd', pin: { talkers: 2, similar: 1, space: 4 }, dial: 'tmr' },
      also: [{ ex: 'strange', pin: {}, dial: 'muffled', label: 'Through the wall' },
        { ex: 'repair', pin: { context: 1, gate: 2, fill: 2 }, dial: 'gap', label: 'Broken-up sentences' },
        { ex: 'echo', pin: { details: 3, rate: 2, delay: 2 }, dial: 'snr', label: 'Five details' },
        { ex: 'voices', pin: { cast: 3, similar: 1, length: 2 }, dial: 'snr', label: 'Five voices, short clips' }],
      opens: { from: 'bar', at: -3 } },
    { id: 'club', name: 'Club', line: 'crowd', step: 4,
      flavour: 'Two voices pitched close to the one you follow.',
      head: { ex: 'crowd', pin: { talkers: 1, similar: 2, space: 5 }, dial: 'tmr' },
      also: [{ ex: 'repair', pin: { context: 2, gate: 3, fill: 3 }, dial: 'gap', label: 'Little context, silent gaps' },
        { ex: 'voices', pin: { cast: 4, similar: 2, length: 2 }, dial: 'snr', label: 'Six close voices' }],
      opens: { from: 'party', at: -3 } },
    { id: 'concert', name: 'Concert', line: 'crowd', step: 5,
      flavour: 'A packed floor: three voices pitched close to the one you follow.',
      head: { ex: 'crowd', pin: { talkers: 2, similar: 2, space: 6 }, dial: 'tmr' },
      also: [{ ex: 'strange', pin: {}, dial: 'vocoded', label: 'Robot voices' },
        { ex: 'seek', pin: { decoys: 4, size: 3, gap: 3 }, dial: 'snr', label: 'Crowded floor' }],
      opens: { from: 'club', at: -4 } },
    { id: 'lecture', name: 'Lecture hall', line: 'far', step: 0,
      flavour: 'A talker at the front of a quiet hall with some echo.',
      head: { ex: 'far', pin: { rt60: 3, noise: 15 }, dial: 'dist' },
      also: [{ ex: 'strange', pin: {}, dial: 'whisper', label: 'Whispers at the back' }],
      opens: null },
    { id: 'park', name: 'Park', line: 'far', step: 1,
      flavour: 'Outdoors: almost no echo, but traffic and wind not far below speech.',
      head: { ex: 'far', pin: { rt60: 0, noise: 9 }, dial: 'dist' },
      also: [{ ex: 'seek', pin: { decoys: 0, size: 0, gap: 0 }, dial: 'snr', label: 'Find a voice in the open' }],
      opens: { from: 'lecture', at: 3 } },
    { id: 'station', name: 'Station', line: 'far', step: 2,
      flavour: 'A big hall with long echo, people and trains.',
      head: { ex: 'far', pin: { rt60: 4, noise: 12 }, dial: 'dist' },
      also: [{ ex: 'strange', pin: {}, dial: 'fast', label: 'Fast announcements' },
        { ex: 'seek', pin: { decoys: 1, size: 1, gap: 1 }, dial: 'snr', label: 'Find a voice, one decoy' }],
      opens: { from: 'park', at: 4 } },
    { id: 'stadium', name: 'Stadium', line: 'far', step: 3,
      flavour: 'Open stands and a roaring crowd close to the level of the voice you want.',
      head: { ex: 'far', pin: { rt60: 2, noise: 6 }, dial: 'dist' },
      also: [{ ex: 'seek', pin: { decoys: 2, size: 2, gap: 2 }, dial: 'snr', label: 'Busy stands' }],
      opens: { from: 'station', at: 4 } },
    { id: 'cathedral', name: 'Cathedral', line: 'far', step: 4,
      flavour: 'A quiet nave with long echo: every word rings into the next.',
      head: { ex: 'far', pin: { rt60: 7, noise: 18 }, dial: 'dist' },
      also: [],
      opens: { from: 'stadium', at: 4 } },
    { id: 'phone', name: 'Phone line', line: 'phone', step: 0,
      flavour: 'One voice, the line thinning and crackling.',
      head: { ex: 'strange', pin: {}, dial: 'phone' },
      also: [{ ex: 'repair', pin: { context: 1, gate: 2, fill: 2 }, dial: 'gap', label: 'Dropouts on the line' }],
      opens: null }
  ];

  var BY = {};
  VENUES.forEach(function (v, i) { v.order = i; BY[v.id] = v; });
  var LINE_BY = {};
  LINES.forEach(function (l) { LINE_BY[l.id] = l; l.venues = VENUES.filter(function (v) { return v.line === l.id; }).map(function (v) { return v.id; }); });

  ES.game.data = {
    LINES: LINES, VENUES: VENUES,
    venue: function (id) { return BY[id] || null; },
    line: function (id) { return LINE_BY[id] || null; },
    ids: VENUES.map(function (v) { return v.id; }),
    // the ring step size (map units) and the radius of the first ring; "you" sits at the origin
    MAP: { ring0: 50, ring: 47, phoneR: 46 }
  };
})(typeof window !== 'undefined' ? window : globalThis);
