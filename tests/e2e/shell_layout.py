"""Layout at phone, sideways-phone and desktop sizes in light and dark: a trial (field, prompt, answer panel,
replay buttons) fits without scrolling in portrait and on desktops, no screen scrolls sideways, and screenshots
of every shell screen land in tests/out/ for a person to look at."""
from harness import Checks, new_tab, file_url, wait_ready, close_sheets, wait_state, answer_current, layout, shot, preset

SIZES = [(360, 640), (390, 844), (1366, 768), (640, 360)]
SEEN = {'profile': {'v': 1, 'welcomeSeen': 1, 'tutorials': {'demo': True}}}


INNER = """() => { const b = document.querySelector('.trial-body'); if (!b) return null;
  const n = document.querySelector('.trial-actions .next'), r = n && n.getBoundingClientRect();
  return { sh: b.scrollHeight, ch: b.clientHeight, next: r && r.height ? { top: Math.round(r.top), bottom: Math.round(r.bottom) } : null }; }"""


def fits(c, pg, tag, portrait=True):
    """Nothing scrolls (the page or the trial body) and every part of the trial is inside the window. Sideways
    phones (640×360) are held to the same rule since RV-play-a11y A1."""
    L = layout(pg)
    c.ok(L['sw'] <= L['iw'], f'{tag}: no sideways scroll', L)
    if not portrait:
        return L
    c.ok(L['sh'] <= L['ih'], f'{tag}: no vertical scroll', {'sh': L['sh'], 'ih': L['ih']})
    I = pg.evaluate(INNER)
    c.ok(I and I['sh'] <= I['ch'] + 1, f'{tag}: the trial body does not scroll inside', I)
    if I and I['next']:
        c.ok(I['next']['bottom'] <= L['ih'] and I['next']['top'] >= 0, f'{tag}: Next is on screen', I['next'])
    # on a sideways phone the feedback gives the picture's room to the words (A1)
    state = pg.evaluate("() => { const b = document.querySelector('.trial-body'); return b ? b.dataset.state : null; }")
    words_only = L['ih'] <= 480 and L['iw'] > L['ih'] and state in ('feedback', 'example')
    for part in ('field', 'text', 'answer', 'actions'):
        if part == 'field' and words_only:
            continue
        b = L[part]
        c.ok(b is not None and b['top'] >= 0 and b['bottom'] <= L['ih'], f'{tag}: {part} inside the screen', b)
    if not words_only:
        c.ok(L['field'] and L['field']['h'] >= 60, f'{tag}: the field picture keeps some height', L['field'])
    return L


def tutorial(c, h):
    """The tutorial at the smallest phone: caption, worked example and practice fit without scrolling."""
    tab = new_tab(h.browser, viewport=(360, 640), init=preset({'profile': {'v': 1, 'welcomeSeen': 1}}), touch=True)
    pg = tab.page
    pg.goto(file_url())
    wait_ready(pg)
    close_sheets(pg)
    pg.click('[data-start]')
    pg.wait_for_selector('[data-step="caption"]', timeout=8000)
    shot(pg, 'tutorial_caption_360x640_light')
    L = layout(pg)
    c.ok(L['sh'] <= L['ih'], 'tutorial caption: no vertical scroll', L)
    pg.wait_for_function("() => !document.querySelector('[data-continue]').disabled", timeout=6000)
    pg.click('[data-continue]')
    wait_state(pg, 'example', 15000)
    fits(c, pg, '360x640 tutorial example', True)
    shot(pg, 'tutorial_example_360x640_light')
    pg.click('[data-next]')
    wait_state(pg, 'answer', 15000)
    fits(c, pg, '360x640 tutorial practice', True)
    answer_current(pg, False)
    wait_state(pg, 'feedback')
    fits(c, pg, '360x640 tutorial practice feedback', True)
    shot(pg, 'tutorial_practice_360x640_light')
    mine, other = tab.split()
    c.ok(not mine, 'tutorial: no page errors from shell files', mine[:5])
    pg.context.close()


REAL = ['crowd', 'far', 'strange', 'repair', 'echo', 'voices']
DONE = {'v': 1, 'welcomeSeen': 1, 'tutorials': {k: 1 for k in REAL + ['seek', 'demo']}}


def real_trials(c, h, size, scheme):
    """Every keyword exercise's answer and feedback states on a sideways phone (RV-play-a11y A1) or a small phone."""
    from harness import ROOT
    if not (ROOT / 'data' / 'manifest.js').exists():
        c.warn('no voice data: real-trial layout skipped')
        return
    w, ht = size
    tab = new_tab(h.browser, viewport=size, scheme=scheme, init=preset({'profile': DONE}), touch=True, real=True)
    pg = tab.page
    pg.goto(file_url(), timeout=90000)
    wait_ready(pg, 60000)
    close_sheets(pg)
    for ex in REAL:
        tag = f'{w}x{ht}_{scheme} {ex}'
        pg.evaluate("(ex) => { ES.ui.session.abandon({ discard: true }); ES.ui.session.start({ sets: [{ exId: ex, trials: 4 }] }); }", ex)
        try:
            wait_state(pg, 'answer', 45000)
        except Exception as e:
            c.ok(False, f'{tag}: a trial reaches the answer state', str(e)[:120])
            continue
        fits(c, pg, f'{tag} answer')
        shot(pg, f'real_{ex}_answer_{w}x{ht}_{scheme}')
        try:
            answer_current(pg, False)            # a miss gives the longest feedback
        except StopIteration:                    # a one-choice slot (meeting a voice): answer it right
            answer_current(pg, True)
        wait_state(pg, 'feedback', 8000)
        pg.wait_for_timeout(400)
        fits(c, pg, f'{tag} feedback')
        shot(pg, f'real_{ex}_feedback_{w}x{ht}_{scheme}')
    pg.evaluate("() => { ES.ui.session.abandon({ discard: true }); }")
    mine, other = tab.split()
    c.ok(not mine, f'{w}x{ht}_{scheme} real trials: no page errors from shell files', mine[:5])
    for who, text in other:
        c.warn(f'{w}x{ht}_{scheme} real trials: error from {who}: {text}')
    pg.context.close()


def run(h):
    c = Checks('layout')
    tutorial(c, h)
    for size, scheme in (((640, 360), 'dark'), ((740, 360), 'light'), ((360, 640), 'light')):
        real_trials(c, h, size, scheme)
    for scheme in ('light', 'dark'):
        for (w, ht) in SIZES:
            tag = f'{w}x{ht}_{scheme}'
            portrait = True                                   # sideways phones too (A1)
            tab = new_tab(h.browser, viewport=(w, ht), scheme=scheme, init=preset(SEEN), touch=w < 1000)
            pg = tab.page
            pg.goto(file_url())
            wait_ready(pg)
            close_sheets(pg)
            L = layout(pg)
            c.ok(L['sw'] <= L['iw'], f'{tag}: Home has no sideways scroll', L)
            shot(pg, f'home_{tag}', full=True)
            pg.click('[data-start]')
            wait_state(pg, 'answer', 15000)
            fits(c, pg, f'{tag} trial', portrait)
            shot(pg, f'trial_{tag}')
            # The heaviest panel the demo makes: two slots (trial 3); answer two trials to reach it.
            for _ in range(2):
                answer_current(pg, True)
                wait_state(pg, 'feedback')
                pg.click('[data-next]')
                wait_state(pg, 'answer', 15000)
            fits(c, pg, f'{tag} two-slot trial', portrait)
            answer_current(pg, False)
            wait_state(pg, 'feedback')
            fits(c, pg, f'{tag} feedback', portrait)
            shot(pg, f'feedback_{tag}')
            if (w, ht) in ((390, 844), (1366, 768)) or scheme == 'light':
                pg.click('[data-pause]')
                pg.wait_for_selector('.sheet-pause')
                shot(pg, f'pause_{tag}')
                pg.click('[data-resume]')
                for name in ('settings', 'about', 'map', 'volume'):
                    pg.evaluate("(n) => { ES.ui.session.abandon(); ES.core.router.go(n, {}, { reset: true }); }", name)
                    pg.wait_for_timeout(150)
                    L = layout(pg)
                    c.ok(L['sw'] <= L['iw'], f'{tag}: {name} has no sideways scroll', L)
                    shot(pg, f'{name}_{tag}', full=True)
            mine, other = tab.split()
            c.ok(not mine, f'{tag}: no page errors from shell files', mine[:5])
            for who, text in other:
                c.warn(f'{tag}: error from {who}: {text}')
            pg.context.close()
    return c
