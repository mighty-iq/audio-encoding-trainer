/* Earshot namespace, hooks and build flags (CONTRACTS §2). Loaded first; touches no DOM at load time.
   Build flags come from an optional `window.ES_CONFIG` set before this script (tools/build-single.mjs --test
   writes one), or from `?test` in the page address. */
(function (root) {
  'use strict';
  var cfg = root.ES_CONFIG && typeof root.ES_CONFIG === 'object' ? root.ES_CONFIG : {};
  var ES = root.ES && typeof root.ES === 'object' ? root.ES : {};
  ES.VERSION = '1.0.0';
  ['core', 'audio', 'engine', 'ex', 'lab', 'game', 'ui', 'data', 'packs', 'hooks'].forEach(function (k) {
    if (!ES[k] || typeof ES[k] !== 'object') ES[k] = {};
  });
  ES.CONFIG = cfg;
  var query = '';
  try { query = String((root.location && root.location.search) || ''); } catch (e) { query = ''; }
  ES.TEST_BUILD = cfg.testBuild === true || /[?&]test(=1|=true)?(&|$)/.test(query);
  ES.ui.screens = ES.ui.screens || {};        // §11: wave-2 modules register { mount(root, params), unmount() }
  ES.ui.placeholders = ES.ui.placeholders || {};  // the shell's fallbacks for screens not registered yet

  // Errors seen before the playtest module loads (and after): kept small, read by ES.core.playtest.
  var errors = ES._errors = [];
  function keepError(rec) {
    errors.push(rec);
    if (errors.length > 60) errors.splice(0, errors.length - 60);
    var pt = ES.core.playtest;
    if (pt && typeof pt._onError === 'function') { try { pt._onError(rec); } catch (e) { /* never loop */ } }
  }
  ES._keepError = keepError;
  if (typeof root.addEventListener === 'function') {
    root.addEventListener('error', function (ev) {
      if (!ev || ev.target !== root && ev.target && ev.target.tagName) return; // resource errors have their own path
      keepError({ at: Date.now(), kind: 'error', msg: String(ev && ev.message || 'error'),
        src: String(ev && ev.filename || '').replace(/^.*\//, ''), line: ev && ev.lineno || 0,
        stack: String(ev && ev.error && ev.error.stack || '').slice(0, 800) });
    });
    root.addEventListener('unhandledrejection', function (ev) {
      var r = ev && ev.reason;
      keepError({ at: Date.now(), kind: 'rejection', msg: String(r && r.message || r || 'rejection'),
        stack: String(r && r.stack || '').slice(0, 800) });
    });
  }

  // Hooks: trial:done, set:done, session:done, pb, milestone, plateau, export, store:changed, store:status, route.
  var subs = {};
  ES.hooks.on = function (name, fn) {
    if (typeof fn !== 'function') return function () {};
    (subs[name] = subs[name] || []).push(fn);
    return function off() { ES.hooks.off(name, fn); };
  };
  ES.hooks.off = function (name, fn) {
    var list = subs[name];
    if (!list) return;
    var i = list.indexOf(fn);
    if (i >= 0) list.splice(i, 1);
  };
  ES.hooks.emit = function (name, payload) {
    var list = (subs[name] || []).slice();
    for (var i = 0; i < list.length; i++) {
      try { list[i](payload, name); } catch (e) {
        keepError({ at: Date.now(), kind: 'hook', msg: name + ': ' + String(e && e.message || e),
          stack: String(e && e.stack || '').slice(0, 800) });
        if (root.console && console.error) console.error('[hook ' + name + ']', e);
      }
    }
    return list.length;
  };
  ES.hooks.count = function (name) { return (subs[name] || []).length; };

  root.ES = ES;
})(typeof window !== 'undefined' ? window : this);
