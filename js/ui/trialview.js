/* ES.ui.trialView.run(host, cfg) — one closed-set trial (PLAN §6 trial anatomy):
   field picture → the sound, rendered first and played once → answer panel → feedback (✓/✕ with words, which
   voice a wrong pick came from) → replays (target alone, then the mix) → Next. A right answer moves on by
   itself after cfg.autoMs; a wrong one waits for Next. Nothing on screen changes while sound plays: the status
   line is set before playback, toasts wait (ES.ui.quiet) and store writes wait (store.hold).
   cfg = { trial, mode:'set'|'practice'|'demo', score(trial, resp)→result, onResult?(result, resp), autoNext,
           autoMs, nextLabel, nextLabelFor?(result), answerNote, foilWords?, autoReplays?(result)→[idx] }
   → { done: Promise<{result, response, trial}|{skipped}|{aborted}>, pause(), resume(), abort(), state() }
   Optional exercise hooks (requests from exA; all guarded): ES.ex[id].prepare(trial) → trial at the start;
   trial.prime = {text, ms} shows the words for ≥ 1 s before playback (static during it); ES.ex[id].review(trial,
   result) → {text, words, auto:[replay index]} replaces the generic lines and plays those replays in order. */
(function (ES, win) {
  'use strict';
  var U = ES.core.util;
  var FOIL_WORDS = { masker: 'said by another voice', neighbour: 'sounds alike', context: 'fits the context', random: 'not in the sound' };

  function isDemo(trial) { return !!(trial && trial.meta && trial.meta.demo); }
  function replaySpec(trial, i) { var r = trial.feedback && trial.feedback.replays && trial.feedback.replays[i]; return r ? r.audio : null; }
  function renderAudio(trial, which) {
    if (isDemo(trial)) return ES.ui.demo.render(trial, which == null ? null : (replaySpec(trial, which) || {}).only);
    var spec = which == null ? trial.audio : replaySpec(trial, which);
    // The trial's own seed for every replay: "again" is the identical sound, and "target alone" processes the
    // target exactly as in the mix (the renderer keys its random streams by role and clip).
    return Promise.resolve(ES.audio.render(spec, { seed: String(trial.seed) }))
      .then(function (r) { return r && r.buffer ? r.buffer : r; });
  }
  /** Wait (briefly) for a running audio context; resolves true when sound can come out. */
  function audioReady(real) {
    var A = real ? ES.audio.ctx : null;
    if (A && typeof A.state === 'function') {
      if (A.state() === 'running') return Promise.resolve(true);
      return Promise.resolve(typeof A.unlock === 'function' ? A.unlock(700) : null).then(function () { return A.state() === 'running'; }, function () { return false; });
    }
    var c = ES.ui.sound.ctx();
    if (!c) return Promise.resolve(false);
    if (c.state === 'running') return Promise.resolve(true);
    try { c.resume(); } catch (e) { /* ignore */ }
    return new Promise(function (res) { setTimeout(function () { res(c.state === 'running'); }, 400); });
  }
  /** Play once. ended resolves {silent:true} when no sound came out (no or suspended context, ok:false, a throw):
      such a play is not a heard trial (RV H2). */
  function playAudio(buf) {
    var real = !!(buf && typeof buf.getChannelData === 'function' && ES.audio && typeof ES.audio.play === 'function');
    var stopped = false, inner = null;
    var ended = audioReady(real).then(function (ok) {
      if (stopped) return { stopped: true };
      if (!ok) return { silent: true, reason: 'suspended' };
      inner = real ? (ES.audio.play(buf) || {}) : ES.ui.sound.play(buf);
      return Promise.resolve(inner.ended).then(function (r) {
        if (real) return { silent: !!(r && r.ok === false), reason: r && r.reason };
        return { silent: !!(r && r.silent) };
      }, function () { return { silent: true, reason: 'error' }; });
    });
    return { stop: function () { stopped = true; try { if (inner && inner.stop) inner.stop(); } catch (e) { /* ignore */ } }, ended: ended };
  }
  /** A render that hangs ends in the error state (Skip) after 15 s (RV L7; ES_CONFIG.renderTimeoutMs for tests). */
  function renderMs() { var v = ES.CONFIG && +ES.CONFIG.renderTimeoutMs; return v > 0 ? v : 15000; }
  function withTimeout(p, ms) {
    return new Promise(function (res, rej) {
      var t = setTimeout(function () { rej(new Error('The sound took too long to prepare.')); }, ms);
      p.then(function (v) { clearTimeout(t); res(v); }, function (e) { clearTimeout(t); rej(e); });
    });
  }
  function hold() { if (ES.core.store && ES.core.store.hold) ES.core.store.hold(); }
  function release() { if (ES.core.store && ES.core.store.release) ES.core.store.release(); }
  function report(e) {
    if (win.console) console.error('[trial]', e);
    if (ES._keepError) ES._keepError({ at: Date.now(), kind: 'trial', msg: String(e && e.message || e), stack: String(e && e.stack || '').slice(0, 800) });
  }

  function run(host, cfg) {
    var trial = cfg.trial, X = trial && ES.ex[trial.ex];
    if (X && typeof X.prepare === 'function') { try { trial = X.prepare(trial) || trial; } catch (e) { report(e); } }
    var mode = cfg.mode || 'set', q = trial.question || { slots: [] }, words = Object.assign({}, FOIL_WORDS, cfg.foilWords || {});
    var primed = false, primeT = null, holdT = null, needsHold = false, listenPauses = 0, replayTok = 0, voided = false;
    // Echo: question.delayMs keeps the options out of sight while the sound plays and for the delay after it
    // (seeing them would cue what to listen for); the status stays a neutral "Hold it in mind…".
    var delayMs = Math.max(0, Math.min(15000, +(q.delayMs) || 0));
    var state = 'loading', player = null, playTok = 0, panel, result = null, resp = null, autoT = null, aborted = false;
    var needsReplay = false, cache = {}, t0 = 0, resolveDone, nextBtn = null, keyBound = false;
    var done = new Promise(function (r) { resolveDone = r; });

    U.clear(host);
    var svg = ES.ui.field(null, trial.picture || { voices: [] });
    var prompt = U.el('p', { class: 'trial-prompt' }, cfg.prompt || q.prompt || '');
    var primeEl = U.el('p', { class: 'trial-prime', hidden: true });
    var status = U.el('p', { class: 'trial-status', 'aria-live': 'polite' });
    var fb = U.el('div', { class: 'trial-feedback' });
    var answerBox = U.el('div', { class: 'trial-answer' });
    var actions = U.el('div', { class: 'trial-actions' });
    var body = U.el('div', { class: 'trial-body', 'data-state': 'loading', 'data-mode': mode }, [
      U.el('div', { class: 'trial-field' }, svg), U.el('div', { class: 'trial-text' }, [primeEl, prompt, status, fb]), answerBox, actions]);
    host.appendChild(body);
    panel = ES.ui.answerPanel(q.slots, onAnswer, { enabled: false });
    answerBox.appendChild(panel.el);
    if (delayMs && mode !== 'demo') answerBox.classList.add('is-held');

    function setState(s, text) { state = s; body.setAttribute('data-state', s); if (text != null) status.textContent = text; }
    function get(which) {
      if (which != null && !isDemo(trial) && replaySpec(trial, which) === trial.audio) which = null;  // replaying the stimulus itself
      var k = which == null ? 'main' : 'r' + which;
      if (!cache[k]) cache[k] = withTimeout(renderAudio(trial, which), renderMs());
      return cache[k];
    }
    function playBuf(buf, onEnd) {
      var tok = ++playTok, ended = false;
      ES.ui.quiet(true); hold();
      function end(r) {
        if (ended) return;
        ended = true;
        ES.ui.quiet(false); release();
        if (tok === playTok) { player = null; onEnd(r || {}); }
      }
      try { player = playAudio(buf); } catch (e) { report(e); end({ silent: true }); return; }
      player._end = end;
      player.ended.then(end, function () { end({ silent: true }); });
    }
    function stopPlayer() {
      if (!player) return;
      var p = player;
      player = null; playTok++;
      try { p.stop(); } catch (e) { /* ignore */ }
      if (p._end) p._end({ stopped: true });
    }
    function cancelAuto() { if (autoT) { clearTimeout(autoT); autoT = null; } }

    var loadTok = 0;
    function load(text) {
      var tok = ++loadTok;
      setState('loading', text);
      get(null).then(function (buf) {
        if (aborted || tok !== loadTok || state !== 'loading') return;
        if (trial.prime && trial.prime.text && !primed) showPrime(buf); else listen(buf);
      }, function (err) { if (tok === loadTok) fail(err); });
    }
    function showPrime(buf) {
      primed = true;
      primeEl.textContent = trial.prime.text;
      primeEl.hidden = false;
      setState('prime', 'Read the words, then listen…');
      primeT = setTimeout(function () { primeT = null; if (!aborted && state === 'prime') listen(buf); }, Math.max(1000, trial.prime.ms | 0));
    }
    function start() { load('Getting the sound ready…'); }
    function listen(buf) {
      clearCaption();
      setState('listen', mode === 'demo' ? 'Listen to the example…' : 'Listen…');
      playBuf(buf, function (r) {
        if (aborted || state !== 'listen' || r.stopped) return;
        if (r.silent) { noSound(buf); return; }
        showCaption();
        if (mode === 'demo') { showExample(r); return; }
        if (delayMs && answerBox.classList.contains('is-held')) { holdAnswer(r); return; }
        openAnswer(r);
      });
    }
    /** Testing aid for agents that cannot hear (test builds only, `?captions=1`): shows what the target said. */
    function showCaption() {
      var on = false;
      try { on = !!ES.TEST_BUILD && (!!(ES.CONFIG && ES.CONFIG.captions) || /[?&]captions=1(&|$)/.test(String(win.location.search))); } catch (e) { on = false; }
      if (!on || !prompt.parentNode) return;
      clearCaption();
      var m = trial.meta || {}, said = m.text || (m.items && m.items.length ? m.items.join(' · ') : '(no text for this trial)');
      prompt.parentNode.appendChild(U.el('p', { class: 'trial-caption', 'data-caption': '' }, 'Test aid · said: ' + said));
    }
    function clearCaption() {
      try { var old = prompt.parentNode && prompt.parentNode.querySelectorAll('.trial-caption'); for (var i = 0; old && i < old.length; i++) old[i].parentNode.removeChild(old[i]); } catch (e) { /* ignore */ }
    }
    /** No sound came through: nothing is shown as heard, nothing is scored; a tap unlocks audio and plays again. */
    function noSound(buf) {
      setState('nosound', 'The sound didn’t play. Tap to try again.');
      U.clear(actions);
      actions.appendChild(ES.ui.button('Play the sound again', { kind: 'primary', attrs: { 'data-retry': '' }, onClick: function () {
        ES.ui.sound.unlock();
        try { if (ES.audio && ES.audio.ctx && typeof ES.audio.ctx.unlock === 'function') ES.audio.ctx.unlock(); } catch (e) { /* ignore */ }
        U.clear(actions);
        listen(buf);
      } }));
    }
    function holdAnswer(r) {
      setState('hold', 'Hold it in mind…');
      holdT = setTimeout(function () { holdT = null; if (aborted || state !== 'hold') return; answerBox.classList.remove('is-held'); openAnswer(r); }, delayMs);
    }
    function openAnswer(r) {
      r = r || {};
      setState('answer', q.slots.length > 1 ? 'Your answers:' : 'Your answer:');
      panel.enable();
      t0 = Date.now();
      panel.focusFirst();
      (trial.feedback && trial.feedback.replays || []).forEach(function (x, i) { get(i).catch(function () { /* replay shows its own error */ }); });
    }
    function fail(err) {
      report(err);
      if (aborted) return;
      setState('error', 'This sound could not be prepared.');
      U.clear(actions);
      actions.appendChild(ES.ui.button('Skip this trial', { kind: 'primary', attrs: { 'data-skip': '' }, onClick: function () { finish({ skipped: true, error: String(err && err.message || err) }); } }));
    }
    function onAnswer(response) {
      resp = response;
      resp.ms = Date.now() - t0;
      try { result = cfg.score(trial, resp); } catch (e) { report(e); result = ES.ui.demo.score(trial, resp); }
      if (!result || !result.slots) result = ES.ui.demo.score(trial, resp);
      panel.mark(result);
      if (typeof cfg.onResult === 'function') { try { cfg.onResult(result, resp, trial); } catch (e) { report(e); } }
      showFeedback();
    }
    function slotLine(s, r) {
      if (r.correct) return null;
      var picked = r.picked == null ? 'nothing' : '“' + r.picked + '”';
      var why = r.foil && words[r.foil] && r.foil !== 'random' ? ' (' + words[r.foil] + ')' : '';
      var lead = q.slots.length > 1 ? (/[?]$/.test(s.label) ? s.label + ' You picked ' : s.label + ': you picked ') : 'you picked ';
      return lead + picked + why + ', it was “' + r.answer + '”.';
    }
    function showFeedback() {
      setState('feedback', '');
      U.clear(fb);
      var ok = !!result.correct, partly = !ok && result.prop > 0;
      fb.appendChild(U.el('p', { class: 'fb-head ' + (ok ? 'is-right' : 'is-wrong') }, [
        ES.ui.glyph(ok ? 'right' : 'wrong'), U.el('strong', null, ok ? 'Right' : partly ? 'Partly right' : 'Not quite')]));
      var rv = null;
      if (X && typeof X.review === 'function') { try { rv = X.review(trial, result); } catch (e) { report(e); } }
      var lines = [];
      q.slots.forEach(function (s, i) { var l = slotLine(s, result.slots[i] || {}); if (l) lines.push(l); });
      var detail = rv && rv.text ? String(rv.text) : lines.join(' ') + (trial.feedback && trial.feedback.text ? (lines.length ? ' ' : '') + trial.feedback.text : '');
      if (detail) fb.appendChild(U.el('p', { class: 'fb-text' }, detail.charAt(0).toUpperCase() + detail.slice(1)));
      if (rv && rv.words) fb.appendChild(U.el('p', { class: 'fb-words' }, String(rv.words)));
      buildActions(result);
      bindKeys();
      var auto = [].concat(rv && rv.auto || [], typeof cfg.autoReplays === 'function' ? cfg.autoReplays(result) || [] : [])
        .filter(function (x, i, a) { return typeof x === 'number' && replaySpec(trial, x) && a.indexOf(x) === i; });
      playSeq(auto, rv && rv.words ? 'Again, with the words…' : 'Listen again…', function () {
        if (ok && mode === 'set' && cfg.autoNext !== false) autoT = setTimeout(next, cfg.autoMs || 1200);
        else if (nextBtn) U.focus(nextBtn);
      });
    }
    /** Play replays in order after feedback; Next stays enabled and stops them. */
    function playSeq(list, text, then) {
      if (!list.length) { then(); return; }
      var i = 0;
      status.textContent = text;
      setReplays(false);
      body.setAttribute('data-playing', 'auto');
      (function step() {
        if (aborted || state !== 'feedback') return;
        if (i >= list.length) { body.removeAttribute('data-playing'); status.textContent = ''; setReplays(true); then(); return; }
        var idx = list[i++], tok = replayTok;
        get(idx).then(function (buf) { if (!aborted && state === 'feedback' && tok === replayTok) playBuf(buf, step); }, function (e) { report(e); step(); });
      })();
    }
    function showExample(r) {
      setState('example', '');
      var res = { slots: q.slots.map(function (s) { return { picked: null, answer: String(s.answer), correct: false }; }) };
      panel.mark(res);
      panel.annotate(q.slots.map(function (s) {
        var n = {};
        Object.keys(s.foils || {}).forEach(function (k) { n[k] = words[s.foils[k]] || ''; });
        n[String(s.answer)] = cfg.answerNote || 'the answer';
        return n;
      }));
      U.clear(fb);
      fb.appendChild(U.el('p', { class: 'fb-head is-right' }, [ES.ui.glyph('right'), U.el('strong', null, 'The marked key is the answer')]));
      if (trial.feedback && trial.feedback.text) fb.appendChild(U.el('p', { class: 'fb-text' }, trial.feedback.text));
      buildActions();
      bindKeys();
    }
    function buildActions(res) {
      U.clear(actions);
      (trial.feedback && trial.feedback.replays || []).slice(0, 2).forEach(function (r, i) {
        actions.appendChild(ES.ui.button(r.label, { kind: 'secondary', cls: 'replay', attrs: { 'data-replay': String(i) }, onClick: function () { replay(i); } }));
      });
      var label = typeof cfg.nextLabelFor === 'function' && res ? cfg.nextLabelFor(res) : cfg.nextLabel || 'Next';
      nextBtn = ES.ui.button(label || 'Next', { kind: 'primary', cls: 'next', attrs: { 'data-next': '' }, onClick: next });
      actions.appendChild(nextBtn);
    }
    function setReplays(on) { Array.prototype.forEach.call(actions.querySelectorAll('.replay'), function (b) { b.disabled = !on; }); }
    function replay(i) {
      if (state !== 'feedback' && state !== 'example') return;
      cancelAuto();
      setReplays(false);
      body.setAttribute('data-playing', 'replay');
      var tok = replayTok;
      get(i).then(function (buf) {
        if (aborted || tok !== replayTok) return;            // paused while it was rendering: it never starts (RV L1)
        playBuf(buf, function (r) {
          body.removeAttribute('data-playing'); setReplays(true);
          if (r && r.silent) ES.ui.toast('No sound came through. Check the volume, then try again.');
        });
      }, function (e) { report(e); body.removeAttribute('data-playing'); setReplays(true); ES.ui.toast('That replay could not be prepared.'); });
    }
    function onKey(e) {
      if (state !== 'feedback' && state !== 'example') return;
      if (ES.ui.sheetOpen && ES.ui.sheetOpen()) return;
      var a = win.document.activeElement;
      if (e.key === 'Enter' && !(a && (a.tagName === 'BUTTON' || a.tagName === 'A' || a.tagName === 'TEXTAREA'))) { e.preventDefault(); next(); }
    }
    function bindKeys() { if (!keyBound) { win.document.addEventListener('keydown', onKey); keyBound = true; } }
    function unbindKeys() { if (keyBound) { win.document.removeEventListener('keydown', onKey); keyBound = false; } }
    function finish(out) {
      if (state === 'done') return;
      cancelAuto(); stopPlayer(); unbindKeys();
      if (primeT) { clearTimeout(primeT); primeT = null; }
      state = 'done';
      resolveDone(out);
    }
    function next() {
      if (state !== 'feedback' && state !== 'example') return;
      finish({ result: result, response: resp, trial: trial });
    }

    start();
    var handle = {
      done: done,
      state: function () { return state; },
      /** Pause: stop the sound. A pause while the stimulus plays allows one replay of it on resume; a second such
          pause voids the trial (RV M7): resume then ends it as {voided:true} and the set draws a new one; nothing is
          charged. A replay that is still rendering never starts under the pause (RV L1). */
      pause: function () {
        cancelAuto();
        replayTok++;
        if (primeT) { clearTimeout(primeT); primeT = null; }
        if (state === 'hold') { if (holdT) { clearTimeout(holdT); holdT = null; } needsHold = true; setState('paused', 'Paused'); return; }
        if (state === 'listen') { listenPauses++; if (listenPauses >= 2) voided = true; }
        if (state === 'listen' || state === 'loading' || state === 'prime') { loadTok++; stopPlayer(); needsReplay = true; setState('paused', 'Paused'); }
        else if ((state === 'feedback' || state === 'example') && (player || body.hasAttribute('data-playing'))) {   // a replay: stop it
          stopPlayer();
          body.removeAttribute('data-playing');
          status.textContent = '';
          setReplays(true);
        }
      },
      resume: function () {
        if (aborted) return;
        if (voided) { finish({ voided: true }); return; }
        if (needsHold) { needsHold = false; holdAnswer({}); return; }
        if (!needsReplay) return;
        needsReplay = false;
        load('Listen again…');
      },
      voided: function () { return voided; },
      abort: function () {
        if (aborted) return;
        aborted = true;
        cancelAuto(); stopPlayer(); unbindKeys();
        if (primeT) { clearTimeout(primeT); primeT = null; }
        if (holdT) { clearTimeout(holdT); holdT = null; }
        panel.destroy();
        state = 'done';
        resolveDone({ aborted: true });
      },
      trial: trial
    };
    ES.ui.trialView.current = handle;     // the running trial (tests and playtest reports read it)
    return handle;
  }

  ES.ui.trialView = { run: run, renderAudio: renderAudio, FOIL_WORDS: FOIL_WORDS, supports: { delay: true, prime: true, review: true } };
})(window.ES, window);
