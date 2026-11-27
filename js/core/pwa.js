/* ES.core.pwa — the installable, offline Pages build and the in-app browser notice (lead decision in DECISIONS.md,
   2026-11-26 23:37 UTC). MIT licence.
   Service worker (sw.js; its precache list is written by tools/build-sw.mjs): registered only on https (or http on
   localhost), in a top-level page with a real origin, when this script was loaded from its own file (the
   single-file build inlines every script, so it never registers there), and not in a test build. Automated
   browsers (navigator.webdriver) skip it unless ES_CONFIG.pwa === true, so other browser tests keep pages without a
   worker; ES_CONFIG.pwa === false turns it off. The worker registers after the page's load event.
   Updates are taken as whole versions: when a new worker is installed and waiting, a banner says "A new version
   of Earshot is ready." with Reload. It never appears during a set (ES.ui.inSet), a trial screen or a playing
   stimulus; it waits and shows after. Reload asks the waiting worker to take over (skipWaiting), then reloads.
   In-app browsers (Discord, Instagram, Facebook/Messenger, TikTok, Snapchat, LINE, X/Twitter; known by their user
   agent, never a generic Android webview such as the Claude app's) may drop storage and block downloads: a lasting
   banner asks the player to open Earshot in their browser, with Dismiss. The dismissal is kept per device in
   localStorage `earshot.v1.$inapp` ({v, at}). Never on file://, in srcdoc or opaque-origin frames, or during a set.
   Pure parts (inApp, canRegister, noticeAllowed) take plain values and load in Node for unit tests. */
(function (ES, win) {
  'use strict';
  var doc = win.document;
  var SCRIPT = '';
  try { SCRIPT = String((doc && doc.currentScript && doc.currentScript.src) || ''); } catch (e) { SCRIPT = ''; }
  var KEY = 'earshot.v1.$inapp';
  var CHECK_MS = 30 * 60 * 1000;        // look for a new version at most this often when the app comes back to view
  var TEXT = {
    update: 'A new version of Earshot is ready.', reload: 'Reload',
    inapp: 'You opened Earshot inside an app. To keep your progress, open it in your browser (menu → Open in browser).',
    dismiss: 'Dismiss'
  };
  // In-app browsers by user agent token. A generic Android webview ("; wv)") is not one of them on its own.
  var APPS = [
    ['Facebook', /\bFBAN\/|\bFBAV\/|\bFB_IAB\/|\bFBIOS\b|\bFB4A\b/],
    ['Instagram', /\bInstagram\b/],
    ['TikTok', /\bmusical_ly|\bBytedanceWebview\b|\bTikTok\b|\btrill_\d/i],
    ['Snapchat', /\bSnapchat\b/i],
    ['LINE', /\bLine\/\d/],
    ['X', /\bTwitter(?:Android)?\b/],
    ['Discord', /\bdiscord(?:android|ios)?\/\d/i]
  ];

  /** The in-app browser a user agent belongs to ('Instagram', …), or null. */
  function inApp(ua) {
    ua = String(ua || '');
    for (var i = 0; i < APPS.length; i++) if (APPS[i][1].test(ua)) return APPS[i][0];
    return null;
  }
  function local(host) { return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1' || /\.localhost$/.test(host); }
  /** May this page register the worker? env: {protocol, hostname, origin, top, script, test, sw, webdriver, config}
      → {ok, reason}; reasons: off, unsupported, protocol, opaque, frame, inline, bundled, test-build, automation. */
  function canRegister(env) {
    env = env || {};
    var cfg = env.config || {};
    function no(reason) { return { ok: false, reason: reason }; }
    if (cfg.pwa === false) return no('off');
    if (!env.sw) return no('unsupported');
    if (!(env.protocol === 'https:' || (env.protocol === 'http:' && local(String(env.hostname || ''))))) return no('protocol');
    if (!env.origin || env.origin === 'null') return no('opaque');
    if (!env.top) return no('frame');
    if (!env.script) return no('inline');
    if (String(env.script).indexOf(env.origin + '/') !== 0 || !/\/js\/core\/pwa\.js(?:[?#].*)?$/.test(env.script)) return no('bundled');
    if (env.test) return no('test-build');
    if (env.webdriver && cfg.pwa !== true) return no('automation');
    return { ok: true, reason: 'ok' };
  }
  /** May the in-app notice show here? Not on file:, about:srcdoc, data: or blob: pages, nor in opaque-origin frames. */
  function noticeAllowed(env) {
    env = env || {};
    return (env.protocol === 'https:' || env.protocol === 'http:') && !!env.origin && env.origin !== 'null';
  }
  function readEnv() {
    var loc = win.location || {}, nav = win.navigator || {}, top = false, sw = false;
    try { top = win.top === win.self; } catch (e) { top = false; }
    try { sw = !!(nav.serviceWorker && typeof nav.serviceWorker.register === 'function'); } catch (e) { sw = false; }   // sandboxed frames throw
    return { protocol: String(loc.protocol || ''), hostname: String(loc.hostname || ''), origin: String(loc.origin || ''),
      top: top, script: SCRIPT, test: !!ES.TEST_BUILD, sw: sw, webdriver: nav.webdriver === true,
      ua: String(nav.userAgent || ''), config: ES.CONFIG || {} };
  }

  // ---- banners wait for a free moment: not in a set, not on a trial screen, no stimulus playing ----
  var pending = [], poll = null;
  function free() {
    if (!doc || !doc.documentElement.classList.contains('ready')) return false;
    if (ES.ui.inSet || doc.documentElement.classList.contains('in-trial')) return false;
    return !(typeof ES.ui.isQuiet === 'function' && ES.ui.isQuiet());
  }
  function flush() {
    if (!pending.length) { stopPoll(); return; }
    if (!free()) { if (!poll) poll = win.setInterval(flush, 4000); return; }
    var q = pending;
    pending = [];
    stopPoll();
    q.forEach(function (fn) { try { fn(); } catch (e) { if (win.console) console.error('[pwa]', e); } });
  }
  function stopPoll() { if (poll) { win.clearInterval(poll); poll = null; } }
  function whenFree(fn) { pending.push(fn); flush(); }
  function soon() { if (pending.length) win.setTimeout(flush, 0); }

  // ---- the service worker ----
  var S = { started: false, reason: null, registered: false, waiting: false, offered: false, version: null, error: null, notice: null, app: null };
  var reg = null, lastCheck = 0, reloading = false, reloaded = false;
  function reload() {
    if (reloaded) return;
    reloaded = true;
    try { win.location.reload(); } catch (e) { /* nothing else to do */ }
  }
  /** Reload: the waiting worker takes over, then the page reloads into the new version. */
  function applyUpdate() {
    if (reloading) return;
    reloading = true;
    try { if (ES.core.store && ES.core.store.flush) ES.core.store.flush(); } catch (e) { /* best effort */ }
    var w = reg && reg.waiting, sw = win.navigator.serviceWorker;
    if (!w || !sw) { reload(); return; }
    sw.addEventListener('controllerchange', reload);
    try { w.postMessage({ type: 'skipWaiting' }); } catch (e) { reload(); return; }
    win.setTimeout(reload, 5000);       // it never took over: a plain reload still gets one whole version
  }
  function offer() {
    S.waiting = true;
    if (S.offered) return;
    S.offered = true;
    whenFree(function () {
      if (ES.ui.banner) ES.ui.banner('update', { kind: 'info', text: TEXT.update, action: { label: TEXT.reload, onClick: applyUpdate } });
    });
  }
  function track(r) {
    var sw = win.navigator.serviceWorker;
    if (r.waiting && sw.controller) offer();
    r.addEventListener('updatefound', function () {
      var w = r.installing;
      if (!w) return;
      w.addEventListener('statechange', function () { if (w.state === 'installed' && sw.controller) offer(); });
    });
  }
  function askVersion() {
    var c = win.navigator.serviceWorker && win.navigator.serviceWorker.controller;
    if (c) { try { c.postMessage({ type: 'version' }); } catch (e) { /* ignore */ } }
  }
  /** Look for a new version now (resolves when the browser has checked). */
  function update() {
    if (!reg) return Promise.resolve(false);
    lastCheck = Date.now();
    return Promise.resolve(reg.update()).then(function () { return true; }, function () { return false; });
  }
  function register() {
    var env = readEnv(), can = canRegister(env);
    S.reason = can.reason;
    if (!can.ok) return;
    var root = env.script.replace(/js\/core\/pwa\.js(?:[?#].*)?$/, ''), sw = win.navigator.serviceWorker;
    sw.addEventListener('message', function (ev) {
      if (ev.data && ev.data.type === 'version') S.version = ev.data.version;
    });
    sw.register(root + 'sw.js', { scope: root, updateViaCache: 'none' }).then(function (r) {
      reg = r;
      S.registered = true;
      lastCheck = Date.now();
      track(r);
      askVersion();
    }, function (e) { S.error = String(e && e.message || e); });
    doc.addEventListener('visibilitychange', function () {
      if (doc.visibilityState === 'visible' && reg && !reloading && !ES.ui.inSet && Date.now() - lastCheck > CHECK_MS) update();
    });
  }

  // ---- the in-app browser notice ----
  function dismissed() { try { return !!win.localStorage.getItem(KEY); } catch (e) { return false; } }
  function remember() { try { win.localStorage.setItem(KEY, JSON.stringify({ v: 1, at: Date.now() })); return true; } catch (e) { return false; } }
  function notice() {
    var env = readEnv(), app = inApp(env.ua);
    S.app = app;
    S.notice = !app ? 'none' : !noticeAllowed(env) ? 'not-here' : dismissed() ? 'dismissed' : 'shown';
    if (S.notice !== 'shown') return;
    whenFree(function () {
      if (!ES.ui.banner) return;
      ES.ui.banner('inapp', { kind: 'warn', text: TEXT.inapp, action: { label: TEXT.dismiss, onClick: function () {
        remember();
        S.notice = 'dismissed';
        ES.ui.banner('inapp', null);
      } } });
    });
  }

  function start() {
    if (S.started || !doc) return;
    S.started = true;
    notice();
    // after the load event, so the worker's downloads never compete with the app's own start
    if (doc.readyState === 'complete') win.setTimeout(register, 500);
    else win.addEventListener('load', function () { win.setTimeout(register, 500); });
  }

  ES.core.pwa = {
    KEY: KEY, TEXT: TEXT, APPS: APPS, inApp: inApp, canRegister: canRegister, noticeAllowed: noticeAllowed,
    env: readEnv, start: start, update: update, applyUpdate: applyUpdate,
    state: function () { var o = {}; Object.keys(S).forEach(function (k) { o[k] = S[k]; }); o.pending = pending.length; return o; }
  };
  if (doc) {
    ['app:ready', 'set:done', 'session:done', 'route', 'lab:run'].forEach(function (h) { ES.hooks.on(h, soon); });
    ES.hooks.on('app:ready', start);
  }
})(window.ES, window);
