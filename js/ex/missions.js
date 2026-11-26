/* Earshot — Missions (CONTRACTS §11, PLAN §6.8): one real-world listening task a week and a 20-second check-in
   (did you try it, how much of the talk you followed 0–10, did the trick help). The week's mission is the same for
   everyone (ISO week), and the player can swap it. Stored in store key `missions` {v, weeks:{'2026-W48':{id, at,
   done, rating, helped, logged, swap}}}; a check-in where the player tried it also goes into the listening diary
   (ES.lab.logEvent, source 'mission'). Screen 'missions' (Home index), ES.ex.missions.homeCard() for Home, and a
   custom view for sets. Every mission comes from the research notes (sources in MISSIONS below). The share line
   carries the Chimera link. No streak, no reminder, nothing lost for a skipped week. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  ES.ex = ES.ex || {};
  function K() { return ES.ex._kit; }
  function U() { return ES.core.util; }
  function el(t, a, c) { return U().el(t, a, c); }

  /* sit / helped: the diary's situation and "what helped" ids (js/lab/screen-diary.js). Sources: R3 §3 (Grange &
     Culling 2016: after instruction everyone turned, ~3 dB; Grange 2018: 1.2–3.2 dB for 30° in a virtual
     restaurant; the turn helps most with noise behind), §10 (−6 dB per doubling; room calibration in ~0.5–3 s,
     5–18 %), §5 (location uncertainty cost 10–40 points; build-up while a voice stays put), §6 (70–90 % of missing
     sounds restored in everyday sentences, [secondary]), §11 (a 30° turn did not impair lip-reading; turn plus
     lip-reading up to 9 dB for CI users, [secondary]), §7 (~10 min of practice; familiar target ~+10 points). */
  var MISSIONS = [
    { id: 'turn30', title: 'Turn about 30°', sit: 'loud', helped: 'turned',
      what: 'In a noisy place, do not face your talker squarely. Turn your head about 30° so one ear points toward them, and keep your eyes on their face.',
      why: 'In lab studies a turn of about 30° improved understanding in noise: after instruction everyone turned and scores rose by about 3 dB, and in a virtual restaurant the turn was worth 1 to 3 dB. Only about half of people turn on their own.' },
    { id: 'noiseback', title: 'Put the noise behind you', sit: 'loud', helped: 'away',
      what: 'When you choose where to sit or stand, put the loudest noise (speakers, the kitchen, the bar) behind you or to one side, with your talker in front.',
      why: 'In the studies behind the 30° turn, the turn helped most when the noise came from behind. Choosing your spot sets that up before anyone speaks.' },
    { id: 'closer', title: 'Close the distance', sit: 'far', helped: 'closer',
      what: 'When a conversation matters in a big or echoey place, step closer or take the seat nearest the talker.',
      why: 'Each halving of the distance gives a voice’s direct sound about 6 dB more against the room’s echo. Two steps closer can matter more than straining to listen.' },
    { id: 'tunein', title: 'Let the room tune you in', sit: 'far', helped: null,
      what: 'In an echoey place (a hall, a station, a big restaurant), listen to a few sentences before you join in or decide you cannot hear.',
      why: 'Listeners adjust to a room within about half a second to three seconds of hearing speech in it, and speech then gets easier to catch: by 5 to 18 % in the studies.' },
    { id: 'lockon', title: 'Lock on to one voice', sit: 'group', helped: null,
      what: 'In a group, pick the voice you most want to follow and stay with it from its first word: its pitch, its pace, where it sits.',
      why: 'Knowing whom and where to listen to is worth a lot: in lab studies, not knowing where the talker would be cost 10 to 40 points, and attention built up while a voice stayed put.' },
    { id: 'repeat', title: 'Ask for the missing piece', sit: 'loud', helped: 'asked',
      what: 'When you miss something, say what you did catch and ask for the gap: “Thursday at what time?” instead of “What?”.',
      why: 'Context repairs lost words: in everyday sentences listeners restored 70 to 90 % of missing sounds. A targeted question keeps the context you heard and fills only the gap. This mission carries the Repair exercise into conversation; the question itself has not been studied.' },
    { id: 'faces', title: 'Watch the face', sit: 'loud', helped: 'face',
      what: 'In noise, keep your eyes on the talker’s face, and combine it with the 30° turn: the turn still leaves the face in view.',
      why: 'In a lab study a 30° head turn did not get in the way of lip-reading, and for cochlear-implant users turning and lip-reading together were reported to improve scores by up to 9 dB.' },
    { id: 'newvoice', title: 'Get to know a voice', sit: 'unusual', helped: null,
      what: 'Before a noisy evening, spend ten quiet minutes talking with the person you will most want to hear there.',
      why: 'In one study about ten minutes of practice with a voice already made it easier to follow against another talker, and a familiar voice raised scores by about 10 points.' }
  ];
  var HELPED = [['yes', 'It helped'], ['unsure', 'Not sure'], ['no', 'It did not']];

  function byId(id) { for (var i = 0; i < MISSIONS.length; i++) if (MISSIONS[i].id === id) return MISSIONS[i]; return null; }
  function weekKey(now) { return U().weekKey(now == null ? Date.now() : now); }
  /** The week's mission: the same for everyone in an ISO week (fixed order), unless the player swapped it. */
  function forWeek(wk) {
    var m = /^(\d{4})-W(\d{1,2})$/.exec(String(wk)), base = m ? (+m[1] * 53 + +m[2]) % MISSIONS.length : 0;
    var rec = weeks()[wk];
    return (rec && byId(rec.id)) || MISSIONS[base];
  }
  function store() { return ES.core.store; }
  function weeks() { var r = store().peek('missions'); return (r && r.weeks) || {}; }
  function current(now) { var wk = weekKey(now); return { week: wk, mission: forWeek(wk), rec: weeks()[wk] || null }; }
  function save(wk, patch) {
    var m = forWeek(wk), prev = weeks()[wk] || {}, rec = {};
    Object.keys(prev).forEach(function (k) { rec[k] = prev[k]; });
    Object.keys(patch).forEach(function (k) { rec[k] = patch[k]; });
    rec.id = rec.id || m.id; rec.at = Date.now();
    var log = rec.done === true && !prev.logged && ES.lab && typeof ES.lab.logEvent === 'function';
    if (log) rec.logged = true;
    var ok = store().update('missions', function (r) { r.weeks = r.weeks || {}; r.weeks[wk] = rec; });
    if (log) {   // into the diary: "how it went" 1–5 from the 0–10 rating; the trick counts as a help only if it helped
      try { ES.lab.logEvent({ sit: m.sit, v: rec.rating == null ? null : 1 + Math.round(rec.rating * 0.4), helped: rec.helped === 'yes' && m.helped ? [m.helped] : [], source: 'mission' }); }
      catch (e) { if (K()) K().report('missions diary', e); }
    }
    return ok;
  }
  function swap(wk) {
    var cur = forWeek(wk), i = MISSIONS.indexOf(cur), prev = weeks()[wk] || {};
    var nx = MISSIONS[(i + 1) % MISSIONS.length];
    store().update('missions', function (r) { r.weeks = r.weeks || {}; r.weeks[wk] = { id: nx.id, at: Date.now(), swap: (prev.swap || 0) + 1 }; });
    return nx;
  }
  function shareText(m, rec) {
    var t = 'My Earshot listening mission this week: ' + m.title + '.';
    if (rec && rec.done) t += ' I tried it' + (rec.rating != null ? ' and followed ' + rec.rating + '/10 of the talk' : '') + '.';
    return t + ' Train your ears with us: https://discord.gg/chmr';
  }
  function summary(rec) {
    if (!rec || rec.done == null) return '';
    if (!rec.done) return 'Not tried this week';
    var h = rec.helped ? { yes: 'it helped', unsure: 'not sure it helped', no: 'it did not help' }[rec.helped] : '';
    return 'Tried it' + (rec.rating != null ? ' · followed ' + rec.rating + ' of 10' : '') + (h ? ' · ' + h : '');
  }

  function css() {
    var doc = root.document;
    if (!doc || !doc.head || doc.getElementById('es-missions-css')) return;
    var st = doc.createElement('style');
    st.id = 'es-missions-css';
    st.textContent = ['.ms-wrap { max-width: 640px; } .ms-why { color: var(--ink-2); font-size: var(--fs-2); line-height: 1.45; }',
      '.ms-q { margin: 14px 0 6px; font-weight: 600; } .ms-row { display: flex; flex-wrap: wrap; gap: 8px; } .ms-row .btn { flex: 1 1 120px; }',
      '.ms-scale { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 6px; }',
      '.ms-key { min-height: 44px; border: 1px solid var(--rule-2); border-radius: var(--r-1); background: var(--surface); color: var(--ink); font: 600 var(--fs-2) var(--mono); cursor: pointer; }',
      '.ms-key[aria-pressed="true"], .ms-pick[aria-pressed="true"] { background: var(--ink); color: var(--on-ink); border-color: var(--ink); }',
      '.ms-ends { display: flex; justify-content: space-between; font-size: var(--fs-1); color: var(--ink-3); margin-top: 4px; }',
      '.ms-past { list-style: none; margin: 8px 0 0; padding: 0; border-top: 1px solid var(--rule); }',
      '.ms-past li { display: flex; justify-content: space-between; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--rule); font-size: var(--fs-1); }',
      '.ms-past .mono { color: var(--ink-3); }'].join('\n');
    doc.head.appendChild(st);
  }

  /** The 20-second check-in. onSaved() runs after the record is written. */
  function checkIn(wk, m, rec, onSaved) {
    var u = U(), st = { done: rec && rec.done != null ? rec.done : null, rating: rec ? rec.rating : null, helped: rec ? rec.helped : null };
    var box = el('div', { class: 'ms-check', 'data-mission-check': '' }), more = el('div', { class: 'ms-more' });
    var saveBtn = ES.ui.button('Save check-in', { kind: 'primary', wide: true, attrs: { 'data-mission-save': '' }, onClick: function () {
      if (!ready()) return;
      save(wk, { done: st.done, rating: st.done ? st.rating : null, helped: st.done ? st.helped : null });
      if (ES.ui.toast) ES.ui.toast(st.done ? 'Checked in. It is in your diary too.' : 'Checked in. A new mission comes next week.');
      onSaved();
    } });
    function ready() { return st.done === false || (st.done === true && st.rating != null); }
    function paint() {
      Array.prototype.forEach.call(box.querySelectorAll('[data-tried]'), function (b) { b.setAttribute('aria-pressed', String(String(st.done) === b.getAttribute('data-tried'))); });
      Array.prototype.forEach.call(box.querySelectorAll('[data-rate]'), function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-rate') === st.rating)); });
      Array.prototype.forEach.call(box.querySelectorAll('[data-helped]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-helped') === st.helped)); });
      more.hidden = st.done !== true;
      saveBtn.disabled = !ready();
    }
    function pick(attr, val, label, cls) {
      var b = el('button', { type: 'button', class: cls || 'btn btn-secondary ms-pick', 'aria-pressed': 'false' }, label);
      b.setAttribute(attr, String(val));
      b.addEventListener('click', function () { if (attr === 'data-tried') st.done = val; else if (attr === 'data-rate') st.rating = val; else st.helped = val; paint(); });
      return b;
    }
    var keys = [];
    for (var i = 0; i <= 10; i++) keys.push(pick('data-rate', i, String(i), 'ms-key'));
    more.appendChild(el('p', { class: 'ms-q', id: 'ms-q-rate' }, 'How much of the talk did you follow?'));
    more.appendChild(el('div', { class: 'ms-scale', role: 'group', 'aria-labelledby': 'ms-q-rate' }, keys));
    more.appendChild(el('div', { class: 'ms-ends', 'aria-hidden': 'true' }, [el('span', null, '0 = nothing'), el('span', null, '10 = all of it')]));
    more.appendChild(el('p', { class: 'ms-q' }, 'Did the trick help?'));
    more.appendChild(el('div', { class: 'ms-row', role: 'group' }, HELPED.map(function (h) { return pick('data-helped', h[0], h[1]); })));
    box.appendChild(el('p', { class: 'ms-q' }, 'Did you try it?'));
    box.appendChild(el('div', { class: 'ms-row', role: 'group' }, [pick('data-tried', true, 'Yes, I tried it'), pick('data-tried', false, 'Not this week')]));
    box.appendChild(more);
    box.appendChild(el('div', { class: 'actions' }, [saveBtn]));
    paint();
    return box;
  }

  /** The mission card: what to do, why, and the check-in (or its summary once saved). */
  function card(onChange, opts) {
    opts = opts || {};
    var c = current(), m = c.mission, rec = c.rec, u = U();
    var sec = el('section', { class: 'card ms-card', 'data-mission': m.id }, [
      el('p', { class: 'eyebrow mono' }, 'This week’s mission · ' + c.week),
      el('h2', { class: 'h-mid' }, m.title),
      el('p', { class: 'lead' }, m.what),
      el('p', { class: 'ms-why' }, [el('strong', null, 'Why: '), m.why])]);
    if (rec && rec.done != null && !opts.edit) {
      sec.appendChild(el('p', { class: 'ms-done', 'data-mission-done': '' }, [ES.ui.glyph ? ES.ui.glyph('right') : null, ' Checked in: ' + summary(rec)]));
      sec.appendChild(el('div', { class: 'ms-row' }, [
        ES.ui.button('Change', { kind: 'ghost', small: true, onClick: function () { onChange({ edit: true }); } }),
        ES.ui.button('Copy a line for the Discord', { kind: 'secondary', small: true, attrs: { 'data-mission-share': '' }, onClick: function () {
          var t = shareText(m, rec);
          if (ES.ui.copyText) ES.ui.copyText(t); else if (ES.ui.copyBox) ES.ui.copyBox(t);
        } })]));
    } else {
      sec.appendChild(el('p', { class: 'hint' }, 'Try it once in a real conversation this week, then check in. It takes about 20 seconds.'));
      sec.appendChild(checkIn(c.week, m, rec, function () { onChange({}); }));
    }
    if (!rec || rec.done == null) {
      sec.appendChild(ES.ui.button('Choose a different mission', { kind: 'ghost', small: true, attrs: { 'data-mission-swap': '' }, onClick: function () { swap(c.week); onChange({}); } }));
    }
    return sec;
  }
  function pastList() {
    var w = weeks(), cur = weekKey(), keys = Object.keys(w).filter(function (k) { return k !== cur && w[k] && w[k].done != null; }).sort().reverse().slice(0, 12);
    if (!keys.length) return null;
    return [el('h2', { class: 'h-small' }, 'Earlier weeks'), el('ul', { class: 'ms-past' }, keys.map(function (k) {
      var m = byId(w[k].id);
      return el('li', null, [el('span', null, [el('span', { class: 'mono' }, k + ' · '), m ? m.title : w[k].id]), el('span', null, summary(w[k]))]);
    }))];
  }

  function mount(root2, params) {
    css();
    var holder = el('div');
    function paint(o) {
      U().clear(holder);
      var nx = MISSIONS[(MISSIONS.indexOf(forWeek(weekKey())) + 1) % MISSIONS.length];
      holder.appendChild(card(paint, o));
      holder.appendChild(el('p', { class: 'hint' }, 'Next week’s mission, if you keep this one: ' + nx.title + '. Everyone gets the same mission each week, so you can compare notes.'));
      var past = pastList();
      if (past) past.forEach(function (n) { holder.appendChild(n); });
      if (ES.ui.screens && ES.ui.screens.diary) holder.appendChild(el('p', null, [el('a', { href: '#diary', 'data-go': 'diary' }, 'Your listening diary'), ' collects your check-ins and other listening moments.']));
    }
    paint(params || {});
    root2.appendChild(el('div', { class: 'wrap ms-wrap' }, [ES.ui.w.header({ back: true, title: 'Missions' }),
      el('p', { class: 'eyebrow mono' }, 'Missions'),
      el('h1', { class: 'h-big' }, 'One listening task a week'),
      el('p', { class: 'lead' }, 'The exercises train your ear. Missions take one trick from them into a real conversation, then ask how it went.'),
      holder, ES.ui.w.footer()]));
  }

  var M = {
    id: 'missions', name: 'Missions',
    short: 'One real-world listening task a week, with a 20-second check-in.',
    card: { trains: 'One small real-world listening task a week — where to stand, how to turn, what to ask — and a 20-second check-in afterwards.',
      bet: 'explicit bridging to real conversations' },
    bet: 'Explicit bridging: taking one trick from training into a real conversation each week, and noticing whether it helped.',
    betNew: false, view: 'custom', feedback: 'standard', strategies: [],
    tips: ['Pick one real conversation this week and use the trick there once. That is enough for the check-in.',
      'A check-in where it did not help is just as useful: it tells you which tricks suit the places you go.',
      'Your check-ins land in your listening diary, next to the Lab’s weekly measures.'],
    helpData: function () {
      return { goal: 'Each week brings one small listening task for real life: where to stand, how to turn, what to ask. Try it once, then check in: did you try it, how much did you follow, did it help.',
        dials: {}, why: 'Training in the app and listening in real life are far apart, and earlier trainers rarely moved everyday listening. Missions bridge the gap on purpose: each one names a trick, says why it should help, and asks you to try it where it counts.' };
    },
    tutorial: { steps: [
      { kind: 'caption', minMs: 3000, then: 'tap', text: 'Each week brings one small listening task for real life: where to stand, how to turn, what to ask.' },
      { kind: 'caption', minMs: 3000, then: 'tap', text: 'Try it once in a real conversation, then check in: did you try it, how much did you follow, did it help. About 20 seconds.' }
    ] },
    list: MISSIONS, current: current, forWeek: forWeek, save: save, swap: swap, shareText: shareText,
    helpBody: function (el2) { return K().helpBody(M, el2); },
    openHelp: function (opts) { return K().openHelp(M, opts); },
    /** Home card: this week's mission and whether you checked in (between sets only; static). */
    homeCard: function () {
      try {
        var c = current(), done = c.rec && c.rec.done != null;
        return el('section', { class: 'card ms-home', 'data-mission-card': '' }, [el('p', { class: 'eyebrow mono' }, 'Mission this week'),
          el('h2', { class: 'h-small' }, c.mission.title),
          el('p', { class: 'hint' }, done ? 'Checked in: ' + summary(c.rec) + '.' : 'Try it once this week, then check in (20 seconds).'),
          el('a', { href: '#missions', 'data-go': 'missions', class: 'ms-home-link' }, done ? 'See the mission' : 'Open the mission')]);
      } catch (e) { return null; }
    },
    /** In a set (if a plan ever schedules Missions): the card and its check-in, then the set ends. */
    custom: function (host, api) {
      css();
      var wrap = el('div', { class: 'wrap ms-wrap ms-inset' });
      function paint(o) {
        U().clear(wrap);
        wrap.appendChild(card(paint, o));
        wrap.appendChild(el('div', { class: 'actions' }, [ES.ui.button('Done', { kind: 'primary', attrs: { 'data-mission-end': '' }, onClick: function () { if (api && api.done) api.done({ ex: 'missions', n: 0, correct: 0 }); } })]));
      }
      paint({});
      host.appendChild(wrap);
      return { pause: function () {}, resume: function () {}, abort: function () {}, state: function () { return 'answer'; } };
    }
  };
  Object.defineProperty(M, 'venues', { enumerable: true, get: function () { return []; } });

  if (ES.ui && ES.ui.screens && !ES.ui.screens.missions) ES.ui.screens.missions = { mount: mount, unmount: function () {} };
  ES.ex.missions = M;
})(typeof window !== 'undefined' ? window : globalThis);
