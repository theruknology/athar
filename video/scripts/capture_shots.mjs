/**
 * Capture the dashboard screenshots the promo video is built from.
 *
 * The video composites static PNGs rather than a screen recording, so those PNGs are the only
 * thing keeping it honest: every time the UI or the numbers change, they have to be retaken or
 * the film starts showing a product that no longer exists. This script makes that a one-liner.
 *
 *   cd video && node scripts/capture_shots.mjs          # against the compose stack on :8080
 *   WEB=http://localhost:5173 node scripts/capture_shots.mjs
 *
 * Requires the stack to be up and seeded (`make up && make seed`). It logs in as the analyst,
 * because most pages are behind auth, and waits for the network to settle before each shot so a
 * half-rendered chart never lands in the film.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "..", "public", "shots");
/** The region manifest is imported by the composition, so it lives with the source. */
const REGIONS = path.join(HERE, "..", "src", "regions.json");

const WEB = process.env.WEB ?? "http://localhost:8080";
const EMAIL = process.env.DEMO_EMAIL ?? "analyst@athar.local";
const PASSWORD = process.env.DEMO_ANALYST_PASSWORD ?? "analyst-demo-pass";
const CHROME = process.env.CHROME_PATH ?? "/usr/bin/chromium";

/** 2000×1250 at dpr 2 — the film zooms in hard, so it needs the extra pixels. */
const VIEWPORT = { width: 2000, height: 1250, deviceScaleFactor: 2 };

/**
 * Regions the film highlights, named rather than positioned.
 *
 * This is the fix for the class of bug that kept putting the highlight box over the wrong thing:
 * the video used to carry hand-measured x/y percentages, which silently went stale every time the
 * dashboard layout changed. Here each region is a *query* run against the live DOM, and the
 * capture writes the resulting bounding boxes to `regions.json` beside the PNG. The film looks
 * regions up by name, so a moved panel re-measures itself on the next capture instead of
 * quietly mis-highlighting.
 *
 *   card  — a <section> whose <h2> title matches
 *   tile  — a StatTile whose uppercase label matches
 *   css   — an explicit selector, for things with no text of their own
 *   rows  — the first N rows of a table, as one box
 */
const SHOTS = [
  {
    name: "overview",
    path: "/",
    regions: {
      headlineTiles: { tile: "Identities", span: 4 },
      identitiesTile: { tile: "Identities" },
      posture: { card: "Privilege posture" },
      privilegedTile: { tile: "Privileged identities" },
      mfaTile: { tile: "MFA on privileged" },
      clouds: { card: "Clouds" },
      awsCard: { css: "[data-region='cloud-aws']" },
      departments: { card: "Departments" },
      severity: { card: "Findings by severity" },
    },
  },
  {
    name: "identities",
    path: "/identities?sort=-score",
    regions: {
      table: { css: "table" },
      topRows: { rows: 4 },
      scoreColumn: { column: "Score" },
      cloudsColumn: { column: "Clouds" },
    },
  },
  {
    name: "identity-detail",
    path: null, // resolved from the identities table
    regions: {
      score: { card: "Risk score" },
      history: { card: "Risk over twelve months" },
      formula: { css: "code, pre" },
    },
  },
  { name: "findings", path: "/findings", regions: { table: { css: "table" } } },
  {
    name: "timeline",
    path: "/timeline",
    regions: { chart: { css: ".recharts-wrapper" }, halflife: { card: "Permission half-life" } },
  },
  {
    name: "evaluation",
    path: "/evaluation",
    regions: {
      headline: { tile: "Precision", span: 4 },
      strength: { card: "How much these numbers prove" },
      perRule: { card: "Per-rule confusion" },
      rulesTile: { tile: "Rules exercised" },
    },
  },
  {
    name: "realexport",
    path: "/real-export",
    regions: {
      headline: { tile: "Action coverage", span: 4 },
      coverageTile: { tile: "Action coverage" },
      r7Tile: { tile: "R7 on real data" },
      distribution: { card: "Where the privilege sits" },
      worst: { card: "Worst principals by measured blast radius" },
    },
  },
  { name: "remediation", path: "/remediation", regions: {} },
  { name: "ledger", path: "/ledger", regions: { table: { css: "table" } } },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function settle(page) {
  // Two frames after the last paint: React Query swaps skeletons for data in a second pass, and
  // a screenshot taken on the first one captures the skeleton.
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
  await sleep(700);
}

/**
 * Resolve each named region to a box in **percent of the captured page**, so the film is
 * resolution-independent: the same numbers work whether the shot is 2000px or 4000px wide.
 */
async function measure(page, spec) {
  return page.evaluate((regions) => {
    // Full scrollable page, because the capture is fullPage: a region below the fold is still
    // in the PNG and must still resolve to a sane percentage.
    const W = document.documentElement.scrollWidth;
    const H = document.documentElement.scrollHeight;

    const sx = window.scrollX;
    const sy = window.scrollY;
    const pct = (r) => ({
      x: +(((r.left + sx + r.width / 2) / W) * 100).toFixed(2),
      y: +(((r.top + sy + r.height / 2) / H) * 100).toFixed(2),
      w: +((r.width / W) * 100).toFixed(2),
      h: +((r.height / H) * 100).toFixed(2),
    });

    const union = (els) => {
      const boxes = els.map((e) => e.getBoundingClientRect()).filter((r) => r.width && r.height);
      if (!boxes.length) return null;
      const left = Math.min(...boxes.map((b) => b.left));
      const top = Math.min(...boxes.map((b) => b.top));
      const right = Math.max(...boxes.map((b) => b.right));
      const bottom = Math.max(...boxes.map((b) => b.bottom));
      return { left, top, width: right - left, height: bottom - top };
    };

    const norm = (t) => (t || "").trim().toLowerCase();

    /** A StatTile is whatever element carries the label; walk up to the tile box itself. */
    const findTile = (label) => {
      return (
        [...document.querySelectorAll("a,button,div")].find((el) => {
          const first = el.querySelector(":scope > span");
          // `.tabular` is what separates a KPI tile from the sidebar link of the same name.
          return (
            first &&
            norm(first.textContent) === norm(label) &&
            el.querySelector(":scope > span.tabular")
          );
        }) ?? null
      );
    };

    const findCard = (title) =>
      [...document.querySelectorAll("section")].find((el) => {
        const h = el.querySelector(":scope > header h2");
        return h && norm(h.textContent).startsWith(norm(title));
      }) ?? null;

    const out = { page: { w: W, h: H } };
    for (const [name, q] of Object.entries(regions)) {
      let el = null;
      let els = null;

      if (q.card) el = findCard(q.card);
      else if (q.tile) {
        el = findTile(q.tile);
        if (el && q.span > 1) {
          // The headline row: take this tile plus its next siblings, as one band.
          els = [el];
          let sib = el.nextElementSibling;
          while (sib && els.length < q.span) {
            els.push(sib);
            sib = sib.nextElementSibling;
          }
        }
      } else if (q.css) el = document.querySelector(q.css);
      else if (q.rows) els = [...document.querySelectorAll("tbody tr")].slice(0, q.rows);
      else if (q.column) {
        const ths = [...document.querySelectorAll("thead th")];
        const i = ths.findIndex((th) => norm(th.textContent).startsWith(norm(q.column)));
        if (i >= 0) {
          els = [ths[i], ...[...document.querySelectorAll("tbody tr")]
            .slice(0, 8)
            .map((tr) => tr.children[i])
            .filter(Boolean)];
        }
      }

      const box = els ? union(els) : el ? el.getBoundingClientRect() : null;
      if (box && box.width && box.height) out[name] = pct(box);
    }
    return out;
  }, spec);
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--force-color-profile=srgb"],
    defaultViewport: VIEWPORT,
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(45_000);

  // --- log in -------------------------------------------------------------
  await page.goto(`${WEB}/login`, { waitUntil: "networkidle2" });
  await page.type('input[type="email"]', EMAIL);
  await page.type('input[type="password"]', PASSWORD);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2" }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await settle(page);
  if (page.url().includes("/login")) {
    throw new Error(`login failed — still on ${page.url()}. Check DEMO_ANALYST_PASSWORD.`);
  }
  console.log(`logged in as ${EMAIL}`);

  // --- the identity the film drills into ---------------------------------
  // Whichever identity currently ranks worst, not a hard-coded id: the estate is regenerated.
  // The table navigates on row click rather than wrapping cells in anchors, so drive it the way
  // a user would and read the resulting URL.
  await page.goto(`${WEB}/identities?sort=-score`, { waitUntil: "networkidle2" });
  await settle(page);
  await page.click("tbody tr");
  await page.waitForFunction(() => location.pathname.startsWith("/identities/"));
  await settle(page);
  const detailHref = new URL(page.url()).pathname;

  const regions = {};
  for (const shot of SHOTS) {
    const target = shot.path ?? detailHref;
    if (!target) {
      console.warn(`!! ${shot.name}: no target resolved, skipped`);
      continue;
    }
    await page.goto(`${WEB}${target}`, { waitUntil: "networkidle2" });
    await settle(page);
    const file = path.join(OUT, `${shot.name}.png`);
    await page.screenshot({ path: file, fullPage: true });

    const found = await measure(page, shot.regions ?? {});
    regions[shot.name] = found;
    const missing = Object.keys(shot.regions ?? {}).filter((k) => !found[k]);
    console.log(
      `${shot.name.padEnd(16)} ${target}` +
        (missing.length ? `   !! unresolved: ${missing.join(", ")}` : ""),
    );
  }

  await writeFile(REGIONS, `${JSON.stringify(regions, null, 2)}\n`);
  await browser.close();
  console.log(`\nwrote ${SHOTS.length} shots to ${path.relative(process.cwd(), OUT)}`);
  console.log(`wrote region manifest to ${path.relative(process.cwd(), REGIONS)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
