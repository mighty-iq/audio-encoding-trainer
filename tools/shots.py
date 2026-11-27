#!/usr/bin/env python3
"""Figures for the player guide: docs/guide/figures/<name>.png, from SIMULATED profiles only.

    tools/with-browser.sh python3 tools/shots.py [--only home,map,...] [--allow-stale]

1. Builds the single-file app into tests/out/guide/earshot.html with tools/build-single.mjs (git-ignored; index.html
   and dist/ are never touched). If index.html's script block is stale the script stops: run the shell's
   `node tools/build-index.mjs` first (or pass --allow-stale).
2. Opens it in headless Chromium at a phone size (390 x 844 CSS px, 2x pixels, light theme, UTC clock, en-GB) with a
   simulated player: the long-term learner, log and game records of tests/fixtures/game-longterm.js (a simulated
   learner, no real player data; times shifted so its last session ended a day ago) and a Lab history drawn by
   lab_history() below from a stated model (seeded; no real runs).
3. Shoots: the home screen, the Exercises list, a Crowd trial (the feedback after picking another voice's words), a
   Far trial (the room picture), the Night out map, the Lab trend card, one answer screen each for Strange voices,
   Repair, Echo, Seek and Voices, and the Results screen after a short Crowd set answered in a fixed pattern (right,
   partly right, wrong) by the script. Trials start through the shell's own session API with pinned dials (the venue-set
   mechanism), so the condition in each picture is known; figures.json records what each picture shows (exercise,
   dials, level text) so captions can be checked against it.
The browser holds one of the two machine-wide slots (run under tools/with-browser.sh). MIT licence."""
import os
os.environ['TZ'] = 'UTC'   # the container keeps a private time zone: no figure may show its clock
import json
import pathlib
import random
import subprocess
import sys
import time

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tests' / 'e2e'))
from playwright.sync_api import sync_playwright  # noqa: E402

import harness as H  # noqa: E402
from game_common import longterm_records  # noqa: E402

FIG = ROOT / 'docs' / 'guide' / 'figures'
APP = ROOT / 'tests' / 'out' / 'guide' / 'earshot.html'
PHONE = (390, 844)
DAY = 86400000


def build():
    chk = subprocess.run(['node', str(ROOT / 'tools' / 'build-index.mjs'), '--check'], capture_output=True, text=True)
    if chk.returncode != 0 and '--allow-stale' not in sys.argv:
        sys.exit('index.html is out of date (' + chk.stdout.strip() + '): run `node tools/build-index.mjs` first, or pass --allow-stale')
    out = subprocess.run(['node', str(ROOT / 'tools' / 'build-single.mjs'), '--out', str(APP.relative_to(ROOT))],
                         cwd=str(ROOT), capture_output=True, text=True, check=True)
    print(out.stdout.strip())


def lab_history(seed=11, now_ms=None):
    """A simulated Lab record (no real runs): Matrix baseline (a practice run, then two measured runs on the next two
    days) and four weekly check-ins with two Matrix runs each, as js/lab/schedule.js plans them while the verdict is
    not clear. Model: true threshold -5.8 dB at the start, improving 0.4 dB a week; the first run of all is 1.2 dB
    worse (practice); each run adds Gaussian noise with SD 0.55 dB (the probe's working SD is 0.6 dB)."""
    rnd = random.Random(seed)
    now = now_ms or int(time.time() * 1000)
    t0 = now - 31 * DAY
    plan = [(0, True), (1, False), (2, False)] + [(d, False) for w in range(1, 5) for d in (2 + 7 * w, 2 + 7 * w)]
    runs = []
    for i, (day, practice) in enumerate(plan):
        true = -5.8 - 0.4 * (day / 7.0) + (1.2 if practice else 0.0)
        y = round(true + rnd.gauss(0, 0.55), 2)
        at = int(t0 + day * DAY + (i % 2) * 300000 + 19 * 3600000)
        runs.append({'id': 'sim%d' % i, 'probe': 'matrix', 'at': at, 'end': at + 180000, 'practice': practice,
                     'kind': 'baseline' if day <= 2 else 'weekly', 'proc': 'matrix-1', 'est': {'m': y, 's': 0.5},
                     'n': 20, 'unit': 'dB', 'hp': False})
    return {'v': 1, 'runs': runs, 'pid': 'psimulated01'}


def records():
    recs = longterm_records()
    recs['profile']['settings']['theme'] = 'light'
    recs['lab'] = lab_history()
    return recs


def new_page(browser, recs, viewport=PHONE):
    ctx = browser.new_context(viewport={'width': viewport[0], 'height': viewport[1]}, device_scale_factor=2,
                              color_scheme='light', timezone_id='UTC', locale='en-GB', has_touch=True)
    ctx.add_init_script(H.preset(recs))
    tab = H.Tab(ctx.new_page())
    tab.page.goto(APP.as_uri())
    H.wait_ready(tab.page)
    H.close_sheets(tab.page)
    tab.page.wait_for_timeout(300)
    return tab


def settle(page):
    """No focus ring or hover state in a figure (the app focuses the first key for keyboard users)."""
    page.evaluate("() => { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); }")
    page.mouse.move(1, 1)
    page.wait_for_timeout(250)


def compact(path):
    """Re-save a screenshot as a 256-colour PNG without dithering: flat interface colours survive intact, the file
    (and the PDF that embeds it) shrinks to about a quarter, and no metadata is kept."""
    from PIL import Image
    im = Image.open(path).convert('RGB')
    im.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(path, 'PNG', optimize=True)


def save(page, name, clip=None, meta=None, info=None):
    FIG.mkdir(parents=True, exist_ok=True)
    path = FIG / (name + '.png')
    page.screenshot(path=str(path), clip=clip)
    compact(path)
    info[name] = dict(meta or {}, file='figures/' + name + '.png', viewport=list(PHONE), clip=clip)
    print('  ' + path.relative_to(ROOT).as_posix())


def box(page, selectors, pad=10, top_sel=None):
    """Union box (CSS px, page coordinates) of the elements, padded; clipped to the page width."""
    return page.evaluate("""([sels, pad, topSel]) => {
      let t = Infinity, b = -Infinity;
      for (const s of sels) { const e = document.querySelector(s); if (!e) continue; const r = e.getBoundingClientRect();
        t = Math.min(t, r.top + scrollY); b = Math.max(b, r.bottom + scrollY); }
      if (topSel) { const e = document.querySelector(topSel); if (e) t = e.getBoundingClientRect().top + scrollY; }
      return { x: 0, y: Math.max(0, t - pad), width: innerWidth, height: (b - t) + 2 * pad };
    }""", [selectors, pad, top_sel])


def trial_info(page):
    return page.evaluate("""() => { const v = ES.ui.trialView && ES.ui.trialView.current; const t = v && v.trial; if (!t) return null;
      return { ex: t.ex, dials: t.setting && t.setting.dials, focus: t.setting && t.setting.focus,
        level: t.meta && t.meta.levelText || null, prompt: t.question && t.question.prompt,
        title: t.picture && t.picture.title || null }; }""")


def start(page, ex, pin=None, trials=4):
    page.evaluate("""([ex, pin, n]) => { ES.ui.sound.unlock(); ES.ui.session.start({ sets: [{ exId: ex, trials: n, pin: pin || undefined }],
      learn: false, title: 'Guide figure' }); }""", [ex, pin, trials])


def pick(page, kind):
    """Tap, in every slot, an option of the given foil type ('masker': a word another voice said); else a wrong one."""
    slots = page.evaluate("""() => { const t = ES.ui.trialView.current.trial;
      return t.question.slots.map(s => ({ answer: String(s.answer), foils: s.foils || {},
        options: s.options.map(o => String(o && typeof o === 'object' ? (o.id ?? o.value) : o)) })); }""")
    for si, s in enumerate(slots):
        want = [i for i, o in enumerate(s['options']) if s['foils'].get(o) == kind]
        idx = want[0] if want else next(i for i, o in enumerate(s['options']) if o != s['answer'])
        page.locator(f'.answer-slot[data-slot="{si}"] .key[data-opt="{idx}"]').click()


def shoot_trial(browser, recs, info, name, ex, pin, feedback=None):
    tab = new_page(browser, recs)
    p = tab.page
    start(p, ex, pin)
    H.wait_state(p, ['answer'], 45000)
    settle(p)
    ti = trial_info(p)
    if name:
        save(p, name, meta={'screen': 'play', 'state': 'answer', 'trial': ti}, info=info)
    if feedback:
        pick(p, 'masker')
        H.wait_state(p, ['feedback'], 10000)
        p.wait_for_timeout(600)
        settle(p)
        text = p.evaluate("() => (document.querySelector('.trial-body') || {}).innerText || ''")
        save(p, feedback, meta={'screen': 'play', 'state': 'feedback', 'trial': ti, 'text': text[:400]}, info=info)
    errs = tab.errors[:]
    p.context.close()
    return errs


def answer_partly(page):
    """Right in the first slot, wrong in the others (a partly right trial)."""
    slots = page.evaluate("""() => { const t = ES.ui.trialView.current.trial;
      return t.question.slots.map(s => ({ answer: String(s.answer), options: s.options.map(o => String(o && typeof o === 'object' ? (o.id ?? o.value) : o)) })); }""")
    for si, s in enumerate(slots):
        idx = s['options'].index(s['answer']) if si == 0 else next(i for i, o in enumerate(s['options']) if o != s['answer'])
        page.locator(f'.answer-slot[data-slot="{si}"] .key[data-opt="{idx}"]').click()


def shoot_results(browser, recs, info, pattern='RRPRWR'):
    """A short Crowd set (two answers per trial: a word and a number) answered by the script in a fixed pattern
    (R right, P partly right, W wrong); the picture is the top of the Results screen."""
    tab = new_page(browser, recs)
    p = tab.page
    start(p, 'crowd', {'talkers': 1, 'similar': 1, 'tmr': 6}, trials=len(pattern))
    for k in pattern:
        H.wait_state(p, ['answer'], 45000)
        before = p.evaluate("() => document.querySelector('.trial').getAttribute('data-index')")
        if k == 'P':
            answer_partly(p)
        else:
            H.answer_current(p, k == 'R')
        H.wait_state(p, ['feedback'], 10000)
        p.wait_for_timeout(400)
        p.wait_for_function("""(b) => { const t = document.querySelector('.trial');
          if (document.querySelector('[data-headline]') || (t && t.getAttribute('data-index') !== b)) return true;
          const n = document.querySelector('[data-next]:not([disabled])'); if (n) n.click(); return false; }""", arg=before, timeout=20000, polling=500)
    p.wait_for_selector('[data-headline]', timeout=20000)
    p.wait_for_timeout(800)
    H.close_sheets(p)
    settle(p)
    text = p.evaluate("() => (document.querySelector('.results') || {}).innerText.slice(0, 500)")
    clip = box(p, ['.wrap.results'], pad=6)
    save(p, 'results', clip=clip, meta={'screen': 'results', 'pattern': pattern, 'text': text}, info=info)
    errs = tab.errors[:]
    p.context.close()
    return errs


def shoot_seek(browser, recs, info):
    """A Seek search walked by a simulated finger: grab your dot, wander toward the voice in two legs, let go near
    it, name its word; the picture is the reveal (your path, where you stopped, the voice and its found ring)."""
    from ex_b_common import field_xy, seek_peek
    tab = new_page(browser, recs)
    p = tab.page
    start(p, 'seek', None)
    p.wait_for_selector('.sk-body[data-state="search"]', timeout=45000)
    p.wait_for_timeout(500)
    pk = seek_peek(p)
    sx, sy = pk['pos']['x'], pk['pos']['y']
    tx, ty = pk['answer']['x'], pk['answer']['y']
    legs = [(sx + (tx - sx) * 0.35 + 0.22, sy + (ty - sy) * 0.55), (tx + 0.05, ty - 0.04)]
    x0, y0 = field_xy(p, sx, sy)
    p.mouse.move(x0, y0)
    p.mouse.down()
    time.sleep(1.8)                       # the sound unlock gets its time before the first step
    cx, cy = sx, sy
    for lx, ly in legs:
        for i in range(1, 15):
            fx, fy = cx + (lx - cx) * i / 14, cy + (ly - cy) * i / 14
            p.mouse.move(*field_xy(p, fx, fy))
            time.sleep(0.05)
        cx, cy = lx, ly
    time.sleep(0.6)
    p.mouse.up()
    p.wait_for_selector('.sk-body[data-state="word"]', timeout=15000)
    word = pk['word']
    keys = p.locator('.sk-body .answer-slot .key')
    keys.filter(has_text=str(word)).first.click()
    p.wait_for_selector('.sk-body[data-state="feedback"]', timeout=15000)
    p.wait_for_timeout(700)
    settle(p)
    st = p.evaluate("() => (document.querySelector('.sk-body') || {}).innerText.slice(0, 400)")
    save(p, 'seek', meta={'screen': 'play', 'state': 'feedback', 'text': st, 'target': [tx, ty]}, info=info)
    errs = tab.errors[:]
    p.context.close()
    return errs


def main():
    only = None
    if '--only' in sys.argv:
        only = set(sys.argv[sys.argv.index('--only') + 1].split(','))
    want = lambda n: only is None or n in only  # noqa: E731
    build()
    recs = records()
    info_path = FIG / 'figures.json'
    info = json.loads(info_path.read_text()) if info_path.exists() else {}
    errors = []
    with H.browser_lock(), sync_playwright() as pw:
        b = H.launch(pw)
        if want('home'):
            tab = new_page(b, recs)
            settle(tab.page)
            save(tab.page, 'home', meta={'screen': 'home'}, info=info)
            errors += tab.errors
            tab.page.context.close()
        if want('exercises'):
            tab = new_page(b, recs)
            p = tab.page
            p.evaluate("() => ES.core.router.go('exercises', {})")
            p.wait_for_selector('[data-ex-row]')
            settle(p)
            rows = p.evaluate("() => [...document.querySelectorAll('[data-ex-row]')].map(e => e.getAttribute('data-ex-row'))")
            save(p, 'exercises', meta={'screen': 'exercises', 'rows': rows}, info=info)
            errors += tab.errors
            p.context.close()
        if want('map'):
            tab = new_page(b, recs)
            p = tab.page
            p.evaluate("() => ES.core.router.go('map', {})")
            p.wait_for_selector('.g-map-svg')
            settle(p)
            clip = box(p, ['.g-map-svg'], pad=14, top_sel='.g-map .eyebrow')
            open_n = p.evaluate("() => document.querySelectorAll('.gm-node.is-open').length")
            save(p, 'map', clip=clip, meta={'screen': 'map', 'open': open_n}, info=info)
            errors += tab.errors
            p.context.close()
        if want('lab-trend'):
            tab = new_page(b, recs)
            p = tab.page
            p.evaluate("() => ES.core.router.go('report', { probe: 'matrix' })")
            p.wait_for_selector('[data-lab-report=matrix] .lab-chart')
            p.wait_for_timeout(500)
            H.close_sheets(p)
            settle(p)
            clip = box(p, ['[data-lab-report=matrix] .lab-chart'], pad=12, top_sel='[data-lab-report=matrix] .eyebrow')
            verdict = p.get_attribute('[data-lab-verdict-head]', 'data-lab-verdict-head')
            head = p.evaluate("() => (document.querySelector('[data-lab-report=matrix]') || {}).innerText.slice(0, 420)")
            save(p, 'lab-trend', clip=clip, meta={'screen': 'report', 'verdict': verdict, 'text': head,
                                                   'runs': [r['est']['m'] for r in recs['lab']['runs']]}, info=info)
            errors += tab.errors
            p.context.close()
        # Crowd: two other voices of the same sex, each as loud as the voice you follow (0 dB)
        if want('crowd'):
            errors += shoot_trial(b, recs, info, None, 'crowd', {'talkers': 1, 'similar': 1, 'tmr': 0},
                                  feedback='crowd-feedback')
        if want('far'):
            errors += shoot_trial(b, recs, info, 'far', 'far', {'dist': 7, 'rt60': 6, 'noise': 12})
        if want('strange'):
            errors += shoot_trial(b, recs, info, 'strange', 'strange', None)
        if want('repair'):
            errors += shoot_trial(b, recs, info, 'repair', 'repair', None)
        if want('echo'):
            errors += shoot_trial(b, recs, info, 'echo', 'echo', None)
        if want('voices'):
            errors += shoot_trial(b, recs, info, 'voices', 'voices', None)
        if want('seek'):
            errors += shoot_seek(b, recs, info)
        if want('results'):
            errors += shoot_results(b, recs, info)
        b.close()
    FIG.mkdir(parents=True, exist_ok=True)
    info_path.write_text(json.dumps(info, indent=1, sort_keys=True, ensure_ascii=False) + '\n')
    for e in errors:
        print('page error:', e.get('text', '')[:200])
    return 0


if __name__ == '__main__':
    sys.exit(main())
