/* ES.core.clock — one active-time clock (CONTRACTS §3).
   Active time grows while the clock runs and the player is present. Rules:
   - idle limit 60 s: with no input() for 60 s the clock counts up to the limit, then stops (reason 'idle');
     the next input() resumes it;
   - a hidden tab pauses it (reason 'hidden'); a second pause keeps the first pause's start, and the clock
     runs again only when every reason has been cleared (resume(reason) clears one, resume() clears all).
   create(nowFn) makes an independent clock for tests; ES.core.clock is the app's single instance. */
(function (ES, win) {
  'use strict';
  var IDLE_MS = 60000;

  function create(nowFn) {
    var now = typeof nowFn === 'function' ? nowFn : function () { return Date.now(); };
    var started = false, acc = 0, segStart = 0, lastInput = 0, pausedAt = null, reasons = {};

    function running() { return started && pausedAt === null; }
    function stopAt(t, reason) {
      if (pausedAt === null) { acc += Math.max(0, t - segStart); pausedAt = t; }
      reasons[reason] = true;
    }
    function checkIdle(t) {
      if (running() && t - lastInput > IDLE_MS) stopAt(lastInput + IDLE_MS, 'idle');
    }
    var c = {
      IDLE_MS: IDLE_MS,
      /** Start (or restart) counting from zero. */
      start: function () {
        var t = now();
        started = true; acc = 0; segStart = t; lastInput = t; pausedAt = null; reasons = {};
      },
      pause: function (reason) {
        if (!started) return;
        var t = now();
        checkIdle(t);
        stopAt(t, reason || 'manual');
      },
      resume: function (reason) {
        if (!started) return;
        if (reason) delete reasons[reason]; else reasons = {};
        if (pausedAt !== null && Object.keys(reasons).length === 0) {
          var t = now();
          pausedAt = null; segStart = t; lastInput = t;
        }
      },
      /** Call on every player input (pointer, key); it also ends an idle pause. */
      input: function () {
        if (!started) return;
        var t = now();
        checkIdle(t);
        lastInput = t;
        if (reasons.idle) c.resume('idle');
      },
      activeMs: function () {
        if (!started) return acc;
        var t = now();
        checkIdle(t);
        return acc + (pausedAt === null ? Math.max(0, t - segStart) : 0);
      },
      /** Stop and return the final active time. */
      stop: function () {
        var ms = c.activeMs();
        if (pausedAt === null) { acc = ms; pausedAt = now(); }
        started = false;
        return ms;
      },
      isRunning: function () { checkIdle(now()); return running(); },
      reasons: function () { checkIdle(now()); return Object.keys(reasons); },
      pausedSince: function () { checkIdle(now()); return pausedAt; }
    };
    return c;
  }

  var clock = create();
  clock.create = create;
  /** Wire the app clock to the page: hidden tab pauses; pointer and key input count as presence. */
  clock.attach = function (doc) {
    doc = doc || (win && win.document);
    if (!doc || clock._attached) return;
    clock._attached = true;
    doc.addEventListener('visibilitychange', function () {
      if (doc.hidden) clock.pause('hidden'); else clock.resume('hidden');
    });
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) {
      doc.addEventListener(ev, function () { clock.input(); }, { passive: true, capture: true });
    });
  };
  ES.core.clock = clock;
})(window.ES, window);
