// The park beyond the walls: the coaster's steel skeleton (lift hill, first drop, a vertical loop, a helix
// and camelbacks on forest-green lattice bents, oxblood track, one span collapsed and hanging), a ring of
// dead woods, and far towers of the park lost in the rain haze. Visual only: nothing here can be boarded,
// nothing moves, nothing spawns on it.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry } from '../core/util.js';
import { deadTree, merge, lathe, dome } from './park/kit.js';

export const SKY_NIGHT = { value: 0 }; // kept for nightfall.js (the haze is plain scene fog now)

function coasterPath() {
  const V = (x, y, z) => new THREE.Vector3(x, y, z), pts = [];
  pts.push(V(60, 3.5, 50), V(60, 3.5, 40), V(60, 4, 30), V(60, 7, 22));
  for (let k = 0; k <= 6; k++) pts.push(V(60, 10 + k * 6, 16 - k * 6.5)); // lift hill
  pts.push(V(60, 48.5, -30), V(59.5, 47.5, -35), V(58, 40, -41), V(55, 24, -47), V(52, 9, -53), V(55, 5, -59), V(62, 4.5, -62));
  const c = V(74, 17, -63), r = 12.5;
  for (let k = 0; k <= 24; k++) { const t = (k / 24) * Math.PI * 2; pts.push(V(c.x + Math.sin(t) * r, c.y - Math.cos(t) * r, c.z + (k / 24) * 5)); }
  pts.push(V(88, 4.5, -57), V(98, 7, -52), V(106, 14, -40), V(104, 20, -26), V(96, 25, -18), V(86, 27, -20), V(80, 25, -30), V(84, 21, -40), V(94, 18, -38), V(100, 14, -26));
  pts.push(V(98, 9, -12), V(92, 20, 0), V(88, 8, 12), V(86, 22, 24), V(82, 7, 36), V(76, 9, 50), V(68, 5, 58), V(61, 3.5, 56));
  return new THREE.CatmullRomCurve3(pts, true, 'centripetal', 0.5);
}

export function buildSkyline(scene, M) {
  const group = new THREE.Group(); scene.add(group);
  const curve = coasterPath(), L = curve.getLength(), N = Math.round(L / 0.9);
  const P = [], T = [], Lat = [], U = [];
  let lat = new THREE.Vector3(1, 0, 0);
  for (let i = 0; i <= N; i++) {
    const u = i / N, p = curve.getPointAt(u), t = curve.getTangentAt(u).normalize();
    if (i === 0) lat.crossVectors(t, new THREE.Vector3(0, 1, 0)).normalize();
    lat.addScaledVector(t, -lat.dot(t)).normalize(); // parallel transport through the loop
    // ease back toward level banking where the track is not inverted
    const flat = new THREE.Vector3().crossVectors(t, new THREE.Vector3(0, 1, 0));
    if (flat.lengthSq() > 0.05 && Math.abs(t.y) < 0.6) { flat.normalize(); if (flat.dot(lat) < 0) flat.negate(); lat.lerp(flat, 0.08).addScaledVector(t, -lat.dot(t)).normalize(); }
    P.push(p); T.push(t); Lat.push(lat.clone()); U.push(new THREE.Vector3().crossVectors(lat, t).normalize());
  }
  const gap = [0.705, 0.722]; // a span has fallen out of the helix
  const inGap = (u) => u > gap[0] && u < gap[1];
  const track = [], ties = [], spine = [], bents = [];
  const offsetTube = (off, up, r, seg) => {
    let run = [];
    const flush = () => { if (run.length > 3) track.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(run), run.length * 2, r, seg)); run = []; };
    for (let i = 0; i <= N; i++) { if (inGap(i / N)) { flush(); continue; } run.push(P[i].clone().addScaledVector(Lat[i], off).addScaledVector(U[i], up)); }
    flush();
  };
  offsetTube(0.62, 0, 0.075, 6); offsetTube(-0.62, 0, 0.075, 6);
  const spineStart = track.length; offsetTube(0, -0.55, 0.26, 8);
  for (let k = spineStart; k < track.length; k++) spine.push(track[k]); track.length = spineStart;
  const mtx = new THREE.Matrix4(), tieGeo = new THREE.BoxGeometry(1.5, 0.12, 0.16);
  for (let i = 0; i <= N; i += 2) {
    if (inGap(i / N)) continue;
    const b = new THREE.Matrix4().makeBasis(Lat[i], U[i], T[i]).setPosition(P[i].clone().addScaledVector(U[i], -0.2));
    const g = tieGeo.clone().applyMatrix4(b); ties.push(g);
    const br = new THREE.BoxGeometry(0.08, 0.5, 0.08); br.translate(0.4, -0.35, 0); br.rotateZ(0.6); br.applyMatrix4(b); ties.push(br);
    const br2 = new THREE.BoxGeometry(0.08, 0.5, 0.08); br2.translate(-0.4, -0.35, 0); br2.rotateZ(-0.6); br2.applyMatrix4(b); ties.push(br2);
  }
  // lattice bents: two legs splayed from the spine to footings, X-braced every 4 m
  const legGeo = (a, b, r) => { const d = new THREE.Vector3().subVectors(b, a), len = d.length(); const g = new THREE.CylinderGeometry(r, r, len, 6); g.translate(0, len / 2, 0); g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()))); g.translate(a.x, a.y, a.z); return g; };
  let last = -99;
  const loopU = [0.0, 0.0]; // detect the loop span by curvature of up vector
  for (let i = 0; i <= N; i++) {
    const u = i / N, p = P[i];
    if (inGap(u) || p.y < 2.5 || U[i].y < 0.6 || (i - last) * 0.9 < 7.5) continue;
    last = i;
    const side = new THREE.Vector3(Lat[i].x, 0, Lat[i].z).normalize(), top = p.clone().addScaledVector(U[i], -0.8);
    const spread = 1.2 + p.y * 0.06;
    const fa = new THREE.Vector3(p.x, 0, p.z).addScaledVector(side, spread), fb = new THREE.Vector3(p.x, 0, p.z).addScaledVector(side, -spread);
    const ta = top.clone().addScaledVector(side, 0.5), tb = top.clone().addScaledVector(side, -0.5);
    bents.push(legGeo(fa, ta, 0.16), legGeo(fb, tb, 0.16), legGeo(ta, tb, 0.12));
    for (let y = 4; y < top.y - 1; y += 4) {
      const k0 = y / top.y, k1 = Math.min(1, (y + 4) / top.y);
      const a0 = fa.clone().lerp(ta, k0), b0 = fb.clone().lerp(tb, k0), a1 = fa.clone().lerp(ta, k1), b1 = fb.clone().lerp(tb, k1);
      bents.push(legGeo(a0, b1, 0.06), legGeo(b0, a1, 0.06), legGeo(a0, b0, 0.07));
    }
    for (const f of [fa, fb]) { const ft = new THREE.CylinderGeometry(0.45, 0.6, 0.6, 8); ft.translate(f.x, 0.3, f.z); bents.push(ft); }
  }
  // the loop stands on a ring of A-frames at its sides
  for (const z of [-66, -56]) for (const x of [61, 87]) { const a = new THREE.Vector3(x, 0, z), b = new THREE.Vector3(x + (x < 70 ? 1 : -1) * 0.5, 17, z < -60 ? -63 : -60); bents.push(legGeo(a, b, 0.22)); }
  // the fallen span: a twisted length of track hanging from the break, its end on the ground
  const g0 = Math.floor(gap[0] * N), g1 = Math.ceil(gap[1] * N), A0 = P[g0], A1 = P[g1];
  const hang = new THREE.CatmullRomCurve3([A0.clone(), A0.clone().lerp(A1, 0.25).setY(A0.y - 6), A0.clone().lerp(A1, 0.6).setY(5), A0.clone().lerp(A1, 0.85).setY(0.4)]);
  for (const o of [-0.62, 0.62]) track.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hang.getPoints(20).map((q, i) => q.clone().add(new THREE.Vector3(0, 0, o + Math.sin(i * 0.4) * 0.3)))), 30, 0.075, 6));
  spine.push(new THREE.TubeGeometry(hang, 30, 0.24, 8));

  const coasterRed = M.coasterRed, bentMat = M.ironGreen;
  const add = (geos, mat) => { if (!geos.length) return 0; const g = mergeGeometries(geos.map((x) => { x = x.index ? x.toNonIndexed() : x; for (const k of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(k)) x.deleteAttribute(k); return x; }), false); const m = new THREE.Mesh(g, mat); m.castShadow = false; m.receiveShadow = false; group.add(m); return g.attributes.position.count / 3; };
  let tris = 0;
  tris += add(track, M.steel); tris += add(spine, coasterRed); tris += add(ties, coasterRed); tris += add(bents, bentMat);

  // station shed at the foot of the lift: iron columns, copper roof
  { const parts = [], roof = [];
    for (let z = 38; z <= 54; z += 4) for (const x of [56, 64]) { const c = new THREE.CylinderGeometry(0.14, 0.16, 5.5, 10); c.translate(x, 2.75, z); parts.push(c); }
    const r = new THREE.CylinderGeometry(5.5, 5.5, 18, 20, 1, false, -Math.PI / 2, Math.PI); r.rotateX(Math.PI / 2); r.scale(1, 0.45, 1); r.translate(60, 5.5, 46); roof.push(r);
    tris += add(parts, bentMat); tris += add(roof, M.copper); }

  // a dead wood all round, far towers of the park in the haze
  const rnd = mulberry(4242), trees = [];
  for (let i = 0; i < 46; i++) {
    const a = rnd() * Math.PI * 2, d = 58 + rnd() * 50, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (x > 50 && z < 60 && z > -75) continue; // keep the coaster clear
    const t = deadTree(mulberry(i * 37 + 5), { h: 10 + rnd() * 9, r: 0.35 + rnd() * 0.2, depth: d > 85 ? 2 : 3 }); t.translate(x, 0, z); trees.push(t);
  }
  tris += add(trees, M.bark);
  const towers = [], copperBits = [];
  for (const [x, z, h, r] of [[-70, -78, 34, 4], [-96, 30, 28, 3.4], [20, 96, 30, 3.6]]) {
    const body = lathe([[r * 1.3, 0], [r * 1.2, 2], [r, 2.4], [r * 0.92, h], [r * 1.12, h + 0.6], [r * 1.12, h + 1.0], [0, h + 1.0]], 16); body.translate(x, 0, z); towers.push(body);
    const D = dome(r * 0.95, { drumH: 1.5, h: r * 1.3, ribs: 10, lanternR: r * 0.2 }); D.shell.translate(x, h + 1, z); D.stone.translate(x, h + 1, z); copperBits.push(D.shell); towers.push(D.stone);
  }
  tris += add(towers, M.stone); tris += add(copperBits, M.copper);
  return { group, count: 3, tris: Math.round(tris), drawCalls: group.children.length };
}
