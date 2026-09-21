/**
 * Compile the dashboard's stylesheet for the film.
 *
 * The composition renders real app components, so it needs the app's real CSS — same tokens,
 * same utilities. Tailwind is run over `src/app.entry.css`, which re-exports
 * `frontend/src/index.css` and widens the scan paths to cover `video/src` too.
 *
 * One transform is applied afterwards: the `@font-face` blocks are stripped. They point at
 * absolute `/fonts/*.woff2` paths, which Vite serves happily but webpack tries to resolve as
 * modules and fails on. The film declares the same families itself in `src/fonts.ts` via
 * `staticFile()`, so dropping them here loses nothing and keeps the bundler quiet.
 *
 *   node scripts/build-css.mjs
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const TAILWIND = path.join(ROOT, "..", "frontend", "node_modules", ".bin", "tailwindcss");
const IN = path.join(ROOT, "src", "app.entry.css");
const OUT = path.join(ROOT, "src", "app.css");

execFileSync(TAILWIND, ["-i", IN, "-o", OUT, "--minify"], { stdio: "inherit" });

const css = readFileSync(OUT, "utf8");
const stripped = css.replace(/@font-face\s*\{[^}]*\}/g, "");
writeFileSync(OUT, stripped);

const dropped = (css.match(/@font-face/g) ?? []).length;
console.log(`app.css: ${(stripped.length / 1024).toFixed(1)} kB, ${dropped} @font-face blocks stripped`);
