// Lettering + clock dials painted on canvases. Gilt letters are alpha-masked onto the gold PBR material so
// they pick up the same tarnish and env reflections as the rest of the gilding.
import * as THREE from 'three';

const FONT = '"Cormorant Garamond", "Playfair Display", "Times New Roman", Georgia, serif';
export function letterMask(text, { w = 2048, h = 256, size = 180, spacing = 0.18, weight = 600 } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  g.font = `${weight} ${size}px ${FONT}`; g.textBaseline = 'middle'; g.fillStyle = '#fff';
  const chars = [...text], sp = size * spacing, widths = chars.map((ch) => g.measureText(ch).width), total = widths.reduce((a, b) => a + b, 0) + sp * (chars.length - 1);
  const k = Math.min(1, (w * 0.94) / total); g.save(); g.translate(w / 2 - (total * k) / 2, h / 2); g.scale(k, 1);
  let x = 0; chars.forEach((ch, i) => { g.fillText(ch, x, 0); x += widths[i] + sp; }); g.restore();
  // chips knocked out of the gilding
  for (let i = 0; i < w * 0.06; i++) { g.fillStyle = '#000'; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 4, 0, 6.3); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return t;
}
// a sign plane of gilt letters (alphaTest on the gold material clone)
export function giltText(gold, text, width, height, opts) {
  const m = gold.clone(); m.alphaMap = letterMask(text, opts); m.alphaTest = 0.5; m.side = THREE.DoubleSide;
  m.onBeforeCompile = gold.onBeforeCompile; m.customProgramCacheKey = gold.customProgramCacheKey;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), m); mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}
// enamel clock dial, roman numerals, hands stopped
export function clockDial({ hours = 11, minutes = 47, size = 1024 } = {}) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'), R = size / 2;
  const grad = g.createRadialGradient(R, R, R * 0.1, R, R, R); grad.addColorStop(0, '#d9cfb8'); grad.addColorStop(1, '#a89a7e');
  g.fillStyle = grad; g.beginPath(); g.arc(R, R, R, 0, 6.3); g.fill();
  // grime + rust bleeding from the centre arbor and numerals
  for (let i = 0; i < 2200; i++) { const a = Math.random() * 6.3, r = Math.random() * R; g.fillStyle = `rgba(${60 + Math.random() * 40},${40 + Math.random() * 20},20,${Math.random() * 0.07})`; g.beginPath(); g.arc(R + Math.cos(a) * r, R + Math.sin(a) * r, 2 + Math.random() * 18, 0, 6.3); g.fill(); }
  for (let i = 0; i < 40; i++) { const x = R + (Math.random() - 0.5) * R * 1.6; const lg = g.createLinearGradient(x, R * 0.2, x, R * 1.9); lg.addColorStop(0, 'rgba(70,45,25,0)'); lg.addColorStop(0.5, 'rgba(70,45,25,.18)'); lg.addColorStop(1, 'rgba(70,45,25,0)'); g.fillStyle = lg; g.fillRect(x, R * 0.2, 2 + Math.random() * 6, R * 1.7); }
  g.strokeStyle = '#1b1612'; g.lineWidth = size * 0.012; g.beginPath(); g.arc(R, R, R * 0.93, 0, 6.3); g.stroke(); g.beginPath(); g.arc(R, R, R * 0.72, 0, 6.3); g.stroke();
  for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2; g.lineWidth = i % 5 ? size * 0.004 : size * 0.012; g.beginPath(); g.moveTo(R + Math.sin(a) * R * 0.86, R - Math.cos(a) * R * 0.86); g.lineTo(R + Math.sin(a) * R * 0.92, R - Math.cos(a) * R * 0.92); g.stroke(); }
  const rom = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  g.fillStyle = '#16120e'; g.textAlign = 'center'; g.textBaseline = 'middle';
  rom.forEach((s, i) => { const a = (i / 12) * Math.PI * 2; g.save(); g.translate(R + Math.sin(a) * R * 0.79, R - Math.cos(a) * R * 0.79); g.rotate(a); g.font = `600 ${size * 0.085}px ${FONT}`; g.fillText(s, 0, 0); g.restore(); });
  const hand = (ang, len, wd) => { g.save(); g.translate(R, R); g.rotate(ang); g.fillStyle = '#120e0a'; g.beginPath(); g.moveTo(-wd, R * 0.12); g.lineTo(wd, R * 0.12); g.lineTo(wd * 0.5, -len); g.lineTo(0, -len - wd * 3); g.lineTo(-wd * 0.5, -len); g.closePath(); g.fill(); g.beginPath(); g.arc(0, -len * 0.7, wd * 2.4, 0, 6.3); g.lineWidth = wd * 0.7; g.strokeStyle = '#120e0a'; g.stroke(); g.restore(); };
  hand(((hours % 12) + minutes / 60) / 12 * Math.PI * 2, R * 0.5, size * 0.016); hand(minutes / 60 * Math.PI * 2, R * 0.74, size * 0.011);
  g.fillStyle = '#120e0a'; g.beginPath(); g.arc(R, R, size * 0.025, 0, 6.3); g.fill();
  // a crack across the enamel
  g.strokeStyle = 'rgba(20,14,10,.8)'; g.lineWidth = 2; g.beginPath(); let x = R * 0.25, y = R * 0.55; g.moveTo(x, y); for (let i = 0; i < 14; i++) { x += 20 + Math.random() * 40; y += (Math.random() - 0.3) * 40; g.lineTo(x, y); } g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
// painted board sign (game halls): faded gilt on oxblood or bottle green, with peeling
export function paintedSign(text, { bg = '#4a1512', fg = '#c9a24f', w = 2048, h = 320, sub = '' } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 5000; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,230,200'},${Math.random() * 0.06})`; g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 30, 1 + Math.random() * 3); }
  g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(18, 18, w - 36, h - 36); g.lineWidth = 2; g.strokeRect(32, 32, w - 64, h - 64);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `700 ${h * (sub ? 0.42 : 0.52)}px ${FONT}`; g.fillText(text, w / 2, h * (sub ? 0.42 : 0.53));
  if (sub) { g.font = `italic 500 ${h * 0.16}px ${FONT}`; g.fillText(sub, w / 2, h * 0.78); }
  // peeled paint showing grey timber
  for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(${90 + Math.random() * 30},${85 + Math.random() * 25},${75 + Math.random() * 20},${0.5 + Math.random() * 0.4})`; g.beginPath(); const x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); for (let k = 0; k < 7; k++) g.lineTo(x + (Math.random() - 0.5) * 120, y + (Math.random() - 0.5) * 50); g.fill(); }
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(10,6,4,.45)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
