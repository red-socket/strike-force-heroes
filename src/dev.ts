// Dev/test harness exposed as window.sfh.* (loaded by main.ts in dev builds only).
// Lets tests jump straight into any match or campaign stage and drive input deterministically.
import type { Application } from 'pixi.js';
import { Rectangle } from 'pixi.js';
import { mouse } from './flash/runtime';
import { setMasterVolume } from './flash/sound';
import { SwfClip } from './swf/display';
import type { Library } from './swf/Library';
import { Main } from './game/Main';
import { SD } from './game/SD';
import { MatchSettings } from './game/MatchSettings';
import { Stats_Campaign } from './game/Stats_Campaign';
import { Menu } from './game/Menu';
import { Game } from './game/Game';
import { Cutscene } from './game/Cutscene';
import { SH } from './game/SH';

export function installDevHarness(app: Application, lib: Library, main: Main): void {
  // Automated runs (?harness / Playwright) are deterministic: the real-time loop is paused, tests advance
  // with step(), and window blur doesn't auto-pause matches. Normal `npm run dev` play is unaffected.
  const automated = new URLSearchParams(location.search).has('harness') || navigator.webdriver;
  (window as any).sfhIgnoreBlur = automated;
  (window as any).sfhPaused = automated;
  const W = 800;
  const H = 600;
  const errs: string[] = [];
  const push = (s: string) => {
    if (errs.length < 200) errs.push(s.slice(0, 400));
  };
  window.addEventListener('error', (e) => push(`error: ${e.message}`));
  window.addEventListener('unhandledrejection', (e) => push(`rejection: ${String(e.reason)}`));
  const oe = console.error.bind(console);
  console.error = (...a: unknown[]) => {
    push(a.map((x) => (x instanceof Error ? `${x.message}\n${x.stack?.split('\n').slice(0, 4).join('\n')}` : String(x))).join(' '));
    oe(...a);
  };

  /** Run n ticks exactly like the real loop (errors in a tick are caught and recorded). */
  const step = (n = 1) => {
    for (let i = 0; i < n; i++) {
      try {
        SwfClip.tick(app.stage);
        main.EnterFrame();
        SwfClip.flushPending();
      } catch (e) {
        console.error('tick', e);
      }
    }
    app.render();
  };
  const key = (code: number, down: boolean) =>
    main[down ? 'KeyDown' : 'KeyUp']({ keyCode: code, charCode: 0, shiftKey: false, ctrlKey: false });
  const tap = (code: number) => (key(code, true), step(1), key(code, false));
  const move = (x: number, y: number) => ((mouse.x = x), (mouse.y = y));
  const press = () => ((mouse.down = true), main.MouseDown());
  const release = () => ((mouse.down = false), main.MouseUp());
  const click = (x: number, y: number) => (move(x, y), press(), release());
  /** Dev-server only: save the frame to .snaps/<name>.png (Playwright tests use page.screenshot instead). */
  const snap = async (name = 'snap') => {
    app.render();
    const url = await app.renderer.extract.base64({ target: app.stage, frame: new Rectangle(0, 0, W, H), resolution: 1 });
    await fetch(`/__snap?name=${encodeURIComponent(name)}`, { method: 'POST', body: url });
    return name;
  };
  const cur = () => Main.curClass as any;
  const waitFor = async (pred: () => boolean, ms = 20000) => {
    const t0 = performance.now();
    while (!pred() && performance.now() - t0 < ms) await new Promise((r) => setTimeout(r, 30));
    return pred();
  };

  /** Skip loader + render the BH cache, land on the Menu (no sponsor logos). */
  const toMenu = async () => {
    if (cur() instanceof Menu) return cur();
    if (!(main as any).bitHandler) {
      Main.DEBUGMODE = true;
      main.loadDone();
    }
    while (!(cur() instanceof Menu)) step(1);
    Main.DEBUGMODE = false; // only used to skip the sponsor logos; it also enables AI debug labels
    step(2);
    return cur();
  };

  /** Profile helper: set a class save (1 Medic, 2 Assassin, 3 Commando, 4 Tank). */
  const setClass = (cls: number, opts: Partial<{ primary: string; secondary: string; skill: string; streak: string; level: number; skin: number }>) => {
    SD.selClass = cls;
    for (const [k, v] of Object.entries(opts)) if (v !== undefined) (SD.classSaves[cls] as any)[k] = v;
    for (const v of Object.values(opts)) if (typeof v === 'string' && !SD.unlocks.includes(v)) SD.unlocks.push(v);
  };

  /** Start a quick match directly. teams: bots split across team 1/2 (player on team 1). */
  const match = async (o: {
    map?: string;
    mode?: string;
    bots?: number;
    teams?: boolean;
    diff?: number;
    score?: number;
    mod?: string;
    soldiers?: number;
    skills?: boolean;
    streaks?: boolean;
    cls?: number;
    primary?: string;
    secondary?: string;
    skill?: string;
    streak?: string;
    level?: number;
  } = {}) => {
    await toMenu();
    MatchSettings.qmMap = o.map ?? 'foundry';
    MatchSettings.qmMode = o.mode ?? 'dm';
    MatchSettings.qmTeams = o.teams ?? false;
    MatchSettings.qmDiff = o.diff ?? 1;
    MatchSettings.qmScore = o.score ?? 10;
    MatchSettings.qmMod = o.mod ?? 'none';
    MatchSettings.qmSoldiers = o.soldiers ?? 0;
    MatchSettings.qmSkills = o.skills ?? true;
    MatchSettings.qmStreaks = o.streaks ?? true;
    MatchSettings.qmBots0 = [];
    MatchSettings.qmBots1 = [];
    MatchSettings.qmBots2 = [];
    const n = o.bots ?? 3;
    for (let i = 0; i < n; i++) MatchSettings.addBot(MatchSettings.qmTeams ? (i % 2 ? 1 : 2) : 0);
    if (o.cls) setClass(o.cls, { primary: o.primary, secondary: o.secondary, skill: o.skill, streak: o.streak, level: o.level } as any);
    for (const k of Object.keys(SD.classSaves[SD.selClass] as object)) if ((SD.classSaves[SD.selClass] as any)[k] === undefined) delete (SD.classSaves[SD.selClass] as any)[k];
    MatchSettings.startQuickmatch();
    main.startClass(Game);
    await waitFor(() => cur() instanceof Game);
    step(1);
    return cur();
  };

  /** Start campaign (type 0) or challenge (type 1) stage n, including its pre-cutscene if any. */
  const campaign = async (n: number, type = 0) => {
    await toMenu();
    MatchSettings.caType = type;
    Stats_Campaign.setMatch(n);
    MatchSettings.startCampaign();
    if (!MatchSettings.preCutFrames) main.startClass(Game);
    else main.startClass(Cutscene, { type: 'pre' });
    await waitFor(() => cur() instanceof Game || cur() instanceof Cutscene);
    step(1);
    return cur();
  };

  /** Bots-only soak test: run n frames and report errors + unit summary. */
  const soak = (frames: number) => {
    const before = errs.length;
    step(frames);
    const g = cur();
    return {
      errors: errs.slice(before),
      screen: g?.constructor?.name,
      units: g?.units?.map((u: any) => `${u.unitInfo?.name}:${Math.round(u.status?.hpCur)}hp@${Math.round(u.x)},${Math.round(u.y)}`),
    };
  };

  (window as any).sfh = {
    app,
    lib,
    main,
    errs,
    step,
    key,
    tap,
    move,
    press,
    release,
    click,
    snap,
    cur,
    waitFor,
    toMenu,
    setClass,
    match,
    campaign,
    soak,
    mouse,
    mute: (on = true) => setMasterVolume(on ? 0 : 1),
    /** Let the game run on its own at 30 Hz (true) or only via step() (false, default). */
    realtime: (on = true) => ((window as any).sfhPaused = !on),
    classes: { Main, SD, MatchSettings, Stats_Campaign, Menu, Game, Cutscene, SH },
  };
}
