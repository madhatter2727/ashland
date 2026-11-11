// The park kit: themed pieces that make Ashland read as an American theme park rather than formal grounds.
// Attraction-castle turrets (battered round towers, corbelled crenellations, flared shingle cones, one roof
// broken open), crenellated parapets, a cogwheel archivolt, gable roofs for the boardwalk lodges, torn park
// banners on iron poles, finger posts, a faded park map, popcorn carts. All original designs.
import * as THREE from 'three';
import { lathe, merge } from './kit.js';
import { paintedSign } from './signs.js';
import { mulberry } from '../../core/util.js';

// ---------- turrets and battlements ----------
export function turret(F, M, x, z, { r = 2.2, y0 = 0, h = 20, roofH = 9, wall = M.fauxStone, roof = M.shingleRed, broken = false, lean = 0, seed = 1 } = {}) {
  const rnd = mulberry(seed), parts = [], dark = [], trim = [];
  const body = lathe([[r * 1.14, 0], [r * 1.06, 1.4], [r, 2.0], [r, h - 1.6], [r + 0.08, h - 1.55], [r + 0.08, h - 1.35], [r, h - 1.3], [r, h - 1.0], [r + 0.42, h - 0.55], [r + 0.42, h], [0, h]], 24);
  parts.push(body);
  for (const yy of [h * 0.38, h * 0.68]) { const s = lathe([[r + 0.1, 0], [r + 0.12, 0.12], [r + 0.1, 0.24], [r, 0.26]], 24); s.translate(0, yy, 0); trim.push(s); }
  // merlons round the corbelled top
  const n = Math.max(8, Math.round(r * 5));
  for (let k = 0; k < n; k++) { if (k % 2) continue; const a = (k / n) * Math.PI * 2, m = new THREE.BoxGeometry(0.42, 0.85, (2 * Math.PI * (r + 0.3)) / n * 0.95); m.translate(r + 0.22, h + 0.42, 0); m.rotateY(a); parts.push(m); }
  // arrow slits and one lancet, facing out (+z)
  for (const [yy, ax] of [[h * 0.3, 0.2], [h * 0.55, -0.35], [h * 0.8, 0.5]]) { const s = new THREE.BoxGeometry(0.2, 1.1, 0.4); s.translate(0, yy, r - 0.12); s.rotateY(ax); dark.push(s); }
  const roofTop = h + 0.2;
  if (!broken) {
    const rf = lathe([[r + 0.75, 0], [r + 0.5, 0.25], [r * 0.7, roofH * 0.28], [0.08, roofH], [0, roofH]], 24); rf.translate(0, roofTop, 0); parts.push({ roof: rf });
    const fin = lathe([[0.12, 0], [0.18, 0.2], [0.06, 0.5], [0.14, 0.8], [0.02, 2.2], [0, 2.2]], 10); fin.translate(0, roofTop + roofH - 0.1, 0); trim.push({ gold: fin });
  } else { // roof stove in: a truncated cone, bare rafters to where the apex was
    const rf = lathe([[r + 0.75, 0], [r + 0.5, 0.25], [r * 0.7, roofH * 0.28], [r * 0.38, roofH * 0.55]], 24, Math.PI * 1.45); rf.translate(0, roofTop, 0); parts.push({ roof: rf });
    for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2, len = roofH * (0.6 + rnd() * 0.35), p0 = new THREE.Vector3(Math.cos(a) * (r + 0.3), roofTop + 0.2, Math.sin(a) * (r + 0.3)), p1 = new THREE.Vector3(0, roofTop + roofH, 0), d = p1.clone().sub(p0), L = d.length() * (0.55 + rnd() * 0.4);
      const g = new THREE.BoxGeometry(0.14, L, 0.14); g.translate(0, L / 2, 0); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())); g.translate(p0.x, p0.y, p0.z); dark.push({ wood: g }); }
  }
  const out = { wall: [], roof: [], dark: [], trim: [], gold: [], wood: [] };
  for (const p of parts) p.roof ? out.roof.push(p.roof) : out.wall.push(p);
  for (const p of dark) p.wood ? out.wood.push(p.wood) : out.dark.push(p);
  for (const p of trim) p.gold ? out.gold.push(p.gold) : out.trim.push(p);
  const xf = new THREE.Matrix4().makeTranslation(x, y0, z).multiply(new THREE.Matrix4().makeRotationZ(lean));
  const put = (mat, list) => { if (!list.length) return; const g = merge(list); g.applyMatrix4(xf); F.geo(mat, g); };
  put(wall, out.wall); put(roof, out.roof); put(M.dark, out.dark); put(M.woodCream, out.trim); put(M.gold, out.gold); put(M.boards, out.wood);
}

export function battlement(F, mat, x0, x1, y, z0, z1, { mw = 0.9, gap = 0.7, mh = 1.0, seed = 3 } = {}) {
  const rnd = mulberry(seed), g = [];
  for (let x = x0; x < x1 - mw * 0.5; x += mw + gap) { if (rnd() < 0.12) continue; const h = mh * (rnd() < 0.1 ? 0.45 : 1); const b = new THREE.BoxGeometry(Math.min(mw, x1 - x), h, z1 - z0); b.translate(x + Math.min(mw, x1 - x) / 2, y + h / 2, (z0 + z1) / 2); g.push(b); }
  if (g.length) F.geo(mat, merge(g));
}
export function corbels(F, mat, x0, x1, y, z, { step = 0.85, d = 0.55 } = {}) {
  const g = []; for (let x = x0 + step / 2; x < x1; x += step) { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(d, 0); s.lineTo(d, 0.5); s.quadraticCurveTo(0.2, 0.45, 0, -0.35); s.closePath(); const e = new THREE.ExtrudeGeometry(s, { depth: 0.32, bevelEnabled: false }); e.rotateY(-Math.PI / 2); e.translate(x + 0.16, y - 0.5, z); g.push(e); }
  F.geo(mat, merge(g));
}
// a great cogwheel arc around an arch: rim, spokes, teeth
export function cogArc(F, mat, cx, cy, z, r, { teeth = 26, a0 = 0, a1 = Math.PI } = {}) {
  const g = [], t = new THREE.TorusGeometry(r, 0.32, 8, 48, a1 - a0); t.rotateZ(a0); t.translate(cx, cy, z); g.push(t);
  const t2 = new THREE.TorusGeometry(r - 0.7, 0.14, 6, 40, a1 - a0); t2.rotateZ(a0); t2.translate(cx, cy, z); g.push(t2);
  for (let k = 0; k <= teeth; k++) { const a = a0 + (k / teeth) * (a1 - a0), b = new THREE.BoxGeometry(0.62, 0.55, 0.5); b.translate(0, r + 0.5, 0); b.rotateZ(a - Math.PI / 2); b.translate(cx, cy, z); g.push(b); }
  for (let k = 1; k < 6; k++) { const a = a0 + (k / 6) * (a1 - a0), b = new THREE.BoxGeometry(0.16, 0.7, 0.2); b.translate(0, r - 0.35, 0); b.rotateZ(a - Math.PI / 2); b.translate(cx, cy, z); g.push(b); }
  F.geo(mat, merge(g));
}

// ---------- lodge roofs ----------
// gable roof with its ridge along local x, eaves overhanging; and a front-facing cross gable with stick-work
export function gableRoof(F, mat, x0, x1, y, z0, z1, h, { over = 0.7 } = {}) {
  const s = new THREE.Shape(), d = z1 - z0; s.moveTo(-over, 0); s.lineTo(d / 2, h); s.lineTo(d + over, 0); s.lineTo(d + over, -0.22); s.lineTo(d / 2, h - 0.3); s.lineTo(-over, -0.22); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: x1 - x0 + over * 2, bevelEnabled: false }); g.rotateY(-Math.PI / 2); g.translate(x1 + over, y, z0); F.geo(mat, g);
  // gable end walls
  const w = new THREE.Shape(); w.moveTo(0, 0); w.lineTo(d / 2, h - 0.25); w.lineTo(d, 0); w.closePath();
  return w;
}
export function crossGable(F, M, roofMat, wallMat, trimMat, cx, w, y, h, z0, z1, { over = 0.6 } = {}) {
  const s = new THREE.Shape(); s.moveTo(-w / 2 - over, -0.25); s.lineTo(0, h + 0.1); s.lineTo(w / 2 + over, -0.25); s.lineTo(w / 2 + over, -0.5); s.lineTo(0, h - 0.18); s.lineTo(-w / 2 - over, -0.5); s.closePath();
  const r = new THREE.ExtrudeGeometry(s, { depth: z1 - z0 + over, bevelEnabled: false }); r.translate(cx, y, z0); F.geo(roofMat, r);
  const t = new THREE.Shape(); t.moveTo(-w / 2, 0); t.lineTo(0, h - 0.3); t.lineTo(w / 2, 0); t.closePath();
  const tw = new THREE.ExtrudeGeometry(t, { depth: 0.2, bevelEnabled: false }); tw.translate(cx, y, z1 - 0.2); F.geo(wallMat, tw);
  // stick-work: king post, collar, braces, a round vent
  const g = [];
  const kp = new THREE.BoxGeometry(0.14, h - 0.5, 0.1); kp.translate(cx, y + (h - 0.5) / 2, z1 + 0.02); g.push(kp);
  const col = new THREE.BoxGeometry(w * 0.55, 0.14, 0.1); col.translate(cx, y + h * 0.45, z1 + 0.02); g.push(col);
  for (const sx of [-1, 1]) { const b = new THREE.BoxGeometry(0.12, h * 0.55, 0.1); b.rotateZ(sx * 0.75); b.translate(cx + sx * w * 0.16, y + h * 0.22, z1 + 0.02); g.push(b); }
  const bb = new THREE.BoxGeometry(w + 0.2, 0.2, 0.14); bb.translate(cx, y + 0.05, z1 + 0.04); g.push(bb);
  F.geo(trimMat, merge(g));
  const v = new THREE.CircleGeometry(0.42, 20); v.translate(cx, y + h * 0.62, z1 + 0.06); F.geo(M.dark, v, 'keep');
}

// ---------- signage and street furniture ----------
const texCache = new Map();
function bannerTex(i) {
  if (texCache.has('b' + i)) return texCache.get('b' + i);
  const c = document.createElement('canvas'); c.width = 256; c.height = 768; const g = c.getContext('2d'), r = mulberry(i * 31 + 7);
  const cols = [['#d2402f', '#f6d36a'], ['#2f63c4', '#f6e3a8'], ['#f2c14e', '#a8262a'], ['#d65a7e', '#fff3d6']][i % 4];
  g.fillStyle = cols[0]; g.fillRect(0, 0, 256, 768);
  g.fillStyle = cols[1]; g.fillRect(0, 0, 256, 34); g.fillRect(14, 50, 228, 6); g.fillRect(14, 600, 228, 6);
  g.save(); g.translate(128, 200); g.fillStyle = cols[1]; g.beginPath(); for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2 - Math.PI / 2, rr = k % 2 ? 26 : 62; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); g.restore();
  g.fillStyle = cols[1]; g.font = '700 54px "Playfair Display", Georgia, serif'; g.textAlign = 'center';
  [...'ASHLAND'].forEach((ch, k) => g.fillText(ch, 128, 320 + k * 40 * 0.95 * 1.1));
  // fade, mildew, rain streaks
  // sun-bleached, water-stained, mildew
  g.fillStyle = 'rgba(235,228,210,0.32)'; g.fillRect(0, 0, 256, 768);
  for (let k = 0; k < 700; k++) { g.fillStyle = `rgba(${r() < 0.5 ? '240,232,212' : '40,34,24'},${r() * 0.1})`; g.fillRect(r() * 256, r() * 768, 2 + r() * 10, 6 + r() * 60); }
  // torn bottom edge and a rip: cut with destination-out
  // swallowtail hem, and on every other banner a ragged tear
  g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.moveTo(0, 768); g.lineTo(128, 680); g.lineTo(256, 768); g.closePath(); g.fill();
  if (i % 2) { g.beginPath(); g.moveTo(0, 768); for (let x = 0; x <= 256; x += 16) g.lineTo(x, 600 + r() * 140); g.lineTo(256, 768); g.closePath(); g.fill(); g.beginPath(); g.moveTo(150, 768); g.lineTo(168, 420); g.lineTo(186, 768); g.fill(); }
  g.globalCompositeOperation = 'source-over';
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; texCache.set('b' + i, t); return t;
}
export function bannerPole(ctx, x, z, i, { h = 6.2 } = {}) {
  const { B, M, scene } = ctx;
  const pole = merge([lathe([[0.14, 0], [0.12, 0.3], [0.08, 0.5], [0.07, h], [0, h]], 12), lathe([[0.1, 0], [0.13, 0.12], [0.02, 0.6], [0, 0.6]], 10).translate(0, h, 0)]); pole.translate(x, 0, z); B.add(M.iron, pole);
  const arms = []; for (const yy of [h - 0.4, h - 3.4]) { const a = new THREE.CylinderGeometry(0.03, 0.03, 1.5, 6); a.rotateZ(Math.PI / 2); a.translate(x, yy, z); arms.push(a); } B.add(M.iron, merge(arms));
  B.col(x - 0.15, x + 0.15, 0, h, z - 0.15, z + 0.15);
  const m = new THREE.MeshStandardMaterial({ map: bannerTex(i), roughness: 0.9, side: THREE.DoubleSide, alphaTest: 0.5 });
  for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 1.86, 1, 4), m); const pa = p.geometry.attributes.position; for (let k = 0; k < pa.count; k++) pa.setZ(k, Math.sin(pa.getY(k) * 2.5 + sx) * 0.05); p.geometry.computeVertexNormals(); p.position.set(x + sx * 0.42, h - 0.4 - 0.95, z); p.rotation.set(0, Math.PI / 2 + (sx < 0 ? 0.25 : -0.15), sx * 0.02); scene.add(p); }
}
export function fingerPost(ctx, x, z, signs) {
  const { B, M, scene, rr } = ctx;
  const p = merge([new THREE.BoxGeometry(0.18, 3.6, 0.18).translate(0, 1.8, 0), lathe([[0.16, 0], [0.16, 0.12], [0.03, 0.4], [0, 0.4]], 8).translate(0, 3.6, 0)]); p.translate(x, 0, z); B.add(M.woodCream, p);
  B.col(x - 0.15, x + 0.15, 0, 3.2, z - 0.15, z + 0.15);
  signs.forEach(([text, ang, bg], k) => {
    const w = 1.5, sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(w, 0); sh.lineTo(w + 0.22, 0.14); sh.lineTo(w, 0.28); sh.lineTo(0, 0.28); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: false }); g.translate(0.1, -0.14, -0.025); g.rotateZ((rr() - 0.5) * 0.12 + (k === 2 ? -0.25 : 0)); g.rotateY(ang); g.translate(x, 3.1 - k * 0.42, z); B.add(M.woodRed, g);
    const tex = paintedSign(text, { bg, fg: '#ecd9a6', w: 1024, h: 192 }), mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 });
    for (const side of [1, -1]) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.1, 0.24), mat); pl.position.set(0.1 + w / 2, 0, side * 0.03); if (side < 0) pl.rotation.y = Math.PI; const o = new THREE.Object3D(); o.add(pl); o.rotation.y = ang; o.position.set(x, 3.1 - k * 0.42, z); scene.add(o); }
  });
}
function mapTex() {
  const c = document.createElement('canvas'); c.width = 1536; c.height = 1024; const g = c.getContext('2d'), r = mulberry(99);
  g.fillStyle = '#f3e6c4'; g.fillRect(0, 0, 1536, 1024);
  g.fillStyle = '#5a1a14'; g.fillRect(0, 0, 1536, 120); g.fillStyle = '#e8cf8a'; g.font = '700 84px "Playfair Display", Georgia, serif'; g.textAlign = 'center'; g.fillText('ASHLAND  ·  PARK GUIDE', 768, 88);
  g.fillStyle = '#9fcf7c'; g.fillRect(120, 180, 1296, 760);
  const blob = (x, y, w, h, col, t) => { g.fillStyle = col; g.fillRect(x, y, w, h); g.strokeStyle = '#3a2a1c'; g.lineWidth = 4; g.strokeRect(x, y, w, h); g.fillStyle = '#2a1c12'; g.font = '700 34px Georgia, serif'; g.fillText(t, x + w / 2, y + h / 2 + 12); };
  g.strokeStyle = '#e9dcb8'; g.lineWidth = 46; g.beginPath(); g.moveTo(768, 940); g.lineTo(768, 520); g.lineTo(320, 520); g.moveTo(768, 520); g.lineTo(1220, 520); g.moveTo(768, 520); g.lineTo(768, 260); g.stroke();
  blob(560, 190, 416, 90, '#6f9ae0', 'ASHLAND CASTLE'); blob(150, 380, 230, 280, '#5f8f78', 'GARDENS'); blob(1150, 330, 240, 380, '#c99a2e', 'MIDWAY');
  blob(620, 850, 296, 80, '#a8473a', 'MAIN GATE'); blob(1300, 190, 110, 120, '#7a3a2a', 'IRON COMET'); blob(126, 190, 150, 110, '#3b6e6a', 'GRAND WHEEL');
  blob(860, 600, 220, 70, '#d8c08a', 'CAROUSEL'); blob(420, 760, 200, 70, '#d8c08a', 'SKY SWINGS'); blob(380, 190, 150, 80, '#d8c08a', 'THE PLUMMET');
  g.fillStyle = '#b3201a'; g.beginPath(); g.arc(768, 760, 20, 0, 7); g.fill(); g.font = 'italic 700 30px Georgia'; g.fillText('YOU ARE HERE', 768, 810);
  g.fillStyle = 'rgba(240,230,205,0.22)'; g.fillRect(0, 0, 1536, 1024);
  for (let k = 0; k < 18; k++) { const x = r() * 1536, y = r() * 1024; g.fillStyle = `rgba(${150 + r() * 30},${135 + r() * 25},${110},0.85)`; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 8; j++) g.lineTo(x + (r() - 0.5) * 110, y + (r() - 0.5) * 70); g.fill(); }
  for (let k = 0; k < 1600; k++) { g.fillStyle = `rgba(${r() < 0.6 ? '60,40,20' : '240,230,200'},${r() * 0.08})`; const s = 4 + r() * 40; g.fillRect(r() * 1536, r() * 1024, s, s * (0.4 + r())); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
export function parkMap(ctx, x, z, rot) {
  const { B, M, scene } = ctx;
  const w = 3.3, h = 2.2, y0 = 1.0, F = { m: new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot), new THREE.Vector3(1, 1, 1)) };
  const add = (mat, g) => { g.applyMatrix4(F.m); B.add(mat, g); };
  add(M.woodGreen, merge([new THREE.BoxGeometry(w + 0.5, 0.25, 0.3).translate(0, y0 - 0.12, 0), new THREE.BoxGeometry(w + 0.5, 0.25, 0.3).translate(0, y0 + h + 0.12, 0), new THREE.BoxGeometry(0.25, h, 0.3).translate(-w / 2 - 0.12, y0 + h / 2, 0), new THREE.BoxGeometry(0.25, h, 0.3).translate(w / 2 + 0.12, y0 + h / 2, 0)]));
  add(M.woodCream, merge([new THREE.BoxGeometry(0.22, y0 + h + 0.8, 0.22).translate(-w / 2 - 0.1, (y0 + h + 0.8) / 2, -0.2), new THREE.BoxGeometry(0.22, y0 + h + 0.8, 0.22).translate(w / 2 + 0.1, (y0 + h + 0.8) / 2, -0.2), new THREE.BoxGeometry(w, h, 0.06).translate(0, y0 + h / 2, -0.12)]));
  const cap = new THREE.Shape(); cap.moveTo(-w / 2 - 0.5, 0); cap.lineTo(w / 2 + 0.5, 0); cap.lineTo(w / 2 + 0.3, 0.2); cap.quadraticCurveTo(0, 0.95, -w / 2 - 0.3, 0.2); cap.closePath();
  add(M.woodRed, new THREE.ExtrudeGeometry(cap, { depth: 0.4, bevelEnabled: false }).translate(0, y0 + h + 0.25, -0.2));
  const c = new THREE.Vector3(x, 0, z), half = new THREE.Vector3(w / 2 + 0.3, 0, 0.35).applyAxisAngle(new THREE.Vector3(0, 1, 0), rot);
  B.col(c.x - Math.abs(half.x) - 0.1, c.x + Math.abs(half.x) + 0.1, 0, y0 + h + 0.6, c.z - Math.abs(half.z) - 0.1, c.z + Math.abs(half.z) + 0.1);
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: mapTex(), roughness: 0.75, alphaTest: 0.5 }));
  pl.position.set(0, y0 + h / 2, -0.07); pl.applyMatrix4(F.m); scene.add(pl);
}
export function popcornCart(ctx, x, z, rot, seed = 1, { tipped = false } = {}) {
  const { B, M, rr } = ctx;
  const m = new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot), new THREE.Vector3(1, 1, 1));
  // knocked over onto its side (visual only: the cover box below is unchanged)
  if (tipped) m.multiply(new THREE.Matrix4().makeTranslation(0, 0.5, 0)).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2 + 0.06));
  const add = (mat, list) => { const g = merge(list); g.applyMatrix4(m); B.add(mat, g); };
  const L = 1.7, W = 0.9;
  add(seed % 2 ? M.woodRed : M.woodYellow, [new THREE.BoxGeometry(L, 0.7, W).translate(0, 0.75, 0)]);
  add(M.woodCream, [new THREE.BoxGeometry(L + 0.08, 0.08, W + 0.08).translate(0, 1.12, 0), new THREE.BoxGeometry(L + 0.08, 0.06, W + 0.08).translate(0, 0.42, 0)]);
  add(M.glass, [new THREE.BoxGeometry(1.0, 0.75, 0.7).translate(-0.2, 1.55, 0)]);
  add(M.brass, [new THREE.BoxGeometry(1.06, 0.06, 0.76).translate(-0.2, 1.17, 0), new THREE.BoxGeometry(1.06, 0.06, 0.76).translate(-0.2, 1.94, 0),
    ...[[-0.71, -0.36], [0.31, -0.36], [-0.71, 0.36], [0.31, 0.36]].map(([a, b]) => new THREE.BoxGeometry(0.05, 0.8, 0.05).translate(a, 1.55, b)),
    ...[[-0.8, -0.4], [0.8, -0.4], [-0.8, 0.4], [0.8, 0.4]].map(([a, b]) => new THREE.CylinderGeometry(0.025, 0.025, 1.1, 6).translate(a, 2.2, b)),
    lathe([[0.06, 0], [0.09, 0.08], [0.02, 0.3], [0, 0.3]], 8).translate(0, 3.1, 0)]);
  const roof = new THREE.ConeGeometry(1.25, 0.55, 4, 1); roof.rotateY(Math.PI / 4); roof.scale(1, 1, 0.62); roof.translate(0, 3.0, 0); add(seed % 2 ? M.woodYellow : M.woodRed, [roof]);
  // corn: a heap in the case, gone grey
  const corn = []; for (let k = 0; k < 90; k++) { const s = new THREE.IcosahedronGeometry(0.022 + rr() * 0.014, 0); s.scale(1, 0.75 + rr() * 0.4, 1 + rr() * 0.3); s.translate(-0.2 + (rr() - 0.5) * 0.85, 1.2 + rr() * 0.1 * (1 - Math.abs(rr() - 0.5)), (rr() - 0.5) * 0.6); corn.push(s); } add(M.popcorn, corn);
  const wheels = []; for (const sx of [-1, 1]) { const w = new THREE.TorusGeometry(0.36, 0.035, 6, 20); w.translate(0.45, 0.38, sx * 0.48); wheels.push(w); for (let k = 0; k < 6; k++) { const s = new THREE.BoxGeometry(0.02, 0.7, 0.02); s.rotateZ((k / 6) * Math.PI); s.translate(0.45, 0.38, sx * 0.48); wheels.push(s); } }
  wheels.push(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 6).translate(-0.7, 0.2, 0)); add(M.iron, wheels);
  const c = new THREE.Vector3(L / 2 + 0.1, 0, W / 2 + 0.1).applyAxisAngle(new THREE.Vector3(0, 1, 0), rot);
  B.col(x - Math.abs(c.x), x + Math.abs(c.x), 0, 1.15, z - Math.abs(c.z), z + Math.abs(c.z));
}
