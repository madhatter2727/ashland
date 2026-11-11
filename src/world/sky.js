import * as THREE from 'three';
import { LIGHTING, SUN_DIR } from './lighting.js';

// Late-afternoon sky over the park: deep blue overhead, pale warm blue at the horizon, fair-weather cumulus
// lit gold on the sun side and cool blue-grey underneath, a soft glow round the low sun. Colours live in
// LIGHTING.sky. The night palette (stars, moon) is unchanged and blended in by nightfall.js as waves climb.
export { SUN_DIR };

const v3 = (a) => new THREE.Vector3(...a);
export function makeSky() {
  const S = LIGHTING.sky;
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: true,
    uniforms: {
      sunDir: { value: SUN_DIR }, time: { value: 0 }, night: { value: 0 }, moonDir: { value: new THREE.Vector3(0.45, 0.42, 0.79).normalize() },
      zenith: { value: v3(S.zenith) }, mid: { value: v3(S.mid) }, horizon: { value: v3(S.horizon) }, sunGlow: { value: v3(S.sunGlow) },
      cloudLit: { value: v3(S.cloudLit) }, cloudShade: { value: v3(S.cloudShade) }, cover: { value: S.cloudCover },
    },
    vertexShader: /* glsl */ `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
    fragmentShader: /* glsl */ `
      uniform vec3 sunDir; uniform float time; uniform float night; uniform vec3 moonDir;
      uniform vec3 zenith, mid, horizon, sunGlow, cloudLit, cloudShade; uniform float cover; varying vec3 vDir;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 6; i++){ v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return v; }
      void main(){
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 col = mix(horizon, mid, smoothstep(-0.02, 0.25, h));
        col = mix(col, zenith, smoothstep(0.2, 0.85, h));
        float sd = max(dot(d, sunDir), 0.0);
        col += sunGlow * (pow(sd, 8.0) * 0.35 + pow(sd, 64.0) * 0.6) * (0.6 + 0.4 * smoothstep(0.5, 0.0, h));
        col += vec3(14.0, 11.0, 8.0) * smoothstep(0.9994, 0.9997, sd) * (1.0 - night);
        // night palette (nightfall): deep blue dome, stars, a cold moon
        vec3 ncol = mix(vec3(0.15, 0.09, 0.1), vec3(0.03, 0.035, 0.075), smoothstep(0.0, 0.2, h));
        ncol = mix(ncol, vec3(0.006, 0.009, 0.03), smoothstep(0.18, 0.75, h));
        ncol += vec3(0.25, 0.1, 0.06) * pow(sd, 5.0) * 0.5;
        float md = max(dot(d, moonDir), 0.0);
        ncol += vec3(0.12, 0.15, 0.26) * pow(md, 24.0) + vec3(1.1, 1.15, 1.3) * smoothstep(0.99935, 0.9996, md) * 2.5;
        vec3 sp = d * 260.0, ci = floor(sp); float st = hash(ci.xy + vec2(ci.z * 17.0, ci.z * 3.1));
        float tw = 0.55 + 0.45 * sin(time * 2.7 + st * 60.0);
        ncol += vec3(1.0, 0.95, 0.88) * step(0.9955, st) * smoothstep(0.04, 0.35, h) * tw * 1.8 * smoothstep(0.5, 0.1, length(fract(sp) - 0.5));
        if (h > 0.0) {
          // cumulus: puffy fbm on a flat cloud layer, thicker toward the horizon, drifting slowly
          vec2 uv = d.xz / (h + 0.08) * 0.9 + vec2(time * 0.006, time * 0.002);
          float f = fbm(uv);
          float c = smoothstep(1.0 - cover - 0.08, 1.0 - cover + 0.22, f) * smoothstep(0.0, 0.08, h);
          // fake self-shadow: sample toward the sun; denser there = darker base
          float f2 = fbm(uv + sunDir.xz * 0.12);
          float lit = clamp(0.55 + (f - f2) * 3.0, 0.0, 1.0);
          vec3 cc = mix(cloudShade, cloudLit, lit);
          cc += sunGlow * pow(sd, 6.0) * 0.35 * (1.0 - c); // silver lining round the sun
          col = mix(col, cc, c * 0.9);
          ncol = mix(ncol, vec3(0.03, 0.033, 0.05) + vec3(0.1, 0.11, 0.16) * pow(md, 6.0), c * 0.9);
        }
        col = mix(col, ncol, night);
        // haze band at and below the horizon (matches the scene fog)
        col = mix(col, mix(horizon * 0.92, vec3(0.06, 0.065, 0.085), night), smoothstep(0.05, -0.04, h));
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), mat);
  mesh.renderOrder = -10; mesh.frustumCulled = false;
  return mesh;
}
