// Festive dressing that makes the park read as open and kept: pennant flags on the castle spires, strings of
// bunting across Main Street and round the hub, and heraldic hanging banners. Every flag and pennant in the
// park is one vertex-coloured mesh with a small wind shader (cloth ripples toward the free edge), so the
// whole lot costs one draw call. Ropes are a second merged mesh.
import * as THREE from 'three';
import { RAIN } from './materials.js';

export const PALETTE = {
  bunting: ['#e2453c', '#f4c542', '#2f8fd8', '#f5efe2', '#3fb08a', '#e86aa0'],
  flags: ['#e2453c', '#2f63c4', '#f4c542', '#e86aa0', '#3fb0a8'],
};

export class Festive {
  constructor() { this.pos = []; this.col = []; this.wave = []; this.idx = []; this.n = 0; this.ropes = []; }
  // one quad strip / triangle from local cloth coordinates (u along the free direction 0..1, v across)
  _cloth(origin, along, down, len, width, color, { tri = true, seg = 6, phase = 0, amp = 1 } = {}) {
    const c = new THREE.Color(color), base = this.n;
    for (let i = 0; i <= seg; i++) {
      const u = i / seg, w = tri ? width * (1 - u) : width;
      for (const v of [0, 1]) {
        const p = origin.clone().addScaledVector(along, u * len).addScaledVector(down, (v - 0.5) * w + (tri ? 0 : 0));
        this.pos.push(p.x, p.y, p.z); this.col.push(c.r, c.g, c.b); this.wave.push(u * amp, phase, v);
        this.n++;
      }
    }
    for (let i = 0; i < seg; i++) { const a = base + i * 2; this.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  // a long swallow-less pennant flying from a mast top, streaming downwind (+x +z-ish)
  pennant(top, color, { len = 3.2, width = 1.0, wind = new THREE.Vector3(0.82, 0, 0.57), phase = 0 } = {}) {
    const along = wind.clone().normalize(), down = new THREE.Vector3(0, 1, 0);
    this._cloth(top.clone().add(new THREE.Vector3(0, -width / 2, 0)), along, down, len, width, color, { tri: true, seg: 8, phase, amp: 1 });
    this.ropes.push(new THREE.CylinderGeometry(0.045, 0.045, width + 2.2, 6).translate(top.x, top.y - (width + 2.2) / 2 + 0.6, top.z));
  }
  // a string of triangular bunting hung between two points with a catenary sag
  bunting(p0, p1, { sag = 1.2, spacing = 0.62, size = 0.5, palette = PALETTE.bunting, seed = 0 } = {}) {
    const d = p1.clone().sub(p0), L = d.length(), n = Math.max(2, Math.floor(L / spacing));
    const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push(p0.clone().addScaledVector(d, t).add(new THREE.Vector3(0, -sag * 4 * t * (1 - t), 0))); }
    this.ropes.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.018, 4));
    const side = new THREE.Vector3().crossVectors(d, new THREE.Vector3(0, 1, 0)).normalize();
    const along = d.clone().normalize();
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n, top = p0.clone().addScaledVector(d, t).add(new THREE.Vector3(0, -sag * 4 * t * (1 - t), 0));
      const c = new THREE.Color(palette[(i + seed) % palette.length]), base = this.n;
      // triangle hanging down: two top corners along the rope, tip below; wave = 0 at the rope
      const a = top.clone().addScaledVector(along, -size * 0.45), b = top.clone().addScaledVector(along, size * 0.45), tip = top.clone().add(new THREE.Vector3(0, -size * 0.95, 0));
      for (const [p, u] of [[a, 0], [b, 0], [tip, 1]]) { this.pos.push(p.x, p.y, p.z); this.col.push(c.r, c.g, c.b); this.wave.push(u * 0.35, i * 0.7 + seed, 0); this.n++; }
      this.idx.push(base, base + 2, base + 1);
    }
    return side;
  }
  // a tall hanging banner (heraldic), hung flat against a wall facing `normal`
  banner(top, normal, color, trim, { w = 1.6, h = 5.0 } = {}) {
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), normal).normalize();
    const o = top.clone().addScaledVector(normal, 0.08);
    const c = new THREE.Color(color), t = new THREE.Color(trim), seg = 6, base = this.n;
    // body: rectangle with a pointed (swallow) bottom; columns l..r, rows top..bottom
    const cols = [-0.5, -0.43, 0, 0.43, 0.5];
    for (let i = 0; i <= seg; i++) {
      const v = i / seg;
      for (let k = 0; k < cols.length; k++) {
        const sx = cols[k], yy = -v * h + (i === seg && k === 2 ? 0.7 : 0);
        const p = o.clone().addScaledVector(right, sx * w).add(new THREE.Vector3(0, yy, 0));
        const cc = k === 0 || k === 4 || i === 0 ? t : c;
        this.pos.push(p.x, p.y, p.z); this.col.push(cc.r, cc.g, cc.b); this.wave.push(v * 0.1, top.x * 0.3 + top.z * 0.2, 1); this.n++;
      }
    }
    for (let i = 0; i < seg; i++) for (let j = 0; j < 4; j++) { const a = base + i * 5 + j, b = a + 5; this.idx.push(a, b, a + 1, a + 1, b, b + 1); }
  }
  flush(scene, ropeMat) {
    if (this.n) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
      g.setAttribute('aWave', new THREE.Float32BufferAttribute(this.wave, 3));
      g.setIndex(this.idx); g.computeVertexNormals();
      const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, side: THREE.DoubleSide, envMapIntensity: 0.6 });
      m.onBeforeCompile = (sh) => {
        sh.uniforms.uT = RAIN.time;
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aWave; uniform float uT;')
          .replace('#include <begin_vertex>', `#include <begin_vertex>
            float wu = aWave.x, ph = aWave.y;
            float s1 = sin(uT * 4.2 - wu * 7.0 + ph) * 0.22 + sin(uT * 6.9 - wu * 11.0 + ph * 1.7) * 0.08;
            transformed.y += s1 * wu * 0.9; transformed.x += s1 * wu * 0.35; transformed.z += cos(uT * 3.1 - wu * 5.0 + ph) * wu * 0.25;`);
      };
      m.customProgramCacheKey = () => 'ash-festive';
      const mesh = new THREE.Mesh(g, m); mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false; scene.add(mesh);
      this.tris = this.idx.length / 3;
    }
    if (this.ropes.length) {
      const list = this.ropes.map((r) => { const k = r.index ? r.toNonIndexed() : r; for (const a of Object.keys(k.attributes)) if (!['position', 'normal'].includes(a)) k.deleteAttribute(a); return k; });
      const merged = list.length === 1 ? list[0] : mergeAll(list);
      const mesh = new THREE.Mesh(merged, ropeMat); mesh.castShadow = false; scene.add(mesh);
      this.tris = (this.tris || 0) + merged.attributes.position.count / 3;
    }
  }
}
function mergeAll(list) {
  let n = 0; for (const g of list) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let o = 0;
  for (const g of list) { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); return g;
}
