/* Earshot engine — set runner used by the exercise views and the simulations.
   const sc = ES.engine.flow.start('crowd', { mode, learner, seed, headphones, kind, hint, lab, overrides, trials,
     pin, focus, family, learn });
   let spec; while ((spec = ES.engine.flow.next(sc))) { …render, play, collect response…; ES.engine.flow.answer(sc, spec, response); }
   const setRecord = ES.engine.flow.end(sc);  // goes into log.sessions[].sets (CONTRACTS §7)
   - learn:false (Weekly Night Out, review M8): nothing in the learner changes, on any trial or replay; the record
     says learn:false and carries no personal best.
   - flow.skip(sc, {reason, bad}) (M6/M7): the pending trial is dropped unscored and replaced by a NEW trial at the
     same level (the same decision, a new item draw that avoids the clips marked bad); reason 'error' marks all its
     clips bad. Cap: 3 replacements per set, then the set ends early as partial ({ended:true}).
   - flow.end(sc, {early:true}) ("End set"): fewer than half the trials answered → partial. Partial sets carry
     partial:true, no personal best, and never count for plateau windows or the overnight check.
   - flow.snapshot(sc) → plain JSON for the stored session plan; flow.resume(snap, {learner}) rebuilds the context
     after a reload (the trial in flight is replaced by a new one, not charged to the player) (M11).
   Saves are the caller's job, between trials (never during a stimulus). */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var E = ES.engine = ES.engine || {};

  // Exercise index (dB-equivalent; higher = better): mean gain over the prior, in logits, scaled by the primary
  // dB dial's slope when the exercise has one (so Crowd's index reads in dB of voice level), else by 0.25/dB.
  function index(lr, ex, ck) {
    var meta = E.dialMeta[ex] || {}, ref = meta.primary ? E.dialDef(ex, meta.primary).slope : 0.25;
    var act = lr.active(ex, { ctxKey: ck, allFamilies: true }), sum = 0, n = 0;
    act.forEach(function (d) {
      var p = lr.post(ex, d, ck);
      if (!p.n) return;
      sum += d.dir * d.slope * (p.m - d.prior.m); n++;
    });
    return n ? Math.round(sum / n / ref * 100) / 100 : 0;
  }

  function start(ex, opts) {
    opts = opts || {};
    var lr = E.lrOf(opts.learner), seed = opts.seed !== undefined ? opts.seed : 'set:' + ex + ':' + lr.state.n;
    var meta = E.dialMeta[ex] || {};
    var sc = { ex: ex, pin: opts.pin || null, focusDial: typeof opts.focus === 'string' ? opts.focus : null, mode: opts.mode || 'edge', lr: lr, rng: ES.core.rng(seed), seed: seed, i: 0,
      n: opts.trials || meta.setTrials || 20, headphones: !!opts.headphones, lab: opts.lab || null, overrides: opts.overrides || null,
      playerSeed: opts.playerSeed || (opts.learn === false ? lr.state.seed || 'p' : (lr.state.seed = lr.state.seed || ('p' + ES.core.hash(String(lr.clock()))))),
      met: opts.met, avoidVoices: opts.avoidVoices || null, breadth: opts.breadth, kind: opts.kind || 'normal',
      set: { __flow: true, i: 0, sinceAnchor: 0, anchorGap: 3 + (ES.core.hash(String(seed)) % 2), misses: 0, block: null, lastFamily: null,
        kind: opts.kind || 'normal', hint: opts.hint || null, pin: opts.pin || null, focus: typeof opts.focus === 'string' ? opts.focus : null,
        family: typeof opts.family === 'string' ? opts.family : null },
      synth: opts.synth || null, avgS: {}, avgN: {}, recentVoices: [], lastRoom: null, results: [], voices: {}, startIdx: index(lr, ex, lr.ctxKey(ex, !!opts.headphones)), pending: null,
      learn: opts.learn !== false, k: 0, replaced: 0, bad: {}, voided: [], dec: null, partial: false, ended: null };
    if (sc.kind === 'fresh') sc.fresh = { before: sc.startIdx, daysAway: opts.daysAway || null };
    return sc;
  }
  function breadthFor(sc) {
    if (sc.breadth !== undefined) return sc.breadth;
    if (sc.mode === 'variety') return 1;
    if (sc.mode === 'path') { var ps = sc.lr.state.path[sc.ex]; var st = ps ? E.path.steps(sc.ex)[ps.i] : null; return st && st.mix ? 0.6 : 0.25; }
    var b = sc.lr.state.breadth[sc.ex];
    return b === undefined ? 0.2 : b;
  }
  // Every clip a spec plays (parts, beds, replays, the live scene).
  function clipsOf(spec) {
    var out = [];
    function walk(a) {
      if (!a) return;
      (a.parts || []).forEach(function (p) { if (p.clip) out.push(p.clip); });
      (a.beds || []).forEach(function (b) { if (b.bed) out.push(b.bed); (b.clips || []).forEach(function (c) { out.push(c); }); });
      if (a.live) { [a.live.target].concat(a.live.decoys || []).forEach(function (d) { if (d && d.clip) out.push(d.clip); }); if (a.live.bed) walk({ beds: [a.live.bed] }); }
    }
    walk(spec.audio);
    ((spec.feedback && spec.feedback.replays) || []).forEach(function (r) { walk(r.audio); });
    if (spec.meta && spec.meta.preview) out.push(spec.meta.preview);
    return out;
  }
  function next(sc) {
    if (sc.pending) return sc.pending; // an aborted, unanswered trial is shown again
    if (sc.i >= sc.n || sc.ended) return null;
    var lr = sc.lr, ex = sc.ex, plat = lr.state.plat[ex] || {};
    // a replacement (k > 0) keeps the decision of this trial index: same level, new item
    var dec = sc.k > 0 && sc.dec && sc.dec.i === sc.i ? sc.dec.d : null;
    if (!dec) {
      if (plat.anchorBoost > 0) sc.set.anchorGap = Math.min(sc.set.anchorGap, 2);
      dec = E.controller.next(ex, { mode: sc.mode, rng: sc.rng.fork('c' + sc.i), learner: lr, headphones: sc.headphones, set: sc.set,
        breadth: sc.mode === 'variety' ? 1 : undefined, lab: sc.lab, overrides: sc.overrides, lastFocus: sc.lastFocus, forceFocus: plat.forceN > 0 ? plat.forceFocus : null });
      sc.dec = { i: sc.i, d: dec };
    }
    var spec = null;
    for (var t = 0; t < 6; t++) {
      var tag = sc.i + (sc.k ? ':' + sc.k : '');
      var setting = { dials: JSON.parse(JSON.stringify(dec.dials || {})), focus: dec.focus, anchor: !!dec.anchor, warmup: !!dec.warmup, seed: sc.seed + ':' + tag, breadth: dec.breadth };
      if (!sc.learn) setting.learn = false;
      var ctx = { breadth: dec.breadth !== undefined ? dec.breadth : breadthFor(sc), headphones: sc.headphones, set: sc.set, recentVoices: sc.recentVoices, avoidVoices: sc.set.kind === 'overnight' && sc.i < 3 ? sc.avoidVoices : null,
        playerSeed: sc.playerSeed, lastRoom: sc.lastRoom, learner: lr, met: sc.met, family: dec.family };
      spec = sc.synth ? sc.synth(ex, setting, ctx, sc) : E.items[ex].make(sc.rng.fork('m' + tag), setting, ctx);
      // after a failed trial, its clips stay out of the set's later draws (when the build allows)
      if (!Object.keys(sc.bad).length || !clipsOf(spec).some(function (c) { return sc.bad[c]; })) break;
      sc.k++;
    }
    if (!sc.learn) spec.setting.learn = false;
    // a condition met for the first time (new accent, room type, task) is a warm-up whatever its level (R2 §1.0)
    var c = lr.state.cond[ex + ':' + spec.meta.cond];
    if (!spec.setting.warmup && (!c || c.n < 3) && sc.mode !== 'free') { spec.setting.warmup = true; spec.setting.warmupReason = 'new condition'; }
    spec.meta.decision = { p: Math.round(dec.p * 1000) / 1000, target: dec.target, mode: dec.mode, path: dec.path || null, overnight: !!dec.overnight,
      floor: !!dec.floor, saturated: !!dec.saturated, coach: dec.coach || null };
    sc.pending = spec;
    return spec;
  }
  function answer(sc, spec, response) {
    var lr = sc.lr, ex = sc.ex, res = E.score(spec, response), set = sc.set;
    // a trial that was skipped or voided is never counted (a late answer after a skip changes nothing)
    if (spec && (sc.voided.indexOf(spec.id) >= 0 || (sc.pending && spec !== sc.pending && spec.id !== sc.pending.id))) return { result: res, update: null, path: null, done: sc.i >= sc.n, stale: true };
    var upd = sc.learn ? lr.update(spec, res) : { updated: [], warmup: false, skipped: 'learn:false' }, pr = null;
    if (sc.mode === 'path' && sc.learn) pr = E.path.record(ex, spec, res, lr);
    var st = spec.setting, plat = lr.state.plat[ex];
    if (sc.learn && plat && plat.forceN > 0) plat.forceN--;
    if (sc.learn && plat && plat.anchorBoost > 0) plat.anchorBoost--;
    set.i++; sc.i++; sc.k = 0; sc.dec = null;
    if (st.anchor) { set.sinceAnchor = 0; set.anchorGap = 3 + (sc.rng.fork('g' + sc.i).next() < 0.5 ? 0 : 1); set.misses = 0; }
    else if (!st.warmup) set.sinceAnchor++;
    set.misses = res.prop < 0.5 ? set.misses + 1 : 0;
    if (spec.meta.family) set.lastFamily = spec.meta.family;
    var tv = spec.meta.voices && spec.meta.voices[0];
    if (tv) { sc.recentVoices.unshift(tv); if (sc.recentVoices.length > 3) sc.recentVoices.pop(); }
    (spec.meta.voices || []).forEach(function (v) { sc.voices[v] = 1; });
    if (spec.meta.room) sc.lastRoom = spec.meta.room;
    if (!st.anchor && !st.warmup) sc.lastFocus = st.focus;
    // running average of each dial's estimate over the set (a less noisy session value than the end point)
    var ck0 = lr.ctxKey(ex, sc.headphones);
    lr.active(ex, { ctxKey: ck0, allFamilies: true }).forEach(function (d) {
      var r = lr.state.dials[ck0 + '.' + d.id]; if (!r) return;
      sc.avgS[d.id] = (sc.avgS[d.id] || 0) + r.m; sc.avgN[d.id] = (sc.avgN[d.id] || 0) + 1;
    });
    sc.results.push({ prop: res.prop, correct: res.correct, anchor: !!st.anchor, warmup: !!st.warmup, focus: st.focus, p: spec.meta.decision.p,
      intrusions: res.intrusions, overnight: spec.meta.decision.overnight, dials: st.dials });
    sc.pending = null;
    return { result: res, update: upd, path: pr, done: sc.i >= sc.n };
  }
  // Drop the pending trial unscored and let next() draw a NEW one at the same level (review M6/M7).
  // opts.reason: 'error' (render or decode failure: its clips are avoided for the rest of the set), 'void' (heard
  // twice after pauses; never charged), 'skip'; opts.bad: clip ids to avoid (true = all of the pending trial's).
  // Returns {replaced:true, left} or, past 3 replacements in a set, {ended:true, partial:true} (next() → null).
  function skip(sc, opts) {
    opts = opts || {};
    var p = sc.pending, bad = opts.bad === true || (opts.bad === undefined && opts.reason === 'error') ? (p ? clipsOf(p) : []) : (opts.bad || []);
    bad.forEach(function (c) { sc.bad[c] = 1; });
    if (p && p.id && sc.voided.indexOf(p.id) < 0) { sc.voided.push(p.id); if (sc.voided.length > 50) sc.voided.shift(); }
    sc.pending = null; sc.k++;
    if (!opts.free) sc.replaced++;
    if (sc.replaced > 3) { sc.partial = true; sc.ended = 'replacements'; return { ended: true, partial: true, replaced: sc.replaced }; }
    return { replaced: true, left: 3 - sc.replaced };
  }
  // The set record. opts.early: the player ended the set ("End set"); with fewer than half its trials answered it is
  // partial. Partial and learn:false sets set no personal best and leave the learner's bests alone.
  function end(sc, opts) {
    opts = opts || {};
    var lr = sc.lr, ex = sc.ex, ck = lr.ctxKey(ex, sc.headphones), R = sc.results, n = R.length;
    var partial = !!sc.partial || (!!opts.early && n < Math.ceil(sc.n / 2));
    var endV = {}, sd = {}, focus = {}, nOk = 0, sum = 0, anchors = 0, warm = 0;
    lr.active(ex, { ctxKey: ck, allFamilies: true }).forEach(function (d) {
      var p = lr.post(ex, d, ck); if (!p.n) return;
      endV[d.id] = Math.round(p.m * 100) / 100; sd[d.id] = Math.round(p.s * 100) / 100;
    });
    R.forEach(function (r) { if (r.correct) nOk++; sum += r.prop; if (r.anchor) anchors++; if (r.warmup) warm++; if (!r.anchor && !r.warmup) focus[r.focus] = (focus[r.focus] || 0) + 1; });
    var mainFocus = Object.keys(focus).sort(function (a, b) { return focus[b] - focus[a]; })[0] || null;
    var idx = index(lr, ex, ck);
    // personal bests per dial, in real units: a focus-trained dial beyond its best by ≥ 0.1 logit
    var pbs = [];
    if (!partial && sc.learn) Object.keys(focus).forEach(function (id) {
      var d = E.dialDef(ex, id), p = lr.post(ex, d, ck); if (!d || !p.n) return;
      var a = d.dir * d.slope * p.m, key = ck + '.' + id, best = lr.state.best[key];
      if (best === undefined) { lr.state.best[key] = a; return; }
      if (a > best + 0.1) { lr.state.best[key] = a; pbs.push({ dial: id, m: Math.round(p.m * 100) / 100 }); }
    });
    var avg = {};
    Object.keys(sc.avgS).forEach(function (k) { avg[k] = Math.round(sc.avgS[k] / sc.avgN[k] * 100) / 100; });
    var out = { ex: ex, n: n, correct: nOk, acc: n ? Math.round(sum / n * 1000) / 1000 : 0, focus: mainFocus, foci: focus, end: endV, avg: avg, sd: sd, pb: pbs.length > 0, pbs: pbs,
      idx: idx, startIdx: sc.startIdx, mode: sc.mode, ctxKey: ck, anchors: anchors, warmups: warm, breadth: breadthFor(sc), voices: Object.keys(sc.voices) };
    if (sc.kind === 'overnight') {
      var on = R.filter(function (r) { return r.overnight; });
      out.overnight = { n: on.length, prop: on.length ? Math.round(on.reduce(function (a, r) { return a + r.prop; }, 0) / on.length * 100) / 100 : null,
        expected: sc.set.hint ? sc.set.hint.p : null, focus: sc.set.hint ? sc.set.hint.focus : null };
    }
    if (sc.fresh) out.fresh = { daysAway: sc.fresh.daysAway, before: sc.fresh.before, after: idx };
    if (sc.mode === 'path') { var ps = lr.state.path[ex]; out.path = ps ? { i: ps.i, best: ps.best } : null; }
    if (partial) { out.partial = true; out.planned = sc.n; out.why = sc.ended === 'replacements' ? 'replacements' : 'ended early'; }
    if (sc.replaced) out.replaced = sc.replaced;
    if (!sc.learn) out.learn = false;
    return out;
  }
  // Plain JSON copy of a flow context for the stored session (M11); resume() rebuilds it. The pending trial is not
  // kept: after a reload a new trial is drawn at the same level, not charged against the replacement cap.
  var KEEP = ['ex', 'pin', 'focusDial', 'mode', 'seed', 'i', 'n', 'headphones', 'lab', 'overrides', 'playerSeed', 'met', 'avoidVoices', 'breadth', 'kind',
    'set', 'avgS', 'avgN', 'recentVoices', 'lastRoom', 'lastFocus', 'results', 'voices', 'startIdx', 'fresh', 'learn', 'k', 'replaced', 'bad', 'voided',
    'dec', 'partial', 'ended'];
  function snapshot(sc) {
    var o = { v: 1, pendingId: sc.pending ? sc.pending.id || null : null };
    KEEP.forEach(function (k) { if (sc[k] !== undefined) o[k] = sc[k]; });
    return JSON.parse(JSON.stringify(o));
  }
  function resume(snap, opts) {
    opts = opts || {};
    if (!snap || snap.v !== 1 || !snap.ex || !E.items[snap.ex]) return null;
    var o = JSON.parse(JSON.stringify(snap)), lr = E.lrOf(opts.learner), sc = { lr: lr, rng: ES.core.rng(o.seed), synth: opts.synth || null, pending: null };
    KEEP.forEach(function (k) { if (o[k] !== undefined) sc[k] = o[k]; });
    ['avgS', 'avgN', 'voices', 'bad'].forEach(function (k) { if (!sc[k] || typeof sc[k] !== 'object') sc[k] = {}; });
    ['recentVoices', 'results', 'voided'].forEach(function (k) { if (!Array.isArray(sc[k])) sc[k] = []; });
    if (!sc.set || typeof sc.set !== 'object') sc.set = { i: sc.i || 0, sinceAnchor: 0, anchorGap: 4, misses: 0 };
    sc.set.__flow = true;
    if (o.pendingId) { sc.voided.push(o.pendingId); sc.k = (sc.k || 0) + 1; }
    sc.learn = o.learn !== false; sc.replaced = sc.replaced || 0; sc.i = sc.i || 0;
    return sc;
  }
  // Listen-only exposure examples of a condition just trained (between sets; never a repeat-aloud step).
  function exposure(ex, opts) {
    opts = opts || {};
    var gen = E.items[ex];
    if (!gen || !gen.exposure) return [];
    var lr = E.lrOf(opts.learner), rng = ES.core.rng(opts.seed || 'exp:' + ex + ':' + lr.state.n), ck = lr.ctxKey(ex, !!opts.headphones);
    var family = E.dialMeta[ex].families ? (opts.family || E.controller.chooseFamily(ex, { learner: lr, rng: rng, set: {} }, 'edge')) : null;
    var act = lr.active(ex, { ctxKey: ck, family: family }), zs = lr.zStar(ex, ck), dials = {};
    act.forEach(function (d) { dials[d.id] = E.controller.comfortOf(lr, ex, ck, d, zs); });
    return gen.exposure(rng, { dials: dials, focus: act[0] && act[0].id }, { learner: lr, headphones: !!opts.headphones, breadth: 0.5, family: family, playerSeed: opts.playerSeed });
  }

  E.flow = { start: start, next: next, answer: answer, skip: skip, end: end, snapshot: snapshot, resume: resume, exposure: exposure, index: index, clipsOf: clipsOf };
})(typeof window !== 'undefined' ? window : globalThis);
