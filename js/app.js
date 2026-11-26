/* Boot (loaded last): store → theme → router → the Chimera pop-up on open. Lasting banners show when progress
   is not being saved (blocked storage, a full disk, a newer version's record). */
(function (ES, win) {
  'use strict';
  var doc = win.document, refreshT = null;

  function applyTheme() {
    var t = 'system';
    try { t = (ES.core.store.peek('profile').settings || {}).theme || 'system'; } catch (e) { t = 'system'; }
    if (t === 'light' || t === 'dark') doc.documentElement.setAttribute('data-theme', t);
    else doc.documentElement.removeAttribute('data-theme');
    var meta = doc.querySelector('meta[name="theme-color"]:not([media])');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#111317' : '#FAFAF7');
  }
  function storageBanner(st) {
    st = st || ES.core.store.status();
    var B = ES.ui.banner;
    B('storage', null);
    if (st.readOnly) B('storage', { kind: 'warn', text: 'A newer version of Earshot saved your record. This tab is read-only: changes here are not saved.' });
    else if (st.mode === 'memory') B('storage', { kind: 'warn', text: 'Progress is not saved in this view: storage is blocked here. Export a backup in Settings to keep it.', action: { label: 'Settings', go: 'settings' } });
    else if (!st.saved && st.lastError === 'quota') B('storage', { kind: 'warn', text: 'Not saved: storage is full. Export a backup in Settings, then free some space.', action: { label: 'Settings', go: 'settings' } });
    else if (!st.saved && st.lastError) B('storage', { kind: 'warn', text: 'Not saved: the last write failed. Your session continues in memory.' });
    else if (st.nearFull) B('storage', { kind: 'info', text: 'Storage is nearly full. Export a backup soon.', action: { label: 'Settings', go: 'settings' } });
  }
  function onRemote(ev) {
    if (!ev || ev.source === 'local') return;
    if (ev.key === 'profile' || ev.key === '*') applyTheme();
    if (ES.ui.inSet || ES.ui.sheetOpen()) return;
    var cur = ES.core.router.current();
    if (!cur || ['home', 'settings', 'about'].indexOf(cur.name) < 0) return;
    if (refreshT) clearTimeout(refreshT);
    refreshT = setTimeout(function () { refreshT = null; if (!ES.ui.inSet && !ES.ui.sheetOpen()) ES.core.router.refresh(); }, 250);
  }

  function boot() {
    if (ES.app && ES.app.booted) return;
    ES.app.booted = true;
    var app = doc.getElementById('app');
    ES.core.clock.attach(doc);
    ES.core.router.attach(app, doc);
    ES.hooks.on('store:status', storageBanner);
    ES.hooks.on('store:changed', onRemote);
    ES.core.store.init().then(function () {
      applyTheme();
      storageBanner();
      var boot = doc.getElementById('boot');
      if (boot && boot.parentNode) boot.parentNode.removeChild(boot);
      doc.documentElement.classList.add('ready');
      ES.core.router.on('*', function (r) { ES.core.playtest.screen(r.name); });
      if (ES.core.playtest.enabled()) ES.core.playtest.mountFloating();
      // a session stored before a reload is rebuilt first, so Home offers "Resume session" (RV M11)
      try { if (ES.ui.session && typeof ES.ui.session.restore === 'function') ES.ui.session.restore(); } catch (e) { if (win.console) console.error('[restore]', e); }
      ES.core.router.start('home');
      var full = !ES.core.store.peek('profile').welcomeSeen;
      ES.core.chimera.welcome(full).then(function () {
        if (full) ES.core.store.update('profile', function (r) { r.welcomeSeen = Date.now(); });
      });
      ES.hooks.emit('app:ready', { mode: ES.core.store.status().mode });
    }).catch(function (e) {
      if (win.console) console.error('[boot]', e);
      if (app) app.textContent = 'Earshot could not start. Reload the page to try again.';
    });
  }

  ES.app = ES.app || {};
  ES.app.applyTheme = applyTheme;
  ES.app.boot = boot;
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window.ES, window);
