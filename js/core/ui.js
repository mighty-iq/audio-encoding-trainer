/* ES.ui — sheets, toasts, confirm, buttons, banners, copy (CONTRACTS §3).
   Sheets: a stack of modal dialogs; Esc closes only the top one; Tab stays inside it; the app behind is inert.
   Quiet mode (while a stimulus plays): toasts wait, nothing new appears on screen. */
(function (ES, win) {
  'use strict';
  var U = ES.core.util;
  var sheets = [], quiet = false, queued = [], keysBound = false, sheetN = 0;
  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  function doc() { return win.document; }
  function appRoot() { return doc().getElementById('app'); }
  function setInert(on) {
    ['app', 'banners'].forEach(function (id) {
      var n = doc().getElementById(id);
      if (!n) return;
      if (on) { n.setAttribute('inert', ''); n.setAttribute('aria-hidden', 'true'); }
      else { n.removeAttribute('inert'); n.removeAttribute('aria-hidden'); }
    });
  }
  function bindKeys() {
    if (keysBound) return;
    keysBound = true;
    doc().addEventListener('keydown', function (e) {
      var top = sheets[sheets.length - 1];
      if (!top) return;
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault(); e.stopPropagation();
        if (top.dismissible) top.close(undefined);
        return;
      }
      if (e.key === 'Tab') {
        var items = Array.prototype.filter.call(top.el.querySelectorAll(FOCUSABLE), function (n) { return n.offsetParent !== null || n === doc().activeElement; });
        if (!items.length) { e.preventDefault(); top.el.focus(); return; }
        var first = items[0], last = items[items.length - 1], a = doc().activeElement;
        if (e.shiftKey && (a === first || !top.el.contains(a))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (a === last || !top.el.contains(a))) { e.preventDefault(); first.focus(); }
      }
    }, true);
  }

  /** button(label, {kind:'primary'|'secondary'|'ghost'|'danger', onClick, go, params, small, wide, attrs}) */
  function button(label, opts) {
    opts = opts || {};
    var attrs = { type: 'button', class: ['btn', 'btn-' + (opts.kind || 'secondary'), opts.small && 'btn-small', opts.wide && 'btn-wide', opts.cls] };
    if (opts.go) { attrs['data-go'] = opts.go; if (opts.params) attrs['data-params'] = JSON.stringify(opts.params); }
    if (opts.attrs) Object.keys(opts.attrs).forEach(function (k) { attrs[k] = opts.attrs[k]; });
    var b = U.el('button', attrs, [opts.icon || null, U.el('span', { class: 'btn-label' }, label)]);
    if (typeof opts.onClick === 'function') b.addEventListener('click', function (e) { if (!b.disabled) opts.onClick(e, b); });
    if (opts.disabled) b.disabled = true;
    return b;
  }

  /** sheet({title, body, actions:[{label, kind, value, onClick, keep}], dismissible, cls, label})
      → { el, body, close(value), closed: Promise<value> }. An action closes the sheet with its value
      unless it sets keep:true; onClick may return false to keep it open. */
  function sheet(opts) {
    opts = opts || {};
    bindKeys();
    var id = 'sheet-' + (++sheetN);
    var prevFocus = doc().activeElement;
    var resolveFn, closed = new Promise(function (r) { resolveFn = r; });
    var dismissible = opts.dismissible !== false;
    var titleEl = opts.title ? U.el('h2', { class: 'sheet-title', id: id + '-t' }, opts.title) : null;
    var body = U.el('div', { class: 'sheet-body' });
    if (typeof opts.body === 'function') opts.body(body);
    else if (opts.body) body.appendChild(typeof opts.body === 'string' ? U.el('p', null, opts.body) : opts.body);
    var panel = U.el('div', { class: ['sheet', opts.cls], role: opts.role || 'dialog', 'aria-modal': 'true', tabindex: '-1',
      'aria-labelledby': titleEl ? id + '-t' : null, 'aria-label': titleEl ? null : (opts.label || 'Dialog') });
    var head = U.el('div', { class: 'sheet-head' }, [titleEl,
      dismissible && opts.closeButton !== false ? U.el('button', { type: 'button', class: 'sheet-x', 'aria-label': 'Close',
        on: { click: function () { handle.close(undefined); } } }, '×') : null]);
    panel.appendChild(head);
    panel.appendChild(body);
    var acts = null;
    if (opts.actions && opts.actions.length) {
      acts = U.el('div', { class: 'sheet-actions' });
      opts.actions.forEach(function (a) {
        acts.appendChild(button(a.label, { kind: a.kind || 'secondary', wide: opts.actions.length === 1, attrs: a.attrs, onClick: function () {
          var r = typeof a.onClick === 'function' ? a.onClick(handle) : undefined;
          if (r === false || a.keep) return;
          handle.close(a.value);
        } }));
      });
      panel.appendChild(acts);
    }
    var layer = U.el('div', { class: 'sheet-layer', 'data-sheet': id }, panel);
    layer.addEventListener('pointerdown', function (e) { layer._down = e.target === layer; });
    layer.addEventListener('click', function (e) { if (e.target === layer && layer._down && dismissible) handle.close(undefined); });
    var done = false;
    var handle = {
      el: panel, body: body, actions: acts, dismissible: dismissible, closed: closed,
      close: function (value) {
        if (done) return;
        done = true;
        var i = sheets.indexOf(handle);
        if (i >= 0) sheets.splice(i, 1);
        if (layer.parentNode) layer.parentNode.removeChild(layer);
        if (!sheets.length) setInert(false);
        if (typeof opts.onClose === 'function') { try { opts.onClose(value); } catch (e) { /* ignore */ } }
        var target = sheets.length ? sheets[sheets.length - 1].el : prevFocus;
        try { if (target && target.focus && doc().contains(target)) target.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
        resolveFn(value);
      }
    };
    sheets.push(handle);
    setInert(true);
    doc().body.appendChild(layer);
    var first = opts.focus === 'panel' ? null : panel.querySelector('[data-autofocus]') || (acts && acts.querySelector('.btn-primary')) || panel.querySelector(FOCUSABLE);
    try { (first || panel).focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    return handle;
  }
  function sheetOpen() { return sheets.length > 0; }
  function closeAll() { sheets.slice().reverse().forEach(function (s) { s.close(undefined); }); }

  /** confirm(text, {title, ok, cancel, danger}) → Promise<boolean>. */
  function confirm(text, opts) {
    opts = opts || {};
    var h = sheet({ title: opts.title || 'Are you sure?', body: text, role: 'alertdialog', actions: [
      { label: opts.cancel || 'Cancel', kind: 'secondary', value: false },
      { label: opts.ok || 'OK', kind: opts.danger ? 'danger' : 'primary', value: true }
    ] });
    return h.closed.then(function (v) { return v === true; });
  }

  function toast(text, opts) {
    opts = opts || {};
    if (quiet) { queued.push([text, opts]); return; }
    var box = doc().getElementById('toasts');
    if (!box) return;
    var t = U.el('div', { class: ['toast', opts.kind && 'toast-' + opts.kind] }, text);
    box.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, opts.ms || 3200);
  }
  /** Quiet mode while a stimulus plays: toasts wait until it ends. */
  function setQuiet(on) {
    quiet = !!on;
    if (!quiet && queued.length) { var q = queued; queued = []; q.forEach(function (x) { toast(x[0], x[1]); }); }
  }

  /** Lasting banners above every screen except trials: banner(id, {text, kind, action:{label, go|onClick}}) or banner(id, null). */
  function banner(id, spec) {
    var box = doc().getElementById('banners');
    if (!box) return;
    var old = box.querySelector('[data-banner="' + id + '"]');
    if (old) old.parentNode.removeChild(old);
    if (!spec) return;
    var act = spec.action ? button(spec.action.label, { kind: 'ghost', small: true, go: spec.action.go, onClick: spec.action.onClick }) : null;
    box.appendChild(U.el('div', { class: ['banner', 'banner-' + (spec.kind || 'info')], 'data-banner': id, role: 'status' },
      [U.el('span', { class: 'banner-text' }, spec.text), act]));
  }

  /** Copy text: clipboard API → execCommand → a copy box the player can select. → Promise<'clipboard'|'exec'|'box'> */
  function copyText(text, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var done = false;
      function finish(how) { if (done) return; done = true; if (how !== 'box') toast(opts.toast || 'Copied to the clipboard'); resolve(how); }
      function viaExec() {
        try {
          var ta = U.el('textarea', { class: 'offscreen', readonly: true, 'aria-hidden': 'true' });
          ta.value = text;
          doc().body.appendChild(ta);
          ta.select();
          var ok = doc().execCommand && doc().execCommand('copy');
          doc().body.removeChild(ta);
          if (ok) { finish('exec'); return true; }
        } catch (e) { /* blocked */ }
        return false;
      }
      function viaBox() { copyBox(text, opts); finish('box'); }
      if (opts.box) { viaBox(); return; }
      try {
        var cb = win.navigator && win.navigator.clipboard;
        if (cb && typeof cb.writeText === 'function') {
          cb.writeText(text).then(function () { finish('clipboard'); }, function () { if (!viaExec()) viaBox(); });
          return;
        }
      } catch (e) { /* fall through */ }
      if (!viaExec()) viaBox();
    });
  }
  function copyBox(text, opts) {
    opts = opts || {};
    var ta = U.el('textarea', { class: 'copybox', readonly: true, rows: '8', 'aria-label': opts.title || 'Text to copy', spellcheck: 'false' });
    ta.value = text;
    ta.addEventListener('focus', function () { ta.select(); });
    var h = sheet({ title: opts.title || 'Copy this text', body: function (b) {
      b.appendChild(U.el('p', { class: 'hint' }, opts.hint || 'Copying is blocked here. Select all of the text below and copy it.'));
      b.appendChild(ta);
    }, actions: [{ label: 'Select all', keep: true, onClick: function () { ta.focus(); ta.select(); try { ta.setSelectionRange(0, text.length); } catch (e) { /* ignore */ } } },
      { label: 'Done', kind: 'primary' }] });
    return h;
  }

  ES.ui.button = button;
  ES.ui.sheet = sheet;
  ES.ui.sheetOpen = sheetOpen;
  ES.ui.closeSheets = closeAll;
  ES.ui.confirm = confirm;
  ES.ui.toast = toast;
  ES.ui.quiet = setQuiet;
  ES.ui.isQuiet = function () { return quiet; };
  ES.ui.banner = banner;
  ES.ui.copyText = copyText;
  ES.ui.copyBox = copyBox;
  ES.ui.app = appRoot;
})(window.ES, window);
