/* ES.core.chimera — the community touchpoints (CONTRACTS §3; owner's fixed rules).
   welcome(full): the pop-up on open (full on first launch, a one-tap light version later).
   linkEl(label): a link to https://discord.gg/chmr that opens in a new tab.
   invite(kind, ctx): pb | milestone | plateau | export. Never shown during a set: while ES.ui.inSet is true the
   invitation waits in a queue, and the screen between sets renders it with takeInto(el).
   Copy says only what the owner stated: the tool was built by the Chimera community on Discord, and players
   are invited to join. */
(function (ES, win) {
  'use strict';
  var U = ES.core.util;
  var URL = 'https://discord.gg/chmr';
  var queue = [];
  var TEXT = {
    // RV C30: only that Earshot was built by the Chimera community on Discord, and an invitation to join.
    pb: { title: 'New personal best', body: 'Earshot was built by the Chimera community on Discord. Come and share it with us:' },
    milestone: { title: 'Milestone reached', body: 'Earshot was built by the Chimera community on Discord. Come and share it with us:' },
    plateau: { title: 'Join us on Discord', body: 'Earshot was built by the Chimera community on Discord, and you are welcome to join us:' },
    export: { title: 'Join us on Discord', body: 'Earshot was built by the Chimera community on Discord, and you are welcome to join us:' }
  };

  function linkEl(label, opts) {
    opts = opts || {};
    return U.el('a', { href: URL, target: '_blank', rel: 'noopener noreferrer', class: ['chimera-link', opts.cls],
      'data-chimera': opts.where || 'link' }, label || 'discord.gg/chmr');
  }
  function mark() {
    return U.svg('svg', { class: 'chimera-mark', viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' }, [
      U.svg('circle', { cx: 12, cy: 12, r: 3 }), U.svg('circle', { cx: 12, cy: 12, r: 7, fill: 'none' }),
      U.svg('circle', { cx: 12, cy: 12, r: 11, fill: 'none' })
    ]);
  }

  /** The pop-up on open. full=true on first launch. Resolves when it closes. */
  function welcome(full) {
    if (!ES.ui.sheet) return Promise.resolve();
    var h;
    if (full) {
      h = ES.ui.sheet({
        title: 'Welcome to Earshot', cls: 'sheet-chimera sheet-chimera-full', label: 'Welcome',
        body: function (b) {
          b.appendChild(U.el('p', { class: 'lead' }, 'Earshot was built by the Chimera community on Discord.'));
          b.appendChild(U.el('p', null, 'You are invited to join us there:'));
          b.appendChild(U.el('p', { class: 'chimera-big' }, [mark(), linkEl('discord.gg/chmr', { where: 'welcome' })]));
        },
        actions: [{ label: 'Start listening', kind: 'primary', value: 'start' }]
      });
    } else {
      h = ES.ui.sheet({
        cls: 'sheet-chimera sheet-chimera-light', label: 'Built by the Chimera community', closeButton: false,
        body: function (b) {
          b.appendChild(U.el('p', { class: 'chimera-line' }, [mark(), U.el('span', null, ['Built by the Chimera community on Discord. Join us: ',
            linkEl('discord.gg/chmr', { where: 'welcome-light' })])]));
        },
        actions: [{ label: 'Continue', kind: 'primary', value: 'continue' }]
      });
    }
    return h.closed;
  }

  /** An invitation card element (for screens between sets). */
  function card(kind, ctx) {
    var t = TEXT[kind] || TEXT.milestone;
    ctx = ctx || {};
    return U.el('aside', { class: 'card chimera-card', 'data-invite': kind }, [
      U.el('div', { class: 'chimera-card-head' }, [mark(), U.el('strong', null, ctx.title || t.title)]),
      ctx.detail ? U.el('p', { class: 'chimera-detail' }, ctx.detail) : null,
      U.el('p', null, [t.body + ' ', linkEl('discord.gg/chmr', { where: 'invite-' + kind })])
    ]);
  }
  /** Ask for an invitation. During a set it waits; with ctx.el it renders inline; otherwise it is queued for
      the next screen between sets (Results), which calls takeInto(). Duplicate kinds merge. */
  function invite(kind, ctx) {
    ctx = ctx || {};
    if (!TEXT[kind]) return false;
    if (ctx.el && !ES.ui.inSet) { ctx.el.appendChild(card(kind, ctx)); return true; }
    for (var i = 0; i < queue.length; i++) if (queue[i].kind === kind) { queue[i].ctx = ctx; return true; }
    queue.push({ kind: kind, ctx: ctx });
    return true;
  }
  function pending() { return queue.map(function (q) { return q.kind; }); }
  /** Render queued invitations into el (only between sets). Returns how many were shown. */
  function takeInto(el) {
    if (ES.ui.inSet || !el || !queue.length) return 0;
    var q = queue;
    queue = [];
    q.forEach(function (x) { el.appendChild(card(x.kind, x.ctx)); });
    return q.length;
  }

  ['pb', 'milestone', 'plateau'].forEach(function (kind) {
    ES.hooks.on(kind, function (payload) { invite(kind, { detail: payload && payload.text, title: payload && payload.title }); });
  });

  ES.core.chimera = { URL: URL, welcome: welcome, linkEl: linkEl, invite: invite, card: card, pending: pending,
    takeInto: takeInto, mark: mark };
})(window.ES, window);
