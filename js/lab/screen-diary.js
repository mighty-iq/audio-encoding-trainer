/* Screen 'diary' — the listening diary (PLAN §8: far, real life). The weekly five items are filled in through the
   probe runner (also part of each check-in); here: this week's state, past weeks, and event check-ins ("log a
   listening moment": the situation, how it went from 1 to 5, what helped). Missions (exB) may feed events with
   source 'mission'. Items are original wording, not taken from any questionnaire. Stored in store key `diary`.
   MIT licence. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var L = ES.lab = ES.lab || {};
  function U() { return ES.core.util; }
  var SITS = [['loud', 'Loud place'], ['far', 'Far away or echoey'], ['unusual', 'Unfamiliar voice'], ['phone', 'Phone or video call'], ['group', 'Group talk'], ['other', 'Something else']];
  var HELPED = [['closer', 'Moved closer'], ['turned', 'Turned toward the talker'], ['face', 'Watched the face'], ['asked', 'Asked for a specific repeat'],
    ['away', 'Moved away from the noise'], ['nothing', 'Nothing helped']];
  L.diaryOptions = { situations: SITS, helped: HELPED };

  /** Add an event check-in (also used by Missions). Returns true when saved. */
  L.logEvent = function (ev) {
    var e = { id: U().uid('ev'), at: Date.now(), sit: String(ev.sit || 'other'), v: ev.v >= 1 && ev.v <= 5 ? +ev.v : null,
      helped: (ev.helped || []).map(String).slice(0, 6), source: ev.source || 'diary' };
    return ES.core.store.update('diary', function (d) { d.events = (d.events || []).concat([e]); });
  };

  function eventForm(onSaved) {
    var u = U(), sit = null, v = null, helped = [];
    var sitBox = u.el('div', { class: 'lab-chips', role: 'group', 'aria-label': 'Situation' }), helpBox = u.el('div', { class: 'lab-chips', role: 'group', 'aria-label': 'What helped' });
    var save = ES.ui.button('Save this moment', { kind: 'primary', attrs: { 'data-lab-event-save': '' }, disabled: true, onClick: function () {
      if (!sit || !v) return;
      L.logEvent({ sit: sit, v: v, helped: helped });
      ES.ui.toast('Saved in your diary');
      onSaved();
    } });
    function paint() { save.disabled = !(sit && v); }
    SITS.forEach(function (s) {
      var b = u.el('button', { type: 'button', class: 'lab-key', 'aria-pressed': 'false', 'data-lab-sit': s[0] }, s[1]);
      b.addEventListener('click', function () { sit = s[0]; Array.prototype.forEach.call(sitBox.children, function (c) { c.setAttribute('aria-pressed', String(c === b)); }); paint(); });
      sitBox.appendChild(b);
    });
    HELPED.forEach(function (s) {
      var b = u.el('button', { type: 'button', class: 'lab-key', 'aria-pressed': 'false', 'data-lab-helped': s[0] }, s[1]);
      b.addEventListener('click', function () {
        var i = helped.indexOf(s[0]); if (i >= 0) helped.splice(i, 1); else helped.push(s[0]);
        b.setAttribute('aria-pressed', String(helped.indexOf(s[0]) >= 0));
      });
      helpBox.appendChild(b);
    });
    var sc = L.ui.scale(function (r) { v = r.v; paint(); }, { lo: 'very hard', hi: 'very easy' });
    sc.enable();
    // the scale sends once; let it be changed until saved
    sc.el.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-scale]');
      if (!t) return;
      v = +t.getAttribute('data-scale') || v;
      Array.prototype.forEach.call(sc.el.querySelectorAll('[data-scale]'), function (k) { k.disabled = false; k.setAttribute('aria-checked', String(k === t)); });
      paint();
    });
    return u.el('section', { class: 'card lab-sec', 'data-lab-event-form': '' }, [u.el('h2', { class: 'h-small' }, 'Log a listening moment'),
      u.el('p', { class: 'hint' }, 'Just had a hard (or easy) moment? Twenty seconds: where, how it went, what helped.'),
      sitBox, u.el('p', { class: 'hint' }, 'How did it go?'), sc.el, u.el('p', { class: 'hint' }, 'What helped? (any)'), helpBox, save]);
  }

  function mount(rootEl) {
    L.ui.css();
    var u = U(), d = ES.core.store.peek('diary'), entries = (d.entries || []).slice().sort(function (a, b) { return b.at - a.at; });
    var events = (d.events || []).slice().sort(function (a, b) { return b.at - a.at; }).slice(0, 12), wk = u.weekKey();
    var thisWeek = entries.filter(function (e) { return e.week === wk; })[0];
    var name = {}; L.probes.diary.items.forEach(function (it) { name[it.id] = it.text; });
    var sitName = {}; SITS.forEach(function (s) { sitName[s[0]] = s[1]; });
    var helpName = {}; HELPED.forEach(function (s) { helpName[s[0]] = s[1]; });
    rootEl.appendChild(u.el('div', { class: 'wrap narrow lab', 'data-lab-screen': 'diary' }, [
      ES.ui.w.header({ back: true, title: 'Diary' }),
      u.el('h1', { class: 'h-mid' }, 'Listening diary'),
      u.el('p', { class: 'lead' }, 'Five quick questions a week about real listening, plus moments you choose to log. It is the far end of the Lab: everyday life.'),
      u.el('section', { class: 'card lab-sec' }, [u.el('h2', { class: 'h-small' }, 'This week'),
        u.el('p', null, thisWeek ? 'Answered. You can answer again to replace it.' : 'Not answered yet.'),
        ES.ui.button(thisWeek ? 'Answer again' : 'Answer this week’s five', { kind: 'primary', attrs: { 'data-lab-diary-week': '' }, onClick: function () { L.runner.start([{ probe: 'diary' }], 'weekly'); } })]),
      eventForm(function () { ES.core.router.refresh(); }),
      events.length ? u.el('section', { class: 'lab-sec' }, [u.el('h2', { class: 'h-small' }, 'Recent moments'), u.el('ul', { class: 'lab-events' }, events.map(function (e) {
        return u.el('li', null, [u.el('strong', null, sitName[e.sit] || e.sit), ' · ' + (e.v ? e.v + ' of 5' : '–') + (e.helped && e.helped.length ? ' · ' + e.helped.map(function (h) { return helpName[h] || h; }).join(', ') : ''),
          u.el('span', { class: 'hint' }, ' · ' + new Date(e.at).toLocaleDateString())]);
      }))]) : null,
      entries.length ? u.el('section', { class: 'lab-sec' }, [u.el('h2', { class: 'h-small' }, 'Past weeks'),
        u.el('table', { class: 'lab-table' }, [u.el('thead', null, u.el('tr', null, [u.el('th', { scope: 'col' }, 'Week')].concat(L.probes.diary.items.map(function (it) {
          return u.el('th', { scope: 'col', title: it.text }, it.id); })))),
          u.el('tbody', null, entries.map(function (e) {
            var by = {}; (e.items || []).forEach(function (it) { if (it && it.id) by[it.id] = it.v; });
            return u.el('tr', null, [u.el('td', { class: 'num' }, e.week)].concat(L.probes.diary.items.map(function (it) { return u.el('td', { class: 'num' }, by[it.id] ? String(by[it.id]) : '–'); })));
          }))]),
        u.el('p', { class: 'hint' }, '1 very hard · 5 very easy · – did not happen. Columns: ' + L.probes.diary.items.map(function (it) { return it.id + ' = ' + name[it.id]; }).join(' '))]) : null,
      ES.ui.w.footer()
    ]));
  }
  ES.ui.screens.diary = { mount: mount, unmount: function () {} };
})(typeof window !== 'undefined' ? window : globalThis);
