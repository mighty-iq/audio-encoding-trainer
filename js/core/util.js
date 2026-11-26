/* ES.core.util — small helpers (CONTRACTS §3). Pure functions load in Node; el/svg need a document. */
(function (ES) {
  'use strict';
  var U = ES.core.util = {};
  var MINUS = '−';

  U.clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };
  U.lerp = function (a, b, t) { return a + (b - a) * t; };
  /** Round half away from zero (−12.25 → −12.3, like 12.25 → 12.3). */
  U.round = function (x, d) { var p = Math.pow(10, d || 0), r = Math.round(Math.abs(x) * p) / p; return x < 0 ? -r : r; };
  U.sum = function (a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; };
  U.mean = function (a) { return a.length ? U.sum(a) / a.length : NaN; };
  U.sd = function (a) {
    if (a.length < 2) return NaN;
    var m = U.mean(a), s = 0;
    for (var i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m);
    return Math.sqrt(s / (a.length - 1));
  };
  U.isObj = function (x) { return x !== null && typeof x === 'object' && !Array.isArray(x); };
  /** Keys that must never be copied from untrusted JSON (prototype pollution). */
  U.badKey = function (k) { return k === '__proto__' || k === 'constructor' || k === 'prototype'; };
  U.now = function () { return Date.now(); };

  U.copy = function (obj) {
    if (obj === undefined) return undefined;
    return JSON.parse(JSON.stringify(obj));
  };
  U.deepEqual = function deq(a, b) {
    if (a === b) return true;
    if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') {
      return typeof a === 'number' && typeof b === 'number' && isNaN(a) && isNaN(b);
    }
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      for (var i = 0; i < a.length; i++) if (!deq(a[i], b[i])) return false;
      return true;
    }
    var ka = Object.keys(a).filter(function (k) { return a[k] !== undefined; });
    var kb = Object.keys(b).filter(function (k) { return b[k] !== undefined; });
    if (ka.length !== kb.length) return false;
    for (var j = 0; j < ka.length; j++) {
      if (!Object.prototype.hasOwnProperty.call(b, ka[j]) || !deq(a[ka[j]], b[ka[j]])) return false;
    }
    return true;
  };

  U.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  function trimNum(x, d) {
    var s = U.round(Math.abs(x), d).toFixed(d);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s;
  }
  /** "−6 dB", "+2.5 dB", "0 dB" (true minus sign; one decimal at most). */
  U.fmtDb = function (x, d) {
    if (typeof x !== 'number' || !isFinite(x)) return '– dB';
    var r = U.round(x, d == null ? 1 : d);
    var s = trimNum(r, d == null ? 1 : d);
    return (r < 0 ? MINUS : r > 0 ? '+' : '') + s + ' dB';
  };
  /** "12 m", "1.5 m", "0.8 m". */
  U.fmtM = function (x) {
    if (typeof x !== 'number' || !isFinite(x)) return '– m';
    return trimNum(x, x < 10 ? 1 : 0) + ' m';
  };
  U.fmtNum = function (x, d) { return (x < 0 ? MINUS : '') + trimNum(x, d || 0); };
  /** "2:05" for ms. */
  U.fmtClock = function (ms) {
    var s = Math.max(0, Math.round(ms / 1000));
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  };
  U.fmtMin = function (ms) { var m = Math.round(ms / 60000); return m < 1 ? '< 1 min' : m + ' min'; };
  U.plural = function (n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); };

  var uidN = 0;
  U.uid = function (prefix) {
    var r = '';
    try {
      var a = new Uint32Array(2);
      (globalThis.crypto || {}).getRandomValues(a);
      r = a[0].toString(36) + a[1].toString(36);
    } catch (e) { r = Math.floor(Math.random() * 1e12).toString(36); }
    uidN = (uidN + 1) % 1296;
    return (prefix || 'id') + '_' + Date.now().toString(36) + uidN.toString(36) + r.slice(0, 6);
  };
  U.debounce = function (fn, ms) {
    var t = null;
    return function () {
      var self = this, args = arguments;
      if (t) clearTimeout(t);
      t = setTimeout(function () { t = null; fn.apply(self, args); }, ms);
    };
  };

  /** Local calendar keys (the player's own week and day; never exported as a zone). */
  U.dayKey = function (ms) {
    var d = new Date(ms == null ? Date.now() : ms);
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  };
  /** ISO-8601 week of the local date: "2026-W48". */
  U.weekKey = function (ms) {
    var d = new Date(ms == null ? Date.now() : ms);
    var t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var day = (t.getDay() + 6) % 7;               // Monday = 0
    t.setDate(t.getDate() - day + 3);             // Thursday of this week
    var firstThu = new Date(t.getFullYear(), 0, 4);
    var week = 1 + Math.round(((t - firstThu) / 864e5 - 3 + ((firstThu.getDay() + 6) % 7)) / 7);
    return t.getFullYear() + '-W' + ('0' + week).slice(-2);
  };
  U.isoUtc = function (ms) { return new Date(ms == null ? Date.now() : ms).toISOString(); };

  // DOM builders. attrs: class, text, html (trusted static markup only), on:{event:fn}, style (string|object),
  // data-*, aria-*, boolean attributes (true → present, false/null → absent). children: Node|string|array.
  function build(doc, node, attrs, children) {
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') node.setAttribute('class', Array.isArray(v) ? v.filter(Boolean).join(' ') : v);
        else if (k === 'text') node.textContent = String(v);
        else if (k === 'html') node.innerHTML = String(v);
        else if (k === 'on') Object.keys(v).forEach(function (ev) { node.addEventListener(ev, v[ev]); });
        else if (k === 'style' && typeof v === 'object') Object.keys(v).forEach(function (p) { node.style.setProperty(p, v[p]); });
        else if (k === 'props') Object.keys(v).forEach(function (p) { node[p] = v[p]; });
        else node.setAttribute(k, v === true ? '' : String(v));
      });
    }
    append(doc, node, children);
    return node;
  }
  function append(doc, node, children) {
    if (children === null || children === undefined || children === false) return;
    if (Array.isArray(children)) { children.forEach(function (c) { append(doc, node, c); }); return; }
    node.appendChild(typeof children === 'object' ? children : doc.createTextNode(String(children)));
  }
  U.el = function (tag, attrs, children) {
    var doc = globalThis.document;
    return build(doc, doc.createElement(tag), attrs, children);
  };
  U.svg = function (tag, attrs, children) {
    var doc = globalThis.document;
    return build(doc, doc.createElementNS('http://www.w3.org/2000/svg', tag), attrs, children);
  };
  U.clear = function (node) { while (node && node.firstChild) node.removeChild(node.firstChild); return node; };
})(window.ES);
