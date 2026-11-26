/* Screen 'lab' — the Lab overview (CONTRACTS §11; PLAN §8): what is due (a baseline block or the weekly check-in,
   never required, never blocking training), the headphone check, Focus mode's target, one card per probe (latest
   result, a trend sparkline, the verdict and its margin; the card opens the report), and the data tools (export,
   import, diary). Every number shown comes from ES.lab.records / ES.lab.stats. MIT licence. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var L = ES.lab = ES.lab || {};
  var W = L.ui = L.ui || {};
  function U() { return ES.core.util; }
  function R() { return L.records; }

  /** The verdict chip: ✓ for a clear gain, ! for below baseline, text always. */
  W.verdictChip = function (tr) {
    var u = U(), v = tr && tr.verdict || 'none', txt = L.stats.VERDICT_TEXT[v] || v;
    var g = v === 'clear' ? ES.ui.glyph('right') : v === 'lower' ? u.el('span', { 'aria-hidden': 'true' }, '!') : null;
    return u.el('span', { class: 'lab-verdict is-' + v, 'data-verdict': v }, [g, txt]);
  };
  W.gainLine = function (id, tr) {
    if (!tr || !tr.ok) return '';
    var X = L.exporter, sign = tr.gain >= 0 ? 'better' : 'worse';
    return X.showGain(id, tr.gain) + ' ' + sign + ' · 90\u00a0% interval ' + signed(id, tr.lo90) + ' to ' + signed(id, tr.hi90);
  };
  function signed(id, g) {
    var X = L.exporter, s = X.showGain(id, g);
    if (id === 'rooms') return s.replace(' the distance', '');
    return (g < 0 ? '−' : g > 0 ? '+' : '') + s;
  }
  function baselineText(sum, id) {
    var p = L.probes[id], s = sum[id], need = p.core ? 3 : 2;
    if (id === 'diary') return s.n ? U().plural(s.n, 'week') + ' answered' : 'Five questions a week';
    if (!s.n) return p.short.split(',')[0].replace(/\.$/, '');
    if (s.n < need) return 'Baseline: ' + s.n + ' of ' + need + ' runs';
    return 'Next check-in adds to the trend';
  }

  function card(sum, id) {
    var u = U(), p = L.probes[id], s = sum[id], av = p.available(), meas = s.runs.filter(function (r) { return !r.practice; });
    var last = meas[meas.length - 1] || null;
    var val = last ? L.exporter.showValue(id, last.est.m) : '–';
    var a = u.el('a', { href: '#report', class: 'lab-card', 'data-go': 'report', 'data-params': JSON.stringify({ probe: id }), 'data-lab-card': id,
      'aria-disabled': av.ok ? null : 'true' }, [
      u.el('span', { class: 'lab-card-head' }, [u.el('span', { class: 'lab-card-name' }, p.name), u.el('span', { class: 'lab-dist' }, p.distance)]),
      u.el('span', { class: 'lab-card-val' }, [val, u.el('small', null, last ? (s.trend.ok ? 'latest' : 'latest run') : av.ok ? p.minutes + ' min' : 'later')]),
      s.runs.length ? L.charts.trend({ id: id, runs: s.runs, trend: s.trend }, { compact: true }).el : null,
      u.el('span', { class: 'lab-card-foot' }, av.ok ? [W.verdictChip(s.trend), u.el('span', null, s.trend.ok ? W.gainLine(id, s.trend) : baselineText(sum, id))]
        : [u.el('span', { class: 'chip' }, 'later build'), u.el('span', null, av.why)])
    ]);
    return a;
  }
  function dueCard(sch) {
    var u = U(), d = sch.due;
    if (!d) {
      var extra = sch.extra && sch.extra[0];
      return u.el('section', { class: 'card lab-next', 'data-lab-due': 'none' }, [
        u.el('p', { class: 'eyebrow mono' }, sch.phase === 'waiting' ? 'Check-ins' : sch.phase === 'start' || sch.phase === 'baseline' ? 'Baseline' : 'Weekly check-ins'),
        u.el('p', null, sch.next ? sch.next.text : 'Nothing is due.'),
        extra ? u.el('p', { class: 'hint' }, extra.why) : null,
        extra ? ES.ui.button('One more ' + L.probes[extra.probe].name + ' run · ' + extra.minutes + ' min', { attrs: { 'data-lab-extra': extra.probe }, onClick: function () { L.runner.start([{ probe: extra.probe }], 'extra'); } }) : null
      ]);
    }
    return u.el('section', { class: 'card lab-due', 'data-lab-due': d.kind }, [
      u.el('p', { class: 'eyebrow mono' }, d.title + ' · about ' + Math.round(d.minutes) + ' min'),
      u.el('ul', { class: 'lab-items' }, d.items.map(function (it) {
        var p = L.probes[it.probe];
        return u.el('li', { 'data-lab-due-item': it.probe + (it.second ? ':2' : '') }, [u.el('span', { class: 'lab-item-name' }, p.name),
          u.el('span', { class: 'lab-item-meta' }, (it.role === 'practice' ? 'practice · ' : it.second ? 'second run · ' : '') + p.minutes + ' min')]);
      })),
      u.el('p', { class: 'hint' }, d.note + ' Best after a training session; it never holds training back.'),
      ES.ui.button('Start check-in', { kind: 'primary', wide: true, attrs: { 'data-lab-start-block': '' }, onClick: function () {
        if (ES.ui.sound && ES.ui.sound.unlock) { try { ES.ui.sound.unlock(); } catch (e) { /* ignore */ } }
        L.runner.start(d.items, d.kind);
      } })
    ]);
  }
  function focusRow() {
    var u = U(), c = L.context(), pick = R().focus();
    var text = c.weakest ? L.probes[c.weakest].name + (pick ? ' (your pick)' : ' (lowest against provisional references)') : 'Chosen once a check-in has measured runs.';
    return u.el('div', { class: 'lab-row' }, [u.el('span', { class: 'row-text' }, [u.el('strong', null, 'Focus mode aims at'), u.el('span', { class: 'hint', 'data-lab-focus': '' }, text)]),
      ES.ui.button('Choose', { small: true, attrs: { 'data-lab-focus-choose': '' }, onClick: chooseFocus })]);
  }
  function chooseFocus() {
    var u = U(), cur = R().focus();
    var opts = [{ id: '', label: 'Automatic: the check-in furthest below its provisional reference' }].concat(L.probeOrder.filter(function (id) { return id !== 'diary'; }).map(function (id) {
      return { id: id, label: L.probes[id].name + ' — ' + L.probes[id].short };
    }));
    ES.ui.sheet({ title: 'Which situation bothers you most?', body: function (b) {
      b.appendChild(u.el('p', { class: 'hint' }, 'Focus mode spends 60\u00a0% of training on the exercise behind this check-in. The references are provisional, not norms.'));
      opts.forEach(function (o) {
        var inp = u.el('input', { type: 'radio', name: 'lab-focus', value: o.id, 'data-lab-focus-opt': o.id || 'auto' });
        inp.checked = (cur || '') === o.id;
        inp.addEventListener('change', function () { if (inp.checked) { R().setFocus(o.id || null); ES.ui.toast('Focus saved'); } });
        b.appendChild(u.el('label', { class: 'lab-check' }, [inp, o.label]));
      });
    }, actions: [{ label: 'Done', kind: 'primary' }], onClose: function () { ES.core.router.refresh(); } });
  }

  function mount(rootEl) {
    L.ui.css();
    var u = U(), sum = R().summary(), sch = L.schedule(R().state());
    var hpLine = u.el('span', { class: 'hint', 'data-lab-hp': '' }, L.hpcheck.status());
    rootEl.appendChild(u.el('div', { class: 'wrap lab', 'data-lab-screen': 'overview' }, [
      ES.ui.w.header({ back: true, title: 'Lab' }),
      u.el('div', { class: 'lab-intro' }, [
        u.el('p', { class: 'eyebrow mono' }, 'Lab · untrained check-ins'),
        u.el('h1', { class: 'h-mid' }, 'What carries over'),
        u.el('p', { class: 'lead' }, 'Short check-ins with voices, rooms and formats you never train with. Each shows your trend against your own baseline, with an honest margin.')
      ]),
      dueCard(sch),
      sch.baseline && sch.baseline.total && sch.phase !== 'waiting' ? u.el('p', { class: 'facts mono' }, 'Baseline ' + sch.baseline.done + ' of ' + sch.baseline.total + ' runs') : null,
      u.el('div', { class: 'lab-row' }, [u.el('span', { class: 'row-text' }, [u.el('strong', null, 'Headphone check'), hpLine]),
        ES.ui.button('Check', { small: true, attrs: { 'data-lab-hpcheck': '' }, onClick: function () { L.hpcheck.open({ onClose: function () { hpLine.textContent = L.hpcheck.status(); } }); } })]),
      focusRow(),
      u.el('section', { class: 'lab-sec', 'aria-labelledby': 'lab-trends' }, [u.el('h2', { class: 'h-small', id: 'lab-trends' }, 'Your check-ins'),
        u.el('div', { class: 'lab-grid' }, L.probeOrder.map(function (id) { return card(sum, id); }))]),
      u.el('section', { class: 'lab-sec', 'aria-labelledby': 'lab-data' }, [u.el('h2', { class: 'h-small', id: 'lab-data' }, 'Your data'),
        u.el('div', { class: 'row-buttons' }, [
          ES.ui.button('Export…', { small: true, attrs: { 'data-lab-export-open': '' }, onClick: function () { L.exportUi.open(); } }),
          ES.ui.button('Import…', { small: true, attrs: { 'data-lab-import-open': '' }, onClick: function () { L.exportUi.importSheet(function () { ES.core.router.refresh(); }); } }),
          ES.ui.button('Diary', { small: true, go: 'diary' })]),
        u.el('p', { class: 'hint' }, 'Everything stays on this device. In-app numbers compare you with your own baseline: they are not clinical measures and are not normed.')]),
      ES.ui.w.footer()
    ]));
  }
  ES.ui.screens.lab = { mount: mount, unmount: function () {} };

  /** For the shell's Home (request): a card when a check-in is due, else null. Never blocks Start. */
  L.homeCard = function () {
    try {
      var sch = L.schedule(R().state()), d = sch.due, u = U();
      if (!d) return null;
      return u.el('section', { class: 'card', 'data-lab-home': d.kind }, [u.el('p', { class: 'eyebrow mono' }, 'Lab'),
        u.el('h2', { class: 'h-small' }, d.title), u.el('p', { class: 'hint' }, 'About ' + Math.round(d.minutes) + ' minutes, any time after training. Nothing is lost by waiting.'),
        ES.ui.button('Open the Lab', { small: true, go: 'lab' })]);
    } catch (e) { return null; }
  };
  /** For the session-done screen (hook results:done when the shell adds it). */
  L.afterSession = function (el) { var c = L.homeCard(); if (c && el) el.appendChild(c); return !!c; };
  if (ES.hooks && ES.hooks.on) ES.hooks.on('results:done', function (p) { if (p && p.el) L.afterSession(p.el); });
})(typeof window !== 'undefined' ? window : globalThis);
