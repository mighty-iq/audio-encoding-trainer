/* Earshot — Seek's scene (split from js/ex/seek.js, which holds the exercise module, its set loop and the
   integration shims). One scene: [a preview of the voice when there are decoys] → search → word → feedback.
   The floor plan is −1…1 field units, 10 m per unit, you start at the bottom. Grab yourself (pointer down near
   the white dot) and drag: the live scene (ES.audio.live) follows, the voice growing louder as you close in
   (1/distance). Releasing after a move is the answer point; then tap the word; then the reveal (the voice in red
   with its found ring, decoys in blue with their words, your path) and two replays. Head-turn view (spec
   audio.live.headTurn): a knob on your ring turns your head; releasing the knob never answers. Keyboard: arrows
   walk (Shift: bigger steps), Q/E or [ ] turn, Enter answers here. Nothing moves while sound plays except your
   own cursor. Levels: every source and the bed sit HEAD dB below the scene default and nothing gets louder
   than at MIN_D m (the live scene has no level ceiling). API (non-enumerable): ES.ex._seekScene =
   { run(host, spec, cfg), css(), M_PER_UNIT, fmtM }. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  ES.ex = ES.ex || {};
  function K() { return ES.ex._kit; }
  function U() { return ES.core.util; }
  function E() { return ES.engine; }
  var M_PER_UNIT = 10, MIN_D = 1, HEAD = 8, F = 90, GRAB_PX = 52, MIN_MOVE = 0.08, STEP = 0.04, KNOB = 26;
  function fmtM(m) { return U() && U().fmtM ? U().fmtM(m) : Math.round(m * 10) / 10 + ' m'; }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function sv(x, y) { return { x: Math.round(x * F * 10) / 10, y: Math.round(-y * F * 10) / 10 }; }
  function report(where, e) { var k = K(); if (k) k.report(where, e); else if (root.console) console.error('[seek ' + where + ']', e); }
  function hold(on) { if (ES.ui.quiet) ES.ui.quiet(on); var s = ES.core.store; if (s && s.hold && s.release) { if (on) s.hold(); else s.release(); } }

  /* ---- styles (Audiogram tokens) ---- */
  function css() {
    var doc = root.document;
    if (!doc || !doc.head || doc.getElementById('es-seek-css')) return;
    var st = doc.createElement('style');
    st.id = 'es-seek-css';
    st.textContent = ['.sk-field { touch-action: none; -webkit-user-select: none; user-select: none; cursor: grab; outline: none; }',
      '.sk-field:focus-visible .sk-floor { stroke: var(--focus); stroke-width: 2; }',
      '.sk-floor { fill: var(--surface); stroke: var(--rule-2); stroke-width: 1; vector-effect: non-scaling-stroke; }',
      '.sk-grid { stroke: var(--rule); stroke-width: 1; vector-effect: non-scaling-stroke; }',
      '.sk-scale { stroke: var(--ink-3); stroke-width: 1.4; vector-effect: non-scaling-stroke; } .sk-small { font: 500 7px var(--mono); fill: var(--ink-3); }',
      '.sk-start { fill: none; stroke: var(--ink-3); stroke-width: 1; stroke-dasharray: 2 2; vector-effect: non-scaling-stroke; }',
      '.sk-dot { fill: var(--ink); } .sk-ring { fill: none; stroke: var(--ink); stroke-width: 1.2; opacity: .55; vector-effect: non-scaling-stroke; }',
      '.sk-nose { stroke: var(--ink); stroke-width: 2.2; stroke-linecap: round; vector-effect: non-scaling-stroke; }',
      '.sk-knob { fill: var(--surface); stroke: var(--ink); stroke-width: 1.6; vector-effect: non-scaling-stroke; }',
      '.sk-path { fill: none; stroke: var(--ink-3); stroke-width: 1.3; stroke-dasharray: 3 2; vector-effect: non-scaling-stroke; }',
      '.sk-stop { stroke: var(--ink); stroke-width: 1.8; stroke-linecap: round; vector-effect: non-scaling-stroke; }',
      '.sk-t { fill: var(--red); } .sk-tring { fill: none; stroke: var(--red); stroke-width: 1.2; stroke-dasharray: 3 2; vector-effect: non-scaling-stroke; }',
      '.sk-d { fill: var(--blue); } .sk-lab { font: 700 8px var(--font); text-anchor: middle; } .sk-lab.is-t { fill: var(--red); } .sk-lab.is-d { fill: var(--blue); font-weight: 600; }',
      '.sk-body[data-state="search"] .trial-answer:empty, .sk-body[data-state="preview"] .trial-answer:empty { display: none; }'].join('\n');
    doc.head.appendChild(st);
  }

  /* ---- the floor plan ---- */
  function fieldView(found, start, turn) {
    var u = U(), svg = u.svg('svg', { viewBox: '-100 -100 200 200', class: 'field sk-field', role: 'application', tabindex: '0', preserveAspectRatio: 'xMidYMid meet',
      'aria-label': 'Search field, 20 m across. Drag the white dot, or use the arrow keys to walk and Enter to answer' + (turn ? '; Q and E turn your head' : '') + '.' });
    svg.appendChild(u.svg('rect', { class: 'sk-floor', x: -F, y: -F, width: 2 * F, height: 2 * F, rx: 3 }));
    for (var i = -3; i <= 3; i++) {
      var g = i * F / 4;
      svg.appendChild(u.svg('line', { class: 'sk-grid', x1: g, y1: -F, x2: g, y2: F }));
      svg.appendChild(u.svg('line', { class: 'sk-grid', x1: -F, y1: g, x2: F, y2: g }));
    }
    var a = sv(0.42, -0.955), b = sv(0.92, -0.955);           // 5 m scale bar, bottom right
    svg.appendChild(u.svg('line', { class: 'sk-scale', x1: a.x, y1: a.y, x2: b.x, y2: b.y }));
    svg.appendChild(u.svg('text', { class: 'sk-small', x: (a.x + b.x) / 2 - 6, y: a.y - 3 }, '5 m'));
    var s = sv(start.x, start.y);
    svg.appendChild(u.svg('circle', { class: 'sk-start', cx: s.x, cy: s.y, r: 7 }));
    var reveal = u.svg('g', { class: 'sk-reveal' });
    svg.appendChild(reveal);
    var you = u.svg('g', { class: 'sk-you' });
    you.appendChild(u.svg('circle', { class: 'sk-ring', cx: 0, cy: 0, r: Math.round(found * 1.15 * F * 10) / 10 }));
    var rot = u.svg('g', null);
    rot.appendChild(u.svg('line', { class: 'sk-nose', x1: 0, y1: -6, x2: 0, y2: turn ? -KNOB + 6 : -12 }));
    var knob = turn ? u.svg('circle', { class: 'sk-knob', cx: 0, cy: -KNOB, r: 6 }) : null;
    if (knob) rot.appendChild(knob);
    you.appendChild(rot);
    you.appendChild(u.svg('circle', { class: 'sk-dot', cx: 0, cy: 0, r: 4.8 }));
    svg.appendChild(you);
    return { svg: svg, reveal: reveal, you: you,
      place: function (p, h) { var q = sv(p.x, p.y); you.setAttribute('transform', 'translate(' + q.x + ' ' + q.y + ')'); rot.setAttribute('transform', 'rotate(' + Math.round(h || 0) + ')'); } };
  }
  /** After the answer (static): your path and stop, the voice (red, with the found ring), decoys (blue, words). */
  function drawReveal(fv, spec, path, stop) {
    var u = U(), g = fv.reveal, live = spec.audio.live, ans = spec.question.slots[0].answer, words = (spec.meta && spec.meta.decoyWords) || [];
    U().clear(g);
    g.appendChild(u.svg('polyline', { class: 'sk-path', points: path.map(function (p) { var q = sv(p[0], p[1]); return q.x + ',' + q.y; }).join(' ') }));
    (live.decoys || []).forEach(function (d, i) {
      var q = sv(d.x, d.y);
      g.appendChild(u.svg('circle', { class: 'sk-d', cx: q.x, cy: q.y, r: 5.2 }));
      if (words[i]) g.appendChild(u.svg('text', { class: 'sk-lab is-d', x: clamp(q.x, -80, 80), y: q.y < -78 ? q.y + 15 : q.y - 9 }, words[i]));
    });
    var t = sv(ans.x, ans.y);
    g.appendChild(u.svg('circle', { class: 'sk-tring', cx: t.x, cy: t.y, r: Math.round(ans.r * 1.15 * F * 10) / 10 }));
    g.appendChild(u.svg('circle', { class: 'sk-t', cx: t.x, cy: t.y, r: 6.5 }));
    g.appendChild(u.svg('text', { class: 'sk-lab is-t', x: clamp(t.x, -80, 80), y: t.y < -78 ? t.y + 17 : t.y - 11 }, (spec.meta && spec.meta.items && spec.meta.items[0]) || 'voice'));
    var s = sv(stop.x, stop.y);
    g.appendChild(u.svg('path', { class: 'sk-stop', d: 'M' + (s.x - 4) + ' ' + (s.y - 4) + ' L' + (s.x + 4) + ' ' + (s.y + 4) + ' M' + (s.x + 4) + ' ' + (s.y - 4) + ' L' + (s.x - 4) + ' ' + (s.y + 4) }));
  }

  /* ---- sounds ---- */
  function sceneCfg(spec, pos, h) {
    var L = JSON.parse(JSON.stringify(spec.audio.live || {}));
    if (L.bed) L.bed.db = (+L.bed.db || 0) - HEAD;
    if (L.target) L.target.db = (+L.target.db || 0) - HEAD;
    (L.decoys || []).forEach(function (d) { d.db = (+d.db || 0) - HEAD; });
    L.radius = M_PER_UNIT; L.minDist = MIN_D; L.spatial = spec.audio.spatial || 'ild'; L.seed = String(spec.seed);
    var sc = ES.audio.live.scene(L);
    sc.listener(pos.x, pos.y, h || 0);
    return sc;
  }
  function clipMeta(id) { var m = ES.data && ES.data.manifest && ES.data.manifest.clips; return (m && m[id]) || {}; }
  function oneClip(spec, clip, times, bed, db) {
    var d = clipMeta(clip).dur || 1.2, gap = ((spec.audio.live.target || {}).gapMs || 800) / 1000, parts = [];
    for (var i = 0; i < times; i++) parts.push({ clip: clip, at: Math.round((0.25 + i * (d + gap)) * 1000) / 1000, db: 0, role: 'target' });
    return { out: { db: -20 }, dur: Math.round((0.5 + times * (d + gap)) * 100) / 100, spatial: 'mono', parts: parts, beds: bed ? [{ kind: bed.kind, bed: bed.bed, db: db }] : [], room: null };
  }
  /** Another clip by the target voice whose words are none of the scene's words (SHIM until meta.preview). */
  function previewClip(spec) {
    if (spec.meta && spec.meta.preview) return spec.meta.preview;
    var X = E().items && E().items.data, tv = spec.meta && spec.meta.voices && spec.meta.voices[0], live = spec.audio.live;
    if (!X || !tv) return null;
    var avoid = [live.target.clip].concat((live.decoys || []).map(function (d) { return d.clip; }));
    var bad = {};
    avoid.forEach(function (c) { (clipMeta(c).words || []).forEach(function (w) { bad[String(w).toLowerCase()] = 1; }); });
    var kinds = ['phrase', 'sentence', 'word'];
    for (var i = 0; i < kinds.length; i++) {
      var ok = (X.kindsOf(tv, kinds[i]) || []).filter(function (c) { return avoid.indexOf(c) < 0 && !(clipMeta(c).words || []).some(function (w) { return bad[String(w).toLowerCase()]; }); });
      if (ok.length) return ok[ES.core.hash(String(spec.seed)) % ok.length];
    }
    return null;
  }
  function playSpec(spec, audio) {
    return Promise.resolve(ES.audio.render(audio, { seed: String(spec.seed) })).then(function (r) { return ES.audio.play(r && r.buffer ? r.buffer : r); });
  }

  /* ---- one scene: [preview] → search → word → feedback. cfg = {score(spec, response), onResult?, practice?,
     nextLabelFor?}. Returns {done: Promise<{result, response}|{aborted}>, pause, resume, abort, state, peek}. ---- */
  function runScene(host, spec, cfg) {
    css();
    var u = U(), live = spec.audio.live || {}, start = live.start || { x: 0, y: -0.9 }, turn = !!live.headTurn && !cfg.practice;
    var locSlot = spec.question.slots[0], wordSlot = spec.question.slots[1], ans = locSlot.answer, found = +ans.r || 0.15;
    var st = { phase: '', pos: { x: start.x, y: start.y }, h: 0, moved: 0, path: [[start.x, start.y]], scene: null, grab: null, player: null,
      paused: false, held: false, done: false, t0: 0, t1: 0, searchMs: 0, release: null, panel: null, tok: 0 };
    var resolveDone, done = new Promise(function (r) { resolveDone = r; });
    u.clear(host);
    var fv = fieldView(found, start, turn), svg = fv.svg, inv = null, scale = 1;
    fv.place(st.pos, 0);
    var prompt = u.el('p', { class: 'trial-prompt' }), status = u.el('p', { class: 'trial-status', 'aria-live': 'polite' });
    var fb = u.el('div', { class: 'trial-feedback' }), answerBox = u.el('div', { class: 'trial-answer' }), actions = u.el('div', { class: 'trial-actions' });
    var body = u.el('div', { class: 'trial-body sk-body', 'data-mode': cfg.practice ? 'practice' : 'set' }, [
      u.el('div', { class: 'trial-field' }, svg), u.el('div', { class: 'trial-text' }, [prompt, status, fb]), answerBox, actions]);
    host.appendChild(body);
    function phase(p, text) { st.phase = p; body.setAttribute('data-state', p); if (text != null) status.textContent = text; }
    function quiet(on) { if (st.held !== on) { st.held = on; hold(on); } }
    function decoys() { return (live.decoys || []).length; }
    function stopScene() { if (st.scene) { try { st.scene.stop(); } catch (e) { /* ignore */ } st.scene = null; } quiet(false); }
    function stopPlayer() { st.tok++; if (st.player) { try { st.player.stop(); } catch (e) { /* ignore */ } st.player = null; } }
    function setReplays(on) { Array.prototype.forEach.call(actions.querySelectorAll('.replay'), function (b) { b.disabled = !on; }); }
    function play(audio, then) {
      var tok = ++st.tok;
      quiet(true);
      playSpec(spec, audio).then(function (h) { if (tok !== st.tok) { h.stop(); return null; } st.player = h; return h.ended; })
        .catch(function (e) { report('play', e); if (ES.ui.toast) ES.ui.toast('That sound could not be prepared.'); })
        .then(function () { if (tok !== st.tok) return; st.player = null; quiet(false); then(); });
    }
    function preview() {
      var clip = previewClip(spec);
      if (!clip) { search(); return; }
      phase('preview', 'The voice to find…');
      prompt.textContent = 'This is the voice to find. The other voices call other words.';
      u.clear(actions);
      play(oneClip(spec, clip, 1, null, 0), function () { if (!st.done && !st.paused) search(); });
    }
    function search() {
      phase('search', 'Grab the white dot (or press an arrow key) to start listening.');
      prompt.textContent = cfg.practice ? 'Practice: put your finger on the white dot (you) and drag. The voice gets louder as you get closer. Let go where it is loudest.'
        : (decoys() ? 'Find the voice from the preview. ' : 'Find the voice calling one word. ') + 'Drag yourself toward it and let go where it is loudest.' + (turn ? ' The knob on your ring turns your head.' : '');
      u.clear(actions);
      if (decoys() && previewClip(spec)) actions.appendChild(ES.ui.button('Hear the voice to find', { kind: 'secondary', cls: 'sk-again', onClick: function () { if (!st.scene && st.phase === 'search') preview(); } }));
      if (ES.core.util.focus) ES.core.util.focus(svg);
    }
    function begin() {
      if (st.scene || st.phase !== 'search' || st.paused) return;
      Array.prototype.forEach.call(actions.querySelectorAll('button'), function (b) { b.disabled = true; });
      status.textContent = 'Listening… let go where it is loudest.';
      quiet(true);
      if (!st.t0) st.t0 = Date.now();
      try {
        st.scene = sceneCfg(spec, st.pos, st.h);
        st.scene.start().catch(function (e) { report('scene', e); status.textContent = 'Sound is unavailable here: answer anyway to walk through.'; });
      } catch (e) { report('scene', e); st.scene = { listener: function () {}, stop: function () {} }; status.textContent = 'Sound is unavailable here: answer anyway to walk through.'; }
    }
    function moveTo(x, y) {
      var nx = clamp(x, -0.97, 0.97), ny = clamp(y, -0.97, 0.97), dx = nx - st.pos.x, dy = ny - st.pos.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d < 0.002) return;
      st.pos.x = nx; st.pos.y = ny; st.moved += d;
      var last = st.path[st.path.length - 1];
      if (Math.abs(last[0] - nx) + Math.abs(last[1] - ny) > 0.02) st.path.push([Math.round(nx * 1000) / 1000, Math.round(ny * 1000) / 1000]);
      fv.place(st.pos, st.h);
      if (st.scene) st.scene.listener(st.pos.x, st.pos.y, st.h);
    }
    function turnTo(h) { st.h = ((h % 360) + 540) % 360 - 180; fv.place(st.pos, st.h); if (st.scene) st.scene.listener(st.pos.x, st.pos.y, st.h); }
    function local(e) { var p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(inv); }
    svg.addEventListener('pointerdown', function (e) {
      if (st.phase !== 'search' || st.paused || st.grab || (e.pointerType === 'mouse' && e.button !== 0)) return;
      var m = svg.getScreenCTM();
      if (!m) return;
      inv = m.inverse(); scale = Math.sqrt(m.a * m.a + m.b * m.b) || 1;
      var p = local(e), y = sv(st.pos.x, st.pos.y), r = st.h * Math.PI / 180;
      var dYou = Math.hypot(p.x - y.x, p.y - y.y) * scale, dKnob = turn ? Math.hypot(p.x - (y.x + Math.sin(r) * KNOB), p.y - (y.y - Math.cos(r) * KNOB)) * scale : Infinity;
      if (turn && dKnob <= 30 && dKnob < dYou) st.grab = { id: e.pointerId, kind: 'turn' };
      else if (dYou <= GRAB_PX) st.grab = { id: e.pointerId, kind: 'walk', ox: st.pos.x - p.x / F, oy: st.pos.y + p.y / F };
      else { status.textContent = 'Grab the white dot (you), then drag.'; return; }
      e.preventDefault();
      try { svg.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      begin();
    });
    svg.addEventListener('pointermove', function (e) {
      if (!st.grab || e.pointerId !== st.grab.id || st.phase !== 'search') return;
      e.preventDefault();
      var p = local(e);
      if (st.grab.kind === 'walk') moveTo(p.x / F + st.grab.ox, -p.y / F + st.grab.oy);
      else { var y = sv(st.pos.x, st.pos.y); turnTo(Math.atan2(p.x - y.x, -(p.y - y.y)) * 180 / Math.PI); }
    });
    function up(e, cancel) {
      if (!st.grab || e.pointerId !== st.grab.id) return;
      var g = st.grab;
      st.grab = null;
      if (cancel || g.kind !== 'walk' || st.phase !== 'search') return;
      if (st.moved >= MIN_MOVE) commit(); else status.textContent = 'Drag to move, then let go where the voice is loudest.';
    }
    svg.addEventListener('pointerup', function (e) { up(e, false); });
    svg.addEventListener('pointercancel', function (e) { up(e, true); });
    svg.addEventListener('keydown', function (e) {
      if (st.phase !== 'search' || st.paused || e.altKey || e.ctrlKey || e.metaKey) return;
      var k = e.key, s = STEP * (e.shiftKey ? 3 : 1), d = { ArrowUp: [0, s], ArrowDown: [0, -s], ArrowLeft: [-s, 0], ArrowRight: [s, 0] }[k];
      if (d) { e.preventDefault(); begin(); moveTo(st.pos.x + d[0], st.pos.y + d[1]); return; }
      if (turn && /^[qQ\[eE\]]$/.test(k)) { e.preventDefault(); begin(); turnTo(st.h + (/^[qQ\[]$/.test(k) ? -15 : 15)); return; }
      if (k === 'Enter' || k === ' ') {
        e.preventDefault();
        if (st.moved >= MIN_MOVE) commit(); else status.textContent = 'Walk with the arrow keys first, then press Enter where the voice is loudest.';
      }
    });
    function commit() {
      if (st.phase !== 'search') return;
      st.grab = null;
      stopScene();
      st.searchMs = st.t0 ? Date.now() - st.t0 : 0;
      st.release = { x: Math.round(st.pos.x * 1000) / 1000, y: Math.round(st.pos.y * 1000) / 1000, h: Math.round(st.h) };
      phase('word', 'Your answer:');
      prompt.textContent = wordSlot.label || 'Which word was it calling?';
      u.clear(actions);
      var slot = JSON.parse(JSON.stringify(wordSlot));
      slot.label = '';
      st.panel = ES.ui.answerPanel([slot], onWord, { enabled: true });
      answerBox.appendChild(st.panel.el);
      st.t1 = Date.now();
      st.panel.focusFirst();
    }
    function onWord(resp) {
      var response = { picks: [{ x: st.release.x, y: st.release.y }, resp.picks[0]], idx: [null, resp.idx[0]], rts: [st.searchMs, resp.rts[0]],
        ms: st.searchMs + (Date.now() - st.t1), heading: st.release.h };
      var res = null;
      try { res = cfg.score(spec, response); } catch (e) { report('score', e); }
      if (!res || !res.slots) res = E().score(spec, response);
      st.panel.mark({ slots: [res.slots[1]] });
      if (cfg.onResult) { try { cfg.onResult(res, response); } catch (e) { report('record', e); } }
      feedback(res, response);
    }
    function nearDecoy() {
      var ws = (spec.meta && spec.meta.decoyWords) || [], hit = null;
      (live.decoys || []).forEach(function (d, i) { if (!hit && Math.hypot(st.release.x - d.x, st.release.y - d.y) <= found * 1.15) hit = ws[i]; });
      return hit ? ', at a decoy calling “' + hit + '”' : '';
    }
    function turnLine() {
      var a = Math.atan2(ans.x - st.release.x, ans.y - st.release.y) * 180 / Math.PI - st.release.h;
      a = ((a % 360) + 540) % 360 - 180;
      var m = Math.round(Math.abs(a)), side = a > 0 ? 'right' : 'left';
      if (m < 15) return 'You faced the voice squarely. Turning so it sits about 30° to one side gives the ear facing it a clearer copy.';
      if (m <= 70) return 'The voice sat ' + m + '° to your ' + side + ': your ' + side + ' ear faced it.';
      return 'The voice ended up ' + m + '° to your ' + side + (m > 110 ? ', behind you' : '') + '. About 30° to one side keeps it in front of the ear facing it.';
    }
    function feedback(res, response) {
      phase('feedback', '');
      drawReveal(fv, spec, st.path.concat([[st.release.x, st.release.y]]), st.release);
      var loc = res.slots[0] || {}, w = res.slots[1] || {}, lines = [];
      var dM = Math.round(Math.hypot(st.release.x - ans.x, st.release.y - ans.y) * M_PER_UNIT * 10) / 10;
      lines.push(loc.correct ? 'Found: you stopped ' + fmtM(dM) + ' from the voice.' : 'The voice was ' + fmtM(dM) + ' from where you stopped' + nearDecoy() + '.');
      if (w.correct) lines.push('It was calling “' + w.answer + '”.');
      else if (w.foil === 'masker') lines.push('“' + w.picked + '” was a decoy’s word; the voice you were after called “' + w.answer + '”.');
      else if (w.foil === 'neighbour') lines.push('“' + w.picked + '” sounds like “' + w.answer + '”, the word it was calling.');
      else lines.push('It was calling “' + w.answer + '”' + (w.picked != null ? ', not “' + w.picked + '”.' : '.'));
      if (turn) lines.push(turnLine());
      u.clear(fb);
      var ok = !!res.correct;
      fb.appendChild(u.el('p', { class: 'fb-head ' + (ok ? 'is-right' : 'is-wrong') }, [ES.ui.glyph(ok ? 'right' : 'wrong'),
        u.el('strong', null, ok ? 'Found and named' : res.prop > 0 ? (loc.correct ? 'Found it' : 'Named it') : 'Not quite')]));
      fb.appendChild(u.el('p', { class: 'fb-text' }, lines.join(' ')));
      u.clear(actions);
      var bedDb = -((+(live.target || {}).db || 0) - (+((live.bed || {}).db) || 0));
      [['The voice alone', oneClip(spec, live.target.clip, 2, null, 0)], ['Up close, in the noise', oneClip(spec, live.target.clip, 2, live.bed, bedDb)]].forEach(function (r, i) {
        actions.appendChild(ES.ui.button(r[0], { kind: 'secondary', cls: 'replay', attrs: { 'data-replay': String(i) }, onClick: function () {
          if (st.phase !== 'feedback' || st.player) return;
          setReplays(false); play(r[1], function () { setReplays(true); });
        } }));
      });
      var nx = ES.ui.button(cfg.nextLabelFor ? cfg.nextLabelFor(res) : 'Next', { kind: 'primary', cls: 'next', attrs: { 'data-next': '' }, onClick: function () { finish({ result: res, response: response, trial: spec }); } });
      actions.appendChild(nx);
      if (ES.core.util.focus) ES.core.util.focus(nx);
    }
    function finish(out) { if (st.done) return; st.done = true; stopPlayer(); stopScene(); if (st.panel && out.aborted) st.panel.destroy(); resolveDone(out); }
    if (decoys() && !cfg.practice) preview(); else search();
    return {
      done: done, spec: spec,
      state: function () { return st.paused ? 'paused' : st.phase; },
      pause: function () {
        if (st.paused || st.done) return;
        st.paused = true; st.grab = null;
        stopPlayer(); stopScene();
        if (st.phase === 'feedback') setReplays(true);
      },
      resume: function () {
        if (!st.paused || st.done) return;
        st.paused = false;
        if (st.phase === 'preview') preview();
        else if (st.phase === 'search') { status.textContent = st.t0 ? 'Paused. Grab the white dot to listen again.' : 'Grab the white dot (or press an arrow key) to start listening.'; Array.prototype.forEach.call(actions.querySelectorAll('button'), function (b) { b.disabled = false; }); }
      },
      abort: function () { finish({ aborted: true }); },
      peek: function () { return { phase: st.phase, pos: { x: st.pos.x, y: st.pos.y }, h: st.h, answer: ans, word: wordSlot.answer, turn: turn, listening: !!st.scene, paused: st.paused }; }
    };
  }


  var api = { run: runScene, css: css, M_PER_UNIT: M_PER_UNIT, fmtM: fmtM };
  try { Object.defineProperty(ES.ex, '_seekScene', { value: api, enumerable: false, configurable: true, writable: true }); }
  catch (e) { ES.ex._seekScene = api; }
})(typeof window !== 'undefined' ? window : globalThis);
