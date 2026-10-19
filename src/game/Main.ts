// Port of Main.as — document class: owns the current screen ("curClass"), routes input,
// drives the fixed 30 Hz update, and runs the startup sequence.
import { Container } from 'pixi.js';
import type { FlashKeyboardEvent } from '../flash/as3';
import { BH } from './BH';
import { SD } from './SD';
import { SH } from './SH';
import { Stats_Classes } from './Stats_Classes';
import { Stats_Guns } from './Stats_Guns';
import { Stats_Maps } from './Stats_Maps';
import { Stats_Skills } from './Stats_Skills';
import { Stats_Streaks } from './Stats_Streaks';
import { Stats_Misc } from './Stats_Misc';
import { MatchSettings } from './MatchSettings';
import { Stats_Achievements } from './Stats_Achievements';
import { LoaderScreen } from './LoaderScreen';
import { Logo_Armor } from './Logo_Armor';
import { Logo_NotDoppler } from './Logo_NotDoppler';
import { Logo_Sky9Games } from './Logo_Sky9Games';
import { Menu } from './Menu';

/** Every top-level screen (LoaderScreen, logos, Menu, Game, Cutscene) implements this. */
export interface Screen extends Container {
  EnterFrame(): void;
  MouseDown(): void;
  MouseUp(): void;
  KeyDown(e: FlashKeyboardEvent): void;
  KeyUp(e: FlashKeyboardEvent): void;
  flashActivate(): void;
  flashDeactivate(): void;
  MouseWheel?(delta: number): void;
}

export type ScreenClass = (new (main: Main, params: Record<string, any>) => Screen) & {
  /** Optional async preparation (textures, collision bitmaps) awaited before construction. */
  preload?(params: Record<string, any>): Promise<void>;
};

export class Main extends Container {
  static STAGE: Main;
  static ARMORFIRST = true;
  static SPONSORSITE = true;
  static DEBUGMODE = false;
  static NOPLAY = false;
  static WIDTH = 800;
  static HEIGHT = 600;
  static VERSION = '1.1';
  static NEWS: string | undefined;
  static curClass: Screen | null = null;

  private bitHandler: BH | null = null;
  private achievement: Stats_Achievements | null = null;

  constructor() {
    super();
    Main.STAGE = this;
    Main.WIDTH = 800;
    Main.HEIGHT = 600;
    Main.VERSION = '1.1';
    SD.Init();
    SH.Init();
    Stats_Classes.Init();
    Stats_Guns.Init();
    Stats_Maps.Init();
    Stats_Skills.Init();
    Stats_Streaks.Init();
    Stats_Misc.Init();
    MatchSettings.Init();
    Stats_Achievements.Init();
    // Not on a sponsor site; we behave like the Armor Games build (skip buttons visible, Armor logo first).
    Main.SPONSORSITE = true;
    Main.ARMORFIRST = true;
    this.startClass(LoaderScreen);
  }

  loadDone(): void {
    this.bitHandler = new BH(this);
  }

  renderDone(): void {
    if (!Main.DEBUGMODE) this.startClass(!Main.ARMORFIRST ? Logo_NotDoppler : Logo_Armor);
    else this.startClass(Menu);
    this.achievement = new Stats_Achievements();
    this.addChild(this.achievement);
  }

  logoArmorDone(): void {
    this.startClass(!Main.ARMORFIRST ? Logo_Sky9Games : Logo_NotDoppler);
  }

  logoDopplerDone(): void {
    this.startClass(Main.ARMORFIRST ? Logo_Sky9Games : Logo_Armor);
  }

  logoSky9Done(): void {
    this.startClass(Menu);
  }

  /** One 30 Hz tick of game logic (timelines are advanced separately, before this). */
  EnterFrame(): void {
    if (!(this.bitHandler && !this.bitHandler.complete)) {
      Main.curClass?.EnterFrame();
      SH.EnterFrame();
    } else this.bitHandler.setup();
  }

  MouseDown(): void {
    Main.curClass?.MouseDown();
  }
  MouseUp(): void {
    Main.curClass?.MouseUp();
  }
  KeyDown(e: FlashKeyboardEvent): void {
    Main.curClass?.KeyDown(e);
  }
  KeyUp(e: FlashKeyboardEvent): void {
    Main.curClass?.KeyUp(e);
  }
  flashActivate(): void {
    Main.curClass?.flashActivate();
  }
  flashDeactivate(): void {
    Main.curClass?.flashDeactivate();
  }
  MouseWheel(delta: number): void {
    // Original: loader/logo screens have no MouseWheel and throw; we just ignore.
    Main.curClass?.MouseWheel?.(delta);
  }

  /**
   * Switch screens. If the class has a static `preload`, the old screen is removed immediately and
   * the new one is constructed once loading finishes (the original swapped synchronously).
   */
  startClass(cls: ScreenClass, params?: Record<string, any>): void {
    if (Main.curClass) {
      this.removeChild(Main.curClass);
      Main.curClass.destroy({ children: true });
      Main.curClass = null;
    }
    const p = params ?? {};
    const token = ++this.startToken;
    const create = () => {
      if (token !== this.startToken) return;
      Main.curClass = new cls(this, p);
      this.addChild(Main.curClass);
      if (this.achievement) this.setChildIndex(this.achievement, this.children.length - 1);
    };
    if (cls.preload) cls.preload(p).then(create, (e) => (console.error('preload failed', e), create()));
    else create();
  }
  private startToken = 0;
}
