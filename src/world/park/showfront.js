// Amusement-park dressing shared by the show building, the entrance gate, the hotels and the midway:
// faded attraction posters, bulb-letter signs, a broken marquee, dead neon script, ticket kiosks and
// turnstiles. Bulbs are collected into ctx.bulbs and drawn as two instanced meshes (dead glass / still lit).
import * as THREE from 'three';
import { lathe, merge, molding, P, dome } from './kit.js';
import { weather } from './materials.js';

const SERIF = '"Playfair Display", "Times New Roman", Georgia, serif';
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const tex = (c, srgb = true) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// ---------------------------------------------------------------- posters
// Original vintage-style attraction bills: bold flat shapes, serif type, then sun-bleached, water-stained,
// torn at the corners. Six designs, no characters or mascots.
const BILLS = [
  { t: 'ASHLAND CASTLE', s: 'A VOYAGE THROUGH TIME', bg: '#2d4a3a', fg: '#e3c57a', art: 'clock' },
  { t: 'THE IRON COMET', s: 'THE FASTEST RIDE ON THE COAST', bg: '#6e1d18', fg: '#ecd9a8', art: 'coaster' },
  { t: 'THE GRAND WHEEL', s: 'SEE THREE COUNTIES', bg: '#1f2e3d', fg: '#e8c36a', art: 'wheel' },
  { t: 'HALL OF MIRRORS', s: 'WHICH ONE IS YOU?', bg: '#3b1b2c', fg: '#e9d3a0', art: 'mirror' },
  { t: 'THE GROTTO BOATS', s: 'COOL AS A CAVERN', bg: '#173a3a', fg: '#e6cf98', art: 'waves' },
  { t: 'ASHLAND', s: 'OPEN TILL MIDNIGHT', bg: '#5a1a14', fg: '#f0d792', art: 'rays' },
];
export function posterTex(i, seed = 1) {
  const b = BILLS[i % BILLS.length], r = rng(seed * 97 + i * 13), W = 512, H = 768;
  const [c, g] = canvas(W, H);
  g.fillStyle = b.bg; g.fillRect(0, 0, W, H);
  g.save(); g.translate(W / 2, H * 0.42); g.fillStyle = b.fg; g.strokeStyle = b.fg;
  if (b.art === 'clock') { g.lineWidth = 14; g.beginPath(); g.arc(0, 0, 150, 0, 6.3); g.stroke(); for (let k = 0; k < 12; k++) { g.save(); g.rotate(k * Math.PI / 6); g.fillRect(-5, -140, 10, 28); g.restore(); } g.lineWidth = 12; g.beginPath(); g.moveTo(0, 0); g.lineTo(60, -70); g.moveTo(0, 0); g.lineTo(-20, -120); g.stroke(); }
  if (b.art === 'coaster') { g.lineWidth = 10; g.beginPath(); g.moveTo(-230, 120); g.bezierCurveTo(-150, -260, -40, -260, 10, 60); g.bezierCurveTo(60, 160, 150, -120, 240, 40); g.stroke(); for (let x = -220; x < 230; x += 34) { g.fillRect(x, 0, 6, 160); } }
  if (b.art === 'wheel') { g.lineWidth = 9; g.beginPath(); g.arc(0, -10, 165, 0, 6.3); g.stroke(); for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8; g.beginPath(); g.moveTo(0, -10); g.lineTo(Math.cos(a) * 165, -10 + Math.sin(a) * 165); g.stroke(); g.fillRect(Math.cos(a) * 165 - 12, -10 + Math.sin(a) * 165 + 4, 24, 20); } g.lineWidth = 14; g.beginPath(); g.moveTo(-90, 200); g.lineTo(0, -10); g.lineTo(90, 200); g.stroke(); }
  if (b.art === 'mirror') { for (let k = 0; k < 5; k++) { g.lineWidth = 8; g.globalAlpha = 1 - k * 0.17; g.beginPath(); g.ellipse(0, 0, 70 + k * 30, 120 + k * 30, 0, 0, 6.3); g.stroke(); } g.globalAlpha = 1; }
  if (b.art === 'waves') { g.lineWidth = 10; for (let k = 0; k < 6; k++) { g.beginPath(); for (let x = -230; x <= 230; x += 10) g.lineTo(x, -120 + k * 50 + Math.sin(x / 30 + k) * 14); g.stroke(); } g.beginPath(); g.moveTo(-230, -180); g.quadraticCurveTo(0, -330, 230, -180); g.stroke(); }
  if (b.art === 'rays') { for (let k = 0; k < 24; k++) { g.save(); g.rotate(k * Math.PI / 12); g.beginPath(); g.moveTo(0, 0); g.lineTo(-18, -400); g.lineTo(18, -400); g.closePath(); g.globalAlpha = k % 2 ? 0.9 : 0.35; g.fill(); g.restore(); } g.globalAlpha = 1; g.fillStyle = b.bg; g.beginPath(); g.arc(0, 0, 90, 0, 6.3); g.fill(); }
  g.restore();
  g.fillStyle = b.fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  const fit = (txt, y, size, wt = 700) => { g.font = `${wt} ${size}px ${SERIF}`; const k = Math.min(1, (W - 60) / g.measureText(txt).width); g.save(); g.translate(W / 2, y); g.scale(k, 1); g.fillText(txt, 0, 0); g.restore(); };
  fit(b.t, H * 0.8, 64); fit(b.s, H * 0.89, 26, 500);
  g.strokeStyle = b.fg; g.lineWidth = 6; g.strokeRect(16, 16, W - 32, H - 32);
  // age: bleaching toward the top, foxing, water runs, paper showing through scuffs
  const bl = g.createLinearGradient(0, 0, 0, H); bl.addColorStop(0, 'rgba(225,210,180,.45)'); bl.addColorStop(0.6, 'rgba(225,210,180,.12)'); bl.addColorStop(1, 'rgba(60,40,25,.25)'); g.fillStyle = bl; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 160; k++) { g.fillStyle = `rgba(${90 + r() * 60},${60 + r() * 30},${30},${r() * 0.12})`; g.beginPath(); g.arc(r() * W, r() * H, 3 + r() * 26, 0, 6.3); g.fill(); }
  for (let k = 0; k < 14; k++) { const x = r() * W, lg = g.createLinearGradient(x, 0, x, H); lg.addColorStop(0, 'rgba(70,50,30,0)'); lg.addColorStop(0.5, 'rgba(70,50,30,.2)'); lg.addColorStop(1, 'rgba(70,50,30,0)'); g.fillStyle = lg; g.fillRect(x, r() * H * 0.3, 3 + r() * 8, H); }
  for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(220,205,175,${0.4 + r() * 0.4})`; g.fillRect(r() * W, r() * H, 4 + r() * 30, 2 + r() * 6); }
  const t = tex(c);
  // tear mask: missing corners and a ripped strip
  const [ac, ag] = canvas(256, 384); ag.fillStyle = '#fff'; ag.fillRect(0, 0, 256, 384); ag.fillStyle = '#000';
  for (let k = 0; k < 3; k++) { const cx = r() < 0.5 ? 0 : 256, cy = r() < 0.5 ? 0 : 384; ag.beginPath(); ag.moveTo(cx, cy); for (let j = 0; j < 7; j++) ag.lineTo(cx + (cx ? -1 : 1) * r() * 120, cy + (cy ? -1 : 1) * r() * 160); ag.closePath(); ag.fill(); }
  if (r() < 0.5) { ag.beginPath(); ag.moveTo(0, 384 * r()); for (let x = 0; x <= 256; x += 16) ag.lineTo(x, 300 + r() * 84); ag.lineTo(256, 384); ag.lineTo(0, 384); ag.fill(); }
  return { map: t, alpha: tex(ac, false) };
}
export function poster(M, i, seed, w = 1.2) {
  const { map, alpha } = posterTex(i, seed);
  const m = new THREE.MeshStandardMaterial({ map, alphaMap: alpha, alphaTest: 0.5, roughness: 0.85, side: THREE.DoubleSide });
  weather(m, { grime: 0.5, streaks: 0.8, wet: 0.5, height: 1 }); m.userData.density = 1;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 1.5), m); mesh.receiveShadow = true;
  return mesh;
}
// poster in a cast-iron glazed display case (frame merged into the builder; poster plane returned)
export function posterCase(F, M, scene, x, y, z, i, seed, w = 1.25) {
  const h = w * 1.5;
  F.box(M.iron, x - w / 2 - 0.12, x + w / 2 + 0.12, y - h / 2 - 0.12, y + h / 2 + 0.12, z, z + 0.06);
  F.geo(M.iron, molding(P.sill(0.6), x - w / 2 - 0.2, x + w / 2 + 0.2, y + h / 2 + 0.1, z + 0.06));
  const p = poster(M, i, seed, w); p.position.copy(F.point(x, y, z + 0.075)); p.rotation.y = F.rotY; scene.add(p);
  const gl = new THREE.PlaneGeometry(w + 0.08, h + 0.08); gl.translate(x, y, z + 0.12); F.geo(M.glass, gl, 'keep');
}

// ---------------------------------------------------------------- bulbs
// Years on, about half the marquee bulbs still burn. Every lit chance is raised to at least this.
export const BULBS = { minLit: 0.45 };
// ctx.bulbs = [{ p: Vector3, lit }]; flushBulbs draws them as two instanced meshes
export function flushBulbs(scene, M, bulbs, r = 0.055) {
  const geo = new THREE.SphereGeometry(r, 8, 6), sock = new THREE.CylinderGeometry(r * 0.75, r * 0.8, r * 1.2, 8);
  const out = [];
  for (const lit of [false, true]) {
    const list = bulbs.filter((b) => !!b.lit === lit); if (!list.length) continue;
    const im = new THREE.InstancedMesh(geo, lit ? M.bulbLit : M.bulbDead, list.length);
    const m = new THREE.Matrix4(); list.forEach((b, i) => im.setMatrixAt(i, m.makeTranslation(b.p.x, b.p.y, b.p.z)));
    im.computeBoundingSphere(); scene.add(im); out.push(im);
  }
  const all = new THREE.InstancedMesh(sock, M.brass, bulbs.length); const m = new THREE.Matrix4();
  bulbs.forEach((b, i) => all.setMatrixAt(i, m.makeTranslation(b.p.x, b.p.y - r * 0.9, b.p.z))); all.computeBoundingSphere(); scene.add(all);
  return out;
}
// bulb-letter sign: letters sampled into a grid of bulbs on letter-shaped painted plates
export function bulbLetters(ctx, F, text, cx, cy, z, width, height, { plate, litChance = 0.08, step = 0.21, seed = 3 } = {}) {
  const { M, scene, bulbs } = ctx, r = rng(seed);
  const W = 1024, H = Math.round(1024 * height / width), [c, g] = canvas(W, H);
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `800 ${H * 0.92}px ${SERIF}`; const k = Math.min(1, (W * 0.96) / g.measureText(text).width);
  g.save(); g.translate(W / 2, H * 0.54); g.scale(k, 1); g.fillText(text, 0, 0); g.restore();
  const d = g.getImageData(0, 0, W, H).data, px = width / W;
  for (let yy = step / 2; yy < height; yy += step) for (let xx = step / 2; xx < width; xx += step) {
    const ix = Math.floor(xx / px), iy = Math.floor((height - yy) / px); if (d[(iy * W + ix) * 4] < 128) continue;
    bulbs.push({ p: F.point(cx - width / 2 + xx, cy - height / 2 + yy, z + 0.08), lit: r() < Math.max(litChance, BULBS.minLit) });
  }
  // letter plates: the same mask, dilated, cut out of a painted board
  const [pc, pg] = canvas(W, H); pg.fillStyle = '#000'; pg.fillRect(0, 0, W, H); pg.fillStyle = '#fff'; pg.strokeStyle = '#fff'; pg.lineWidth = H * 0.06; pg.lineJoin = 'round';
  pg.font = g.font; pg.textAlign = 'center'; pg.textBaseline = 'middle'; pg.save(); pg.translate(W / 2, H * 0.54); pg.scale(k, 1); pg.strokeText(text, 0, 0); pg.fillText(text, 0, 0); pg.restore();
  const pm = (plate || M.woodRed).clone(); pm.alphaMap = tex(pc, false); pm.alphaTest = 0.5; pm.side = THREE.DoubleSide; pm.onBeforeCompile = (plate || M.woodRed).onBeforeCompile; pm.customProgramCacheKey = (plate || M.woodRed).customProgramCacheKey;
  for (const dz of [0, -0.06]) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(width, height), pm); pl.position.copy(F.point(cx, cy, z + dz)); pl.rotation.y = F.rotY; pl.castShadow = true; scene.add(pl); }
}
// a row of bulbs along a local line
export function bulbRow(ctx, F, x0, y0, z0, x1, y1, z1, step = 0.32, litChance = 0.1, seed = 5) {
  const r = rng(seed), n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0, z1 - z0) / step));
  for (let i = 0; i <= n; i++) { const t = i / n; ctx.bulbs.push({ p: F.point(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z0 + (z1 - z0) * t), lit: r() < Math.max(litChance, BULBS.minLit) }); }
}

// ---------------------------------------------------------------- dead neon script
export function deadNeon(ctx, F, text, cx, cy, z, width, height, { color = '#5a1d18', glow = '#ff3b26', font = 'italic 700', lit = 0.0 } = {}) {
  const { M, scene } = ctx, W = 1024, H = Math.round(1024 * height / width), [c, g] = canvas(W, H);
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.strokeStyle = '#fff'; g.lineWidth = H * 0.07; g.lineCap = g.lineJoin = 'round';
  g.font = `${font} ${H * 0.8}px "Brush Script MT", "Lucida Handwriting", ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const k = Math.min(1, (W * 0.94) / g.measureText(text).width); g.save(); g.translate(W / 2, H * 0.55); g.scale(k, 1); g.strokeText(text, 0, 0); g.restore();
  const m = M.neonDead.clone(); m.color.set(color); m.emissive.set(glow); m.emissiveIntensity = lit; m.alphaMap = tex(c, false); m.alphaTest = 0.4; m.side = THREE.DoubleSide;
  const tube = new THREE.Mesh(new THREE.PlaneGeometry(width, height), m); tube.position.copy(F.point(cx, cy, z + 0.12)); tube.rotation.y = F.rotY; scene.add(tube);
  // standoff backing raceway
  F.box(M.iron, cx - width / 2, cx + width / 2, cy - 0.06, cy + 0.06, z, z + 0.1);
  return tube;
}

// ---------------------------------------------------------------- ticket kiosk + turnstile
// octagonal timber kiosk: green-painted panels, glazed upper sashes, copper bell roof with a finial
export function ticketKiosk(ctx, x, z, rot, { r = 1.15, collide = true } = {}) {
  const { B, M } = ctx, parts = { woodGreen: [], woodCream: [], glass: [], copper: [], brass: [], dark: [] };
  const seg = 8, ap = r * Math.cos(Math.PI / seg), side = 2 * r * Math.sin(Math.PI / seg);
  for (let k = 0; k < seg; k++) {
    const a = (k + 0.5) / seg * Math.PI * 2, ox = Math.sin(a) * ap, oz = Math.cos(a) * ap;
    const front = k === 0;
    const low = new THREE.BoxGeometry(side, 1.05, 0.08); low.translate(0, 0.62, 0); const up = new THREE.BoxGeometry(side, 0.3, 0.08); up.translate(0, 2.4, 0);
    const posts = new THREE.BoxGeometry(0.1, 2.3, 0.12); posts.translate(side / 2, 1.25, 0);
    const sash = new THREE.PlaneGeometry(side - 0.12, 1.0); sash.translate(0, 1.7, 0.02);
    const counter = new THREE.BoxGeometry(side + 0.1, 0.06, 0.32); counter.translate(0, 1.16, 0.14);
    for (const [g, key] of [[low, 'woodGreen'], [up, 'woodGreen'], [posts, 'woodCream'], [sash, front ? 'dark' : 'glass'], [counter, 'woodCream']]) { g.rotateY(a); g.translate(ox, 0, oz); parts[key].push(g); }
    if (front) for (let b = -2; b <= 2; b++) { const bar = new THREE.CylinderGeometry(0.012, 0.012, 1.0, 6); bar.translate(b * side / 6, 1.7, 0.05); bar.rotateY(a); bar.translate(ox, 0, oz); parts.brass.push(bar); }
  }
  const plinth = new THREE.CylinderGeometry(r + 0.1, r + 0.15, 0.12, seg); plinth.rotateY(Math.PI / seg); plinth.translate(0, 0.06, 0); parts.woodCream.push(plinth);
  const eave = new THREE.CylinderGeometry(r + 0.32, r + 0.32, 0.12, seg); eave.rotateY(Math.PI / seg); eave.translate(0, 2.6, 0); parts.woodCream.push(eave);
  const roof = lathe([[r + 0.35, 0], [r + 0.2, 0.18], [r * 0.7, 0.55], [r * 0.32, 0.95], [r * 0.18, 1.3], [0.12, 1.45], [0, 1.5]], seg); roof.rotateY(Math.PI / seg); roof.translate(0, 2.66, 0); parts.copper.push(roof);
  const fin = lathe([[0.08, 0], [0.12, 0.12], [0.04, 0.3], [0.09, 0.42], [0.02, 0.75], [0, 0.8]], 10); fin.translate(0, 4.15, 0); parts.brass.push(fin);
  const m = new THREE.Matrix4().makeRotationY(rot).setPosition(x, 0, z);
  for (const [k, list] of Object.entries(parts)) if (list.length) { const g = merge(list); g.applyMatrix4(m); B.add(M[k], g); }
  if (collide) B.col(x - r, x + r, 0, 2.7, z - r, z + r, { surface: 'wood' });
  return new THREE.Vector3(x + Math.sin(rot) * (ap + 0.05), 2.0, z + Math.cos(rot) * (ap + 0.05));
}
export function turnstile(ctx, x, z, rot) {
  const { B, M } = ctx, br = [], ir = [];
  const ped = lathe([[0.2, 0], [0.2, 0.08], [0.13, 0.14], [0.11, 0.85], [0.16, 0.9], [0.16, 1.0], [0, 1.0]], 14); ped.translate(0, 0, 0); ir.push(ped);
  const hub = new THREE.CylinderGeometry(0.09, 0.09, 0.22, 12); hub.rotateZ(0.5); hub.translate(0.08, 0.95, 0); br.push(hub);
  for (let k = 0; k < 3; k++) { const arm = new THREE.CylinderGeometry(0.025, 0.025, 0.62, 8); arm.translate(0, 0.31, 0); arm.rotateX(Math.PI / 2 + 0.2); arm.rotateZ(0.5); arm.rotateX(k * Math.PI * 2 / 3); arm.translate(0.12, 0.95, 0); br.push(arm); }
  const m = new THREE.Matrix4().makeRotationY(rot).setPosition(x, 0, z);
  B.add(M.brass, merge(br).applyMatrix4(m)); B.add(M.iron, merge(ir).applyMatrix4(m));
}
