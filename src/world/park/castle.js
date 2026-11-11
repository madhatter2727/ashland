// ASHLAND CASTLE (north edge): the park's fairy-tale castle, an original design. A pastel lime-stucco
// curtain wall in blush and cream with tall arched windows, a white stone plinth, string courses and a clean
// crenellated crown; slender round towers of different heights with flared, glazed-tile cone roofs (cobalt,
// rose, teal, plum), gilt finials and pennants; corbelled bartizans; a long hall behind the wall with a
// steep roof and dormers; and over the gate a three-stage keep: the great arch with gilt lettering, a clock
// stage (it is half past four), and a tall central spire. In front, a three-tier fountain in a cobbled
// courtyard. Same footprint and colliders as the building it replaces, so gameplay is unchanged; the fountain
// is the one new piece of cover.
import * as THREE from 'three';
import { Frame, P, molding, lathe, merge, archSurround, archPath } from './kit.js';
import { storey } from './facade.js';
import { giltText, clockDial, paintedSign } from './signs.js';
import { ticketKiosk } from './showfront.js';
import { corbels, gableRoof } from './themed.js';
import { PALETTE } from './festive.js';
import { RAIN } from './materials.js';

function invert(g) { g = g.index ? g.toNonIndexed() : g; const p = g.attributes.position; for (let i = 0; i < p.count; i += 3) { const x = p.getX(i + 1), y = p.getY(i + 1), z = p.getZ(i + 1); p.setXYZ(i + 1, p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2)); p.setXYZ(i + 2, x, y, z); } g.computeVertexNormals(); return g; }

// glazing for the castle: deep cobalt leaded glass that picks up the sky
function castleGlass() {
  const m = new THREE.MeshPhysicalMaterial({ color: '#1b3463', roughness: 0.08, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.5 });
  m.userData.density = 1; return m;
}

// arched window, built at the origin facing +z: { frame, glass, bars } geometries
function archWindow(w, h, { surround = 0.16 } = {}) {
  const spring = h - w / 2;
  const outer = new THREE.Shape(); archPath(outer, -w / 2 - surround, w / 2 + surround, -surround * 0.6, spring, 0, true);
  outer.holes.push(archPath(new THREE.Path(), -w / 2, w / 2, 0, spring, 0, false));
  const frame = new THREE.ExtrudeGeometry(outer, { depth: 0.16, bevelEnabled: false, curveSegments: 10 });
  const gs = new THREE.Shape(); archPath(gs, -w / 2, w / 2, 0, spring, 0, true);
  const glass = new THREE.ShapeGeometry(gs, 10); glass.translate(0, 0, 0.02);
  const bars = merge([new THREE.BoxGeometry(0.05, h, 0.05).translate(0, h / 2, 0.06), new THREE.BoxGeometry(w, 0.05, 0.05).translate(0, spring, 0.06), new THREE.BoxGeometry(w, 0.05, 0.05).translate(0, spring * 0.5, 0.06)]);
  const sill = new THREE.BoxGeometry(w + surround * 2 + 0.2, 0.12, 0.3).translate(0, -0.06, 0.1);
  return { frame: merge([frame, sill]), glass, bars };
}

// a slender fairy-tale tower: battered base, plinth, string bands, corbelled cornice, flared tile cone,
// gilt finial and a pennant. Built in frame-local space at (x, y0, z).
export function spireTower(ctx, F, x, z, { r = 2, y0 = 0, h = 14, roofH = r * 4.2, wall, roof, wins = 3, flag = 0, face = 0, base = true } = {}) {
  const { M } = ctx, G = ctx.castleGlass;
  const S = { wall: [], trim: [], roof: [], gold: [], glass: [], bars: [] };
  const seg = r > 1.6 ? 28 : 20;
  S.wall.push(lathe(base ? [[r * 1.1, 0], [r * 1.03, 0.9], [r, 1.5], [r, h], [0, h]] : [[r, 0], [r, h], [0, h]], seg));
  if (base) S.trim.push(lathe([[r * 1.14, 0], [r * 1.14, 0.55], [r * 1.07, 0.7], [r * 1.03, 0.9]], seg));
  for (const yy of [h * 0.45, h - 2.2]) S.trim.push(lathe([[r, yy], [r + 0.1, yy + 0.05], [r + 0.12, yy + 0.22], [r, yy + 0.3]], seg));
  // corbelled cornice the roof sits on
  S.trim.push(lathe([[r, h - 1.1], [r + 0.08, h - 1.0], [r + 0.38, h - 0.3], [r + 0.42, h], [0, h + 0.05]], seg));
  // flared bell cone, gold drip band at the eave, finial
  const R = r + 0.42;
  S.roof.push(lathe([[R + 0.45, -0.1], [R + 0.3, 0.12], [R * 0.86, roofH * 0.14], [R * 0.58, roofH * 0.4], [R * 0.28, roofH * 0.72], [0.07, roofH], [0, roofH]], seg).translate(0, h, 0));
  S.gold.push(lathe([[R + 0.47, -0.16], [R + 0.5, -0.1], [R + 0.46, -0.02]], seg).translate(0, h, 0));
  const ft = h + roofH - 0.15;
  S.gold.push(lathe([[0.1, 0], [0.18, 0.12], [0.08, 0.3], [0.2, 0.52], [0.08, 0.74], [0.04, 0.9], [0.035, 2.2], [0, 2.25]], 10).translate(0, ft, 0));
  S.gold.push(new THREE.SphereGeometry(0.2, 12, 8).translate(0, ft + 0.52, 0));
  // windows round the shaft, mostly turned to the park
  const wh = Math.min(2.4, h * 0.16), ww = Math.min(1.0, r * 0.5);
  for (let k = 0; k < wins; k++) {
    const yy = 1.6 + (h - 4.5) * (k + 0.4) / wins, a = face + (k % 2 ? 0.55 : -0.35) * (k ? 1 : 0);
    const W = archWindow(ww, wh, { surround: 0.12 });
    for (const [key, g] of [['trim', W.frame], ['glass', W.glass], ['bars', W.bars]]) { g.translate(0, yy, r - 0.06); g.rotateY(a); S[key].push(g); }
  }
  const xf = new THREE.Matrix4().makeTranslation(x, y0, z);
  const put = (mat, list, uv) => { if (!list.length) return; const g = merge(list); g.applyMatrix4(xf); F.geo(mat, g, uv); };
  put(wall, S.wall); put(M.castleTrim, S.trim); put(roof, S.roof); put(M.gold, S.gold); put(G, S.glass, 'keep'); put(M.gold, S.bars);
  const ps = ['fly', 'droop', 'fly', 'torn'][Math.abs(Math.round(x * 3 + z * 5 + h)) % 4];
  if (ctx.festive) ctx.festive.pennant(F.point(x, y0 + ft + 2.1, z), PALETTE.flags[flag % PALETTE.flags.length], { len: 1.8 + r * 0.7, width: 0.55 + r * 0.18, phase: x * 0.7, state: ps });
  return y0 + ft + 2.25;
}
// a bartizan: a little turret corbelled out from a wall corner, no base
function bartizan(ctx, F, x, z, y0, { r = 0.9, h = 4.2, roof, wall, flag = 0 } = {}) {
  const cone = lathe([[0.05, -2.2], [r * 0.4, -1.5], [r * 0.85, -0.5], [r, 0]], 18); cone.translate(x, y0, z); F.geo(ctx.M.castleTrim, cone);
  return spireTower(ctx, F, x, z, { r, y0, h, roofH: r * 4.6, wall, roof, wins: 1, flag, base: false });
}
// clean crenellation (every merlon present, no ruin)
function crenels(F, mat, x0, x1, y, z0, z1, { mw = 0.85, gap = 0.6, mh = 0.95 } = {}) {
  const g = [], n = Math.max(1, Math.floor((x1 - x0 + gap) / (mw + gap))), used = n * mw + (n - 1) * gap, off = (x1 - x0 - used) / 2;
  for (let i = 0; i < n; i++) { const xa = x0 + off + i * (mw + gap); g.push(new THREE.BoxGeometry(mw, mh, z1 - z0).translate(xa + mw / 2, y + mh / 2, (z0 + z1) / 2)); g.push(new THREE.BoxGeometry(mw + 0.08, 0.1, z1 - z0 + 0.08).translate(xa + mw / 2, y + mh + 0.05, (z0 + z1) / 2)); }
  F.geo(mat, merge(g));
}

function crestTex() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 640; const g = c.getContext('2d');
  g.clearRect(0, 0, 512, 640);
  const shield = () => { g.beginPath(); g.moveTo(40, 120); g.lineTo(472, 120); g.lineTo(472, 360); g.quadraticCurveTo(472, 540, 256, 620); g.quadraticCurveTo(40, 540, 40, 360); g.closePath(); };
  shield(); g.fillStyle = '#e2b955'; g.fill();
  g.save(); g.translate(256, 380); g.scale(0.9, 0.9); g.translate(-256, -380); shield(); g.fillStyle = '#2f63c4'; g.fill(); g.restore();
  g.save(); g.beginPath(); g.rect(256, 100, 260, 560); g.clip(); g.translate(256, 380); g.scale(0.9, 0.9); g.translate(-256, -380); shield(); g.fillStyle = '#d65a7e'; g.fill(); g.restore();
  // crown
  g.fillStyle = '#f2c14e'; g.beginPath(); g.moveTo(140, 110); g.lineTo(150, 20); g.lineTo(200, 70); g.lineTo(256, 0); g.lineTo(312, 70); g.lineTo(362, 20); g.lineTo(372, 110); g.closePath(); g.fill();
  for (const x of [150, 256, 362]) { g.beginPath(); g.arc(x, x === 256 ? 8 : 24, 16, 0, 7); g.fill(); }
  g.fillStyle = '#fff6e2'; g.font = '700 300px "Playfair Display", Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('A', 256, 390);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

export function buildCastle(ctx) {
  const { B, M, rr, scene, propAt } = ctx;
  ctx.castleGlass = castleGlass();
  const F = new Frame(B, 0, -36, 0);
  const fest = ctx.festive;
  const bannerCols = [['#2f63c4', '#f2c14e'], ['#d65a7e', '#f7efe0'], ['#3fb0a8', '#f2c14e'], ['#7a4fb0', '#f2c14e']];

  // ---------------- the two wings ----------------
  for (const side of [-1, 1]) {
    const xa = side < 0 ? -44 : 6.2, xb = side < 0 ? -6.2 : 44;
    const wall = side < 0 ? M.stuccoBlush : M.stuccoBlush;
    F.col(xa, xb, 0, 17, -8, 0, { surface: 'concrete' });
    F.box(M.castleTrim, xa, xb, 0, 0.9, -0.6, 0.12);
    F.geo(M.castleTrim, molding(P.plinth(1.0), xa, xb, 0, 0.12));
    const g0 = storey(F, M, rr, xa, xb, { y0: 0.9, y1: 6.0, bay: 4.2, mat: wall, thick: 0.5, win: { w: 1.7, sill: 0.7, spring: 3.4 }, surround: M.castleTrim, sill: M.castleTrim, keystone: M.castleTrim, fills: ['glass', 'glass', 'glass', 'broken', 'plywood'], frame: M.gold, course: { mat: M.castleTrim, profile: P.string(1.5) } });
    storey(F, M, rr, xa, xb, { y0: 6.0, y1: 10.6, bay: 4.2, mat: wall, thick: 0.5, win: { w: 1.25, sill: 0.9, spring: 2.9 }, surround: M.castleTrim, sill: M.castleTrim, fills: ['glass', 'glass', 'broken', 'glass', 'shutter'], shutterMat: M.woodTeal, frame: M.gold });
    // crown: corbel table, coping, clean merlons
    corbels(F, M.castleTrim, xa, xb, 10.6, 0.02, { step: 0.9, d: 0.45 });
    F.box(M.castleTrim, xa, xb, 10.6, 11.3, -0.9, 0.45);
    crenels(F, M.castleTrim, xa + 0.3, xb - 0.3, 11.3, 0.05, 0.45);
    // heraldic banners on every other pier of the upper storey
    for (let i = 1; i < g0.n; i += 2) { const bc = bannerCols[(i + (side > 0 ? 1 : 0)) % bannerCols.length]; fest.banner(F.point(xa + g0.bw * i, 10.2, 0.0), new THREE.Vector3(0, 0, 1), bc[0], bc[1], { w: 1.25, h: 3.7, torn: (i + side) % 3 === 0 }); }
    // bunting along the battlements in short swags
    for (let x = xa + 0.6, k = 0; x < xb - 4; x += 4.2, k++) { if (k % 4 === 2) continue; fest.bunting(F.point(x, 11.1, 0.5), F.point(x + 4.2, 11.1, 0.5), { sag: 0.7, size: 0.42, seed: Math.round(Math.abs(x)) + 1, broken: k % 5 === 3 }); }
    // the long hall behind the wall: cream stucco, steep tile roof, dormers
    const hx0 = xa + 1.5, hx1 = xb - 1.5, roofM = side < 0 ? M.roofBlue : M.roofBlue;
    F.box(M.stuccoCream, hx0, hx1, 10.6, 14.2, -7.4, -1.4);
    F.geo(M.castleTrim, molding(P.cornice(0.6), hx0, hx1, 13.9, -1.4));
    gableRoof(F, roofM, hx0, hx1, 14.2, -7.9, -0.9, 4.6, { over: 0.5 });
    for (const ex of [hx0, hx1]) { const tri = new THREE.Shape(); tri.moveTo(-7.4, 0); tri.lineTo(-4.4, 4.2); tri.lineTo(-1.4, 0); tri.closePath(); const w = new THREE.ExtrudeGeometry(tri, { depth: 0.3, bevelEnabled: false }); w.rotateY(-Math.PI / 2); w.translate(ex + (ex === hx0 ? 0.3 : 0), 14.2, 0); F.geo(M.stuccoCream, w); }
    for (let x = hx0 + 3.2; x < hx1 - 2; x += 6.4) { // dormers: a little gabled window in the roof slope
      F.box(M.stuccoCream, x - 0.75, x + 0.75, 14.0, 16.0, -3.6, -1.7);
      const W = archWindow(0.8, 1.35, { surround: 0.1 }); for (const [m, g] of [[M.castleTrim, W.frame], [ctx.castleGlass, W.glass], [M.gold, W.bars]]) { g.translate(x, 14.35, -1.66); F.geo(m, g, m === ctx.castleGlass ? 'keep' : 'box'); }
      const s = new THREE.Shape(); s.moveTo(-1.05, 0); s.lineTo(0, 1.25); s.lineTo(1.05, 0); s.lineTo(1.05, -0.15); s.lineTo(0, 1.05); s.lineTo(-1.05, -0.15); s.closePath();
      const rg = new THREE.ExtrudeGeometry(s, { depth: 2.4, bevelEnabled: false }); rg.translate(x, 16.0, -4.0); F.geo(roofM === M.roofBlue ? M.roofRose : M.roofBlue, rg);
      const t = new THREE.Shape(); t.moveTo(-0.75, 0); t.lineTo(0, 0.95); t.lineTo(0.75, 0); t.closePath(); F.geo(M.stuccoCream, new THREE.ExtrudeGeometry(t, { depth: 0.1, bevelEnabled: false }).translate(x, 16.0, -1.8));
    }
    // missing tiles: two holes in the hall roof with the battens showing
    for (const hx of [hx0 + 6.4, hx1 - 9.6]) {
      const hole = new THREE.BoxGeometry(1.9, 0.05, 1.5); hole.rotateX(0.855); hole.translate(hx, 16.75, -2.62); F.geo(M.dark, hole);
      const bat = []; for (let k = -2; k <= 2; k++) { const b = new THREE.BoxGeometry(2.1, 0.07, 0.09); b.rotateX(0.855); b.translate(hx, 16.78 + k * 0.27 * 0.754, -2.62 - k * 0.27 * 0.657); bat.push(b); }
      F.geo(M.boards, merge(bat));
      const tiles = []; for (let k = 0; k < 7; k++) { const t = new THREE.BoxGeometry(0.28, 0.04, 0.4); t.rotateY(k * 0.9); t.translate(hx + (k - 3) * 0.5, 11.35, 0.25 + (k % 3) * 0.1); tiles.push(t); } F.geo(roofM, merge(tiles));
    }
    // towers (same spots and collision as before): different heights, roof colours and pennants
    const tw = side < 0 ? [[-38.5, 21, 2.3, M.roofBlue, M.stuccoCream, 0], [-14, 18.5, 1.9, M.roofRose, M.stuccoLilac, 3]] : [[14.5, 25, 2.5, M.roofBlue, M.stuccoCream, 1], [37.5, 19.5, 2.1, M.roofRose, M.stuccoLilac, 4]];
    for (const [tx, th, tr, rm, wm, fl] of tw) {
      const tz = tr * 0.35;
      spireTower(ctx, F, tx, tz, { r: tr, h: th - 3, roofH: tr * 4.4, wall: wm, roof: rm, wins: 3, flag: fl });
      F.col(tx - tr * 1.15, tx + tr * 1.15, 0, th, -1, tz + tr * 1.15, { surface: 'concrete' });
    }
    // a slender stair tower rising behind the wall beside the keep, to cluster the spires toward the centre
    spireTower(ctx, F, side * 10.4, -2.4, { r: 1.6, y0: 0, h: 19.5, roofH: 7.6, wall: M.stuccoLilac, roof: side < 0 ? M.roofTeal : M.roofPlum, wins: 3, flag: side < 0 ? 4 : 3, base: false });
    // bartizans at the wing ends next to the keep and at the outer corners
    bartizan(ctx, F, side * 7.3, 0.55, 8.4, { r: 0.85, h: 4.6, roof: M.roofTeal, wall: M.stuccoCream, flag: 2 });
    bartizan(ctx, F, side * 26, 0.55, 8.8, { r: 0.8, h: 4.0, roof: side < 0 ? M.roofPlum : M.roofTeal, wall: M.stuccoCream, flag: side < 0 ? 3 : 2 });
  }

  // ---------------- the keep over the gate ----------------
  const tz0 = 0.7, tz1 = -11.3, tw = 6.2;
  F.col(-tw, -3.6, 0, 40, tz1, tz0); F.col(3.6, tw, 0, 40, tz1, tz0);
  F.col(-3.6, 3.6, 8.6, 40, tz1, tz0);
  // stage 1: white ashlar gatehouse with a single great arch
  const front1 = new THREE.Shape(); front1.moveTo(-tw, 0); front1.lineTo(-3.5, 0); front1.lineTo(-3.5, 5.2);
  for (let i = 0; i <= 24; i++) { const a = Math.PI - (i / 24) * Math.PI; front1.lineTo(Math.cos(a) * 3.5, 5.2 + Math.sin(a) * 3.5); }
  front1.lineTo(3.5, 0); front1.lineTo(tw, 0); front1.lineTo(tw, 14); front1.lineTo(-tw, 14); front1.closePath();
  for (const z of [tz0, tz1 + 0.8]) { const g = new THREE.ExtrudeGeometry(front1, { depth: 0.8, bevelEnabled: false, curveSegments: 24 }); g.translate(0, 0, z - 0.8); F.geo(M.stuccoCream, g); }
  for (const sx of [-1, 1]) { F.box(M.stuccoCream, sx > 0 ? 3.5 : -tw, sx > 0 ? tw : -3.5, 0, 14, tz1 + 0.8, tz0 - 0.8); F.box(M.stuccoCream, sx > 0 ? tw - 0.8 : -tw, sx > 0 ? tw : -tw + 0.8, 0, 14, tz1, tz0); }
  F.box(M.castleTrim, -3.5, 3.5, 8.7, 14, tz1 + 0.8, tz0 - 0.8);
  const vault = new THREE.CylinderGeometry(3.5, 3.5, tz0 - tz1, 28, 1, true, -Math.PI / 2, Math.PI); vault.rotateX(-Math.PI / 2); vault.translate(0, 5.2, (tz0 + tz1) / 2);
  F.geo(M.stuccoLilac, invert(vault));
  for (let z = tz1 + 1; z < tz0 - 0.5; z += 2) { const rib = new THREE.TorusGeometry(3.42, 0.12, 6, 24, Math.PI); rib.translate(0, 5.2, z); F.geo(M.gold, rib); }
  // voussoirs: alternating white stone and rose round the arch, gold keystone
  { const vs = [], vr = []; const n = 17; for (let i = 0; i < n; i++) { const a0 = Math.PI - (i / n) * Math.PI, a1 = Math.PI - ((i + 1) / n) * Math.PI;
      const s = new THREE.Shape(); s.moveTo(Math.cos(a0) * 3.5, 5.2 + Math.sin(a0) * 3.5); s.lineTo(Math.cos(a0) * 4.3, 5.2 + Math.sin(a0) * 4.3); s.lineTo(Math.cos(a1) * 4.3, 5.2 + Math.sin(a1) * 4.3); s.lineTo(Math.cos(a1) * 3.5, 5.2 + Math.sin(a1) * 3.5); s.closePath();
      const g = new THREE.ExtrudeGeometry(s, { depth: 0.22, bevelEnabled: false }); g.translate(0, 0, tz0 - 0.02); (i % 2 ? vr : vs).push(g); }
    F.geo(M.castleTrim, merge(vs)); F.geo(M.roofRose, merge(vr)); }
  F.geo(M.castleTrim, molding(P.plinth(1.2), -tw - 0.25, tw + 0.25, 0, tz0));
  F.geo(M.castleTrim, molding(P.cornice(0.9), -tw - 0.3, tw + 0.3, 13.4, tz0));
  F.geo(M.castleTrim, molding(P.string(1.4), -tw - 0.1, tw + 0.1, 9.6, tz0));
  const ins = giltText(M.gold, 'ASHLAND CASTLE', 9.4, 1.0, { size: 170, spacing: 0.2 }); ins.position.copy(F.point(0, 11.3, tz0 + 0.03)); ins.rotation.y = F.rotY; scene.add(ins);
  // the crest over the arch
  { const cm = new THREE.MeshStandardMaterial({ map: crestTex(), roughness: 0.45, metalness: 0.1, alphaTest: 0.5, envMapIntensity: 1.2 });
    const crest = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.1), cm); crest.position.copy(F.point(0, 8.25, tz0 + 0.26)); crest.rotation.y = F.rotY; scene.add(crest); }
  // stage 2: blush clock stage with corner turrets
  const t2y0 = 14.1, t2y1 = 20.6, sw = tw - 0.4, bcz = (tz0 + tz1) / 2;
  F.box(M.stuccoBlush, -sw, sw, t2y0, t2y1, tz1 + 0.4, tz0 - 0.4);
  F.geo(M.castleTrim, molding(P.string(1.2), -sw - 0.05, sw + 0.05, t2y0, tz0 - 0.4));
  corbels(F, M.castleTrim, -sw - 0.35, sw + 0.35, t2y1, tz0 - 0.4, { step: 0.85, d: 0.45 });
  F.box(M.castleTrim, -sw - 0.35, sw + 0.35, t2y1, t2y1 + 0.8, tz1 + 0.05, tz0 - 0.05);
  crenels(F, M.castleTrim, -sw - 0.2, sw + 0.2, t2y1 + 0.8, tz0 - 0.5, tz0 - 0.1);
  const dialMat = new THREE.MeshStandardMaterial({ map: clockDial({ hours: 11, minutes: 47 }), roughness: 0.4, metalness: 0, envMapIntensity: 0.9 });
  { const dial = new THREE.Mesh(new THREE.CircleGeometry(2.3, 64), dialMat); dial.position.copy(F.point(0, 17.4, tz0 - 0.32)); dial.rotation.y = F.rotY; scene.add(dial);
    const ring = new THREE.TorusGeometry(2.42, 0.16, 8, 64); ring.translate(0, 17.4, tz0 - 0.3); F.geo(M.gold, ring); }
  for (const sx of [-1, 1]) {
    const W = archWindow(0.9, 2.2); for (const [m, g] of [[M.castleTrim, W.frame], [ctx.castleGlass, W.glass], [M.gold, W.bars]]) { g.translate(sx * 4.1, 16.0, tz0 - 0.38); F.geo(m, g, m === ctx.castleGlass ? 'keep' : 'box'); }
    spireTower(ctx, F, sx * (sw + 0.15), tz0 - 0.7, { r: 1.3, y0: t2y0 + 2.0, h: 8.6, roofH: 6.6, wall: M.stuccoCream, roof: M.roofRose, wins: 2, flag: sx < 0 ? 3 : 0, base: false });
    const cone = lathe([[0.05, -2.4], [0.6, -1.5], [1.2, -0.4], [1.3, 0]], 20); cone.translate(sx * (sw + 0.15), t2y0 + 2.0, tz0 - 0.7); F.geo(M.castleTrim, cone);
  }
  // stage 3: the central spire, plus two rear spires to layer the silhouette from the hub
  spireTower(ctx, F, 0, bcz + 0.4, { r: 3.0, y0: t2y1 + 0.8, h: 4.2, roofH: 11.5, wall: M.stuccoCream, roof: M.roofBlue, wins: 3, flag: 1, base: false });
  spireTower(ctx, F, -4.6, tz1 - 1.6, { r: 2.0, y0: 0, h: 24, roofH: 9, wall: M.stuccoLilac, roof: M.roofTeal, wins: 4, flag: 4 });
  spireTower(ctx, F, 5.2, tz1 - 2.6, { r: 1.7, y0: 0, h: 26.5, roofH: 8, wall: M.stuccoCream, roof: M.roofPlum, wins: 4, flag: 2 });
  propAt('lion_head', 0, 9.9, -36 + tz0 + 0.05, 0, 0.9);
  ctx.towerTop = F.point(0, t2y1 + 30, bcz + 0.4);

  // the gates, thrown open against the passage walls
  for (const sx of [-1, 1]) propAt('large_iron_gate#' + (sx < 0 ? 'large_iron_gate_left_door' : 'large_iron_gate_right_door'), sx * 3.3, 0, -36 + tz1 + 3.6 + 1.6, sx * Math.PI / 2 * 0.94, 1.2);
  // ticket kiosks flanking the gate (same cover as before)
  for (const sx of [-1, 1]) {
    const front = ticketKiosk(ctx, sx * 8.6, -34.25, -Math.PI / 8, { r: 0.95 });
    const tk = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.2), new THREE.MeshStandardMaterial({ map: paintedSign('TICKETS', { bg: '#2f63c4', fg: '#f6e3a8', w: 1024, h: 256 }), roughness: 0.8 }));
    tk.position.copy(front); tk.position.y = 2.42; scene.add(tk);
  }
  // guest-service windows in the gate piers (same collision as the old ticket windows)
  for (const sx of [-1, 1]) {
    const x0 = sx < 0 ? -5.95 : 3.85, x1 = sx < 0 ? -3.85 : 5.95, cx = (x0 + x1) / 2, z0 = tz0, z1 = tz0 + 0.5;
    F.col(x0, x1, 0, 3.5, z0, z1 + 0.25);
    F.box(M.castleTrim, x0, x1, 0, 1.15, z0, z1); F.box(M.castleTrim, x0, x1, 2.85, 3.5, z0, z1);
    for (const e of [x0, x1]) F.box(M.castleTrim, e - 0.08, e + 0.08, 1.15, 2.85, z0, z1);
    F.box(M.gold, x0 - 0.1, x1 + 0.1, 1.12, 1.2, z0, z1 + 0.28);
    F.geo(M.castleTrim, molding(P.cornice(0.5), x0 - 0.15, x1 + 0.15, 3.35, z1));
    const ip = new THREE.PlaneGeometry(x1 - x0, 1.7); ip.translate(cx, 2.0, z0 + 0.05); F.geo(M.interior, ip, 'keep');
    const gr = []; for (let k = -4; k <= 4; k++) { const b = new THREE.CylinderGeometry(0.014, 0.014, 1.65, 6); b.translate(cx + k * 0.2, 2.02, z1 - 0.1); gr.push(b); } F.geo(M.brass, merge(gr));
    const tk = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.42), new THREE.MeshStandardMaterial({ map: paintedSign(sx < 0 ? 'GUEST SERVICES' : 'TICKETS', { bg: '#d65a7e', fg: '#fff3d6', w: 1024, h: 256 }), roughness: 0.8 }));
    tk.position.copy(F.point(cx, 3.15, z1 + 0.02)); tk.rotation.y = F.rotY; scene.add(tk);
  }
  // bunting swags across the gate front between the corner turrets
  fest.bunting(F.point(-6.4, 13.6, 1.3), F.point(0, 13.0, 1.3), { sag: 0.9, size: 0.45, seed: 2 });
  fest.bunting(F.point(6.4, 13.6, 1.3), F.point(0, 13.0, 1.3), { sag: 0.9, size: 0.45, seed: 5, broken: true });
  buildFountain(ctx, 0, -30.4);
}

// ---------------- the courtyard fountain ----------------
function fallTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = 'rgba(255,255,255,0)'; g.clearRect(0, 0, 256, 256);
  for (let i = 0; i < 260; i++) { const x = Math.random() * 256, w = 1 + Math.random() * 4, y = Math.random() * 256, h = 30 + Math.random() * 140, a = 0.15 + Math.random() * 0.55;
    const lg = g.createLinearGradient(0, y, 0, y + h); lg.addColorStop(0, `rgba(255,255,255,0)`); lg.addColorStop(0.5, `rgba(235,248,255,${a})`); lg.addColorStop(1, `rgba(255,255,255,0)`); g.fillStyle = lg; g.fillRect(x, y, w, h); if (y + h > 256) g.fillRect(x, y - 256, w, h); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
export function buildFountain(ctx, x, z) {
  const { B, M, scene } = ctx;
  const at = (g) => g.translate(x, 0, z);
  const seg = 40;
  // basin: white stone rim with a blue tile band
  B.add(M.castleTrim, at(lathe([[2.45, 0], [2.45, 0.1], [2.5, 0.12], [2.5, 0.5], [2.58, 0.55], [2.58, 0.68], [2.3, 0.74], [2.2, 0.66], [2.2, 0.2], [0.6, 0.2]], seg)));
  B.add(M.inlayBlue, at(lathe([[2.505, 0.16], [2.52, 0.2], [2.52, 0.44], [2.505, 0.48]], seg)));
  // pedestal, first bowl, stem, second bowl, gilt crown
  B.add(M.castleTrim, at(lathe([[0.62, 0.2], [0.66, 0.42], [0.42, 0.7], [0.32, 1.3], [0.42, 1.5], [0.5, 1.62]], 28)));
  B.add(M.castleTrim, at(lathe([[0.3, 1.55], [0.9, 1.62], [1.38, 1.86], [1.5, 2.0], [1.46, 2.06], [1.36, 2.02], [0.9, 1.84], [0, 1.82]], seg)));
  B.add(M.castleTrim, at(lathe([[0.3, 1.9], [0.22, 2.3], [0.17, 2.85], [0.26, 3.05], [0.32, 3.12]], 24)));
  B.add(M.castleTrim, at(lathe([[0.2, 3.1], [0.5, 3.16], [0.78, 3.32], [0.86, 3.44], [0.8, 3.48], [0.5, 3.36], [0, 3.34]], 32)));
  B.add(M.gold, at(lathe([[0.18, 1.62], [0.24, 1.66], [0.24, 1.74], [0.18, 1.78]], 24)));
  B.add(M.gold, at(lathe([[0.17, 3.36], [0.2, 3.48], [0.13, 3.62], [0.2, 3.8], [0.28, 3.86], [0.3, 4.05], [0.2, 4.08], [0.06, 4.1]], 20)));
  { const sp = []; for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; sp.push(new THREE.ConeGeometry(0.05, 0.28, 6).translate(Math.cos(a) * 0.27, 4.18, Math.sin(a) * 0.27)); sp.push(new THREE.SphereGeometry(0.045, 8, 6).translate(Math.cos(a) * 0.27, 4.34, Math.sin(a) * 0.27)); } B.add(M.gold, at(merge(sp))); }
  // collision: the basin as a stepped octagon, the pedestal taller
  B.col(x - 2.55, x + 2.55, 0, 0.72, z - 1.05, z + 1.05); B.col(x - 1.05, x + 1.05, 0, 0.72, z - 2.55, z + 2.55); B.col(x - 1.85, x + 1.85, 0, 0.72, z - 1.85, z + 1.85);
  B.col(x - 0.6, x + 0.6, 0.72, 4.2, z - 0.6, z + 0.6);
  // water: clear turquoise with moving ripples (animated normal), the three pools
  const wm = new THREE.MeshPhysicalMaterial({ color: '#3d4a26', roughness: 0.12, metalness: 0, transparent: true, opacity: 0.94, envMapIntensity: 0.9, clearcoat: 0.6, clearcoatRoughness: 0.2 });
  wm.onBeforeCompile = (sh) => {
    sh.uniforms.uT = RAIN.time;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPw;').replace('#include <project_vertex>', '#include <project_vertex>\nvWPw = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPw; uniform float uT;')
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        { vec2 q = vWPw.xz; float r = length(q - vec2(${x.toFixed(2)}, ${z.toFixed(2)}));
          vec2 dir = normalize(q - vec2(${x.toFixed(2)}, ${z.toFixed(2)}) + 1e-4);
          float w = (sin(r * 9.0 - uT * 2.0) * 0.5 + sin(q.x * 6.3 + uT * 0.7) * 0.25 + sin(q.y * 7.1 - uT * 0.9) * 0.25) * 0.25;
          vec3 pn = normalize(vec3(dir.x * w * 0.18 + cos(q.x * 6.3 + uT * 2.1) * 0.05, 1.0, dir.y * w * 0.18 + cos(q.y * 7.1 - uT * 2.6) * 0.05));
          normal = normalize((viewMatrix * vec4(pn, 0.0)).xyz); }`);
  };
  wm.customProgramCacheKey = () => 'ash-fountain-water';
  // the basin is low and green with algae, the first bowl holds a scum of rainwater, the top bowl is dry
  for (const [r, y] of [[2.21, 0.36], [1.3, 1.9]]) { const g = new THREE.CircleGeometry(r, 40); g.rotateX(-Math.PI / 2); g.translate(x, y, z); const m = new THREE.Mesh(g, wm); m.receiveShadow = true; scene.add(m); }
  // falling water: veils off each bowl lip and a crown jet, scrolling streak texture
  const tex = fallTexture(); tex.repeat.set(4, 1.2);
  const fm = new THREE.MeshStandardMaterial({ color: '#c8d4c0', map: tex, alphaMap: tex, transparent: true, opacity: 0.45, depthWrite: false, roughness: 0.3, side: THREE.DoubleSide });
  // only a trickle is left: a thin spill off one side of the first bowl
  const veils = [lathe([[1.5, 2.04], [1.62, 1.8], [1.72, 1.2], [1.78, 0.38]], 10, 0.9).rotateY(2.2)];
  for (const v of veils) { v.translate(x, 0, z); const m = new THREE.Mesh(v, fm); m.renderOrder = 2; scene.add(m); }
  ctx.anim.push((dt) => { tex.offset.y += dt * 0.9; });
  ctx.fountainTris = veils.reduce((a, v) => a + v.index.count / 3, 0);
}
