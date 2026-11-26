"""Opens from file:// and from http (GitHub Pages-like): the Chimera pop-up (full first, then the light one-tap
version), Home with the permanent link, deep links, and no page errors from shell files."""
from harness import Checks, new_tab, file_url, wait_ready, close_sheets


def run(h):
    c = Checks('open')
    for label, url in (('file', file_url()), ('http', h.base + '/index.html')):
        tab = new_tab(h.browser)
        pg = tab.page
        pg.goto(url)
        wait_ready(pg)
        c.ok(pg.locator('.sheet-chimera-full').count() == 1, f'{label}: full welcome on first launch')
        link = pg.locator('.sheet-chimera-full a.chimera-link')
        c.eq(link.get_attribute('href'), 'https://discord.gg/chmr', f'{label}: welcome links to discord.gg/chmr')
        c.eq(link.get_attribute('target'), '_blank', f'{label}: the link opens a new tab')
        c.ok('noopener' in (link.get_attribute('rel') or ''), f'{label}: rel=noopener')
        c.ok('Chimera community on Discord' in pg.inner_text('.sheet-chimera-full'), f'{label}: says who built it')
        close_sheets(pg)
        c.ok(pg.locator('.sheet').count() == 0, f'{label}: one tap closes the welcome')
        c.ok(pg.locator('.page-foot a.chimera-link[href="https://discord.gg/chmr"]').count() == 1, f'{label}: permanent link on Home')
        c.ok(pg.locator('[data-start]').is_visible(), f'{label}: Start session is visible')
        c.ok(pg.evaluate("ES.core.store.status().mode") == 'persistent', f'{label}: storage persistent')
        pg.reload()
        wait_ready(pg)
        c.ok(pg.locator('.sheet-chimera-light').count() == 1, f'{label}: light pop-up on a later launch')
        c.ok(pg.locator('.sheet-chimera-light a.chimera-link').count() == 1, f'{label}: light pop-up carries the link')
        c.ok(pg.locator('.sheet-chimera-light .sheet-actions .btn').count() == 1, f'{label}: light pop-up is one tap')
        close_sheets(pg)
        for target, want in (('about', 'about'), ('settings', 'settings'), ('play', 'home'), ('results', 'home')):
            pg.goto('about:blank')
            pg.goto(url + '#' + target)
            wait_ready(pg)
            close_sheets(pg)
            c.eq(pg.evaluate("ES.core.router.current().name"), want, f'{label}: #{target} opens {want}')
        pg.goto(url + '#map')
        pg.wait_for_timeout(200)
        c.ok(pg.locator('[data-placeholder="map"]').count() == 1, f'{label}: placeholder screens say a later build')
        mine, other = tab.split()
        c.ok(not mine, f'{label}: no page errors from shell files', mine[:5])
        for who, text in other:
            c.warn(f'{label}: error from {who}: {text}')
        pg.context.close()
    return c
