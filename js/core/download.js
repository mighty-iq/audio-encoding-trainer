/* ES.core.download — the one way Earshot saves a file: backups, Lab exports (JSON, CSV, pool file) and the weekly
   card (PNG). Call save() only from an explicit tap.
   save(name, data, mime, opts) → Promise<{ok, how, message, code?}>; data is a string, a Blob or an ArrayBuffer.
   In the claude.ai artifact viewer a plain download link does nothing (the frame may not download), so there the
   host's `downloads` capability saves the file: at start-up (non-blocking) the module looks for window.claude.use
   (it may appear late; no other member of window.claude is read), calls claude.use('downloads') once and keeps the
   namespace (it resolves later; null after ~10 s or when the capability is missing). With it:
   downloads.save({filename, data}) (json, csv, png and txt files). Without it: a Blob and an a[download] link.
   how: 'downloads' the host saved it · 'anchor' a browser download was started (a blocked one shows nothing, so the
   message offers Copy) · 'declined' the player said no (nothing is said) · 'rate_limited' "Try again in a moment" ·
   'unavailable' this view cannot save files (host_unavailable, unavailable or an unknown code) · 'blocked' no Blob
   URLs here.
   opts.copyText: what Copy puts on the clipboard (default: data when it is text; the weekly card passes its text).
   opts.ui === false: the caller shows res.message in its own sheet with a Copy button; only "Try again in a moment"
   still comes from here. opts.fallback(res): replaces the default sheet after 'unavailable' or 'blocked'. */
(function (ES, win) {
  'use strict';
  var U = ES.core.util;
  var WAIT_SAVE_MS = 2000, POLL_MS = 4000, GIVE_UP_MS = 12000;
  // idle → polling (no runtime yet) → asking (claude.use('downloads') in flight) → ready | none
  var D = { ns: null, state: 'idle', waiters: [] };

  function settle(ns) {
    if (ns && typeof ns.save === 'function') { D.ns = ns; D.state = 'ready'; }
    else if (D.state !== 'ready') D.state = 'none';
    var w = D.waiters;
    D.waiters = [];
    w.forEach(function (f) { f(); });
  }
  /** Start-up: find the artifact runtime and ask for the downloads capability once. Never blocks. */
  function connect() {
    if (D.state !== 'idle') return;
    D.state = 'polling';
    var t0 = Date.now();
    (function poll() {
      var c = win.claude;
      if (c && typeof c.use === 'function') {
        D.state = 'asking';
        var gaveUp = setTimeout(function () { if (D.state === 'asking') settle(null); }, GIVE_UP_MS);
        Promise.resolve().then(function () { return c.use('downloads'); }).then(function (ns) { clearTimeout(gaveUp); settle(ns); },
          function () { clearTimeout(gaveUp); settle(null); });     // a late namespace is still kept (settle)
        return;
      }
      if (Date.now() - t0 > POLL_MS) { settle(null); return; }
      setTimeout(poll, 200);
    })();
  }
  /** The namespace or null. Waits (up to ms) only while the capability request is in flight. */
  function ready(ms) {
    if (D.state === 'idle') connect();
    if (D.state !== 'asking') return Promise.resolve(D.ns);
    return new Promise(function (res) {
      var t = setTimeout(function () { res(D.ns); }, ms);
      D.waiters.push(function () { clearTimeout(t); res(D.ns); });
    });
  }

  function anchor(name, data, mime) {
    try {
      var URLo = win.URL || win.webkitURL;
      if (!URLo || typeof URLo.createObjectURL !== 'function') return false;
      var blob = win.Blob && data instanceof win.Blob ? data : new win.Blob([data], { type: mime || 'application/octet-stream' });
      var url = URLo.createObjectURL(blob), a = U.el('a', { href: url, download: name, rel: 'noopener', class: 'offscreen' });
      win.document.body.appendChild(a);
      a.click();
      win.document.body.removeChild(a);
      setTimeout(function () { try { URLo.revokeObjectURL(url); } catch (e) { /* ignore */ } }, 5000);
      return true;
    } catch (e) { return false; }
  }
  function failure(code, name) {
    if (code === 'declined') return { ok: false, how: 'declined', code: code, message: '' };
    if (code === 'rate_limited') return { ok: false, how: 'rate_limited', code: code, message: 'Try again in a moment.' };
    return { ok: false, how: 'unavailable', code: code || 'unknown',
      message: 'This view cannot save files. To save ' + name + ', open Earshot in a browser, or copy the text instead.' };
  }
  function copy(text, name) { return ES.ui.copyText(text, { title: name, toast: 'Copied' }); }
  /** What the player sees (unless the caller shows it). */
  function show(res, text, name, opts) {
    if (res.how === 'declined') return;
    if (res.how === 'rate_limited') { ES.ui.toast(res.message); return; }
    if (opts.ui === false) return;
    if (res.ok) {
      ES.ui.toast(res.message, res.how === 'anchor' && text ? { ms: 8000, action: { label: 'Copy', attrs: { 'data-download-copy': '' }, onClick: function () { copy(text, name); } } } : {});
      return;
    }
    if (typeof opts.fallback === 'function') { opts.fallback(res); return; }
    ES.ui.sheet({ title: 'Saving is not possible here', cls: 'sheet-download', body: function (b) {
      b.appendChild(U.el('p', { 'data-download-result': res.how }, res.message));
    }, actions: [text ? { label: 'Copy the text', attrs: { 'data-download-copy': '' }, onClick: function () { copy(text, name); return false; } } : null,
      { label: 'Close', kind: 'primary' }].filter(Boolean) });
  }
  /** Save one file (from a tap). */
  function save(name, data, mime, opts) {
    opts = opts || {};
    name = String(name || 'earshot.txt');
    var text = typeof opts.copyText === 'string' ? opts.copyText : typeof data === 'string' ? data : '';
    function done(res) { try { show(res, text, name, opts); } catch (e) { /* the result still counts */ } return res; }
    return ready(WAIT_SAVE_MS).then(function (ns) {
      if (ns) {
        return Promise.resolve().then(function () { return ns.save({ filename: name, data: data }); })
          .then(function () { return done({ ok: true, how: 'downloads', message: 'Saved ' + name + '.' }); },
            function (err) { return done(failure(err && err.code, name)); });
      }
      if (anchor(name, data, mime)) return done({ ok: true, how: 'anchor', message: 'Saved ' + name + ' — if nothing appeared, use Copy instead.' });
      return done({ ok: false, how: 'blocked', message: 'Downloads are blocked here. To save ' + name + ', open Earshot in a browser, or copy the text instead.' });
    });
  }

  ES.hooks.on('app:ready', connect);
  ES.core.download = { save: save, ready: ready, connect: connect, state: function () { return D.state; } };
})(window.ES, window);
