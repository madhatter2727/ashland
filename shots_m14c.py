# M14c screenshots: new looks for the Brute, Bloater (pulse + death swell) and Jumper (crouch + leap arc).
# usage: shots_m14c.py URL OUTDIR
import sys, json
from playwright.sync_api import sync_playwright
url, out = sys.argv[1], sys.argv[2]
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
    def hud(on): ev(f"document.getElementById('hud').style.visibility = '{'visible' if on else 'hidden'}'")
    def stage(w):
        ev("game.state = 'play'; __debug.cam(); game.horde.reset(); game.powerups.reset(); game.horde.running = false"); ev(f"(() => {{ game.horde.wave = {w}; __debug.night({w}); }})()")
        ev(f"__debug.teleport({cx}, 0.05, {cz}); __debug.look(0, 0.02)"); gt(0.3)
    def spawn(kind, dx, dz, var, aware=True):
        ev(f"(() => {{ const H = game.horde, V = game.player.pos.constructor; const e = H.spawn('{kind}', new V({cx} + {dx}, 0, {cz} + {dz})); e.aware = {'true' if aware else 'false'}; e.yaw = 0; e.attackCd = 99; window.{var} = e; }})()")
    # camera orbiting enemy `var` at angle a (relative to its facing), distance d, height y, pitch
    def orbit(var, a, d, y, pitch):
        ev(f"(() => {{ const e = window.{var}, a = e.yaw + {a}; __debug.cam(e.pos.x + Math.sin(a) * {d}, e.pos.y + {y}, e.pos.z + Math.cos(a) * {d}, a, {pitch}); }})()"); pg.wait_for_timeout(150)
    def step_until(cond, cap=600):
        ev(f"(() => {{ const H = game.horde; let k = 0; while (!({cond}) && k < {cap}) {{ game.time += 1/60; H.update(1/60, game.time, game.camera); k++; }} }})()")
    hud(False)
    # 1) Brute mid-stomp, three-quarter front view
    stage(8); spawn('brute', 0, -9, '__b'); gt(1.6)
    pg.wait_for_function("(() => { const e = window.__b; return e.pos.distanceTo(game.player.pos) < 7.5; })()", polling='raf', timeout=30000); freeze()
    orbit('__b', 0.55, 3.6, 1.55, -0.14); shot('m14c-brute')
    R['brute'] = ev("({ d: +window.__b.pos.distanceTo(game.player.pos).toFixed(2), kind: window.__b.rig.kind, trauma: +(game.trauma || 0).toFixed(3) })")
    # 2) Bloater waddling (gut pulsing), then the death swell
    stage(7); spawn('bloater', 0, -8, '__bl'); gt(1.4)
    pg.wait_for_function("window.__bl.beat > 0.6", polling='raf', timeout=30000); freeze()
    orbit('__bl', 0.5, 3.0, 1.3, -0.12); shot('m14c-bloater')
    R['bloater'] = ev("({ beat: +window.__bl.beat.toFixed(2), kind: window.__bl.rig.kind, pulse: +window.__bl.rig.u.uPulse.value.toFixed(2) })")
    ev("game.state = 'play'; window.__blast = 0; (() => { const H = game.horde, oh = H.hooks.onBloaterBurst; H.hooks.onBloaterBurst = (p, e) => { window.__blast++; oh(p, e); }; })()")
    ev("(() => { const H = game.horde, b = window.__bl, V = b.pos.constructor; H.damage(b, 9999, 'body', b.joints[1].clone(), new V(0, 0, 1), { id: 'ar' }, 0); })()")
    freeze(); step_until("window.__bl.swell > 0.75")
    orbit('__bl', 0.5, 3.4, 1.3, -0.12); shot('m14c-bloater-swell')
    R['swell'] = ev("({ swell: +window.__bl.swell.toFixed(2), blasts: window.__blast, dead: window.__bl.dead })")
    # 3) Jumper crouched to leap, then mid-air at the top of its arc (side view)
    stage(6); spawn('jumper', 0, -7.5, '__j'); ev("window.__j.jcd = 0"); freeze()
    step_until("window.__j.jp === 1 && window.__j.jkind === 'leap' && window.__j.jt > 0.5", 1200)
    orbit('__j', 0.7, 2.3, 0.9, -0.12); shot('m14c-jumper')
    R['jumper'] = ev("({ jk: window.__j.jkind, jp: window.__j.jp, jt: +window.__j.jt.toFixed(2), kind: window.__j.rig.kind })")
    step_until("window.__j.jp === 2 && window.__j.jt > (window.__j.jT || 0.6) * 0.45")
    orbit('__j', 1.5708, 3.3, 0.3, 0.04); shot('m14c-jumper-leap')
    R['leap'] = ev("({ y: +window.__j.pos.y.toFixed(2), lift: +(window.__j.jLift || 0).toFixed(2), jt: +window.__j.jt.toFixed(2), T: window.__j.jT, kind: window.__j.jkind })")
    hud(True)
    R['errors'] = errs[:6]; print(json.dumps(R, indent=1)); b.close()
