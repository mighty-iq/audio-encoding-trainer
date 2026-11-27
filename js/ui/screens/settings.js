/* Screen 'settings' — mode (with when each is right), session length, sound (volume setup, headphones),
   theme, nickname, playtest, and the data section (js/ui/screens/settings-data.js). */
(function (ES, win) {
  'use strict';
  var U = ES.core.util;
  var MODES = [
    ['edge', 'Edge', 'Tracks your edge on every dial and pushes one at a time to it, the rest just below. No setup.', 'Right for almost everyone; it is the default.'],
    ['path', 'Path', 'Venues in order: one condition at a time, then mixed.', 'Right for beginners, for clear goals, or when mixing feels confusing.'],
    ['variety', 'Variety', 'A new talker, room or voice type on every trial.', 'Right after a plateau, or when you already do well and want breadth.'],
    ['focus', 'Focus', 'Spends 60 % of the time on your hardest situation.', 'Right when one situation bothers you most.'],
    ['free', 'Free', 'Pick one exercise and set its dials yourself; a coach line shows your current edge on each.', 'Right when you want to explore.']
  ];
  var LENGTHS = [10, 15, 20, 30];

  function prof() { return ES.core.store.peek('profile'); }
  function setSetting(k, v) { ES.core.store.update('profile', function (r) { r.settings = r.settings || {}; r.settings[k] = v; }); }
  function applyTheme() { if (ES.app && ES.app.applyTheme) ES.app.applyTheme(); }
  function section(title, children, id) {
    return U.el('section', { class: 'set-sec', 'aria-labelledby': 'sec-' + id }, [U.el('h2', { class: 'h-small', id: 'sec-' + id }, title)].concat(children));
  }
  /** A row of choices as toggle buttons (aria-pressed): each is a Tab stop and Enter or Space picks it (RV A6). */
  function seg(name, items, value, onPick) {
    var box = U.el('div', { class: 'seg', role: 'group', 'aria-label': name });
    items.forEach(function (it) {
      var b = U.el('button', { type: 'button', class: 'seg-btn', 'aria-pressed': String(it[0] === value), 'data-value': String(it[0]),
        on: { click: function () {
          Array.prototype.forEach.call(box.children, function (c) { c.setAttribute('aria-pressed', String(c === b)); });
          onPick(it[0]);
        } } }, it[1]);
      box.appendChild(b);
    });
    return box;
  }
  function toggle(label, hint, on, onChange, opts) {
    opts = opts || {};
    var input = U.el('input', { type: 'checkbox', class: 'switch', role: 'switch', 'aria-checked': String(!!on), disabled: opts.disabled ? true : null, 'data-setting': opts.key || null });
    input.checked = !!on;
    input.addEventListener('change', function () { input.setAttribute('aria-checked', String(input.checked)); onChange(input.checked); });
    return U.el('label', { class: 'row-toggle' }, [U.el('span', { class: 'row-text' }, [U.el('strong', null, label), hint ? U.el('span', { class: 'hint' }, hint) : null]), input]);
  }
  function modeList(current) {
    var engine = !!(ES.engine.controller && ES.engine.controller.next);
    var list = U.el('div', { class: 'modes', role: 'radiogroup', 'aria-label': 'Progression mode' });
    MODES.forEach(function (m) {
      var id = 'mode-' + m[0];
      var input = U.el('input', { type: 'radio', name: 'mode', id: id, value: m[0], 'data-mode': m[0] });
      input.checked = m[0] === current;
      input.addEventListener('change', function () { if (input.checked) { setSetting('mode', m[0]); showFree(m[0]); } });
      list.appendChild(U.el('label', { class: 'mode', for: id }, [input, U.el('span', { class: 'mode-text' }, [
        U.el('strong', null, m[1] + (m[0] === 'edge' ? ' · default' : '')), U.el('span', null, m[2]), U.el('span', { class: 'hint' }, m[3])])]));
    });
    // the Free picker sits under the list while Free is the mode (RV C06); Focus shows what it aims at (RV P6)
    var pick = ES.ui.settingsFree ? U.el('div', { 'data-free-slot': '' }) : null, aim = U.el('div', { 'data-focus-slot': '' });
    function showFree(on) {
      if (pick) { U.clear(pick); if (on === 'free') pick.appendChild(ES.ui.settingsFree.el()); }
      U.clear(aim); if (on === 'focus') { var r = focusRow(); if (r) aim.appendChild(r); }
    }
    showFree(current);
    return [list, pick, aim, engine ? null : U.el('p', { class: 'hint' }, 'Modes take effect once the training engine is installed; the demo ignores them.')];
  }
  /** Focus mode's target (the Lab's check-in behind it) with a chooser; without one Focus trains like Edge (RV P6). */
  function focusTarget() {
    var L = ES.lab, c = null;
    try { c = L && typeof L.context === 'function' ? L.context() : null; } catch (e) { c = null; }
    var R = L && L.records, pick = R && typeof R.focus === 'function' ? R.focus() : null;
    return { has: !!(c && c.weakest), name: c && c.weakest && L.probes[c.weakest] ? L.probes[c.weakest].name : '', pick: !!pick, ok: !!(R && L.probes) };
  }
  function focusRow() {
    var t = focusTarget();
    if (!t.ok) return null;
    var text = t.has ? t.name + (t.pick ? ' (your pick)' : ' (furthest below our starting guesses)')
      : 'No target yet: choose one, or run a Lab check-in. Until then Focus trains like Edge.';
    return U.el('div', { class: 'row focus-aim', 'data-focus-aim': t.has ? 'set' : 'none' }, [
      U.el('span', { class: 'row-text' }, [U.el('strong', null, 'Focus aims at'), U.el('span', { class: 'hint' }, text)]),
      ES.ui.button('Choose', { small: true, attrs: { 'data-focus-choose': '' }, onClick: chooseFocus })]);
  }
  function chooseFocus() {
    var L = ES.lab, R = L.records, cur = R.focus() || '';
    var opts = [{ id: '', label: 'Automatic: the check-in where you sit furthest below our starting guess' }].concat((L.probeOrder || Object.keys(L.probes))
      .filter(function (id) { return id !== 'diary' && L.probes[id]; }).map(function (id) { return { id: id, label: L.probes[id].name + (L.probes[id].short ? ' — ' + L.probes[id].short : '') }; }));
    ES.ui.sheet({ title: 'Which situation bothers you most?', body: function (b) {
      b.appendChild(U.el('p', { class: 'hint' }, 'Focus mode spends 60\u00a0% of training on the exercise behind this check-in.'));
      opts.forEach(function (o) {
        var inp = U.el('input', { type: 'radio', name: 'focus-aim', value: o.id, 'data-focus-opt': o.id || 'auto' });
        inp.checked = cur === o.id;
        inp.addEventListener('change', function () { if (inp.checked) { R.setFocus(o.id || null); ES.ui.toast('Focus saved'); } });
        b.appendChild(U.el('label', { class: 'mode' }, [inp, U.el('span', { class: 'mode-text' }, o.label)]));
      });
    }, actions: [{ label: 'Done', kind: 'primary' }], onClose: function () { var c = ES.core.router.current(); if (c && c.name === 'settings') ES.core.router.refresh(); } });
  }
  function headphones(s) {
    var r = s.hpCheck && s.hpCheck.result;
    var status = r === 'pass' ? 'Checked: headphones detected.' : r === 'manual' ? 'You said you wear headphones (check skipped).'
      : r === 'fail' ? 'Checked: the left-right test did not pass (a speaker or mono output?).' : 'Not checked yet.';
    var line = U.el('p', { class: 'hint', 'data-hp-status': '' }, status);
    return [
      U.el('div', { class: 'row' }, [U.el('span', { class: 'row-text' }, [U.el('strong', null, 'Headphone check'), line]),
        ES.ui.button('Check', { small: true, attrs: { 'data-hpcheck': '' }, onClick: function () {
          var chk = (ES.lab && ES.lab.hpcheck) || (ES.audio && ES.audio.hpcheck);
          if (chk && typeof chk.open === 'function') {
            var h = chk.open();
            if (h && h.closed) h.closed.then(function () { var c = ES.core.router.current(); if (c && c.name === 'settings') ES.core.router.refresh(); });
            return;
          }
          ES.ui.sheet({ title: 'Headphone check', body: 'A short left-right test arrives with the audio build. Everything except the 3D-direction dials works on a phone speaker; those dials wait for headphones.', actions: [{ label: 'OK', kind: 'primary' }] });
        } })]),
      toggle('I am wearing headphones', 'Skips the check and unlocks the direction dials; turn it off when you use a speaker.', !!s.headphones, function (on) {
        ES.core.store.update('profile', function (r) { r.settings.headphones = on; r.settings.hpCheck = on ? { at: Date.now(), result: 'manual' } : null; });
        line.textContent = on ? 'You said you wear headphones (check skipped).' : 'Not checked yet.';
      }, { key: 'headphones' })
    ];
  }

  var offSaved = null;
  /** "Saved for the developer" once the playtest report reached the artifact's database (test builds). */
  function dbLine() {
    var pt = ES.core.playtest, line = U.el('p', { class: 'hint db-status', 'data-db-status': '' });
    function paint() { var st = pt.db ? pt.db.status() : null; line.textContent = st && st.lastOk ? 'Saved for the developer' : ''; line.hidden = !(st && st.lastOk); }
    paint();
    if (offSaved) offSaved();
    offSaved = ES.hooks.on('playtest:saved', paint);
    return line;
  }
  /** "Voices from your life" (exB): recordings of people you know, on this device only. */
  function ownVoices() {
    if (!ES.core.router.has('voices-own')) return [];
    return [U.el('div', { class: 'row' }, [U.el('span', { class: 'row-text' }, [U.el('strong', null, 'Voices from your life'),
      U.el('span', { class: 'hint' }, 'Record or import voices of people you know. They stay on this device and are never exported.')]),
      ES.ui.button('Open', { small: true, go: 'voices-own', attrs: { 'data-own-voices': '' } })])];
  }
  function mount(root) {
    var p = prof(), s = p.settings || {};
    var nick = U.el('input', { type: 'text', class: 'text-input', maxlength: '40', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Nickname', placeholder: 'optional' });
    nick.value = p.nickname || '';
    nick.addEventListener('change', function () { var v = nick.value.trim().slice(0, 40); ES.core.store.update('profile', function (r) { r.nickname = v; }); ES.ui.toast('Nickname saved'); });
    var pt = ES.core.playtest;
    root.appendChild(U.el('div', { class: 'wrap settings' }, [
      ES.ui.w.header({ back: true, title: 'Settings', settings: false }),
      U.el('h1', { class: 'sr-only' }, 'Settings'),
      section('Training', modeList(s.mode || 'edge').concat([
        U.el('div', { class: 'row' }, [U.el('span', { class: 'row-text' }, [U.el('strong', null, 'Session length'), U.el('span', { class: 'hint' }, 'Minutes of listening per session.')]),
          seg('Session length', LENGTHS.map(function (n) { return [n, n + ' min']; }), s.sessionMin || 15, function (v) { setSetting('sessionMin', v); })])
      ]), 'training'),
      section('Sound', [
        U.el('div', { class: 'row' }, [U.el('span', { class: 'row-text' }, [U.el('strong', null, 'Comfortable level'),
          U.el('span', { class: 'hint' }, s.volumeSet ? 'Set on ' + U.dayKey(s.volumeSet) + '. Every trial except Seek’s live search plays at this level.' : 'Not set yet. Takes 20 seconds.')]),
          ES.ui.button('Set level', { small: true, go: 'volume' })])
      ].concat(headphones(s), ownVoices()), 'sound'),
      section('Display', [
        U.el('div', { class: 'row' }, [U.el('span', { class: 'row-text' }, [U.el('strong', null, 'Theme')]),
          seg('Theme', [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']], s.theme || 'system', function (v) { setSetting('theme', v); applyTheme(); })]),
        U.el('div', { class: 'row' }, [U.el('span', { class: 'row-text' }, [U.el('strong', null, 'Nickname'), U.el('span', { class: 'hint' }, 'Shown on result cards you share and kept in backups; pool files include it only if you tick it.')]), nick])
      ], 'display'),
      section('Playtest', [
        toggle('Playtest mode', ES.TEST_BUILD ? 'On in this test build: ratings after each set, a Note button on every screen.' : 'Ratings after each set and a Note button on every screen.',
          pt.enabled(), function (on) { setSetting('playtest', on); if (on) pt.mountFloating(); else if (!ES.TEST_BUILD) pt.unmountFloating(); }, { disabled: ES.TEST_BUILD, key: 'playtest' }),
        dbLine(),
        U.el('div', { class: 'row-buttons' }, [ES.ui.button('Copy playtest report', { small: true, attrs: { 'data-copy-report': '' }, onClick: function () { pt.copyReport(); } }),
          ES.ui.button('Show report text', { small: true, kind: 'ghost', onClick: function () { ES.ui.copyBox(pt.reportText(), { title: 'Playtest report', hint: 'Select all and copy, then paste it in the chat.' }); } })])
      ], 'playtest'),
      ES.ui.settingsData ? ES.ui.settingsData.section() : null,
      U.el('p', { class: 'center' }, U.el('a', { href: '#about', class: 'head-link' }, 'About Earshot, licences and credits')),
      ES.ui.w.footer()
    ]));
  }

  ES.ui.settingsParts = { section: section, seg: seg, toggle: toggle, MODES: MODES, LENGTHS: LENGTHS, focusTarget: focusTarget };
  if (!ES.ui.screens.settings) ES.ui.screens.settings = { mount: mount, unmount: function () { if (offSaved) { offSaved(); offSaved = null; } } };
})(window.ES, window);
