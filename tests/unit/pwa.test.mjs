// Unit tests for the installable Pages build (js/core/pwa.js, sw.js, tools/build-sw.mjs, manifest, icons) and the
// in-app browser notice. The user agents below are typical published formats with invented device and version
// numbers. MIT licence.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const scripts = ['js/core/ns.js', 'js/core/pwa.js'];

const tool = (env, name) => import(pathToFileURL(path.join(env.ROOT, 'tools', name)).href);

// [user agent, expected app or null]
const UAS = [
  // in-app browsers
  ['Mozilla/5.0 (Linux; Android 13; Pixel 7 Build/TQ3A.230901.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/117.0.5938.60 Mobile Safari/537.36 Instagram 302.0.0.34.111 Android (33/13; 420dpi; 1080x2400; Google/google; Pixel 7; panther; panther; en_US; 520702512)', 'Instagram'],
  ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 307.0.2.21.112 (iPhone14,5; iOS 17_1_2; en_US; en; scale=3.00; 1170x2532; 532277068)', 'Instagram'],
  ['Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBDV/iPhone13,2;FBMD/iPhone;FBSN/iOS;FBSV/16.6;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5;FBRV/0]', 'Facebook'],
  ['Mozilla/5.0 (Linux; Android 12; SM-G991B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/118.0.5993.80 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/439.0.0.44.117;]', 'Facebook'],
  ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/MessengerForiOS;FBAV/430.0.0.38.109;FBDV/iPhone15,2;FBMD/iPhone;FBSN/iOS;FBSV/17.0;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5]', 'Facebook'],
  ['Mozilla/5.0 (Linux; Android 13; SM-A536B Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/116.0.5845.163 Mobile Safari/537.36 trill_310404 JsSdk/1.0 NetType/WIFI Channel/googleplay AppName/trill app_version/31.4.4 ByteLocale/en Region/GB BytedanceWebview/d8a21c6', 'TikTok'],
  ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 musical_ly_32.5.0 JsSdk/2.0 NetType/WIFI Channel/App Store ByteLocale/en Region/US WKWebView/1', 'TikTok'],
  ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Snapchat/12.70.0.33 (like Safari/8617.2.4.10.8, panda)', 'Snapchat'],
  ['Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP1A.240305.019; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/122.0.6261.119 Mobile Safari/537.36 Snapchat/12.76.0.36 (like Chrome/122.0.6261.119)', 'Snapchat'],
  ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/13.20.0', 'LINE'],
  ['Mozilla/5.0 (Linux; Android 13; SO-51C Build/64.1.C.0.123; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/119.0.6045.66 Mobile Safari/537.36 Line/13.21.1/IAB', 'LINE'],
  ['Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Twitter for iPhone/9.61', 'X'],
  ['Mozilla/5.0 (Linux; Android 13; Pixel 6a Build/TQ3A.230805.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/115.0.5790.166 Mobile Safari/537.36 TwitterAndroid', 'X'],
  ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9147 Chrome/120.0.6099.291 Electron/28.2.10 Safari/537.36', 'Discord'],
  ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Discord/254.0 (iPhone)', 'Discord'],
  ['Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A.240805.005; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0.6613.127 Mobile Safari/537.36 Discord/247.13', 'Discord'],
  // browsers and webviews that are not in-app browsers
  ['Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro Build/AP2A.240805.005; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0.6613.127 Mobile Safari/537.36 Claude/1.240827.4', null],
  ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Claude/1.240916.0', null],
  ['Mozilla/5.0 (Linux; Android 13; Pixel 7 Build/TQ3A.230901.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/117.0.5938.60 Mobile Safari/537.36', null],
  ['Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36', null],
  ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1', null],
  ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/127.0.6533.107 Mobile/15E148 Safari/604.1', null],
  ['Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0', null],
  ['Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36', null],
  ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0', null],
  ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15', null],
  ['Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0', null],
  ['Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/131.0.6778.33 Safari/537.36', null]
];

const OK_ENV = { protocol: 'https:', hostname: 'example.github.io', origin: 'https://example.github.io', top: true,
  script: 'https://example.github.io/app/js/core/pwa.js', test: false, sw: true, webdriver: false, config: {} };

/** Every local file index.html loads, parsed here independently of tools/build-sw.mjs. */
function loadedFiles(ROOT) {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const out = new Set(['index.html']);
  const localRef = (u) => !/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(u);
  for (const m of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)) if (localRef(m[1])) out.add(m[1]);
  for (const m of html.matchAll(/<link\b[^>]*>/g)) {
    const rel = (/\brel="([^"]+)"/.exec(m[0]) || [])[1], href = (/\bhref="([^"]+)"/.exec(m[0]) || [])[1];
    if (!rel || !href || !localRef(href)) continue;
    if (!['stylesheet', 'manifest', 'apple-touch-icon', 'icon'].includes(rel)) continue;
    out.add(href);
    if (rel === 'stylesheet') {
      const css = fs.readFileSync(path.join(ROOT, href), 'utf8');
      for (const u of css.matchAll(/url\((['"]?)([^)'"]+)\1\)/g)) if (localRef(u[2])) out.add(path.posix.normalize(path.posix.join(path.posix.dirname(href), u[2])));
    }
    if (rel === 'manifest') {
      const man = JSON.parse(fs.readFileSync(path.join(ROOT, href), 'utf8'));
      (man.icons || []).forEach((i) => out.add(path.posix.normalize(path.posix.join(path.posix.dirname(href), i.src))));
    }
  }
  return out;
}

export const tests = {
  'in-app browsers are known by their user agent; the Claude app and plain browsers are not': (ES, assert) => {
    assert.ok(UAS.length >= 15);
    assert.ok(UAS.some((u) => /; wv\).*Claude\/1\.2/.test(u[0]) && u[1] === null), 'the Claude app webview is in the table');
    for (const [ua, want] of UAS) assert.equal(ES.core.pwa.inApp(ua), want, ua);
    assert.equal(ES.core.pwa.inApp(''), null);
    assert.equal(ES.core.pwa.inApp(undefined), null);
  },
  'the worker registers only on https or localhost, top-level, from its own file, outside tests': (ES, assert) => {
    const can = (o) => ES.core.pwa.canRegister(Object.assign({}, OK_ENV, o));
    assert.deepEqual(can({}), { ok: true, reason: 'ok' });
    assert.equal(can({ protocol: 'http:', hostname: 'localhost', origin: 'http://localhost:8000', script: 'http://localhost:8000/js/core/pwa.js' }).ok, true);
    assert.equal(can({ protocol: 'http:', hostname: '127.0.0.1', origin: 'http://127.0.0.1:8000', script: 'http://127.0.0.1:8000/js/core/pwa.js?x' }).ok, true);
    assert.equal(can({ protocol: 'http:', hostname: 'example.org', origin: 'http://example.org' }).reason, 'protocol');
    assert.equal(can({ protocol: 'file:', hostname: '', origin: 'null', script: 'file:///site/js/core/pwa.js' }).reason, 'protocol');
    assert.equal(can({ protocol: 'about:', hostname: '', origin: 'null', script: '' }).reason, 'protocol');      // srcdoc
    assert.equal(can({ origin: 'null' }).reason, 'opaque');
    assert.equal(can({ top: false }).reason, 'frame');
    assert.equal(can({ script: '' }).reason, 'inline');                                  // the single-file build
    assert.equal(can({ script: 'https://cdn.example.net/js/core/pwa.js' }).reason, 'bundled');
    assert.equal(can({ script: 'https://example.github.io/app/bundle.js' }).reason, 'bundled');
    assert.equal(can({ test: true }).reason, 'test-build');
    assert.equal(can({ sw: false }).reason, 'unsupported');
    assert.equal(can({ webdriver: true }).reason, 'automation');
    assert.equal(can({ webdriver: true, config: { pwa: true } }).ok, true);
    assert.equal(can({ config: { pwa: false } }).reason, 'off');
    assert.equal(can({ test: true, config: { pwa: true } }).reason, 'test-build');
  },
  'the in-app notice never shows on file://, srcdoc or opaque frames': (ES, assert) => {
    const ok = (protocol, origin) => ES.core.pwa.noticeAllowed({ protocol, origin });
    assert.equal(ok('https:', 'https://example.github.io'), true);
    assert.equal(ok('http:', 'http://127.0.0.1:8000'), true);
    assert.equal(ok('file:', 'null'), false);
    assert.equal(ok('file:', 'file://'), false);
    assert.equal(ok('about:', 'null'), false);
    assert.equal(ok('about:', 'https://example.github.io'), false);    // srcdoc inherits its parent's origin
    assert.equal(ok('https:', 'null'), false);                          // sandboxed frame
    assert.equal(ok('data:', 'null'), false);
    assert.equal(ok('blob:', 'https://example.github.io'), false);
    assert.equal(ES.core.pwa.KEY, 'earshot.v1.$inapp');
  },
  'without a document the module stays inert': (ES, assert) => {
    ES.core.pwa.start();
    assert.equal(ES.core.pwa.state().started, false);
    assert.equal(ES.core.pwa.env().script, '');
    assert.equal(ES.core.pwa.canRegister(ES.core.pwa.env()).ok, false);
  },
  'the precache list covers every file index.html loads': async (ES, assert, env) => {
    const B = await tool(env, 'build-sw.mjs');
    const list = B.precacheList(B.diskReader(env.ROOT));
    assert.equal(list[0], 'index.html');
    assert.equal(new Set(list).size, list.length, 'no duplicates');
    const want = loadedFiles(env.ROOT);
    for (const f of want) assert.ok(list.includes(f), f + ' is precached');
    for (const f of list) assert.ok(fs.existsSync(path.join(env.ROOT, f)), f + ' exists');
    assert.ok(list.some((f) => f.startsWith('audio/pack-')) && list.some((f) => f.startsWith('fonts/')) && list.some((f) => f.startsWith('data/')));
    assert.ok(!list.includes('sw.js'), 'the worker is not in its own precache');
    // sw.js as committed may lag behind other builders' edits (the pre-push hook checks it); only say so here
    const listed = B.parseBlock(fs.readFileSync(path.join(env.ROOT, 'sw.js'), 'utf8')).files.map((f) => f[0]);
    const extra = list.filter((f) => !listed.includes(f)), gone = listed.filter((f) => !list.includes(f));
    if (extra.length || gone.length) console.log('  ! sw.js lists other files than index.html loads (+' + extra.length + ' −' + gone.length + '): node tools/build-sw.mjs');
  },
  'sw.js: one hash per file; the version changes with any file or with the worker code': async (ES, assert, env) => {
    const B = await tool(env, 'build-sw.mjs');
    const worker = fs.readFileSync(path.join(env.ROOT, 'sw.js'), 'utf8');
    const block = B.parseBlock(worker);
    assert.match(block.version, /^[0-9a-f]{12}$/);
    assert.ok(block.files.length > 50);
    block.files.forEach((f) => assert.match(f[1], /^[0-9a-f]{16}$/, f[0]));
    const read = B.diskReader(env.ROOT);
    const a = B.generate(read, worker), b = B.generate(read, worker);
    assert.equal(a.text, b.text, 'deterministic');
    assert.equal(B.parseBlock(a.text).version, a.version);
    assert.deepEqual(B.parseBlock(a.text).files, a.files);
    const touched = (rel) => { const r = (p) => (p === rel ? Buffer.concat([read(p), Buffer.from('\n')]) : read(p)); return r; };
    assert.notEqual(B.generate(touched('css/base.css'), worker).version, a.version);
    assert.notEqual(B.generate(read, worker.replace("'use strict';", "'use strict'; ")).version, a.version);
    // a missing file fails the build instead of shipping a worker that can never install
    assert.throws(() => B.generate((p) => (p === 'css/base.css' ? null : read(p)), worker), /missing: css\/base\.css/);
    // the generated text keeps the worker code around the block
    const parts = B.splitWorker(a.text);
    assert.equal(parts.before + parts.after, B.splitWorker(worker).before + B.splitWorker(worker).after);
  },
  'git reader: files of a commit, null for paths it does not have': async (ES, assert, env) => {
    // an unpacked release copy has no .git: the reader is only used inside a clone, so there is nothing to test
    if (spawnSync('git', ['-C', env.ROOT, 'rev-parse', '--is-inside-work-tree']).status !== 0) return;
    const B = await tool(env, 'build-sw.mjs');
    const read = B.gitReader('HEAD', env.ROOT);
    const want = spawnSync('git', ['-C', env.ROOT, 'show', 'HEAD:index.html']).stdout;
    assert.ok(read('index.html').equals(want));
    assert.equal(read('no/such/file.js'), null);
    read.prefetch(['index.html', 'css/base.css', 'nope.txt']);
    assert.equal(read('nope.txt'), null);
    assert.ok(read('css/base.css').length > 0);
  },
  'manifest: names, colours from the light theme, start and scope, icons with their sizes': async (ES, assert, env) => {
    const man = JSON.parse(fs.readFileSync(path.join(env.ROOT, 'manifest.webmanifest'), 'utf8'));
    assert.equal(man.name, 'Earshot');
    assert.equal(man.short_name, 'Earshot');
    assert.equal(man.description, 'A free listening trainer for loud rooms, distant talkers and unfamiliar voices. Built by the Chimera community.');
    assert.equal(man.start_url, './');
    assert.equal(man.scope, './');
    assert.equal(man.display, 'standalone');
    const tokens = fs.readFileSync(path.join(env.ROOT, 'css/tokens.css'), 'utf8');
    const bg = /:root\s*\{[^}]*--bg:\s*(#[0-9A-Fa-f]{6})/.exec(tokens)[1];
    assert.equal(man.background_color.toUpperCase(), bg.toUpperCase());
    assert.equal(man.theme_color.toUpperCase(), bg.toUpperCase());
    const { pngInfo, ICONS } = await tool(env, 'make-icons.mjs');
    const purposes = new Set();
    for (const icon of man.icons) {
      const buf = fs.readFileSync(path.join(env.ROOT, icon.src));
      const info = pngInfo(buf);
      assert.ok(info, icon.src + ' is a PNG');
      assert.equal(info.width + 'x' + info.height, icon.sizes, icon.src);
      assert.equal(icon.type, 'image/png');
      if (icon.purpose === 'maskable') assert.equal(info.colourType, 2, icon.src + ' has no transparency');
      purposes.add(icon.purpose + ':' + icon.sizes);
    }
    ['any:192x192', 'any:512x512', 'maskable:192x192', 'maskable:512x512'].forEach((p) => assert.ok(purposes.has(p), p));
    for (const icon of ICONS) assert.ok(fs.existsSync(path.join(env.ROOT, icon.file)), icon.file);
    const apple = pngInfo(fs.readFileSync(path.join(env.ROOT, 'icons/apple-touch-icon.png')));
    assert.deepEqual([apple.width, apple.height, apple.colourType], [180, 180, 2]);
  },
  'index.html links the manifest and the home-screen icon; the single file leaves both out': async (ES, assert, env) => {
    const html = fs.readFileSync(path.join(env.ROOT, 'index.html'), 'utf8');
    assert.match(html, /<link rel="manifest" href="manifest\.webmanifest">/);
    assert.match(html, /<link rel="apple-touch-icon" href="icons\/apple-touch-icon\.png">/);
    assert.match(html, /<script src="js\/core\/pwa\.js"><\/script>/);
    const { build } = await tool(env, 'build-single.mjs');
    const single = build({}).html;
    assert.doesNotMatch(single, /rel="manifest"/);
    assert.doesNotMatch(single, /rel="apple-touch-icon"/);
    assert.doesNotMatch(single, /<script src=/);
    assert.match(single, /\/\* js\/core\/pwa\.js \*\//, 'the module is inlined (and so never registers a worker)');
  }
};
