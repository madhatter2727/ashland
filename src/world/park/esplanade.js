// THE ESPLANADE (south edge): the park's formal entrance. The Ticket Palace straddles the south gate —
// giant paired columns, the ASHLAND frieze in gilt, a wrought-iron sunburst in the great arch, ticket windows
// behind brass grilles, verdigris cupolas. Either side, tall shuttered grand hotels in deep red brick with
// stone dressings, iron balconies, glass marquises over their doors and slate mansards with dormers.
import * as THREE from 'three';
import { Frame, P, molding, moldingRing, column, mansard, dome, lathe, merge, archSurround, keystone, pediment, ironRailing } from './kit.js';
import { storey } from './facade.js';
import { giltText } from './signs.js';

const HOTELS = ['HOTEL MERIDIAN', 'THE CARLISLE', 'HOTEL VESPERINE', 'THE BELVEDERE'];
function invert(g) { g = g.index ? g.toNonIndexed() : g; const p = g.attributes.position; for (let i = 0; i < p.count; i += 3) { const x = p.getX(i + 1), y = p.getY(i + 1), z = p.getZ(i + 1); p.setXYZ(i + 1, p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2)); p.setXYZ(i + 2, x, y, z); } g.computeVertexNormals(); return g; }
const place = (F, mesh, x, y, z) => { mesh.position.copy(F.point(x, y, z)); mesh.rotation.y = F.rotY; return mesh; };

export function buildEsplanade(ctx) {
  const { B, M, rr, scene, propAt } = ctx;
  const F = new Frame(B, 0, 36, Math.PI);
  let hi = 0;
  for (const [xa, xb] of [[-44, -26.6], [-26.6, -9.2], [9.2, 26.6], [26.6, 44]]) hotel(ctx, F, xa, xb, HOTELS[hi++], hi);

  // ---------------- Ticket Palace ----------------
  const zf = 1.2, zb = -8;
  F.col(-9.2, -3.6, 0, 16, zb, zf); F.col(3.6, 9.2, 0, 16, zb, zf); F.col(-3.6, 3.6, 8.7, 16, zb, zf);
  const front = new THREE.Shape(); front.moveTo(-9.2, 0); front.lineTo(-3.5, 0); front.lineTo(-3.5, 5.0);
  for (let i = 0; i <= 24; i++) { const a = Math.PI - (i / 24) * Math.PI; front.lineTo(Math.cos(a) * 3.5, 5.0 + Math.sin(a) * 3.5); }
  front.lineTo(3.5, 0); front.lineTo(9.2, 0); front.lineTo(9.2, 12.6); front.lineTo(-9.2, 12.6); front.closePath();
  const tw = [-6.4, 6.4];
  for (const x of tw) front.holes.push((() => { const p = new THREE.Path(); p.moveTo(x - 0.85, 1.05); p.lineTo(x - 0.85, 2.7); for (let i = 0; i <= 12; i++) { const a = Math.PI - (i / 12) * Math.PI; p.lineTo(x + Math.cos(a) * 0.85, 2.7 + Math.sin(a) * 0.85); } p.lineTo(x + 0.85, 1.05); p.closePath(); return p; })());
  F.geo(M.stone, new THREE.ExtrudeGeometry(front, { depth: 1.0, bevelEnabled: false, curveSegments: 24 }).translate(0, 0, zf - 1.0));
  const back = new THREE.Shape(); back.moveTo(-3.5, 0); back.lineTo(-3.5, 5.0); for (let i = 0; i <= 24; i++) { const a = Math.PI - (i / 24) * Math.PI; back.lineTo(Math.cos(a) * 3.5, 5.0 + Math.sin(a) * 3.5); } back.lineTo(3.5, 0); back.lineTo(4.3, 0); back.lineTo(4.3, 12.6); back.lineTo(-4.3, 12.6); back.lineTo(-4.3, 0); back.closePath();
  F.geo(M.stone, new THREE.ExtrudeGeometry(back, { depth: 0.8, bevelEnabled: false, curveSegments: 24 }).translate(0, 0, zb));
  for (const s of [-1, 1]) F.box(M.stone, s > 0 ? 3.5 : -4.3, s > 0 ? 4.3 : -3.5, 0, 12.6, zb, zf - 1.0);
  for (const s of [-1, 1]) F.box(M.stone, s > 0 ? 4.3 : -9.2, s > 0 ? 9.2 : -4.3, 0, 12.6, zb, zf - 1.0);
  const vault = new THREE.CylinderGeometry(3.5, 3.5, zf - zb, 28, 1, true, -Math.PI / 2, Math.PI); vault.rotateX(-Math.PI / 2); vault.translate(0, 5.0, (zf + zb) / 2); F.geo(M.marbleTrim, invert(vault));
  for (let z = zb + 1; z < zf - 0.5; z += 1.8) { const rib = new THREE.TorusGeometry(3.42, 0.1, 6, 24, Math.PI); rib.translate(0, 5.0, z); F.geo(M.gold, rib); }
  F.geo(M.marbleTrim, archSurround(-3.5, 3.5, 0.02, 5.0, { w: 0.42, d: 0.18 }).translate(0, 0, zf));
  F.geo(M.marble, keystone(0, 8.28, 1.0, 0.55, 0.85, 0.32).translate(0, 0, zf));
  // wrought-iron sunburst in the head of the great arch
  const sun = []; for (let k = 0; k <= 16; k++) { const a = (k / 16) * Math.PI, g = new THREE.BoxGeometry(0.05, 3.3, 0.05); g.translate(0, 1.85, 0); g.rotateZ(Math.PI / 2 - a); g.translate(0, 5.0, zf - 0.5); sun.push(g); }
  for (const r of [1.0, 2.1, 3.3]) { const t = new THREE.TorusGeometry(r, 0.04, 5, 32, Math.PI); t.translate(0, 5.0, zf - 0.5); sun.push(t); }
  const bar = new THREE.BoxGeometry(7.0, 0.12, 0.12); bar.translate(0, 5.0, zf - 0.5); sun.push(bar);
  F.geo(M.iron, merge(sun));
  const hub = new THREE.SphereGeometry(0.42, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2); hub.translate(0, 5.0, zf - 0.5); F.geo(M.gold, hub);
  // giant paired columns on pedestals, entablature with the park's name
  for (const x of [-8.35, -4.75, 4.75, 8.35]) {
    F.box(M.stoneDark, x - 0.75, x + 0.75, 0, 1.4, zf, zf + 1.3); F.geo(M.marbleTrim, molding(P.string(1), x - 0.85, x + 0.85, 1.25, zf + 1.3));
    const c = column(7.2, 0.46, { capital: 'corinthian' }); c.translate(x, 1.4, zf + 0.65); F.geo(M.marble, c);
  }
  F.col(-9.2, -4.0, 0, 1.4, zf, zf + 1.3); F.col(4.0, 9.2, 0, 1.4, zf, zf + 1.3);
  F.box(M.marbleTrim, -9.4, 9.4, 8.6, 9.0, zf - 0.2, zf + 1.45);
  F.box(M.stone, -9.4, 9.4, 9.0, 10.25, zf - 0.2, zf + 1.35);
  F.geo(M.marbleTrim, molding(P.cornice(1.25), -9.7, 9.7, 10.2, zf + 1.3));
  const name = giltText(M.gold, 'ASHLAND', 9.4, 1.05, { size: 210, spacing: 0.42, weight: 700 }); scene.add(place(F, name, 0, 9.63, zf + 1.37));
  // attic with a segmental pediment and a sculpted cartouche
  F.box(M.stone, -9.2, 9.2, 10.9, 12.6, zf - 1.0, zf + 0.6);
  F.geo(M.marbleTrim, pediment(0, 12.55, 10.0, { h: 2.3, d: 0.6, round: true }).translate(0, 0, zf));
  const cart = lathe([[0.95, 0], [1.0, 0.1], [0.9, 0.2], [0, 0.25]], 28); cart.rotateX(Math.PI / 2); cart.scale(1, 1.3, 1); cart.translate(0, 13.5, zf + 0.35); F.geo(M.gold, cart);
  for (const s of [-1, 1]) {
    const x = s * 7.6;
    F.box(M.stone, x - 1.4, x + 1.4, 12.6, 14.2, zf - 2.2, zf + 0.6);
    F.geo(M.marbleTrim, moldingRing(P.cornice(0.5), 2.8, 2.8, 14.0).translate(x, 0, zf - 0.8));
    const D = dome(1.3, { drumH: 0.8, h: 1.7, ribs: 8, lanternR: 0.28 }); D.shell.translate(x, 14.45, zf - 0.8); D.stone.translate(x, 14.45, zf - 0.8); F.geo(M.copper, D.shell); F.geo(M.marbleTrim, D.stone);
    for (const u of [-1, 1]) propAt('brass_vase_01', F.point(x + u * 1.1, 0, zf + 0.35).x, 14.25, F.point(x + u * 1.1, 0, zf + 0.35).z, 0, 0.8);
  }
  const roof = mansard(18.6, 8.6, 3.0, 1.3, 0.8); roof.translate(0, 12.6, -3.6); F.geo(M.copper, roof);
  // ticket windows: brass grilles, counters, gilt boards
  for (const x of tw) {
    const g = []; for (let k = -3; k <= 3; k++) { const b = new THREE.CylinderGeometry(0.018, 0.018, 2.6, 6); b.translate(x + k * 0.22, 2.3, zf - 0.45); g.push(b); }
    for (const yy of [1.5, 2.6]) { const b = new THREE.BoxGeometry(1.7, 0.04, 0.04); b.translate(x, yy, zf - 0.45); g.push(b); }
    F.geo(M.brass, merge(g));
    F.box(M.marbleTrim, x - 1.1, x + 1.1, 0.98, 1.08, zf - 0.6, zf + 0.25);
    F.geo(M.marbleTrim, archSurround(x - 0.85, x + 0.85, 1.05, 2.7, { w: 0.14, d: 0.08 }).translate(0, 0, zf));
    const ip = new THREE.PlaneGeometry(1.8, 2.8); ip.translate(x, 2.2, zf - 0.95); F.geo(M.interior, ip, 'keep');
    scene.add(place(F, giltText(M.gold, 'TICKETS', 1.6, 0.3, { size: 170, spacing: 0.35 }), x, 4.15, zf + 0.02));
  }
  // the iron gates, open
  for (const sx of [-1, 1]) propAt('large_iron_gate#' + (sx < 0 ? 'large_iron_gate_left_door' : 'large_iron_gate_right_door'), -sx * 3.3, 0, 36 - zb - 3.4 - 2.2, Math.PI + sx * Math.PI / 2 * 0.94, 1.2);
}

function hotel(ctx, F, xa, xb, title, seed) {
  const { B, M, rr, scene } = ctx;
  const body = seed % 2 ? M.brick : M.brickDeep;
  F.col(xa, xb, 0, 20, -8, 0, { surface: 'concrete' });
  F.geo(M.stoneDark, molding(P.plinth(1.0), xa, xb, 0, 0));
  storey(F, M, rr, xa + 0.2, xb - 0.2, { y0: 0, y1: 5.0, bay: 3.4, mat: M.stoneDark, win: { w: 2.3, sill: 0.55, spring: 3.3 }, surround: M.stone, keystone: M.marble, fills: ['boards', 'boards', 'broken', 'shutter'], frame: M.iron, shutterMat: M.boards });
  // gilt name on a stone frieze
  F.box(M.stone, xa, xb, 5.0, 6.0, -0.2, 0.12);
  F.geo(M.stone, molding(P.string(1.4), xa - 0.1, xb + 0.1, 5.85, 0.1));
  scene.add(place(F, giltText(M.gold, title, Math.min(xb - xa - 2, 11), 0.62, { size: 170, spacing: 0.28 }), (xa + xb) / 2, 5.48, 0.14));
  const floors = 4, fh = 3.4, y0 = 6.0;
  for (let f = 0; f < floors; f++) {
    const yb = y0 + f * fh;
    storey(F, M, rr, xa + 0.2, xb - 0.2, { y0: yb, y1: yb + fh, bay: 2.9, mat: body, win: { w: 1.25, sill: 0.85, spring: 2.55, seg: 0.16 }, surround: M.stone, keystone: M.stone, sill: M.stone, ironBalcony: f === 0, ironBalconySlab: M.stone, pediment: f === 0 ? M.stone : null, fills: ['shutter', 'shutter', 'shutter', 'hanging', 'glass', 'broken', 'boards'], frame: M.shutter, course: f === 0 || f === floors - 1 ? { mat: M.stone } : null });
  }
  const ytop = y0 + floors * fh;
  // quoins at both ends
  for (const e of [xa, xb]) for (let k = 0; k < 28; k++) { const y = 5.9 + k * 0.5, wq = k % 2 ? 0.55 : 0.85, s = e === xa ? 1 : -1; F.box(M.stone, s > 0 ? e : e - wq, s > 0 ? e + wq : e, y, y + 0.46, 0, 0.07); }
  // bracketed cornice
  F.geo(M.stone, molding(P.cornice(1.1), xa, xb, ytop + 0.2, 0));
  const mods = []; for (let x = xa + 0.4; x < xb - 0.2; x += 0.75) { const g = new THREE.BoxGeometry(0.16, 0.26, 0.5); g.translate(x, ytop + 0.07, 0.25); mods.push(g); }
  F.geo(M.stone, merge(mods));
  F.box(body, xa, xb, ytop - 0.1, ytop + 0.22, -0.3, 0);
  // slate mansard with gabled dormers + chimneys
  const rf = mansard(xb - xa - 0.4, 7.4, 3.8, 1.3, 0.9); rf.translate((xa + xb) / 2, ytop + 0.8, -3.9); F.geo(M.slate, rf);
  F.geo(M.iron, ironRailing(xb - xa - 0.6, 0.55, 0.14).translate((xa + xb) / 2, ytop + 0.8 + 4.7, -3.9));
  for (let x = xa + 1.8; x < xb - 1.2; x += 2.9) {
    F.box(M.stone, x - 0.7, x + 0.7, ytop + 1.0, ytop + 2.9, -1.4, -0.35);
    F.geo(M.slate, pediment(x, ytop + 2.9, 1.7, { h: 0.75, d: 1.3 }).translate(0, 0, -1.5));
    F.box(M.dark, x - 0.42, x + 0.42, ytop + 1.25, ytop + 2.6, -0.4, -0.33);
    F.box(M.shutter, x - 0.42, x - 0.02, ytop + 1.25, ytop + 2.6, -0.36, -0.3);
  }
  for (const fx of [0.18, 0.82]) { const cx = xa + (xb - xa) * fx; F.box(body, cx - 0.9, cx + 0.9, ytop + 3.5, ytop + 7.4, -5.2, -4.0); F.box(M.stone, cx - 1.02, cx + 1.02, ytop + 7.4, ytop + 7.65, -5.32, -3.88); for (const px of [-0.5, 0, 0.5]) F.geo(M.copper, lathe([[0.13, 0], [0.15, 0.1], [0.11, 0.6], [0.14, 0.66], [0, 0.66]], 10).translate(cx + px, ytop + 7.65, -4.6)); }
  // glass-and-iron marquise over the door
  const mx = (xa + xb) / 2, mw = 5.4;
  const mq = []; for (let k = 0; k <= 8; k++) { const g = new THREE.BoxGeometry(0.05, 0.06, 2.2); g.rotateX(0.18); g.translate(mx - mw / 2 + k * mw / 8, 4.45, 1.05); mq.push(g); }
  for (const zz of [0.1, 2.1]) { const g = new THREE.BoxGeometry(mw, 0.1, 0.08); g.translate(mx, zz > 1 ? 4.25 : 4.62, zz); mq.push(g); }
  for (const s of [-1, 1]) { const t = new THREE.TorusGeometry(1.1, 0.03, 5, 16, Math.PI / 2); t.rotateY(-Math.PI / 2); t.translate(mx + s * (mw / 2 - 0.2), 3.3, 0); mq.push(t); }
  F.geo(M.iron, merge(mq));
  const val = ironRailing(mw, 0.3, 0.1); val.rotateZ(Math.PI); val.translate(mx, 4.22, 2.12); F.geo(M.iron, val);
  if (seed % 2) { const g = new THREE.PlaneGeometry(mw / 2, 2.1); g.rotateX(-Math.PI / 2 + 0.18); g.translate(mx - mw / 4, 4.5, 1.05); F.geo(M.glass, g, 'keep'); }
}
