/* ES.ui.field(svg, model) — the earshot field (CONTRACTS §8): range rings around "you", the voice to follow
   as a red dot, every other voice in blue, an optional room outline and distance labels. Static: drawn once
   per trial, never animated. Geometry: azimuth 0° = ahead (up), +90° = right, ±180° = behind; distance in m.
   model = { voices:[{id, role:'target'|'masker'|'decoy'|'cue', az, dist, label}], room?:{w, d, cx?, cy?},
             maxDist?, rings?:[m...], labels?:bool, you?:'you', compact?:bool, title? } */
(function (ES) {
  'use strict';
  var U = ES.core.util;
  var R = 86;                                   // outer ring radius in viewBox units (viewBox −100…100)
  var STEPS = [0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100];

  function niceRings(maxDist) {
    var step = STEPS[STEPS.length - 1];
    for (var i = 0; i < STEPS.length; i++) { if (maxDist / STEPS[i] <= 4) { step = STEPS[i]; break; } }
    var outer = Math.max(step, Math.ceil(maxDist / step - 1e-9) * step), rings = [];
    for (var d = step; d <= outer + 1e-9; d += step) rings.push(U.round(d, 2));
    return { rings: rings, outer: outer };
  }
  function polar(az, r) {
    var a = (az || 0) * Math.PI / 180;
    return { x: U.round(Math.sin(a) * r, 2), y: U.round(-Math.cos(a) * r, 2) };
  }
  /** Words for a direction: "ahead", "ahead-right", "to your left", "behind-left", "behind you". */
  function where(az) {
    var a = (((az || 0) + 180) % 360 + 360) % 360 - 180, m = Math.abs(a), side = a > 0 ? 'right' : 'left';
    if (m <= 20) return 'ahead';
    if (m < 70) return 'ahead-' + side;
    if (m <= 110) return 'to your ' + side;
    if (m < 160) return 'behind-' + side;
    return 'behind you';
  }
  function describe(model) {
    var vs = model.voices || [], t = vs.filter(function (v) { return v.role === 'target'; })[0];
    var others = vs.length - (t ? 1 : 0), parts = [];
    if (t) {
      parts.push('Voice to follow' + (t.label ? ' (' + t.label + ')' : '') + ': ' + where(t.az) +
        (typeof t.dist === 'number' ? ', ' + U.fmtM(t.dist) : ''));
    }
    if (others) parts.push(U.plural(others, 'other voice'));
    if (model.room) parts.push('in a room');
    return parts.join('; ') || 'The listening field';
  }

  function field(svg, model) {
    model = model || {};
    if (!svg) svg = U.svg('svg', {});
    U.clear(svg);
    svg.setAttribute('viewBox', '-100 -100 200 200');
    svg.setAttribute('class', 'field' + (model.compact ? ' field-compact' : ''));
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', model.title || describe(model));
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    var voices = (model.voices || []).filter(function (v) { return v && typeof v === 'object'; });
    var dists = voices.map(function (v) { return v.dist; }).filter(function (d) { return typeof d === 'number' && d > 0; });
    var metric = dists.length > 0 || typeof model.maxDist === 'number';
    var maxDist = model.maxDist || (dists.length ? Math.max.apply(null, dists) * 1.15 : 3);
    var g = niceRings(maxDist), rings = model.rings || g.rings, outer = model.rings ? Math.max.apply(null, model.rings) : g.outer;
    var k = R / outer;
    var showLabels = model.labels !== false && metric && !model.compact;

    // Cross-hairs and rings: the paper the voices sit on.
    svg.appendChild(U.svg('line', { class: 'f-axis', x1: -R - 6, y1: 0, x2: R + 6, y2: 0 }));
    svg.appendChild(U.svg('line', { class: 'f-axis', x1: 0, y1: -R - 6, x2: 0, y2: R + 6 }));
    if (metric) {
      rings.forEach(function (d, i) {
        var r = U.round(d * k, 2);
        svg.appendChild(U.svg('circle', { class: 'f-ring' + (i === rings.length - 1 ? ' f-ring-outer' : ''), r: r, cx: 0, cy: 0 }));
        if (showLabels) {
          svg.appendChild(U.svg('text', { class: 'f-dist', x: U.round(r * 0.7071 + 2, 2), y: U.round(r * 0.7071 + 7, 2) }, U.fmtM(d)));
        }
      });
    } else {
      [R / 3, 2 * R / 3, R].forEach(function (r, i) {
        svg.appendChild(U.svg('circle', { class: 'f-ring' + (i === 2 ? ' f-ring-outer' : ''), r: U.round(r, 2), cx: 0, cy: 0 }));
      });
    }

    if (model.room && typeof model.room === 'object') {
      var w = +model.room.w || outer * 1.4, dd = +model.room.d || outer * 1.6;
      var cx = +model.room.cx || 0, cy = model.room.cy != null ? +model.room.cy : dd * 0.18;
      svg.appendChild(U.svg('rect', { class: 'f-room', x: U.round((cx - w / 2) * k, 2), y: U.round((-cy - dd / 2) * k, 2),
        width: U.round(w * k, 2), height: U.round(dd * k, 2), rx: 3 }));
    }

    // You: a dot with a short tick pointing ahead.
    svg.appendChild(U.svg('line', { class: 'f-you-tick', x1: 0, y1: -5.5, x2: 0, y2: -11 }));
    svg.appendChild(U.svg('circle', { class: 'f-you', r: 4.2, cx: 0, cy: 0 }));
    if (!model.compact) svg.appendChild(U.svg('text', { class: 'f-you-label', x: 0, y: 15 }, model.you || 'you'));

    // Others first, the voice to follow on top.
    voices.slice().sort(function (a, b) { return (a.role === 'target') - (b.role === 'target'); }).forEach(function (v) {
      var r = typeof v.dist === 'number' && v.dist > 0 ? Math.min(R + 4, v.dist * k) : R * 0.62;
      var p = polar(v.az, r), target = v.role === 'target';
      var cls = target ? 'f-target' : v.role === 'decoy' ? 'f-other f-decoy' : v.role === 'cue' ? 'f-other f-cue' : 'f-other';
      var grp = U.svg('g', { class: 'f-voice ' + cls, 'data-role': v.role || 'masker', 'data-id': v.id || null });
      if (target) grp.appendChild(U.svg('circle', { class: 'f-halo', cx: p.x, cy: p.y, r: 11 }));
      grp.appendChild(U.svg('circle', { class: 'f-dot', cx: p.x, cy: p.y, r: target ? 7 : 5.5 }));
      if (v.label && (!model.compact || target)) {
        var below = p.y < -R + 18, ty = below ? p.y + (target ? 19 : 15) : p.y - (target ? 12 : 9);
        grp.appendChild(U.svg('text', { class: 'f-label', x: U.clamp(p.x, -84, 84), y: U.round(ty, 2) }, v.label));
      }
      svg.appendChild(grp);
    });
    return svg;
  }

  ES.ui.field = field;
  ES.ui.field.niceRings = niceRings;
  ES.ui.field.describe = describe;
  ES.ui.field.where = where;
})(window.ES);
