// THE PALACE (north edge): an original Beaux-Arts clock-palace. Rusticated arcade, a marble piano nobile with
// pedimented arched windows and balconettes, attic storey, deep cornice, urn-topped balustrade and verdigris
// copper mansards. The square clock tower over the north gate carries a stopped clock, an open belfry with a
// bronze bell, and a ribbed copper dome with a lantern and gilt armillary finial. No spires, no turrets.
import * as THREE from 'three';
import { Frame, P, molding, moldingRing, column, mansard, dome, lathe, merge, archSurround, keystone, wallWithOpenings, pediment, balustrade } from './kit.js';
import { storey, parapet } from './facade.js';
import { giltText, clockDial } from './signs.js';

function invert(g) { g = g.index ? g.toNonIndexed() : g; const p = g.attributes.position; for (let i = 0; i < p.count; i += 3) { const x = p.getX(i + 1), y = p.getY(i + 1), z = p.getZ(i + 1); p.setXYZ(i + 1, p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2)); p.setXYZ(i + 2, x, y, z); } g.computeVertexNormals(); return g; }

export function buildPalace(ctx) {
  const { B, M, rr, scene, propAt } = ctx;
  const F = new Frame(B, 0, -36, 0);
  const urns = [];
  // ---------------- wings ----------------
  for (const side of [-1, 1]) {
    const xa = side < 0 ? -44 : 6.2, xb = side < 0 ? -6.2 : 44;
    // solid mass for collisions (the facade plane is z = 0 -> world z = -36)
    F.col(xa, xb, 0, 17, -8, 0, { surface: 'concrete' });
    F.geo(M.stoneDark, molding(P.plinth(1.1), xa, xb, 0, 0));
    storey(F, M, rr, xa, xb, { y0: 0, y1: 6.6, bay: 4, mat: M.stoneDark, win: { w: 2.3, sill: 0.62, spring: 4.1 }, surround: M.stone, keystone: M.marble, fills: ['broken', 'boards', 'glass', 'broken', 'dark'], frame: M.iron, course: { mat: M.stone, profile: P.cornice(0.55) } });
    storey(F, M, rr, xa, xb, { y0: 6.6, y1: 13.1, bay: 4, mat: M.stone, win: { w: 1.7, sill: 1.05, spring: 4.4 }, surround: M.marbleTrim, keystone: M.marble, pediment: M.marbleTrim, balconette: M.marbleTrim, pilasters: { mat: M.marble, w: 0.56, d: 0.22 }, fills: ['glass', 'glass', 'broken', 'shutter', 'glass'], frame: M.iron, shutterMat: M.shutter, course: { mat: M.stone, profile: P.string(1.4) } });
    storey(F, M, rr, xa, xb, { y0: 13.1, y1: 15.7, bay: 4, mat: M.stone, win: { w: 1.25, sill: 0.45, spring: 1.75, seg: 0.14 }, surround: M.marbleTrim, fills: ['glass', 'dark', 'broken'], frame: M.iron });
    F.geo(M.marbleTrim, molding(P.cornice(1.35), xa, xb, 15.6, 0));
    parapet(F, M, xa + 0.4, xb - 0.4, 16.35, { pedestal: 4, mat: M.marbleTrim, urns });
    // copper mansard with oeil-de-boeuf dormers and a few chimneys
    const rw = xb - xa - 1.2, rcx = (xa + xb) / 2;
    const roof = mansard(rw, 6.6, 3.8, 1.25, 1.1); roof.translate(rcx, 16.35, -4.2); F.geo(M.copper, roof);
    const crest = molding([[0, 0], [0.14, 0], [0.14, 0.22], [0, 0.3]], xa + 2.2, xb - 2.2, 16.35 + 4.9, -4.2); F.geo(M.copper, crest);
    for (let x = xa + 2; x < xb - 1; x += 4) {
      const dg = []; const ring = new THREE.TorusGeometry(0.55, 0.13, 8, 22); dg.push(ring);
      const hood = new THREE.SphereGeometry(0.72, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2); hood.scale(1, 0.55, 0.9); hood.translate(0, 0.45, -0.25); dg.push(hood);
      const d = merge(dg); d.rotateX(-0.12); d.translate(x, 18.6, -1.25); F.geo(M.copper, d);
      const disc = new THREE.CircleGeometry(0.5, 20); disc.translate(x, 18.6, -1.3); F.geo(M.dark, disc, 'keep');
      const sc = new THREE.TorusGeometry(0.5, 0.025, 4, 16); sc.translate(x, 18.6, -1.27); F.geo(M.iron, sc);
    }
    for (const fx of [0.2, 0.55, 0.85]) { const cx = xa + (xb - xa) * fx; F.box(M.brickDeep, cx - 0.6, cx + 0.6, 19, 23.2, -5.4, -4.2); F.box(M.stone, cx - 0.72, cx + 0.72, 23.2, 23.45, -5.52, -4.08); for (const px of [-0.3, 0.3]) { const pot = lathe([[0.13, 0], [0.15, 0.1], [0.11, 0.5], [0.13, 0.55], [0.1, 0.6], [0, 0.6]], 10); pot.translate(cx + px, 23.45, -4.8); F.geo(M.copper, pot); } }
    // central frontispiece of each wing: giant marble columns, triangular pediment, tall pavilion roof
    const pc = side * 24, pw = 11;
    F.box(M.stone, pc - pw / 2, pc + pw / 2, 6.6, 15.7, 0, 0.55);
    for (let k = 0; k < 4; k++) { const cxk = pc - pw / 2 + 1.1 + k * ((pw - 2.2) / 3); const c = column(6.9, 0.36, { capital: 'corinthian' }); c.translate(cxk, 6.75, 1.05); F.geo(M.marble, c); }
    F.box(M.marbleTrim, pc - pw / 2 - 0.2, pc + pw / 2 + 0.2, 13.65, 14.5, 0.3, 1.55); // entablature
    F.geo(M.marbleTrim, molding(P.cornice(1.1), pc - pw / 2 - 0.3, pc + pw / 2 + 0.3, 14.5, 1.5));
    const ped = pediment(pc, 15.1, pw + 0.6, { h: 2.6, d: 1.4 }); ped.translate(0, 0, 0.1); F.geo(M.marbleTrim, ped);
    const tymp = pediment(pc, 15.2, pw - 1.0, { h: 2.1, d: 0.2 }); tymp.translate(0, 0, 1.3); F.geo(M.stone, tymp);
    F.box(M.stoneDark, pc - 0.5, pc + 0.5, 15.25, 16.9, 1.35, 1.55); // relief cartouche
    const proof = mansard(pw + 0.4, 8, 6.2, 1.6, 1.6); proof.translate(pc, 17.6, -3.6); F.geo(M.copper, proof);
    const fin = lathe([[0.3, 0], [0.32, 0.4], [0.12, 0.8], [0.22, 1.2], [0.04, 2.4], [0, 2.6]], 12); fin.translate(pc, 25.2, -3.6); F.geo(M.gold, fin);
    // statues on the frontispiece balustrade
    for (const sx of [-1, 1]) propAt('gothic_statue', pc + sx * (pw / 2 - 0.2), 15.15, -36 + 1.0, 0, 1.7);
  }
  for (const u of urns) propAt('brass_vase_01', u.x, u.y, u.z, rr() * 6, 0.85);

  // ---------------- clock tower over the gate ----------------
  const tz0 = 0.7, tz1 = -11.3, tw = 6.2;
  const T = { x0: -tw, x1: tw };
  F.col(-tw, -3.6, 0, 40, tz1, tz0); F.col(3.6, tw, 0, 40, tz1, tz0);
  F.col(-3.6, 3.6, 8.6, 40, tz1, tz0);
  // stage 1: rusticated, single great arch through the tower
  const front1 = new THREE.Shape(); front1.moveTo(-tw, 0); front1.lineTo(-3.5, 0); front1.lineTo(-3.5, 5.2);
  for (let i = 0; i <= 24; i++) { const a = Math.PI - (i / 24) * Math.PI; front1.lineTo(Math.cos(a) * 3.5, 5.2 + Math.sin(a) * 3.5); }
  front1.lineTo(3.5, 0); front1.lineTo(tw, 0); front1.lineTo(tw, 14); front1.lineTo(-tw, 14); front1.closePath();
  for (const z of [tz0, tz1 + 0.8]) { const g = new THREE.ExtrudeGeometry(front1, { depth: 0.8, bevelEnabled: false, curveSegments: 24 }); g.translate(0, 0, z - 0.8); F.geo(M.stoneDark, g); }
  for (const sx of [-1, 1]) { F.box(M.stoneDark, sx > 0 ? 3.5 : -tw, sx > 0 ? tw : -3.5, 0, 14, tz1 + 0.8, tz0 - 0.8); F.box(M.stoneDark, sx > 0 ? tw - 0.8 : -tw, sx > 0 ? tw : -tw + 0.8, 0, 14, tz1, tz0); }
  F.box(M.stoneDark, -3.5, 3.5, 8.7, 14, tz1 + 0.8, tz0 - 0.8);
  // barrel vault soffit of the passage, coffered by ribs
  const vault = new THREE.CylinderGeometry(3.5, 3.5, tz0 - tz1, 28, 1, true, -Math.PI / 2, Math.PI); vault.rotateX(-Math.PI / 2); vault.translate(0, 5.2, (tz0 + tz1) / 2);
  F.geo(M.stone, invert(vault));
  for (let z = tz1 + 1; z < tz0 - 0.5; z += 2) { const rib = new THREE.TorusGeometry(3.42, 0.12, 6, 24, Math.PI); rib.translate(0, 5.2, z); F.geo(M.marbleTrim, rib); }
  F.geo(M.marbleTrim, archSurround(-3.5, 3.5, 0.02, 5.2, { w: 0.45, d: 0.22 }).translate(0, 0, tz0));
  F.geo(M.marbleTrim, molding(P.plinth(1.2), -tw - 0.25, tw + 0.25, 0, tz0));
  F.geo(M.stone, molding(P.cornice(0.9), -tw - 0.3, tw + 0.3, 13.4, tz0));
  // gilt inscription on the frieze
  const ins = giltText(M.gold, 'THE PALACE OF HOURS', 9.6, 0.9, { size: 170, spacing: 0.22 }); ins.position.copy(F.point(0, 10.9, tz0 + 0.03)); ins.rotation.y = F.rotY; scene.add(ins);
  // stage 2: clock stage with giant corner pilasters + clock dial
  const t2y0 = 14.1, t2y1 = 25.2, sw = tw - 0.4;
  F.box(M.stone, -sw, sw, t2y0, t2y1, tz1 + 0.4, tz0 - 0.4);
  for (const sx of [-1, 1]) for (const fz of [tz0 - 0.4]) { const c = column(t2y1 - t2y0 - 0.2, 0.42, { capital: 'ionic' }); c.translate(sx * (sw - 0.55), t2y0, fz + 0.45); F.geo(M.marble, c); }
  const dialMat = new THREE.MeshStandardMaterial({ map: clockDial(), roughness: 0.55, metalness: 0, envMapIntensity: 0.8 });
  for (const [ox, oz, ry] of [[0, tz0 - 0.38, 0], [-sw - 0.02, (tz0 + tz1) / 2, -Math.PI / 2], [sw + 0.02, (tz0 + tz1) / 2, Math.PI / 2]]) {
    const dial = new THREE.Mesh(new THREE.CircleGeometry(2.55, 64), dialMat);
    dial.position.copy(F.point(ox + Math.sin(ry) * 0.06, 19.6, oz + Math.cos(ry) * 0.06)); dial.rotation.y = ry; scene.add(dial);
    const bez = new THREE.TorusGeometry(2.65, 0.16, 10, 64); bez.rotateY(ry); bez.translate(ox + Math.sin(ry) * 0.05, 19.6, oz + Math.cos(ry) * 0.05); F.geo(M.gold, bez);
    const wreath = new THREE.TorusGeometry(3.05, 0.3, 10, 64); wreath.scale(1, 1, 0.6); wreath.rotateY(ry); wreath.translate(ox, 19.6, oz); F.geo(M.marbleTrim, wreath);
  }
  F.geo(M.marbleTrim, moldingRing(P.cornice(1.1), sw * 2, tz0 - tz1 - 0.8, t2y1 - 0.1).translate(0, 0, (tz0 + tz1) / 2));
  // stage 3: open belfry, three arches a side, a bell inside
  const by0 = t2y1 + 0.55, by1 = by0 + 6.4, bw = sw - 0.6, bcz = (tz0 + tz1) / 2, bd = (tz0 - tz1) / 2 - 1.0;
  for (const [rot, L, tx, tz] of [[0, bw, 0, bcz + bd], [Math.PI, bw, 0, bcz - bd], [Math.PI / 2, bd, bw, bcz], [-Math.PI / 2, bd, -bw, bcz]]) {
    const sp = L * 0.62;
    const wall = wallWithOpenings(-L, L, by0, by1, [-1, 0, 1].map((k) => ({ x0: k * sp - 0.95, x1: k * sp + 0.95, y0: by0 + 0.9, spring: by0 + 4.0 })), 0.6);
    wall.rotateY(rot); wall.translate(tx, 0, tz); F.geo(M.stone, wall);
    const ba = balustrade(L * 2 - 0.4, { h: 0.9, pitch: 0.26 }); ba.translate(0, by0, 0.25); ba.rotateY(rot); ba.translate(tx, 0, tz); F.geo(M.marbleTrim, ba);
    for (const k of [-1.5, -0.5, 0.5, 1.5]) { const c = column(4.6, 0.2, { capital: 'ionic', flutes: 12, seg: 20 }); c.translate(k * sp, by0 + 0.9, 0.35); c.rotateY(rot); c.translate(tx, 0, tz); F.geo(M.marble, c); }
  }
  F.box(M.stone, -bw, bw, by1, by1 + 0.4, bcz - bd - 0.3, bcz + bd + 0.3);
  F.geo(M.marbleTrim, moldingRing(P.cornice(0.9), bw * 2, bd * 2, by1 + 0.3).translate(0, 0, bcz));
  const bell = lathe([[0, 2.2], [0.35, 2.15], [0.5, 1.9], [0.62, 1.2], [0.85, 0.45], [1.15, 0.12], [1.2, 0], [1.05, 0.02], [0, 0.4]], 32); bell.translate(0, by0 + 1.4, bcz); F.geo(M.brass, bell);
  F.box(M.iron, -1.6, 1.6, by0 + 3.6, by0 + 3.85, bcz - 0.15, bcz + 0.15);
  // dome on a drum, lantern, armillary finial
  const D = dome(3.7, { drumH: 2.2, h: 4.3, ribs: 16, lanternR: 0.75 });
  D.shell.translate(0, by1 + 1.1, bcz); D.stone.translate(0, by1 + 1.1, bcz);
  F.geo(M.copper, D.shell); F.geo(M.marbleTrim, D.stone);
  const ty = by1 + 1.1 + D.top - 0.4;
  const arm = []; for (const [rx, rz] of [[0, 0], [Math.PI / 2, 0], [0.4, 1.1]]) { const r = new THREE.TorusGeometry(0.75, 0.045, 6, 32); r.rotateX(rx); r.rotateZ(rz); r.translate(0, ty + 1.3, bcz); arm.push(r); }
  const mast = new THREE.CylinderGeometry(0.05, 0.08, 3.6, 8); mast.translate(0, ty + 1.2, bcz); arm.push(mast);
  F.geo(M.gold, merge(arm));
  // bronze lion keystone over the great arch, wall lanterns either side
  propAt('lion_head', 0, 8.35, -36 + tz0 + 0.05, 0, 1.25);
  ctx.towerTop = F.point(0, ty + 3, bcz);

  // the iron gates, thrown open against the passage walls
  for (const sx of [-1, 1]) propAt('large_iron_gate#' + (sx < 0 ? 'large_iron_gate_left_door' : 'large_iron_gate_right_door'), sx * 3.3, 0, -36 + tz1 + 3.6 + 1.6, sx * Math.PI / 2 * 0.94, 1.2);
  // bronze figures on plinths flanking the tower
  for (const sx of [-1, 1]) {
    const x = sx * 8.6, z = -34.2;
    const pl = merge([new THREE.BoxGeometry(1.5, 0.35, 1.5).translate(0, 0.175, 0), new THREE.BoxGeometry(1.15, 1.6, 1.15).translate(0, 1.15, 0), new THREE.BoxGeometry(1.4, 0.22, 1.4).translate(0, 2.06, 0)]);
    pl.translate(x, 0, z); B.add(M.marble, pl); B.col(x - 0.75, x + 0.75, 0, 2.17, z - 0.75, z + 0.75);
    propAt('gothic_statue', x, 2.17, z, 0.15 * sx, 1.9);
  }
}
