// Classical facade generator shared by the palace, the esplanade hotels and the ticket palace.
// A storey = one extruded wall slab with real arched / cambered openings (so reveals have depth), moulded
// surrounds + keystones, sills, optional pediments and balconettes, pilasters between bays, a string course,
// and a fill per opening (dark glazing with interior, closed or hanging shutters, boarded up, or a void).
import * as THREE from 'three';
import { P, molding, wallWithOpenings, archSurround, keystone, pediment, pilaster, balustrade, ironRailing, archPath, merge } from './kit.js';

export function storey(F, M, rr, x0, x1, s) {
  const { y0, y1 } = s, bay = s.bay, n = Math.max(1, Math.round((x1 - x0) / bay)), bw = (x1 - x0) / n;
  const ops = [];
  for (let i = 0; i < n; i++) {
    if (s.skip && s.skip(i, n)) continue;
    const cx = x0 + bw * (i + 0.5), w = s.win.w;
    ops.push({ i, cx, x0: cx - w / 2, x1: cx + w / 2, y0: y0 + s.win.sill, spring: y0 + s.win.spring, seg: s.win.seg || 0 });
  }
  const t = s.thick ?? 0.45;
  F.geo(s.mat, wallWithOpenings(x0, x1, y0, y1, ops, t));
  // dark rooms behind
  const ip = new THREE.PlaneGeometry(x1 - x0, y1 - y0); ip.translate((x0 + x1) / 2, (y0 + y1) / 2, -t - 0.02); F.geo(M.interior, ip, 'keep');
  for (const o of ops) {
    const w = o.x1 - o.x0, top = o.spring + (o.seg ? o.seg : w / 2);
    if (s.surround) F.geo(s.surround, archSurround(o.x0, o.x1, o.y0, o.spring, { w: 0.16, d: 0.07, seg: o.seg }));
    if (s.keystone) F.geo(s.keystone, keystone(o.cx, top - 0.06, 0.46, 0.22, 0.32, 0.16));
    if (s.sill) F.geo(s.sill, molding(P.sill(1.2), o.x0 - 0.22, o.x1 + 0.22, o.y0 - 0.14, 0));
    if (s.pediment) F.geo(s.pediment, pediment(o.cx, top + 0.32, w + 0.9, { h: 0.55, d: 0.24, round: o.i % 2 === 1 }));
    if (s.pediment) F.geo(s.pediment, molding(P.string(1), o.x0 - 0.42, o.x1 + 0.42, top + 0.16, 0));
    if (s.balconette) {
      const b = balustrade(w + 0.7, { h: 0.95, pitch: 0.24 }); b.translate(o.cx, o.y0 + 0.02, 0.32); F.geo(s.balconette, b);
      const slab = new THREE.BoxGeometry(w + 0.9, 0.16, 0.62); slab.translate(o.cx, o.y0 - 0.06, 0.28); F.geo(s.balconette, slab);
      for (const sx of [-1, 1]) { const c = new THREE.BoxGeometry(0.16, 0.34, 0.5); c.translate(o.cx + sx * (w / 2 + 0.2), o.y0 - 0.3, 0.22); F.geo(s.balconette, c); }
    }
    if (s.ironBalcony) {
      const r = ironRailing(w + 0.9, 1.0, 0.12); r.translate(o.cx, o.y0, 0.62); F.geo(M.iron, r);
      const slab = new THREE.BoxGeometry(w + 1.0, 0.1, 0.66); slab.translate(o.cx, o.y0 - 0.05, 0.31); F.geo(s.ironBalconySlab || s.mat, slab);
    }
    fill(F, M, rr, o, s, t);
  }
  if (s.pilasters) for (let i = 0; i <= n; i++) {
    const g = pilaster(y1 - y0 - (s.pilasterTrim ?? 0), s.pilasters.w ?? 0.5, s.pilasters.d ?? 0.18); g.translate(x0 + bw * i, y0, 0); F.geo(s.pilasters.mat, g);
  }
  if (s.course) F.geo(s.course.mat, molding(s.course.profile || P.string(1.2), x0 - 0.2, x1 + 0.2, y1 - 0.12, 0));
  return { ops, bw, n };
}

// what sits in an opening
function fill(F, M, rr, o, s, t) {
  const w = o.x1 - o.x0, kinds = s.fills || ['glass'];
  const kind = kinds[Math.floor(rr() * kinds.length)];
  const z = -t * 0.55;
  const outline = (inset = 0) => { const sh = new THREE.Shape(); archPath(sh, o.x0 + inset, o.x1 - inset, o.y0 + inset * 0.5, o.spring, o.seg, true); return sh; };
  if (kind === 'glass' || kind === 'broken') {
    const fr = s.frame || M.iron;
    // frame + glazing bars
    const ring = outline(0); ring.holes.push(archPath(new THREE.Path(), o.x0 + 0.07, o.x1 - 0.07, o.y0 + 0.07, o.spring, o.seg, false));
    F.geo(fr, new THREE.ExtrudeGeometry(ring, { depth: 0.06, bevelEnabled: false, curveSegments: 12 }).translate(0, 0, z));
    const bars = [];
    const top = o.spring + (o.seg ? o.seg : w / 2);
    for (const fx of [0.5]) { const b = new THREE.BoxGeometry(0.045, top - o.y0, 0.05); b.translate(o.x0 + w * fx, (o.y0 + top) / 2, z + 0.03); bars.push(b); }
    for (let yy = o.y0 + 0.75; yy < o.spring; yy += 0.75) { const b = new THREE.BoxGeometry(w, 0.04, 0.05); b.translate(o.cx, yy, z + 0.03); bars.push(b); }
    F.geo(fr, merge(bars));
    if (kind === 'glass') { const gl = new THREE.ShapeGeometry(outline(0.05), 12); gl.translate(0, 0, z + 0.01); F.geo(M.glass, gl, 'keep'); }
    else if (rr() < 0.6) { // jagged remnant of glass in the lower panes
      const sh = new THREE.Shape([new THREE.Vector2(o.x0 + 0.06, o.y0 + 0.06), new THREE.Vector2(o.x1 - 0.06, o.y0 + 0.06), new THREE.Vector2(o.x1 - 0.06, o.y0 + 0.5 + rr() * 0.6), new THREE.Vector2(o.cx + rr() * 0.3, o.y0 + 0.2 + rr() * 0.3), new THREE.Vector2(o.x0 + 0.06, o.y0 + 0.7 + rr() * 0.5)]);
      F.geo(M.glass, new THREE.ShapeGeometry(sh).translate(0, 0, z + 0.01), 'keep');
    }
  } else if (kind === 'shutter' || kind === 'hanging') {
    const top = o.spring, hw = w / 2 - 0.02, h = top - o.y0 - 0.04;
    for (const sd of [-1, 1]) {
      const g = [];
      const leaf = new THREE.BoxGeometry(hw, h, 0.05); g.push(leaf);
      for (let yy = -h / 2 + 0.12; yy < h / 2 - 0.1; yy += 0.11) { const l = new THREE.BoxGeometry(hw - 0.12, 0.07, 0.03); l.rotateX(-0.5); l.translate(0, yy, 0.03); g.push(l); }
      for (const ex of [-1, 1]) { const st = new THREE.BoxGeometry(0.07, h, 0.07); st.translate(ex * (hw / 2 - 0.035), 0, 0.01); g.push(st); }
      const lg = merge(g);
      if (kind === 'hanging' && sd === 1) { lg.translate(-hw / 2, 0, 0); lg.rotateZ(-0.25 - rr() * 0.3); lg.rotateY(0.9 + rr() * 0.4); lg.translate(o.cx + w / 2 + 0.05, o.y0 + h / 2 - 0.2, 0.05); }
      else lg.translate(o.cx + sd * hw / 2, o.y0 + 0.02 + h / 2, z + 0.06);
      F.geo(s.shutterMat || M.shutter, lg);
    }
    if (o.spring < o.y0 + 9 && !o.seg) { const fan = new THREE.ShapeGeometry((() => { const sh = new THREE.Shape(); sh.moveTo(o.x0, o.spring); for (let i = 0; i <= 12; i++) { const a = Math.PI - (i / 12) * Math.PI; sh.lineTo(o.cx + Math.cos(a) * w / 2, o.spring + Math.sin(a) * w / 2); } sh.closePath(); return sh; })()); fan.translate(0, 0, z); F.geo(M.dark, fan, 'keep'); }
  } else if (kind === 'plywood') { // a sheet of weathered plywood nailed over the opening
    const top = o.spring + (o.seg || (w / 2)) * 0.9, sh = new THREE.BoxGeometry(w + 0.3, top - o.y0 + 0.2, 0.03);
    sh.rotateZ((rr() - 0.5) * 0.04); sh.translate(o.cx, (o.y0 + top) / 2, 0.035); F.geo(M.plywood, sh);
  } else if (kind === 'boards') {
    const top = o.spring + (o.seg || 0) * 0.5;
    for (let k = 0; k < 4; k++) {
      const y = o.y0 + 0.3 + k * (top - o.y0 - 0.4) / 3.5, b = new THREE.BoxGeometry(w + 0.35, 0.22, 0.04);
      b.rotateZ((rr() - 0.5) * 0.35); b.translate(o.cx, y, 0.04); F.geo(M.boards, b);
    }
  }
}

// parapet balustrade with pedestals and urns along x0..x1 at height y
export function parapet(F, M, x0, x1, y, { pedestal = 4, mat, urns = [] } = {}) {
  const n = Math.max(1, Math.round((x1 - x0) / pedestal)), step = (x1 - x0) / n;
  for (let i = 0; i < n; i++) { const b = balustrade(step - 0.55, { h: 1.0, pitch: 0.3 }); b.translate(x0 + step * (i + 0.5), y, -0.15); F.geo(mat, b); }
  for (let i = 0; i <= n; i++) {
    const x = x0 + step * i, g = new THREE.BoxGeometry(0.55, 1.15, 0.55); g.translate(x, y + 0.575, -0.15); F.geo(mat, g);
    const cap = new THREE.BoxGeometry(0.68, 0.1, 0.68); cap.translate(x, y + 1.2, -0.15); F.geo(mat, cap);
    urns.push(F.point(x, y + 1.25, -0.15));
  }
  return urns;
}
