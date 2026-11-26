/* Screen 'report' — one probe in full (params {probe}): the verdict in words, the gain with its 90 % interval and the
   smallest detectable change, the trend chart (tooltips on hover and focus) with its table view, what the check-in
   measures and how the verdict is reached (numbers from js/lab/stats.js and the probe definition), setup notes, and
   "run it now". Without a probe it shows every probe's verdict in one table and the pool export. MIT licence. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var L = ES.lab = ES.lab || {};
  function U() { return ES.core.util; }
  function R() { return L.records; }
  var HEAD = { clear: 'A clear gain', likely: 'Likely a gain', unclear: 'Not yet clear', lower: 'Below your baseline',
    early: 'Baseline set: the trend starts with your next check-in', baseline: 'Baseline in progress', none: 'No runs yet' };

  function sigmaText(p) {
    var u = U(), one = L.stats.sdcSimple(p.sigmaW, 1), two = L.stats.sdcSimple(p.sigmaW, 2);
    var unit = p.unit === 'dB' ? ' dB' : p.id === 'rooms' ? ' dB*' : ' points';
    return 'Run-to-run noise of tests like this one is about ' + u.round(p.sigmaW, 1) + unit + ' (one SD), so two single runs must differ by 2.77 × ' +
      u.round(p.sigmaW, 1) + ' = ' + u.round(one, 1) + unit + ' before the difference stands out; averaging two runs on each side brings that to ' + u.round(two, 1) + unit + '.';
  }
  function verdictText(id, tr) {
    var X = L.exporter;
    if (!tr.ok) return '';
    var g = X.showGain(id, tr.gain), sdc = X.showGain(id, tr.sdc);
    var pu = tr.pUp >= 0.995 ? 'over 99\u00a0%' : tr.pUp <= 0.005 ? 'under 1\u00a0%' : Math.round(100 * tr.pUp) + '\u00a0%';
    return 'Over ' + U().round(tr.weeks, 1) + ' weeks your trend moved ' + g + (tr.gain >= 0 ? ' in the better direction' : ' in the worse direction') +
      '. With your runs so far, a change counts as clear once it reaches about ' + sdc + ' (1.96 × the margin of the gain). Chance that you improved at all: ' + pu +
      '. The model separates early practice from later change and allows for test noise.';
  }

  function one(rootEl, id) {
    var u = U(), p = L.probes[id], sum = R().summary(), s = sum[id], tr = s.trend, av = p.available();
    var info = { id: id, runs: s.runs, trend: tr };
    var invites = u.el('div', { class: 'invites' });
    var notes = [];
    if (s.mixedSetup) notes.push('Your runs mix speaker and headphones: results can shift with the setup, so compare runs made the same way.');
    var edges = s.runs.filter(function (r) { return r.edge === 'hi'; }).length;
    if (edges) notes.push(u.plural(edges, 'run') + ' reached the easy end of this check-in’s range: the true value may be better still.');
    rootEl.appendChild(u.el('div', { class: 'wrap narrow lab lab-report', 'data-lab-report': id }, [
      ES.ui.w.header({ back: true, title: p.name }),
      u.el('p', { class: 'eyebrow mono' }, p.name + ' · ' + p.distance + ' · untrained'),
      u.el('h1', { class: 'h-mid', 'data-lab-verdict-head': tr.verdict }, HEAD[tr.verdict] || HEAD.none),
      tr.ok ? u.el('div', { class: 'lab-figure' }, [u.el('span', { class: 'lab-big' }, (tr.gain >= 0 ? '+' : '−') + L.exporter.showGain(id, tr.gain)),
        L.ui.verdictChip(tr), u.el('span', { class: 'hint' }, 'vs your baseline · 90\u00a0% interval ' + L.ui.gainLine(id, tr).split('90\u00a0% interval ')[1])]) : null,
      tr.ok ? u.el('p', null, verdictText(id, tr)) : u.el('p', null, s.n ? 'Runs so far: ' + s.n + (p.core ? '. The baseline is a practice run and two measured runs.' : '. The baseline is a practice run and one measured run.') + ' The trend and its verdict start with the first weekly check-in.'
        : av.ok ? 'This check-in has not been run yet.' : av.why),
      s.runs.length ? L.charts.trend(info, { width: Math.min(640, (rootEl.clientWidth || root.innerWidth || 640) - 32) }).el : null,
      s.runs.length ? u.el('details', { class: 'lab-details' }, [u.el('summary', null, 'Show the numbers'), L.charts.table(info)]) : null,
      u.el('section', { class: 'lab-sec' }, [u.el('h2', { class: 'h-small' }, 'What it measures'),
        u.el('p', null, p.measures), u.el('p', null, p.short + ' ' + p.answerHow),
        u.el('p', { class: 'hint' }, sigmaText(p)),
        id === 'matrix' ? u.el('p', { class: 'hint', 'data-lab-twice': '' }, 'Until this trend reads clear, each weekly check-in runs the Matrix twice, for at most your first ' + L.schedule.DOUBLE_WEEKS +
          ' check-ins (about 3 extra minutes): two runs make each check-in steadier, so a real gain shows weeks sooner. After that the second run is optional.') : null]),
      notes.length ? u.el('section', { class: 'lab-sec' }, [u.el('h2', { class: 'h-small' }, 'Notes'), u.el('ul', { class: 'plain' }, notes.map(function (n) { return u.el('li', null, n); }))]) : null,
      u.el('p', { class: 'hint' }, 'Earshot’s numbers compare you with your own baseline. They are not clinical measures and are not normed; if everyday hearing worries you, an audiologist can test it properly.'),
      u.el('div', { class: 'actions' }, [
        av.ok ? ES.ui.button('Run this check-in now · ' + p.minutes + ' min', { kind: 'primary', attrs: { 'data-lab-run-now': id }, onClick: function () { L.runner.start([{ probe: id }], 'extra'); } }) : null,
        ES.ui.button('Export…', { attrs: { 'data-lab-export-open': '' }, onClick: function () { L.exportUi.open(); } })]),
      invites,
      ES.ui.w.footer()
    ]));
    if (tr.verdict === 'clear') ES.core.chimera.invite('milestone', { el: invites, title: 'A clear gain', detail: p.name + ': ' + L.exporter.showGain(id, tr.gain) + ' better than your baseline. Compare notes with other listeners.' });
  }
  function all(rootEl) {
    var u = U(), sum = R().summary();
    rootEl.appendChild(u.el('div', { class: 'wrap narrow lab lab-report', 'data-lab-report': 'all' }, [
      ES.ui.w.header({ back: true, title: 'Report' }),
      u.el('h1', { class: 'h-mid' }, 'All check-ins'),
      u.el('table', { class: 'lab-table' }, [u.el('thead', null, u.el('tr', null, ['Check-in', 'Runs', 'Latest', 'Verdict'].map(function (h) { return u.el('th', { scope: 'col' }, h); }))),
        u.el('tbody', null, L.probeOrder.map(function (id) {
          var s = sum[id], meas = s.runs.filter(function (r) { return !r.practice; }), last = meas[meas.length - 1];
          return u.el('tr', null, [u.el('td', null, u.el('a', { href: '#report', 'data-go': 'report', 'data-params': JSON.stringify({ probe: id }) }, L.probes[id].name)),
            u.el('td', { class: 'num' }, String(s.n)), u.el('td', { class: 'num' }, last ? L.exporter.showValue(id, last.est.m) : '–'), u.el('td', null, L.ui.verdictChip(s.trend))]);
        }))]),
      u.el('div', { class: 'actions' }, [ES.ui.button('Export…', { kind: 'primary', onClick: function () { L.exportUi.open(); } })]),
      ES.ui.w.footer()
    ]));
  }
  function mount(rootEl, params) {
    L.ui.css();
    var id = params && params.probe;
    if (id && L.probes[id]) one(rootEl, id); else all(rootEl);
  }
  ES.ui.screens.report = { mount: mount, unmount: function () {} };
})(typeof window !== 'undefined' ? window : globalThis);
