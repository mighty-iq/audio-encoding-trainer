/* ES.game.share — the Weekly Night Out result card as an image (DOM: canvas), and the ways to get it out of the app:
   share sheet (phones), copy image, download, or the image shown full size to save by hand when everything else
   is blocked (sandboxed previews refuse clipboard writes and downloads). The text card is weekly.shareText().
   The card is spoiler-free (✓/✕ per trial, no answers), names no one but an optional nickname the player typed,
   and always shows discord.gg/chmr. Light "lab paper" in both themes so it reads well in any chat. */
(function (ES, win) {
  'use strict';
  var G = ES.game, W = 1200, H = 675;
  var C = { bg: '#FAFAF7', grid: 'rgba(21,23,27,0.055)', ink: '#15171B', ink2: '#474C54', ink3: '#686E77', rule: '#DCDDD7', red: '#C8372B',
    ok: '#18744D', okWash: '#E2F2EA', no: '#F1F1EC' };
  var SANS = '"Archivo", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif', MONO = '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';

  function fontsReady() {
    var f = win.document && win.document.fonts;
    if (!f || typeof f.load !== 'function') return Promise.resolve();
    var all = Promise.all(['700 40px Archivo', '600 20px Archivo', '600 24px "JetBrains Mono"'].map(function (x) { return f.load(x).catch(function () { return null; }); }));
    return Promise.race([all, new Promise(function (r) { setTimeout(r, 800); })]);
  }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
  function mark(ctx, x, y, s) {             // the Earshot mark: rings around "you" and the voice you follow
    ctx.strokeStyle = C.ink3; ctx.lineWidth = s * 0.06;
    [0.46, 0.27].forEach(function (k) { ctx.beginPath(); ctx.arc(x, y, s * k, 0, Math.PI * 2); ctx.stroke(); });
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(x, y, s * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(x + s * 0.19, y - s * 0.19, s * 0.11, 0, Math.PI * 2); ctx.fill();
  }
  function fit(ctx, text, max) { var t = String(text); while (t.length > 3 && ctx.measureText(t).width > max) t = t.slice(0, -2) + '…'; return t; }

  /** Draw the card for a weekly result (weekly.result()). → Promise<HTMLCanvasElement> */
  function draw(res, opts) {
    opts = opts || {};
    return fontsReady().then(function () {
      var cv = win.document.createElement('canvas');
      cv.width = W; cv.height = H;
      var ctx = cv.getContext('2d');
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      for (var gx = 0.5; gx < W; gx += 30) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (var gy = 0.5; gy < H; gy += 30) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
      mark(ctx, 84, 84, 60);
      ctx.fillStyle = C.ink; ctx.font = '700 34px ' + SANS; ctx.textBaseline = 'alphabetic';
      ctx.fillText('Earshot', 128, 80);
      ctx.fillStyle = C.ink3; ctx.font = '600 18px ' + MONO;
      ctx.fillText('WEEKLY NIGHT OUT · ' + res.week, 129, 106);
      ctx.fillStyle = C.ink; ctx.font = '700 46px ' + SANS;
      ctx.fillText(fit(ctx, res.label + (opts.nickname ? ' · ' + opts.nickname : ''), 700), 60, 178);
      // stops
      var y0 = 230, rowH = 88, sq = 46, gap = 8, xs = 60, xm = 380;
      (res.stops || []).forEach(function (s, i) {
        var y = y0 + i * rowH;
        ctx.fillStyle = C.ink; ctx.font = '600 26px ' + SANS; ctx.fillText(fit(ctx, s.name, 300), xs, y + 30);
        ctx.fillStyle = C.ink3; ctx.font = '400 18px ' + MONO; ctx.fillText(fit(ctx, s.exName + (s.furthest ? ' · to ' + s.furthest : ''), 300), xs, y + 58);
        var m = s.marks || '';
        for (var k = 0; k < 6; k++) {
          var x = xm + k * (sq + gap), c = m[k];
          rr(ctx, x, y + 6, sq, sq, 8);
          ctx.fillStyle = c === '1' ? C.okWash : C.no; ctx.fill();
          if (!c) { ctx.strokeStyle = C.rule; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]); continue; }
          ctx.strokeStyle = c === '1' ? C.ok : C.ink3; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath();
          var cx = x + sq / 2, cy = y + 6 + sq / 2;
          if (c === '1') { ctx.moveTo(cx - 11, cy + 1); ctx.lineTo(cx - 3, cy + 9); ctx.lineTo(cx + 12, cy - 9); }
          else { ctx.moveTo(cx - 8, cy - 8); ctx.lineTo(cx + 8, cy + 8); ctx.moveTo(cx + 8, cy - 8); ctx.lineTo(cx - 8, cy + 8); }
          ctx.stroke();
        }
      });
      // score
      ctx.textAlign = 'right';
      ctx.fillStyle = C.ink; ctx.font = '600 112px ' + MONO;
      ctx.fillText(res.right + '/' + (res.n || 24), W - 60, 380);
      ctx.fillStyle = C.ink3; ctx.font = '400 22px ' + MONO;
      ctx.fillText(res.complete ? 'right, first run' : 'right so far', W - 60, 420);
      ctx.fillText(res.identity || '', W - 60, 600);
      ctx.textAlign = 'left';
      ctx.fillStyle = C.ink2; ctx.font = '600 22px ' + SANS;
      ctx.fillText('Built by the Chimera community · discord.gg/chmr', 60, 630);
      return cv;
    });
  }
  function toBlob(cv) {
    return new Promise(function (resolve) {
      try { cv.toBlob(function (b) { resolve(b || null); }, 'image/png'); } catch (e) { resolve(null); }
    });
  }
  function fileName(res) { return 'earshot-weekly-' + res.week + '.png'; }
  /** Save the card from a tap through ES.core.download (shell): the artifact host's downloads in the claude.ai viewer,
      else a browser download whose toast offers Copy for the card's text; where saving is impossible the image is
      shown full size to save by hand, with the same text to copy. → Promise<{ok, how, message}> */
  function save(cv, res, text) {
    var name = fileName(res);
    return toBlob(cv).then(function (blob) {
      if (!blob) { showImage(cv, res, 'This browser could not make the image file.', text); return { ok: false, how: 'blocked', message: '' }; }
      return ES.core.download.save(name, blob, 'image/png', { copyText: text, fallback: function (r) { showImage(cv, res, r.message, text); } });
    });
  }
  /** Copy the image to the clipboard. → Promise<bool> */
  function copyImage(blob) {
    try {
      var cb = win.navigator && win.navigator.clipboard;
      if (!blob || !cb || typeof cb.write !== 'function' || typeof win.ClipboardItem !== 'function') return Promise.resolve(false);
      return cb.write([new win.ClipboardItem({ 'image/png': blob })]).then(function () { return true; }, function () { return false; });
    } catch (e) { return Promise.resolve(false); }
  }
  /** The phone share sheet with the image and the text. → Promise<bool> */
  function shareSheet(blob, text, name) {
    try {
      var n = win.navigator;
      if (!blob || !n || typeof n.share !== 'function' || typeof win.File !== 'function') return Promise.resolve(false);
      var file = new win.File([blob], name, { type: 'image/png' }), data = { files: [file], text: text };
      if (typeof n.canShare === 'function' && !n.canShare(data)) return Promise.resolve(false);
      return n.share(data).then(function () { return true; }, function () { return false; });
    } catch (e) { return Promise.resolve(false); }
  }
  /** Last resort: the image full size in a sheet, to save by hand; note says why (else "Saving is blocked here"),
      and text (the card as text) can be copied. */
  function showImage(cv, res, note, text) {
    var src = '';
    try { src = cv.toDataURL('image/png'); } catch (e) { src = ''; }
    return ES.ui.sheet({ title: 'Your card', body: function (b) {
      b.appendChild(ES.core.util.el('p', { class: 'hint' }, (note || 'Saving is blocked here.') + ' Press and hold the image (or right-click it) to save or copy it.'));
      if (src) b.appendChild(ES.core.util.el('img', { class: 'g-shareimg', src: src, alt: 'Weekly Night Out ' + res.week + ': ' + res.right + ' of ' + res.n + ' right' }));
    }, actions: [text ? { label: 'Copy text', attrs: { 'data-card-copy': '' }, onClick: function () { ES.ui.copyText(text, { toast: 'Card text copied', title: 'Your card as text' }); return false; } } : null,
      { label: 'Done', kind: 'primary' }].filter(Boolean) });
  }

  G.share = { draw: draw, toBlob: toBlob, save: save, copyImage: copyImage, shareSheet: shareSheet, showImage: showImage, fileName: fileName, SIZE: [W, H] };
})(window.ES, window);
