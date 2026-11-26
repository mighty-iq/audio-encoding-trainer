/* Earshot engine — scoring (CONTRACTS §5). response = { picks: [...] } or an array, one pick per slot; a 'locate'
   slot takes {x, y} and counts as found within its radius (+15 % tolerance for the pointer). Returns per-slot
   results, all-slots `correct`, the proportion `prop` (what the learner model uses) and `intrusions` (picks of
   words spoken by another voice). */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  ES.engine = ES.engine || {};

  function norm(t) { return String(t === undefined || t === null ? '' : t).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim(); }

  function score(trial, response) {
    var slots = (trial && trial.question && trial.question.slots) || [];
    var picks = Array.isArray(response) ? response : (response && response.picks) || [];
    var out = [], nOk = 0, intr = 0;
    slots.forEach(function (sl, i) {
      var pk = picks[i], ok = false, foil = null;
      if (sl.kind === 'locate') {
        if (pk && typeof pk.x === 'number' && typeof pk.y === 'number') {
          var dx = pk.x - sl.answer.x, dy = pk.y - sl.answer.y;
          ok = Math.sqrt(dx * dx + dy * dy) <= sl.answer.r * 1.15;
        }
        foil = ok ? null : pk ? 'miss' : 'none';
      } else {
        ok = pk !== undefined && pk !== null && norm(pk) === norm(sl.answer);
        if (!ok) {
          foil = pk === undefined || pk === null ? 'none' : 'random';
          if (sl.foils) Object.keys(sl.foils).forEach(function (f) { if (norm(f) === norm(pk)) foil = sl.foils[f]; });
          if (foil === 'masker') intr++;
        }
      }
      if (ok) nOk++;
      out.push({ picked: pk === undefined ? null : pk, answer: sl.answer, correct: ok, foil: foil });
    });
    return { slots: out, correct: slots.length > 0 && nOk === slots.length, prop: slots.length ? nOk / slots.length : 0, intrusions: intr };
  }

  ES.engine.score = score;
})(typeof window !== 'undefined' ? window : globalThis);
