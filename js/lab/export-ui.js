/* ES.lab.exportUi — delivering exports and taking imports (CONTRACTS §0: downloads may be blocked).
   deliver(file): tries a download (Blob + a[download]) and always opens a sheet with the file's name and size and a
   "Copy the text" button (clipboard → execCommand → a copy box), because sandboxed previews refuse downloads
   silently; the sheet carries the Chimera invitation after an export. open(): the export choices (backup, CSV,
   community pool with its two switches). importSheet(): a file or pasted text, reported in plain words.
   MIT licence. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var L = ES.lab = ES.lab || {};
  var E = L.exportUi = {};
  function U() { return ES.core.util; }

  E.download = function (name, text, mime) {
    try {
      var blob = new root.Blob([text], { type: mime || 'application/json' }), URLo = root.URL || root.webkitURL;
      var url = URLo.createObjectURL(blob), a = U().el('a', { href: url, download: name, class: 'offscreen' });
      root.document.body.appendChild(a); a.click(); root.document.body.removeChild(a);
      setTimeout(function () { try { URLo.revokeObjectURL(url); } catch (e) { /* ignore */ } }, 5000);
      return true;
    } catch (e) { return false; }
  };
  E.deliver = function (file) {
    var u = U(), ok = E.download(file.name, file.text, file.mime), kb = Math.max(1, Math.round(file.text.length / 1024));
    E.last = { kind: file.kind, name: file.name, text: file.text, downloaded: ok };
    ES.hooks.emit('export', { kind: file.kind, bytes: file.text.length });
    var h = ES.ui.sheet({ title: file.kind === 'pooled' ? 'Pool file ready' : 'Export ready', cls: 'sheet-export', body: function (b) {
      b.setAttribute('data-lab-export-done', file.kind);
      b.appendChild(u.el('p', null, [u.el('span', { class: 'mono' }, file.name), ' · ' + kb + ' KB']));
      b.appendChild(u.el('p', { class: 'hint' }, ok ? 'If no download started (some previews block downloads), copy the text and keep it in a file or a note.'
        : 'Downloads are blocked here: copy the text and keep it in a file or a note.'));
      if (file.kind === 'pooled') b.appendChild(u.el('p', { class: 'hint' }, 'This file holds a random code, your check-in results and your training time per week: no name' +
        (file.obj && file.obj.nickname ? ' except your nickname' : '') + (file.obj && file.obj.device ? ', plus the device details you switched on.' : ', no device details.')));
      ES.core.chimera.invite('export', { el: b });
    }, actions: [{ label: 'Copy the text', attrs: { 'data-lab-copy': '' }, onClick: function () { ES.ui.copyText(file.text, { title: file.name, toast: 'Copied' }); return false; } },
      { label: 'Done', kind: 'primary' }] });
    return h;
  };

  /** The export choices. */
  E.open = function () {
    var u = U(), X = L.exporter, prof = ES.core.store.peek('profile'), nick = (prof.nickname || '').trim();
    var nickBox = u.el('input', { type: 'checkbox', 'data-lab-pool-nick': '' }), devBox = u.el('input', { type: 'checkbox', 'data-lab-pool-device': '' });
    var h;
    function row(title, hint, label, attr, make) {
      return u.el('li', null, [u.el('span', { class: 'row-text' }, [u.el('strong', null, title), u.el('span', { class: 'hint' }, hint)]),
        ES.ui.button(label, { small: true, attrs: attr, onClick: function () { var f; try { f = make(); } catch (e) { ES.ui.toast('That export failed: ' + (e && e.message || e)); return; } h.close('go'); E.deliver(f); } })]);
    }
    h = ES.ui.sheet({ title: 'Export', cls: 'sheet-lab-export', body: function (b) {
      b.appendChild(u.el('ul', { class: 'lab-export-list' }, [
        row('Backup (JSON)', 'Everything, to restore on this or another device. Own-voice recordings stay on this device.', 'Export backup', { 'data-lab-export': 'json' }, function () { return X.json(); }),
        row('Check-in runs (CSV)', 'One row per run, for a spreadsheet.', 'Export CSV', { 'data-lab-export': 'csv-runs' }, function () { return X.csv('runs'); }),
        row('Training sessions (CSV)', 'One row per session, for a spreadsheet.', 'Export CSV', { 'data-lab-export': 'csv-sessions' }, function () { return X.csv('sessions'); }),
        u.el('li', null, [u.el('span', { class: 'row-text' }, [u.el('strong', null, 'Community pool (JSON)'),
          u.el('span', { class: 'hint' }, 'To pool results and test the bets together: a random code, your check-ins and training time, days counted from your own start. No name, no device details unless you tick them.'),
          nick ? u.el('label', { class: 'lab-check' }, [nickBox, 'Include my nickname “' + nick + '”']) : null,
          u.el('label', { class: 'lab-check' }, [devBox, 'Include device details (browser, language, time zone, screen)'])]),
          ES.ui.button('Export pool file', { small: true, attrs: { 'data-lab-export': 'pooled' }, onClick: function () {
            var f; try { f = X.pooled({ nickname: !!(nick && nickBox.checked), device: !!devBox.checked }); } catch (e) { ES.ui.toast('That export failed.'); return; }
            h.close('go'); E.deliver(f);
          } })])
      ]));
    }, actions: [{ label: 'Close', kind: 'primary' }] });
    return h;
  };

  /** Import a backup from a file or pasted text. */
  E.importSheet = function (onDone) {
    var u = U();
    var file = u.el('input', { type: 'file', accept: '.json,application/json,text/plain', class: 'file-input', 'aria-label': 'Backup file', 'data-lab-import-file': '' });
    var ta = u.el('textarea', { class: 'note-input', rows: '4', 'aria-label': 'Backup text', placeholder: 'or paste the backup text here', spellcheck: 'false', 'data-lab-import-text': '' });
    var out = u.el('p', { class: 'hint', 'aria-live': 'polite', 'data-lab-import-result': '' });
    var any = false;
    function run(text) { var rep = L.exporter.importJson(text); out.textContent = rep.message; if (rep.ok) { any = true; ES.ui.toast('Backup imported'); } return rep; }
    file.addEventListener('change', function () {
      var f = file.files && file.files[0];
      if (!f) return;
      if (f.size > 40e6) { out.textContent = 'That file is too large to be an Earshot backup.'; return; }
      var rd = new root.FileReader();
      rd.onload = function () { run(String(rd.result || '')); };
      rd.onerror = function () { out.textContent = 'That file could not be read.'; };
      rd.readAsText(f);
    });
    return ES.ui.sheet({ title: 'Import a backup', body: function (b) {
      b.appendChild(u.el('p', { class: 'hint' }, 'The backup is added to this device’s record: nothing here is deleted. Backups from every earlier version are accepted.'));
      b.appendChild(file); b.appendChild(ta); b.appendChild(out);
    }, actions: [{ label: 'Import pasted text', attrs: { 'data-lab-import-run': '' }, onClick: function () { if (ta.value.trim()) run(ta.value); else out.textContent = 'Paste the backup text first, or choose a file.'; return false; } },
      { label: 'Done', kind: 'primary' }], onClose: function () { if (any && typeof onDone === 'function') onDone(); } });
  };
})(typeof window !== 'undefined' ? window : globalThis);
