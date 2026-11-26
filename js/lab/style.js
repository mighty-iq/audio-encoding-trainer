/* ES.lab.ui.css() — the Lab's styles, injected once on first mount (the shell owns css/; the Lab keeps its own rules
   here, built only on the shell's tokens). Chart colours: one series hue, validated with the dataviz checks —
   light #2A56CF on #FFFFFF, dark #6F8EF0 on #181B20 (the dark token #86A6FF is too light for a chart mark) —
   points in ink, the 90 % band as a 10 % wash, gridlines hairline and solid. MIT licence. */
(function (root) {
  'use strict';
  var ES = root.ES = root.ES || {};
  var L = ES.lab = ES.lab || {};
  L.ui = L.ui || {};
  var CSS = [
    ':root{--lab-series:#2A56CF;--lab-band:rgba(42,86,207,.10)}',
    ':root[data-theme="dark"]{--lab-series:#6F8EF0;--lab-band:rgba(111,142,240,.14)}',
    '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--lab-series:#6F8EF0;--lab-band:rgba(111,142,240,.14)}}',
    // overview
    '.lab-intro{margin-bottom:14px}',
    '.lab-due{margin:12px 0 16px;display:grid;gap:10px}',
    '.lab-due .eyebrow{margin:0}',
    '.lab-items{list-style:none;margin:0;padding:0;border-top:1px solid var(--rule)}',
    '.lab-items li{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--rule)}',
    '.lab-items .lab-item-name{font-weight:600}',
    '.lab-items .lab-item-meta{font:400 var(--fs-1)/1.3 var(--mono);color:var(--ink-3);white-space:nowrap}',
    '.lab-next{margin:12px 0 16px}',
    '.lab-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 12px;padding:10px 0;border-bottom:1px solid var(--rule)}',
    '.lab-row .row-text{flex:1 1 200px}',
    '.lab-sec{margin:24px 0 8px}',
    '.lab-sec>.h-small{padding-bottom:6px;margin-bottom:8px;border-bottom:1px solid var(--rule)}',
    '.lab-grid{display:grid;gap:10px}',
    '@media (min-width:640px){.lab-grid{grid-template-columns:1fr 1fr}}',
    '.lab-card{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"head val" "spark spark" "foot foot";gap:4px 10px;padding:12px;',
    'border:1px solid var(--rule);border-radius:var(--r-2);background:var(--surface);color:var(--ink);text-decoration:none;min-height:44px}',
    '.lab-card:hover{border-color:var(--rule-2)}',
    '.lab-card-head{grid-area:head;display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 8px}',
    '.lab-card-name{font-weight:700}',
    '.lab-card-val{grid-area:val;font:600 var(--fs-3)/1.2 var(--mono);text-align:right}',
    '.lab-card-val small{display:block;font:400 11px/1.3 var(--mono);color:var(--ink-3)}',
    '.lab-card .lab-spark{grid-area:spark}',
    '.lab-card-foot{grid-area:foot;display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:var(--fs-1);color:var(--ink-2)}',
    '.lab-card[aria-disabled="true"]{background:var(--surface-2);color:var(--ink-2)}',
    '.lab-dist{font:400 11px/1.4 var(--mono);color:var(--ink-3);text-transform:uppercase;letter-spacing:.06em}',
    '.lab-verdict{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;border:1px solid var(--rule);font-size:12px;font-weight:600;color:var(--ink-2);background:var(--surface)}',
    '.lab-verdict .glyph{width:13px;height:13px}',
    '.lab-verdict.is-clear{color:var(--ok);background:var(--ok-wash);border-color:transparent}',
    '.lab-verdict.is-likely{color:var(--ink);border-color:var(--ink-3)}',
    '.lab-verdict.is-lower{color:var(--warn);background:var(--warn-wash);border-color:transparent}',
    // charts
    '.lab-spark,.lab-chart{display:block;width:100%;height:auto;overflow:visible}',
    '.lab-chart-box{position:relative;margin:10px 0 6px}',
    '.lc-grid{stroke:var(--rule);stroke-width:1;shape-rendering:crispEdges}',
    '.lc-axis{font:400 11px var(--mono);fill:var(--ink-3)}',
    '.lc-base{stroke:var(--ink-3);stroke-width:1}',
    '.lc-base-label{font:400 11px var(--font);fill:var(--ink-3)}',
    '.lc-band{fill:var(--lab-band);stroke:none}',
    '.lc-line{fill:none;stroke:var(--lab-series);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
    '.lc-err{stroke:var(--ink-3);stroke-width:1}',
    '.lc-pt{fill:var(--ink);stroke:var(--surface);stroke-width:2}',
    '.lc-pt.is-practice{fill:var(--surface);stroke:var(--ink-3);stroke-width:1.5}',
    '.lc-hit{fill:transparent;stroke:none;cursor:pointer}',
    '.lc-hit:focus-visible{outline:none;stroke:var(--focus);stroke-width:2}',
    '.lc-endlabel{font:600 12px var(--mono);fill:var(--ink)}',
    '.lab-tip{position:absolute;z-index:5;pointer-events:none;min-width:120px;padding:6px 8px;border-radius:var(--r-1);background:var(--surface);',
    'border:1px solid var(--rule-2);box-shadow:var(--shadow-2);font-size:12px;line-height:1.35;transform:translate(-50%,calc(-100% - 10px))}',
    '.lab-tip strong{display:block;font:600 14px var(--mono)}',
    '.lab-table{width:100%;border-collapse:collapse;font-size:var(--fs-1);margin:6px 0}',
    '.lab-table th,.lab-table td{padding:6px 4px;border-bottom:1px solid var(--rule);text-align:left}',
    '.lab-table td.num{font-family:var(--mono);font-variant-numeric:tabular-nums;text-align:right;white-space:nowrap}',
    '.lab-figure{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px;margin:8px 0}',
    '.lab-figure .lab-big{font-size:36px;font-weight:700;letter-spacing:-.02em}',
    // runner
    '.lab-run .trial-host{justify-content:center}',
    '.lab-panel{margin:auto 0;display:flex;flex-direction:column;gap:12px;padding:18px}',
    '.lab-panel h1{font-size:var(--fs-4)}',
    '.lab-panel p{margin:0}',
    '.lab-stage{flex:1;display:flex;flex-direction:column;justify-content:flex-end;gap:8px;min-height:0;padding-bottom:10px}',
    '.lab-status{margin:0;min-height:1.4em;text-align:center;font:400 var(--fs-1)/1.4 var(--mono);color:var(--ink-3)}',
    '.lab-prompt{margin:0;text-align:center;font-size:var(--fs-3);font-weight:600}',
    '.lab-matrix{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:3px}',
    '.lab-mcol{display:flex;flex-direction:column;gap:3px;min-width:0}',
    '.lab-mhead{font:600 11px/1.2 var(--mono);color:var(--ink-3);text-align:center;text-transform:uppercase;letter-spacing:.04em;padding:2px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.lab-key{min-height:44px;padding:0 2px;border:1px solid var(--rule);border-radius:var(--r-1);background:var(--surface);color:var(--ink);',
    'font:600 13px/1.1 var(--font);cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;touch-action:manipulation}',
    '.lab-key:disabled{color:var(--ink-3);cursor:default}',
    '.lab-mcol[data-slot="name"] .lab-key{text-transform:capitalize}',
    '.lab-key[aria-checked="true"]{background:var(--ink);color:var(--on-ink);border-color:var(--ink)}',
    '.lab-done{min-height:48px}',
    '.lab-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:340px;width:100%;margin:0 auto}',
    '.lab-pad .lab-key{min-height:58px;font:600 22px var(--mono)}',
    '.lab-digits{display:flex;justify-content:center;gap:10px;margin:4px 0}',
    '.lab-digits span{display:inline-flex;align-items:center;justify-content:center;width:46px;height:52px;border:1px solid var(--rule-2);border-radius:var(--r-1);',
    'background:var(--surface);font:600 24px var(--mono)}',
    '.lab-choice{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
    '.lab-choice.is-list{grid-template-columns:1fr}',
    '.lab-choice .lab-key{min-height:52px;font-size:15px;white-space:normal;padding:4px 8px;line-height:1.25}',
    '.lab-scale{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}',
    '.lab-scale .lab-key{min-height:52px;font:600 18px var(--mono)}',
    '.lab-scale-ends{display:flex;justify-content:space-between;font-size:12px;color:var(--ink-3)}',
    '.lab-q{font-size:var(--fs-3);font-weight:600;text-align:center;margin:0}',
    '.lab-preview{display:flex;flex-wrap:wrap;gap:8px;align-items:center}',
    // headphone check and export sheets
    '.lab-hp-keys{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:8px 0}',
    '.lab-hp-key{min-height:64px;font:600 24px var(--mono)}',
    '.lab-hp-status{font-size:var(--fs-1);color:var(--ink-3)}',
    '.lab-hp-manual{margin-top:12px}',
    '.lab-hp-manual summary{cursor:pointer;color:var(--ink-2);font-size:var(--fs-1);min-height:44px;display:flex;align-items:center}',
    '.lab-hp-manual .text-input{width:100%;margin:6px 0}',
    '.lab-export-list{list-style:none;margin:0;padding:0}',
    '.lab-export-list li{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px 10px;padding:10px 0;border-bottom:1px solid var(--rule)}',
    '.lab-export-list .row-text{flex:1 1 180px}',
    '.lab-check{display:flex;align-items:center;gap:8px;min-height:44px;font-size:var(--fs-1)}',
    '.lab-check input{width:20px;height:20px;accent-color:var(--ink)}',
    '.lab-events{list-style:none;margin:0;padding:0}',
    '.lab-events li{padding:8px 0;border-bottom:1px solid var(--rule);font-size:var(--fs-1)}',
    '.lab-chips{display:flex;flex-wrap:wrap;gap:6px}',
    '.lab-chips .lab-key{min-height:44px;padding:0 12px;font-size:13px}'
  ].join('\n');
  L.ui.css = function () {
    var d = root.document;
    if (!d || d.getElementById('lab-css')) return;
    var s = d.createElement('style');
    s.id = 'lab-css';
    s.textContent = CSS;
    (d.head || d.documentElement).appendChild(s);
  };
})(typeof window !== 'undefined' ? window : globalThis);
