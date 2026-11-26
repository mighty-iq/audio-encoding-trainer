/* Screen 'about' — what Earshot is, how it works, what it is not, licences and credits. */
(function (ES) {
  'use strict';
  var U = ES.core.util;

  function mount(root) {
    root.appendChild(U.el('div', { class: 'wrap narrow about' }, [
      ES.ui.w.header({ back: true, title: 'About' }),
      U.el('h1', { class: 'h-mid' }, 'About Earshot'),
      U.el('p', { class: 'lead' }, 'Earshot is a free listening trainer for the places where speech gets hard: loud rooms full of other voices, talkers across a room or a hall, and voices that sound unfamiliar.'),
      U.el('h2', { class: 'h-small' }, 'How it works'),
      U.el('p', null, 'Short closed-set trials hold several dials at the edge of what you can hear at once: how loud the other voices are, how alike they sound, how far away and how echoey. Feedback after every trial lets you hear the voice alone, then the mix again. Untrained check-ins in the Lab measure what carries over to new voices, rooms and formats.'),
      U.el('h2', { class: 'h-small' }, 'What it is not'),
      U.el('p', null, 'Not a hearing test and not a medical device. Its numbers are training levels, not clinical measures. If you notice hearing loss, ringing or pain, see an audiologist or a doctor.'),
      U.el('h2', { class: 'h-small' }, 'Licences and credits'),
      U.el('ul', { class: 'plain' }, [
        U.el('li', null, 'Code: MIT licence.'),
        U.el('li', null, 'Texts and the player guide: CC BY-SA 4.0.'),
        U.el('li', null, 'Fonts: Archivo and JetBrains Mono, SIL Open Font License 1.1.'),
        U.el('li', null, ['Voices, noises and rooms: each source and its licence is listed in ', U.el('a', { href: 'LICENSES-ASSETS.md', target: '_blank', rel: 'noopener' }, 'LICENSES-ASSETS.md'), ' in the source code.'])
      ]),
      U.el('p', null, ['Built by the Chimera community on Discord. Join us: ', ES.core.chimera.linkEl('discord.gg/chmr', { where: 'about' })]),
      U.el('p', { class: 'hint mono' }, 'Version ' + ES.VERSION + (ES.TEST_BUILD ? ' · test build' : '')),
      ES.ui.w.footer()
    ]));
  }

  if (!ES.ui.screens.about) ES.ui.screens.about = { mount: mount, unmount: function () {} };
})(window.ES);
