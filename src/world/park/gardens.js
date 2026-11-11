// THE GARDENS (west edge + west plaza): a long cast-iron orangery with a glass dome over each wing, most of
// its panes gone; inside, the plants it was built for have died where they stood. Out front: a dry
// reflecting pool with a marble horse rearing over weeds, clipped hedges run wild, dead trees.
import * as THREE from 'three';
import { Frame, P, molding, moldingRing, column, lathe, merge, deadTree, ironRailing } from './kit.js';
import { mulberry } from '../../core/util.js';

export function buildGardens(ctx) {
  const { B, M, rr, scene, propAt } = ctx;
  const F = new Frame(B, -36, 0, Math.PI / 2); // local x = world -z, +z = east into the arena
  const D = 8.0, HH = 7.4;
  for (const [xa, xb] of [[-36, -3.6], [3.6, 36]]) {
    F.col(xa, xb, 0, 10, -D, 0, { surface: 'metal' });
    // stone plinth wall, stone back wall, floor
    F.box(M.stoneDark, xa, xb, 0, 1.0, -0.5, 0); F.geo(M.marbleTrim, molding(P.string(1.1), xa, xb, 0.92, 0));
    F.box(M.stone, xa, xb, 0, HH + 3.5, -D - 0.5, -D);
    F.box(M.mud, xa, xb, 0, 0.02, -D, -0.5);
    const n = Math.round((xb - xa) / 2.6), bw = (xb - xa) / n;
    const frame = [], glass = [], boards = [];
    for (let i = 0; i <= n; i++) {
      const x = xa + i * bw;
      const c = column(HH - 1.0, 0.09, { flutes: 8, seg: 12, capital: 'corinthian' }); c.translate(x, 1.0, 0.0); frame.push(c);
      // curved roof rib from the eaves to the ridge (quarter ellipse)
      const pts = []; for (let k = 0; k <= 10; k++) { const a = (k / 10) * Math.PI / 2; pts.push(new THREE.Vector3(x, HH + 0.4 + Math.sin(a) * 3.2, -Math.cos(a) * 0 - (1 - Math.cos(a)) * (D - 0.3) + 0.0)); }
      frame.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.05, 5));
    }
    for (let i = 0; i < n; i++) {
      const x0 = xa + i * bw, x1 = x0 + bw, cx = (x0 + x1) / 2, r = bw / 2 - 0.12;
      // arched head of each bay + glazing bars
      const arc = new THREE.TorusGeometry(r, 0.035, 5, 16, Math.PI); arc.translate(cx, HH - 0.2 - r * 0.2, 0); frame.push(arc);
      for (const fx of [-0.33, 0, 0.33]) { const b = new THREE.BoxGeometry(0.035, HH - 1.6, 0.04); b.translate(cx + fx * bw, 1.0 + (HH - 1.6) / 2, 0); frame.push(b); }
      for (let y = 1.9; y < HH - 0.6; y += 1.05) { const b = new THREE.BoxGeometry(bw, 0.035, 0.04); b.translate(cx, y, 0); frame.push(b); }
      for (let y = 1.0; y < HH - 0.6; y += 1.05) for (const fx of [-0.5, -0.17, 0.17]) {
        const roll = rr();
        if (roll < 0.42) { const g = new THREE.PlaneGeometry(bw / 3 - 0.04, 1.0); g.translate(cx + (fx + 1 / 6) * bw, y + 0.52, -0.01); glass.push(g); }
        else if (roll < 0.47 && y < 3) { const g = new THREE.BoxGeometry(bw / 3, 0.22, 0.03); g.rotateZ((rr() - 0.5) * 0.4); g.translate(cx + (fx + 1 / 6) * bw, y + 0.5, 0.03); boards.push(g); }
      }
      // roof glazing (some)
      for (let k = 0; k < 4; k++) if (rr() < 0.35) { const a0 = (k / 4) * Math.PI / 2, a1 = ((k + 1) / 4) * Math.PI / 2; const y0 = HH + 0.4 + Math.sin(a0) * 3.2, y1 = HH + 0.4 + Math.sin(a1) * 3.2, z0 = -(1 - Math.cos(a0)) * (D - 0.3), z1 = -(1 - Math.cos(a1)) * (D - 0.3); const g = new THREE.PlaneGeometry(bw - 0.06, Math.hypot(y1 - y0, z1 - z0)); g.rotateX(-Math.PI / 2 + Math.atan2(y1 - y0, z0 - z1)); g.translate(cx, (y0 + y1) / 2 + 0.02, (z0 + z1) / 2); glass.push(g); }
    }
    for (const y of [HH - 0.1, HH + 0.35]) { const b = new THREE.BoxGeometry(xb - xa, 0.18, 0.2); b.translate((xa + xb) / 2, y, 0); frame.push(b); }
    const ridge = new THREE.BoxGeometry(xb - xa, 0.2, 0.25); ridge.translate((xa + xb) / 2, HH + 3.65, -D + 0.3); frame.push(ridge);
    frame.push(ironRailing(xb - xa, 0.5, 0.12).translate((xa + xb) / 2, HH + 3.7, -D + 0.3));
    F.geo(M.ironGreen, merge(frame)); F.geo(M.glass, merge(glass), 'keep'); if (boards.length) F.geo(M.boards, merge(boards));
    // glass dome pavilion over the middle of each wing
    const dc = (xa + xb) / 2, dr = 3.6, dy = HH + 3.6, dz = -D / 2;
    const ribs = []; for (let k = 0; k < 16; k++) { const pts = []; for (let i = 0; i <= 12; i++) { const a = (i / 12) * Math.PI / 2; pts.push(new THREE.Vector3(Math.cos(a) * dr, Math.sin(a) * dr * 1.1, 0)); } const t = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.06, 5); t.rotateY((k / 16) * Math.PI * 2); t.translate(dc, dy, dz); ribs.push(t); }
    for (const h of [0.35, 0.65, 0.88]) { const a = Math.asin(h), t = new THREE.TorusGeometry(Math.cos(a) * dr, 0.04, 5, 32); t.rotateX(Math.PI / 2); t.translate(dc, dy + h * dr * 1.1, dz); ribs.push(t); }
    const drum = new THREE.CylinderGeometry(dr + 0.1, dr + 0.2, 0.5, 32, 1, true); drum.translate(dc, dy - 0.2, dz); ribs.push(drum);
    F.geo(M.ironGreen, merge(ribs));
    const dg = new THREE.SphereGeometry(dr - 0.02, 32, 10, 0.4, Math.PI * 1.35, 0, Math.PI / 2); dg.scale(1, 1.1, 1); dg.translate(dc, dy, dz); F.geo(M.glass, dg, 'keep');
    const fin = lathe([[0.25, 0], [0.3, 0.15], [0.12, 0.4], [0.18, 0.7], [0.03, 1.5], [0, 1.6]], 12); fin.translate(dc, dy + dr * 1.1 - 0.05, dz); F.geo(M.gold, fin);
    // dead planting inside
    for (let x = xa + 1.5; x < xb - 1; x += 2.2 + rr() * 1.5) {
      const p = F.point(x, 0, -D + 1.2 + rr() * 5);
      const id = ['shrub_04', 'fern_02#fern_02_b', 'nettle_plant#nettle_plant_tall_a_LOD0', 'fern_02#fern_02_d', 'shrub_04'][Math.floor(rr() * 5)];
      propAt(id, p.x, 0, p.z, rr() * 6, id === 'shrub_04' ? 1.6 + rr() * 1.4 : 0.8 + rr() * 0.6);
    }
    const tp = F.point(dc, 0, -D / 2); const tree = deadTree(mulberry(91 + xa), { h: 7.5, r: 0.22, depth: 3 }); tree.translate(tp.x, 0, tp.z); B.add(M.bark, tree);
  }
  // the Gardens gate: stone piers with lion-headed urns
  for (const s of [-1, 1]) { const x = s * 4.2; F.box(M.stone, x - 0.6, x + 0.6, 0, 5.2, -0.6, 0.6); F.geo(M.marbleTrim, moldingRing(P.cornice(0.4), 1.2, 1.2, 5.0).translate(x, 0, 0)); F.col(x - 0.6, x + 0.6, 0, 5.2, -0.6, 0.6); const pp = F.point(x, 0, 0); propAt('brass_vase_01', pp.x, 5.45, pp.z, 0, 1.2); propAt('lion_head', F.point(x, 0, 0.62).x, 2.6, F.point(x, 0, 0.62).z, F.rotY, 0.7); }
  const arch = []; for (const r of [3.9, 3.5]) { const t = new THREE.TorusGeometry(r, 0.05, 6, 40, Math.PI); t.translate(0, 5.1, 0); arch.push(t); }
  for (let k = 1; k < 18; k++) { const a = (k / 18) * Math.PI, g = new THREE.BoxGeometry(0.025, 0.4, 0.025); g.translate(0, 3.7, 0); g.rotateZ(Math.PI / 2 - a); g.translate(0, 5.1, 0); arch.push(g); }
  F.geo(M.iron, merge(arch));

  // ---------- dry reflecting pool + rearing marble horse ----------
  const px0 = -34, px1 = -24.5, pz0 = -4.5, pz1 = 5.5, ch = 0.42, cw = 0.5;
  for (const [a0, a1, b0, b1] of [[px0, px1, pz0, pz0 + cw], [px0, px1, pz1 - cw, pz1], [px0, px0 + cw, pz0, pz1], [px1 - cw, px1, pz0, pz1]]) {
    B.col(a0, a1, 0, ch, b0, b1, { walk: true });
    const g = new THREE.BoxGeometry(a1 - a0, ch - 0.08, b1 - b0); g.translate((a0 + a1) / 2, (ch - 0.08) / 2, (b0 + b1) / 2); B.add(M.stone, g);
    const c = new THREE.BoxGeometry(a1 - a0 + 0.08, 0.1, b1 - b0 + 0.08); c.translate((a0 + a1) / 2, ch - 0.05, (b0 + b1) / 2); B.add(M.marbleTrim, c);
  }
  { const g = new THREE.PlaneGeometry(px1 - px0 - 2 * cw, pz1 - pz0 - 2 * cw); g.rotateX(-Math.PI / 2); g.translate((px0 + px1) / 2, 0.012, (pz0 + pz1) / 2); B.add(M.mossCobble, g);
    const w = new THREE.CircleGeometry(2.2, 24); w.scale(1.6, 1, 1); w.rotateX(-Math.PI / 2); w.translate(px0 + 2.8, 0.02, pz1 - 2.0); B.add(M.water, w); }
  const fx = (px0 + px1) / 2, fz = (pz0 + pz1) / 2;
  { const ped = merge([new THREE.BoxGeometry(1.8, 0.35, 1.8).translate(0, 0.175, 0), lathe([[0.7, 0], [0.62, 0.2], [0.48, 0.5], [0.5, 1.2], [0.62, 1.35], [0.75, 1.5], [0, 1.5]], 24).translate(0, 0.35, 0)]); ped.translate(fx, 0, fz); B.add(M.marbleTrim, ped);
    const basin = lathe([[0, 0], [1.6, 0], [1.7, 0.1], [1.75, 0.4], [1.62, 0.42], [1.55, 0.2], [0, 0.2]], 32); basin.translate(fx, 1.85, fz); B.add(M.marble, basin);
    B.col(fx - 0.9, fx + 0.9, 0, 2.3, fz - 0.9, fz + 0.9);
    propAt('horse_statue_01', fx, 2.05, fz, Math.PI / 2 + 0.3, 2.6); }
  for (let i = 0; i < 16; i++) { const x = px0 + 0.8 + rr() * (px1 - px0 - 1.6), z = pz0 + 0.8 + rr() * (pz1 - pz0 - 1.6); if (Math.hypot(x - fx, z - fz) < 1.3) continue; propAt(['nettle_plant#nettle_plant_medium_b_LOD0', 'weed_plant_02#weed_plant_02_d_LOD0', 'fern_02#fern_02_a', 'nettle_plant#nettle_plant_small_b_LOD0'][i % 4], x, 0, z, rr() * 6, 0.4 + rr() * 0.6); }
  for (const [x, z, r] of [[px0 + 0.25, fz, Math.PI / 2], [px1 - 0.25, fz, -Math.PI / 2]]) propAt('lion_head', x, 0.1, z, r, 0.32);

  // ---------- hedges gone wild along the parterres ----------
  const hedge = (x0, x1, z0, z1) => {
    B.col(x0, x1, 0, 1.25, z0, z1, { surface: 'wood' });
    const core = new THREE.BoxGeometry(x1 - x0 - 0.3, 0.95, z1 - z0 - 0.3); core.translate((x0 + x1) / 2, 0.47, (z0 + z1) / 2); B.add(M.hedge, core);
    const along = x1 - x0 > z1 - z0, len = along ? x1 - x0 : z1 - z0, n = Math.max(1, Math.round(len / 3.6));
    for (let k = 0; k < n; k++) { const t = (k + 0.5) / n, x = along ? x0 + t * len : (x0 + x1) / 2, z = along ? (z0 + z1) / 2 : z0 + t * len; propAt('shrub_02', x, 0, z, (along ? 0 : Math.PI / 2) + (rr() < 0.5 ? Math.PI : 0), 1.3 + rr() * 0.5, { sx: 1.0 }); }
  };
  hedge(-33, -25.6, 19.9, 21.1); hedge(-19.8, -12, 33.0, 34.2); hedge(-19.8, -12.2, -25.6, -24.4); hedge(-33.6, -25.6, -9.1, -7.9);

  // ---------- dead trees ----------
  for (const [x, z, h, sd] of [[-33, 31.5, 11, 3], [-15.5, 26, 12.5, 5], [-31.5, -16.5, 10, 8]]) {
    const t = deadTree(mulberry(sd * 101), { h, r: 0.42, depth: 4 }); t.translate(x, 0, z); B.add(M.bark, t);
    B.col(x - 0.45, x + 0.45, 0, 4, z - 0.45, z + 0.45, { surface: 'wood' });
  }
}
