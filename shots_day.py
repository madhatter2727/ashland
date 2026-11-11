# Usage: python3 shots_day.py <url> <outdir> <prefix> [view,view,...]
# First-person daylight views (HUD on). 'spawn' uses the player's real spawn pose after __debug.start().
import sys, json, time
from playwright.sync_api import sync_playwright
url, out, pre = sys.argv[1], sys.argv[2], sys.argv[3]
only = sys.argv[4].split(',') if len(sys.argv) > 4 else None
VIEWS = {
  'castle-hub':   ((0, 0, 13), (0.0, 0.16)),
  'castle-court': ((3, 0, -21), (0.12, 0.28)),
  'castle-close': ((-2.5, 0, -27), (0.05, 0.42)),
  'fountain':     ((6, 0, -24), (0.75, 0.05)),
  'street':       ((0, 0, 18), (3.14159, 0.06)),
  'street-in':    ((2, 0, 30), (0.0, 0.10)),
  'hub':          ((8, 0, 10), (-0.75, 0.08)),
  'hub-w':        ((-7, 0, 11), (0.6, 0.06)),
  'hub-map':      ((-4, 0, 24), (0.69, 0.04)),
  'side-midway':  ((20, 0, 2), (0.6, 0.1)),
  'side-gardens': ((-18, 0, 4), (-0.9, 0.1)),
}
errors = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': 1280, 'height': 720})
    pg.on('console', lambda m: m.type == 'error' and errors.append(m.text))
    pg.on('pageerror', lambda e: errors.append(str(e)))
    t0 = time.time(); pg.goto(url); pg.wait_for_function('window.__ready === true', timeout=180000); print('load s', round(time.time() - t0, 1), flush=True)
    ev = pg.evaluate
    def gt(sec):
        t0 = ev('game.time')
        while ev('game.time') - t0 < sec: pg.wait_for_timeout(50)
    ev("__debug.start(); __debug.god(true); __debug.quality('medium'); game.horde.running=false; game.horde.reset(); game.fx.clear()")
    gt(0.6)
    if not only or 'spawn' in only:
        pg.screenshot(path=f'{out}/{pre}-spawn.png'); print('shot spawn', flush=True)
    for name, (pos, look) in VIEWS.items():
        if only and name not in only: continue
        ev(f"__debug.teleport({pos[0]}, {pos[1]}, {pos[2]}); __debug.look({look[0]}, {look[1]})"); gt(0.5)
        pg.screenshot(path=f'{out}/{pre}-{name}.png'); print('shot', name, flush=True)
    print(ev('JSON.stringify(game.arena.stats)'), ev('JSON.stringify(game.renderer.info.render)'))
    print('ERRORS:', errors[:10])
    b.close()
