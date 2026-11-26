/* Screen 'cast' — the voices of the night out, grouped by the venue they belong to. A card fills in as you meet the
   voice (name, what they do, synthetic or recorded, accent, median pitch on a 80–320 Hz scale, how often you heard
   them) and turns "known" once you have picked it out three times in "Who is talking?". Met voices can introduce
   themselves again (between sets only: this screen is never shown during one). Unmet cards stay blank on purpose. */
(function (ES, win) {
  'use strict';
  var G = ES.game, playing = null;
  function U() { return ES.core.util; }
  function el(t, a, c) { return U().el(t, a, c); }

  function introClip(id) {
    var X = ES.engine && ES.engine.items && ES.engine.items.data;
    try { var a = X ? X.kindsOf(id, 'intro') : []; return a && a.length ? a[0] : null; } catch (e) { return null; }
  }
  function canPlay(id) { return !!(introClip(id) && ES.audio && typeof ES.audio.render === 'function' && typeof ES.audio.play === 'function'); }
  function playIntro(id, btn) {
    var clip = introClip(id);
    if (!clip) return;
    try { if (ES.ui.sound && ES.ui.sound.unlock) ES.ui.sound.unlock(); } catch (e) { /* ignore */ }
    if (playing) { try { playing.stop(); } catch (e) { /* ignore */ } playing = null; }
    btn.disabled = true;
    var meta = ES.data.manifest && ES.data.manifest.clips[clip], dur = (meta && meta.dur) || 3;
    var spec = { out: { db: -20 }, dur: Math.round((dur + 0.4) * 100) / 100, spatial: 'mono', parts: [{ clip: clip, at: 0.15, db: 0, role: 'target' }], beds: [], room: null };
    Promise.resolve().then(function () { return ES.audio.render(spec, { seed: 'cast:' + id }); }).then(function (r) {
      playing = ES.audio.play(r.buffer);
      return playing.ended;
    }).catch(function () { if (ES.ui.toast) ES.ui.toast('That voice could not play here.'); }).then(function () { btn.disabled = false; playing = null; });
  }

  function card(c, venueName, venueTitle) {
    var kids = [], st = c.state;
    kids.push(el('span', { class: 'g-card-state' }, st === 'known' ? '✓ known' : st === 'met' ? 'met' : ''));
    kids.push(el('span', { class: 'g-card-venue' }, venueTitle));
    if (st === 'unmet') {
      kids.push(el('span', { class: 'g-card-name', 'aria-label': 'Not met yet' }, '? ? ?'));
      kids.push(el('span', { class: 'g-card-role' }, 'Someone from the ' + venueName + '. You meet them in training.'));
    } else {
      kids.push(el('span', { class: 'g-card-name' }, c.name));
      kids.push(el('span', { class: 'g-card-role' }, c.blurb));
      var facts = [c.synthetic ? 'synthetic voice' : 'recorded voice', c.accent, G.cast.pitchText(c.f0)].filter(Boolean).join(' · ');
      kids.push(el('span', { class: 'g-card-meta' }, facts));
      var pb = G.ui.pitchBar(c.f0);
      if (pb) kids.push(pb);
      kids.push(el('span', { class: 'g-card-meta' }, 'heard ' + c.heard + ' · picked out ' + c.identified + (st === 'known' ? '' : ' of ' + G.cast.KNOWN_AT)));
      if (canPlay(c.id)) {
        var b = ES.ui.button('Hear ' + c.name, { kind: 'secondary', small: true, attrs: { 'data-intro': c.id } });
        b.addEventListener('click', function () { playIntro(c.id, b); });
        kids.push(b);
      }
    }
    return el('li', { class: 'g-card is-' + st, 'data-cast': c.id, 'data-state': st }, kids);
  }

  function mount(root) {
    var cards = G.cast.cards(), n = G.cast.counts(), body;
    if (!cards.length) {
      body = el('div', { class: 'g-empty' }, [el('p', null, 'The cast arrives with the voice packs of the audio build.'), el('p', { class: 'g-note' }, 'Nothing to show yet, on purpose.')]);
    } else {
      body = el('ul', { class: 'g-cast-grid' }, cards.map(function (c) {
        var v = G.data.venue(c.venue);
        return card(c, v ? G.venues.venueName(v) : 'town', v ? v.name : 'Around town');
      }));
    }
    root.appendChild(el('div', { class: 'wrap g-wrap g-cast' }, [
      ES.ui.w.header({ back: true, title: 'Cast' }),
      el('p', { class: 'eyebrow mono' }, 'The cast'),
      el('h1', { class: 'h-mid' }, 'Voices of the night out'),
      el('p', { class: 'g-sub' }, 'A card fills in when you meet its voice, and turns known when you can pick it out by ear. Voices grow familiar within the first hour of listening to them.'),
      cards.length ? el('p', { class: 'g-cast-count' }, n.met + ' of ' + n.total + ' met · ' + n.known + ' known') : null,
      body,
      ES.ui.w.footer()
    ]));
  }
  function unmount() { if (playing) { try { playing.stop(); } catch (e) { /* ignore */ } playing = null; } }

  ES.ui.screens.cast = { mount: mount, unmount: unmount };
})(window.ES, window);
