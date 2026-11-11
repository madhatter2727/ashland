// THE PALACE OF HOURS (north edge): the park's great dark ride, a clockwork show building. Brick show halls
// with boarded arcades and faded bills, a mural storey, stepped false fronts with painted attraction boards;
// over the north gate the clock tower (stopped at 11:47) wears a huge broken marquee, one end torn loose and
// sagging, with ticket windows set into the tower piers. No spires, no turrets.
import * as THREE from 'three';
import { Frame, P, molding, moldingRing, column, mansard, dome, lathe, merge, archSurround, keystone, wallWithOpenings, pediment, balustrade, ironRailing } from './kit.js';
import { storey, parapet } from './facade.js';
import { giltText, clockDial, paintedSign } from './signs.js';
import { poster, posterCase, bulbRow, ticketKiosk } from './showfront.js';

function invert(g) { g = g.index ? g.toNonIndexed() : g; const p = g.attributes.position; for (let i = 0; i < p.count; i += 3) { const x = p.getX(i + 1), y = p.getY(i + 1), z = p.getZ(i + 1); p.setXYZ(i + 1, p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2)); p.setXYZ(i + 2, x, y, z); } g.computeVertexNormals(); return g; }

export function buildPalace(ctx) {
  const { B, M, rr, scene, propAt } = ctx;
  const F = new Frame(B, 0, -36, 0);
  // ---------------- show-building wings ----------------
  // Brick show halls: boarded arcade with bills in iron cases, a great faded mural storey above, a stepped
  // false-front parapet with painted boards, bulb rows (nearly all dead), a billboard and a water tank on top.
  const boards = [['THE PALACE OF HOURS', 'A VOYAGE THROUGH TIME  ·  EVERY HALF HOUR'], ['TWELVE HALLS OF WONDER', 'THE CLOCKWORK DARK RIDE  ·  ALL AGES WELCOME']];
  for (const side of [-1, 1]) {
    const xa = side < 0 ? -44 : 6.2, xb = side < 0 ? -6.2 : 44, cx = (xa + xb) / 2;
    F.col(xa, xb, 0, 17, -8, 0, { surface: 'concrete' });
    F.geo(M.stoneDark, molding(P.plinth(1.1), xa, xb, 0, 0));
    const g = storey(F, M, rr, xa, xb, { y0: 0, y1: 6.6, bay: 4, mat: M.brickDeep, win: { w: 2.5, sill: 0.4, spring: 4.0 }, surround: M.woodCream, fills: ['plywood', 'boards', 'plywood', 'dark', 'plywood'], frame: M.woodGreen, course: { mat: M.woodCream, profile: P.string(1.4) } });
    for (let i = 1; i < g.n; i++) if ((i + (side > 0 ? 1 : 0)) % 2) posterCase(F, M, scene, xa + g.bw * i, 3.0, 0.02, (i + side + 3) % 6, i * 5 + side, 1.02);
    bulbRow(ctx, F, xa + 0.3, 6.45, 0.32, xb - 0.3, 6.45, 0.32, 0.4, 0.04, 31 + side);
    // the mural storey: peeling painted render with two giant faded bills framed in painted timber
    F.box(M.muralWall, xa, xb, 6.6, 15.6, -0.5, 0.02);
    const mw = 5.0, mh = mw * 1.5;
    for (const fx of [0.3, 0.7]) {
      const mx = xa + (xb - xa) * fx, my = 11.0;
      F.box(M.woodCream, mx - mw / 2 - 0.35, mx + mw / 2 + 0.35, my - mh / 2 - 0.35, my + mh / 2 + 0.35, 0.02, 0.1);
      const mur = poster(M, fx < 0.5 ? (side < 0 ? 0 : 2) : (side < 0 ? 5 : 1), 40 + side + fx * 10, mw); mur.position.copy(F.point(mx, my, 0.12)); mur.rotation.y = F.rotY; scene.add(mur);
    }
    for (let x = xa + 0.3; x <= xb - 0.2; x += (xb - xa - 0.6) / 6) F.box(M.woodGreen, x - 0.22, x + 0.22, 6.6, 15.6, 0.02, 0.2);
    F.geo(M.woodCream, molding(P.cornice(1.2), xa, xb, 15.4, 0));
    bulbRow(ctx, F, xa + 0.3, 15.35, 0.5, xb - 0.3, 15.35, 0.5, 0.42, 0.05, 41 + side);
    // stepped false front with the attraction boards
    const steps = [[xa, xb, 15.95, 17.4], [cx - 11, cx + 11, 17.4, 19.6], [cx - 6.5, cx + 6.5, 19.6, 21.4]];
    for (const [x0, x1, y0, y1] of steps) { F.box(M.woodRed, x0, x1, y0, y1, -0.5, 0); F.geo(M.woodCream, molding(P.cornice(0.6), x0, x1, y1 - 0.25, 0)); }
    const bd = boards[side < 0 ? 0 : 1];
    const sp = new THREE.Mesh(new THREE.PlaneGeometry(20.4, 1.9), new THREE.MeshStandardMaterial({ map: paintedSign(bd[0], { bg: '#22362a', fg: '#d8b35a', sub: bd[1], w: 2048, h: 192 }), roughness: 0.8 }));
    sp.position.copy(F.point(cx, 18.5, 0.04)); sp.rotation.y = F.rotY; scene.add(sp);
    F.box(M.slate, xa, xb, 15.6, 16.4, -8, -0.5); // roof deck behind the false front
    if (side < 0) { // rooftop billboard on its iron frame
      F.geo(M.iron, ironRailing(10, 4.2, 0.5).translate(cx - 9, 16.4, -4.5));
      F.box(M.iron, cx - 14, cx - 4, 20.5, 20.7, -4.7, -4.3);
      const bb = poster(M, 1, 77, 2.6); bb.scale.set(3.8, 1.05, 1); bb.position.copy(F.point(cx - 9, 18.6, -4.2)); bb.rotation.y = F.rotY; scene.add(bb);
    } else { // water tank on stilts
      const tk = []; const body = lathe([[1.6, 0], [1.6, 2.6], [1.7, 2.7], [0.2, 3.6], [0, 3.6]], 20); body.translate(cx + 8, 19.6, -4.5); tk.push(body);
      for (const [dx, dz] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) { const l = new THREE.CylinderGeometry(0.1, 0.12, 3.2, 8); l.translate(cx + 8 + dx, 18.0, -4.5 + dz); tk.push(l); }
      F.geo(M.woodGreen, tk[0]); F.geo(M.iron, merge(tk.slice(1)));
    }
  }


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
  // ticket kiosks flanking the tower (on the old statue plinth spots: same cover)
  for (const sx of [-1, 1]) {
    const front = ticketKiosk(ctx, sx * 8.6, -34.25, -Math.PI / 8, { r: 0.95 });
    const tk = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.2), new THREE.MeshStandardMaterial({ map: paintedSign('TICKETS', { bg: '#2f4a3a', fg: '#e2c27a', w: 1024, h: 256 }), roughness: 0.8 }));
    tk.position.copy(front); tk.position.y = 2.42; scene.add(tk);
  }
  // ticket windows let into the tower piers
  for (const sx of [-1, 1]) {
    const x0 = sx < 0 ? -5.95 : 3.85, x1 = sx < 0 ? -3.85 : 5.95, cx = (x0 + x1) / 2, z0 = tz0, z1 = tz0 + 0.5;
    F.col(x0, x1, 0, 3.5, z0, z1 + 0.25); F.box(M.woodGreen, x0, x1, 0, 1.15, z0, z1); F.box(M.woodGreen, x0, x1, 2.85, 3.5, z0, z1);
    for (const e of [x0, x1]) F.box(M.woodGreen, e - 0.08, e + 0.08, 1.15, 2.85, z0, z1);
    F.box(M.woodCream, x0 - 0.1, x1 + 0.1, 1.12, 1.2, z0, z1 + 0.28);
    F.geo(M.woodCream, molding(P.cornice(0.5), x0 - 0.15, x1 + 0.15, 3.35, z1));
    const ip = new THREE.PlaneGeometry(x1 - x0, 1.7); ip.translate(cx, 2.0, z0 + 0.05); F.geo(M.interior, ip, 'keep');
    const gr = []; for (let k = -4; k <= 4; k++) { const b = new THREE.CylinderGeometry(0.014, 0.014, 1.65, 6); b.translate(cx + k * 0.2, 2.02, z1 - 0.1); gr.push(b); } F.geo(M.brass, merge(gr));
    const tk = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.42), new THREE.MeshStandardMaterial({ map: paintedSign('TICKETS', { bg: '#4a1512', fg: '#d9b45c', w: 1024, h: 256 }), roughness: 0.8 }));
    tk.position.copy(F.point(cx, 3.15, z1 + 0.02)); tk.rotation.y = F.rotY; scene.add(tk);
  }
  // ---- the great marquee over the gate, its east end torn from its rods and sagging
  const mx0 = -7.2, mx1 = 7.2, my0 = 6.0, my1 = 7.7, mz0 = tz0, mz1 = tz0 + 3.6, brk = 2.6;
  const R = new Frame(B, 0, 0, 0); R.rotY = F.rotY;
  R.m = F.m.clone().multiply(new THREE.Matrix4().makeTranslation(brk, my1, mz0)).multiply(new THREE.Matrix4().makeRotationZ(-0.2)).multiply(new THREE.Matrix4().makeRotationX(0.06)).multiply(new THREE.Matrix4().makeTranslation(-brk, -my1, -mz0));
  const text = 'THE PALACE OF HOURS', board = (() => { // milk-glass letter board, letters gone, panels smashed
    const c = document.createElement('canvas'); c.width = 2048; c.height = 220; const g = c.getContext('2d');
    g.fillStyle = '#b7ad96'; g.fillRect(0, 0, 2048, 220);
    for (let x = 0; x < 2048; x += 128) { g.fillStyle = rr() < 0.14 ? '#120f0c' : `rgba(60,50,40,${rr() * 0.25})`; g.fillRect(x + 3, 6, 122, 208); }
    g.fillStyle = '#16120e'; g.font = '700 150px "Playfair Display", "Times New Roman", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const chars = [...text]; const w = 2048 / (chars.length + 1);
    chars.forEach((ch, i) => { if ([5, 12, 16].includes(i)) return; g.save(); g.translate(w * (i + 1), 116); g.rotate((rr() - 0.5) * (i % 4 === 0 ? 0.5 : 0.08)); g.fillText(ch, 0, 0); g.restore(); });
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(40,30,20,${rr() * 0.2})`; g.fillRect(rr() * 2048, rr() * 220, 3 + rr() * 40, 2 + rr() * 10); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; })();
  const boardMat = new THREE.MeshStandardMaterial({ map: board, roughness: 0.4, emissive: '#ffd9a0', emissiveMap: board, emissiveIntensity: 0.06 });
  for (const [Fr, a, b] of [[F, mx0, brk], [R, brk, mx1]]) {
    Fr.box(M.woodRed, a, b, my0, my1, mz0, mz1);
    Fr.box(M.woodCream, a, b, my1, my1 + 0.25, mz0, mz1 + 0.15);
    Fr.geo(M.woodCream, molding(P.cornice(0.45), a, b, my1 - 0.05, mz1));
    Fr.box(M.gold, a, b, my0 - 0.12, my0, mz0, mz1 + 0.05);
    const pl = new THREE.PlaneGeometry(b - a - 0.3, my1 - my0 - 0.35), uv = pl.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setX(i, ((a + 0.15) + uv.getX(i) * (b - a - 0.3) - mx0) / (mx1 - mx0));
    pl.translate((a + b) / 2, (my0 + my1) / 2, mz1 + 0.02); pl.applyMatrix4(Fr.m); scene.add(new THREE.Mesh(pl, boardMat));
    bulbRow(ctx, Fr, a + 0.15, my1 + 0.05, mz1 + 0.12, b - 0.15, my1 + 0.05, mz1 + 0.12, 0.3, 0.07, a > 0 ? 3 : 4);
    bulbRow(ctx, Fr, a + 0.15, my0 + 0.08, mz1 + 0.12, b - 0.15, my0 + 0.08, mz1 + 0.12, 0.3, 0.07, a > 0 ? 5 : 6);
    for (let z = mz0 + 0.5; z < mz1; z += 0.6) bulbRow(ctx, Fr, a + 0.3, my0 - 0.18, z, b - 0.3, my0 - 0.18, z, 0.6, 0.04, Math.round(z * 10) + (a > 0 ? 50 : 0));
  }
  // tie rods up to the tower; the east pair snapped, one hanging loose
  const rods = []; for (const x of [-6.4, -1.2]) { const g = new THREE.CylinderGeometry(0.04, 0.04, 4.2, 6); g.rotateX(-0.95); g.translate(x, my1 + 1.75, mz0 + 1.6); rods.push(g); }
  F.geo(M.iron, merge(rods));
  const loose = new THREE.CylinderGeometry(0.04, 0.04, 2.6, 6); loose.rotateX(0.25); loose.translate(5.6, my1 + 2.0, mz0 + 0.5); F.geo(M.iron, loose);
}
