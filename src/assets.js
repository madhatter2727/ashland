import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

// Everything the game streams in before the menu unlocks. CC0 / free-licensed sources are listed in CREDITS.md.
const BASE = import.meta.env.BASE_URL + 'assets/';
export const MODEL_IDS = ['large_iron_gate', 'horse_statue_01', 'gothic_statue', 'lion_head', 'marble_bust_01', 'street_lamp_02',
  'modular_street_seating', 'shrub_02', 'shrub_04', 'nettle_plant', 'weed_plant_02', 'fern_02', 'Chandelier_01', 'rock_moss_set_01',
  'dead_tree_trunk_02', 'ornate_mirror_01', 'Lantern_01', 'brass_vase_01'];
export const TEX_IDS = ['distressed_painted_planks', 'plywood', 'peeling_painted_wall', 'old_planks_02', 'herringbone_pavement_03', 'marble_tiles', 'leaf_scattered_gravel', 'forest_leaves_02', 'brown_mud_leaves_01',
  'mossy_cobblestone', 'white_sandstone_blocks_02', 'marble_01', 'red_bricks_04', 'medieval_red_brick', 'rock_wall_08', 'mossy_stone_wall',
  'green_metal_rust', 'roof_slates_02', 'metal_plate_02', 'rusty_metal_02', 'weathered_planks', 'wood_peeling_paint_weathered',
  'red_plaster_weathered', 'velour_velvet', 'tree_bark_03'];

export async function loadAssets(onProgress = () => {}) {
  const manager = new THREE.LoadingManager();
  let done = 0, total = 0;
  const tick = () => onProgress(++done / total);
  const gltf = new GLTFLoader(manager).setMeshoptDecoder(MeshoptDecoder);
  const texL = new THREE.TextureLoader(manager);
  const jobs = [];
  const job = (p) => { total++; jobs.push(p.then((v) => { tick(); return v; })); return p; };
  const models = {}, textures = {};
  for (const id of MODEL_IDS) job(gltf.loadAsync(BASE + 'models/' + id + '.glb').then((g) => (models[id] = g)));
  job(gltf.loadAsync(BASE + 'models/zombie.glb').then((g) => (models.zombie = g)));
  const tex = (url, srgb) => job(texL.loadAsync(url).then((t) => { t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; }));
  for (const id of TEX_IDS) {
    textures[id] = {};
    tex(`${BASE}tex/${id}_col.webp`, true).then((t) => (textures[id].map = t));
    tex(`${BASE}tex/${id}_nrm.webp`, false).then((t) => (textures[id].normalMap = t));
    tex(`${BASE}tex/${id}_arm.webp`, false).then((t) => (textures[id].arm = t));
  }
  let hdr = null;
  job(new HDRLoader(manager).loadAsync(BASE + 'hdr/sky.hdr').then((t) => { t.mapping = THREE.EquirectangularReflectionMapping; hdr = t; }));
  await Promise.all(jobs);
  return { models, textures, hdr };
}

// PBR material from a Poly Haven texture set (ARM = AO / roughness / metal packed in R/G/B).
export function pbr(A, id, { repeat = [1, 1], color = '#ffffff', normalScale = 1, metal = false, envMapIntensity = 1 } = {}) {
  const T = A.textures[id];
  const c = (t) => { const k = t.clone(); k.repeat.set(repeat[0], repeat[1]); k.needsUpdate = true; return k; };
  const m = new THREE.MeshStandardMaterial({
    map: c(T.map), normalMap: c(T.normalMap), roughnessMap: c(T.arm), aoMap: c(T.arm), metalnessMap: metal ? c(T.arm) : null,
    color, roughness: 1, metalness: metal ? 1 : 0, normalScale: new THREE.Vector2(normalScale, normalScale), envMapIntensity,
  });
  return m;
}
