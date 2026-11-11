// THE ESPLANADE (south edge): the park's front gate. Two brick pylons with copper cupolas carry the great
// ASHLAND sign in bulb letters under an iron arch; octagonal ticket kiosks either side, a row of brass
// turnstiles beyond the arch, faded attraction bills in iron cases. Either side, four boardwalk hotels:
// board-and-batten in deep red, bottle green and cream, deep porches with turned posts, balconies, plywood
// over half the windows, slate mansards, and the dead neon script of the HOTEL VESPER on its roof.
import * as THREE from 'three';
import { Frame, P, molding, mansard, dome, lathe, merge, pediment, ironRailing, balustrade, archSurround } from './kit.js';
import { storey } from './facade.js';
import { paintedSign } from './signs.js';
import { bulbLetters, bulbRow, deadNeon, ticketKiosk, turnstile, posterCase } from './showfront.js';

const HOTELS = ['HOTEL MERIDIAN', 'THE CARLISLE', 'HOTEL VESPER', 'THE BELVEDERE'];
const place = (F, mesh, x, y, z) => { mesh.position.copy(F.point(x, y, z)); mesh.rotation.y = F.rotY; return mesh; };
const signPlane = (text, w, h, opts) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: paintedSign(text, opts), roughness: 0.8 }));

export function buildEsplanade(ctx) {
  const { B, M, rr, scene, propAt } = ctx;
  const F = new Frame(B, 0, 36, Math.PI);
  let hi = 0;
  for (const [xa, xb] of [[-44, -26.6], [-26.6, -9.2], [9.2, 26.6], [26.6, 44]]) hotel(ctx, F, xa, xb, HOTELS[hi++], hi);

  // ---------------- the gate ----------------
  const py0 = 3.5, py1 = 6.4, pz0 = -2.2, pz1 = 1.2, PH = 10.4;
  for (const s of [-1, 1]) {
    const xa = s < 0 ? -py1 : py0, xb = s < 0 ? -py0 : py1, cx = (xa + xb) / 2;
    F.col(xa, xb, 0, PH, pz0, pz1, { surface: 'concrete' });
    F.box(M.stoneDark, xa - 0.15, xb + 0.15, 0, 1.1, pz0 - 0.15, pz1 + 0.15);
    F.geo(M.stoneDark, molding(P.plinth(0.8), xa - 0.15, xb + 0.15, 1.1, pz1 + 0.15));
    F.box(M.brickDeep, xa, xb, 1.1, PH, pz0, pz1);
    for (const e of [xa, xb]) F.box(M.woodGreen, e - 0.14, e + 0.14, 1.1, PH - 0.4, pz1 - 0.02, pz1 + 0.12); // painted corner boards
    posterCase(F, M, scene, cx, 3.9, pz1, s < 0 ? 1 : 2, 7 + s, 1.55);
    F.box(M.woodCream, xa - 0.25, xb + 0.25, 6.4, 7.2, pz0 - 0.25, pz1 + 0.25);
    const band = signPlane(s < 0 ? 'RIDES' : 'AMUSEMENTS', xb - xa - 0.2, 0.62, { bg: '#5a1a14', fg: '#e2c27a', h: 256, w: 1024 });
    scene.add(place(F, band, cx, 6.8, pz1 + 0.27));
    bulbRow(ctx, F, xa - 0.2, 7.3, pz1 + 0.3, xb + 0.2, 7.3, pz1 + 0.3, 0.3, 0.12, 11 + s);
    bulbRow(ctx, F, xa - 0.2, 6.3, pz1 + 0.3, xb + 0.2, 6.3, pz1 + 0.3, 0.3, 0.06, 13 + s);
    F.geo(M.woodCream, molding(P.cornice(0.9), xa - 0.3, xb + 0.3, PH - 0.5, pz1));
    // copper cupola with a lantern and a brass globe
    F.box(M.woodCream, xa + 0.2, xb - 0.2, PH, PH + 1.0, pz0 + 0.4, pz1 - 0.4);
    const D = dome(1.25, { drumH: 0.7, h: 1.7, ribs: 8, lanternR: 0.26 }); D.shell.translate(cx, PH + 1.0, (pz0 + pz1) / 2); D.stone.translate(cx, PH + 1.0, (pz0 + pz1) / 2); F.geo(M.copper, D.shell); F.geo(M.woodCream, D.stone);
    const glob = new THREE.SphereGeometry(0.32, 20, 14); glob.translate(cx, PH + 1.0 + D.top + 0.55, (pz0 + pz1) / 2); F.geo(M.gold, glob);
    // ticket kiosk outboard of each pylon, iron fence back to the hotels
    const kx = s * 7.85, kz = -0.15, kp = F.point(kx, 0, kz);
    const front = ticketKiosk(ctx, kp.x, kp.z, F.rotY - Math.PI / 8);
    const tk = signPlane('TICKETS', 0.88, 0.24, { bg: '#2f4a3a', fg: '#e2c27a', h: 256, w: 1024 }); tk.position.copy(front); tk.position.y = 2.42; tk.rotation.y = F.rotY; scene.add(tk);
    F.geo(M.iron, ironRailing(2.6, 1.3, 0.12).translate(s * 7.85, 0, -1.9));
  }
  // the iron arch with the park's name in bulbs
  const aw = py0 + 0.3, ay = PH - 0.6;
  F.box(M.iron, -aw - 0.2, aw + 0.2, ay - 0.25, ay, -0.6, 0.6);
  F.geo(M.iron, ironRailing(aw * 2, 2.2, 0.32).translate(0, ay, 0));
  F.box(M.iron, -aw - 0.2, aw + 0.2, ay + 2.2, ay + 2.4, -0.25, 0.25);
  bulbLetters(ctx, F, 'ASHLAND', 0, ay + 1.15, 0.32, aw * 2 - 0.3, 1.75, { plate: M.woodRed, litChance: 0.07, seed: 21 });
  const arc = []; for (const zz of [-0.15, 0.15]) { const curve = new THREE.CatmullRomCurve3(Array.from({ length: 17 }, (_, i) => { const t = i / 16, a = Math.PI * (1 - t); return new THREE.Vector3(Math.cos(a) * (aw + 0.1), ay + 2.4 + Math.sin(a) * 1.7, zz); })); arc.push(new THREE.TubeGeometry(curve, 40, 0.07, 8)); }
  for (let i = 1; i < 16; i++) { const a = Math.PI * (1 - i / 16), x = Math.cos(a) * (aw + 0.1), y = ay + 2.4 + Math.sin(a) * 1.7; const g = new THREE.CylinderGeometry(0.03, 0.03, y - ay - 2.4, 6); g.translate(x, (y + ay + 2.4) / 2, 0); arc.push(g); }
  F.geo(M.iron, merge(arc));
  for (let i = 0; i <= 24; i++) { const a = Math.PI * (1 - i / 24); ctx.bulbs.push({ p: F.point(Math.cos(a) * (aw + 0.1), ay + 2.4 + Math.sin(a) * 1.7 + 0.1, 0.25), lit: rr() < 0.15 }); }
  const star = lathe([[0.5, 0], [0.12, 0.15], [0, 0.3]], 5); star.rotateX(Math.PI / 2); star.translate(0, ay + 4.45, 0); F.geo(M.gold, star);
  // turnstiles beyond the arch (behind the horde's gate spawn), one lane wrenched open
  for (let i = 0; i < 9; i++) {
    const x = -5.6 + i * 1.4; if (i === 4) continue;
    const p = F.point(x - 0.35, 0, -7.6); turnstile(ctx, p.x, p.z, F.rotY + (i % 3 === 1 ? 0.4 : 0));
    F.geo(M.iron, ironRailing(1.6, 1.05, 0.14).rotateY(Math.PI / 2).translate(x + 0.35, 0, -7.6));
  }
  const bent = ironRailing(1.6, 1.05, 0.14); bent.rotateY(Math.PI / 2); bent.rotateZ(0.5); bent.translate(0.1, 0.2, -7.4); F.geo(M.iron, bent);
}

function hotel(ctx, F, xa, xb, title, seed) {
  const { B, M, rr, scene } = ctx;
  const body = [M.woodRed, M.woodGreen, M.woodRed, M.woodCream][seed - 1], trim = body === M.woodCream ? M.woodGreen : M.woodCream;
  F.col(xa, xb, 0, 20, -8, 0, { surface: 'wood' });
  // ---- deep porch: recessed ground floor, plank deck, turned posts, fretwork brackets, balustrade
  const dz = -2.4, G = F.sub(0, dz);
  G.geo(M.stoneDark, molding(P.plinth(0.7), xa, xb, 0, 0));
  storey(G, M, rr, xa + 0.2, xb - 0.2, { y0: 0.45, y1: 4.9, bay: 2.9, mat: M.woodCream, win: { w: 1.5, sill: 0.6, spring: 2.6, seg: 0.12 }, surround: M.woodGreen, sill: M.woodGreen, fills: ['plywood', 'plywood', 'boards', 'glass', 'broken', 'dark'], frame: M.woodGreen, thick: 0.3 });
  F.box(M.deck, xa, xb, 0, 0.45, dz, 0); F.box(M.woodCream, xa, xb, 0.05, 0.4, -0.05, 0.02);
  const n = Math.round((xb - xa) / 2.9), step = (xb - xa) / n;
  for (let i = 0; i <= n; i++) {
    const x = xa + i * step + (i === 0 ? 0.15 : i === n ? -0.15 : 0);
    const post = lathe([[0.13, 0], [0.13, 0.35], [0.1, 0.45], [0.08, 0.6], [0.075, 3.6], [0.1, 3.75], [0.12, 3.9], [0.12, 4.4], [0, 4.4]], 10); post.translate(x, 0.45, -0.25); F.geo(trim, post);
    if (i < n) {
      const br = archSurround(x + 0.12, x + step - 0.12, 4.25, 4.25, { w: 0.14, d: 0.06, seg: 0.38 }); br.translate(0, -0.42, -0.28); F.geo(trim, br);
      if (i !== Math.floor(n / 2)) { const b = balustrade(step - 0.3, { h: 0.95, pitch: 0.2, rail: 0.1 }); b.translate(x + step / 2, 0.45, -0.25); F.geo(trim, b); }
    }
  }
  F.box(trim, xa, xb, 4.85, 5.1, dz, 0.1);   // porch roof edge = upper balcony floor
  F.box(body, xa, xb, 5.1, 5.3, dz, 0.05);
  F.geo(trim, balustrade(xb - xa - 0.4, { h: 0.9, pitch: 0.2, rail: 0.1 }).translate((xa + xb) / 2, 5.3, -0.05));
  bulbRow(ctx, F, xa + 0.3, 4.8, 0.12, xb - 0.3, 4.8, 0.12, 0.45, 0.05, seed * 7);
  // ---- upper floors
  const floors = 4, fh = 3.4, y0 = 6.0;
  F.box(body, xa, xb, 4.9, y0, dz, -0.3);
  for (let f = 0; f < floors; f++) {
    const yb = y0 + f * fh;
    storey(F, M, rr, xa + 0.2, xb - 0.2, { y0: yb, y1: yb + fh, bay: 2.9, mat: body, thick: 0.35, win: { w: 1.2, sill: 0.85, spring: 2.5, seg: 0.1 }, surround: trim, sill: trim,
      fills: ['shutter', 'plywood', 'glass', 'hanging', 'broken', 'plywood', 'boards'], frame: trim, shutterMat: trim === M.woodGreen ? M.woodCream : M.woodGreen, course: f === floors - 1 ? null : { mat: trim, profile: P.string(0.9) } });
  }
  const ytop = y0 + floors * fh;
  for (const e of [xa, xb]) F.box(trim, e === xa ? e : e - 0.32, e === xa ? e + 0.32 : e, 5.3, ytop, 0, 0.08);
  // bracketed timber cornice and a false-front name board
  F.geo(trim, molding(P.cornice(1.0), xa, xb, ytop + 0.15, 0));
  const mods = []; for (let x = xa + 0.4; x < xb - 0.2; x += 0.9) { const g = new THREE.BoxGeometry(0.14, 0.5, 0.42); g.translate(x, ytop - 0.1, 0.21); mods.push(g); }
  F.geo(trim, merge(mods));
  const bw = Math.min(xb - xa - 3, 11), bx = (xa + xb) / 2;
  if (title !== 'HOTEL VESPER') {
    F.box(body, bx - bw / 2 - 0.3, bx + bw / 2 + 0.3, ytop + 0.7, ytop + 2.6, -0.4, -0.15);
    F.geo(trim, pediment(bx, ytop + 2.6, bw + 0.6, { h: 0.7, d: 0.3, round: true }).translate(0, 0, -0.4));
    scene.add(place(F, signPlane(title, bw, 1.4, { bg: seed % 2 ? '#24382c' : '#4a1512', fg: '#d9b45c', h: 300, w: 2048, sub: 'BOARDWALK  ·  SEA AIR  ·  DANCING' }), bx, ytop + 1.65, -0.13));
  } else {
    // the Vesper's rooftop sign: dead neon script on an iron lattice frame, one letter still faintly alight
    const fy = ytop + 1.0;
    F.geo(M.iron, ironRailing(bw, 3.2, 0.45).translate(bx, fy, -1.2));
    F.box(M.iron, bx - bw / 2, bx + bw / 2, fy + 3.1, fy + 3.25, -1.3, -1.1);
    deadNeon(ctx, F, 'Hotel Vesper', bx, fy + 1.7, -1.05, bw - 0.4, 2.5, { color: '#5d1a1a', glow: '#ff3a28', lit: 0.0 });
    deadNeon(ctx, F, 'VACANCY', bx, fy - 0.15, -1.0, 3.2, 0.6, { color: '#2a4a3a', glow: '#3aff9a', font: '700', lit: 0.0 });
  }
  // slate mansard with gabled timber dormers + chimneys
  const rf = mansard(xb - xa - 0.4, 7.4, 3.8, 1.3, 0.9); rf.translate((xa + xb) / 2, ytop + 0.8, -3.9); F.geo(M.slate, rf);
  for (let x = xa + 1.8; x < xb - 1.2; x += 2.9) {
    if (title === 'HOTEL VESPER' && Math.abs(x - bx) < bw / 2 + 0.5) continue;
    F.box(trim, x - 0.7, x + 0.7, ytop + 1.0, ytop + 2.9, -1.4, -0.35);
    F.geo(M.slate, pediment(x, ytop + 2.9, 1.7, { h: 0.75, d: 1.3 }).translate(0, 0, -1.5));
    F.box(M.dark, x - 0.42, x + 0.42, ytop + 1.25, ytop + 2.6, -0.4, -0.33);
    F.box(rr() < 0.5 ? M.plywood : M.woodGreen, x - 0.42, x - 0.02, ytop + 1.25, ytop + 2.6, -0.36, -0.3);
  }
  for (const fx of [0.12, 0.88]) { const cx = xa + (xb - xa) * fx; F.box(M.brickDeep, cx - 0.8, cx + 0.8, ytop + 3.5, ytop + 7.2, -5.2, -4.0); F.box(M.stoneDark, cx - 0.92, cx + 0.92, ytop + 7.2, ytop + 7.45, -5.32, -3.88); }
}
