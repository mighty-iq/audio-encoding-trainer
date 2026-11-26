/* ES.ui.settingsData.section() — the Data part of Settings: where the record lives, export (download with a
   copy-box fallback when downloads are blocked), import (file or pasted text; damaged input is repaired or
   refused safely) and delete everything (confirmed). Backups carry no name except a nickname the player typed,
   and no device facts; own-voice recordings never leave the device. */
(function (ES, win) {
  'use strict';
  var U = ES.core.util;

  function statusText() {
    var st = ES.core.store.status(), kb = Math.max(1, Math.round(st.bytes / 1024));
    if (st.readOnly) return 'Read-only: a newer version of Earshot saved this record. Changes in this tab are not saved.';
    if (st.mode === 'memory') return 'Not saved: this view blocks storage. Export a backup to keep this session.';
    if (!st.saved) return st.lastError === 'quota' ? 'Not saved: storage is full. Export a backup, then delete data to free space.' : 'Not saved: the last write failed.';
    return 'Saved on this device only · ' + kb + ' KB' + (st.nearFull ? ' · storage is nearly full' : '');
  }
  function download(name, text, mime) {
    try {
      var blob = new Blob([text], { type: mime || 'application/json' });
      var url = (win.URL || win.webkitURL).createObjectURL(blob);
      var a = U.el('a', { href: url, download: name, class: 'offscreen' });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { try { (win.URL || win.webkitURL).revokeObjectURL(url); } catch (e) { /* ignore */ } }, 5000);
      return true;
    } catch (e) { return false; }
  }
  function exportBackup() {
    var data = ES.core.store.exportAll(), text = JSON.stringify(data, null, 1);
    var name = 'earshot-backup-' + U.isoUtc().slice(0, 10) + '.json', ok = download(name, text);
    ES.hooks.emit('export', { kind: 'backup', bytes: text.length });
    var h = ES.ui.sheet({ title: 'Backup ready', cls: 'sheet-export', body: function (b) {
      b.appendChild(U.el('p', null, [U.el('span', { class: 'mono' }, name), ' · ' + Math.max(1, Math.round(text.length / 1024)) + ' KB']));
      b.appendChild(U.el('p', { class: 'hint' }, ok ? 'If no download started (some previews block downloads), copy the text and keep it in a file or a note.'
        : 'Downloads are blocked here: copy the text and keep it in a file or a note.'));
      ES.core.chimera.invite('export', { el: b });
    }, actions: [{ label: 'Copy the text', attrs: { 'data-copy-backup': '' }, onClick: function () { ES.ui.copyText(text, { title: 'Your backup', toast: 'Backup copied' }); return false; } },
      { label: 'Show the text', attrs: { 'data-show-backup': '' }, onClick: function () { ES.ui.copyBox(text, { title: 'Your backup', hint: 'Select all of the text and copy it into a file or a note.' }); return false; } },
      { label: 'Done', kind: 'primary' }] });
    return h;
  }
  function describe(rep) {
    if (rep.ok) {
      return 'Imported: ' + rep.imported.join(', ') + '.' + (rep.repaired ? ' ' + U.plural(rep.repaired, 'damaged entry', 'damaged entries') + ' repaired or left out.' : '') +
        (rep.skipped.length ? ' Skipped: ' + rep.skipped.map(function (s) { return s.key + ' (' + s.reason + ')'; }).join(', ') + '.' : '');
    }
    return { 'not-a-backup': 'That does not look like an Earshot backup.', 'nothing-usable': 'Nothing in that backup could be used' +
      (rep.skipped.length ? ' (' + rep.skipped.map(function (s) { return s.key + ': ' + s.reason; }).join(', ') + ')' : '') + '.',
      'read-only': 'This tab is read-only because a newer version saved your record.', 'too-large': 'That file is too large to be a backup.' }[rep.error] || 'The import failed.';
  }
  function importBackup() {
    var file = U.el('input', { type: 'file', accept: '.json,application/json,text/plain', class: 'file-input', 'aria-label': 'Backup file', 'data-import-file': '' });
    var ta = U.el('textarea', { class: 'note-input', rows: '4', 'aria-label': 'Backup text', placeholder: 'or paste the backup text here', spellcheck: 'false', 'data-import-text': '' });
    var out = U.el('p', { class: 'hint', 'aria-live': 'polite', 'data-import-result': '' });
    function run(text) {
      var rep = ES.core.store.importAll(text);
      out.textContent = describe(rep);
      if (rep.ok) { ES.ui.toast('Backup imported'); }
      return rep;
    }
    file.addEventListener('change', function () {
      var f = file.files && file.files[0];
      if (!f) return;
      if (f.size > 40e6) { out.textContent = 'That file is too large to be a backup.'; return; }
      var rd = new FileReader();
      rd.onload = function () { run(String(rd.result || '')); };
      rd.onerror = function () { out.textContent = 'That file could not be read.'; };
      rd.readAsText(f);
    });
    var h = ES.ui.sheet({ title: 'Import a backup', body: function (b) {
      b.appendChild(U.el('p', { class: 'hint' }, 'The backup is added to this device’s record: nothing here is deleted.'));
      b.appendChild(file); b.appendChild(ta); b.appendChild(out);
    }, actions: [{ label: 'Import pasted text', attrs: { 'data-import-run': '' }, onClick: function () { if (ta.value.trim()) run(ta.value); else out.textContent = 'Paste the backup text first, or choose a file.'; return false; } },
      { label: 'Done', kind: 'primary' }], onClose: function () { if (ES.core.router.current() && ES.core.router.current().name === 'settings') ES.core.router.refresh(); } });
    return h;
  }
  function deleteAll() {
    return ES.ui.confirm('Your training record, settings and any own-voice recordings on this device will be deleted. This cannot be undone. Export a backup first to keep a copy.',
      { title: 'Delete everything?', ok: 'Delete everything', danger: true }).then(function (yes) {
      if (!yes) return false;
      // Own-voice recordings first: their module closes its database so the deletion is not blocked.
      try { if (ES.ex.voicesOwn && typeof ES.ex.voicesOwn.wipe === 'function') ES.ex.voicesOwn.wipe(); } catch (e) { /* the store wipe still deletes it */ }
      var r = ES.core.store.wipe();
      if (!r.ok) { ES.ui.toast(r.reason === 'read-only' ? 'This tab is read-only: delete from the newer version.' : 'Nothing was deleted.'); return false; }
      if (ES.ui.session && ES.ui.session.abandon) ES.ui.session.abandon();
      if (ES.app && ES.app.applyTheme) ES.app.applyTheme();
      ES.ui.toast('Everything on this device was deleted');
      ES.core.router.go('home', {}, { reset: true });
      return true;
    });
  }
  function section() {
    var P = ES.ui.settingsParts;
    var line = U.el('p', { class: 'hint', 'data-storage-status': '' }, statusText());
    return P.section('Your data', [
      line,
      U.el('div', { class: 'row-buttons' }, [
        ES.ui.button('Export backup', { small: true, attrs: { 'data-export': '' }, onClick: exportBackup }),
        ES.ui.button('Import backup', { small: true, attrs: { 'data-import': '' }, onClick: importBackup }),
        ES.ui.button('Delete everything', { small: true, kind: 'danger', attrs: { 'data-wipe': '' }, onClick: deleteAll })
      ]),
      U.el('p', { class: 'hint' }, 'Everything stays on this device. Backups carry no name except a nickname you typed, and no device details.')
    ], 'data');
  }

  ES.ui.settingsData = { section: section, exportBackup: exportBackup, importBackup: importBackup, deleteAll: deleteAll, statusText: statusText, download: download };
})(window.ES, window);
