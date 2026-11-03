import * as THREE from 'three';
import { clone as skClone } from 'three/addons/utils/SkeletonUtils.js';

// ---------------------------------------------------------------------------
// Skinned zombie rigs: a rigged, textured human (CC0 "Male City Zombie") with mocap clips.
// Alive: AnimationMixer drives the skeleton, the gameplay joints are read back from bones.
// Ragdoll / crawl / severed limbs: the bones are solved from the 15 Verlet joints instead.
// ---------------------------------------------------------------------------
// measured from the clips (lab/animlab.html): ground speed of the planted foot at timeScale 1, scale 1
export const RUN_CYCLE = 25 / 30;
export const GAIT = { walk: { speed: 0.277, cycle: 3.958 }, run: { speed: 2.64, cycle: RUN_CYCLE } };
export const JN = { pelvis: 0, chest: 1, head: 2, lSh: 3, lEl: 4, lHa: 5, rSh: 6, rEl: 7, rHa: 8, lHip: 9, lKn: 10, lFt: 11, rHip: 12, rKn: 13, rFt: 14 };
// gameplay joint -> bone that sits at it
const JOINT_BONE = ['Hips', 'Neck', 'Head', 'LeftArm', 'LeftForeArm', 'LeftHand', 'RightArm', 'RightForeArm', 'RightHand', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'RightUpLeg', 'RightLeg', 'RightFoot'];
// hit part index (see PARTS in enemies.js) -> bone that is collapsed when that part is severed
export const PART_BONE = [null, 'Head', 'LeftArm', 'LeftForeArm', 'RightArm', 'RightForeArm', 'LeftUpLeg', 'LeftLeg', 'RightUpLeg', 'RightLeg'];
const BONE_PART = { Hips: 0, Spine: 0, Spine1: 0, Spine2: 0, LeftShoulder: 0, RightShoulder: 0, Neck: 1, Head: 1, LeftArm: 2, LeftForeArm: 3, LeftHand: 3, RightArm: 4, RightForeArm: 5, RightHand: 5, LeftUpLeg: 6, LeftLeg: 7, LeftFoot: 7, LeftToeBase: 7, RightUpLeg: 8, RightLeg: 9, RightFoot: 9, RightToeBase: 9 };
// bones solved from joints: [bone, jointFrom, jointTo] (null = follows the torso frame)
const DRIVE = [
  ['Hips', null], ['Spine', null], ['Spine1', null], ['Spine2', null], ['LeftShoulder', null], ['RightShoulder', null],
  ['Neck', JN.chest, JN.head], ['Head', JN.chest, JN.head],
  ['LeftArm', JN.lSh, JN.lEl], ['LeftForeArm', JN.lEl, JN.lHa], ['LeftHand', JN.lEl, JN.lHa],
  ['RightArm', JN.rSh, JN.rEl], ['RightForeArm', JN.rEl, JN.rHa], ['RightHand', JN.rEl, JN.rHa],
  ['LeftUpLeg', JN.lHip, JN.lKn], ['LeftLeg', JN.lKn, JN.lFt], ['LeftFoot', JN.lKn, JN.lFt], ['LeftToeBase', JN.lKn, JN.lFt],
  ['RightUpLeg', JN.rHip, JN.rKn], ['RightLeg', JN.rKn, JN.rFt], ['RightFoot', JN.rKn, JN.rFt], ['RightToeBase', JN.rKn, JN.rFt],
];
const LIMB_BONES = { 1: ['Head'], 2: ['LeftArm', 'LeftForeArm', 'LeftHand'], 3: ['LeftForeArm', 'LeftHand'], 4: ['RightArm', 'RightForeArm', 'RightHand'], 5: ['RightForeArm', 'RightHand'],
  6: ['LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase'], 7: ['LeftLeg', 'LeftFoot', 'LeftToeBase'], 8: ['RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase'], 9: ['RightLeg', 'RightFoot', 'RightToeBase'] };

const ZOMBIE_SHADER = (u) => (sh) => {
  Object.assign(sh.uniforms, u);
  sh.vertexShader = sh.vertexShader
    .replace('#include <common>', '#include <common>\nattribute float partId; attribute vec3 aSwell; attribute float aGlow; uniform float uSwell, uPulse; varying float vPart, vGlow; varying vec3 vLocal;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPart = partId; vLocal = position * 9.0; vGlow = aGlow; transformed += aSwell * (uSwell + uPulse * aGlow);');
  sh.fragmentShader = sh.fragmentShader
    .replace('#include <common>', `#include <common>
      uniform float uFlash, uDiss, uHue, uGlow, uEmber, uBloat, uWound[10], uSeed, uPale, uSinew, uSwell; uniform vec3 uTint, uShirt, uPants;
      varying float vPart, vGlow; varying vec3 vLocal;
      float zh(vec3 p){ return fract(sin(dot(p, vec3(17.1, 113.7, 51.3))) * 43758.5453); }
      float zn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(mix(zh(i), zh(i+vec3(1,0,0)), f.x), mix(zh(i+vec3(0,1,0)), zh(i+vec3(1,1,0)), f.x), f.y),
                   mix(mix(zh(i+vec3(0,0,1)), zh(i+vec3(1,0,1)), f.x), mix(zh(i+vec3(0,1,1)), zh(i+vec3(1,1,1)), f.x), f.y), f.z); }`)
    .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
      float dn = zn(vLocal * 0.8 + uSeed) * 0.65 + zn(vLocal * 2.4) * 0.35;
      if (dn < uDiss) discard;
      float wv = uWound[int(vPart + 0.5)];
      float wn = zn(vLocal * 0.5 + 7.0 + uSeed) * 0.7 + zn(vLocal * 1.8) * 0.3;
      float wound = smoothstep(1.0 - wv * 0.6, 1.06 - wv * 0.6, wn + 0.12) * step(0.01, wv);
      float dried = smoothstep(0.55, 0.75, zn(vLocal * 0.35 + 3.0 + uSeed)) * 0.6;`)
    .replace('#include <map_fragment>', `#include <map_fragment>
      {
        // the source albedo is a dark red/black bake: rebuild pallid skin and grimy clothes from its luminance,
        // keeping its red channel as caked blood
        vec3 t = diffuseColor.rgb; float lum = dot(t, vec3(0.3, 0.59, 0.11));
        float red = clamp((t.r - max(t.g, t.b)) * 3.0, 0.0, 1.0);
        // grime + rot masks in body space (cheap value noise, stable under animation)
        float g1 = zn(vLocal * 1.6 + uSeed), g2 = zn(vLocal * 5.0 + 4.0), g3 = zn(vLocal * 0.7 + 19.0 + uSeed);
        float grime = g1 * 0.6 + g2 * 0.4;
        #ifdef Z_SKIN
          // rotting grey-green flesh: sallow base, olive rot patches, bruised purple, dark cavities from the bake
          vec3 base = vec3(0.235, 0.25, 0.2) * (0.45 + lum * 1.7);
          base = mix(base, vec3(0.17, 0.2, 0.11) * (0.6 + lum), smoothstep(0.45, 0.7, g3) * 0.8);
          base = mix(base, vec3(0.16, 0.1, 0.14), smoothstep(0.62, 0.8, g1) * 0.5);
          base *= 0.75 + g2 * 0.35;
          if (uPale > 0.0) { // Bloater: swollen, pale green-grey, blotchy, with dark bruising and a waxy sheen
            vec3 pale = vec3(0.4, 0.45, 0.35) * (0.55 + lum * 1.0);
            pale = mix(pale, vec3(0.33, 0.4, 0.25) * (0.75 + lum), smoothstep(0.42, 0.74, g3) * 0.75);
            pale = mix(pale, vec3(0.36, 0.28, 0.34), smoothstep(0.64, 0.82, g1) * 0.45);
            pale *= 0.82 + g2 * 0.26;
            base = mix(base, pale, uPale);
          }
          if (uSinew > 0.0) { // Jumper: stringy, skinless-looking sinew in long streaks along the limbs
            float sn = zn(vLocal * vec3(9.0, 1.3, 9.0) + uSeed) * 0.7 + zn(vLocal * vec3(20.0, 3.0, 20.0)) * 0.3;
            vec3 m = mix(vec3(0.2, 0.05, 0.045), vec3(0.42, 0.17, 0.13), smoothstep(0.3, 0.75, sn)) * (0.6 + lum * 1.1);
            base = mix(base, m, uSinew * smoothstep(0.38, 0.62, zn(vLocal * 0.7 + 31.0 + uSeed)));
          }
          diffuseColor.rgb = mix(base, t * vec3(0.7, 0.22, 0.18), red * 0.75);
        #endif
        #ifdef Z_CLOTH
          if (uPale > 0.0 && vGlow > 0.12) discard; // the Bloater's gut has burst its shirt open
          vec3 cl = vLocal.y / 9.0 > 0.98 ? uShirt : uPants;
          vec3 base = cl * (0.45 + lum * 1.9);
          base *= mix(vec3(1.0), vec3(0.42, 0.36, 0.28), smoothstep(0.35, 0.75, grime)); // dirt and soot
          float stain = smoothstep(0.58, 0.72, g3 + (vLocal.y / 9.0 > 0.98 ? 0.1 : -0.05));
          base = mix(base, vec3(0.13, 0.02, 0.015), stain * 0.85); // old blood soaked into the fabric
          diffuseColor.rgb = mix(base, t * vec3(0.6, 0.18, 0.14), red * 0.6);
        #endif
      }
      diffuseColor.rgb *= uTint;
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.55, 0.12, 0.08), dried * 0.5);
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.75, 1.05, 0.55), uHue);`)
    .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
      roughnessFactor = mix(roughnessFactor, 0.2, wound);`)
    .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.16, 0.004, 0.006), wound * 0.94);
      float edge = smoothstep(uDiss + 0.07, uDiss, dn) * step(0.001, uDiss);
      totalEmissiveRadiance += vec3(0.25, 0.03, 0.01) * edge;
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.05, 0.01, 0.01), edge);
      totalEmissiveRadiance += vec3(0.35, 1.0, 0.12) * uHue * uGlow * smoothstep(0.62, 0.8, zn(vLocal * 1.3 + 2.0));
      float crack = smoothstep(0.47, 0.5, zn(vLocal * 0.9 + 11.0)) * smoothstep(0.53, 0.5, zn(vLocal * 0.9 + 11.0));
      totalEmissiveRadiance += vec3(2.4, 0.7, 0.15) * uEmber * crack * (1.0 - wound);
      { // Bloater: the gut glows from inside through the stretched skin (veins brightest), pulsing with the heartbeat;
        // during the death swell the whole body heats up
        float vn = zn(vLocal * 1.5 + 5.0), vein = smoothstep(0.43, 0.5, vn) * smoothstep(0.57, 0.5, vn);
        float inner = smoothstep(0.25, 0.8, zn(vLocal * 0.6 + 9.0));
        vec3 gc = vec3(0.7, 1.0, 0.22);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.27, 0.33, 0.2) * (0.45 + inner * 0.5) + vec3(0.06, 0.02, 0.05) * vein, vGlow * 0.75 * step(0.001, uBloat + uSwell));
        totalEmissiveRadiance += gc * vGlow * (uBloat * (0.03 + inner * 0.2 + vein * 1.5) * (0.35 + 0.65 * vGlow) + uSwell * (0.25 + inner * 0.45 + vein * 2.2));
        totalEmissiveRadiance += gc * uSwell * uSwell * (0.05 + vein * 0.5) * (1.0 - vGlow);
      }
      { // hit flash: hot rim + a faint body glow, so a struck husk pops without turning into a white mannequin
        float fres = pow(1.0 - clamp(abs(dot(normal, normalize(vViewPosition))), 0.0, 1.0), 2.0);
        totalEmissiveRadiance += vec3(1.0, 0.42, 0.22) * uFlash * (0.06 + fres * 0.5);
      }`);
};

// ---------------------------------------------------------------------------
// M14c: body shapes for the special zombies. The bind-pose mesh is reshaped per vertex (no skeleton change except
// a few bone offsets that are re-applied after the mixer, see LEN): each bone thickens / thins its skin around its own
// axis (r: one factor, or [x, y, z] in body space), blended by the skin weights so there are no seams. `len` stretches
// a bone (its child's offset is multiplied each frame) and the skin along it. `extra` adds sculpting (hump, gut).
// Generic bone names: Left/Right stripped, all finger bones are 'Finger'.
// ---------------------------------------------------------------------------
const bump = (x, c, w) => Math.exp(-(((x - c) / w) ** 2));
export const BODIES = {
  brute: {
    r: { Hips: [1.3, 1, 1.25], Spine: [1.38, 1, 1.32], Spine1: [1.55, 1, 1.42], Spine2: [1.62, 1, 1.5], Neck: 1.85, Head: 0.9,
      Shoulder: [1.2, 1.9, 1.7], Arm: 1.75, ForeArm: 1.68, Hand: 1.55, Finger: 1.45, UpLeg: 1.42, Leg: 1.4, Foot: 1.2, ToeBase: 1.15 },
    len: { Arm: 1.5, ForeArm: 1.1, Hand: 1.16, LeftHandIndex1: 1.1 },
    extra(p, wb, o) { // hunched back: a slab of muscle over the upper back and a bull neck that slopes into it
      const back = Math.max(0, -(p.z + 0.03)) * 9, w = (wb.Spine2 || 0) + (wb.Spine1 || 0) * 0.6 + (wb.Neck || 0) * 0.7 + (wb.Shoulder || 0) * 0.8;
      const h = bump(p.y, 1.4, 0.13) * Math.min(1, back) * w * (1 - Math.min(1, Math.abs(p.x) / 0.28) ** 2);
      o.z -= 0.085 * h; o.y += 0.03 * h;
      const tr = (wb.Shoulder || 0) * bump(p.y, 1.46, 0.06); o.y += 0.025 * tr; // traps
    },
  },
  bloater: {
    r: { Hips: [1.3, 1, 1.3], Spine: [1.3, 1, 1.3], Spine1: [1.22, 1, 1.25], Spine2: [1.15, 1, 1.15], Neck: 1.75, Head: 1.06,
      Shoulder: 1.3, Arm: 1.42, ForeArm: 1.3, Hand: 1.2, Finger: 1.25, UpLeg: 1.5, Leg: 1.38, Foot: 1.15, ToeBase: 1.1 },
    len: {},
    extra(p, wb, o, sw) { // the gut: skin inside a big egg-shaped belly is pushed out onto its surface (front only)
      const wt = Math.min(1, (wb.Hips || 0) + (wb.Spine || 0) + (wb.Spine1 || 0) + (wb.Spine2 || 0) * 0.6 + (wb.UpLeg || 0) * 0.25);
      const qx = p.x + o.x, qy = p.y + o.y, qz = p.z + o.z; // after the bone thickening
      const dx = qx, dy = qy - 1.02, dz = qz - 0.02, dl = Math.hypot(dx, dy, dz) || 1, nx = dx / dl, ny = dy / dl, nz = dz / dl;
      const t = 1 / Math.hypot(nx / 0.27, ny / (ny < 0 ? 0.22 : 0.26), nz / 0.33); // egg: rounder on top, tucked under
      const front = Math.max(0, Math.min(1, (nz + 0.05) / 0.5)), k = wt * front * front * (3 - 2 * front);
      const push = Math.max(0, t - dl) * k;
      o.x += nx * push; o.y += ny * push; o.z += nz * push;
      sw.glow = Math.min(1, k * Math.min(1, (push + 0.02) / 0.07) * (dl < t + 0.02 ? 1 : 0.4));
      sw.x += nx * 0.07 * sw.glow; sw.y += ny * 0.05 * sw.glow; sw.z += nz * 0.08 * sw.glow;
    },
    swell: 0.22, // whole-body swell at uSwell = 1 (share of each bone's thickness)
  },
  jumper: {
    r: { Hips: [0.84, 1, 0.82], Spine: [0.78, 1, 0.76], Spine1: [0.8, 1, 0.78], Spine2: [0.84, 1, 0.82], Neck: 0.78, Head: 0.94,
      Shoulder: 0.85, Arm: 0.76, ForeArm: 0.78, Hand: 0.9, Finger: 0.85, UpLeg: 0.74, Leg: 0.76, Foot: 0.95, ToeBase: 0.95 },
    len: { Leg: 1.14, Foot: 1.14, ForeArm: 1.06, Hand: 1.08 },
    extra(p, wb, o) { // sunken gut, ribs pushed out
      const g = ((wb.Spine || 0) + (wb.Hips || 0) * 0.5) * bump(p.y, 1.05, 0.08) * Math.max(0, p.z + 0.02) * 10;
      o.z -= 0.03 * Math.min(1, g);
    },
  },
};
const gname = (n) => (/Hand(Thumb|Index|Middle|Ring|Pinky)/.test(n) ? 'Finger' : n.replace(/^(Left|Right)/, ''));
// per-bone offset multipliers (re-applied after the mixer every frame): LEN[kind] = [[bone, factor], ...]
export function bodyLen(kind) {
  const B = BODIES[kind]; if (!B) return null;
  const out = [];
  for (const [n, f] of Object.entries(B.len)) {
    if (/^(Left|Right)/.test(n)) { out.push([n, f], [n.replace(/^Left/, 'Right'), f]); continue; }
    out.push(['Left' + n, f], ['Right' + n, f]);
  }
  return out;
}

export const EYE_MATS = []; // every zombie eye material (nightfall turns the glow up)
export class ZombieFactory {
  constructor(gltf) {
    this.template = gltf.scene;
    // in-place clips (walk/run are authored in place; keep the death clip's travel)
    this.clips = {};
    for (const c of gltf.animations) this.clips[c.name] = c;
    // the source run clip holds one 25-frame stride and then freezes for 3 s: keep just the stride so it loops
    if (this.clips.run && this.clips.run.duration > 1) { this.clips.run.duration = RUN_CYCLE; this.clips.run.trim(); }
    // per-vertex body part for wound masks, from the dominant skin weight
    this.template.traverse((o) => {
      if (!o.isSkinnedMesh) return;
      o.frustumCulled = false;
      const g = o.geometry; if (g.attributes.partId) return;
      const si = g.attributes.skinIndex, sw = g.attributes.skinWeight, bones = o.skeleton.bones;
      const part = new Float32Array(si.count);
      for (let i = 0; i < si.count; i++) {
        let best = 0, bw = -1;
        for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (w > bw) { bw = w; best = si.getComponent(i, k); } }
        part[i] = BONE_PART[bones[best].name] ?? 0;
      }
      g.setAttribute('partId', new THREE.BufferAttribute(part, 1));
    });
    this.buildBodies();
    this.goreMat = new THREE.MeshStandardMaterial({ color: '#5a0508', roughness: 0.25, metalness: 0, emissive: '#120000' });
    this.boneMat = new THREE.MeshStandardMaterial({ color: '#d8ccb4', roughness: 0.5 });
    this.stumpGeo = new THREE.SphereGeometry(1, 10, 8); this.stumpGeo.scale(1, 0.55, 1);
    this.boneGeo = new THREE.CylinderGeometry(0.22, 0.28, 1, 6); this.boneGeo.translate(0, 0.5, 0);
  }
  // reshaped copies of the three skinned meshes for each special body (see BODIES). Every geometry also carries
  // aSwell / aGlow (zero on the plain husk) for the Bloater's pulsing gut and death swell.
  buildBodies() {
    this.template.updateMatrixWorld(true);
    const meshes = []; this.template.traverse((o) => { if (o.isSkinnedMesh) meshes.push(o); });
    this.baseGeos = meshes.map((m) => m.geometry);
    for (const m of meshes) { const n = m.geometry.attributes.position.count; m.geometry.setAttribute('aSwell', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); m.geometry.setAttribute('aGlow', new THREE.BufferAttribute(new Float32Array(n), 1)); }
    this.bodies = {};
    const P = new THREE.Vector3(), A = new THREE.Vector3(), Bv = new THREE.Vector3(), O = new THREE.Vector3(), Q = new THREE.Vector3(), M = new THREE.Matrix4(), Mi = new THREE.Matrix3();
    for (const [kind, D] of Object.entries(BODIES)) {
      const len = Object.fromEntries(bodyLen(kind));
      this.bodies[kind] = meshes.map((mesh) => {
        const g0 = mesh.geometry, sk = mesh.skeleton, bones = sk.bones;
        // geometry space -> bind-pose world (metres, body space: +x left, +y up, +z forward)
        M.multiplyMatrices(bones[0].matrixWorld, sk.boneInverses[0]).multiply(mesh.bindMatrix);
        Mi.setFromMatrix4(M).invert();
        const ax = bones.map((b) => { // bone axis in bind world: head -> first child (or extrapolated)
          const a = b.getWorldPosition(new THREE.Vector3());
          const c = b.children.find((k) => k.isBone && !/Thumb|Index|Ring|Pinky/.test(k.name)) || b.children.find((k) => k.isBone);
          const t = c ? c.getWorldPosition(new THREE.Vector3()) : a.clone().add(a.clone().sub(b.parent.getWorldPosition(new THREE.Vector3())).multiplyScalar(0.6));
          const name = gname(b.name), r = D.r[name] ?? 1, rv = Array.isArray(r) ? r : [r, r, r];
          return { a, t, name, rv, m: c ? len[c.name] ?? 1 : 1 };
        });
        const pos0 = g0.attributes.position, si = g0.attributes.skinIndex, swt = g0.attributes.skinWeight, n = pos0.count;
        const pos = new Float32Array(n * 3), swell = new Float32Array(n * 3), glow = new Float32Array(n);
        const wb = {}, sw = { x: 0, y: 0, z: 0, glow: 0 };
        for (let i = 0; i < n; i++) {
          P.fromBufferAttribute(pos0, i).applyMatrix4(M); O.set(0, 0, 0);
          for (const k in wb) wb[k] = 0;
          sw.x = sw.y = sw.z = sw.glow = 0;
          for (let j = 0; j < 4; j++) {
            const w = swt.getComponent(i, j); if (w <= 0) continue;
            const X = ax[si.getComponent(i, j)]; wb[X.name] = (wb[X.name] || 0) + w;
            Bv.copy(X.t).sub(X.a); const L2 = Bv.lengthSq() || 1e-6;
            const t = Math.max(0, Math.min(1, Q.copy(P).sub(X.a).dot(Bv) / L2));
            Q.copy(X.a).addScaledVector(Bv, t); A.copy(P).sub(Q); // radial from the bone axis
            O.x += w * (A.x * (X.rv[0] - 1) + Bv.x * t * (X.m - 1)); O.y += w * (A.y * (X.rv[1] - 1) + Bv.y * t * (X.m - 1)); O.z += w * (A.z * (X.rv[2] - 1) + Bv.z * t * (X.m - 1));
            if (D.swell) { sw.x += w * A.x * X.rv[0] * D.swell; sw.y += w * A.y * X.rv[1] * D.swell; sw.z += w * A.z * X.rv[2] * D.swell; }
          }
          D.extra?.(P, wb, O, sw);
          O.applyMatrix3(Mi); P.fromBufferAttribute(pos0, i).add(O);
          pos[i * 3] = P.x; pos[i * 3 + 1] = P.y; pos[i * 3 + 2] = P.z;
          Q.set(sw.x, sw.y, sw.z).applyMatrix3(Mi); swell[i * 3] = Q.x; swell[i * 3 + 1] = Q.y; swell[i * 3 + 2] = Q.z; glow[i] = sw.glow;
        }
        const g = g0.clone();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        g.setAttribute('aSwell', new THREE.BufferAttribute(swell, 3)); g.setAttribute('aGlow', new THREE.BufferAttribute(glow, 1));
        weldNormals(g, pos0);
        return g;
      });
    }
  }

  make() {
    const root = skClone(this.template);
    const R = { root, factory: this, kind: null, bones: {}, meshes: [], mats: [], u: null, mixer: new THREE.AnimationMixer(root), actions: {}, cur: null, stumps: [] };
    const u = (R.u = { uFlash: { value: 0 }, uDiss: { value: 0 }, uHue: { value: 0 }, uGlow: { value: 0 }, uEmber: { value: 0 }, uBloat: { value: 0 }, uPale: { value: 0 }, uSinew: { value: 0 }, uSwell: { value: 0 }, uPulse: { value: 0 }, uWound: { value: new Array(10).fill(0) }, uSeed: { value: Math.random() * 50 }, uTint: { value: new THREE.Color(1, 1, 1) }, uShirt: { value: new THREE.Color() }, uPants: { value: new THREE.Color() } });
    const SH = [[0.3, 0.28, 0.25], [0.18, 0.21, 0.24], [0.28, 0.2, 0.15], [0.16, 0.19, 0.15], [0.32, 0.3, 0.27], [0.24, 0.08, 0.07], [0.1, 0.1, 0.11]], PA = [[0.08, 0.1, 0.15], [0.14, 0.13, 0.11], [0.07, 0.07, 0.07], [0.16, 0.14, 0.1], [0.1, 0.12, 0.16]];
    u.uShirt.value.setRGB(...SH[Math.floor(Math.random() * SH.length)]); u.uPants.value.setRGB(...PA[Math.floor(Math.random() * PA.length)]);
    root.traverse((o) => {
      if (o.isBone) R.bones[o.name] = o;
      if (o.isSkinnedMesh) {
        o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
        const m = o.material.clone();
        if (/eyes/.test(m.name)) { m.emissive = new THREE.Color(0.5, 0.42, 0.18); m.emissiveIntensity = 0.6; m.userData.eye = true; EYE_MATS.push(m); }
        else { const kind = /outfit/.test(m.name) ? 'Z_CLOTH' : 'Z_SKIN'; m.defines = { ...(m.defines || {}), [kind]: 1 }; m.onBeforeCompile = ZOMBIE_SHADER(u); m.customProgramCacheKey = () => 'zombie-' + kind; }
        o.material = m; R.meshes.push(o); R.mats.push(m);
      }
    });
    for (const [k, c] of Object.entries(this.clips)) {
      const a = R.mixer.clipAction(c);
      if (k === 'die') { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
      R.actions[k] = a;
    }
    R.order = DRIVE.map(([b]) => R.bones[b]);
    R.rest = {}; for (const b of Object.values(R.bones)) R.rest[b.name] = { p: b.position.clone(), q: b.quaternion.clone(), s: b.scale.clone() };
    root.visible = false;
    return R;
  }
}

// smooth normals for a reshaped mesh, welded across UV seams (vertices that shared a position before reshaping)
function weldNormals(g, pos0) {
  const pos = g.attributes.position, n = pos.count, idx = g.index;
  const key = new Map(), grp = new Int32Array(n);
  for (let i = 0; i < n; i++) { const k = pos0.getX(i).toFixed(5) + ',' + pos0.getY(i).toFixed(5) + ',' + pos0.getZ(i).toFixed(5); let v = key.get(k); if (v === undefined) key.set(k, (v = key.size)); grp[i] = v; }
  const acc = new Float32Array(key.size * 3), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const tri = idx ? idx.count / 3 : n / 3;
  for (let t = 0; t < tri; t++) {
    const i0 = idx ? idx.getX(t * 3) : t * 3, i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1, i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
    a.fromBufferAttribute(pos, i0); b.fromBufferAttribute(pos, i1).sub(a); c.fromBufferAttribute(pos, i2).sub(a); b.cross(c); // area-weighted
    for (const i of [i0, i1, i2]) { const q = grp[i] * 3; acc[q] += b.x; acc[q + 1] += b.y; acc[q + 2] += b.z; }
  }
  const nrm = new Float32Array(n * 3), old = g.attributes.normal;
  for (let i = 0; i < n; i++) {
    const q = grp[i] * 3; a.set(acc[q], acc[q + 1], acc[q + 2]);
    if (a.lengthSq() < 1e-20 && old) a.fromBufferAttribute(old, i);
    a.normalize(); nrm[i * 3] = a.x; nrm[i * 3 + 1] = a.y; nrm[i * 3 + 2] = a.z;
  }
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
}
// swap a pooled rig onto a body shape (null = the plain husk)
export function setBody(R, kind) {
  const F = R.factory, geos = kind ? F.bodies[kind] : F.baseGeos;
  if (!geos || R.kind === kind) return;
  for (let i = 0; i < R.meshes.length; i++) R.meshes[i].geometry = geos[i];
  R.kind = kind; R.len = kind ? bodyLen(kind).map(([n, f]) => [R.bones[n], f, R.rest[n].p]).filter(([b]) => b) : null;
}
// re-apply the body's bone stretches after the mixer has written this frame's bone offsets
export function applyBodyLen(R) {
  if (!R.len) return;
  for (const [b, f, p] of R.len) b.position.copy(p).multiplyScalar(f); // limb offsets are constant in the clips
}

const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _m = new THREE.Matrix4();
const _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3();

export function resetRig(R) {
  for (const b of Object.values(R.bones)) { const r = R.rest[b.name]; b.position.copy(r.p); b.quaternion.copy(r.q); b.scale.copy(r.s); }
  if (R.detached) { R.detached.parent.remove(R.detached); R.bones[R.detachedParent].add(R.detached); R.detached = null; }
  R.mixer.stopAllAction(); R.cur = null; R.manual = false; R.w = null;
  for (const s of R.stumps) s.parent?.remove(s);
  R.stumps.length = 0;
  R.u.uWound.value.fill(0); R.u.uEmber.value = 0; R.u.uBloat.value = 0; R.u.uPale.value = 0; R.u.uSinew.value = 0; R.u.uSwell.value = 0; R.u.uPulse.value = 0;
  if (R.factory && R.kind) setBody(R, null); R.u.uDiss.value = 0; R.u.uFlash.value = 0; R.u.uHue.value = 0;
}
// crossfade to a named clip
export function play(R, name, fade = 0.2, timeScale = 1, restart = false) {
  const a = R.actions[name];
  if (R.manual) { // coming out of the hand-weighted locomotion blend: fade every layer out
    for (const b of Object.values(R.actions)) if (b !== a && b.getEffectiveWeight() > 0) b.fadeOut(fade);
    R.manual = false; R.cur = null;
  }
  if (R.cur === a) { a.timeScale = timeScale; return a; }
  a.reset(); if (!restart) a.time = Math.random() * a.getClip().duration; a.timeScale = timeScale; a.enabled = true; a.setEffectiveWeight(1);
  if (R.cur) a.crossFadeFrom(R.cur, fade, false); else a.play();
  a.play();
  R.cur = a;
  return a;
}
// world-space joints from the posed skeleton
export function readJoints(R, joints, scale) {
  for (let i = 0; i < 15; i++) R.bones[JOINT_BONE[i]].getWorldPosition(joints[i]);
  // head joint: centre of the skull rather than the neck pivot
  const h = R.bones.Head; _v.set(0, 0.1, 0.03).applyMatrix4(h.matrixWorld); joints[JN.head].copy(_v);
  void scale;
}
function torsoFrame(j, out) {
  _y.copy(j[JN.chest]).sub(j[JN.pelvis]).normalize();
  _x.copy(j[JN.lSh]).sub(j[JN.rSh]); _z.crossVectors(_x, _y).normalize(); _x.crossVectors(_y, _z).normalize();
  return out.setFromRotationMatrix(_m.makeBasis(_x, _y, _z));
}
// snapshot of the pose the joint solver works relative to (world bone rotations + joint directions)
export function captureRef(R, joints, ref = {}) {
  ref.q = ref.q || {}; ref.d = ref.d || {};
  for (const [b, a, c] of DRIVE) {
    const bone = R.bones[b]; if (!bone) continue;
    (ref.q[b] = ref.q[b] || new THREE.Quaternion()).copy(bone.getWorldQuaternion(_q));
    if (a !== null) (ref.d[b] = ref.d[b] || new THREE.Vector3()).copy(joints[c]).sub(joints[a]).normalize();
  }
  ref.torso = torsoFrame(joints, ref.torso || new THREE.Quaternion());
  return ref;
}
// pose the bones so they follow the given joints (ragdoll / crawl)
const WQ = {};
export function solveFromJoints(R, joints, ref) {
  const root = R.root; root.updateMatrixWorld(true);
  const tq = torsoFrame(joints, _q2).multiply(_q.copy(ref.torso).invert()); // torso delta
  for (const [b, a, c] of DRIVE) {
    const bone = R.bones[b]; if (!bone || bone === R.detached) continue;
    const want = WQ[b] || (WQ[b] = new THREE.Quaternion());
    if (a === null) want.copy(tq).multiply(ref.q[b]);
    else { _v.copy(joints[c]).sub(joints[a]).normalize(); want.setFromUnitVectors(ref.d[b], _v).multiply(ref.q[b]); }
    const parentQ = WQ[bone.parent.name] && DRIVE.some((d) => d[0] === bone.parent.name) ? WQ[bone.parent.name] : bone.parent.getWorldQuaternion(new THREE.Quaternion());
    bone.quaternion.copy(parentQ).invert().multiply(want);
    if (b === 'Hips') { bone.parent.updateMatrixWorld(true); bone.position.copy(bone.parent.worldToLocal(_v2.copy(joints[JN.pelvis]))); }
  }
  root.updateMatrixWorld(true);
}
// bloody stump cap on the parent of a severed bone (+ a bit of bone sticking out)
export function addStump(F, R, partIdx, radius) {
  const b = R.bones[PART_BONE[partIdx]]; if (!b) return;
  const parent = b.parent;
  const s = new THREE.Mesh(F.stumpGeo, F.goreMat); s.castShadow = false;
  const k = radius / (R.root.scale.x || 1);
  s.position.copy(b.position); s.scale.setScalar(k);
  const bone = new THREE.Mesh(F.boneGeo, F.boneMat); bone.scale.set(k * 0.5, k * 1.5, k * 0.5); bone.position.copy(b.position);
  // point the bone stub along the severed limb's rest direction
  _v.copy(b.position).normalize(); bone.quaternion.setFromUnitVectors(_y.set(0, 1, 0), _v.lengthSq() > 0 ? _v : _y);
  parent.add(s); parent.add(bone); R.stumps.push(s, bone);
}
// a pooled rig that shows only one severed limb: the limb chain is re-parented to the rig root,
// everything else collapses into the cut point
export function makeLimb(R, src, partIdx, joints, chain) {
  resetRig(R);
  R.root.position.copy(src.root.position); R.root.quaternion.copy(src.root.quaternion); R.root.scale.copy(src.root.scale);
  for (const [n, b] of Object.entries(R.bones)) { const s = src.bones[n]; b.position.copy(s.position); b.quaternion.copy(s.quaternion); b.scale.copy(s.scale); }
  R.root.updateMatrixWorld(true);
  const top = R.bones[LIMB_BONES[partIdx][0]];
  R.detachedParent = top.parent.name; R.detached = top;
  R.root.attach(top);
  top.scale.setScalar(1);
  R.bones.Hips.scale.setScalar(0.0001);
  R.limbNames = LIMB_BONES[partIdx].filter((n) => n !== 'LeftHand' && n !== 'RightHand' && !/Foot|Toe/.test(n)).slice(0, chain.length - 1); // lower half may already be gone
  R.limbRef = R.limbNames.map((n, k) => ({ n, q: R.bones[n].getWorldQuaternion(new THREE.Quaternion()), d: chain[k + 1].clone().sub(chain[k]).normalize() }));
  for (let i = 0; i < R.mats.length; i++) Object.assign(R.u.uWound.value, src.u.uWound.value);
  R.u.uTint.value.copy(src.u.uTint.value); R.u.uHue.value = src.u.uHue.value;
  setBody(R, src.kind); R.u.uPale.value = src.u.uPale.value; R.u.uSinew.value = src.u.uSinew.value;
  R.root.visible = true;
  void joints;
}
export function poseLimb(R, pts) {
  const root = R.root; root.updateMatrixWorld(true);
  const rq = root.getWorldQuaternion(new THREE.Quaternion()).invert();
  let parentW = null;
  for (let k = 0; k < R.limbRef.length && k < pts.length - 1; k++) {
    const L = R.limbRef[k], b = R.bones[L.n];
    _v.copy(pts[k + 1]).sub(pts[k]).normalize();
    const want = _q.setFromUnitVectors(L.d, _v).multiply(L.q);
    if (k === 0) { b.quaternion.copy(rq).multiply(want); b.position.copy(root.worldToLocal(_v2.copy(pts[0]))); }
    else b.quaternion.copy(parentW).invert().multiply(want);
    parentW = (parentW || new THREE.Quaternion()).copy(want);
  }
  // keep the collapsed body at the cut so no skin stretches across the street
  const hips = R.bones.Hips; hips.position.copy(hips.parent.worldToLocal(_v2.copy(pts[0])));
  root.updateMatrixWorld(true);
}

// Hand-weighted layers (locomotion blend trees): targets {clip: weight}; weights ease toward them and are
// normalised so the pose never leaks toward the bind pose. Clips listed in `phased` are driven by phase (0..1).
export function blendLayers(R, targets, dt, rate, phased, timeScales) {
  if (!R.w || !R.manual) {
    R.w = {};
    for (const [k, a] of Object.entries(R.actions)) { R.w[k] = a.isRunning() ? a.getEffectiveWeight() : 0; a.stopFading(); }
    R.manual = true; R.cur = null;
  }
  const k = 1 - Math.exp(-rate * dt);
  let sum = 0;
  for (const name of Object.keys(R.actions)) {
    const t = targets[name] || 0;
    R.w[name] += (t - R.w[name]) * k;
    if (R.w[name] < 0.002 && t === 0) R.w[name] = 0;
    sum += R.w[name];
  }
  for (const [name, a] of Object.entries(R.actions)) {
    const w = sum > 0 ? R.w[name] / sum : 0;
    if (w <= 0) { if (a.isRunning() || a.enabled) { a.enabled = false; } continue; }
    if (!a.enabled || !a.isRunning()) { a.enabled = true; a.reset(); a.play(); if (targets.__restart === name) a.time = targets.__restartAt || 0; }
    a.setEffectiveWeight(w);
    if (phased && name in phased) { a.timeScale = 0; a.time = phased[name] * a.getClip().duration; }
    else a.timeScale = timeScales?.[name] ?? 1;
  }
}
