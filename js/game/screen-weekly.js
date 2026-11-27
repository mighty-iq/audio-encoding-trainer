/* Screen 'weekly' (params {week?}) — the Weekly Night Out: this week's four stops, play or continue them, then your
   card: ✓/✕ per trial (spoiler-free), the furthest level per stop, the score, as text and as an image, with share,
   copy and download (each falls back when the page may not), an optional nickname the player types, past weeks.
   No leaderboard: the night is yours to share. Every share text carries https://discord.gg/chmr. */
(function (ES, win) {
  'use strict';
  var G = ES.game;
  function U() { return ES.core.util; }
  function el(t, a, c) { return U().el(t, a, c); }
  function nickname() { try { return String((ES.core.store.peek('profile') || {}).nickname || '').trim(); } catch (e) { return ''; } }

  function routeList(res) {
    return el('ol', { class: 'g-route', 'aria-label': 'This week’s stops' }, res.stops.map(function (s, i) {
      return el('li', { class: 'g-stop', 'data-stop': i }, [el('div', { class: 'g-stop-n' }, 'Stop ' + (i + 1)), el('div', { class: 'g-stop-name' }, s.name),
        el('div', { class: 'g-stop-ex' }, s.exName), s.marks ? G.ui.marks(s.marks) : null,
        s.hardest ? el('div', { class: 'g-stop-ex' }, 'Hardest right: ' + s.hardest) : null]);
    }));
  }
  function playArea(wk, res, avail) {
    var played = res.stops.filter(function (s) { return s.marks; }).length, done = res.complete;
    if (!avail.ok) return el('div', { class: 'g-empty' }, [el('p', null, 'This week’s night out needs the voice packs of the audio build.'), el('p', { class: 'g-note' }, 'It appears here as soon as they are installed.')]);
    var label = done ? 'Play again (practice)' : played ? 'Continue: ' + (4 - played) + ' stop' + (4 - played === 1 ? '' : 's') + ' left' : 'Play this week’s night out';
    var b = ES.ui.button(label, { kind: done ? 'secondary' : 'primary', wide: true, disabled: G.ui.sessionRunning(), attrs: { 'data-weekly-play': '' },
      onClick: function () { G.ui.startPlan(G.weekly.plan(wk)); } });
    var tuts = (ES.core.store.peek('profile') || {}).tutorials || {}, need = ['crowd', 'far', 'strange', 'repair'].filter(function (x) { return ES.ex[x] && ES.ex[x].tutorial && !tuts[x]; });
    var sup = ES.ui.session && ES.ui.session.supports && ES.ui.session.supports.plan;
    return el('div', null, [el('div', { class: 'g-actions' }, [b]),
      need.length ? el('p', { class: 'g-note' }, 'First time at a stop, its exercise starts with a short tutorial.') : null,
      done ? el('p', { class: 'g-note' }, 'Your first full run is this week’s card. Practice runs are logged but never change it.') : null,
      sup ? null : el('p', { class: 'g-note' }, 'Playing the night out from here arrives with the next build.')]);
  }
  function cardArea(wk, res) {
    var box = el('section', { class: 'card', 'data-weekly-card': '' }), img = el('img', { class: 'g-shareimg', alt: '' }), canvas = null;
    var nickOn = { v: !!nickname() };
    function refresh() {
      G.share.draw(res, { nickname: nickOn.v ? nickname() : '' }).then(function (cv) {
        canvas = cv;
        try { img.src = cv.toDataURL('image/png'); img.alt = 'Your Weekly Night Out card: ' + res.right + ' of ' + res.n + ' right'; } catch (e) { img.hidden = true; }
      }).catch(function () { img.hidden = true; });
    }
    function text() { return G.weekly.shareText(res, { nickname: nickOn.v ? nickname() : '' }); }
    function withBlob(fn) { if (!canvas) return; G.share.toBlob(canvas).then(fn); }
    var nick = el('input', { type: 'text', maxlength: '40', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Nickname on your card (optional)', placeholder: 'Nickname (optional)' });
    nick.value = nickname();
    nick.addEventListener('change', function () {
      var v = nick.value.replace(/[\u0000-\u001f]/g, '').trim().slice(0, 40);
      ES.core.store.update('profile', function (p) { p.nickname = v; });
      nickOn.v = !!v; refresh();
    });
    var actions = el('div', { class: 'g-actions' }, [
      ES.ui.button('Copy text', { kind: 'primary', attrs: { 'data-copy-text': '' }, onClick: function () { ES.ui.copyText(text(), { toast: 'Card text copied', title: 'Your card as text' }); } }),
      ES.ui.button('Share image', { attrs: { 'data-share-image': '' }, onClick: function () {
        withBlob(function (blob) {
          G.share.shareSheet(blob, text(), G.share.fileName(res)).then(function (ok) {
            if (ok) return;
            G.share.copyImage(blob).then(function (ok2) { if (ok2) ES.ui.toast('Image copied'); else G.share.showImage(canvas, res); });
          });
        });
      } }),
      ES.ui.button('Download image', { attrs: { 'data-download-image': '' }, onClick: function () {
        if (canvas) G.share.save(canvas, res, text());       // saving goes through ES.core.download (shell)
      } })
    ]);
    box.appendChild(el('p', { class: 'eyebrow mono' }, res.complete ? 'Your card' : 'Your night so far'));
    box.appendChild(el('p', { class: 'g-score', 'data-score': res.right + '/' + res.n }, res.right + '/' + res.n));
    box.appendChild(el('p', { class: 'g-note' }, res.complete ? 'right on your first run' : 'right so far; finish the last stops for your card'));
    box.appendChild(img);
    box.appendChild(el('div', { class: 'g-nick' }, [nick]));
    box.appendChild(actions);
    box.appendChild(el('p', { class: 'g-note' }, ['No leaderboard: compare nights with friends in the Chimera community, ', ES.core.chimera.linkEl('discord.gg/chmr', { where: 'weekly' }), '.']));
    refresh();
    return box;
  }
  function history(wk) {
    var rec = G.core.rec(), weeks = Object.keys(rec.weekly || {}).filter(function (w) { return w !== wk && G.weekly.validWeek(w); }).sort().reverse().slice(0, 12);
    if (!weeks.length) return null;
    return [el('h2', { class: 'g-sec' }, 'Earlier weeks'), el('ul', { class: 'g-hist' }, weeks.map(function (w) {
      var r = G.weekly.result(w, rec);
      return el('li', null, [el('span', { class: 'g-mono' }, w), el('span', null, r.stops.map(function (s) { return s.name; }).join(' → ')),
        el('span', { class: 'g-mono' }, r.right + '/' + r.n + (r.complete ? '' : ' (part)'))]);
    })), el('p', { class: 'g-note' }, 'Venues change from week to week, so compare a week with friends rather than with your other weeks; your levels over time live in Progress.')];
  }

  function mount(root, params) {
    var wk = params && G.weekly.validWeek(params.week) ? params.week : G.weekly.weekKey(), res = G.weekly.result(wk), avail = G.weekly.available(wk);
    var played = res.stops.some(function (s) { return s.marks; });
    root.appendChild(el('div', { class: 'wrap narrow g-wrap g-weekly', 'data-week': wk }, [
      ES.ui.w.header({ back: true, title: 'Weekly' }),
      el('p', { class: 'eyebrow mono' }, 'Weekly Night Out · ' + wk),
      G.ui.sessionNotice('play the night out'),
      el('h1', { class: 'h-mid' }, G.weekly.weekLabel(wk)),
      el('p', { class: 'g-sub' }, 'Four stops, six trials each, from easy to hard. Everyone on this version plays the same night this week, so you can compare runs with friends.'),
      routeList(res),
      el('p', { class: 'g-note' }, ['Everyone plays this same night until Monday. ', el('span', { class: 'g-mono g-code' }, 'Night code ' + G.weekly.identity())]),
      playArea(wk, res, avail),
      played ? cardArea(wk, res) : null,
      history(wk),
      ES.ui.w.footer()
    ]));
  }

  ES.ui.screens.weekly = { mount: mount, unmount: function () {} };
})(window.ES, window);
