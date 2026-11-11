// ASHLAND — the arena. Same footprint, cover, gates and locked areas as Hordefall; the setting is a
// grand theme park left to rot: the Palace of Hours (north), the Esplanade hotels and ticket palace
// (south), the Midway halls and carousel (east), the Gardens and orangery (west), with the coaster's
// steel skeleton over the skyline. Built from Poly Haven CC0 PBR sets + scanned models (see CREDITS.md).
import * as THREE from 'three';
import { buildSkyline } from './skyline.js';
import { mulberry } from '../core/util.js';
import { AREAS } from '../tuning.js';
import { Builder, Frame, P, molding, moldingRing, lathe, merge, balustrade, column, ironRailing, deadTree, pilaster } from './park/kit.js';
import { makeMaterials, weather } from './park/materials.js';
import { buildPalace } from './park/palace.js';
import { buildEsplanade } from './park/esplanade.js';
import { buildMidway, buildCarousel, stall } from './park/midway.js';
import { buildGardens } from './park/gardens.js';

export const ARENA = { half: 36, cell: 1 };
export let PARK_MATS = null;

export function buildArena(scene, quality, A) {
  const B = new Builder();
  const colliders = B.colliders;
  const M = (PARK_MATS = makeMaterials(A));
  const H = ARENA.half, rr = mulberry(1337);
  const props = [];
  const UP = new THREE.Vector3(0, 1, 0);
  // place a scanned model: height = target height in metres (model is normalised: footprint centred, base on y)
  const propAt = (id, x, y, z, rotY = 0, height = 1, o = {}) => props.push({ id, m: new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(UP, rotY).multiply(o.q || new THREE.Quaternion()), new THREE.Vector3(1, 1, 1)), height, o });
  const lights = [], fires = [];
  const inArea = (x, z, m = 0.8) => AREAS.list.some(({ rect: [x0, z0, x1, z1] }) => x > x0 - m && x < x1 + m && z > z0 - m && z < z1 + m);
  const ctx = { B, M, A, rr, scene, propAt, lights, quality, inArea, H };

  // ---------- ground: wet herringbone brick, marble plaza, gardens of gravel and trampled beds ----------
  for (const m of [M.marbleFloor, M.gravel, M.leaves, M.mud, M.mossCobble]) { m.polygonOffset = true; m.polygonOffsetFactor = -1; m.polygonOffsetUnits = -2; }
  const plane = (mat, x0, x1, z0, z1, y = 0) => { const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0, Math.max(1, Math.round((x1 - x0) / 6)), Math.max(1, Math.round((z1 - z0) / 6))); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2); B.add(mat, g); };
  plane(M.paving, -110, 110, -110, 110);
  colliders.push({ minX: -200, maxX: 200, minY: -1, maxY: 0, minZ: -200, maxZ: 200, walk: true, mat: 'concrete', ground: true });
  // formal marble plaza round the bandstand, and a marble walk along the palace front
  plane(M.marbleFloor, -9, 9, -12, 12, 0.002);
  plane(M.marbleFloor, -20, 20, -35.9, -29, 0.002);
  const curb = (x0, x1, z0, z1, h = 0.12, mat = M.marbleTrim) => { for (const [a0, a1, b0, b1] of [[x0, x1, z0, z0 + 0.22], [x0, x1, z1 - 0.22, z1], [x0, x0 + 0.22, z0, z1], [x1 - 0.22, x1, z0, z1]]) { const g = new THREE.BoxGeometry(a1 - a0, h, b1 - b0); g.translate((a0 + a1) / 2, h / 2, (b0 + b1) / 2); B.add(mat, g); } };
  curb(-9, 9, -12, 12, 0.06);
  // gardens (west): gravel walks with sunken lawn beds gone to mud and leaf litter
  plane(M.gravel, -35.9, -9.5, -26.8, 35.9, 0.003);
  for (const [x0, x1, z0, z1, mat] of [[-34, -23.5, 8.5, 20, M.mud], [-20.5, -11, 18.5, 33.5, M.leaves], [-34, -23.5, 23, 33.5, M.leaves], [-20.5, -11, 5, 15.5, M.mud], [-20.5, -11, -25, -11, M.leaves], [-34, -23.5, -25, -8.5, M.mud]]) {
    plane(mat, x0, x1, z0, z1, 0.006); curb(x0, x1, z0, z1, 0.16, M.stoneDark);
  }
  // midway (east): mossy setts in a ring round the carousel
  { const g = new THREE.CircleGeometry(6.2, 48); g.rotateX(-Math.PI / 2); g.translate(15.7, 0.004, 9); B.add(M.mossCobble, g); }

  // ---------- the four edges ----------
  buildPalace(ctx);
  buildEsplanade(ctx);
  // beyond the north and south gates: walled service courts (where the horde comes from), so the gate
  // arches frame dark wet brick and a failing lamp instead of empty fog
  for (const F of [new Frame(B, 0, -36, 0), new Frame(B, 0, 36, Math.PI)]) {
    const z0 = -9.5, z1 = -19;
    F.box(M.brickDeep, -11, 11, 0, 8.5, z1 - 0.8, z1);
    for (const s of [-1, 1]) F.box(M.brickDeep, s * 11, s * 11.8, 0, 8.5, z1 - 0.8, z0);
    F.geo(M.stoneDark, molding(P.cornice(0.6), -11.8, 11.8, 8.5, z1));
    F.geo(M.stoneDark, molding(P.plinth(0.7), -11, 11, 0, z1));
    for (const x of [-7, 0, 7]) { F.box(M.stoneDark, x - 1.6, x + 1.6, 0, 4.6, z1 - 0.3, z1 + 0.05); F.box(M.shutter, x - 1.3, x + 1.3, 0.1, 4.0, z1 - 0.2, z1 + 0.1); }
    const lp = F.point(-3.5, 0, z1 + 0.6); propAt('street_lamp_02', lp.x, 0, lp.z, F.rotY, 4.6);
  }
  buildMidway(ctx);
  buildGardens(ctx);

  // spawn points just outside each gate
  const spawns = [];
  for (const [x, z] of [[0, -H], [0, H], [-H, 0], [H, 0]]) { const out = new THREE.Vector3(x, 0, z).normalize(); spawns.push(new THREE.Vector3(x + out.x * 6, 0, z + out.z * 6)); }

  // ---------- central bandstand terrace (same deck, stairs and cover as before) ----------
  const PH = 2.0;
  B.col(-5, 5, 0, PH, -4.5, 4.5, { walk: true });
  { const F = new Frame(B, 0, 0, 0);
    F.box(M.stone, -4.95, 4.95, 0, PH - 0.3, -4.45, 4.45);
    F.geo(M.marbleTrim, moldingRing(P.plinth(0.9), 9.9, 8.9, 0));
    F.geo(M.marbleTrim, moldingRing(P.cornice(0.55), 9.7, 8.7, PH - 0.32));
    F.box(M.marbleFloor, -5.02, 5.02, PH - 0.04, PH, -4.52, 4.52);
    // panels on the terrace walls: sunk marble with bronze wreaths
    for (const [x, z, ry] of [[-2.6, 4.46, 0], [2.6, 4.46, 0], [-2.6, -4.46, Math.PI], [2.6, -4.46, Math.PI], [5.0, 0, Math.PI / 2], [-5.0, 0, -Math.PI / 2]]) {
      const w = new THREE.TorusGeometry(0.34, 0.06, 8, 24); w.rotateY(ry); w.translate(x, 0.95, z); B.add(M.brass, w);
    }
  }
  const balSeg = (x0, x1, z0, z1) => { // balustraded cover segment on the deck: keeps the old low-wall collider exactly
    B.col(x0, x1, PH, PH + 0.9, z0, z1);
    const along = x1 - x0 > z1 - z0, len = along ? x1 - x0 : z1 - z0;
    const b = balustrade(len - 0.5, { h: 0.9, pitch: 0.24 }); if (!along) b.rotateY(Math.PI / 2); b.translate((x0 + x1) / 2, PH, (z0 + z1) / 2); B.add(M.marbleTrim, b);
    for (const e of [-1, 1]) { const px = along ? (e < 0 ? x0 + 0.2 : x1 - 0.2) : (x0 + x1) / 2, pz = along ? (z0 + z1) / 2 : (e < 0 ? z0 + 0.2 : z1 - 0.2);
      const p = merge([new THREE.BoxGeometry(0.42, 0.95, 0.42).translate(0, 0.475, 0), new THREE.BoxGeometry(0.52, 0.08, 0.52).translate(0, 0.99, 0)]); p.translate(px, PH, pz); B.add(M.marbleTrim, p);
      propAt('brass_vase_01', px, PH + 1.03, pz, rr() * 6, 0.62); }
  };
  balSeg(-4.6, -1.4, -4.475, -4.125); balSeg(1.4, 4.6, 4.125, 4.475);
  balSeg(4.625, 4.975, -3.9, -1.3); balSeg(-4.975, -4.625, 1.3, 3.9);
  // stone stairs with marble nosings
  const stairs = (x, z, dirX, dirZ, width, height, steps, mat = M.stone) => {
    const run = 0.5, rise = height / steps;
    for (let i = 0; i < steps; i++) {
      const h = rise * (i + 1), along = (steps - i - 0.5) * run, cx = x + dirX * along, cz = z + dirZ * along;
      if (dirX) B.col(cx - run / 2, cx + run / 2, 0, h, cz - width / 2, cz + width / 2, { walk: true }); else B.col(cx - width / 2, cx + width / 2, 0, h, cz - run / 2, cz + run / 2, { walk: true });
      const g = dirX ? new THREE.BoxGeometry(run, h, width) : new THREE.BoxGeometry(width, h, run); g.translate(cx, h / 2, cz); B.add(mat, g);
      const nx = cx + dirX * (run / 2 - 0.04), nz = cz + dirZ * (run / 2 - 0.04);
      const n = dirX ? new THREE.BoxGeometry(0.1, 0.05, width + 0.02) : new THREE.BoxGeometry(width + 0.02, 0.05, 0.1); n.translate(nx, h - 0.02, nz); B.add(M.marbleTrim, n);
    }
  };
  stairs(0, -4.5, 0, -1, 3, PH, 8); stairs(0, 4.5, 0, 1, 3, PH, 8);
  // the bandstand: eight fluted iron columns, a copper tent roof with a lace valance and gilt finial
  { const cr = 4.25, ch = 4.6, oct = [];
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + Math.PI / 8; oct.push([Math.cos(a) * cr * 1.08, Math.sin(a) * cr * 0.98]); }
    for (const [x, z] of oct) { const c = column(ch, 0.11, { flutes: 8, seg: 16, capital: 'corinthian' }); c.translate(x, PH, z); B.add(M.iron, c); B.col(x - 0.15, x + 0.15, PH, PH + ch, z - 0.15, z + 0.15, { surface: 'metal' }); }
    const roofY = PH + ch;
    const ring = new THREE.TorusGeometry(cr * 1.03, 0.09, 6, 8); ring.rotateX(Math.PI / 2); ring.rotateY(Math.PI / 8); ring.scale(1.04, 1, 0.95); ring.translate(0, roofY + 0.05, 0); B.add(M.iron, ring);
    const tent = lathe([[cr * 1.22, 0], [cr * 1.15, 0.12], [cr * 0.95, 0.5], [cr * 0.6, 1.5], [cr * 0.3, 2.4], [0.25, 3.0], [0, 3.05]], 8); tent.rotateY(Math.PI / 8); tent.scale(1.04, 1, 0.95); tent.translate(0, roofY + 0.1, 0); B.add(M.copper, tent);
    const under = lathe([[0, 2.9], [cr * 1.15, 0.05]], 8); under.rotateY(Math.PI / 8); under.scale(1.04, 1, 0.95); under.translate(0, roofY + 0.05, 0); B.add(M.greenPaint, under);
    const val = []; for (let k = 0; k < 8; k++) { const a0 = (k / 8) * Math.PI * 2 + Math.PI / 8, a1 = a0 + Math.PI / 4, p0 = [Math.cos(a0) * cr * 1.2 * 1.04, Math.sin(a0) * cr * 1.2 * 0.95], p1 = [Math.cos(a1) * cr * 1.2 * 1.04, Math.sin(a1) * cr * 1.2 * 0.95];
      const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), r2 = ironRailing(len, 0.42, 0.09); r2.rotateZ(Math.PI); r2.rotateY(-Math.atan2(p1[1] - p0[1], p1[0] - p0[0])); r2.translate((p0[0] + p1[0]) / 2, roofY + 0.1, (p0[1] + p1[1]) / 2); val.push(r2); }
    B.add(M.iron, merge(val));
    const fin = lathe([[0.3, 0], [0.34, 0.15], [0.2, 0.3], [0.28, 0.55], [0.08, 0.9], [0.14, 1.1], [0.02, 1.9], [0, 2.0]], 14); fin.translate(0, roofY + 3.0, 0); B.add(M.gold, fin);
    // a lantern hanging in the bandstand (the one real light on the deck)
    propAt('Lantern_01', 0, roofY + 1.3, 0, 0.4, 0.55, { hang: true });
    const L = new THREE.PointLight('#ffb36a', 9, 13, 1.7); L.position.set(0, roofY + 1.45, 0); scene.add(L); lights.push({ light: L, base: 9, flicker: 0.12 });
  }

  // ---------- boarded game stalls (old container footprints: cover + the climbable stack) ----------
  const stalls = [[-16, -8, 0, 0, 0, -1], [-16, -5.4, 0, 1, 0, 1], [-16, -8, 0, 2, 2.6, -1], [-12, 15, 0, 3, 0, 1], [20, -15, 1, 4, 0, 1], [8, -20, 0, 5, 0, -1], [-24, 22, 1, 6, 0, -1], [24, 24, 0, 7, 0, -1]];
  for (const [x, z, rot, i, y0, cs] of stalls) stall(ctx, x, z, rot, i, y0, cs);
  stairs(-12.95, -5.4, 1, 0, 2.2, 2.6, 10, M.boards);
  buildCarousel(ctx, 15.7, 9);

  // ---------- the old viaduct (overpass line): ashlar piers, arched spans, a collapsed middle span ----------
  { const z0 = -20.5, z1 = -13.5, dy = 6.6;
    for (const x of [-26, -13, 13, 26]) {
      B.col(x - 0.7, x + 0.7, 0, dy, -17.7, -16.3);
      const F = new Frame(B, x, -17, 0);
      F.box(M.stoneDark, -0.8, 0.8, 0, 0.6, -1.0, 1.0); F.box(M.stone, -0.7, 0.7, 0.6, dy, -0.85, 0.85);
      F.geo(M.marbleTrim, moldingRing(P.string(1.4), 1.4, 1.7, 4.0));
    }
    const span = (xa, xb, wsegs) => {
      B.col(xa, xb, dy, dy + 0.9, z0, z1);
      for (const fz of [z1, z0]) {
        const F = new Frame(B, 0, fz, fz > -17 ? 0 : Math.PI);
        const sgn = fz > -17 ? 1 : -1, a = Math.min(xa, xb), b = Math.max(xa, xb);
        const L0 = sgn > 0 ? a : -b, L1 = sgn > 0 ? b : -a;
        const sh = new THREE.Shape(); sh.moveTo(L0, 4.0); const piers = [];
        const segs = wsegs.map(([u, v]) => (sgn > 0 ? [u, v] : [-v, -u])).sort((m, n) => m[0] - n[0]);
        sh.lineTo(L0, dy + 0.9); sh.lineTo(L1, dy + 0.9); sh.lineTo(L1, 4.0);
        for (let si = segs.length - 1; si >= 0; si--) { const [s0, s1] = segs[si], r = (s1 - s0) / 2 - 0.3, cx = (s0 + s1) / 2;
          sh.lineTo(s1, 4.0); sh.lineTo(cx + r, 4.0); for (let k = 0; k <= 12; k++) { const ang = (k / 12) * Math.PI; sh.lineTo(cx + Math.cos(ang) * r, 4.0 + Math.sin(ang) * Math.min(r, 2.2)); } sh.lineTo(s0, 4.0); }
        sh.closePath();
        const g = new THREE.ExtrudeGeometry(sh, { depth: 0.6, bevelEnabled: false, curveSegments: 6 }); g.translate(0, 0, -0.6); F.geo(M.stone, g);
        F.geo(M.marbleTrim, molding(P.cornice(0.5), L0, L1, dy + 0.6, 0));
        const rail = ironRailing(L1 - L0 - 0.4, 1.0, 0.13); rail.translate((L0 + L1) / 2, dy + 0.9, -0.25); F.geo(M.iron, rail);
      }
      const deck = new THREE.BoxGeometry(Math.abs(xb - xa), 0.3, z1 - z0 - 1.2); deck.translate((xa + xb) / 2, dy + 0.75, (z0 + z1) / 2); B.add(M.mossCobble, deck);
      const soffit = new THREE.BoxGeometry(Math.abs(xb - xa), 0.6, z1 - z0 - 1.2); soffit.translate((xa + xb) / 2, dy + 0.3, (z0 + z1) / 2); B.add(M.stoneDark, soffit);
    };
    span(-36, -6, [[-36, -26.7], [-25.3, -13.7], [-12.3, -6.6]]); span(12, 36, [[12.6, 12.4], [13.7, 25.3], [26.7, 36]].filter(([u, v]) => v - u > 1));
    // the fallen span: tilted deck, sheared voussoirs, ashlar blocks heaped at its foot
    const F = new Frame(B, 1.9, -17, 0);
    const slab = new THREE.BoxGeometry(9, 1.2, 6.6); slab.rotateZ(-0.62); slab.translate(0, 2.8, 0); F.geo(M.stoneDark, slab);
    const top = new THREE.BoxGeometry(8.6, 0.3, 5.6); top.translate(0, 0.75, 0); top.rotateZ(-0.62); top.translate(0, 2.8, 0); F.geo(M.mossCobble, top);
    const lip = new THREE.BoxGeometry(1.6, 1.3, 6.9); lip.rotateZ(-0.62); lip.translate(2.7, 0.75, 0); F.geo(M.stoneDark, lip);
    const rr2 = mulberry(77), blocks = [];
    for (let i = 0; i < 46; i++) { const w = 0.35 + rr2() * 0.55, h = 0.25 + rr2() * 0.3, d = 0.3 + rr2() * 0.5; const g = new THREE.BoxGeometry(w, h, d); g.rotateX((rr2() - 0.5) * 0.9); g.rotateZ((rr2() - 0.5) * 0.9); g.rotateY(rr2() * 6);
      const zone = i < 26; g.translate(zone ? 3.6 + rr2() * 2.4 : -7 + rr2() * 16, zone ? h * 0.4 + rr2() * 0.5 : h * 0.4, zone ? -3.2 + rr2() * 6.4 : (rr2() < 0.5 ? -4.5 : 4.5) + (rr2() - 0.5) * 2); blocks.push(g); }
    F.geo(M.stone, merge(blocks));
    for (const [x0, sgn] of [[-6, 1], [12, -1]]) { const rag = []; for (let i = 0; i < 7; i++) { const g = new THREE.BoxGeometry(0.4 + rr2() * 0.5, 0.3 + rr2() * 0.4, 0.5 + rr2() * 0.6); g.rotateZ((rr2() - 0.5) * 0.5); g.translate(x0 - sgn * 0.1 + sgn * rr2() * 0.3, dy + 0.3 + rr2() * 0.6, z0 + 0.6 + i * 0.95); rag.push(g); } B.add(M.stoneDark, merge(rag)); }
    for (let i = 0; i < 4; i++) colliders.push({ minX: -2 + i * 1.9, maxX: -0.1 + i * 1.9, minY: 0, maxY: 5.9 - i * 1.55, minZ: -20.3, maxZ: -13.7, walk: false, mat: 'concrete' });
    propAt('weed_plant_02#weed_plant_02_b_LOD0', 5.4, 0, -18.6, 1, 0.9); propAt('nettle_plant#nettle_plant_tall_a_LOD0', 6.6, 0, -15.2, 2, 1.1);
  }

  // ---------- stone planters gone wild (old jersey-barrier cover) ----------
  const planter = (x, z, rot) => {
    const w = rot ? 0.6 : 3, d = rot ? 3 : 0.6;
    B.col(x - w / 2, x + w / 2, 0, 0.95, z - d / 2, z + d / 2);
    const F = new Frame(B, x, z, rot ? Math.PI / 2 : 0);
    F.box(M.stone, -1.45, 1.45, 0, 0.72, -0.27, 0.27);
    F.geo(M.marbleTrim, moldingRing(P.plinth(0.45), 2.9, 0.54, 0));
    F.geo(M.marbleTrim, moldingRing([[0, 0], [0.05, 0], [0.07, 0.06], [0.07, 0.2], [0, 0.23]], 2.96, 0.6, 0.72));
    F.box(M.mud, -1.38, 1.38, 0.72, 0.9, -0.22, 0.22);
    for (let k = -1; k <= 1; k++) { const p = F.point(k * 0.95, 0.88, 0); propAt(rr() < 0.5 ? 'shrub_04' : 'nettle_plant#nettle_plant_medium_a_LOD0', p.x, p.y, p.z, rr() * 6, 0.9 + rr() * 0.7); }
  };
  [[-6, -12, 0], [6, 12, 0], [-9, 9, 1], [10, -8, 1], [-22, 2, 1], [23, -2, 1], [0, -26, 0], [0, 26, 0], [-27, -18, 0], [28, 16, 0], [13, 22, 1], [-10, -22, 1]]
    .forEach(([x, z, rot]) => planter(x, z, rot));

  // ---------- crates (scanned Poly Haven crate) ----------
  const crateBox = new THREE.Box3().setFromObject(A.models.wooden_crate_01.scene), csz = crateBox.getSize(new THREE.Vector3());
  const crateAt = (x, y, z, s, rot) => { propAt('wooden_crate_01', x, y, z, rot, s, { sx: s / Math.max(csz.x, csz.z) / (s / csz.y) }); B.col(x - s / 2, x + s / 2, y, y + s, z - s / 2, z + s / 2, { surface: 'wood' }); };
  [[-4, -15], [-3, -16.2], [7, 17], [16, -6], [-19, 12], [26, 6], [-26, -6], [4, -29]].forEach(([x, z], i) => {
    const s = 1.1 + (i % 3) * 0.15; crateAt(x, 0, z, s, (i % 2) * Math.PI / 2 + (rr() - 0.5) * 0.2);
    if (i % 3 === 0) crateAt(x + 0.1, s, z - 0.05, 0.9, 0.3);
  });

  // ---------- cast-iron lamp standards (4 real lights + unlit / dying ones along the walks) ----------
  const lampPost = (x, z, rot, lit, real) => {
    const post = lathe([[0.26, 0], [0.26, 0.12], [0.2, 0.18], [0.21, 0.5], [0.15, 0.58], [0.12, 0.9], [0.14, 1.0], [0.085, 1.1], [0.075, 3.4], [0.11, 3.48], [0.08, 3.56], [0.065, 4.3], [0.12, 4.38], [0, 4.4]], 16);
    post.translate(x, 0, z); B.add(M.iron, post);
    const arm = []; for (const s of [-1, 1]) { const c = new THREE.TorusGeometry(0.32, 0.025, 6, 16, Math.PI); c.rotateY(rot); c.translate(x + Math.sin(rot + s * Math.PI / 2) * 0.32, 4.05, z + Math.cos(rot + s * Math.PI / 2) * 0.32); arm.push(c); }
    const bar = new THREE.BoxGeometry(1.35, 0.05, 0.05); bar.rotateY(rot + Math.PI / 2); bar.translate(x, 4.36, z); arm.push(bar); B.add(M.iron, merge(arm));
    B.col(x - 0.2, x + 0.2, 0, 4.4, z - 0.2, z + 0.2, { surface: 'metal' });
    for (const s of [-1, 1]) {
      const hx = x + Math.sin(rot + Math.PI / 2) * 0.62 * s, hz = z + Math.cos(rot + Math.PI / 2) * 0.62 * s;
      propAt('Lantern_01', hx, 3.7, hz, rot, 0.62, { hang: true });
      if (lit && (s > 0 || lit > 1)) {
        const glow = null; // the bloom pass makes the halo from the bulb itself
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 4.2, 2.4) })); head.position.set(hx, 3.45, hz); scene.add(head);
        if (real && s > 0) { const L = new THREE.PointLight('#ffad52', 22, 20, 1.6); L.position.set(hx, 3.4, hz); scene.add(L); lights.push({ light: L, base: 22, flicker: 0.04, head }); }
        else lights.push({ light: { position: head.position, intensity: 0, color: new THREE.Color() }, base: 0, flicker: 0, head, glow, fake: true });
      }
    }
  };
  lampPost(-9, 6, 0, 2, true); lampPost(10, -5, Math.PI, 2, true); lampPost(-20, -26, 0, 1, true); lampPost(21, 20, Math.PI, 1, true);
  for (const [x, z, lit] of [[-9, -12.5, 1], [9, 12.6, 0], [-31, -7, 0], [-30, 15.5, 1], [-6.5, 30, 1], [6.5, 31, 0], [31, -10, 1], [30, 2.5, 0], [-9.2, 23, 0], [17, -27, 1], [-14.5, -27.5, 0]]) if (!inArea(x, z, 1)) lampPost(x, z, Math.abs(x) > Math.abs(z) ? Math.PI / 2 : 0, lit, false);

  // ---------- iron braziers (the old burning barrels: same spots, same fire) ----------
  const brazier = (x, z) => {
    const bowl = lathe([[0, 0.55], [0.16, 0.56], [0.3, 0.62], [0.36, 0.72], [0.38, 0.86], [0.42, 0.9], [0.4, 0.93], [0.33, 0.9], [0.3, 0.8], [0.2, 0.7], [0, 0.68]], 20); bowl.translate(x, 0, z); B.add(M.iron, bowl);
    const legs = []; for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; const c = new THREE.CatmullRomCurve3([new THREE.Vector3(Math.cos(a) * 0.34, 0, Math.sin(a) * 0.34), new THREE.Vector3(Math.cos(a) * 0.22, 0.35, Math.sin(a) * 0.22), new THREE.Vector3(Math.cos(a) * 0.3, 0.62, Math.sin(a) * 0.3), new THREE.Vector3(Math.cos(a) * 0.4, 0.94, Math.sin(a) * 0.4)]); const t = new THREE.TubeGeometry(c, 10, 0.025, 5); t.translate(x, 0, z); legs.push(t); }
    B.add(M.iron, merge(legs));
    const coals = new THREE.CircleGeometry(0.3, 16); coals.rotateX(-Math.PI / 2); coals.translate(x, 0.84, z); B.add(M.dark, coals);
    colliders.push({ minX: x - 0.36, maxX: x + 0.36, minY: 0, maxY: 0.95, minZ: z - 0.36, maxZ: z + 0.36, walk: false, mat: 'metal' });
    const L = new THREE.PointLight('#ff6a1c', 14, 12, 1.8); L.position.set(x, 1.4, z); scene.add(L); lights.push({ light: L, base: 14, flicker: 0.35 });
    fires.push(new THREE.Vector3(x, 0.92, z));
  };
  brazier(-5, 10.5); brazier(14, -13); brazier(-18, -14); brazier(17, 14);

  // ---------- great stone urns + bronze busts along the edges (old parked-car cover) ----------
  const urn = (x, z) => {
    const p = merge([new THREE.BoxGeometry(1.3, 0.25, 1.3).translate(0, 0.125, 0), new THREE.BoxGeometry(1.0, 0.8, 1.0).translate(0, 0.65, 0), new THREE.BoxGeometry(1.2, 0.12, 1.2).translate(0, 1.11, 0)]); p.translate(x, 0, z); B.add(M.stone, p);
    const u = lathe([[0, 0], [0.32, 0], [0.34, 0.08], [0.2, 0.16], [0.17, 0.3], [0.3, 0.42], [0.58, 0.62], [0.66, 0.85], [0.6, 0.98], [0.7, 1.04], [0.66, 1.1], [0.5, 1.06], [0, 1.0]], 28); u.translate(x, 1.17, z); B.add(M.marble, u);
    B.col(x - 0.65, x + 0.65, 0, 1.35, z - 0.65, z + 0.65);
    propAt(rr() < 0.5 ? 'nettle_plant#nettle_plant_tall_b_LOD0' : 'shrub_04', x, 2.05, z, rr() * 6, 0.9 + rr() * 0.6);
  };
  for (const [x, z] of [[-20, 31.6], [12, 31.8], [-9, -31.7], [25, -31.6], [31.6, -25], [31.8, 11], [-31.6, 27], [-31.7, -12]]) if (!inArea(x, z)) urn(x, z);

  // ---------- litter: leaves, weeds through the paving, fallen boughs ----------
  // inside the locked areas: the Grotto's mossy rocks, ferns and a cut-glass chandelier gone dark; a saint
  // on the Clock Terrace pedestal (dressing only: kept against walls so the old colliders/nav still hold)
  { const rocks = ['rock_moss_set_01#rock_moss_set_01_rock01', 'rock_moss_set_01#rock_moss_set_01_rock03', 'rock_moss_set_01#rock_moss_set_01_rock05'];
    [[35.0, 28.2], [35.1, 30.4], [26.9, 29.5], [26.9, 33.8], [31.5, 35.1], [28.3, 35.1]].forEach(([x, z], i) => propAt(rocks[i % 3], x, 0, z, i * 1.7, 0.55 + (i % 3) * 0.2, { sx: 1.6 }));
    [[35.0, 29.2], [27.0, 31.2], [29.6, 35.0], [27.1, 35.0], [35.0, 31.6]].forEach(([x, z], i) => propAt(i % 2 ? 'fern_02#fern_02_b' : 'fern_02#fern_02_d', x, 0, z, i * 2.1, 0.7));
    propAt('Chandelier_01', 30.6, 3.88, 31.2, 0.3, 1.1, { hang: true });
    propAt('gothic_statue', -34.6, AREAS.list[0].roofY + 1.2, -34.6, Math.PI * 0.75, 1.7); }
  const weedIds = ['weed_plant_02#weed_plant_02_a_LOD0', 'weed_plant_02#weed_plant_02_c_LOD0', 'weed_plant_02#weed_plant_02_e_LOD0', 'nettle_plant#nettle_plant_small_a_LOD0', 'nettle_plant#nettle_plant_small_b_LOD0', 'fern_02#fern_02_a', 'fern_02#fern_02_c'];
  for (let i = 0; i < 90; i++) {
    let x, z; const side = Math.floor(rr() * 4), t = (rr() * 2 - 1) * (H - 3);
    if (i < 50) [x, z] = side === 0 ? [t, -H + 0.5 + rr() * 1.5] : side === 1 ? [t, H - 0.5 - rr() * 1.5] : side === 2 ? [-H + 0.5 + rr() * 1.5, t] : [H - 0.5 - rr() * 1.5, t];
    else { x = (rr() * 2 - 1) * (H - 3); z = (rr() * 2 - 1) * (H - 3); }
    if (inArea(x, z, 0.5) || (Math.abs(x) < 5.5 && Math.abs(z) < 7.5) || (Math.abs(x) < 4 && Math.abs(z) > 30)) continue;
    if (colliders.some((c) => !c.ground && x > c.minX - 0.3 && x < c.maxX + 0.3 && z > c.minZ - 0.3 && z < c.maxZ + 0.3)) continue;
    propAt(weedIds[i % weedIds.length], x, 0, z, rr() * 6, 0.25 + rr() * 0.45);
  }
  propAt('dead_tree_trunk_02', -27, 0, -21.5, 0.4, 0.75); colliders.push({ minX: -29, maxX: -25, minY: 0, maxY: 0.7, minZ: -22.3, maxZ: -20.7, walk: false, mat: 'wood' });

  B.flush(scene, { noShadow: new Set([M.interior, M.glass, M.marbleFloor, M.gravel, M.leaves, M.mud, M.paving]) });

  // ---------- scanned models, instanced per mesh, weathered by the shared shader ----------
  const byKey = new Map();
  for (const p of props) { const k = p.id + (p.o.mat ? '@' + p.o.mat : ''); if (!byKey.has(k)) byKey.set(k, []); byKey.get(k).push(p); }
  const box = new THREE.Box3(), Mx = new THREE.Matrix4(), wetted = new Set();
  let propTris = 0;
  for (const [key, list] of byKey) {
    const [idSub, matKey] = key.split('@'); const [id, sub] = idSub.split('#');
    const g = A.models[id]; if (!g) continue;
    g.scene.updateMatrixWorld(true);
    const root = sub ? g.scene.getObjectByName(sub) : g.scene; if (!root) { console.warn('missing node', key); continue; }
    box.setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const hang = list[0].o.hang;
    const off = new THREE.Matrix4().makeTranslation(-(box.min.x + box.max.x) / 2, hang ? -box.max.y : -box.min.y, -(box.min.z + box.max.z) / 2);
    root.traverse((o) => {
      if (!o.isMesh) return;
      let mat = matKey ? M[matKey] : o.material;
      if (!matKey && !wetted.has(mat)) { wetted.add(mat); if (!/leaf|leaves|fern|nettle|weed|shrub|glass/i.test(mat.name + ' ' + id)) weather(mat, { grime: 0.5, streaks: 0.4, wet: 0.5, height: 1.2 }); mat.userData.density = 1; }
      if (Object.keys(o.geometry.morphAttributes).length) { o.geometry = o.geometry.clone(); o.geometry.morphAttributes = {}; }
      const im = new THREE.InstancedMesh(o.geometry, mat, list.length);
      const lm = new THREE.Matrix4().multiplyMatrices(off, o.matrixWorld);
      list.forEach((p, i) => { const k = p.height / size.y, sx = p.o.sx ?? 1; im.setMatrixAt(i, Mx.copy(p.m).multiply(new THREE.Matrix4().makeScale(k * sx, k, k * sx)).multiply(lm)); });
      im.castShadow = !/glass/i.test(mat.name); im.receiveShadow = true;
      im.computeBoundingSphere(); scene.add(im);
      propTris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 * list.length;
    });
  }

  // ---------- skyline: the coaster's skeleton, dead woods, far park towers ----------
  const sky = buildSkyline(scene, M);
  const realLights = lights.filter((l) => !l.fake);
  return { colliders, spawns, lights: realLights, glows: lights.filter((l) => l.fake), fires, nav: buildNav(colliders), stats: { parkTris: Math.round(B.tris), propTris: Math.round(propTris), facadeTris: Math.round(B.tris), skyline: { buildings: sky.count, tris: sky.tris, drawCalls: sky.drawCalls } } };
}

// ---------- navigation grid: floor height per cell + blocked cells ----------
function buildNav(colliders) {
  const H = ARENA.half, N = H * 2;
  const height = new Float32Array(N * N), blocked = new Uint8Array(N * N);
  const margin = 0.35;
  for (let gz = 0; gz < N; gz++) for (let gx = 0; gx < N; gx++) {
    const x = gx - H + 0.5, z = gz - H + 0.5;
    let floor = 0, block = 0;
    for (const c of colliders) {
      if (c.ground || c.minY > 2.5) continue;
      if (x < c.minX - margin || x > c.maxX + margin || z < c.minZ - margin || z > c.maxZ + margin) continue;
      const inside = x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ;
      if (c.walk && inside) floor = Math.max(floor, c.maxY);
      else if (!c.walk) block = 1;
    }
    height[gz * N + gx] = floor; blocked[gz * N + gx] = block;
  }
  return { N, H, height, blocked };
}
