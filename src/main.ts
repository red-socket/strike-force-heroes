// Boot: load the converted SWF library, create the Pixi app and run the fixed 30 Hz loop.
import { Application, Rectangle } from 'pixi.js';
import { toFlashKey } from './flash/as3';
import { initRuntime, mouse } from './flash/runtime';
import { audioContext, installTimelineSound, loadSounds, setMasterVolume } from './flash/sound';
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
  const lib = await Library.load();
  const app = new Application();
  await app.init({ width: W, height: H, background: 0x000000, antialias: true, autoDensity: true, resolution: 1, useBackBuffer: true, preference: 'webgl' });
  installSwfMasks();
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

  await Promise.all([
    loadSounds(lib),
    lib.preloadClasses(['LoaderScreen', 'BH', 'Logo_Armor', 'Logo_NotDoppler', 'Logo_Sky9Games', 'Menu', 'Hud', 'UnitMC']),
  ]);
  installTimelineSound(lib, () => SD.sound);
  registerTimelineScripts();
  registerAll();

  const main = new Main();
  app.stage.addChild(main);

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
  window.addEventListener('blur', () => main.flashDeactivate());
  window.addEventListener('focus', () => main.flashActivate());

  // --- fixed-step loop: timelines advance, then game logic, then render ---
  let acc = 0;
  let last = performance.now();
  const frame = (now: number) => {
    acc += Math.min(200, now - last);
    last = now;
    let stepped = false;
    while (acc >= TICK) {
      acc -= TICK;
      SwfClip.tick(app.stage);
      main.EnterFrame();
      SwfClip.flushPending();
      stepped = true;
    }
    if (stepped) app.render();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  // Dev hooks: drive the game deterministically from tests / the console (works in hidden tabs).
  const step = (n = 1) => {
    for (let i = 0; i < n; i++) {
      SwfClip.tick(app.stage);
      main.EnterFrame();
      SwfClip.flushPending();
    }
    app.render();
  };
  /** Click at stage coordinates (800x600 space). */
  const click = (x: number, y: number) => {
    mouse.x = x;
    mouse.y = y;
    mouse.down = true;
    main.MouseDown();
    mouse.down = false;
    main.MouseUp();
  };
  /** Save the current frame to .snaps/<name>.png via the dev server. */
  const snap = async (name = 'snap') => {
    app.render();
    const url = await app.renderer.extract.base64({ target: app.stage, frame: new Rectangle(0, 0, W, H), resolution: 1 });
    await fetch(`/__snap?name=${encodeURIComponent(name)}`, { method: 'POST', body: url });
    return name;
  };
  const mute = (on = true) => setMasterVolume(on ? 0 : 1);
  /** Dev: click through loader → logos → menu → Quick Match with `bots` added, and start it. */
  const quickmatch = async (bots = 3) => {
    const cur = () => main.children[0] as any;
    const centre = (o: any) => {
      const b = o.getBounds();
      return [b.x + b.width / 2, b.y + b.height / 2] as const;
    };
    step(3);
    click(...centre(cur().txt_play));
    step(45);
    for (let i = 0; i < 3; i++) {
      try {
        click(...centre(cur().skip));
      } catch {
        /* no skip button */
      }
      step(5);
    }
    step(60);
    if (cur().child('menfr').currentLabel === 'name') (click(390, 533), step(40));
    click(120, 584); // Play
    step(30);
    click(160, 533); // Quick Match
    step(30);
    if (cur().child('menfr').currentLabel !== 'quickmatch') (click(500, 393), step(40)); // tutorial warning
    for (let i = 0; i < bots; i++) (click(362, 445), step(3));
    click(680, 520); // Start Game
    const t0 = performance.now();
    while (cur()?.constructor.name !== 'Game' && performance.now() - t0 < 20000) await new Promise((r) => setTimeout(r, 50));
    step(1);
    return cur();
  };
  (window as any).sfh = { app, lib, main, step, click, snap, mouse, mute, quickmatch, audio: audioContext() };
}

boot();
