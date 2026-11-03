# M14b tests (logic sim, no screenshots): the Fog wave is gone from the special rotation (waves 3..28), crawlers
# crawl (surging speed synced to arm pulls, planted hands, arm bones moving) and still reach the player, for both
# Crawler Rush crawlers and husks that lost a leg; a full Crawler Rush wave still clears. usage: test_m14b.py URL [cases]
import sys, json
from playwright.sync_api import sync_playwright
url = sys.argv[1]; cases = sys.argv[2].split(',') if len(sys.argv) > 2 else ['rotation', 'crawl', 'legless', 'rush']
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
    if 'rotation' in cases:
        rows = ev("""() => { const H = game.horde, out = []; game.state = 'paused';
          for (let w = 1; w <= 28; w++) { const i = __debug.wave(w); out.push({ w, special: i.special, banner: document.getElementById('banner-t').textContent }); }
          H.reset(); H.running = false; game.state = 'play'; return out; }""")
        sp = {r['w']: r['special'] for r in rows if r['special']}
        R['rotation'] = sp
        check('special waves only on 3, 8, 13, 18, 23, 28', sorted(sp) == [3, 8, 13, 18, 23, 28], sp)
        check('no fog wave anywhere', all(v != 'fog' for v in sp.values()) and not any('FOG' in r['banner'] for r in rows))
        check('rotation crawler, sprinter, blackout, armored, then repeats', [sp[w] for w in [3, 8, 13, 18, 23, 28]] == ['crawler', 'sprinter', 'blackout', 'armored', 'crawler', 'sprinter'])
        check('no special on boss waves', all(w % 5 != 0 for w in sp))
        hard = ev("""() => { const o = {}; for (const w of [3, 23]) { const i = __debug.wave(w); o[w] = { count: i.count, hp: i.hpMul, gap: i.gap }; } game.horde.reset(); game.horde.running = false; return o; }""")
        check('second Crawler Rush is harder than the first', hard['23']['count'] > hard['3']['count'] and hard['23']['hp'] >= hard['3']['hp'], hard)
    CRAWL_SIM = """([kind, speed, legless]) => { const H = game.horde, P = game.player, V = P.pos.constructor, N = H.nav; game.state = 'paused'; H.reset(); H.running = false; H.wave = 3;
      // open, flat strip 14 m long
      let spot = null; for (let x = -30; x <= 30 && !spot; x += 2) for (let z = -16; z <= 32 && !spot; z += 2) { let ok = true; for (let d = -1; d <= 15 && ok; d++) for (const dx of [-1.5, 0, 1.5]) { const c = N.cellOf(x + dx, z - d); if (c < 0 || N.blocked[c] || Math.abs(N.height[c]) > 0.2) { ok = false; break; } } if (ok) spot = [x, z]; }
      const [px, pz] = spot; P.pos.set(px, 0, pz); P.vel.set(0, 0, 0);
      const e = H.spawn(kind, new V(px, 0, pz - 13)); e.aware = true; e.attackCd = 999; if (speed) e.speed = speed;
      if (legless) { e.hp = e.maxHp = 9999; for (let i = 0; i < 12 && !(e.lost & (1 << 7)); i++) H.damage(e, 45, 'limb', e.joints[10].clone(), new V(0, 0, -1), { id: 'sg' }, 7); e.hp = e.maxHp = 9999; e.stagger = 0; }
      const crawl0 = e.crawl, dt = 1 / 60, sp = [], armL = [], armR = [], hand = [];
      const q0 = e.rig.bones.LeftArm.quaternion.clone(), qPrev = { L: e.rig.bones.LeftArm.quaternion.clone(), R: e.rig.bones.RightArm.quaternion.clone() };
      let reach = -1, f = 0, turnL = 0, turnR = 0, planted = { n: 0, slip: 0, body: 0 }, prevH = null, prevPos = e.pos.clone(), pulls0 = e.cph;
      for (; f < 30 / dt; f++) { game.time += dt; P.pos.set(px, 0, pz); H.update(dt, game.time, game.camera);
        const v = Math.hypot(e.pos.x - prevPos.x, e.pos.z - prevPos.z) / dt; sp.push(v);
        const B = e.rig.bones; turnL += B.LeftArm.quaternion.angleTo(qPrev.L); turnR += B.RightArm.quaternion.angleTo(qPrev.R); qPrev.L.copy(B.LeftArm.quaternion); qPrev.R.copy(B.RightArm.quaternion);
        // the pulling hand should stay put on the ground while the body slides past it
        const u = e.cph % 1, pullL = Math.floor(e.cph) % 2 === 0, hj = e.joints[pullL ? 5 : 8];
        if (prevH && prevH.side === pullL && u > 0.08 && u < 0.55 && f > 30) { planted.n++; planted.slip += Math.hypot(hj.x - prevH.x, hj.z - prevH.z); planted.body += Math.hypot(e.pos.x - prevPos.x, e.pos.z - prevPos.z); }
        prevH = { x: hj.x, z: hj.z, side: pullL }; prevPos.copy(e.pos);
        if (Math.hypot(e.pos.x - px, e.pos.z - pz) < 1.7) { reach = +(f * dt).toFixed(2); break; } }
      // speed through each pull: lunge vs pause, after the first second (spin-up)
      const s = sp.slice(60), avg = s.reduce((a, b) => a + b, 0) / Math.max(1, s.length);
      const sorted = [...s].sort((a, b) => a - b), lo = sorted[Math.floor(sorted.length * 0.1)] || 0, hi = sorted[Math.floor(sorted.length * 0.9)] || 0;
      const out = { kind, legless, crawl: e.crawl, crawlAtStart: crawl0, target: +(e.type.crawler ? e.speed : Math.min(1.2, Math.max(0.55, e.speed * 0.4))).toFixed(2), avg: +avg.toFixed(2), p10: +lo.toFixed(2), p90: +hi.toFixed(2), reachS: reach, pulls: +(e.cph - pulls0 + (e.cph < pulls0 ? 64 : 0)).toFixed(1),
        armTurnL: +turnL.toFixed(1), armTurnR: +turnR.toFixed(1), handSlipPerMetre: +(planted.slip / Math.max(1e-3, planted.body)).toFixed(3), lost: e.lost, stuckRespawns: e.respawned };
      H.reset(); game.state = 'play'; return out; }"""
    def crawl_checks(tag, r):
        check(f'{tag}: is crawling', r['crawl'], r)
        check(f'{tag}: reaches the player', r['reachS'] > 0)
        check(f'{tag}: speed surges (p90 at least 2.5x p10)', r['p90'] > 2.5 * max(0.05, r['p10']))
        check(f'{tag}: average speed within 20% of its set speed', abs(r['avg'] - r['target']) < 0.2 * r['target'])
        check(f'{tag}: both arms move (bone rotation > 3 rad each)', r['armTurnL'] > 3 and r['armTurnR'] > 3)
        check(f'{tag}: pulling hand stays planted (slips < 25% of body travel)', r['handSlipPerMetre'] < 0.25)
    if 'crawl' in cases:
        R['crawl'] = [ev(CRAWL_SIM, ['crawler', s, False]) for s in [None, 3.5, 4.6]]
        for r in R['crawl']: crawl_checks(f"crawler @{r['target']}", r)
    if 'legless' in cases:
        R['legless'] = ev(CRAWL_SIM, ['runner', None, True])
        crawl_checks('husk with a leg shot off', R['legless'])
    if 'rush' in cases:
        R['rush'] = ev("""() => { const H = game.horde, P = game.player, V = P.pos.constructor; game.state = 'paused'; H.reset(); H.running = true; P.pos.set(4, 0, 6); P.health = P.maxHealth; P.alive = true;
          const info = __debug.wave(3); let ended = false, f = 0, crawlers = 0, reached = 0, respawns = 0; const seen = new Set(); const oe = game.onWaveEnd.bind(game); game.onWaveEnd = (n) => { ended = true; oe(n); };
          for (; f < 240 * 30 && !ended; f++) { game.time += 1/30; P.pos.set(4, 0, 6); H.update(1/30, game.time, game.camera);
            for (const e of H.enemies) { if (e.dead) continue; if (e.type.crawler && !seen.has(e)) { seen.add(e); crawlers++; } e.aware = true; const d = Math.hypot(e.pos.x - 4, e.pos.z - 6); if (d < 3.2) { reached++; respawns += e.respawned || 0; e.hp = 0; H.kill(e, e.pos.clone(), new V(0, 0, 1), 50, { id: 'ar' }, false); } } }
          game.onWaveEnd = oe; const res = { info, ended, sec: Math.round(f / 30), crawlers, reached, respawns }; H.reset(); H.running = false; game.state = 'play'; return res; }""")
        r = R['rush']; check('Crawler Rush wave: every crawler reaches the player and the wave ends', r['ended'] and r['crawlers'] > 5 and r['reached'] >= r['info']['count'] * 0.95, r)
    R['errors'] = errs[:8]
    check('no page errors', not errs, errs[:3])
    print(json.dumps(R, indent=1))
    print('RESULT', 'ALL PASS' if not F else 'FAILED: ' + '; '.join(F))
    b.close()
