/* Earshot — voices from your life (CONTRACTS §7, PLAN §6.7; brief exB). Screen 'voices-own': add the voice of
   someone you talk to (a recording made here, only where the page may use the microphone, or an imported voice
   note), with a consent line; list, play, delete; then practise "find your friend": two short crowds of cast
   voices, one with your friend's voice in it, and you say which (2-down/1-up on the friend's level).
   Privacy: every voice is decoded, trimmed to its speech, cut to ≤ 20 s and stored as 16 kHz mono 16-bit WAV
   (the original file and its metadata are not kept) in IndexedDB `earshot-own` on this device only; never in a
   backup, export or share; deletable here and from Settings (ES.ex.voicesOwn.wipe). Where IndexedDB is blocked
   (sandboxed previews) voices live in memory until the page closes, and the screen says so. For practice the
   voice is cut into short segments that live in memory (ES.packs.own) so ES.audio.render can mix them. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  ES.ex = ES.ex || {};
  function U() { return ES.core.util; }
  function K() { return ES.ex._kit; }
  var DB = 'earshot-own', SR = 16000, MAX_S = 20, MIN_S = 1, SEG_S = 2.4, MAX_FILE = 25 * 1024 * 1024;
  var db = null, mode = null, reason = '', mem = { voices: {}, state: {} };

  /* ---- storage: IndexedDB, else memory ---- */
  function req(r) { return new Promise(function (res, rej) { r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error || new Error('storage error')); }; }); }
  function init() {
    if (mode) return Promise.resolve({ mode: mode, reason: reason });
    return new Promise(function (res) {
      function memory(why) { mode = 'memory'; reason = why; res({ mode: mode, reason: reason }); }
      var idb = null;
      try { idb = root.indexedDB; } catch (e) { memory('blocked'); return; }
      if (!idb) { memory('unsupported'); return; }
      var r;
      try { r = idb.open(DB, 1); } catch (e) { memory('blocked'); return; }
      r.onupgradeneeded = function () {
        var d = r.result;
        if (!d.objectStoreNames.contains('voices')) d.createObjectStore('voices', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('state')) d.createObjectStore('state', { keyPath: 'k' });
      };
      r.onsuccess = function () { db = r.result; mode = 'saved'; reason = ''; res({ mode: mode, reason: '' }); };
      r.onerror = function () { memory('blocked'); };
      r.onblocked = function () { memory('busy'); };
    });
  }
  function tx(store, rw) { return db.transaction(store, rw ? 'readwrite' : 'readonly').objectStore(store); }
  function list() {
    return init().then(function () {
      if (mode !== 'saved') return Object.keys(mem.voices).map(function (k) { return mem.voices[k]; });
      return req(tx('voices').getAll());
    }).then(function (a) { return (a || []).sort(function (x, y) { return x.at - y.at; }); });
  }
  function put(rec) { return init().then(function () { if (mode !== 'saved') { mem.voices[rec.id] = rec; return rec; } return req(tx('voices', true).put(rec)).then(function () { return rec; }); }); }
  function getState(k) { return init().then(function () { if (mode !== 'saved') return mem.state[k]; return req(tx('state').get(k)).then(function (r) { return r ? r.v : undefined; }); }); }
  function setState(k, v) { return init().then(function () { if (mode !== 'saved') { mem.state[k] = v; return; } return req(tx('state', true).put({ k: k, v: v })); }); }
  function forget(id) {
    var P = ES.packs && ES.packs.own, ids = [];
    if (P) Object.keys(P).forEach(function (k) { if (k.indexOf('own.' + id + '.') === 0) { ids.push(k); delete P[k]; } });
    try { if (ids.length && ES.audio && ES.audio.assets) ES.audio.assets.release(ids); } catch (e) { /* ignore */ }
  }
  function remove(id) {
    forget(id);
    return init().then(function () {
      if (mode !== 'saved') { delete mem.voices[id]; delete mem.state['level:' + id]; return; }
      return req(tx('voices', true).delete(id)).then(function () { return req(tx('state', true).delete('level:' + id)); });
    });
  }
  /** Delete every voice from your life (Settings › Delete everything calls this). */
  function wipe() {
    Object.keys(mem.voices).forEach(forget);
    mem = { voices: {}, state: {} };
    if (ES.packs && ES.packs.own) Object.keys(ES.packs.own).forEach(function (k) { delete ES.packs.own[k]; });
    return new Promise(function (res) {
      if (db) { try { db.close(); } catch (e) { /* ignore */ } }
      db = null; mode = null;
      var idb = null;
      try { idb = root.indexedDB; } catch (e) { res(true); return; }
      if (!idb) { res(true); return; }
      try { var r = idb.deleteDatabase(DB); r.onsuccess = function () { res(true); }; r.onerror = function () { res(false); }; r.onblocked = function () { res(false); }; }
      catch (e) { res(true); }
    });
  }

  /* ---- audio: decode, mono, 16 kHz, trim to speech, ≤ 20 s, WAV ---- */
  function decode(ab) {
    var O = root.OfflineAudioContext || root.webkitOfflineAudioContext, c = null;
    if (!O) return Promise.reject(new Error('no audio'));
    try { c = new O(1, 1, SR); } catch (e) { try { c = new O(1, 1, 48000); } catch (e2) { return Promise.reject(e2); } }
    return new Promise(function (res, rej) {
      var done = false;
      function ok(b) { if (!done) { done = true; res(b); } }
      function bad(e) { if (!done) { done = true; rej(e instanceof Error ? e : new Error('decode failed')); } }
      try { var p = c.decodeAudioData(ab, ok, bad); if (p && p.then) p.then(ok, bad); } catch (e) { bad(e); }
    });
  }
  function mono(b) {
    var n = b.length, out = new Float32Array(n), ch = b.numberOfChannels;
    for (var c = 0; c < ch; c++) { var d = b.getChannelData(c); for (var i = 0; i < n; i++) out[i] += d[i] / ch; }
    if (b.sampleRate === SR) return out;
    var D = ES.audio && ES.audio.dsp;
    if (D && typeof D.resample === 'function') return D.resample(out, SR / b.sampleRate);
    var k = b.sampleRate / SR, m = Math.floor(n / k), r = new Float32Array(m);   // plain decimation by averaging
    for (var j = 0; j < m; j++) { var s = 0, a = Math.floor(j * k), e = Math.min(n, Math.floor((j + 1) * k)); for (var t = a; t < e; t++) s += out[t]; r[j] = s / Math.max(1, e - a); }
    return r;
  }
  /** Keep the speech: from the first to the last 20 ms frame within 40 dB of the loudest, ≤ MAX_S, peak at −3 dBFS. */
  function trim(x) {
    var f = Math.round(0.02 * SR), nf = Math.floor(x.length / f), rms = [], top = 0;
    for (var i = 0; i < nf; i++) { var s = 0; for (var j = i * f; j < (i + 1) * f; j++) s += x[j] * x[j]; rms.push(Math.sqrt(s / f)); if (rms[i] > top) top = rms[i]; }
    if (!(top > 0.002)) return null;
    var th = top * 0.01, a = 0, b = nf - 1;
    while (a < nf && rms[a] < th) a++;
    while (b > a && rms[b] < th) b--;
    var s0 = Math.max(0, (a - 3) * f), s1 = Math.min(x.length, (b + 4) * f, s0 + MAX_S * SR);
    if (s1 - s0 < MIN_S * SR) return null;
    var y = x.slice(s0, s1), pk = 0;
    for (var q = 0; q < y.length; q++) pk = Math.max(pk, Math.abs(y[q]));
    var g = pk > 0 ? 0.708 / pk : 1;
    for (var w = 0; w < y.length; w++) y[w] *= g;
    return y;
  }
  function wav(x) {
    var n = x.length, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
    function str(o, s) { for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); }
    str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVE'); str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
    v.setUint16(22, 1, true); v.setUint32(24, SR, true); v.setUint32(28, SR * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    str(36, 'data'); v.setUint32(40, n * 2, true);
    for (var i = 0; i < n; i++) { var s = Math.max(-1, Math.min(1, x[i])); v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true); }
    return buf;
  }
  function b64(buf) {
    var u = new Uint8Array(buf), s = '', CH = 0x8000;
    for (var i = 0; i < u.length; i += CH) s += String.fromCharCode.apply(null, u.subarray(i, i + CH));
    return root.btoa(s);
  }
  /** ArrayBuffer of any audio the browser can decode → {pcm: Float32Array at 16 kHz, dur}. Rejects with a reason. */
  function process(ab) {
    return decode(ab).then(function (b) {
      var y = trim(mono(b));
      if (!y) throw new Error('quiet');
      return { pcm: y, dur: Math.round(y.length / SR * 10) / 10 };
    });
  }
  function add(name, kind, pcm) {
    var rec = { id: U().uid('own'), name: String(name).trim().slice(0, 24), consent: true, kind: kind, at: Date.now(), sr: SR,
      dur: Math.round(pcm.length / SR * 10) / 10, wav: wav(pcm) };
    return put(rec);
  }

  /* ---- recording (only where the page may use the microphone) ---- */
  function recordCheck() {
    var nav = root.navigator || {}, doc = root.document || {};
    if (!nav.mediaDevices || typeof nav.mediaDevices.getUserMedia !== 'function' || typeof root.MediaRecorder === 'undefined')
      return { ok: false, why: 'This browser cannot record here. You can import a voice note instead.' };
    try {
      var pp = doc.permissionsPolicy || doc.featurePolicy;
      if (pp && typeof pp.allowsFeature === 'function' && !pp.allowsFeature('microphone'))
        return { ok: false, why: 'Recording is blocked on this page (for example inside a preview). You can import a voice note instead.' };
    } catch (e) { /* unknown: try */ }
    if (root.isSecureContext === false) return { ok: false, why: 'Recording needs a secure page. You can import a voice note instead.' };
    return { ok: true };
  }
  /** Start recording; resolves with a handle {stop(), done: Promise<ArrayBuffer>} or rejects with a reason. */
  function record(onTick) {
    var chk = recordCheck();
    if (!chk.ok) return Promise.reject(new Error(chk.why));
    return root.navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: true } }).then(function (stream) {
      var rec = new root.MediaRecorder(stream), chunks = [], t0 = Date.now(), timer = null, stopped = false, resolve, reject;
      var done = new Promise(function (a, b) { resolve = a; reject = b; });
      function end() { if (timer) clearInterval(timer); stream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) { /* ignore */ } }); }
      rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = function () { end(); new root.Blob(chunks, { type: rec.mimeType || 'audio/webm' }).arrayBuffer().then(resolve, reject); };
      rec.onerror = function (e) { end(); reject(e.error || new Error('recording failed')); };
      rec.start();
      timer = setInterval(function () { var s = (Date.now() - t0) / 1000; if (onTick) onTick(s); if (s >= MAX_S) h.stop(); }, 250);
      var h = { stop: function () { if (!stopped) { stopped = true; try { rec.stop(); } catch (e) { end(); reject(e); } } }, done: done };
      return h;
    }, function (e) {
      var n = e && e.name;
      throw new Error(n === 'NotAllowedError' || n === 'SecurityError' ? 'Microphone access was refused here. You can allow it in the browser’s site settings, or import a voice note instead.'
        : n === 'NotFoundError' ? 'No microphone was found. You can import a voice note instead.' : 'Recording could not start here. You can import a voice note instead.');
    });
  }
  function toAB(blob) {
    if (blob && typeof blob.arrayBuffer === 'function') return blob.arrayBuffer();
    return new Promise(function (res, rej) { var r = new root.FileReader(); r.onload = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; r.readAsArrayBuffer(blob); });
  }

  /* ---- practice: find your friend. Two crowds of two cast voices each; your friend's voice is in one of them at
     a level re each other voice that falls after two right answers and rises after a miss (2 dB steps after the
     first reversal, 4 dB before), so the level settles where you are right about 71 % of the time. ---- */
  var START_DB = 6, MIN_DB = -18, MAX_DB = 12, ROUND = 8;
  function r3(x) { return Math.round(x * 1000) / 1000; }
  function clipDur(id) { var m = ES.data && ES.data.manifest && ES.data.manifest.clips && ES.data.manifest.clips[id]; return (m && m.dur) || 2.5; }
  function maskerPool() {
    var X = ES.engine && ES.engine.items && ES.engine.items.data, out = [];
    if (!X || typeof X.idx !== 'function') return out;
    X.idx().voices.forEach(function (v) { var c = X.kindsOf(v, 'sentence'); if (!c.length) c = X.kindsOf(v, 'phrase'); if (c.length) out.push({ v: v, clips: c }); });
    return out;
  }
  /** Cut the stored voice into SEG_S windows with speech; they live in memory as clips 'own.<id>.<k>'. */
  function segments(rec) {
    return decode(rec.wav.slice(0)).then(function (b) {
      var x = b.getChannelData(0), n = Math.min(x.length, Math.round(SEG_S * b.sampleRate)), wins = [], top = 0, k;
      for (var s = 0; s + n <= x.length; s += Math.max(1, Math.round(n * 0.75))) {
        var e = 0;
        for (k = s; k < s + n; k++) e += x[k] * x[k];
        wins.push({ s: s, r: Math.sqrt(e / n) });
        top = Math.max(top, wins[wins.length - 1].r);
      }
      var keep = wins.filter(function (w) { return w.r >= 0.35 * top; }).slice(0, 8), P = ES.packs = ES.packs || {};
      P.own = P.own || {};
      return keep.map(function (w, i) { var id = 'own.' + rec.id + '.' + i; P.own[id] = b64(wav(x.slice(w.s, w.s + n))); return { id: id, dur: n / b.sampleRate }; });
    });
  }
  function makeTrial(p, i) {
    var rng = ES.core.rng('own:' + p.rec.id + ':' + p.seed + ':' + i), name = p.rec.name, L = p.level;
    var seg = p.segs[rng.int(0, p.segs.length - 1)], which = rng.next() < 0.5 ? 0 : 1, vs = rng.shuffle(p.pool.slice());
    var parts = [], spans = [], t = 0.3;
    for (var c = 0; c < 2; c++) {
      var a = vs[(2 * c) % vs.length], b = vs[(2 * c + 1) % vs.length], ca = rng.pick(a.clips), cb = rng.pick(b.clips), end = t, first = parts.length;
      parts.push({ clip: ca, at: r3(t), db: -L, role: 'masker' }); end = Math.max(end, t + clipDur(ca));
      parts.push({ clip: cb, at: r3(t + 0.15), db: -L, role: 'masker' }); end = Math.max(end, t + 0.15 + clipDur(cb));
      if (c === which) { parts.push({ clip: seg.id, at: r3(t + 0.08), db: 0, role: 'target' }); end = Math.max(end, t + 0.08 + seg.dur); }
      spans.push({ from: first, to: parts.length, t0: t, t1: end });
      t = end + 0.9;
    }
    var audio = { out: { db: -20 }, dur: r3(t - 0.5), spatial: 'mono', parts: parts, beds: [], room: null };
    var sp = spans[which], crowd = { out: audio.out, dur: r3(sp.t1 - sp.t0 + 0.6), spatial: 'mono', beds: [], room: null,
      parts: parts.slice(sp.from, sp.to).map(function (x) { return { clip: x.clip, at: r3(x.at - sp.t0 + 0.25), db: x.db, role: x.role }; }) };
    var ans = which ? 'Second crowd' : 'First crowd';
    return { id: 'own-' + p.seed + '-' + i, ex: 'voices-own', seed: 'own:' + p.seed + ':' + i, setting: { dials: { tmr: L }, focus: 'tmr' },
      audio: audio,
      question: { prompt: 'Which crowd had ' + name + ' in it?', slots: [{ label: '', options: ['First crowd', 'Second crowd'], answer: ans, foils: {} }] },
      feedback: { text: name + ' was in the ' + (which ? 'second' : 'first') + ' crowd.', replays: [
        { label: name + ' alone', audio: { out: audio.out, dur: r3(seg.dur + 0.5), spatial: 'mono', parts: [{ clip: seg.id, at: 0.25, db: 0, role: 'target' }], beds: [], room: null } },
        { label: 'That crowd again', audio: crowd }] },
      picture: { voices: [{ id: 'a', role: 'other', az: -68, dist: 1.5, label: '1' }, { id: 'b', role: 'other', az: -40, dist: 1.8, label: '' },
        { id: 'c', role: 'other', az: 40, dist: 1.8, label: '' }, { id: 'd', role: 'other', az: 68, dist: 1.5, label: '2' }], maxDist: 2.4, labels: false,
        title: 'Two crowds, one after the other; ' + name + ' talks in one of them' },
      meta: { own: true, items: [ans], voices: [] } };
  }
  function stair(p, ok) {
    var dir = 0;
    if (ok) { p.streak++; if (p.streak >= 2) { p.streak = 0; dir = -1; } } else { p.streak = 0; dir = 1; }
    if (!dir) return;
    if (p.dir && dir !== p.dir) { p.revs.push(p.level); p.step = 2; }
    p.dir = dir;
    p.level = Math.max(MIN_DB, Math.min(MAX_DB, p.level + dir * p.step));
  }
  function estimate(p) { var r = p.revs.slice(-4); return r.length >= 2 ? Math.round(r.reduce(function (a, b) { return a + b; }, 0) / r.length) : p.level; }

  /* ---- screen 'voices-own' ---- */
  var cur = null;
  function el(t, a, c) { return U().el(t, a, c); }
  function dbText(x) { return U().fmtDb ? U().fmtDb(x) : x + ' dB'; }
  function mount(root2) {
    var u = U(), state = { name: '', consent: false, rec: null, busy: false };
    cur = { dead: false, rec: null, view: null, player: null };
    var msg = el('p', { class: 'hint own-msg', 'aria-live': 'polite' }), store = el('p', { class: 'hint own-store' }), listBox = el('div', { class: 'own-list' });
    var nameIn = el('input', { type: 'text', maxlength: '24', autocomplete: 'off', 'aria-label': 'Name', placeholder: 'A first name or nickname', class: 'own-name', 'data-own-name': '' });
    var consent = el('input', { type: 'checkbox', 'data-own-consent': '' });
    var fileIn = el('input', { type: 'file', accept: 'audio/*', hidden: true, 'data-own-file': '' });
    var recBtn = ES.ui.button('Record (up to ' + MAX_S + ' s)', { kind: 'secondary', attrs: { 'data-own-record': '' }, onClick: startRec });
    var impBtn = ES.ui.button('Import a voice note', { kind: 'secondary', attrs: { 'data-own-import': '' }, onClick: function () { fileIn.click(); } });
    var recCheck = recordCheck();
    function say(t) { msg.textContent = t || ''; }
    function ready() { return state.name.trim().length > 0 && state.consent && !state.busy; }
    function paint() { impBtn.disabled = !ready(); recBtn.disabled = !ready() || !recCheck.ok; }
    nameIn.addEventListener('input', function () { state.name = nameIn.value; paint(); });
    consent.addEventListener('change', function () { state.consent = !!consent.checked; paint(); });
    fileIn.addEventListener('change', function () {
      var f = fileIn.files && fileIn.files[0];
      fileIn.value = '';
      if (!f || !ready()) return;
      if (f.size > MAX_FILE) { say('That file is too large. A voice note of up to ' + MAX_S + ' s is plenty.'); return; }
      state.busy = true; paint(); say('Reading the voice…');
      toAB(f).then(process).then(function (r) { return add(state.name, 'file', r.pcm); }).then(saved, failed);
    });
    function startRec() {
      if (!ready()) return;
      state.busy = true; paint(); say('Starting the microphone…');
      record(function (s) { if (cur && cur.rec) say('Recording… ' + Math.floor(s) + ' s of ' + MAX_S + '. Tap Stop when done.'); }).then(function (h) {
        cur.rec = h;
        var stop = ES.ui.button('Stop', { kind: 'primary', attrs: { 'data-own-stop': '' }, onClick: function () { h.stop(); } });
        recBtn.parentNode.insertBefore(stop, recBtn.nextSibling);
        h.done.then(function (ab) { if (stop.parentNode) stop.parentNode.removeChild(stop); cur.rec = null; return process(ab); })
          .then(function (r) { return add(state.name, 'recording', r.pcm); }).then(saved, function (e) { if (stop.parentNode) stop.parentNode.removeChild(stop); cur.rec = null; failed(e); });
      }, failed);
    }
    function saved(rec) {
      state.busy = false; nameIn.value = ''; state.name = ''; consent.checked = false; state.consent = false; paint();
      say(rec.name + '’s voice is ready (' + rec.dur + ' s). Practise below.');
      refresh();
    }
    function failed(e) {
      state.busy = false; paint();
      var m = String(e && e.message || e);
      say(m === 'quiet' ? 'That sounded silent or shorter than ' + MIN_S + ' s of speech. Try a voice note where the person talks for a few seconds.'
        : /refused|blocked|cannot record|microphone|secure|Recording/.test(m) ? m : 'That file could not be read as audio. Most voice notes and audio files work (MP3, M4A, OGG, WAV).');
    }
    function refresh() {
      list().then(function (a) {
        if (cur.dead) return;
        u.clear(listBox);
        if (!a.length) { listBox.appendChild(el('p', { class: 'hint' }, 'No voices yet.')); return; }
        Promise.all(a.map(function (r) { return getState('level:' + r.id).catch(function () { return null; }); })).then(function (lv) {
          if (cur.dead) return;
          u.clear(listBox);
          listBox.appendChild(el('ul', { class: 'own-ul' }, a.map(function (r, i) {
            var l = lv[i];
            return el('li', { class: 'own-li', 'data-own-voice': r.id }, [
              el('span', { class: 'own-who' }, [el('strong', null, r.name), el('span', { class: 'hint' }, ' · ' + (r.kind === 'recording' ? 'recorded here' : 'voice note') + ' · ' + r.dur + ' s' +
                (l && typeof l.level === 'number' ? ' · found at ' + dbText(l.level) : ''))]),
              el('span', { class: 'own-acts' }, [ES.ui.button('Play', { kind: 'ghost', small: true, attrs: { 'data-own-play': r.id }, onClick: function () { play(r); } }),
                ES.ui.button('Practise', { kind: 'secondary', small: true, attrs: { 'data-own-practise': r.id }, onClick: function () { practise(r); } }),
                ES.ui.button('Delete', { kind: 'ghost', small: true, attrs: { 'data-own-delete': r.id }, onClick: function () { del(r); } })])]);
          })));
          listBox.appendChild(ES.ui.button('Delete all voices', { kind: 'ghost', small: true, attrs: { 'data-own-wipe': '' }, onClick: function () {
            ES.ui.confirm('Delete every voice from your life on this device? This cannot be undone.', { title: 'Delete all voices', ok: 'Delete all', danger: true })
              .then(function (y) { if (y) wipe().then(function () { mode = null; return init(); }).then(function (s) { paintStore(s); say('All voices deleted.'); refresh(); }); });
          } }));
        });
      }, function () { say('Your voices could not be read here.'); });
    }
    function del(r) {
      ES.ui.confirm('Delete ' + r.name + '’s voice from this device? This cannot be undone.', { title: 'Delete a voice', ok: 'Delete', danger: true })
        .then(function (y) { if (y) remove(r.id).then(function () { say(r.name + '’s voice was deleted.'); refresh(); }); });
    }
    function play(r) {
      if (cur.player) { try { cur.player.stop(); } catch (e) { /* ignore */ } cur.player = null; }
      decode(r.wav.slice(0)).then(function (b) { cur.player = ES.audio.play(b); }).catch(function () { say('That voice could not play here.'); });
    }
    function practise(r) {
      var pool = maskerPool();
      if (pool.length < 2) { say('Practice needs the voice packs of the audio build.'); return; }
      say('Getting ' + r.name + '’s voice ready…');
      segments(r).then(function (segs) {
        if (cur.dead || !segs.length) return;
        getState('level:' + r.id).catch(function () { return null; }).then(function (l) {
          var p = { rec: r, seed: Date.now() % 100000, level: l && typeof l.level === 'number' ? Math.min(MAX_DB, l.level + 4) : START_DB, segs: segs, pool: pool, i: 0, n: ROUND, streak: 0, step: 4, dir: 0, revs: [], ok: 0 };
          runPractice(root2, p, function () { u.clear(root2); mount2(); });
        });
      }, function () { say('That voice could not be prepared for practice.'); });
    }
    function paintStore(s) {
      store.textContent = s.mode === 'saved' ? 'Saved on this device only. Never exported or shared.'
        : 'Saving is blocked here (for example in a preview), so voices you add last only until you leave this page.';
    }
    function mount2() {
      root2.appendChild(el('div', { class: 'wrap own' }, [ES.ui.w.header({ back: true, title: 'Voices from your life' }),
        el('p', { class: 'eyebrow mono' }, 'Voices · from your life'),
        el('h1', { class: 'h-mid' }, 'Voices you know'),
        el('p', { class: 'lead' }, 'Add the voice of someone you talk to: a short recording or a voice note. Then practise picking it out of a crowd. A familiar voice is easier to follow in noise.'),
        store,
        el('section', { class: 'card own-add' }, [el('h2', { class: 'h-small' }, 'Add a voice'),
          el('label', { class: 'own-row' }, [el('span', null, 'Whose voice is it?'), nameIn]),
          el('label', { class: 'own-row own-consent' }, [consent, el('span', null, 'I have this person’s permission to use their voice.')]),
          el('p', { class: 'hint' }, 'Only with the speaker’s permission. Voices stay on this device: never exported, never shared, and you can delete them at any time.'),
          el('div', { class: 'own-btns' }, [recBtn, impBtn]), fileIn,
          recCheck.ok ? null : el('p', { class: 'hint', 'data-own-norec': '' }, recCheck.why), msg]),
        el('h2', { class: 'h-small' }, 'Your voices'), listBox, ES.ui.w.footer()]));
      paint();
      init().then(function (s) { paintStore(s); refresh(); });
    }
    css();
    mount2();
  }
  function runPractice(root2, p, onEnd) {
    var u = U(), level = el('span', { class: 'tb-level mono' }), dots = el('ol', { class: 'dots' }), host = el('div', { class: 'trial-host' });
    var back = el('button', { type: 'button', class: 'tb-btn', 'aria-label': 'Back to your voices', 'data-own-back': '' }, '‹');
    back.addEventListener('click', end);
    u.clear(root2);
    root2.appendChild(el('div', { class: 'trial own-trial' }, [el('header', { class: 'trial-bar' }, [back,
      el('div', { class: 'tb-mid' }, [el('div', { class: 'tb-line' }, [el('span', { class: 'tb-title' }, 'Find ' + p.rec.name), level]), dots])]), host]));
    root.document.documentElement.classList.add('in-trial');
    function next() {
      if (!cur || cur.dead) return;
      if (p.i >= p.n) { summary(); return; }
      u.clear(dots);
      for (var i = 0; i < p.n; i++) dots.appendChild(el('li', { class: i < p.i ? 'is-done' : i === p.i ? 'is-now' : '' }));
      level.textContent = 'level ' + dbText(p.level);
      cur.view = ES.ui.trialView.run(host, { trial: makeTrial(p, p.i), mode: 'set', autoMs: 900, score: function (t, r) { return ES.engine.score(t, r); },
        onResult: function (res) { if (res.correct) p.ok++; stair(p, res.correct); } });
      cur.view.done.then(function (out) { if (!out || out.aborted || !cur || cur.dead) return; p.i++; next(); });
    }
    function summary() {
      var est = estimate(p);
      setState('level:' + p.rec.id, { level: est, at: Date.now(), n: p.n }).catch(function () { /* memory only */ });
      u.clear(host);
      host.appendChild(el('div', { class: 'tut-card card', 'data-own-summary': '' }, [el('p', { class: 'eyebrow mono' }, 'Find ' + p.rec.name),
        el('p', { class: 'tut-text' }, p.ok + ' of ' + p.n + ' right. You picked out ' + p.rec.name + ' at about ' + dbText(est) + ' against each of two other voices.'),
        el('p', { class: 'hint' }, 'Lower is harder: at 0 dB your friend was as loud as each other voice. The next round starts a little easier than this.'),
        el('div', { class: 'actions' }, [ES.ui.button('Another round', { kind: 'secondary', onClick: function () { p.i = 0; p.ok = 0; p.revs = []; p.dir = 0; p.step = 4; p.seed++; next(); } }),
          ES.ui.button('Done', { kind: 'primary', attrs: { 'data-own-done': '' }, onClick: end })])]));
    }
    function end() { if (cur && cur.view) { cur.view.abort(); cur.view = null; } root.document.documentElement.classList.remove('in-trial'); onEnd(); }
    next();
  }
  function css() {
    var doc = root.document;
    if (!doc || !doc.head || doc.getElementById('es-own-css')) return;
    var st = doc.createElement('style');
    st.id = 'es-own-css';
    st.textContent = ['.own-row { display: flex; flex-direction: column; gap: 6px; margin: 10px 0; }',
      '.own-name { min-height: 44px; padding: 0 12px; border: 1px solid var(--rule-2); border-radius: var(--r-1); background: var(--surface); color: var(--ink); font: inherit; }',
      '.own-consent { flex-direction: row; align-items: flex-start; gap: 10px; } .own-consent input { flex: none; width: 22px; height: 22px; margin: 2px 0 0; accent-color: var(--ink); }',
      '.own-btns { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0; } .own-btns .btn { flex: 1 1 150px; }',
      '.own-ul { list-style: none; margin: 0 0 12px; padding: 0; border-top: 1px solid var(--rule); }',
      '.own-li { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 10px; padding: 10px 0; border-bottom: 1px solid var(--rule); }',
      '.own-acts { display: flex; gap: 6px; }'].join('\n');
    doc.head.appendChild(st);
  }
  function unmount() {
    if (!cur) return;
    cur.dead = true;
    if (cur.rec) { try { cur.rec.stop(); } catch (e) { /* ignore */ } }
    if (cur.view) cur.view.abort();
    if (cur.player) { try { cur.player.stop(); } catch (e) { /* ignore */ } }
    if (root.document) root.document.documentElement.classList.remove('in-trial');
    cur = null;
  }

  if (ES.ui && ES.ui.screens) ES.ui.screens['voices-own'] = { mount: mount, unmount: unmount };
  var api = { init: init, list: list, add: add, remove: remove, wipe: wipe, getState: getState, setState: setState, process: process, recordCheck: recordCheck,
    mode: function () { return mode; }, MAX_S: MAX_S };
  try { Object.defineProperty(ES.ex, 'voicesOwn', { value: api, enumerable: false, configurable: true, writable: true }); } catch (e) { ES.ex.voicesOwn = api; }
})(typeof window !== 'undefined' ? window : globalThis);
