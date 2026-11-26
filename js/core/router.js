/* ES.core.router — in-memory screen stack (CONTRACTS §3, §11).
   go(name, params) mounts ES.ui.screens[name] (wave-2 modules register there) or the shell's placeholder
   ES.ui.placeholders[name]; the address mirrors `#name` inside try/catch (sandboxed previews may refuse).
   One delegated click listener handles in-app links: <a href="#name">, [data-go="name"], [data-back]. */
(function (ES, win) {
  'use strict';
  var stack = [], listeners = {}, mounted = null, root = null, mirrorOk = true, attached = false;
  var NO_LINK = { play: 1, results: 1, tutorial: 1 };   // session screens need live state: never deep-linked

  function resolve(name) {
    var s = ES.ui.screens[name];
    if (s && typeof s.mount === 'function') return s;
    var p = ES.ui.placeholders[name];
    return p && typeof p.mount === 'function' ? p : null;
  }
  function has(name) { return !!resolve(name); }
  function linkable(name) { var s = resolve(name); return !!s && !NO_LINK[name] && s.deepLink !== false; }

  function emit(name, entry) {
    var info = { name: entry.name, params: entry.params };
    (listeners[name] || []).concat(listeners['*'] || []).forEach(function (fn) {
      try { fn(info); } catch (e) { if (win.console) console.error('[router listener]', e); }
    });
    ES.hooks.emit('route', info);
  }
  function unmount() {
    if (!mounted) return;
    var m = mounted;
    mounted = null;
    if (typeof m.screen.unmount === 'function') {
      try { m.screen.unmount(); } catch (e) { if (win.console) console.error('[router unmount ' + m.name + ']', e); }
    }
    if (m.el && m.el.parentNode) m.el.parentNode.removeChild(m.el);
  }
  function mount(entry) {
    var screen = resolve(entry.name);
    var el = null;
    if (root && win.document) {
      el = win.document.createElement('section');
      el.className = 'screen screen-' + entry.name.replace(/[^a-z0-9-]/gi, '');
      el.setAttribute('data-screen', entry.name);
      root.appendChild(el);
    }
    mounted = { name: entry.name, screen: screen, el: el };
    try { screen.mount(el, entry.params || {}); }
    catch (e) {
      if (win.console) console.error('[router mount ' + entry.name + ']', e);
      if (ES._keepError) ES._keepError({ at: Date.now(), kind: 'screen', msg: entry.name + ': ' + (e && e.message), stack: String(e && e.stack || '').slice(0, 800) });
      if (el) {
        el.textContent = '';
        var p = win.document.createElement('p');
        p.className = 'screen-error';
        p.textContent = 'This screen could not open. Go back and try again.';
        el.appendChild(p);
      }
    }
    if (el) {
      try { win.scrollTo(0, 0); } catch (e) { /* ignore */ }
      var focusEl = el.querySelector('[data-autofocus]') || el.querySelector('h1');
      if (focusEl && !(ES.ui.sheetOpen && ES.ui.sheetOpen())) {
        if (!focusEl.hasAttribute('tabindex')) focusEl.setAttribute('tabindex', '-1');
        ES.core.util.focus(focusEl);
      }
    }
  }
  function mirror(name) {
    if (!mirrorOk || !win.location) return;
    try {
      var h = '#' + name;
      if (win.location.hash === h) return;
      if (win.history && typeof win.history.replaceState === 'function') win.history.replaceState(null, '', h);
      else win.location.hash = h;
    } catch (e) { mirrorOk = false; }
  }

  /** Open a screen. opts.replace swaps the top of the stack; opts.reset clears the stack first. */
  function go(name, params, opts) {
    opts = opts || {};
    if (!has(name)) {
      if (win.console) console.warn('[router] unknown screen: ' + name);
      if (name === 'home' || !has('home')) return false;
      name = 'home'; params = {};
    }
    var entry = { name: name, params: params || {} };
    unmount();
    if (opts.reset) stack = [];
    if (opts.replace && stack.length) stack[stack.length - 1] = entry; else stack.push(entry);
    if (stack.length > 40) stack.splice(0, stack.length - 40);
    mount(entry);
    mirror(name);
    emit(name, entry);
    return true;
  }
  function back() {
    if (stack.length <= 1) return go('home', {}, { reset: true });
    unmount();
    stack.pop();
    var prev = stack[stack.length - 1];
    if (!has(prev.name)) return go('home', {}, { reset: true });
    mount(prev);
    mirror(prev.name);
    emit(prev.name, prev);
    return true;
  }
  function current() { var e = stack[stack.length - 1]; return e ? { name: e.name, params: e.params } : null; }
  function depth() { return stack.length; }
  function on(name, fn) {
    (listeners[name] = listeners[name] || []).push(fn);
    return function () { var l = listeners[name], i = l ? l.indexOf(fn) : -1; if (i >= 0) l.splice(i, 1); };
  }
  /** Re-mount the current screen (after a remote store change, a theme change …). */
  function refresh() { var e = stack[stack.length - 1]; if (!e) return; unmount(); mount(e); }
  function fromHash() {
    var h = '';
    try { h = String(win.location.hash || '').replace(/^#/, ''); } catch (e) { h = ''; }
    return /^[a-z0-9-]{1,32}$/i.test(h) ? h : '';
  }

  /** Bind to the page: the screen root, one click listener for in-app links, and hash changes. */
  function attach(rootEl, doc) {
    root = rootEl || null;
    doc = doc || win.document;
    if (attached || !doc) return;
    attached = true;
    doc.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var t = e.target && e.target.closest ? e.target.closest('[data-go],[data-back],a[href^="#"]') : null;
      if (!t) return;
      if (t.hasAttribute('data-back')) { e.preventDefault(); back(); return; }
      var name = t.getAttribute('data-go') || (t.getAttribute('href') || '').slice(1);
      if (!name || !has(name)) return;
      e.preventDefault();
      var params = {};
      var raw = t.getAttribute('data-params');
      if (raw) { try { params = JSON.parse(raw) || {}; } catch (err) { params = {}; } }
      go(name, params);
    });
    win.addEventListener('hashchange', function () {
      var name = fromHash(), cur = current();
      if (name && (!cur || cur.name !== name) && linkable(name)) go(name, {});
    });
  }
  /** First screen: a deep link (#settings) when it names a linkable screen, else `fallback`. */
  function start(fallback) {
    var name = fromHash();
    return go(name && linkable(name) ? name : fallback || 'home', {}, { reset: true });
  }

  ES.core.router = { go: go, back: back, current: current, depth: depth, on: on, refresh: refresh, attach: attach,
    start: start, has: has, linkable: linkable };
})(window.ES, window);
