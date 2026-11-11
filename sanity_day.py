# Daylight-pass gameplay sanity: the fountain blocks nav cells, the horde still spawns and reaches the
# player at the hub through the castle gate, nightfall still blends to night. usage: sanity_day.py URL
import sys, json, math
from playwright.sync_api import sync_playwright
url = sys.argv[1]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': 480, 'height': 270}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto(url); pg.wait_for_function('window.__ready === true', timeout=240000); ev = pg.evaluate
    def gt(sec):
        t0 = ev('game.time')
        while ev('game.time') - t0 < sec: pg.wait_for_timeout(30)
    ev("__debug.start(); __debug.god(true); __debug.quality('low')")
    R = {}
    R['spawn pose'] = ev("({ pos: game.player.pos.toArray(), yaw: game.player.yaw, pitch: game.player.pitch })")
    R['nav fountain blocked'] = ev("(() => { const n = game.arena.nav; const c = (x, z) => n.blocked[(Math.floor(z) + n.H) * n.N + Math.floor(x) + n.H]; return [c(0, -30.4), c(0, -33.6), c(-3.8, -30.4), c(3.8, -30.4)]; })()")
    print(json.dumps(R), flush=True)
    import time; w0 = time.time(); gt(6); print('6s game took', round(time.time() - w0), 's wall', flush=True)
    i1 = ev("__debug.info()"); R['after 6s'] = {k: i1[k] for k in ('wave', 'alive', 'state')}
    d0 = ev("game.horde.enemies.filter(e => !e.dead).map(e => e.pos.distanceTo(game.player.pos))")
    gt(4)
    d1 = ev("game.horde.enemies.filter(e => !e.dead).map(e => e.pos.distanceTo(game.player.pos))")
    R['mean dist 6s -> 10s'] = [round(sum(d0) / max(1, len(d0)), 1), round(sum(d1) / max(1, len(d1)), 1)]
    R['night w1 / w10'] = [ev("__debug.night(1)"), ev("__debug.night(10)")]
    R['errors'] = errs[:5]
    print(json.dumps(R, indent=1)); b.close()
