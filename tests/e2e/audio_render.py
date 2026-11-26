#!/usr/bin/env python3
"""Browser tests for js/audio (Chromium via Playwright), on the synthetic fixture pack. Run inside the browser lock:
    flock /tmp/earshot-browser.lock python3 tests/e2e/audio_render.py [--quick]
Checks: SNR and TMR within +-0.25 dB of the spec, measured independently (NumPy P.56) on the rendered stems; stems sum
to the mix; output active level +-0.5 dB; no sample above -1 dBFS; DRR = 20 log10(dc/dist) and 6 dB per doubling;
identical output for the same seed; every fx type; assets cache; file:// and a sandboxed srcdoc iframe; live scene;
render time <= 250 ms for a 3 s trial (room + 3 parts + bed) under 4x CPU throttling. Exit code 1 on any failure.
MIT licence."""
import json
import pathlib
import statistics
import sys

import numpy as np
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import audio_p56 as M  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parents[2]
PAGE = ROOT / 'tests' / 'e2e' / 'audio_page.html'
BAB = ['fx.bab%d.sentence.long' % i for i in range(6)]
TOL, OUT_TOL, CEIL = 0.25, 0.5, 10 ** (-1 / 20)
results = []


def check(name, ok, detail=''):
    results.append((name, bool(ok), detail))
    print('%s  %s  %s' % ('PASS' if ok else 'FAIL', name, detail), flush=True)


def part(clip, at, db, role, az=0, room=False, **kw):
    p = {'clip': clip, 'at': at, 'db': db, 'role': role, 'az': az}
    if room:
        p['room'] = True
    p.update(kw)
    return p


CASES = {
    'crowd-mono': ({'spatial': 'mono', 'parts': [part('fx.a.phrase.one', 0.5, 0, 'target'), part('fx.b.phrase.one', 0.55, -3, 'masker')],
                    'beds': [{'kind': 'babble', 'db': -2, 'clips': BAB[:4]}]}, {'tmr': 3, 'snr': 2}),
    'crowd-ild': ({'spatial': 'ild', 'parts': [part('fx.c.phrase.one', 0.4, 0, 'target'), part('fx.b.phrase.two', 0.45, -1, 'masker', 60),
                                                part('fx.d.phrase.one', 0.5, -4, 'masker', -45)],
                   'beds': [{'kind': 'ssn', 'db': -6}]}, {'tmr': 1, 'snr': 6}),
    'crowd-hrtf': ({'spatial': 'hrtf', 'parts': [part('fx.e.phrase.one', 0.5, 0, 'target', 30), part('fx.a.phrase.two', 0.5, 2, 'masker', -60),
                                                  part('fx.b.phrase.one', 0.6, -2, 'masker', 90)],
                    'beds': [{'kind': 'babble', 'db': -3, 'clips': BAB}]}, {'tmr': -2, 'snr': 3}),
    'far-ear-hrtf': ({'spatial': 'hrtf', 'room': {'rt60': 0.9, 'dist': 6, 'size': 'large', 'seed': 5},
                      'parts': [part('fx.c.phrase.two', 0.2, 0, 'cue', 0, True), part('fx.a.phrase.one', 1.4, 0, 'target', 0, True),
                                part('fx.d.phrase.two', 1.5, -6, 'masker', -70, True, dist=2)],
                      'beds': [{'kind': 'ssn', 'db': -4, 'room': True}]}, {'tmr': 6, 'snr': 4}),
    'far-ear-ild': ({'spatial': 'ild', 'room': {'rt60': 2.4, 'dist': 12, 'size': 'hall', 'seed': 9},
                     'parts': [part('fx.b.phrase.one', 0.3, 0, 'target', -20, True)],
                     'beds': [{'kind': 'ambience', 'db': 3, 'bed': 'fx.bed.cafe'}]}, {'snr': -3}),
    'far-ear-mono': ({'spatial': 'mono', 'room': {'rt60': 0.5, 'dist': 3, 'size': 'small', 'seed': 2},
                      'parts': [part('fx.e.phrase.two', 0.3, 0, 'target', 0, True), part('fx.c.phrase.one', 0.3, -2, 'masker', 0, True, dist=1)],
                      'beds': [{'kind': 'pink', 'db': -10}]}, {'tmr': 2, 'snr': 10}),
}


def stems_of(out):
    return {k: np.vstack([M.f32(c) for c in v]) for k, v in out['stems'].items()}


def part_levels(out, sr):
    """Active level of each part (its direct + room stems), keyed by clip+role, from the full stem list."""
    acc = {}
    for s in out['stemList']:
        if s['kind'] == 'bed':
            continue
        key = s['role'] + ':' + s['clip']
        x = np.vstack([M.f32(c) for c in s['ch']])
        acc[key] = acc[key] + x if key in acc else x
    return {k: M.active_db(v, sr) for k, v in acc.items()}


def level_checks(name, out, want):
    sr, rep = out['sr'], out['report']
    mix = np.vstack([M.f32(c) for c in out['mix']])
    st = stems_of(out)
    total = sum(st.values())
    check(name + ': stems sum to the mix', np.max(np.abs(total - mix)) < 2e-5, 'max diff %.2e' % np.max(np.abs(total - mix)))
    a, b = int(round(rep['span'][0] * sr)), int(round(rep['span'][1] * sr))
    tgt = M.active_db(st['target'], sr)
    pl = part_levels(out, sr)
    if 'tmr' in want:
        mks = [v for k, v in pl.items() if k.startswith('masker:')]
        tmr = tgt - max(mks)
        check(name + ': TMR %+.1f dB' % want['tmr'], abs(tmr - want['tmr']) <= TOL and abs(rep['tmrDb'] - tmr) <= TOL,
              'measured %+.3f, report %+.2f' % (tmr, rep['tmrDb']))
    if 'snr' in want:
        snr = tgt - M.rms_db(st['bed'], a, b)
        check(name + ': SNR %+.1f dB' % want['snr'], abs(snr - want['snr']) <= TOL and abs(rep['snrDb'] - snr) <= TOL,
              'measured %+.3f, report %+.2f' % (snr, rep['snrDb']))
    outdb = M.active_db(mix, sr)
    check(name + ': output level', abs(outdb + 20) <= OUT_TOL and abs(rep['outDb'] + 20) <= OUT_TOL, 'measured %.3f, report %.2f' % (outdb, rep['outDb']))
    pk = float(np.max(np.abs(mix)))
    check(name + ': peak <= -1 dBFS', pk <= CEIL + 1e-6, 'peak %.2f dBFS' % (20 * np.log10(pk)))
    if not rep['warnings'] == []:
        check(name + ': no warnings', False, json.dumps(rep['warnings']))
    return rep


def drr_of(out, clip):
    d = r = 0.0
    for s in out['stemList']:
        if s['clip'] == clip and s['role'] == 'target':
            e = M.energy(np.vstack([M.f32(c) for c in s['ch']]))
            if s['kind'] == 'dir':
                d += e
            elif s['kind'] == 'rev':
                r += e
    return 10 * np.log10(d / r)


def run_levels(pg):
    for name, (audio, want) in CASES.items():
        out = pg.evaluate('a => T.run({audio: a}, {seed: 21, stems: "all"})', audio)
        rep = level_checks(name, out, want)
        if audio.get('room'):
            ro = audio['room']
            tclip = [p['clip'] for p in audio['parts'] if p['role'] == 'target'][0]
            air = [p.get('airDb') or 0 for p in rep['parts'] if p['role'] == 'target'][0]
            drr, want_drr = drr_of(out, tclip), 20 * np.log10(rep['dc'] / ro['dist']) + air
            check(name + ': DRR = 20 log10(dc/dist)', abs(drr - want_drr) <= TOL, 'measured %.2f, expected %.2f (dc %.2f m, air %.2f dB)' % (drr, want_drr, rep['dc'], air))


def run_source_levels(pg):
    """levels 'source': the direct sound falls 6 dB per doubling against a fixed bed; DRR falls 6 dB per doubling."""
    meas = {}
    for dist in (2, 4, 8):
        audio = {'spatial': 'ild', 'room': {'rt60': 0.7, 'dist': dist, 'size': 'medium', 'seed': 3, 'levels': 'source'},
                 'parts': [part('fx.a.phrase.one', 0.3, 0, 'target', 0, True)], 'beds': [{'kind': 'ssn', 'db': -10}]}
        out = pg.evaluate('a => T.run({audio: a}, {seed: 5, stems: "all"})', audio)
        sr, rep = out['sr'], out['report']
        a, b = int(round(rep['span'][0] * sr)), int(round(rep['span'][1] * sr))
        dirs = [np.vstack([M.f32(c) for c in s['ch']]) for s in out['stemList'] if s['kind'] == 'dir']
        bed = [np.vstack([M.f32(c) for c in s['ch']]) for s in out['stemList'] if s['kind'] == 'bed'][0]
        meas[dist] = (M.active_db(dirs[0], sr) - M.rms_db(bed, a, b), drr_of(out, 'fx.a.phrase.one'), rep)
    for d1, d2 in ((2, 4), (4, 8)):
        dl, dd = meas[d1][0] - meas[d2][0], meas[d1][1] - meas[d2][1]
        check('source levels: direct sound -6 dB per doubling (%g->%g m)' % (d1, d2), abs(dl - 6.02) <= TOL, 'measured %.2f dB' % dl)
        check('source levels: DRR -6 dB per doubling (%g->%g m)' % (d1, d2), abs(dd - 6.02) <= TOL, 'measured %.2f dB' % dd)
    check('source levels: SNR falls with distance', meas[2][2]['snrDb'] > meas[4][2]['snrDb'] > meas[8][2]['snrDb'],
          'snr %s' % [meas[d][2]['snrDb'] for d in (2, 4, 8)])


def run_determinism(pg):
    audio = CASES['far-ear-hrtf'][0]
    h1 = pg.evaluate('a => T.hash({audio: a}, {seed: 11})', audio)['hash']
    h2 = pg.evaluate('a => T.hash({audio: a}, {seed: 11})', audio)['hash']
    h3 = pg.evaluate('a => T.hash({audio: a}, {seed: 12})', audio)['hash']
    check('determinism: same seed, same output', h1 == h2, h1)
    check('determinism: another seed, other output', h1 != h3, h3)
    alone = {'spatial': 'mono', 'parts': [part('fx.a.phrase.one', 0.5, 0, 'target', fx=[{'type': 'vocode', 'bands': 8}])]}
    mix = dict(alone, parts=alone['parts'] + [part('fx.b.phrase.one', 0.5, -3, 'masker')])
    o1 = pg.evaluate('a => T.run({audio: a}, {seed: 4})', alone)
    o2 = pg.evaluate('a => T.run({audio: a}, {seed: 4})', mix)
    t1, t2 = M.f32(o1['stems']['target'][0]), M.f32(o2['stems']['target'][0])
    k = min(len(t1), len(t2))
    t1, t2 = t1[:k], t2[:k]
    corr = float(np.dot(t1, t2) / np.sqrt(np.dot(t1, t1) * np.dot(t2, t2)))
    check('determinism: "target alone" replay processes the target as in the mix', corr > 0.9999, 'correlation %.6f' % corr)


FX = [{'type': 'wsola', 'rate': 2}, {'type': 'wsola', 'rate': 0.67}, {'type': 'resample', 'ratio': 0.94},
      {'type': 'vocode', 'bands': 16}, {'type': 'vocode', 'bands': 4, 'carrier': 'tone'}, {'type': 'whisper'},
      {'type': 'band', 'lo': 300, 'hi': 3400}, {'type': 'tilt', 'db': -6}, {'type': 'gate', 'rateHz': 3, 'duty': 0.5, 'fill': 'noise'},
      {'type': 'mask', 't0': 0.6, 't1': 0.9, 'fill': 'noise', 'db': 3}, {'type': 'mask', 't0': 0.6, 't1': 0.9, 'fill': 'silence'},
      {'type': 'lowpass', 'f': 1500}]


def run_fx(pg):
    for fx in FX:
        audio = {'spatial': 'mono', 'parts': [part('fx.c.phrase.one', 0.2, 0, 'target', fx=[fx])], 'beds': [{'kind': 'ssn', 'db': -5}]}
        out = pg.evaluate('a => T.run({audio: a}, {seed: 8})', audio)
        rep, sr = out['report'], out['sr']
        st = stems_of(out)
        a, b = int(round(rep['span'][0] * sr)), int(round(rep['span'][1] * sr))
        snr = M.active_db(st['target'], sr) - M.rms_db(st['bed'], a, b)
        mix = np.vstack([M.f32(c) for c in out['mix']])
        ok = abs(snr - 5) <= TOL and abs(M.active_db(mix, sr) + 20) <= OUT_TOL and np.max(np.abs(mix)) <= CEIL + 1e-6 and not rep['warnings']
        check('fx %s' % json.dumps(fx), ok, 'snr %.2f, dur %.2f s, warnings %s' % (snr, rep['dur'], rep['warnings']))
    base = pg.evaluate('a => T.report({audio: a})', {'parts': [part('fx.a.phrase.one', 0, 0, 'target')]})['dur']
    fast = pg.evaluate('a => T.report({audio: a})', {'parts': [part('fx.a.phrase.one', 0, 0, 'target', fx=[{'type': 'wsola', 'rate': 2}])]})['dur']
    check('fx wsola rate 2 halves the clip', abs((fast - 0.15) / (base - 0.15) - 0.5) < 0.02, 'durations %.2f -> %.2f s' % (base, fast))
    loud = pg.evaluate('a => T.report({audio: a})', {'out': {'db': -6}, 'parts': [part('fx.d.phrase.one', 0, 0, 'target')]})
    check('limiter holds peaks at -1 dBFS when the level asks for more', loud['peakDb'] <= -1 + 1e-3 and loud['limitDb'] < 0,
          'peak %.2f, limit %.2f dB, out %.2f' % (loud['peakDb'], loud['limitDb'], loud['outDb']))


def run_assets(pg):
    r = pg.evaluate('''async () => {
      const a = ES.audio.assets, id = 'fx.a.phrase.one';
      const out = { has: a.has(id), missing: a.has('nope'), meta: !!a.meta(id), sr: a.sampleRate() };
      const b = await a.buffer(id); out.bufSr = b.sampleRate; out.ch = b.numberOfChannels;
      try { await a.buffer('nope'); out.rejects = false; } catch (e) { out.rejects = true; }
      a.setLimit(10); out.afterLimit = a.stats();
      const p = await a.preload(Object.keys(ES.packs.fixture)); out.failed = p.failed.length; out.afterPreload = a.stats();
      a.setLimit(60); await a.preload(Object.keys(ES.packs.fixture)); out.full = a.stats();
      a.release([id]); out.released = a.stats();
      return out; }''')
    check('assets: has/meta/buffer at 16 kHz mono, missing clip rejects', r['has'] and not r['missing'] and r['meta'] and r['bufSr'] == 16000 and r['ch'] == 1 and r['rejects'], json.dumps(r))
    check('assets: LRU keeps decoded audio under the limit', r['afterPreload']['seconds'] <= 10 + 3.6 and r['failed'] == 0 and r['full']['seconds'] <= 60,
          'limit 10 s -> %.1f s; limit 60 s -> %.1f s' % (r['afterPreload']['seconds'], r['full']['seconds']))


SRCDOC_RUN = '''<script>
ES.audio.render({audio: %s}, {seed: 3}).then(function (r) { parent.postMessage({ok: true, report: r.report, origin: String(location.origin)}, '*'); },
  function (e) { parent.postMessage({ok: false, error: String(e && e.message || e)}, '*'); });
</script>'''


def run_srcdoc(pw):
    scripts = []
    html = PAGE.read_text()
    import re
    for src in re.findall(r'<script src="([^"]+)"></script>', html):
        scripts.append((PAGE.parent / src).resolve().read_text())
    audio = CASES['far-ear-hrtf'][0]
    doc = '<!DOCTYPE html><html><body>' + ''.join('<script>%s</script>' % s.replace('</script', '<\\/script') for s in scripts) + \
          SRCDOC_RUN % json.dumps(audio) + '</body></html>'
    b = pw.chromium.launch()
    pg = b.new_page()
    pg.set_content('<html><body><iframe id="f" sandbox="allow-scripts"></iframe><script>window.__res = null; '
                   'addEventListener("message", function (e) { window.__res = e.data; });</script></body></html>')
    pg.evaluate('d => { document.getElementById("f").srcdoc = d; }', doc)
    pg.wait_for_function('window.__res !== null', timeout=20000)
    res = pg.evaluate('window.__res')
    b.close()
    ok = res.get('ok') and abs(res['report']['tmrDb'] - 6) <= TOL and abs(res['report']['snrDb'] - 4) <= TOL
    check('sandboxed srcdoc iframe (opaque origin) renders', ok, 'origin %s, report tmr %s snr %s %s' % (
        res.get('origin'), res.get('report', {}).get('tmrDb'), res.get('report', {}).get('snrDb'), res.get('error', '')))


def run_live(pw):
    b = pw.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page()
    pg.goto(PAGE.as_uri())
    r = pg.evaluate('''async () => {
      await ES.audio.ctx.unlock();
      const s = ES.audio.live.scene({bed: {kind: 'babble', db: -2, clips: ['fx.bab0.sentence.long', 'fx.bab1.sentence.long']},
        target: {clip: 'fx.a.phrase.one', x: 0.5, y: 0.5, db: 0, gapMs: 400}, decoys: [{clip: 'fx.b.phrase.one', x: -0.5, y: 0.2, db: -3}],
        radius: 10, spatial: 'hrtf', seed: 2});
      await s.start();
      s.listener(-0.9, -0.9, 0); await new Promise(r => setTimeout(r, 300)); const far = s.state();
      s.listener(0.45, 0.45, 45); await new Promise(r => setTimeout(r, 300)); const near = s.state();
      s.listener(0.45, 0.45, 135); const turned = s.state();
      const snrFar = s.snrAt(-0.9, -0.9), snrNear = s.snrAt(0.45, 0.45);
      s.stop();
      return {state: ES.audio.ctx.state(), far, near, turned, snrFar, snrNear}; }''')
    b.close()
    tf, tn = r['far']['voices'][0], r['near']['voices'][0]
    check('live scene: target louder and nearer when the listener walks up', tn['gainDb'] > tf['gainDb'] + 15 and r['snrNear'] > r['snrFar'],
          'gain %.1f -> %.1f dB, snr %.1f -> %.1f, ctx %s' % (tf['gainDb'], tn['gainDb'], r['snrFar'], r['snrNear'], r['state']))
    check('live scene: turning the head moves the target azimuth', abs(r['turned']['voices'][0]['az'] - (tn['az'] - 90)) < 1,
          'az %.1f -> %.1f' % (tn['az'], r['turned']['voices'][0]['az']))


TIMING = {'spatial': 'hrtf', 'room': {'rt60': 0.8, 'dist': 4, 'size': 'medium', 'seed': 31},
          'parts': [part('fx.a.phrase.one', 0.3, 0, 'target', 0, True), part('fx.b.phrase.one', 0.35, -3, 'masker', 40, True, dist=3),
                    part('fx.d.phrase.one', 0.5, -3, 'masker', -50, True, dist=2)],
          'beds': [{'kind': 'babble', 'db': -3, 'clips': BAB[:4], 'room': True}], 'dur': 3.0}


def run_timing(pw, quick):
    b = pw.chromium.launch()
    pg = b.new_page()
    pg.goto(PAGE.as_uri())
    pg.evaluate('T.ready()')
    cdp = pg.context.new_cdp_session(pg)
    cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4})
    n = 3 if quick else 7
    for spatial in ('hrtf', 'ild', 'mono'):
        audio = dict(TIMING, spatial=spatial)
        pg.evaluate('a => T.time({audio: a}, {}, 2, false)', audio)  # warm-up (JIT, HRTF database, room response)
        warm = pg.evaluate('a => T.time({audio: a}, {}, %d, false)' % n, audio)
        cold = pg.evaluate('a => T.time({audio: a}, {}, %d, true)' % n, audio)
        mw, mc = statistics.median(warm), statistics.median(cold)
        check('timing 4x CPU, %s, room + 3 parts + bed, 3 s: median <= 250 ms' % spatial, mw <= 250,
              'same room: median %.0f ms (max %.0f); new room each time: median %.0f ms (max %.0f)' % (mw, max(warm), mc, max(cold)))
    cdp.send('Emulation.setCPUThrottlingRate', {'rate': 1})
    b.close()


def main():
    quick = '--quick' in sys.argv
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page()
        errors = []
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.goto(PAGE.as_uri())  # file://
        ready = pg.evaluate('T.ready()')
        check('file:// page loads and decodes every fixture clip', not ready['failed'] and ready['sr'] == 16000, json.dumps(ready))
        run_levels(pg)
        run_source_levels(pg)
        run_determinism(pg)
        run_fx(pg)
        run_assets(pg)
        check('no page errors', not errors, '; '.join(errors[:3]))
        b.close()
        run_srcdoc(pw)
        run_live(pw)
        run_timing(pw, quick)
    bad = [r for r in results if not r[1]]
    print('\n%d checks, %d failed' % (len(results), len(bad)))
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
