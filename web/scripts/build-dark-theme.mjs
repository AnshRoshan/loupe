/**
 * Regenerates the dark theme:
 *  1. Collects every hardcoded hex color in the three global stylesheets.
 *  2. Rewrites each to `var(--c-<hex>)`.
 *  3. Appends/refreshes the `:root` (light = original) and
 *     `html[data-theme="dark"]` (auto-mapped) variable blocks in globals.css.
 *
 * Dark mapping heuristic (HSL):
 *  - neutrals (sat < 0.12): light surfaces flip to dark ones, dark text lightens
 *  - tinted near-whites (sat ≥ 0.12, L ≥ 0.8): become dark tinted surfaces
 *  - vivid colors: keep hue/sat, clamp lightness into a dark-mode-safe band
 *
 * Run: `node scripts/build-dark-theme.mjs` from web/.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const files = ["src/app/globals.css", "src/app/workspace.css", "src/app/refinements.css"];

function hexToHsl(hex) {
  const n = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex.slice(0, 6);
  const r = parseInt(n.slice(0, 2), 16) / 255;
  const g = parseInt(n.slice(2, 4), 16) / 255;
  const b = parseInt(n.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const chroma = max - min;
  let h = 0, s = 0;
  if (max !== min) {
    s = l > 0.5 ? chroma / (2 - max - min) : chroma / (max + min);
    if (max === r) h = ((g - b) / chroma + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / chroma + 2) / 6;
    else h = ((r - g) / chroma + 4) / 6;
  }
  return { h: h * 360, s, l, chroma };
}

function hslToHex(h, s, l) {
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const v = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * v).toString(16).padStart(2, "0");
  };
  return (f(0) + f(8) + f(4));
}

function darkFor(hex) {
  const { h, s, l, chroma } = hexToHsl(hex);
  const alpha = hex.length === 8 ? hex.slice(6) : "";
  if (chroma < 0.03) {
    // Neutral (near-white paper → near-black surface; dark ink → light text).
    let nl;
    if (l >= 0.55) nl = 0.13 + (l - 0.55) * 0.1; // surfaces: 0.13–0.18
    else if (l <= 0.45) nl = 0.86 - (0.45 - l) * 0.1; // text: ~0.82–0.86
    else nl = 1 - l; // mid grays (borders) stay mid
    return hslToHex(h, Math.min(s, 0.02), Math.min(Math.max(nl, 0.1), 0.9)) + alpha;
  }
  if (l >= 0.8) {
    // Tinted near-white (soft green/amber panels) → warm dark surface with
    // only a whisper of the original hue (no muddy olive blocks).
    return hslToHex(h, Math.min(s, 0.05), 0.21) + alpha;
  }
  if (l <= 0.45 && chroma < 0.12) {
    // Dark desaturated text → light gray text.
    return hslToHex(h, Math.min(s, 0.15), 0.82) + alpha;
  }
  // Vivid color: keep identity, just clamp lightness for dark backgrounds.
  return hslToHex(h, Math.min(s, 0.75), Math.min(Math.max(l, 0.45), 0.72)) + alpha;
}

const lightVars = new Map(); // name -> original (incl. alpha)
const darkVars = new Map();

for (const rel of files) {
  const p = join(root, rel);
  let css = readFileSync(p, "utf8");
  css = css.replace(/#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{1,5})?\b/g, (m) => {
    // 3, 4(=3+alpha? treat 4 as 3+alpha), 6, 8 hexes; normalize to 6(+2)
    let body = m.slice(1);
    if (body.length === 3) body = body.split("").map((c) => c + c).join("");
    else if (body.length === 4) body = body.slice(0, 3).split("").map((c) => c + c).join("") + body.slice(3);
    else if (body.length === 5) return m; // unusual → leave
    const lower = body.toLowerCase();
    const name = "--c-" + lower.replace(/(.{2})/g, "$1-").replace(/-$/, "");
    if (!lightVars.has(name)) {
      lightVars.set(name, body.length === 8 ? lower : lower);
      const [rgb, a] = body.length === 8 ? [body.slice(0, 6), body.slice(6)] : [body, ""];
      darkVars.set(name, darkFor(rgb) + a);
    }
    return `var(${name})`;
  });
  writeFileSync(p, css);
  console.log("rewrote", rel);
}

// The stylesheet must define every var in :root (light) and dark override.
const block =
  "\n/* ── Generated color variables (light) + dark overrides ───────────────\n" +
  "   Regenerate with: node scripts/build-dark-theme.mjs */\n" +
  ":root {\n" +
  [...lightVars].map(([n, v]) => `  ${n}: #${v};`).join("\n") +
  "\n}\n\n" +
  'html[data-theme="dark"] {\n' +
  [...darkVars].map(([n, v]) => `  ${n}: #${v};`).join("\n") +
  "\n}\n";

// Replace any previous generated block in globals.css, else append.
const gp = join(root, "src/app/globals.css");
let g = readFileSync(gp, "utf8");
const start = g.indexOf("\n/* ── Generated color variables (light) + dark overrides");
if (start !== -1) g = g.slice(0, start) + "\n" + block;
else g += block;
writeFileSync(gp, g);
console.log("variables:", lightVars.size, "dark:", darkVars.size);
