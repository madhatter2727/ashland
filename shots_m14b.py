# M14b screenshots: the new crawl. usage: shots_m14b.py URL OUTDIR [lab|final]
import sys, json, math
from playwright.sync_api import sync_playwright
url, out = sys.argv[1], sys.argv[2]; sec = sys.argv[3] if len(sys.argv) > 3 else 'final'
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': 1280, 'height': 720}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e) + ' @ ' + (e.stack or '')[:600]))
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    if 'vercel.app' in url: pg.route('**/api/scores', lambda route: route.abort() if route.request.method == 'POST' else route.continue_())
    pg.goto(url); pg.wait_for_function('window.__ready === true', timeout=240000)
    ev = pg.evaluate
    def gt(s):
        t0 = ev('game.time')
        while ev('game.time') - t0 < s: pg.wait_for_timeout(15)
    def shot(name): pg.screenshot(path=f'{out}/{name}.png'); print('shot', name, flush=True)
    CLEAR = """(R) => { const H = game.horde, N = H.nav, V = game.player.pos.constructor; for (let x = -30; x <= 30; x += 2) for (let z = -18; z <= 34; z += 2) { let ok = true;
        for (const dx of [-3, 0, 3]) for (let d = 0; d <= 13 && ok; d += 1) { const c = N.cellOf(x + dx, z - d); if (c < 0 || N.blocked[c] || Math.abs(N.height[c]) > 0.3) ok = false; }
        if (!ok) continue; for (const dx of [-3, 0, 3]) if (!H.los(new V(x, 1.7, z), new V(x + dx, 1.2, z - 12))) ok = false; if (ok) return [x, z]; } return [0, 0]; }"""
    ev("__debug.start(); __debug.god(true); game.horde.running = false; game.horde.reset()")
    cx, cz = ev(CLEAR, 10); print('clear spot', cx, cz)
    R = {'clear': [cx, cz]}
    def freeze(): ev("game.state = 'paused'")
    def thaw(): ev("game.state = 'play'")
    def hud(on): ev(f"document.getElementById('hud').style.visibility = '{'visible' if on else 'hidden'}'")
    def stage(w):
        ev("game.state = 'play'; __debug.cam(); game.horde.reset(); game.horde.running = false"); ev(f"(() => {{ game.horde.wave = {w}; __debug.night({w}); }})()")
        ev(f"__debug.teleport({cx}, 0.05, {cz}); __debug.look(0, 0.02)"); gt(0.3)
    # wait until crawler `e` is at pull phase u (0..1) mid-drag, then freeze
    def at_phase(js_e, lo, hi):
        pg.wait_for_function(f"(() => {{ const e = {js_e}; const u = e.cph % 1; return u > {lo} && u < {hi}; }})()", polling='raf', timeout=30000); freeze()
    if 'lab' in sec:
        spd = float(sys.argv[4]) if len(sys.argv) > 4 else 1.2
        stage(3); hud(False)
        ev(f"(() => {{ const H = game.horde, V = game.player.pos.constructor; const e = H.spawn('crawler', new V({cx}, 0, {cz} - 11)); e.aware = true; e.attackCd = 99; e.speed = {spd}; window.__c = e; }})()")
        gt(1.0); at_phase('window.__c', 0.0, 0.08)
        # step the sim by hand through two pulls (one full cycle), side camera locked to the zombie's start point
        for i in range(8):
            ev("(() => { const e = window.__c, H = game.horde, u0 = e.cph; let k = 0; while (e.cph - u0 < 0.25 && k < 400) { game.time += 1/120; H.update(1/120, game.time, game.camera); k++; } })()")
            ev(f"(() => {{ const e = window.__c, a = e.yaw + {1.5708 if i < 4 else 0.6}; __debug.cam(e.pos.x + Math.sin(a) * 2.3, 0.95, e.pos.z + Math.cos(a) * 2.3, a, -0.33); }})()")
            pg.wait_for_timeout(120); shot(f'lab-side-{i}')
            R[f'lab{i}'] = ev("({ u: +(window.__c.cph % 1).toFixed(2), surge: +window.__c.surge.toFixed(2), z: +window.__c.pos.z.toFixed(2) })")
    if 'final' in sec:
        # 1) Crawler Rush wave, several crawlers mid-pull, low camera
        stage(3); ev(f"__debug.wave(3); __debug.night(3); game.horde.running = false")
        ev(f"(() => {{ const H = game.horde, V = game.player.pos.constructor; window.__cs = []; for (const [dx, dz] of [[-1.8, -9.2], [0.3, -8.6], [2.0, -9.8], [-0.8, -11.2], [1.3, -12.0], [-2.6, -12.6], [2.9, -13.0]]) {{ const e = H.spawn('crawler', new V({cx} + dx, 0, {cz} + dz)); e.yaw = 0; e.aware = true; e.attackCd = 99; window.__cs.push(e); }} }})()")
        gt(0.5); at_phase('window.__cs[1]', 0.25, 0.4)
        ev(f"__debug.cam({cx} + 0.3, 0.55, {cz} - 3.2, 0, -0.07)"); pg.wait_for_timeout(150); shot('m14b-crawler-rush')
        R['rush'] = ev("window.__cs.map((e) => +(e.cph % 1).toFixed(2))")
        # 2) close-up of one crawler, hand planted, body mid-lunge
        hud(False); stage(3)
        ev(f"(() => {{ const H = game.horde, V = game.player.pos.constructor; const e = H.spawn('crawler', new V({cx}, 0, {cz} - 9)); e.aware = true; e.attackCd = 99; window.__c = e; }})()")
        gt(0.9); at_phase('window.__c', 0.28, 0.4)
        ex, ez, ey = ev("[window.__c.pos.x, window.__c.pos.z, window.__c.yaw]")
        ev(f"(() => {{ const e = window.__c, a = e.yaw + 0.75, d = 1.6; __debug.cam(e.pos.x + Math.sin(a) * d, 0.55, e.pos.z + Math.cos(a) * d, a, -0.12); }})()"); pg.wait_for_timeout(150); shot('m14b-crawler-close')
        # 3) a husk that loses a leg and crawls
        stage(4)
        ev(f"(() => {{ const H = game.horde, V = game.player.pos.constructor; const e = H.spawn('runner', new V({cx} + 0.5, 0, {cz} - 8)); e.aware = true; e.attackCd = 99; window.__l = e; }})()")
        gt(0.6)
        ev("(() => { const H = game.horde, e = window.__l, V = e.pos.constructor; for (let i = 0; i < 8 && !(e.lost & (1 << 7)); i++) H.damage(e, 40, 'limb', e.joints[10].clone(), new V(0, 0, -1), { id: 'sg' }, 7); e.hp = e.maxHp; })()")
        R['legLost'] = ev("({ crawl: window.__l.crawl, lost: window.__l.lost })")
        gt(2.2); at_phase('window.__l', 0.2, 0.4)
        ev(f"(() => {{ const e = window.__l, a = e.yaw + 0.9, d = 1.9; __debug.cam(e.pos.x + Math.sin(a) * d, 0.6, e.pos.z + Math.cos(a) * d, a, -0.14); }})()"); pg.wait_for_timeout(150); shot('m14b-crawler-legless')
        hud(True)
    R['errors'] = errs[:6]; print(json.dumps(R, indent=1)); b.close()
