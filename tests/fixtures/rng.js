/* Temporary stand-in for js/core/rng.js (shell owns the real one; same API as CONTRACTS §3).
   Loaded by engine tests and simulations only when ES.core.rng is missing. sfc32 seeded by a string hash. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  ES.core = ES.core || {};
  if (ES.core.rng && ES.core.hash) return;

  function hash(str) {
    // FNV-1a 32-bit followed by a murmur-style finaliser.
    var s = String(str), h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b) >>> 0;
    h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0;
    h ^= h >>> 16;
    return h >>> 0;
  }

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

  function rng(seed) {
    var key = typeof seed === 'number' ? 'n:' + seed : String(seed);
    var f = sfc32(hash(key + '#a'), hash(key + '#b'), hash(key + '#c'), hash(key + '#d'));
    for (var i = 0; i < 12; i++) f();
    var api = {
      seed: key,
      next: f,
      int: function (a, b) { return a + Math.floor(f() * (b - a + 1)); },
      float: function (a, b) { return a + f() * (b - a); },
      pick: function (arr) { return arr[Math.floor(f() * arr.length)]; },
      shuffle: function (arr) {
        for (var i = arr.length - 1; i > 0; i--) {
          var j = Math.floor(f() * (i + 1)), t = arr[i]; arr[i] = arr[j]; arr[j] = t;
        }
        return arr;
      },
      weighted: function (items, weights) {
        var tot = 0, i;
        for (i = 0; i < weights.length; i++) tot += Math.max(0, weights[i]);
        var r = f() * tot;
        for (i = 0; i < items.length; i++) { r -= Math.max(0, weights[i]); if (r < 0) return items[i]; }
        return items[items.length - 1];
      },
      fork: function (label) { return rng(key + '/' + String(label)); }
    };
    return api;
  }

  ES.core.rng = rng;
  ES.core.hash = hash;
})(typeof window !== 'undefined' ? window : globalThis);
