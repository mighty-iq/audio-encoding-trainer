"""Layout at phone, sideways-phone and desktop sizes in light and dark: a trial (field, prompt, answer panel,
replay buttons) fits without scrolling in portrait and on desktops, no screen scrolls sideways, and screenshots
of every shell screen land in tests/out/ for a person to look at."""
from harness import Checks, new_tab, file_url, wait_ready, close_sheets, wait_state, answer_current, layout, shot, preset

SIZES = [(360, 640), (390, 844), (1366, 768), (640, 360)]
SEEN = {'profile': {'v': 1, 'welcomeSeen': 1, 'tutorials': {'demo': True}}}


def fits(c, pg, tag, portrait):
    L = layout(pg)
    c.ok(L['sw'] <= L['iw'], f'{tag}: no sideways scroll', L)
    if not portrait:
        return L
    c.ok(L['sh'] <= L['ih'], f'{tag}: no vertical scroll', {'sh': L['sh'], 'ih': L['ih']})
    for part in ('field', 'text', 'answer', 'actions'):
        b = L[part]
        c.ok(b is not None and b['top'] >= 0 and b['bottom'] <= L['ih'], f'{tag}: {part} inside the screen', b)
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


def run(h):
    c = Checks('layout')
    tutorial(c, h)
    for scheme in ('light', 'dark'):
        for (w, ht) in SIZES:
            tag = f'{w}x{ht}_{scheme}'
            portrait = ht > w or w >= 1000
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
