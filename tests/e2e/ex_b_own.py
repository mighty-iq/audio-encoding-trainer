#!/usr/bin/env python3
"""exB browser test: voices from your life (screen 'voices-own').
file:// — the add buttons wait for a name and the consent tick; an imported voice note (stereo 44.1 kHz WAV made
here, a synthetic voice-like sound) is trimmed, resampled and stored in IndexedDB as 16 kHz mono WAV without the
file's name; it survives a reload; a text file and a silent file get plain messages; a recording works where the
page may use the microphone (Chromium's fake device); practice runs a round of 8 and stores a level; a backup
export never contains the voices; delete and delete-all remove them.
srcdoc — the app (every script inlined) in a sandboxed srcdoc iframe (opaque origin): the screen says saving is blocked, recording
says it is blocked here, and an imported voice still works for the visit (memory only); no page errors.
Run:  tools/with-browser.sh python3 tests/e2e/ex_b_own.py     Outputs: tests/out/exb/own-*.png, ex_b_own.json. MIT."""
import math
import pathlib
import struct
import sys
import time

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import ex_b_common as C  # noqa: E402


def voice_wav(path, sr=44100, dur=4.0, f0=140.0, silent=False):
    """A synthetic voice-like sound (harmonic complex, syllable-rate envelope): no recording of anyone."""
    n, frames = int(sr * dur), bytearray()
    for i in range(n):
        t = i / sr
        env = 0.0 if silent else (0.5 * (1 - math.cos(2 * math.pi * 4 * t)) if 0.3 < t < dur - 0.3 else 0.0)
        s = sum(math.sin(2 * math.pi * f0 * k * t) / k for k in range(1, 11)) * 0.25 * env
        v = int(max(-1, min(1, s)) * 32767)
        frames += struct.pack('<hh', v, v)
    hdr = b'RIFF' + struct.pack('<I', 36 + len(frames)) + b'WAVEfmt ' + struct.pack('<IHHIIHH', 16, 1, 2, sr, sr * 4, 4, 16) + b'data' + struct.pack('<I', len(frames))
    pathlib.Path(path).write_bytes(hdr + frames)
    return path


def add_voice(page_or_frame, name, path):
    f = page_or_frame
    f.fill('[data-own-name]', name)
    f.check('[data-own-consent]')
    f.set_input_files('[data-own-file]', str(path))


def file_part(p, rep, wav, silent, txt):
    b = C.launch(p, ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'])
    ctx, page = C.new_page(b, 'phone-s')
    url = C.build_page('own.html')
    C.boot(page, url)
    page.evaluate("() => ES.core.router.go('voices-own')")
    page.wait_for_selector('.own-add')
    rep.check('file: add buttons wait for a name and consent', page.locator('[data-own-import]').is_disabled() and page.locator('[data-own-record]').is_disabled())
    page.fill('[data-own-name]', 'Sam')
    rep.check('file: a name alone is not enough', page.locator('[data-own-import]').is_disabled())
    page.check('[data-own-consent]')
    rep.check('file: name + consent enable import', not page.locator('[data-own-import]').is_disabled())
    page.set_input_files('[data-own-file]', str(wav))
    page.wait_for_selector('[data-own-voice]', timeout=15000)
    rec = page.evaluate("""() => ES.ex.voicesOwn.list().then(function (a) { var r = a[0], u = new Uint8Array(r.wav);
      return { n: a.length, keys: Object.keys(r).sort(), name: r.name, sr: r.sr, dur: r.dur, riff: String.fromCharCode(u[0], u[1], u[2], u[3]),
        rate: new DataView(r.wav).getUint32(24, true), ch: new DataView(r.wav).getUint16(22, true), mode: ES.ex.voicesOwn.mode() }; })""")
    rep.check('file: stored in IndexedDB as 16 kHz mono WAV', rec['n'] == 1 and rec['mode'] == 'saved' and rec['riff'] == 'RIFF' and rec['rate'] == 16000 and rec['ch'] == 1, rec)
    rep.check('file: the record keeps no file name or file metadata', rec['keys'] == ['at', 'consent', 'dur', 'id', 'kind', 'name', 'sr', 'wav'], rec['keys'])
    rep.check('file: trimmed to the sound (about 3.5 s of 4 s)', 3.0 <= rec['dur'] <= 3.9, rec['dur'])
    C.shot(page, 'own-list')
    for path, want, label in ((txt, 'could not be read as audio', 'a text file'), (silent, 'silent', 'a silent file')):
        add_voice(page, 'Bad', path)
        page.wait_for_function("(w) => document.querySelector('.own-msg').textContent.indexOf(w) >= 0", arg=want, timeout=10000)
        rep.check('file: %s gets a plain message' % label, True, page.inner_text('.own-msg'))
    page.reload()
    page.wait_for_selector('html.ready')
    try:   # the light welcome on later launches
        page.wait_for_selector('.sheet-chimera', timeout=4000)
        page.click('.sheet-chimera .btn-primary')
        page.wait_for_selector('.sheet-chimera', state='detached', timeout=5000)
    except Exception:  # noqa: BLE001
        pass
    page.evaluate("() => ES.core.router.go('voices-own')")
    page.wait_for_selector('[data-own-voice]', timeout=10000)
    rep.check('file: the voice is still there after a reload', page.locator('[data-own-voice]').count() == 1)
    # recording where the page may use the microphone (Chromium's fake device)
    page.fill('[data-own-name]', 'Alex')
    page.check('[data-own-consent]')
    page.click('[data-own-record]')
    try:
        page.wait_for_selector('[data-own-stop]', timeout=8000)
        time.sleep(2.2)
        page.click('[data-own-stop]')
        page.wait_for_function("() => document.querySelectorAll('[data-own-voice]').length === 2", timeout=15000)
        rep.check('file: a recording is saved where the microphone is allowed', 'recorded here' in page.inner_text('.own-list'))
    except Exception as e:  # noqa: BLE001
        rep.check('file: a recording is saved where the microphone is allowed', False, page.inner_text('.own-msg') + ' ' + str(e)[:120])
    page.locator('[data-own-play]').first.click()
    time.sleep(0.5)
    # practice: one round
    page.locator('[data-own-practise]').first.click()
    page.wait_for_selector('.own-trial .trial-body', timeout=15000)
    t0 = time.time()
    while time.time() - t0 < 120 and page.locator('[data-own-summary]').count() == 0:
        st = C.state(page)
        if st['trial'] == 'answer':
            a = page.evaluate("() => ES.ui.trialView.current.trial.question.slots[0].answer")
            if not C.fits(page)['ok']:
                rep.check('file: practice trial fits 360×640', False, C.fits(page))
            C.answer(page, [a])
        elif st['trial'] == 'feedback' and st['next'] and st['playing'] != 'auto':
            page.locator('[data-next]').first.click()
        time.sleep(0.2)
    rep.check('file: a practice round of 8 ends with a summary', page.locator('[data-own-summary]').count() == 1)
    C.shot(page, 'own-summary')
    lvl = page.evaluate("() => ES.ex.voicesOwn.list().then(function (a) { return ES.ex.voicesOwn.getState('level:' + a[0].id); })")
    rep.check('file: the practice level is stored with the voice', bool(lvl) and isinstance(lvl.get('level'), (int, float)), lvl)
    page.click('[data-own-done]')
    page.wait_for_selector('[data-own-voice]', timeout=10000)
    exp = page.evaluate("() => JSON.stringify(ES.core.store.exportAll())")
    rep.check('file: a backup export holds no voice from your life', 'Sam' not in exp and 'RIFF' not in exp and 'earshot-own' not in exp, len(exp))
    page.locator('[data-own-delete]').first.click()
    page.locator('.sheet .btn-danger').click()
    page.wait_for_function("() => document.querySelectorAll('[data-own-voice]').length === 1", timeout=10000)
    rep.check('file: delete asks first, then removes the voice', True)
    page.locator('[data-own-wipe]').click()
    page.locator('.sheet .btn-danger').click()
    page.wait_for_function("() => document.querySelectorAll('[data-own-voice]').length === 0", timeout=10000)
    n = page.evaluate("() => ES.ex.voicesOwn.list().then(function (a) { return a.length; })")
    rep.check('file: delete all leaves nothing', n == 0, n)
    errs = C.errors(page)
    rep.check('file: no page errors', not errs, errs[:4])
    b.close()


def srcdoc_part(p, rep, wav):
    url = C.srcdoc_page('own-srcdoc-host.html')   # the app with every script inlined, in <iframe sandbox="allow-scripts" srcdoc>
    b = C.launch(p)
    ctx, page = C.new_page(b, 'phone')
    page.goto(url)
    page.wait_for_timeout(400)
    fr = page.frames[1]
    fr.wait_for_function("() => window.ES && document.documentElement.classList.contains('ready')", timeout=20000)
    fl = page.frame_locator('iframe')
    try:
        fl.locator('.sheet-chimera .btn-primary').first.click(timeout=5000)
    except Exception:  # noqa: BLE001
        pass
    fr.evaluate("() => ES.core.router.go('voices-own')")
    fl.locator('.own-add').wait_for(timeout=10000)
    time.sleep(0.4)
    store = fl.locator('.own-store').inner_text()
    rep.check('srcdoc: the screen says saving is blocked here', 'blocked' in store.lower(), store)
    norec = fl.locator('[data-own-norec]')
    rep.check('srcdoc: recording says it is blocked here', norec.count() == 1 and 'blocked' in norec.inner_text().lower(), norec.count() and norec.inner_text())
    fl.locator('[data-own-name]').fill('Sam')
    fl.locator('[data-own-consent]').check()
    rep.check('srcdoc: the record button stays off', fl.locator('[data-own-record]').is_disabled())
    fl.locator('[data-own-file]').set_input_files(str(wav))
    fl.locator('[data-own-voice]').wait_for(timeout=15000)
    rep.check('srcdoc: an imported voice works for the visit (memory only)', fr.evaluate("() => ES.ex.voicesOwn.mode()") == 'memory')
    C.shot(page, 'own-srcdoc')
    errs = [e for e in C.errors(page) if 'favicon' not in e]
    rep.check('srcdoc: no page errors', not errs, errs[:4])
    b.close()


def main():
    rep = C.Report('ex_b_own')
    C.OUT.mkdir(parents=True, exist_ok=True)
    wav = voice_wav(str(C.OUT / 'friend.wav'))
    silent = voice_wav(str(C.OUT / 'silent.wav'), silent=True)
    txt = C.OUT / 'note.txt'
    txt.write_text('not audio')
    with sync_playwright() as p:
        file_part(p, rep, wav, silent, txt)
        srcdoc_part(p, rep, wav)
    return rep.done()


if __name__ == '__main__':
    sys.exit(main())
