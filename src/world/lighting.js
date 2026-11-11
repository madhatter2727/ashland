// ASHLAND lighting: one place for every daylight number. Late afternoon, about 4:30 pm in early autumn:
// a warm low sun in the south-west (behind the player's left shoulder when looking at the castle from
// the hub), a clean blue sky with fair-weather cumulus, soft blue skylight in the shadows, a light warm haze
// on the horizon. main.js, sky.js, materials.js and nightfall.js all read from here; nightfall only blends
// these toward its night values as the waves climb.
import * as THREE from 'three';

const dir = (azDeg, elDeg) => { const a = THREE.MathUtils.degToRad(azDeg), e = THREE.MathUtils.degToRad(elDeg); return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)).normalize(); };

export const LIGHTING = {
  // sun: azimuth measured from +z (south, the Main Street gate) toward +x (east); -55 = south-west.
  // Elevation 24 deg gives long but readable shadows and rakes the castle's south front at an angle.
  sunAzimuth: -55, sunElevation: 24,
  sunColor: '#ffd9a8', sunIntensity: 3.6,
  // sky / ground bounce
  hemiSky: '#a9c6ec', hemiGround: '#8a7458', hemiIntensity: 1.15,
  // image-based light from a real partly-cloudy daylight HDRI (Poly Haven kloofendal_48d_partly_cloudy_puresky, CC0)
  hdri: 'sky_day.hdr', envIntensity: 0.75, envRotation: 1.1,
  // aerial perspective: a light warm-blue haze, not fog
  fogColor: [0.66, 0.74, 0.84], fogDensity: 0.0042,
  exposure: 1.0,
  // viewmodel lights (gun scene)
  vmSunColor: '#ffe0b8', vmSunIntensity: 2.4, vmHemiSky: '#b4cbe8', vmHemiGround: '#6e5e4a', vmHemiIntensity: 1.1, vmEnv: 0.7,
  // painted sky dome
  sky: { zenith: [0.17, 0.36, 0.72], mid: [0.42, 0.62, 0.9], horizon: [0.86, 0.84, 0.8], sunGlow: [1.6, 1.05, 0.6], cloudLit: [1.25, 1.12, 0.98], cloudShade: [0.62, 0.68, 0.8], cloudCover: 0.42 },
  // surfaces: 0 = bone dry. Puddles and damp sheen scale by this (the park was hosed down this morning).
  wetness: 0.12,
  // shadow camera covers the playable park plus the castle's towers
  shadow: { extent: 56, far: 220, bias: -0.0003, normalBias: 0.03 },
};
// unit vector pointing *toward* the sun
export const SUN_DIR = dir(LIGHTING.sunAzimuth, LIGHTING.sunElevation);
