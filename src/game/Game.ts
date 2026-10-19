// Port of Game.as — the match screen: background layers, Arena, PhysWorld, Water, BitScreen, Hud, Radar,
// Aimer, entity arrays and the per-frame update order (kept exactly).
import { Container, Graphics, type DestroyOptions } from 'pixi.js';
import { uint, type FlashKeyboardEvent } from '../flash/as3';
import { lib } from '../flash/runtime';
import { Timeline } from '../swf/Timeline';
import { AI } from './AI';
import { Aimer } from './Aimer';
import { Arena } from './Arena';
import { Bg } from './Bg';
import { BgSky } from './BgSky';
import { BitScreen } from './BitScreen';
import { Cutscene } from './Cutscene';
import { Effect } from './Effect';
import { Hud } from './Hud';
import { Killstreak_Airstrike } from './Killstreak_Airstrike';
import { Killstreak_Gas } from './Killstreak_Gas';
import { Killstreak_Helicopter } from './Killstreak_Helicopter';
import { Killstreak_Radar } from './Killstreak_Radar';
import { Main, type Screen } from './Main';
import { MatchSettings } from './MatchSettings';
import { Menu } from './Menu';
import { Particle } from './Particle';
import { PhysWorld } from './PhysWorld';
import { Player } from './Player';
import { Radar } from './Radar';
import { SD } from './SD';
import { SH } from './SH';
import { Stats_Achievements } from './Stats_Achievements';
import { Stats_Campaign } from './Stats_Campaign';
import { Stats_MapParticles } from './Stats_MapParticles';
import { UT } from './UT';
import { Water } from './Water';

export class Game extends Container implements Screen {
  private main: Main;
  bg2: Bg = null as any;
  bg1: Bg = null as any;
  bgSky: BgSky = null as any;
  arena: Arena = null as any;
  private mapParticles: Stats_MapParticles = null as any;
  physWorld: PhysWorld = null as any;
  hud: Hud = null as any;
  player: Player = null as any;
  units: any[] = null as any;
  unitCont: Container = null as any;
  /** Flash Shape → Pixi Graphics (tracers / laser sights; cleared every frame). */
  lineCont: Graphics = null as any;
  killstreaks: any[] = null as any;
  effects: any[] = null as any;
  bullets: any[] = null as any;
  matchSettings: MatchSettings = null as any;
  bitscreen: BitScreen = null as any;
  private fc = 0; // uint
  aimer: Aimer = null as any;
  radar: Radar = null as any;
  water: Water = null as any;
  gameStarted = false;
  gameEnded = false;
  paused = false;

  /**
   * Awaited by Main.startClass before construction (MatchSettings.useMap is already decided):
   * loads the collision PNG frames of the layout and the textures of the map frame, its
   * backgrounds and the match HUD/unit symbols (avoids pop-in).
   */
  static async preload(_params: Record<string, any>): Promise<void> {
    const useMap = MatchSettings.useMap;
    const ids = new Set<number>();
    const addFrame = (cls: string, label: string) => {
      if (!(cls in lib.data.classes)) return;
      const tl = Timeline.of(lib.sprite(lib.idOf(cls)));
      const f = tl.labels.get(label) ?? (Number.isNaN(Number(label)) ? undefined : Number(label));
      if (f === undefined) return;
      for (const st of tl.stateAt(f)) if (st.id >= 0) ids.add(st.id);
    };
    addFrame('Arena', useMap.map);
    addFrame('Bg', useMap.bg1);
    addFrame('Bg', useMap.bg2);
    addFrame('BgSky', useMap.sky);
    await Promise.all([
      Arena.loadWalls(useMap.map),
      lib.preload(ids),
      lib.preloadClasses(['Hud', 'Radar', 'Aimer', 'Unit', 'ScoreBar', 'Helicopter', 'DownArrow']),
    ]);
  }

  constructor(param1: Main, param2: Record<string, any>) {
    super();
    this.main = param1;
    this.bgSky = new BgSky();
    this.addChild(this.bgSky);
    this.bg2 = new Bg();
    this.addChild(this.bg2);
    this.bg1 = new Bg();
    this.addChild(this.bg1);
    this.matchSettings = new MatchSettings(this);
    this.mapParticles = new Stats_MapParticles(this, MatchSettings.useMap.particles);
    this.physWorld = new PhysWorld(this);
    this.water = new Water(this);
    // Arena.Init() and this.InitGame() run inside this constructor call (Arena frame script).
    this.arena = new Arena(this);
    if (MatchSettings.useMap.song) {
      SH.playMusic(MatchSettings.useMap.song);
    }
  }

  InitGame(param1: any): void {
    this.arena = param1;
    this.addChild(this.arena);
    this.aimer = new Aimer();
    this.bitscreen = new BitScreen(this);
    this.addChild(this.bitscreen);
    this.unitCont = new Container();
    this.lineCont = new Graphics();
    this.arena.midCont.addChild(this.unitCont);
    this.arena.midCont.addChild(this.lineCont);
    this.arena.midCont.addChild(this.physWorld);
    this.arena.midCont.addChild(this.water);
    this.effects = new Array();
    this.bullets = new Array();
    this.units = new Array();
    this.killstreaks = new Array();
    this.radar = new Radar(this, this.arena.wallMC);
    this.hud = new Hud(this);
    this.addChild(this.hud);
    this.hud.addChild(this.radar);
    this.player = new Player(this, MatchSettings.usePlayer);
    this.createUnit(this.player);
    let _loc2_ = 0;
    while (_loc2_ < MatchSettings.useBots.length) {
      this.createUnit(new AI(this, MatchSettings.useBots[_loc2_]));
      _loc2_++;
    }
    this.hud.addExp();
    if (MatchSettings.useMode == 'jug') {
      UT.randEl(this.units).setJug();
    }
    this.addChild(this.aimer);
    this.matchSettings.Init();
    this.mapParticles.mapInit();
  }

  startGame(): void {
    this.gameStarted = true;
    this.paused = false;
  }

  endGame(param1: boolean): void {
    if (!this.gameEnded) {
      this.gameEnded = true;
      this.hud.won = param1;
      this.hud.gotoAndPlay('end');
      if (!MatchSettings.isCampaign) {
        // analytics: Log.CustomMetric("Quickmatches Played","Matches");
      } else {
        // analytics: Log.CustomMetric((MatchSettings.caType != 0 ? "Challenges" : "Campaigns") + " Played","Matches");
      }
      // analytics: Log.CustomMetric(Stats_Classes.getClass(this.player.unitInfo.num).name + " Matches","Soldiers");
      return;
    }
  }

  EnterFrame(): void {
    let _loc1_ = 0;
    let _loc2_ = 0;
    let _loc3_ = 0;
    let _loc4_ = 0;
    let _loc5_: any = undefined;
    let _loc6_: any = undefined;
    if (!this.paused) {
      this.fc = uint(this.fc + 1);
      if (Boolean(MatchSettings.useExtra.randomTeam) && this.fc % MatchSettings.useExtra.randomTeam == 0) {
        _loc1_ = 0;
        while (_loc1_ < 20) {
          _loc3_ = uint(UT.irand(1, this.units.length - 1));
          _loc4_ = uint(UT.irand(1, this.units.length - 1));
          _loc5_ = this.units[_loc3_];
          _loc6_ = this.units[_loc4_];
          this.units[_loc3_] = _loc6_;
          this.units[_loc4_] = _loc5_;
          _loc1_++;
        }
        _loc2_ = uint(this.units.length * 0.5);
        _loc1_ = 1;
        while (_loc1_ < _loc2_) {
          this.units[_loc1_].changeTeam(1);
          _loc1_++;
        }
        _loc1_ = _loc2_;
        while (_loc1_ < this.units.length) {
          this.units[_loc1_].changeTeam(2);
          _loc1_++;
        }
        this.hud.setMsg(this.player, 'Teams have been changed!');
      }
      if (MatchSettings.isCampaign) {
        Stats_Campaign.runScripts(this);
      }
      switch (MatchSettings.useMap.extra) {
        case 'train':
          if (this.fc % (30 * 2) != 0) {
            break;
          }
          this.arena.setShake(0, 3);
          break;
        case 'plane':
          if (this.fc % (30 * 0.5) != 0) {
            break;
          }
          this.arena.setShake(0, 2);
      }
      this.mapParticles.EnterFrame();
      this.arena.EnterFrame();
      this.physWorld.EnterFrame();
      this.lineCont.clear();
      this.bitscreen.EnterFrame();
      _loc1_ = 0;
      while (_loc1_ < this.killstreaks.length) {
        this.killstreaks[_loc1_].EnterFrame();
        _loc1_++;
      }
      this.hud.EnterFrame();
      _loc1_ = 0;
      while (_loc1_ < this.units.length) {
        this.units[_loc1_].EnterFrame();
        _loc1_++;
      }
      _loc1_ = 0;
      while (_loc1_ < this.arena.pickups.length) {
        this.arena.pickups[_loc1_].EnterFrame();
        _loc1_++;
      }
      _loc1_ = 0;
      while (_loc1_ < this.bullets.length) {
        this.bullets[_loc1_].EnterFrame();
        _loc1_++;
      }
      // quirk kept: splice then i++ skips the element that slides into slot i (purged next tick)
      _loc1_ = 0;
      while (_loc1_ < this.bullets.length) {
        if (this.bullets[_loc1_].remove) {
          this.bullets.splice(_loc1_, 1);
        }
        _loc1_++;
      }
      _loc1_ = 0;
      while (_loc1_ < this.effects.length) {
        this.effects[_loc1_].EnterFrame();
        _loc1_++;
      }
      _loc1_ = 0;
      while (_loc1_ < this.effects.length) {
        if (this.effects[_loc1_].remove) {
          this.effects.splice(_loc1_, 1);
        }
        _loc1_++;
      }
      this.matchSettings.EnterFrame();
      this.radar.EnterFrame();
      this.water.EnterFrame();
      return;
    }
    this.hud.EnterFrame();
  }

  onScreen(param1: number, param2: number, param3 = 0): boolean {
    param3 = uint(param3);
    const _loc4_: number = param1 + this.arena.x;
    const _loc5_: number = param2 + this.arena.y;
    return _loc4_ > 0 - param3 && _loc4_ < Main.WIDTH + param3 && _loc5_ > 0 - param3 && _loc5_ < Main.HEIGHT + param3;
  }

  /** `param1` is a sound class name such as 'S_Fire' (AS3 passed the class). */
  playScreenSound(param1: any, param2: number, param3: number, param4 = false): void {
    if (this.onScreen(param2, param3)) {
      SH.playSound(param1, param4);
    }
  }

  createEffect(param1: number, param2: number, param3: string, param4 = 'idle', param5 = false): void {
    if (!(!param5 && !this.onScreen(param1, param2, 80))) {
      this.effects.push(new Effect(this, param1, param2, param3, param4, 1));
      return;
    }
  }

  createEffectAtFrame(
    param1: number,
    param2: number,
    param3: string,
    param4 = 'idle',
    param5 = 1,
    param6 = false,
  ): void {
    if (!(!param6 && !this.onScreen(param1, param2, 80))) {
      this.effects.push(new Effect(this, param1, param2, param3, param4, uint(param5)));
      return;
    }
  }

  createParticle(
    param1: number,
    param2: number,
    param3: string,
    param4: number,
    param5: any,
    param6: string,
    param7 = 'idle',
    param8 = 0,
    param9 = false,
  ): void {
    if (!(!param9 && !this.onScreen(param1, param2, 300))) {
      this.effects.push(new Particle(this, param1, param2, param3, uint(param4), param5, param6, param7, uint(param8)));
      return;
    }
  }

  createUnit(param1: any, param2 = 0, param3 = 0): void {
    if (param2) {
      param1.x = param2;
    }
    if (param3) {
      param1.y = param3;
    }
    this.unitCont.addChild(param1);
    this.units.push(param1);
  }

  createKillstreak(param1: any, param2: string): void {
    switch (param2) {
      case 'chopper':
        this.killstreaks.push(new Killstreak_Helicopter(this, param1));
        SH.playSound('S_Heli', true);
        break;
      case 'airstrike':
        this.killstreaks.push(new Killstreak_Airstrike(this, param1));
        SH.playSound('S_Jet', true);
        break;
      case 'radar':
        this.killstreaks.push(new Killstreak_Radar(this, param1));
        SH.playSound('S_Radar', true);
        break;
      case 'gas':
        this.killstreaks.push(new Killstreak_Gas(this, param1));
        SH.playSound('S_Smoke', true);
    }
  }

  MouseDown(): void {
    this.player.MouseDown();
    this.hud.MouseDown();
  }

  MouseUp(): void {
    this.player.MouseUp();
    this.hud.MouseUp();
  }

  KeyDown(param1: FlashKeyboardEvent): void {
    this.player.KeyDown(param1);
  }

  KeyUp(param1: FlashKeyboardEvent): void {
    this.player.KeyUp(param1);
  }

  flashActivate(): void {}

  flashDeactivate(): void {
    if (!this.paused) {
      this.togglePause();
    }
    this.player.releaseKeys();
  }

  togglePause(): void {
    let _loc1_ = 0;
    if (!this.gameStarted || this.gameEnded) {
      return;
    }
    if (this.paused) {
      // Main.STAGE.focus = Main.STAGE; (keyboard focus: not applicable in the browser port)
      this.paused = false;
      this.aimer.visible = true;
      _loc1_ = 0;
      while (_loc1_ < this.units.length) {
        this.units[_loc1_].MC.play();
        if (this.units[_loc1_].gun.curFrame != 'idle') {
          this.units[_loc1_].MC.arm1.play();
          this.units[_loc1_].MC.arm2.play();
        }
        _loc1_++;
      }
      this.hud.gotoAndStop('idle');
    } else {
      this.paused = true;
      this.aimer.visible = false;
      _loc1_ = 0;
      while (_loc1_ < this.units.length) {
        this.units[_loc1_].MC.stop();
        this.units[_loc1_].MC.arm1.stop();
        this.units[_loc1_].MC.arm2.stop();
        _loc1_++;
      }
      this.hud.gotoAndStop('pause');
    }
    SD.saveGame();
  }

  MouseWheel(_param1?: unknown): void {
    this.player.gun.swapGuns();
  }

  /**
   * AS3 `destroy()` — match teardown, called by Hud (end screen / quit). Name clash with Pixi's
   * Container.destroy(options): a call carrying Pixi options (Main.startClass removing the screen)
   * is the display-list teardown and goes to Pixi.
   */
  override destroy(options?: DestroyOptions): void {
    if (options !== undefined) {
      super.destroy(options);
      return;
    }
    this.arena.destroy();
    this.physWorld.destroy();
    this.bitscreen.destroy();
    if (this.hud.won && MatchSettings.isCampaign && MatchSettings.caType == 1 && MatchSettings.caStage == 15) {
      Stats_Achievements.setAchievement('challenges');
    }
    if (!(Boolean(this.hud.won) && Boolean(MatchSettings.postCutFrames) && Boolean(MatchSettings.postCutFrames.length))) {
      this.main.startClass(Menu);
    } else {
      this.main.startClass(Cutscene, { type: 'post' });
    }
  }
}
