// THE MIDWAY (east edge + the east half of the plaza): two-storey game halls behind a cast-iron colonnade
// and a shattered glass marquise, painted oxblood and bottle green under faded gilt signboards; the gilt
// carousel (static, uncanny: mirrored drum, gilded horses, a torn velvet canopy); painted game booths.
import * as THREE from 'three';
import { bulbRow } from './showfront.js';
import { Frame, P, molding, moldingRing, column, lathe, merge, ironRailing, wallWithOpenings, archSurround, keystone, pilaster, balustrade, mansard } from './kit.js';
import { storey } from './facade.js';
import { paintedSign, giltText } from './signs.js';

const signCache = new Map();
function signMesh(text, w, h, opt = {}) {
  const key = text + JSON.stringify(opt);
  if (!signCache.has(key)) signCache.set(key, new THREE.MeshStandardMaterial({ map: paintedSign(text, opt), roughness: 0.75, metalness: 0.05, envMapIntensity: 0.6 }));
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), signCache.get(key)); m.receiveShadow = true; return m;
}
const place = (F, mesh, x, y, z, ry = 0) => { mesh.position.copy(F.point(x, y, z)); mesh.rotation.y = F.rotY + ry; return mesh; };

const HALLS = [
  ['HALL OF MIRRORS', 'see yourself as others do', 'red'], ['SHOOTING GALLERY', 'prizes for every marksman', 'green'], ['THE PENNY ARCADE', 'mechanical wonders', 'red'],
  ['FORTUNES TOLD', 'by appointment only', 'green'], ['WAXWORKS', 'the famous & the infamous', 'red'], ['HALL OF MARVELS', 'curiosities of the age', 'green'],
];

export function buildMidway(ctx) {
  const { B, M, rr, scene } = ctx;
  const F = new Frame(B, 36, 0, -Math.PI / 2); // local x = world z, +z = west into the arena
  let hi = 0;
  for (const [xa, xb] of [[-44, -3.6], [3.6, 44]]) {
    F.col(xa, xb, 0, 14, -8, 0, { surface: 'wood' });
    const n = Math.round((xb - xa) / 10), hw = (xb - xa) / n;
    for (let k = 0; k < n; k++) {
      const a = xa + k * hw, b = a + hw, [title, sub, tone] = HALLS[hi++ % HALLS.length], paint = tone === 'red' ? M.redPaint : M.greenPaint;
      // ground floor: painted timber front, boarded arched openings
      storey(F, M, rr, a + 0.3, b - 0.3, { y0: 0, y1: 5.2, bay: 3.2, mat: paint, thick: 0.3, win: { w: 2.0, sill: 0.5, spring: 3.4 }, surround: M.gold, fills: ['boards', 'boards', 'broken', 'shutter'], frame: M.iron, shutterMat: M.boards });
      // upper floor: big lunette window flanked by gilt pilasters
      const up = 5.2, upH = 4.6;
      F.geo(paint, wallWithOpenings(a + 0.3, b - 0.3, up, up + upH, [{ x0: (a + b) / 2 - 2.2, x1: (a + b) / 2 + 2.2, y0: up + 0.9, spring: up + 2.2 }], 0.3));
      const ip = new THREE.PlaneGeometry(hw, upH); ip.translate((a + b) / 2, up + upH / 2, -0.32); F.geo(M.interior, ip, 'keep');
      F.geo(M.gold, archSurround((a + b) / 2 - 2.2, (a + b) / 2 + 2.2, up + 0.9, up + 2.2, { w: 0.2, d: 0.08 }));
      const fanBars = []; for (let r = 0; r < 9; r++) { const ang = (r / 8) * Math.PI, bb = new THREE.BoxGeometry(0.04, 2.2, 0.04); bb.translate(0, 1.1, 0); bb.rotateZ(Math.PI / 2 - ang); bb.translate((a + b) / 2, up + 2.2, -0.1); fanBars.push(bb); }
      for (const yy of [1.4, 2.0]) { const bb = new THREE.BoxGeometry(4.4, 0.04, 0.04); bb.translate((a + b) / 2, up + yy, -0.1); fanBars.push(bb); }
      F.geo(M.iron, merge(fanBars));
      if (rr() < 0.6) { const sh = new THREE.Shape(); sh.moveTo((a + b) / 2 - 2.1, up + 0.95); sh.lineTo((a + b) / 2 + 2.1, up + 0.95); sh.lineTo((a + b) / 2 + 2.1, up + 2.2); sh.absarc((a + b) / 2, up + 2.2, 2.1, 0, Math.PI, false); sh.closePath(); F.geo(M.glass, new THREE.ShapeGeometry(sh, 16).translate(0, 0, -0.12), 'keep'); }
      for (const px of [a + 0.6, b - 0.6]) { const g = pilaster(upH, 0.42, 0.14); g.translate(px, up, 0); F.geo(M.gold, g); }
      // crown: shaped (arched) parapet with the hall's signboard, finials, ragged pennant poles
      const cx = (a + b) / 2, cw = hw - 0.8, crown = new THREE.Shape();
      crown.moveTo(-cw / 2, 0); crown.lineTo(cw / 2, 0); crown.lineTo(cw / 2, 0.6);
      for (let i = 0; i <= 20; i++) { const t = i / 20, x = cw / 2 - t * cw, y = 0.6 + Math.sin(t * Math.PI) * 1.8 + (Math.abs(t - 0.5) < 0.18 ? 0.35 * Math.cos((t - 0.5) / 0.18 * Math.PI / 2) : 0); crown.lineTo(x, y); }
      crown.closePath();
      const cg = new THREE.ExtrudeGeometry(crown, { depth: 0.35, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 1 }); cg.translate(cx, up + upH, -0.35); F.geo(paint, cg);
      const edge = []; for (let i = 0; i < 20; i++) { const t0 = i / 20, t1 = (i + 1) / 20, y0 = 0.6 + Math.sin(t0 * Math.PI) * 1.8, y1 = 0.6 + Math.sin(t1 * Math.PI) * 1.8; const x0 = cw / 2 - t0 * cw, x1 = cw / 2 - t1 * cw; const L = Math.hypot(x1 - x0, y1 - y0), g = new THREE.BoxGeometry(L, 0.14, 0.5); g.rotateZ(Math.atan2(y1 - y0, x1 - x0)); g.translate(cx + (x0 + x1) / 2, up + upH + (y0 + y1) / 2 + 0.05, -0.15); edge.push(g); }
      F.geo(M.gold, merge(edge));
      F.geo(M.gold, molding(P.cornice(0.5), a + 0.3, b - 0.3, up + upH - 0.3, 0));
      F.geo(M.gold, molding(P.string(1.1), a + 0.3, b - 0.3, up - 0.1, 0));
      scene.add(place(F, signMesh(title, cw * 0.8, 0.95, { bg: tone === 'red' ? '#3d1210' : '#14281d', fg: '#c9a24f', sub, h: 300 }), cx, up + upH + 1.05, 0.06));
      for (const fx of [-cw / 2, cw / 2]) { const fin = lathe([[0.18, 0], [0.22, 0.15], [0.12, 0.3], [0.2, 0.55], [0.06, 0.95], [0.09, 1.05], [0, 1.25]], 12); fin.translate(cx + fx, up + upH + 0.6, -0.18); F.geo(M.gold, fin); }
      const pole = new THREE.CylinderGeometry(0.04, 0.05, 4.2, 8); pole.translate(cx, up + upH + 2.4 + 2.1, -0.18); F.geo(M.iron, pole);
      // a shredded pennant (velvet strips)
      const pen = []; for (let s = 0; s < 4; s++) { const L = 1.4 + rr() * 1.4, g = new THREE.PlaneGeometry(L, 0.16, 6, 1); const pa = g.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i) + L / 2; pa.setY(i, pa.getY(i) - x * x * 0.08 - s * 0.17); pa.setZ(i, Math.sin(x * 2.2 + s) * 0.12); } g.translate(L / 2, 0, 0); g.translate(cx + 0.05, up + upH + 6.3, -0.18); pen.push(g); }
      const pm = merge(pen); F.geo(M.velvet, pm);
      // roof behind the crown
      const rf = mansard(hw - 0.4, 7, 2.2, 1.6, 0.6); rf.translate(cx, up + upH, -4); F.geo(M.slate, rf);
    }
  }
  // cast-iron colonnade + glass marquise along the whole front (gate left open)
  for (const [xa, xb] of [[-35.4, -4.4], [4.4, 35.4]]) {
    const n = Math.round((xb - xa) / 3.4), step = (xb - xa) / n;
    for (let i = 0; i <= n; i++) {
      const x = xa + i * step; if (ctx.inArea(F.point(x, 0, 2.4).x, F.point(x, 0, 2.4).z, 0.5)) continue;
      const c = column(4.2, 0.13, { flutes: 10, seg: 16, capital: 'corinthian' }); c.translate(x, 0, 2.3); F.geo(M.iron, c);
      F.col(x - 0.16, x + 0.16, 0, 4.2, 2.14, 2.46, { surface: 'metal' });
      const br = new THREE.TorusGeometry(0.75, 0.035, 5, 16, Math.PI / 2); br.rotateY(Math.PI / 2); br.translate(x, 3.45, 1.55); F.geo(M.iron, br);
    }
    F.box(M.iron, xa, xb, 4.2, 4.42, 2.2, 2.4);
    F.geo(M.gold, molding([[0, 0], [0.06, 0.02], [0.06, 0.18], [0, 0.22]], xa, xb, 4.18, 2.4));
    const val = ironRailing(xb - xa, 0.38, 0.1); val.rotateZ(Math.PI); val.translate((xa + xb) / 2, 4.2, 2.42); F.geo(M.iron, val);
    // glazing bars of the canopy, a pane or two left
    const bars = []; for (let x = xa; x <= xb + 0.01; x += 1.1) { const g = new THREE.BoxGeometry(0.05, 0.06, 2.6); g.rotateX(-0.22); g.translate(x, 4.75, 1.1); bars.push(g); }
    F.geo(M.iron, merge(bars));
    for (let x = xa; x < xb - 1.1; x += 1.1) if (rr() < 0.3) { const g = new THREE.PlaneGeometry(1.05, 2.4); g.rotateX(-Math.PI / 2 - 0.22); g.translate(x + 0.55, 4.8, 1.1); F.geo(M.glass, g, 'keep'); }
  }
  // the Midway gate: twin pylons with gilt globes and a wrought-iron arch carrying the name
  for (const s of [-1, 1]) {
    const x = s * 4.2;
    F.box(M.stone, x - 0.6, x + 0.6, 0, 6.4, -0.6, 0.6); F.geo(M.marbleTrim, moldingRing(P.cornice(0.4), 1.2, 1.2, 6.2).translate(x, 0, 0));
    F.geo(M.marbleTrim, moldingRing(P.plinth(0.6), 1.2, 1.2, 0).translate(x, 0, 0));
    const globe = new THREE.SphereGeometry(0.5, 24, 16); globe.translate(x, 7.35, 0); F.geo(M.gold, globe);
    const ped = lathe([[0.5, 0], [0.42, 0.15], [0.2, 0.3], [0.25, 0.5], [0, 0.55]], 16); ped.translate(x, 6.45, 0); F.geo(M.stone, ped);
    F.col(x - 0.6, x + 0.6, 0, 6.4, -0.6, 0.6);
  }
  const arch = []; for (const r of [3.7, 3.25]) { const t = new THREE.TorusGeometry(r, 0.05, 6, 40, Math.PI); t.translate(0, 6.0, 0); arch.push(t); }
  for (let k = 1; k < 16; k++) { const a = (k / 16) * Math.PI, g = new THREE.BoxGeometry(0.03, 0.45, 0.03); g.translate(0, 3.475, 0); g.rotateZ(Math.PI / 2 - a); g.translate(0, 6.0, 0); arch.push(g); }
  F.geo(M.iron, merge(arch));
  const nm = giltText(M.gold, 'THE MIDWAY', 4.6, 0.75, { size: 190, spacing: 0.26 }); scene.add(place(F, nm, 0, 9.0, 0.04));
}

// ---------- boarded game stall on an old container footprint ----------
export function stall(ctx, x, z, rot, i, y0 = 0, counter = 1) {
  // A midway game booth on the old container footprint (same collider, flat walkable roof): board-and-batten
  // walls, an open counter with dusty prizes on shelves, a timber awning with a scalloped valance and dead
  // bulbs, an arched crest board with the game's name. The plain long side keeps two framed panels (wall-buys).
  const { B, M, rr, scene } = ctx;
  const L = 6.1, W = 2.44, Hs = 2.6, stacked = i === 0; // stall 0 carries stall 2 on its roof: no crest
  const w = rot ? W : L, d = rot ? L : W;
  B.colliders.push({ minX: x - w / 2, maxX: x + w / 2, minY: y0, maxY: y0 + Hs, minZ: z - d / 2, maxZ: z + d / 2, walk: false, mat: 'wood', top: y0 + Hs });
  const F = new Frame(B, x, z, rot ? Math.PI / 2 : 0, y0);
  const body = i % 2 ? M.woodGreen : M.woodRed, trim = M.woodCream, hw = W / 2;
  F.box(M.stoneDark, -L / 2, L / 2, 0, 0.22, -hw, hw);
  F.box(M.deck, -L / 2, L / 2, Hs - 0.16, Hs, -hw, hw); // flat roof deck
  F.box(trim, -L / 2 - 0.05, L / 2 + 0.05, Hs - 0.32, Hs - 0.14, -hw - 0.05, hw + 0.05);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const p = lathe([[0.1, 0], [0.1, 0.15], [0.07, 0.25], [0.075, 1.7], [0.1, 1.8], [0.06, 1.95], [0.08, 2.0], [0.08, Hs - 0.3], [0, Hs - 0.3]], 10); p.translate(sx * (L / 2 - 0.08), 0.2, sz * (hw - 0.08)); F.geo(M.gold, p); }
  for (const sx of [-1, 1]) F.box(body, sx > 0 ? L / 2 - 0.12 : -L / 2, sx > 0 ? L / 2 : -L / 2 + 0.12, 0.22, Hs - 0.32, -hw + 0.1, hw - 0.1); // end walls
  for (const sz of [-1, 1]) {
    const S = F.sub(0, sz * hw, sz > 0 ? 0 : Math.PI);
    if (sz === counter) {
      // counter: panelled front, thick top, open window to the prize shelves, half the opening plywooded
      S.box(body, -L / 2 + 0.12, L / 2 - 0.12, 0.22, 1.02, -0.12, 0);
      for (let k = -2; k <= 2; k++) { const fr = moldingRing([[0, 0], [0.025, 0], [0.03, 0.02], [0, 0.035]], 0.95, 0.55, 0); fr.rotateX(Math.PI / 2); fr.translate(k * 1.12, 0.62, 0.01); S.geo(M.gold, fr); }
      S.box(trim, -L / 2 + 0.05, L / 2 - 0.05, 1.02, 1.1, -0.2, 0.22);
      S.box(M.interior, -L / 2 + 0.12, L / 2 - 0.12, 1.1, Hs - 0.32, -W + 0.12, -W + 0.18);
      for (const yy of [1.45, 1.85]) S.box(trim, -L / 2 + 0.15, L / 2 - 0.15, yy, yy + 0.04, -W + 0.18, -W + 0.5);
      const glass = [], tin = [];
      for (const yy of [1.49, 1.89]) for (let k = 0; k < 16; k++) { if (rr() < 0.25) continue; const xx = -L / 2 + 0.4 + k * 0.33; if (rr() < 0.5) { const b = lathe([[0.04, 0], [0.045, 0.02], [0.045, 0.16], [0.02, 0.22], [0.015, 0.3], [0, 0.3]], 8); b.translate(xx, yy, -W + 0.32); glass.push(b); } else { const c = new THREE.CylinderGeometry(0.05, 0.05, 0.13, 10); c.translate(xx, yy + 0.065, -W + 0.32); tin.push(c); } }
      for (let k = 0; k < 6; k++) { const c = new THREE.CylinderGeometry(0.05, 0.05, 0.13, 10); c.rotateZ(Math.PI / 2); c.rotateY(rr() * 3); c.translate(-L / 2 + 0.6 + rr() * (L - 1.2), 1.15, -0.4 - rr() * 0.6); tin.push(c); }
      if (glass.length) S.geo(M.glass, merge(glass), 'keep'); if (tin.length) S.geo(M.brass, merge(tin));
      const ply = new THREE.BoxGeometry(L / 2 - 0.2, Hs - 1.45, 0.03); ply.rotateZ((rr() - 0.5) * 0.05); ply.translate((i % 3 ? 1 : -1) * (L / 4 - 0.05), (Hs - 0.32 + 1.1) / 2, 0.02); S.geo(M.plywood, ply);
      // awning on brackets with a scalloped valance and bulbs
      const aw = new THREE.BoxGeometry(L + 0.2, 0.06, 1.05); aw.rotateX(0.22); aw.translate(0, Hs - 0.42, 0.5); S.geo(body === M.woodRed ? M.woodGreen : M.woodRed, aw);
      for (let k = 0; k < 12; k++) { const sc = archSurround(-L / 2 - 0.1 + k * (L + 0.2) / 12, -L / 2 - 0.1 + (k + 1) * (L + 0.2) / 12, 0, 0, { w: 0.03, d: 0.03, seg: 0.12 }); sc.rotateX(Math.PI); sc.translate(0, Hs - 0.52, 1.02); S.geo(trim, sc); }
      for (const sx of [-1, 0, 1]) { const br = new THREE.BoxGeometry(0.06, 0.06, 1.0); br.rotateX(-0.75); br.translate(sx * (L / 2 - 0.1), Hs - 0.75, 0.45); S.geo(M.iron, br); }
      bulbRow(ctx, S, -L / 2, Hs - 0.62, 1.04, L / 2, Hs - 0.62, 1.04, 0.38, 0.08, i * 9 + 3);
      if (!stacked) { // arched crest board with the game's name
        const crest = new THREE.Shape(); crest.moveTo(-L / 2 + 0.3, 0); crest.lineTo(L / 2 - 0.3, 0); crest.lineTo(L / 2 - 0.3, 0.35); crest.quadraticCurveTo(0, 1.05, -L / 2 + 0.3, 0.35); crest.closePath();
        const cg = new THREE.ExtrudeGeometry(crest, { depth: 0.08, bevelEnabled: false }); cg.translate(0, Hs - 0.05, -0.12); S.geo(body, cg);
        const sign = signMesh(['RING-A-PEG', 'COCONUT SHY', 'HOOK-A-DUCK', 'TEST YOUR STRENGTH', 'ROLL-A-PENNY', 'LUCKY DIP', 'HOOPLA', 'THE TIP-TOP'][i % 8], L - 1.6, 0.42, { bg: i % 2 ? '#14281d' : '#3d1210', h: 200 });
        scene.add(place(S, sign, 0, Hs + 0.3, -0.02));
        for (let k = 0; k <= 10; k++) { const t = k / 10, xx = -L / 2 + 0.3 + t * (L - 0.6), yy = Hs - 0.05 + 0.35 + (1 - (2 * t - 1) ** 2) * 0.35; ctx.bulbs.push({ p: S.point(xx, yy, 0.0), lit: rr() < 0.1 }); }
      }
    } else {
      S.box(body, -L / 2 + 0.12, L / 2 - 0.12, 0.22, Hs - 0.32, -0.1, 0);
      for (const k of [-1, 1]) { const fr = moldingRing([[0, 0], [0.03, 0], [0.04, 0.03], [0, 0.05]], 1.6, 0.9, 0); fr.rotateX(Math.PI / 2); fr.translate(k * 1.85, 1.15, 0.02); S.geo(M.gold, fr); }
      S.box(trim, -L / 2 + 0.12, L / 2 - 0.12, 0.22, 0.4, 0, 0.04);
    }
  }
}

// ---------- the carousel: octagonal, static, gilded, a little wrong ----------
export function buildCarousel(ctx, cx, cz) {
  const { B, M, rr, scene, propAt, lights } = ctx;
  const a = 3.0, R = a / Math.cos(Math.PI / 8), s = 2.12;
  B.col(cx - a, cx + a, 0, 2.4, cz - 1.24, cz + 1.24, { surface: 'wood' });
  B.col(cx - 1.24, cx + 1.24, 0, 2.4, cz - a, cz + a, { surface: 'wood' });
  B.col(cx - s, cx + s, 0, 2.4, cz - s, cz + s, { surface: 'wood' });
  const oct = (r, y0, y1, mat, seg = 8, open = false) => { const g = new THREE.CylinderGeometry(r, r, y1 - y0, seg, 1, open); g.rotateY(Math.PI / 8); g.translate(cx, (y0 + y1) / 2, cz); B.add(mat, g); return g; };
  // platform: stone step, oxblood skirt with gilt panels, plank deck, brass edge
  oct(R + 0.15, 0, 0.12, M.stoneDark); oct(R, 0.12, 0.5, M.redPaint); oct(R + 0.03, 0.5, 0.56, M.brass); oct(R - 0.05, 0.56, 0.58, M.boards);
  for (let k = 0; k < 8; k++) { const ang = (k / 8) * Math.PI * 2, F = new Frame(B, cx + Math.sin(ang) * a, cz + Math.cos(ang) * a, ang); const fr = moldingRing([[0, 0], [0.03, 0], [0.035, 0.025], [0, 0.04]], 1.7, 0.22, 0); fr.rotateX(Math.PI / 2); fr.translate(0, 0.31, 0.01); F.geo(M.gold, fr); }
  // the mirrored central drum
  oct(1.25, 0.58, 3.4, M.redPaint); oct(1.32, 0.58, 0.8, M.gold); oct(1.32, 3.25, 3.45, M.gold);
  for (let k = 0; k < 8; k++) { const ang = (k / 8) * Math.PI * 2; ctx.propAt('ornate_mirror_01', cx + Math.sin(ang) * 1.17, 1.15, cz + Math.cos(ang) * 1.17, ang, 1.55); }
  // brass poles with gilded horses, two rings; a couple of horses gone
  const poles = [];
  for (const [rr0, n, off] of [[2.45, 8, 0], [1.85, 8, Math.PI / 8]]) for (let k = 0; k < n; k++) {
    const ang = (k / n) * Math.PI * 2 + off, px = cx + Math.sin(ang) * rr0, pz = cz + Math.cos(ang) * rr0;
    const p = new THREE.CylinderGeometry(0.035, 0.035, 3.6, 10); const pa = p.attributes.position; for (let i = 0; i < pa.count; i++) { const y = pa.getY(i), t = Math.atan2(pa.getZ(i), pa.getX(i)); const rr1 = 0.035 + 0.006 * Math.sin(t * 2 + y * 18); pa.setX(i, Math.cos(t) * rr1); pa.setZ(i, Math.sin(t) * rr1); }
    p.translate(px, 0.58 + 1.8, pz); poles.push(p);
    if ((k + (rr0 > 2 ? 0 : 3)) % 7 !== 5) {
      const hy = 0.75 + ((k % 2) ? 0.25 : 0) + rr() * 0.15;
      propAt('horse_statue_01', px, hy, pz, ang + Math.PI / 2, 1.5, { mat: 'gold' });
    }
  }
  B.add(M.brass, merge(poles));
  // canopy: rafters, torn velvet panels, rounding board with dead bulbs, a crown and finial
  const cy = 4.15, raf = [];
  for (let k = 0; k < 8; k++) { const ang = (k / 8) * Math.PI * 2 + Math.PI / 8, len = R + 0.5; const g = new THREE.BoxGeometry(0.08, 0.1, len); g.translate(0, 0, len / 2); g.rotateX(-0.42); g.rotateY(ang); g.translate(cx, cy + 1.45, cz); raf.push(g); }
  B.add(M.iron, merge(raf));
  const panels = [];
  for (let k = 0; k < 8; k++) {
    if (k === 2 || k === 5) continue; // torn away
    const a0 = (k / 8) * Math.PI * 2 + Math.PI / 8, a1 = a0 + Math.PI / 4, Rr = R + 0.5;
    const g = new THREE.BufferGeometry(); const ring = 5, pos = [];
    for (let i = 0; i < ring; i++) {
      const t0 = i / ring, t1 = (i + 1) / ring, sag = (t) => Math.sin(t * Math.PI) * 0.18;
      const P0 = (t, aa) => [cx + Math.sin(aa) * Rr * t, cy + 1.55 + 1.6 * (1 - t) - sag(t) * 0.5, cz + Math.cos(aa) * Rr * t];
      const tear = k === 6 && i === ring - 1;
      if (tear) continue;
      const q = [P0(t0, a0), P0(t1, a0), P0(t1, a1), P0(t0, a1)];
      pos.push(...q[0], ...q[1], ...q[2], ...q[0], ...q[2], ...q[3]);
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); panels.push(g);
    const g2 = g.clone(); const p2 = g2.attributes.position; for (let i = 0; i < p2.count; i += 3) { const x = p2.getX(i + 1), y = p2.getY(i + 1), z = p2.getZ(i + 1); p2.setXYZ(i + 1, p2.getX(i + 2), p2.getY(i + 2), p2.getZ(i + 2)); p2.setXYZ(i + 2, x, y, z); } g2.computeVertexNormals(); panels.push(g2);
  }
  B.add(M.velvet, merge(panels));
  const rb = new THREE.CylinderGeometry(R + 0.55, R + 0.55, 0.75, 8, 1, true); rb.rotateY(Math.PI / 8); rb.translate(cx, cy + 1.2, cz); B.add(M.redPaint, rb);
  const rbIn = new THREE.CylinderGeometry(R + 0.5, R + 0.5, 0.75, 8, 1, true); rbIn.rotateY(Math.PI / 8); rbIn.scale(-1, 1, 1); rbIn.translate(cx, cy + 1.2, cz); B.add(M.redPaint, rbIn);
  for (const yy of [cy + 0.82, cy + 1.58]) { const t = new THREE.CylinderGeometry(R + 0.62, R + 0.62, 0.08, 8, 1, true); t.rotateY(Math.PI / 8); t.translate(cx, yy, cz); B.add(M.gold, t); }
  for (let k = 0; k < 8; k++) { const ang = (k / 8) * Math.PI * 2, F = new Frame(B, cx + Math.sin(ang) * (R + 0.5) * Math.cos(Math.PI / 8), cz + Math.cos(ang) * (R + 0.5) * Math.cos(Math.PI / 8), ang, cy + 1.2); const sh = new THREE.TorusGeometry(0.22, 0.05, 6, 16); sh.translate(0, 0, 0.06); F.geo(M.gold, sh); const m = new THREE.CircleGeometry(0.2, 16); m.translate(0, 0, 0.05); F.geo(M.glass, m, 'keep'); }
  const crown = lathe([[R * 0.5, 0], [R * 0.48, 0.3], [R * 0.3, 0.55], [0.4, 0.9], [0.3, 1.1], [0, 1.15]], 8); crown.rotateY(Math.PI / 8); crown.translate(cx, cy + 3.05, cz); B.add(M.gold, crown);
  const fin = lathe([[0.18, 0], [0.24, 0.2], [0.1, 0.45], [0.16, 0.7], [0.03, 1.4], [0, 1.5]], 12); fin.translate(cx, cy + 4.15, cz); B.add(M.gold, fin);
  // dead bulbs round the rounding board; three still glow
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshStandardMaterial({ color: '#d8c8a0', roughness: 0.3, emissive: '#ffb060', emissiveIntensity: 0 }), 48);
  const lit = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 3.2, 1.6) }), 6);
  const mtx = new THREE.Matrix4(); let li = 0;
  for (let k = 0; k < 48; k++) { const ang = (k / 48) * Math.PI * 2, rad = (R + 0.6) * (Math.cos(Math.PI / 8) / Math.cos(((ang + Math.PI / 8) % (Math.PI / 4)) - Math.PI / 8)); mtx.makeTranslation(cx + Math.sin(ang) * rad, cy + 0.9, cz + Math.cos(ang) * rad); bulbs.setMatrixAt(k, mtx); if (k % 9 === 4 && li < 6) lit.setMatrixAt(li++, mtx); }
  lit.count = li; scene.add(bulbs, lit);
  // one horse lies fallen on the setts
  propAt('horse_statue_01', cx - 4.2, 0.35, cz + 3.4, 0.7, 1.5, { mat: 'gold', q: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2) });
  B.col(cx - 4.9, cx - 3.5, 0, 0.6, cz + 2.9, cz + 3.9, { surface: 'metal' });
}
