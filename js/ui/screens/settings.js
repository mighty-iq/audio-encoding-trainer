/* Screen 'settings' — mode (with when each is right), session length, sound (volume setup, headphones),
   theme, nickname, playtest, and the data section (js/ui/screens/settings-data.js). */
(function (ES, win) {
  'use strict';
  var U = ES.core.util;
  var MODES = [
    ['edge', 'Edge', 'Keeps every dial at the edge of what you can hear. No setup.', 'Right for almost everyone; it is the default.'],
    ['path', 'Path', 'Venues in order: one condition at a time, then mixed.', 'Right for beginners, for clear goals, or when mixing feels confusing.'],
    ['variety', 'Variety', 'A new talker, room or voice type on every trial.', 'Right after a plateau, or when you already do well and want breadth.'],
    ['focus', 'Focus', 'Spends 60 % of the time on your hardest situation.', 'Right when one situation bothers you most.'],
    ['free', 'Free', 'Pick any exercise and dial yourself; a coach suggests settings.', 'Right when you want to explore.']
  ];
  var LENGTHS = [10, 15, 20, 30];

  function prof() { return ES.core.store.peek('profile'); }
  function setSetting(k, v) { ES.core.store.update('profile', function (r) { r.settings = r.settings || {}; r.settings[k] = v; }); }
  function applyTheme() { if (ES.app && ES.app.applyTheme) ES.app.applyTheme(); }
  function section(title, children, id) {
    return U.el('section', { class: 'set-sec', 'aria-labelledby': 'sec-' + id }, [U.el('h2', { class: 'h-small', id: 'sec-' + id }, title)].concat(children));
  }
  function seg(name, items, value, onPick) {
    var box = U.el('div', { class: 'seg', role: 'radiogroup', 'aria-label': name });
    items.forEach(function (it) {
      var b = U.el('button', { type: 'button', role: 'radio', class: 'seg-btn', 'aria-checked': String(it[0] === value), 'data-value': String(it[0]),
        on: { click: function () {
          Array.prototype.forEach.call(box.children, function (c) { c.setAttribute('aria-checked', String(c === b)); });
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
      input.addEventListener('change', function () { if (input.checked) setSetting('mode', m[0]); });
      list.appendChild(U.el('label', { class: 'mode', for: id }, [input, U.el('span', { class: 'mode-text' }, [
        U.el('strong', null, m[1] + (m[0] === 'edge' ? ' · default' : '')), U.el('span', null, m[2]), U.el('span', { class: 'hint' }, m[3])])]));
    });
    return [list, engine ? null : U.el('p', { class: 'hint' }, 'Modes take effect once the training engine is installed; the demo ignores them.')];
  }
  function headphones(s) {
    var status = s.hpCheck && s.hpCheck.result === 'pass' ? 'Checked: headphones detected.' : s.hpCheck && s.hpCheck.result === 'manual' ? 'You said you wear headphones (check skipped).' : 'Not checked yet.';
    var line = U.el('p', { class: 'hint', 'data-hp-status': '' }, status);
    return [
      U.el('div', { class: 'row' }, [U.el('span', { class: 'row-text' }, [U.el('strong', null, 'Headphone check'), line]),
        ES.ui.button('Check', { small: true, onClick: function () {
          if (ES.audio && ES.audio.hpcheck && typeof ES.audio.hpcheck.open === 'function') { ES.audio.hpcheck.open(); return; }
          ES.ui.sheet({ title: 'Headphone check', body: 'A short left-right test arrives with the audio build. Everything except the 3D-direction dials works on a phone speaker; those dials wait for headphones.', actions: [{ label: 'OK', kind: 'primary' }] });
        } })]),
      toggle('I am wearing headphones', 'Skips the check and unlocks the direction dials; turn it off when you use a speaker.', !!s.headphones, function (on) {
        ES.core.store.update('profile', function (r) { r.settings.headphones = on; r.settings.hpCheck = on ? { at: Date.now(), result: 'manual' } : null; });
        line.textContent = on ? 'You said you wear headphones (check skipped).' : 'Not checked yet.';
      }, { key: 'headphones' })
    ];
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
          U.el('span', { class: 'hint' }, s.volumeSet ? 'Set on ' + U.dayKey(s.volumeSet) + '. Every trial plays at this level.' : 'Not set yet. Takes 20 seconds.')]),
          ES.ui.button('Set level', { small: true, go: 'volume' })])
      ].concat(headphones(s)), 'sound'),
      section('Display', [
        U.el('div', { class: 'row' }, [U.el('span', { class: 'row-text' }, [U.el('strong', null, 'Theme')]),
          seg('Theme', [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']], s.theme || 'system', function (v) { setSetting('theme', v); applyTheme(); })]),
        U.el('div', { class: 'row' }, [U.el('span', { class: 'row-text' }, [U.el('strong', null, 'Nickname'), U.el('span', { class: 'hint' }, 'Shown only on result cards you choose to share.')]), nick])
      ], 'display'),
      section('Playtest', [
        toggle('Playtest mode', ES.TEST_BUILD ? 'On in this test build: ratings after each set, a Note button on every screen.' : 'Ratings after each set and a Note button on every screen.',
          pt.enabled(), function (on) { setSetting('playtest', on); if (on) pt.mountFloating(); else if (!ES.TEST_BUILD) pt.unmountFloating(); }, { disabled: ES.TEST_BUILD, key: 'playtest' }),
        U.el('div', { class: 'row-buttons' }, [ES.ui.button('Copy playtest report', { small: true, attrs: { 'data-copy-report': '' }, onClick: function () { pt.copyReport(); } }),
          ES.ui.button('Show report text', { small: true, kind: 'ghost', onClick: function () { ES.ui.copyBox(pt.reportText(), { title: 'Playtest report', hint: 'Select all and copy, then paste it in the chat.' }); } })])
      ], 'playtest'),
      ES.ui.settingsData ? ES.ui.settingsData.section() : null,
      U.el('p', { class: 'center' }, U.el('a', { href: '#about', class: 'head-link' }, 'About Earshot, licences and credits')),
      ES.ui.w.footer()
    ]));
  }

  ES.ui.settingsParts = { section: section, seg: seg, toggle: toggle, MODES: MODES, LENGTHS: LENGTHS };
  if (!ES.ui.screens.settings) ES.ui.screens.settings = { mount: mount, unmount: function () {} };
})(window.ES, window);
