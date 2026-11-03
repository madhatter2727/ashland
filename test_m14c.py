# M14c tests (logic sim, no screenshots): Brute / Bloater / Jumper each spawn on their new body, animate and reach
# the player; the Brute's stomp shakes the camera when close; a dying Bloater swells for about a second before it
# bursts; a leaping Jumper is drawn above its flight path (arc lift) and leaves the ground. usage: test_m14c.py URL
import sys, json
from playwright.sync_api import sync_playwright
url = sys.argv[1]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': 640, 'height': 360}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e) + ' @ ' + (e.stack or '')[:400])); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    if 'vercel.app' in url: pg.route('**/api/scores', lambda r: r.abort() if r.request.method == 'POST' else r.continue_())
    pg.goto(url); pg.wait_for_function('window.__ready === true', timeout=240000); ev = pg.evaluate
    ev("__debug.start(); __debug.god(true); game.horde.running = false; game.horde.reset()")
    R = {}; F = []
    def check(name, ok, info=None):
        if not ok: F.append(name)
        print(('PASS ' if ok else 'FAIL ') + name + ('' if info is None else '  ' + json.dumps(info)), flush=True)
    SIM = """([kind, wave]) => { const H = game.horde, P = game.player, V = P.pos.constructor, N = H.nav; game.state = 'paused'; H.reset(); H.running = false; H.wave = wave; game.trauma = 0;
      let spot = null; for (let x = -30; x <= 30 && !spot; x += 2) for (let z = -16; z <= 32 && !spot; z += 2) { let ok = true; for (let d = -1; d <= 15 && ok; d++) for (const dx of [-1.5, 0, 1.5]) { const c = N.cellOf(x + dx, z - d); if (c < 0 || N.blocked[c] || Math.abs(N.height[c]) > 0.3) ok = false; } if (ok) spot = [x, z]; }
      const [px, pz] = spot; P.pos.set(px, 0, pz); P.vel.set(0, 0, 0);
      const e = H.spawn(kind, new V(px, 0, pz - 13)); e.aware = true; e.attackCd = 999; e.hp = e.maxHp = 1e6; if (kind === 'jumper') e.jcd = 0;
      const dt = 1 / 60, B = e.rig.bones, q = { L: B.LeftArm.quaternion.clone(), R: B.RightUpLeg.quaternion.clone() };
      let turn = 0, reach = -1, maxLift = 0, maxY = 0, leaps = 0, wasAir = false, shakeNear = 0, f = 0;
      const body = e.rig.kind;
      for (; f < 40 / dt; f++) { game.time += dt; P.pos.set(px, 0, pz); const t0 = game.trauma || 0; H.update(dt, game.time, game.camera);
        turn += B.LeftArm.quaternion.angleTo(q.L) + B.RightUpLeg.quaternion.angleTo(q.R); q.L.copy(B.LeftArm.quaternion); q.R.copy(B.RightUpLeg.quaternion);
        const d = Math.hypot(e.pos.x - px, e.pos.z - pz);
        if (e.jp === 2) { maxLift = Math.max(maxLift, e.jLift || 0); maxY = Math.max(maxY, e.pos.y); if (!wasAir) leaps++; } wasAir = e.jp === 2;
        if (d < 8 && (game.trauma || 0) > t0 + 1e-4) shakeNear++;
        game.trauma = Math.max(0, (game.trauma || 0) - dt);
        if (d < 1.9 && reach < 0) reach = +(f * dt).toFixed(2);
        if (reach >= 0 && (kind !== 'brute' || f * dt > reach + 3)) break; }
      const out = { kind, body, reachS: reach, armLegTurn: +turn.toFixed(1), maxLift: +maxLift.toFixed(2), maxY: +maxY.toFixed(2), leaps, shakeNear };
      if (kind === 'bloater') { // kill it: it should stay up and swell for ~1 s, then burst
        let burstAt = -1, maxSwell = 0, swellAtBurst = 0, scale0 = e.rig.root.scale.x, maxScale = scale0; const oh = H.hooks.onBloaterBurst; H.hooks.onBloaterBurst = (p2, z) => { if (burstAt < 0) { burstAt = k * dt; swellAtBurst = maxSwell; } oh(p2, z); };
        e.hp = e.maxHp = 100; H.damage(e, 9999, 'body', e.joints[1].clone(), new V(0, 0, 1), { id: 'ar' }, 0);
        let k = 0; for (; k < 3 / dt && burstAt < 0; k++) { game.time += dt; H.update(dt, game.time, game.camera); if (burstAt < 0) { maxSwell = Math.max(maxSwell, e.swell || 0); maxScale = Math.max(maxScale, e.rig ? e.rig.root.scale.x : 0); } }
        H.hooks.onBloaterBurst = oh;
        Object.assign(out, { dead: e.dead, burstAtS: +burstAt.toFixed(2), swellBeforeBurst: +swellAtBurst.toFixed(2), swellScale: +(maxScale / scale0).toFixed(3) });
      }
      H.reset(); game.state = 'play'; return out; }"""
    for kind, wave in [('brute', 8), ('bloater', 7), ('jumper', 6)]:
        r = R[kind] = ev(SIM, [kind, wave])
        check(f'{kind}: spawns on its own body shape', r['body'] == kind, r)
        check(f'{kind}: animates (arm + leg bones turn > 3 rad)', r['armLegTurn'] > 3)
        check(f'{kind}: reaches the player', r['reachS'] > 0)
    check('brute: stomps shake the camera when close', R['brute']['shakeNear'] >= 2, R['brute']['shakeNear'])
    bl = R['bloater']
    check('bloater: swells before it bursts (swell > 0.8, body grows)', bl['swellBeforeBurst'] > 0.8 and bl['swellScale'] > 1.03, bl)
    check('bloater: bursts about 1 s after death (0.8-1.3 s)', 0.8 <= bl['burstAtS'] <= 1.3)
    j = R['jumper']
    check('jumper: leaps (at least once on the way in)', j['leaps'] >= 1, j)
    check('jumper: visible arc in the air (lift > 0 and leaves the ground)', j['maxLift'] > 0 and j['maxY'] > 0.2)
    R['errors'] = errs[:8]
    check('no page errors', not errs, errs[:3])
    print(json.dumps(R, indent=1))
    print('RESULT', 'ALL PASS' if not F else 'FAILED: ' + '; '.join(F))
    b.close()
