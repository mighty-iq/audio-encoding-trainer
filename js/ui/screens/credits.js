/* Screen 'credits' — who made the voices, noises, rooms, word data and fonts, with their licences (RV C01, C02).
   From ES.data.credits (generated from the ledger by the stimulus pipeline) when it is present, else a short list
   taken from LICENSES-ASSETS.md; then the notices that travel with every copy of the app (js/ui/licence-texts.js).
   Works offline and in sandboxed previews: nothing is fetched. */
(function (ES) {
  'use strict';
  var U = ES.core.util;
  var FALLBACK = [
    { asset: 'Synthetic voices', source: 'Kokoro-82M v1.0 by hexgrad', licence: 'Apache License 2.0', url: 'https://www.apache.org/licenses/LICENSE-2.0',
      attribution: 'Speech synthesised with Kokoro-82M by hexgrad, Apache License 2.0.' },
    { asset: 'Synthetic voices', source: 'Piper voice en_US-libritts-high', licence: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/',
      attribution: 'Voices synthesised with the Piper voice en_US-libritts-high, trained on LibriTTS (Zen et al., 2019; CC BY 4.0), which derives from LibriSpeech and LibriVox recordings.' },
    { asset: 'Spoken digits (Lab)', source: 'AudioMNIST (Becker et al., 2023)', licence: 'MIT', url: 'https://opensource.org/license/mit',
      attribution: 'AudioMNIST: Exploring explainable artificial intelligence for audio analysis on a simple benchmark. MIT licence notice below.' },
    { asset: 'Sentences (Lab)', source: 'CREMA-D (Cao et al., 2014)', licence: 'ODbL 1.0 and DbCL 1.0', url: 'https://opendatacommons.org/licenses/odbl/1-0/',
      attribution: 'Contains information from CREMA-D, made available under the Open Database License (ODbL 1.0); its contents under the Database Contents License (DbCL 1.0).' },
    { asset: 'Background talkers', source: 'LibriVox readers, via the Microsoft DNS Challenge data', licence: 'Public domain', url: 'https://librivox.org/pages/public-domain/',
      attribution: 'Read speech from LibriVox volunteers (public domain), via the Microsoft DNS Challenge dataset.' },
    { asset: 'Ambience loops', source: 'DEMAND (Thiemann, Ito & Vincent, 2013), via MS-SNSD', licence: 'CC BY-SA 3.0', url: 'https://creativecommons.org/licenses/by-sa/3.0/',
      attribution: 'Ambience from DEMAND, The Diverse Environments Multi-channel Acoustic Noise Database, CC BY-SA 3.0, via MS-SNSD. Adapted: cut into 10-second loops, shared under the same licence.' },
    { asset: 'Crowd babble and room hum', source: 'Freesound, via MS-SNSD', licence: 'CC0 1.0', url: 'https://creativecommons.org/publicdomain/zero/1.0/',
      attribution: 'Crowd babble and room hum from Freesound (CC0), via MS-SNSD.' },
    { asset: 'Word data (sound-alike lists)', source: 'CMU Pronouncing Dictionary', licence: 'BSD-style CMU licence', url: 'https://github.com/cmusphinx/cmudict',
      attribution: 'Used at build time for syllables, rhymes and sound-alike words. Notice below.' },
    { asset: 'Fonts', source: 'Archivo and JetBrains Mono', licence: 'SIL Open Font License 1.1', url: 'https://openfontlicense.org/',
      attribution: 'Embedded in the app. Licence text below.' }
  ];

  function list() {
    var c = ES.data && ES.data.credits;
    return Array.isArray(c) && c.length ? c : FALLBACK;
  }
  function item(c) {
    var url = c.url || c.licenceUrl || c.licence_url || '';
    return U.el('li', { class: 'credit' }, [
      U.el('strong', null, c.asset || c.source || ''),
      U.el('span', { class: 'credit-src' }, [c.source && c.asset ? c.source + ' · ' : '',
        url ? U.el('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, c.licence || url) : (c.licence || '')]),
      c.attribution ? U.el('span', { class: 'hint' }, c.attribution) : null
    ]);
  }
  function notice(title, text) {
    return U.el('details', { class: 'notice' }, [U.el('summary', null, title), U.el('pre', { class: 'notice-text' }, text)]);
  }

  function mount(root) {
    var T = ES.ui.licenceTexts || {};
    root.appendChild(U.el('div', { class: 'wrap narrow credits' }, [
      ES.ui.w.header({ back: true, title: 'Credits' }),
      U.el('h1', { class: 'h-mid' }, 'Credits and licences'),
      U.el('p', null, ['Earshot’s code is under the ', U.el('a', { href: 'https://opensource.org/license/mit', target: '_blank', rel: 'noopener noreferrer' }, 'MIT licence'),
        '; its texts and the player guide under ', U.el('a', { href: 'https://creativecommons.org/licenses/by-sa/4.0/', target: '_blank', rel: 'noopener noreferrer' }, 'CC BY-SA 4.0'), '.']),
      U.el('h2', { class: 'h-small' }, 'Voices, sounds, words and fonts'),
      U.el('ul', { class: 'credit-list', 'data-credits': (ES.data && Array.isArray(ES.data.credits) && ES.data.credits.length) ? 'data' : 'fallback' }, list().map(item)),
      U.el('h2', { class: 'h-small' }, 'Notices'),
      T.ofl ? notice('SIL Open Font License 1.1 (Archivo, JetBrains Mono)', (T.fontCopyrights || []).join('\n') + '\n\n' + T.ofl) : null,
      T.cmu ? notice('CMU Pronouncing Dictionary', T.cmu) : null,
      T.audiomnist ? notice('AudioMNIST (MIT)', T.audiomnist) : null,
      ES.ui.w.footer()
    ]));
  }

  if (!ES.ui.screens.credits) ES.ui.screens.credits = { mount: mount, unmount: function () {} };
  ES.ui.credits = { list: list, FALLBACK: FALLBACK };
})(window.ES);
