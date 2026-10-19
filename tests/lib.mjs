// Shared Playwright helpers for side-by-side fidelity checks: the original SWF in Ruffle vs the port.
// Requires the Vite dev server (npm run dev → http://127.0.0.1:5173). Output goes to .snaps/.
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

/** Where the port is served. Use your own static build (tests/serve-build.sh) so other people's edits
 *  (Vite hot reloads) don't disturb your runs: SFH_BASE=http://127.0.0.1:<port>. */
export const BASE = process.env.SFH_BASE ?? 'http://127.0.0.1:5173';
/** Static server over the repo root for the Ruffle reference (python3 -m http.server 8765 --bind 127.0.0.1). */
export const REF_BASE = process.env.SFH_REF_BASE ?? 'http://127.0.0.1:8765';
export const SNAPS = new URL('../.snaps/', import.meta.url).pathname;
mkdirSync(SNAPS, { recursive: true });

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Launch headless Chromium (GPU accelerated). */
export async function launch() {
  // Hardware GPU through ANGLE/GL: software WebGL (SwiftShader) saturates the CPU.
  return chromium.launch({
    args: ['--enable-gpu', '--use-gl=angle', '--use-angle=gl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', '--mute-audio'],
  });
}

async function newPage(browser, storageState) {
  const ctx = await browser.newContext({ viewport: { width: 800, height: 600 }, storageState });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(String(e).slice(0, 300)));
  page.on('console', (m) => m.type() === 'error' && !/ERR_NAME_NOT_RESOLVED|playtomic/i.test(m.text()) && page.errors.push(m.text().slice(0, 300)));
  return page;
}

// ------------------------------------------------------------------ original (Ruffle)

/**
 * Open the original in Ruffle. Real-time: there is no frame stepping, so use sleep() between actions.
 * Coordinates are 800x600 stage pixels (the player fills the viewport at 1:1).
 */
export async function openRef(browser, { storageState } = {}) {
  const page = await newPage(browser, storageState);
  await page.goto(`${REF_BASE}/reference/?mute`);
  await page.waitForFunction(() => window.ref && document.querySelector('ruffle-player')?.shadowRoot?.querySelector('canvas'));
  await sleep(6000); // SWF load + preloader
  return page;
}

/** Loader → (logos play out, ~20 s) → menu. Handles the first-run name screen. */
export async function refToMenu(page) {
  await page.mouse.click(394, 523); // Play
  await sleep(22000); // render + 3 sponsor intros (clicking them opens sponsor URLs)
  await page.mouse.click(390, 533); // "Continue" on the new-profile screen (harmless otherwise)
  await sleep(1500);
}

export async function refClick(page, x, y, wait = 600) {
  await page.mouse.move(x, y);
  await sleep(60);
  await page.mouse.down();
  await sleep(60);
  await page.mouse.up();
  await sleep(wait);
}

export async function snapRef(page, name) {
  const path = `${SNAPS}${name}.png`;
  await page.screenshot({ path });
  return path;
}

// ------------------------------------------------------------------ port

/** Open the port with the dev harness (window.sfh). Deterministic: drive it with sfh.step(n). */
export async function openPort(browser, { storageState } = {}) {
  const page = await newPage(browser, storageState);
  await page.goto(`${BASE}/?mute&harness`);
  await page.waitForFunction(() => window.sfh?.toMenu, null, { timeout: 60000 });
  return page;
}

/** Evaluate `fn(sfh, arg)` inside the port page. */
export const port = (page, fn, arg) => page.evaluate(`(${fn})(window.sfh, ${JSON.stringify(arg ?? null)})`);

export async function snapPort(page, name) {
  const path = `${SNAPS}${name}.png`;
  await page.evaluate(() => window.sfh.app.render());
  await page.screenshot({ path });
  return path;
}

// ------------------------------------------------------------------ comparison

/** Write .snaps/<name>.png with original (left) and port (right) side by side, labelled. */
export function sideBySide(refPath, portPath, name, width = 1200) {
  const out = `${SNAPS}${name}.png`;
  execFileSync('magick', [
    '(', refPath, '-gravity', 'north', '-background', '#400', '-splice', '0x20', '-fill', 'white', '-pointsize', '16', '-annotate', '+0+2', 'ORIGINAL (Ruffle)', ')',
    '(', portPath, '-gravity', 'north', '-background', '#040', '-splice', '0x20', '-fill', 'white', '-pointsize', '16', '-annotate', '+0+2', 'PORT', ')',
    '+append', '-resize', `${width}x`, out,
  ]);
  return out;
}
