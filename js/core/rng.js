/* ES.core.rng / ES.core.hash — seeded randomness (CONTRACTS §3). sfc32 seeded from a string hash;
   fork(label) derives an independent child stream, so adding draws in one stream never shifts another. */
(function (ES) {
  'use strict';

  function fnv1a(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }
  function fmix(h) {
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return h >>> 0;
  }
  /** String → uint32 (FNV-1a with a murmur finaliser). */
  function hash(s) { return fmix(fnv1a(String(s))); }

  function sfc32(a, b, c, d) {
    return function () {
      a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
      var t = (a + b) | 0;
      a = b ^ (b >>> 9);
      b = (c + (c << 3)) | 0;
      c = (c << 21) | (c >>> 11);
      d = (d + 1) | 0;
      t = (t + d) | 0;
      c = (c + t) | 0;
      return (t >>> 0) / 4294967296;
    };
  }

  function keyOf(seed) {
    if (typeof seed === 'number' && isFinite(seed)) return 'n' + seed;
    if (seed === undefined || seed === null) return 'default';
    return String(seed);
  }

  /** rng(seed|string) → { seed, next, int, float, pick, shuffle, weighted, fork, chance }. */
  function rng(seed) {
    var key = keyOf(seed);
    var next = sfc32(hash(key + '#0'), hash(key + '#1'), hash(key + '#2'), hash(key + '#3'));
    for (var i = 0; i < 12; i++) next();
    var r = {
      seed: key,
      next: next,
      /** Integer in [a, b], both inclusive. */
      int: function (a, b) {
        if (b < a) { var t = a; a = b; b = t; }
        return a + Math.floor(next() * (b - a + 1));
      },
      float: function (a, b) { return a + (b - a) * next(); },
      chance: function (p) { return next() < p; },
      pick: function (arr) { return arr && arr.length ? arr[Math.floor(next() * arr.length)] : undefined; },
      /** A shuffled copy (Fisher–Yates); the input is left alone. */
      shuffle: function (arr) {
        var a = Array.prototype.slice.call(arr || []);
        for (var j = a.length - 1; j > 0; j--) {
          var k = Math.floor(next() * (j + 1));
          var tmp = a[j]; a[j] = a[k]; a[k] = tmp;
        }
        return a;
      },
      weighted: function (items, weights) {
        if (!items || !items.length) return undefined;
        var total = 0, w, j;
        for (j = 0; j < items.length; j++) { w = +weights[j]; if (w > 0) total += w; }
        if (!(total > 0)) return r.pick(items);
        var x = next() * total;
        for (j = 0; j < items.length; j++) {
          w = +weights[j];
          if (!(w > 0)) continue;
          if (x < w) return items[j];
          x -= w;
        }
        return items[items.length - 1];
      },
      fork: function (label) { return rng(key + '/' + keyOf(label)); }
    };
    return r;
  }

  ES.core.hash = hash;
  ES.core.rng = rng;
})(window.ES);
