/* ES.lab.schedule(state) → {phase, baseline, due, next, extra, todayDone} (CONTRACTS §11; PLAN §8). Pure.
   Baseline: after the first training session, one block a day (≈ 6–9 min) over five blocks: every probe's first run
   is a practice run; the core probes (Matrix, Digits, Two voices) then get two measured runs, the others one.
   Weekly check-in (≈ 8–9 min) once ≥ 6.5 days have passed since the last one: Matrix and Two voices every week, one
   rotating probe (Digits → Rooms → New voice → Story) and the Diary. After 14 days or more away, the next check-in
   is a retention check. Nothing here ever blocks training: due items are suggestions, reminders carry no penalty.
   state = {runs:[lab runs], diary:{entries}, sessions:[log sessions], now, dayKey(ms), weekKey(ms), available(id),
            trend(id)?} — dayKey/weekKey default to UTC keys when absent (Node tests pass their own). MIT licence. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var L = ES.lab = ES.lab || {};
  var DAY = 864e5;
  var BLOCKS = [
    [['matrix', 1], ['digits', 1]],
    [['matrix', 2], ['digits', 2], ['twovoices', 1]],
    [['matrix', 3], ['digits', 3], ['twovoices', 2]],
    [['twovoices', 3], ['rooms', 1], ['newvoice', 1]],
    [['rooms', 2], ['newvoice', 2], ['story', 1], ['diary', 1]]
  ];
  var ROTATION = ['digits', 'rooms', 'newvoice', 'story'];
  var EVERY_WEEK = ['matrix', 'twovoices'];

  function utcDay(ms) { return new Date(ms).toISOString().slice(0, 10); }
  function utcWeek(ms) { var d = new Date(ms), t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); return 'w' + Math.floor((t / DAY + 3) / 7); }
  function minutes(id) { var p = L.probes && L.probes[id]; return p ? p.minutes : 2; }
  function roleOf(k) { return k <= 1 ? 'practice' : 'measured'; }

  function schedule(state) {
    var st = state || {}, now = st.now || Date.now(), dayKey = st.dayKey || utcDay, weekKey = st.weekKey || utcWeek;
    var avail = st.available || function (id) { var p = L.probes && L.probes[id]; return !!(p && p.available().ok); };
    var runs = (st.runs || []).filter(function (r) { return r && !r.aborted && r.probe; });
    var diary = ((st.diary && st.diary.entries) || []).filter(function (e) { return e && e.at; });
    var sessions = (st.sessions || []).filter(function (s) { return s && !s.demo && (s.activeMs || 0) > 0; });
    var count = {}, today = dayKey(now);
    runs.forEach(function (r) { count[r.probe] = (count[r.probe] || 0) + 1; });
    count.diary = Math.max(count.diary || 0, diary.length);
    var out = { phase: 'start', baseline: null, due: null, next: null, extra: [], todayDone: false };

    // ---- baseline progress (unavailable probes are left out until their materials arrive)
    var steps = [], doneN = 0, total = 0, firstOpen = -1;
    BLOCKS.forEach(function (b, bi) {
      b.forEach(function (s) {
        var ok = avail(s[0]), done = (count[s[0]] || 0) >= s[1];
        steps.push({ probe: s[0], k: s[1], role: s[0] === 'diary' ? 'measured' : roleOf(s[1]), block: bi, done: done, available: ok });
        if (!ok) return;
        total++; if (done) doneN++;
        else if (firstOpen < 0) firstOpen = bi;
      });
    });
    var baselineRuns = runs.filter(function (r) { return r.kind === 'baseline'; });
    var blockToday = baselineRuns.some(function (r) { return dayKey(r.at) === today; });
    out.baseline = { done: doneN, total: total, complete: total > 0 && doneN >= total, steps: steps, block: firstOpen, blocks: BLOCKS.length };
    out.todayDone = blockToday;

    if (!sessions.length && !runs.length) {
      out.next = { kind: 'baseline', text: 'Your baseline starts after your first training session: one short block a day, five blocks in all.' };
      return out;
    }
    if (!out.baseline.complete) {
      out.phase = 'baseline';
      if (blockToday) {
        out.next = { kind: 'baseline', inDays: 1, text: 'Today’s baseline block is done. The next one opens tomorrow (any later day works too).' };
        return out;
      }
      var items = steps.filter(function (s) { return s.block === firstOpen && !s.done && s.available; }).map(function (s) {
        return { probe: s.probe, role: s.role, minutes: minutes(s.probe) };
      });
      out.due = { kind: 'baseline', title: 'Baseline block ' + (firstOpen + 1) + ' of ' + BLOCKS.length, items: items,
        minutes: items.reduce(function (a, it) { return a + it.minutes; }, 0),
        note: items.some(function (it) { return it.role === 'practice'; }) ? 'First runs are practice: they teach the task and do not count.' : 'These runs set your baseline.' };
      return out;
    }

    // ---- weekly check-ins
    out.phase = 'weekly';
    var weekly = runs.filter(function (r) { return r.kind === 'weekly' || r.kind === 'retention'; });
    var lastBase = Math.max.apply(null, baselineRuns.map(function (r) { return r.at; }).concat([0]));
    var lastCheck = Math.max.apply(null, weekly.map(function (r) { return r.at; }).concat([lastBase]));
    var lastActive = Math.max.apply(null, sessions.map(function (s) { return s.end || s.start || 0; }).concat(runs.map(function (r) { return r.at; })));
    var nWeeks = {}; weekly.forEach(function (r) { nWeeks[dayKey(r.at)] = 1; });
    var wIndex = Object.keys(nWeeks).length, checkToday = weekly.some(function (r) { return dayKey(r.at) === today; });
    var since = (now - lastCheck) / DAY;
    out.todayDone = checkToday || blockToday;
    if (since >= 6.5 && !checkToday) {
      var list = EVERY_WEEK.slice();
      for (var j = 0; j < ROTATION.length; j++) { var cand = ROTATION[(wIndex + j) % ROTATION.length]; if (avail(cand)) { list.push(cand); break; } }
      var thisWeek = weekKey(now), diaryDone = diary.some(function (e) { return e.week === thisWeek || weekKey(e.at) === thisWeek; });
      if (!diaryDone) list.push('diary');
      var its = list.filter(avail).map(function (id) { return { probe: id, role: (count[id] || 0) ? 'measured' : 'practice', minutes: minutes(id) }; });
      var away = (now - lastActive) / DAY >= 14 || since >= 21;
      out.due = { kind: away ? 'retention' : 'weekly', title: away ? 'Welcome back: a retention check' : 'Weekly check-in ' + (wIndex + 1),
        items: its, minutes: its.reduce(function (a, it) { return a + it.minutes; }, 0),
        note: away ? 'A check after a break shows how much of your gain held. There is nothing to catch up on.' : 'Same voices you never train with, new sentences every time.' };
      return out;
    }
    var inDays = Math.max(1, Math.ceil(6.5 - since));
    out.next = { kind: 'weekly', inDays: inDays, text: checkToday ? 'This week’s check-in is done. The next one opens in ' + inDays + ' days; any day after that works.'
      : 'Next check-in opens in ' + inDays + (inDays === 1 ? ' day' : ' days') + '; any day after that works.' };
    // a second Matrix run sharpens a trend that is not clear yet (optional, once per day)
    if (checkToday && typeof st.trend === 'function') {
      var tr = st.trend('matrix'), mToday = runs.filter(function (r) { return r.probe === 'matrix' && dayKey(r.at) === today; }).length;
      if (tr && tr.ok && tr.verdict !== 'clear' && mToday < 2 && avail('matrix')) {
        out.extra.push({ probe: 'matrix', role: 'measured', minutes: minutes('matrix'), why: 'One more Matrix run today narrows the interval of your trend.' });
      }
    }
    return out;
  }

  L.schedule = schedule;
  L.schedule.BLOCKS = BLOCKS;
  L.schedule.ROTATION = ROTATION;
  L.schedule.EVERY_WEEK = EVERY_WEEK;
})(typeof window !== 'undefined' ? window : globalThis);
