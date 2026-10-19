// Boot: load the converted SWF library, create the Pixi app and run the fixed 30 Hz loop.
import { Application, Filter } from 'pixi.js';
import { toFlashKey } from './flash/as3';
import { initRuntime, mouse } from './flash/runtime';
import { installTimelineSound, loadSounds, setMasterVolume } from './flash/sound';
import { Library } from './swf/Library';
import { SwfClip, installSwfMasks } from './swf/display';
import { Main } from './game/Main';
import { SD } from './game/SD';
import { registerAll } from './game/registry';
import { registerTimelineScripts } from './game/timelineScripts';

const W = 800;
const H = 600;
const TICK = 1000 / 30;

async function boot() {
  const host = document.getElementById('game')!;
  // ?mute starts with all audio silenced (dev/testing).
  if (new URLSearchParams(location.search).has('mute')) setMasterVolume(0);
  const status = (text: string, frac?: number) => {
    const t = document.getElementById('loading-text');
    const bar = document.getElementById('loading-bar');
    if (t) t.textContent = text;
    if (bar && frac !== undefined) bar.style.width = `${Math.round(frac * 100)}%`;
  };
  status('Loading game data…', 0.05);
  const lib = await Library.load();
  const app = new Application();
  await app.init({ width: W, height: H, background: 0x000000, antialias: true, autoDensity: true, resolution: 1, useBackBuffer: true, preference: 'webgl' });
  installSwfMasks();
  // Filters (glows, blurs, colour transforms) render at the screen's pixel density with MSAA, like the
  // rest of the vector art, instead of Pixi's default 1× aliased intermediate textures.
  Filter.defaultOptions.resolution = 'inherit';
  Filter.defaultOptions.antialias = 'inherit';
  host.appendChild(app.canvas);
  app.ticker.stop();
  initRuntime(lib, app.renderer, app.stage);

  // Fit 800x600 into the window, rendering at device resolution so vector art stays crisp.
  const fit = () => {
    const s = Math.min(window.innerWidth / W, window.innerHeight / H);
    app.renderer.resolution = Math.max(1, s * window.devicePixelRatio);
    app.renderer.resize(W, H);
    app.canvas.style.width = `${W * s}px`;
    app.canvas.style.height = `${H * s}px`;
  };
  fit();
  window.addEventListener('resize', fit);

  status('Loading sounds and graphics…', 0.3);
  await Promise.all([
    loadSounds(lib, 'assets/', (d, n) => status('Loading sounds and graphics…', 0.3 + 0.6 * (d / n))),
    lib.preloadClasses(['LoaderScreen', 'BH', 'Logo_Armor', 'Logo_NotDoppler', 'Logo_Sky9Games', 'Menu', 'Hud', 'UnitMC']),
  ]);
  installTimelineSound(lib, () => SD.sound);
  registerTimelineScripts();
  registerAll();

  const main = new Main();
  app.stage.addChild(main);
  document.getElementById('loading')?.remove();

  // --- input (Flash stage events) ---
  const toStage = (e: PointerEvent | WheelEvent) => {
    const r = app.canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left) / r.width) * W;
    mouse.y = ((e.clientY - r.top) / r.height) * H;
  };
  window.addEventListener('pointermove', toStage);
  app.canvas.addEventListener('pointerdown', (e) => {
    toStage(e);
    mouse.down = true;
    main.MouseDown();
  });
  window.addEventListener('pointerup', (e) => {
    toStage(e);
    if (!mouse.down) return;
    mouse.down = false;
    main.MouseUp();
  });
  app.canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      main.MouseWheel(-Math.sign(e.deltaY));
    },
    { passive: false },
  );
  app.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('keydown', (e) => {
    if (e.repeat && e.keyCode !== 8) return; // Flash sends repeats too, but the game only tracks state
    if ([32, 37, 38, 39, 40, 9].includes(e.keyCode)) e.preventDefault();
    main.KeyDown(toFlashKey(e));
  });
  window.addEventListener('keyup', (e) => main.KeyUp(toFlashKey(e)));
  // Flash's DEACTIVATE auto-pauses matches; the dev harness can opt out for background-tab testing.
  window.addEventListener('blur', () => !(window as any).sfhIgnoreBlur && main.flashDeactivate());
  window.addEventListener('focus', () => main.flashActivate());

  // --- fixed-step loop: timelines advance, then game logic, then render ---
  let acc = 0;
  let last = performance.now();
  const frame = (now: number) => {
    requestAnimationFrame(frame);
    if ((window as any).sfhPaused) {
      // Test harness drives the game with sfh.step(); keep the real-time loop out of the way.
      last = now;
      acc = 0;
      return;
    }
    acc += Math.min(200, now - last);
    last = now;
    let stepped = false;
    while (acc >= TICK) {
      acc -= TICK;
      // Like Flash, an uncaught error aborts the rest of this frame's handler but not the player.
      try {
        SwfClip.tick(app.stage);
        main.EnterFrame();
        SwfClip.flushPending();
      } catch (e) {
        console.error(e);
      }
      stepped = true;
    }
    if (stepped) app.render();
  };
  requestAnimationFrame(frame);
  // Test harness (window.sfh): always in dev, in builds only with ?harness.
  if (import.meta.env.DEV || new URLSearchParams(location.search).has('harness')) (await import('./dev')).installDevHarness(app, lib, main);
}

boot();
