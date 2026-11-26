/* ES.core.playtest — playtest mode for test builds (CONTRACTS §3; owner's check-in rules).
   On when ES.TEST_BUILD is true or the player switches it on in Settings. After each set: three taps
   (fun, clarity, difficulty). On every screen: a Note button. "Copy playtest report": device facts, frame
   timings, errors, performance, time played and the last screen. The report goes to the build team, so it
   keeps every device fact; backups and pooled exports never include it. Stored in the `playtest` record. */
(function (ES, win) {
  'use strict';
  var U = ES.core.util;
  var mem = { errors: [] };            // used before the store is ready
  var SCALES = {
    fun: { label: 'Fun', lo: 'dull', hi: 'great' },
    clarity: { label: 'Clarity', lo: 'confusing', hi: 'clear' },
    difficulty: { label: 'Difficulty', lo: 'too easy', hi: 'too hard' }
  };

  function store() { return ES.core.store && ES.core.store.status ? ES.core.store : null; }
  function enabled() {
    if (ES.TEST_BUILD) return true;
    var s = store();
    try { return !!(s && s.peek('profile').settings.playtest); } catch (e) { return false; }
  }
  function add(list, item, cap) {
    item.id = item.id || U.uid('pt');
    item.at = item.at || Date.now();
    var s = store();
    if (!s) { (mem[list] = mem[list] || []).push(item); return; }
    s.update('playtest', function (r) {
      if (!r.firstAt) r.firstAt = Date.now();
      r[list] = (r[list] || []).concat([item]).slice(-(cap || 300));
    });
  }
  function rate(exId, r) {
    r = r || {};
    add('ratings', { ex: String(exId || ''), fun: r.fun | 0, clarity: r.clarity | 0, difficulty: r.difficulty | 0, set: r.set });
  }
  function note(screenId, text) {
    text = String(text || '').trim().slice(0, 4000);
    if (text) add('notes', { screen: String(screenId || ''), text: text });
  }
  var lastErr = { msg: '', at: 0 };
  function error(e) {
    var rec = e && e.msg ? e : { kind: 'error', msg: String(e && e.message || e), stack: String(e && e.stack || '').slice(0, 800) };
    if (rec.msg === lastErr.msg && Date.now() - lastErr.at < 2000) { lastErr.at = Date.now(); return; }   // an error loop: keep one
    lastErr = { msg: rec.msg, at: Date.now() };
    if (!enabled()) { mem.errors.push(rec); mem.errors = mem.errors.slice(-60); return; }
    add('errors', { kind: rec.kind, msg: String(rec.msg).slice(0, 300), src: rec.src, line: rec.line, stack: rec.stack }, 120);
  }
  function frames(stats) { if (stats && enabled()) add('frames', stats, 80); }
  function setDone(sum) { if (sum && enabled()) add('sets', sum, 400); }
  function screen(name) {
    if (!enabled() || !name) return;
    var s = store(), last = s ? (s.peek('playtest').screens || []).slice(-1)[0] : null;
    if (last && last.name === name && Date.now() - last.at < 1000) return;
    add('screens', { name: name }, 300);
  }

  /** Sample requestAnimationFrame intervals for ms (outside stimuli only). → Promise<stats|null> */
  function sampleFrames(where, ms) {
    ms = ms || 1500;
    return new Promise(function (resolve) {
      if (!win.requestAnimationFrame || (win.document && win.document.hidden)) { resolve(null); return; }
      var d = [], last = 0, t0 = 0;
      function step(t) {
        if (ES.ui.isQuiet && ES.ui.isQuiet()) { resolve(null); return; }  // a stimulus started: stop at once
        if (!t0) t0 = t; else d.push(t - last);
        last = t;
        if (t - t0 < ms) win.requestAnimationFrame(step); else resolve(summarise(where, d));
      }
      win.requestAnimationFrame(step);
    }).then(function (st) { if (st) frames(st); return st; });
  }
  function summarise(where, d) {
    if (d.length < 5) return null;
    var s = d.slice().sort(function (a, b) { return a - b; });
    var pick = function (q) { return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
    return { where: where, n: d.length, mean: U.round(U.mean(d), 2), p50: U.round(pick(0.5), 2), p95: U.round(pick(0.95), 2),
      max: U.round(s[s.length - 1], 2), sd: U.round(U.sd(d), 2), over20: d.filter(function (x) { return x > 20; }).length,
      over50: d.filter(function (x) { return x > 50; }).length };
  }

  function mm(q) { try { return win.matchMedia(q).matches; } catch (e) { return null; } }
  function device() {
    var n = win.navigator || {}, sc = win.screen || {}, tz = '', iframe = null;
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { tz = ''; }
    try { iframe = win.self !== win.top; } catch (e) { iframe = true; }
    var off = -new Date().getTimezoneOffset();
    return {
      ua: n.userAgent || '', platform: n.platform || '', lang: n.language || '', tz: tz,
      utcOffset: (off >= 0 ? '+' : '-') + Math.floor(Math.abs(off) / 60) + (Math.abs(off) % 60 ? ':' + ('0' + Math.abs(off) % 60).slice(-2) : ''),
      screen: (sc.width || 0) + '×' + (sc.height || 0), dpr: win.devicePixelRatio || 1,
      viewport: (win.innerWidth || 0) + '×' + (win.innerHeight || 0), touch: n.maxTouchPoints || 0,
      pointer: mm('(pointer: coarse)') ? 'coarse' : mm('(pointer: fine)') ? 'fine' : 'none', hover: !!mm('(hover: hover)'),
      scheme: mm('(prefers-color-scheme: dark)') ? 'dark' : 'light', reducedMotion: !!mm('(prefers-reduced-motion: reduce)'),
      cores: n.hardwareConcurrency || 0, memGB: n.deviceMemory || 0, page: (win.location && win.location.protocol) || '', iframe: iframe
    };
  }
  function t(ms) { return ms ? new Date(ms).toISOString().slice(11, 16) + 'Z' : '–'; }

  function reportText() {
    var s = store(), st = s ? s.status() : { mode: 'none' };
    var rec = s ? s.peek('playtest') : {}, log = s ? s.peek('log') : { sessions: [] };
    var dv = device(), au = ES.ui.sound && ES.ui.sound.info ? ES.ui.sound.info() : null;
    var L = [];
    L.push('Earshot playtest report · v' + ES.VERSION + (ES.TEST_BUILD ? ' · test build' : '') + ' · ' + U.isoUtc());
    L.push('Device: ' + dv.ua);
    L.push('  screen ' + dv.screen + ' @' + dv.dpr + 'x · viewport ' + dv.viewport + ' · touch ' + dv.touch + ' · pointer ' + dv.pointer +
      ' · hover ' + (dv.hover ? 'yes' : 'no') + ' · ' + dv.scheme + (dv.reducedMotion ? ' · reduced motion' : '') + ' · cores ' + dv.cores +
      (dv.memGB ? ' · ' + dv.memGB + ' GB' : ''));
    L.push('  ' + dv.platform + ' · lang ' + dv.lang + ' · tz ' + dv.tz + ' (UTC' + dv.utcOffset + ') · page ' + dv.page + ' · iframe ' + (dv.iframe ? 'yes' : 'no'));
    L.push('Storage: ' + st.mode + (st.reason ? ' (' + st.reason + ')' : '') + ' · ' + Math.round((st.bytes || 0) / 1024) + ' KB · ' +
      (st.saved ? 'saved' : 'NOT saved' + (st.lastError ? ' (' + st.lastError + ')' : '')) + (st.nearFull ? ' · near full' : ''));
    L.push('Audio: ' + (au ? au.sampleRate + ' Hz · base ' + au.baseMs + ' ms · output ' + au.outMs + ' ms · ' + au.state + (au.engine ? ' · ' + au.engine : '') : 'not started'));
    var fr = (rec.frames || []).slice(-6);
    L.push('Frames (' + fr.length + '): ' + (fr.map(function (f) {
      return f.where + ' mean ' + f.mean + ' p95 ' + f.p95 + ' max ' + f.max + ' >20ms ' + f.over20 + '/' + f.n;
    }).join(' | ') || 'none yet'));
    var sessions = (log.sessions || []), total = U.sum(sessions.map(function (x) { return x.activeMs || 0; }));
    var live = ES.ui.session && ES.ui.session.active && ES.ui.session.active() ? ES.core.clock.activeMs() : 0;
    L.push('Time: ' + U.fmtClock(total + live) + ' active in ' + sessions.length + ' session(s)' + (live ? ' (one running)' : '') +
      ' · first opened ' + (rec.firstAt ? U.isoUtc(rec.firstAt) : '–'));
    (rec.ratings || []).slice(-12).forEach(function (r) {
      L.push('Rating ' + t(r.at) + ' ' + r.ex + (r.set != null ? ' set ' + r.set : '') + ': fun ' + r.fun + ' · clarity ' + r.clarity + ' · difficulty ' + r.difficulty);
    });
    (rec.sets || []).slice(-12).forEach(function (x) {
      L.push('Set ' + t(x.at) + ' ' + x.ex + ': ' + x.correct + '/' + x.n + ' correct · ' + U.fmtClock(x.activeMs || 0) + (x.level != null ? ' · end level ' + x.level : '') + (x.demo ? ' · demo' : ''));
    });
    (rec.notes || []).slice(-20).forEach(function (x) { L.push('Note ' + t(x.at) + ' [' + x.screen + '] ' + x.text.replace(/\s+/g, ' ')); });
    var errs = (rec.errors || []).concat(mem.errors.map(function (e) { return { at: e.at, msg: e.msg, src: e.src, line: e.line }; })).slice(-15);
    L.push('Errors (' + errs.length + ')' + (errs.length ? ':' : ': none'));
    errs.forEach(function (e) { L.push('  ' + t(e.at) + ' ' + (e.src ? e.src + ':' + (e.line || 0) + ' ' : '') + e.msg); });
    var scr = (rec.screens || []).slice(-15);
    L.push('Screens: ' + (scr.map(function (x) { return x.name + ' ' + t(x.at); }).join(' → ') || '–') +
      ' · last: ' + (ES.core.router && ES.core.router.current() ? ES.core.router.current().name : '–'));
    return L.join('\n');
  }
  function copyReport() { return ES.ui.copyText(reportText(), { title: 'Playtest report', toast: 'Playtest report copied' }); }

  // ---- UI pieces
  function ratingEl(exId, opts) {
    opts = opts || {};
    var vals = {}, done = false;
    var box = U.el('section', { class: 'card rating', 'aria-label': 'Playtest ratings' }, [
      U.el('h3', null, 'Playtest: three taps'),
      U.el('p', { class: 'hint' }, 'How was that set? 1 = low, 5 = high.')
    ]);
    Object.keys(SCALES).forEach(function (k) {
      var sc = SCALES[k], row = U.el('div', { class: 'rating-row', role: 'radiogroup', 'aria-label': sc.label });
      var btns = [1, 2, 3, 4, 5].map(function (n) {
        return U.el('button', { type: 'button', class: 'rating-btn', role: 'radio', 'aria-checked': 'false', 'aria-label': sc.label + ' ' + n,
          on: { click: function () {
            vals[k] = n;
            btns.forEach(function (b, i) { b.setAttribute('aria-checked', i === n - 1 ? 'true' : 'false'); b.classList.toggle('on', i === n - 1); });
            if (!done && vals.fun && vals.clarity && vals.difficulty) {
              done = true;
              rate(exId, { fun: vals.fun, clarity: vals.clarity, difficulty: vals.difficulty, set: opts.set });
              box.classList.add('rated');
              if (typeof opts.onDone === 'function') opts.onDone(vals);
            } else if (done) rate(exId, { fun: vals.fun, clarity: vals.clarity, difficulty: vals.difficulty, set: opts.set });
          } } }, String(n));
      });
      row.appendChild(U.el('span', { class: 'rating-label' }, [U.el('strong', null, sc.label), U.el('span', { class: 'rating-ends' }, sc.lo + ' to ' + sc.hi)]));
      row.appendChild(U.el('span', { class: 'rating-btns' }, btns));
      box.appendChild(row);
    });
    box.appendChild(U.el('div', { class: 'rating-foot' }, ES.ui.button('Copy playtest report', { kind: 'ghost', small: true, onClick: copyReport })));
    return box;
  }
  function openNote(screenId) {
    var ta = U.el('textarea', { class: 'note-input', rows: '5', maxlength: '4000', 'aria-label': 'Your note', 'data-autofocus': '' });
    var h = ES.ui.sheet({ title: 'Note about this screen', body: function (b) {
      b.appendChild(U.el('p', { class: 'hint' }, 'Screen: ' + screenId + '. What felt off, unclear, fun or broken?'));
      b.appendChild(ta);
    }, actions: [
      { label: 'Copy report', onClick: function () { copyReport(); return false; } },
      { label: 'Save note', kind: 'primary', onClick: function () { note(screenId, ta.value); if (ta.value.trim()) ES.ui.toast('Note saved'); } }
    ] });
    return h;
  }
  function noteButton(screenIdFn, opts) {
    opts = opts || {};
    return U.el('button', { type: 'button', class: ['note-btn', opts.cls], 'aria-label': 'Leave a playtest note about this screen',
      on: { click: function () {
        var cur = ES.core.router && ES.core.router.current();
        openNote(typeof screenIdFn === 'function' ? screenIdFn() : (cur ? cur.name : 'screen'));
      } } }, 'Note');
  }
  /** The floating note button for every screen (hidden on trial screens, which carry their own). */
  function mountFloating() {
    var d = win.document;
    if (!d || d.getElementById('pt-float')) return;
    var b = noteButton(null, { cls: 'note-float' });
    b.id = 'pt-float';
    d.body.appendChild(b);
  }
  function unmountFloating() { var b = win.document && win.document.getElementById('pt-float'); if (b) b.parentNode.removeChild(b); }

  ES.core.playtest = {
    enabled: enabled, rate: rate, note: note, error: error, frames: frames, setDone: setDone, screen: screen,
    sampleFrames: sampleFrames, reportText: reportText, copyReport: copyReport, device: device,
    ratingEl: ratingEl, noteButton: noteButton, openNote: openNote, mountFloating: mountFloating, unmountFloating: unmountFloating,
    _onError: function (rec) {
      if (inError) { mem.errors.push(rec); return; }   // an error while recording an error: keep it in memory only
      inError = true;
      try { error(rec); } catch (e) { mem.errors.push(rec); } finally { inError = false; }
    }
  };
  var inError = false;
  (ES._errors || []).forEach(function (e) { mem.errors.push(e); });
})(window.ES, window);
