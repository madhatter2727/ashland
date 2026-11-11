// Ashland surface library: Poly Haven CC0 PBR sets (albedo / normal / AO-rough-metal), each given a world
// texel density for the box-projected UVs, plus one shared "weather" shader patch: soot and damp rising from
// the ground, rain streaks under ledges, moss on up-facing stone, wet sheen, flaking gold leaf, and rippling
// puddles on the paving. All of it keys off world position, so repeated pieces never look stamped.
import * as THREE from 'three';
import { pbr } from '../../assets.js';

export const RAIN = { time: { value: 0 }, wet: { value: 1 } };

const NOISE = /* glsl */ `
  float wh3(vec3 p){ return fract(sin(dot(p, vec3(17.13, 113.71, 51.37))) * 43758.5453); }
  float wn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(mix(wh3(i), wh3(i+vec3(1,0,0)), f.x), mix(wh3(i+vec3(0,1,0)), wh3(i+vec3(1,1,0)), f.x), f.y),
               mix(mix(wh3(i+vec3(0,0,1)), wh3(i+vec3(1,0,1)), f.x), mix(wh3(i+vec3(0,1,1)), wh3(i+vec3(1,1,1)), f.x), f.y), f.z); }
  float wfbm(vec3 p){ return wn3(p) * 0.5 + wn3(p * 2.03) * 0.28 + wn3(p * 4.1) * 0.14 + wn3(p * 8.3) * 0.08; }`;

export function weather(mat, o = {}) {
  const W = { grime: 0.7, streaks: 0.5, wet: 0.5, moss: 0, gild: 0, puddles: 0, height: 2.4, ...o };
  const f = (v) => Number(v).toFixed(3);
  mat.userData.weather = W;
  mat.customProgramCacheKey = () => 'ash-weather-' + JSON.stringify(W);
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uRainT = RAIN.time; sh.uniforms.uWet = RAIN.wet;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN;')
      .replace('#include <project_vertex>', `#include <project_vertex>
        vec4 wp4 = vec4(transformed, 1.0); vec3 wn3 = objectNormal;
        #ifdef USE_INSTANCING
          wp4 = instanceMatrix * wp4; wn3 = mat3(instanceMatrix) * wn3;
        #endif
        vWP = (modelMatrix * wp4).xyz; vWN = normalize(mat3(modelMatrix) * wn3);`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN; uniform float uRainT; uniform float uWet;' + NOISE)
      .replace('#include <map_fragment>', `#include <map_fragment>
        float wUp = clamp(vWN.y, 0.0, 1.0);
        float wN = wfbm(vWP * 0.35);
        float gildLoss = 0.0;
        {
          float h = vWP.y;
          float base = smoothstep(${f(W.height)}, 0.0, h + wN * 1.1) * 0.6;
          float st = wn3(vec3((vWP.x + vWP.z) * 2.7, h * 0.09, 3.0));
          float streak = smoothstep(0.6, 0.95, st) * (0.3 + 0.7 * wn3(vWP * 0.23)) * (1.0 - wUp) * ${f(W.streaks)};
          float blot = smoothstep(0.62, 0.86, wfbm(vWP * 0.17 + 5.0)) * 0.35;
          float g = clamp((base + streak * 0.5 + blot) * ${f(W.grime)}, 0.0, 0.85);
          diffuseColor.rgb *= 1.0 - g * vec3(0.7, 0.72, 0.74);
          ${W.moss > 0 ? `float mo = smoothstep(0.52, 0.78, wfbm(vWP * 0.9 + 11.0) + wUp * 0.25 + smoothstep(1.2, 0.0, h) * 0.25) * ${f(W.moss)};
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.075, 0.095, 0.035) * (0.7 + 0.6 * wn3(vWP * 6.0)), clamp(mo, 0.0, 0.9));` : ''}
          ${W.gild > 0 ? `gildLoss = smoothstep(0.5, 0.56, wfbm(vWP * 2.2 + 7.0) + (1.0 - wUp) * 0.06 + smoothstep(3.0, 0.0, h) * 0.08) * ${f(W.gild)};
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.055, 0.04, 0.03), gildLoss);` : ''}
        }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        {
          float damp = (0.35 + 0.65 * wUp) * smoothstep(0.25, 0.75, wfbm(vWP * 0.21 + 2.0) + wUp * 0.2) * ${f(W.wet)} * uWet;
          roughnessFactor = mix(roughnessFactor, roughnessFactor * 0.35, damp);
          diffuseColor.rgb *= 1.0 - damp * 0.28;
          roughnessFactor = mix(roughnessFactor, 0.85, gildLoss);
        }`)
      .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
        metalnessFactor *= 1.0 - gildLoss;`);
    if (W.puddles) {
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
          float pField = wfbm(vec3(vWP.xz * 0.12, 1.7)) + wn3(vec3(vWP.xz * 1.1, 4.0)) * 0.04;
          float pud = smoothstep(0.6, 0.64, pField) * ${f(W.puddles)};
          float wetEdge = smoothstep(0.5, 0.6, pField);
          diffuseColor.rgb *= mix(1.0, 0.7, wetEdge);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.22, pud);
          roughnessFactor = mix(roughnessFactor, roughnessFactor * 0.5, wetEdge);
          roughnessFactor = mix(roughnessFactor, 0.035, pud);`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          {
            // rain rings on standing water: a few expanding ripples per 0.6 m cell
            vec2 rp = vWP.xz / 0.6; vec2 ci = floor(rp); vec2 rip = vec2(0.0);
            for (int k = 0; k < 2; k++) {
              float hh = wh3(vec3(ci, float(k) * 7.1));
              vec2 c = ci + vec2(wh3(vec3(ci, 3.3 + float(k))), wh3(vec3(ci, 9.1 + float(k))));
              float t = fract(uRainT * 0.9 + hh);
              vec2 d = rp - c; float r = length(d);
              float ring = sin((r - t * 0.7) * 40.0) * smoothstep(0.12, 0.0, abs(r - t * 0.7)) * (1.0 - t);
              rip += normalize(d + 1e-4) * ring;
            }
            
            vec3 rw = normalize(vec3(rip.x * 0.22, 1.0, rip.y * 0.22));
            vec3 rv = normalize((viewMatrix * vec4(rw, 0.0)).xyz);
            normal = normalize(mix(normal, rv, pud) + vec3(0.0, 0.0, 1e-4));
          }`);
    }
  };
  return mat;
}

const tint = (m, c) => { m.color.set(c); return m; };
export function makeMaterials(A) {
  const P = (id, opt, density, w) => { const m = pbr(A, id, opt); m.userData.density = density; return w === false ? m : weather(m, w || {}); };
  const M = {
    // ground
    paving: P('herringbone_pavement_03', { color: '#a59a92', normalScale: 1.25 }, 1 / 2.4, { grime: 0.25, streaks: 0, wet: 0.9, puddles: 1, height: 0.1 }),
    marbleFloor: P('marble_tiles', { color: '#8e8981', normalScale: 1 }, 1 / 2.6, { grime: 0.5, streaks: 0, wet: 0.9, puddles: 0.8, moss: 0.25, height: 0.1 }),
    gravel: P('leaf_scattered_gravel', { color: '#9c948a' }, 1 / 2.2, { grime: 0, streaks: 0, wet: 0.6, puddles: 0.6, height: 0.1 }),
    leaves: P('forest_leaves_02', { color: '#8e8478' }, 1 / 2.4, { grime: 0, streaks: 0, wet: 0.5, height: 0.1 }),
    hedge: P('forest_leaves_02', { color: '#56653c', normalScale: 1.6 }, 1 / 1.3, { grime: 0, streaks: 0, wet: 0.5, height: 0.1 }),
    mud: P('brown_mud_leaves_01', { color: '#8a7f73' }, 1 / 2.4, { grime: 0, streaks: 0, wet: 0.8, puddles: 0.9, height: 0.1 }),
    mossCobble: P('mossy_cobblestone', { color: '#9a958c', normalScale: 1.3 }, 1 / 2, { grime: 0.3, streaks: 0, wet: 1, puddles: 1, height: 0.1 }),
    // masonry
    stone: P('white_sandstone_blocks_02', { color: '#c9bfae', normalScale: 1.1 }, 1 / 2.2, { grime: 0.9, streaks: 0.9, wet: 0.45, moss: 0.35, height: 3.5 }),
    stoneDark: P('white_sandstone_blocks_02', { color: '#8f877b', normalScale: 1.2 }, 1 / 1.6, { grime: 1, streaks: 0.8, wet: 0.5, moss: 0.5, height: 3 }),
    marble: P('marble_01', { color: '#d9d2c6', normalScale: 0.7 }, 1 / 2.4, { grime: 0.8, streaks: 1, wet: 0.6, moss: 0.25, height: 2.5 }),
    marbleTrim: P('marble_01', { color: '#c7beb0', normalScale: 0.6 }, 1 / 1.4, { grime: 0.9, streaks: 1, wet: 0.5, moss: 0.2, height: 3 }),
    brick: P('red_bricks_04', { color: '#9a6a5c', normalScale: 1.2 }, 1 / 2.2, { grime: 0.9, streaks: 0.8, wet: 0.45, height: 3 }),
    brickDeep: P('medieval_red_brick', { color: '#86574c', normalScale: 1.2 }, 1 / 2.4, { grime: 1, streaks: 0.8, wet: 0.5, height: 3 }),
    grottoRock: P('rock_wall_08', { color: '#7b776d', normalScale: 1.6 }, 1 / 3, { grime: 0.6, streaks: 0.6, wet: 1, moss: 0.8, height: 4 }),
    grottoWall: P('mossy_stone_wall', { color: '#8c887c', normalScale: 1.4 }, 1 / 2.4, { grime: 0.6, streaks: 0.7, wet: 1, moss: 0.4, height: 4 }),
    // roofs + metals
    copper: P('green_metal_rust', { metal: true, color: '#9fb7a2', envMapIntensity: 1.1 }, 1 / 2.5, { grime: 0.5, streaks: 0.9, wet: 0.6, height: -10 }),
    slate: P('roof_slates_02', { color: '#7d7b80', normalScale: 1.3 }, 1 / 2, { grime: 0.4, streaks: 0.4, wet: 0.9, moss: 0.3, height: -10 }),
    gold: P('metal_plate_02', { metal: true, color: '#c99a45', envMapIntensity: 1.4 }, 1 / 0.9, { grime: 0.5, streaks: 0.5, wet: 0.3, gild: 1, height: 1 }),
    brass: P('metal_plate_02', { metal: true, color: '#a37a42', envMapIntensity: 1.2 }, 1 / 1.2, { grime: 0.7, streaks: 0.6, wet: 0.3, height: 1 }),
    bronzeOld: P('metal_plate_02', { metal: true, color: '#4a3a28', roughness: 0.75, envMapIntensity: 0.6 }, 1 / 0.8, { grime: 0.9, streaks: 0.9, wet: 0.4, height: 2 }),
    iron: tint(P('rusty_metal_02', { metal: true, envMapIntensity: 1 }, 1 / 1.5, { grime: 0.3, streaks: 0.3, wet: 0.5, height: 1 }), '#4a4540'),
    ironGreen: tint(P('rusty_metal_02', { metal: true, envMapIntensity: 1 }, 1 / 1.5, { grime: 0.3, streaks: 0.5, wet: 0.5, height: 1 }), '#3a4a3e'),
    steel: P('rusty_metal_02', { metal: true, envMapIntensity: 1.1 }, 1 / 2, { grime: 0.4, streaks: 0.6, wet: 0.4, height: 1 }),
    coasterRed: tint(P('rusty_metal_02', { metal: true, envMapIntensity: 1.1 }, 1 / 2, { grime: 0.3, streaks: 0.6, wet: 0.4, height: 1 }), '#8a3a30'),
    // timber, paint, fabric
    boards: P('weathered_planks', { color: '#b0a290', normalScale: 1.2 }, 1 / 2, { grime: 0.4, streaks: 0.8, wet: 0.5, height: 2 }),
    shutter: tint(P('wood_peeling_paint_weathered', { normalScale: 1.2 }, 1 / 1.6, { grime: 0.5, streaks: 0.8, wet: 0.4, height: 2 }), '#5f7a62'),
    redPaint: P('red_plaster_weathered', { color: '#8b3a32', normalScale: 1.1 }, 1 / 2, { grime: 0.8, streaks: 1, wet: 0.4, height: 3 }),
    greenPaint: tint(P('red_plaster_weathered', { normalScale: 1.1 }, 1 / 2, { grime: 0.8, streaks: 1, wet: 0.4, height: 3 }), '#3c5a45'),
    velvet: P('velour_velvet', { color: '#7a1f22', normalScale: 0.8 }, 1 / 1.2, { grime: 0.6, streaks: 0.8, wet: 0.5, height: 1 }),
    // boardwalk timber: board-and-batten painted deep red / bottle green / aged cream, raw plywood, deck planks
    woodRed: tint(P('distressed_painted_planks', { normalScale: 1.2 }, 1 / 2.2, { grime: 0.7, streaks: 0.9, wet: 0.45, moss: 0.15, height: 2 }), '#a8362a'),
    woodGreen: tint(P('distressed_painted_planks', { normalScale: 1.2 }, 1 / 2.2, { grime: 0.7, streaks: 0.9, wet: 0.45, moss: 0.15, height: 2 }), '#356a62'),
    woodCream: tint(P('distressed_painted_planks', { normalScale: 1.1 }, 1 / 2.2, { grime: 0.8, streaks: 1, wet: 0.4, height: 2 }), '#c4b493'),
    woodYellow: tint(P('distressed_painted_planks', { normalScale: 1.2 }, 1 / 2.2, { grime: 0.75, streaks: 0.9, wet: 0.45, moss: 0.1, height: 2 }), '#d2a94a'),
    woodTeal: tint(P('distressed_painted_planks', { normalScale: 1.2 }, 1 / 2.2, { grime: 0.7, streaks: 0.9, wet: 0.45, moss: 0.15, height: 2 }), '#3f8a82'),
    fauxStone: tint(P('white_sandstone_blocks_02', { normalScale: 1.4 }, 1 / 2.2, { grime: 0.9, streaks: 1, wet: 0.5, moss: 0.35, height: 5 }), '#cbb385'),
    shingleRed: tint(P('roof_slates_02', { normalScale: 1.3 }, 1 / 1.6, { grime: 0.5, streaks: 0.6, wet: 0.8, moss: 0.4, height: -10 }), '#9a4434'),
    plywood: tint(P('plywood', { normalScale: 0.8 }, 1 / 2.4, { grime: 0.6, streaks: 0.9, wet: 0.5, height: 1 }), '#9a8366'),
    deck: P('old_planks_02', { color: '#a89a88', normalScale: 1.2 }, 1 / 2.4, { grime: 0.3, streaks: 0, wet: 0.8, puddles: 0.6, moss: 0.2, height: 0.5 }),
    muralWall: tint(P('peeling_painted_wall', { normalScale: 1.0 }, 1 / 3, { grime: 0.8, streaks: 1, wet: 0.4, height: 4 }), '#a84e3a'),
    bark: P('tree_bark_03', { color: '#7d756c', normalScale: 1.5 }, 1 / 1.6, { grime: 0.2, streaks: 0.5, wet: 0.5, moss: 0.4, height: 2 }),
  };
  M.glass = new THREE.MeshPhysicalMaterial({ color: '#06080a', roughness: 0.07, metalness: 0, transparent: true, opacity: 0.55, envMapIntensity: 1.1, depthWrite: false, specularIntensity: 1, ior: 1.52 });
  M.glass.userData.density = 1;
  M.dark = new THREE.MeshStandardMaterial({ color: '#070606', roughness: 0.95 }); M.dark.userData.density = 1;
  M.water = new THREE.MeshStandardMaterial({ color: '#05080a', roughness: 0.04, metalness: 0.2, envMapIntensity: 1.6 }); M.water.userData.density = 0.5;
  M.interior = interiorMaterial();
  M.boothGlow = new THREE.MeshStandardMaterial({ color: '#3a2a1c', emissive: '#ff9a48', emissiveIntensity: 0.32, roughness: 0.9 }); M.boothGlow.userData.density = 1;
  // dead neon: dusty coloured glass tubing, unlit; and incandescent marquee bulbs (a few still burn)
  M.neonDead = new THREE.MeshPhysicalMaterial({ color: '#5a1d18', roughness: 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.2, emissive: '#ff3b26', emissiveIntensity: 0.05 }); M.neonDead.userData.density = 1;
  M.bulbDead = new THREE.MeshStandardMaterial({ color: '#6a5a46', roughness: 0.25, metalness: 0.3, envMapIntensity: 1.2 }); M.bulbDead.userData.density = 1;
  M.bulbLit = new THREE.MeshBasicMaterial({ color: new THREE.Color(5.5, 3.6, 1.7) }); M.bulbLit.userData.density = 1;
  return M;
}

// interiors behind glazing: dark rooms with depth falloff; a rare warm lamp still burning
export function interiorMaterial() {
  const m = new THREE.MeshStandardMaterial({ color: '#0a0909', roughness: 0.9, metalness: 0 });
  m.userData.density = 1;
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <project_vertex>', '#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;' + NOISE).replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      {
        vec2 q = vec2(vWP.x + vWP.z, vWP.y) / vec2(2.2, 3.4);
        vec2 cell = floor(q), fr = fract(q);
        float r = wh3(vec3(cell, 7.0));
        float vign = smoothstep(0.0, 0.4, fr.y) * smoothstep(1.0, 0.55, fr.y) * smoothstep(0.0, 0.35, fr.x) * smoothstep(1.0, 0.65, fr.x);
        float lit = step(0.93, r) * (0.5 + 0.5 * wh3(vec3(cell, 11.0)));
        totalEmissiveRadiance += vec3(1.0, 0.52, 0.2) * lit * vign * 1.3;
        diffuseColor.rgb *= 0.35 + 0.65 * vign;
      }`);
  };
  return m;
}
