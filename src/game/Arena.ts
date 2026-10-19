// Port of Arena.as — the map MovieClip (symbol 1413; one labelled keyframe per layout). Owns the
// collision bitmap (`wall`), the node lists, the camera (its own x/y), screen shake, parallax and lights.
//
// Collision bitmap: the original rasterised the hidden `wallMC` with BitmapData.draw(). The port uses
// pre-rendered 1:1 PNGs (public/assets/walls/<map>_wall[_fN].png, tools/render_maps.py) decoded exactly by
// BitmapData.loadPNG, loaded by Game.preload → Arena.loadWalls before the Arena is constructed.
import { Graphics, type DestroyOptions } from 'pixi.js';
import { BitmapData } from '../flash/BitmapData';
import { uint } from '../flash/as3';
import { lib, mouseX, mouseY, Symbol } from '../flash/runtime';
import type { SwfClip } from '../swf/display';
import { Timeline } from '../swf/Timeline';
import { DownArrow } from './DownArrow';
import type { Game } from './Game';
import { Main } from './Main';
import { MatchSettings } from './MatchSettings';
import { NodeAiAction } from './NodeAiAction';
import { NodeCtfFlag } from './NodeCtfFlag';
import { NodeHoldpoint } from './NodeHoldpoint';
import { NodePhysBox } from './NodePhysBox';
import { NodePickup } from './NodePickup';
import { NodeSpawn } from './NodeSpawn';
import { NodeWaypoint } from './NodeWaypoint';
import { SD } from './SD';
import { UT } from './UT';

/**
 * AS3 `dead.rdBody.GetDefinition().userData` — the ragdoll torso sprite of a dead unit (PhysActor).
 * Works with a Box2D-style shim (GetDefinition) or a raw planck.js Body (getUserData).
 */
export function rdBodyUserData(dead: any): any {
  const b = dead.rdBody;
  return typeof b.GetDefinition === 'function' ? b.GetDefinition().userData : b.getUserData();
}

/** One cached collision frame: either a full bitmap or a sparse diff against a full ("key") frame. */
interface WallFrame {
  full?: BitmapData;
  key?: number;
  idx?: Uint32Array;
  val?: Uint32Array;
}

export class Arena extends Symbol {
  // ---- static collision-frame cache (filled by Game.preload) ----
  private static wallMap: string | null = null;
  private static wallFrames = new Map<number, WallFrame>();
  private static wallW = 0;
  private static wallH = 0;

  /** Character id + frame count of the wall clip placed on the given Arena frame label. */
  private static wallClipInfo(map: string): { frames: number } {
    const arenaId = lib.idOf('Arena');
    const tl = Timeline.of(lib.sprite(arenaId));
    const f = tl.labels.get(map);
    if (f === undefined) return { frames: 1 };
    const st = tl.stateAt(f).find((s) => s.name === 'wallMC');
    if (!st || st.id < 0) return { frames: 1 };
    return { frames: Math.max(1, lib.sprite(st.id).frames.length) };
  }

  /**
   * Load every wall frame PNG of a layout (`useMap.map`). Frames other than the first are stored as
   * sparse diffs against a full key frame when that is small (tut has 16 frames of 2756x1540).
   */
  static async loadWalls(map: string): Promise<void> {
    if (Arena.wallMap === map && Arena.wallFrames.size) return;
    Arena.wallMap = null;
    Arena.wallFrames = new Map();
    const { frames } = Arena.wallClipInfo(map);
    const url = (k: number) => `${lib.base}walls/${map}_wall${k == 1 ? '' : '_f' + k}.png`;
    const loads: Promise<BitmapData | null>[] = [];
    for (let k = 1; k <= frames; k++) {
      loads.push(
        BitmapData.loadPNG(url(k)).catch((e) => {
          console.warn('wall frame missing', map, k, e);
          return null;
        }),
      );
    }
    const bmps = await Promise.all(loads);
    const first = bmps[0];
    if (!first) throw new Error(`no collision bitmap for map "${map}"`);
    Arena.wallW = first.width;
    Arena.wallH = first.height;
    const keys: number[] = [1];
    Arena.wallFrames.set(1, { full: first });
    const n = first.argb.length;
    for (let k = 2; k <= frames; k++) {
      const b = bmps[k - 1];
      if (!b || b.width !== first.width || b.height !== first.height) continue;
      // best key frame = the one with the fewest differing pixels
      const limit = n * 0.1;
      let best = -1;
      let bestCount = Infinity;
      for (const kf of keys) {
        const ka = Arena.wallFrames.get(kf)!.full!.argb;
        let c = 0;
        for (let i = 0; i < n && c <= limit; i++) if (ka[i] !== b.argb[i]) c++;
        if (c < bestCount) ((bestCount = c), (best = kf));
      }
      if (bestCount > limit) {
        keys.push(k);
        Arena.wallFrames.set(k, { full: b });
        continue;
      }
      const ka = Arena.wallFrames.get(best)!.full!.argb;
      const idx = new Uint32Array(bestCount);
      const val = new Uint32Array(bestCount);
      let j = 0;
      for (let i = 0; i < n; i++) {
        if (ka[i] !== b.argb[i]) {
          idx[j] = i;
          val[j] = b.argb[i];
          j++;
        }
      }
      Arena.wallFrames.set(k, { key: best, idx, val });
    }
    Arena.wallMap = map;
  }

  /** Equivalent of `wall.fillRect(rect, 0); wall.draw(wallMC)` for wallMC at `frame`. */
  private static drawWallFrame(frame: number, wall: BitmapData): void {
    let wf = Arena.wallFrames.get(frame);
    if (!wf) {
      // no rendered PNG for that frame (only foundry/tut have extra frames): keep frame 1
      console.warn('no wall frame', Arena.wallMap, frame);
      wf = Arena.wallFrames.get(1);
      if (!wf) {
        wall.fillRect(0, 0, wall.width, wall.height, 0);
        return;
      }
    }
    if (wf.full) {
      wall.copyFrom(wf.full);
      return;
    }
    wall.copyFrom(Arena.wallFrames.get(wf.key!)!.full!);
    const a = wall.argb;
    const idx = wf.idx!;
    const val = wf.val!;
    for (let i = 0; i < idx.length; i++) a[idx[i]] = val[i];
  }

  // ---- timeline children used by code ----
  get wallMC(): SwfClip {
    return this.child<SwfClip>('wallMC');
  }
  get waterMC(): SwfClip | null {
    return this.maybeChild<SwfClip>('waterMC');
  }
  get midCont(): SwfClip {
    return this.child<SwfClip>('midCont');
  }
  get botCont(): SwfClip {
    return this.child<SwfClip>('botCont');
  }
  /** tut only */
  get door(): SwfClip {
    return this.maybeChild<SwfClip>('door') as SwfClip;
  }
  /** tut only */
  get elevator(): SwfClip {
    return this.maybeChild<SwfClip>('elevator') as SwfClip;
  }
  get light(): SwfClip {
    return this.maybeChild<SwfClip>('light') as SwfClip;
  }

  private game: Game;
  wall: BitmapData = null as any;
  private camFocus: any = undefined;
  private camIntenseX = NaN;
  private camIntenseY = NaN;
  private useAim = false;
  refData: BitmapData = null as any;
  refData2: BitmapData = null as any;
  private shakeX = NaN;
  private shakeY = NaN;
  private shkOffX = NaN;
  private shkOffY = NaN;
  spawns: NodeSpawn[] = null as any;
  spawnsT1: NodeSpawn[] = null as any;
  spawnsT2: NodeSpawn[] = null as any;
  waypoints: NodeWaypoint[] = null as any;
  wpOb: Record<string, NodeWaypoint> = null as any;
  aiactions: NodeAiAction[] = null as any;
  physboxes: NodePhysBox[] = null as any;
  pickups: NodePickup[] = null as any;
  holdpoints: NodeHoldpoint[] = null as any;
  ctfflags: NodeCtfFlag[] = null as any;
  lights: SwfClip[] = null as any;
  downarrows: DownArrow[] = null as any;
  flag1: NodeCtfFlag = null as any;
  flag2: NodeCtfFlag = null as any;

  /** botCont.graphics (debug waypoint lines): a Graphics child created on first use. */
  private botG: Graphics | null = null;
  botContGraphics(): Graphics {
    if (!this.botG || this.botG.destroyed) {
      this.botG = new Graphics();
      this.botCont.addChild(this.botG);
    }
    return this.botG;
  }

  constructor(param1: Game) {
    super('Arena');
    this.addFrameScript(
      1, () => this.frame2(),
      2, () => this.frame3(),
      3, () => this.frame4(),
      4, () => this.frame5(),
      5, () => this.frame6(),
      6, () => this.frame7(),
      7, () => this.frame8(),
      8, () => this.frame9(),
      9, () => this.frame10(),
    );
    this.game = param1;
    // The destination frame's script (→ Init → game.InitGame) runs inside this gotoAndStop, like FP10+.
    this.gotoAndStop(MatchSettings.useMap.map);
    this.game.bg1.gotoAndStop(MatchSettings.useMap.bg1);
    this.game.bg2.gotoAndStop(MatchSettings.useMap.bg2);
    this.game.bgSky.gotoAndStop(MatchSettings.useMap.sky);
  }

  changeWallFrame(param1 = 1, param2 = false): void {
    param1 = uint(param1);
    if (param2) {
      param1 = this.wallMC.currentFrame + 1;
    }
    this.wallMC.gotoAndStop(param1);
    this.wall.fillRect(0, 0, this.wall.width, this.wall.height, 0);
    // wall.draw(wallMC): the PNG of the frame wallMC actually landed on (gotoAndStop clamps like Flash)
    Arena.drawWallFrame(this.wallMC.currentFrame, this.wall);
  }

  protected Init(): void {
    let _loc3_ = 0;
    let _loc4_: any = undefined;
    let _loc5_: any = undefined;
    let _loc6_ = 0;
    if (Arena.wallMap !== MatchSettings.useMap.map) {
      console.error('Arena.Init: collision bitmap not preloaded for', MatchSettings.useMap.map);
    }
    // new BitmapData(wallMC.width, wallMC.height, true, 0) — the PNG has exactly those (truncated) dimensions
    this.wall = new BitmapData(
      Arena.wallMap === MatchSettings.useMap.map ? Arena.wallW : this.wallMC.width,
      Arena.wallMap === MatchSettings.useMap.map ? Arena.wallH : this.wallMC.height,
      true,
      0,
    );
    if (Arena.wallMap === MatchSettings.useMap.map) Arena.drawWallFrame(this.wallMC.currentFrame, this.wall);
    this.wallMC.visible = false;
    this.shakeX = 0;
    this.shakeY = 0;
    this.shkOffX = 0;
    this.shkOffY = 0;
    if (this.waterMC) {
      if (!MatchSettings.useMap.water) {
        this.game.water.disableWater(this.waterMC);
      } else {
        this.game.water.setWater(this.waterMC);
      }
    }
    this.spawns = [];
    this.spawnsT1 = [];
    this.spawnsT2 = [];
    this.waypoints = [];
    this.aiactions = [];
    this.physboxes = [];
    this.pickups = [];
    this.holdpoints = [];
    this.ctfflags = [];
    this.lights = [];
    this.downarrows = [];
    let _loc1_ = 1;
    let _loc2_ = 2;
    if (MatchSettings.useMode == 'ctf' && Math.random() < 0.5) {
      _loc1_ = 2;
      _loc2_ = 1;
    }
    // getChildAt(i) over numChildren: timeline children in depth order (mask holders are not Flash children)
    const kids = this.timelineChildren();
    _loc3_ = 0;
    while (_loc3_ < kids.length) {
      const c: any = kids[_loc3_];
      if (c.label == 'light') {
        this.lights.push(c);
      }
      if (c instanceof DownArrow) {
        this.downarrows.push(c);
        c.visible = false;
      }
      if (c instanceof NodeSpawn) {
        _loc4_ = c;
        if (_loc4_.team == 0) {
          this.spawns.push(c);
        }
        if (_loc4_.team == _loc1_) {
          this.spawnsT1.push(c);
        }
        if (_loc4_.team == _loc2_) {
          this.spawnsT2.push(c);
        }
      }
      if (c instanceof NodeWaypoint) {
        this.waypoints.push(c);
      }
      if (c instanceof NodeAiAction) {
        this.aiactions.push(c);
      }
      if (c instanceof NodePhysBox) {
        this.physboxes.push(c);
      }
      if (c instanceof NodePickup) {
        this.pickups.push(c);
      }
      if (c instanceof NodeHoldpoint) {
        if (MatchSettings.useMode != 'dom') {
          c.visible = false;
        } else {
          this.holdpoints.push(c);
        }
      }
      if (c instanceof NodeCtfFlag) {
        if (MatchSettings.useMode == 'ctf') {
          _loc5_ = c;
          this.ctfflags.push(_loc5_);
          if (_loc5_.team != 1) {
            (this as any)['flag' + _loc2_] = _loc5_;
            _loc5_.setTeam(_loc2_);
          } else {
            (this as any)['flag' + _loc1_] = _loc5_;
            _loc5_.setTeam(_loc1_);
          }
        } else {
          c.visible = false;
        }
      }
      _loc3_++;
    }
    // sortOn("x", NUMERIC)
    this.holdpoints.sort((a, b) => a.x - b.x);
    _loc3_ = 0;
    while (_loc3_ < this.holdpoints.length) {
      this.holdpoints[_loc3_].letter = UT.getEl(_loc3_, ['A', 'B', 'C', 'D', 'E']);
      _loc3_++;
    }
    this.wpOb = {};
    _loc3_ = 0;
    while (_loc3_ < this.waypoints.length) {
      this.wpOb[this.waypoints[_loc3_].id] = this.waypoints[_loc3_];
      this.waypoints[_loc3_].arena = this;
      _loc3_++;
    }
    _loc3_ = 0;
    while (_loc3_ < this.waypoints.length) {
      this.waypoints[_loc3_].setConnectors(this.wpOb);
      _loc3_++;
    }
    _loc3_ = 0;
    while (_loc3_ < this.aiactions.length) {
      _loc6_ = 0;
      while (_loc6_ < this.aiactions[_loc3_].con.length) {
        this.wpOb[this.aiactions[_loc3_].con.charAt(_loc6_)].setActionBox(this.aiactions[_loc3_]);
        _loc6_++;
      }
      _loc3_++;
    }
    _loc3_ = 0;
    while (_loc3_ < this.spawns.length) {
      this.spawns[_loc3_].setWaypoint(this.wpOb[this.spawns[_loc3_].id]);
      _loc3_++;
    }
    _loc3_ = 0;
    while (_loc3_ < this.spawnsT1.length) {
      this.spawnsT1[_loc3_].setWaypoint(this.wpOb[this.spawnsT1[_loc3_].id]);
      _loc3_++;
    }
    _loc3_ = 0;
    while (_loc3_ < this.spawnsT2.length) {
      this.spawnsT2[_loc3_].setWaypoint(this.wpOb[this.spawnsT2[_loc3_].id]);
      _loc3_++;
    }
    _loc3_ = 0;
    while (_loc3_ < this.pickups.length) {
      this.pickups[_loc3_].game = this.game;
      _loc3_++;
    }
    this.game.physWorld.generateWorld(this.physboxes);
    this.toggleLights();
    this.game.InitGame(this);
  }

  toggleLights(): void {
    let _loc1_ = 0;
    while (_loc1_ < this.lights.length) {
      this.lights[_loc1_].visible = SD.graphLights;
      _loc1_++;
    }
  }

  setShake(param1: number, param2: number): void {
    if (SD.screenShake) {
      if (param1 > this.shakeX) {
        this.shakeX = param1;
      }
      if (param2 > this.shakeY) {
        this.shakeY = param2;
      }
      return;
    }
  }

  setFocus(param1: any, param2 = true, param3 = 0.5): void {
    this.camFocus = param1;
    this.useAim = param2;
    this.camIntenseX = param3;
    this.camIntenseY = param3;
  }

  EnterFrame(): void {
    let _loc1_ = NaN;
    let _loc2_ = NaN;
    let _loc3_ = NaN;
    let _loc4_ = NaN;
    if (!this.shakeX) {
      this.shkOffX = 0;
    } else {
      this.shkOffX = UT.rand(-this.shakeX, this.shakeX);
      this.shakeX -= 0.2;
      if (this.shakeX < 0) {
        this.shakeX = 0;
      }
    }
    if (!this.shakeY) {
      this.shkOffY = 0;
    } else {
      this.shkOffY = UT.rand(-this.shakeY, this.shakeY);
      this.shakeY -= 0.2;
      if (this.shakeY < 0) {
        this.shakeY = 0;
      }
    }
    if (this.camFocus) {
      _loc3_ = this.camFocus.dead ? Number(rdBodyUserData(this.camFocus.dead).x) : Number(this.camFocus.x);
      _loc4_ = this.camFocus.dead ? rdBodyUserData(this.camFocus.dead).y + 50 : Number(this.camFocus.y);
      if (!this.useAim) {
        _loc1_ = Main.WIDTH * 0.5 - _loc3_;
        _loc2_ = Main.HEIGHT * 0.5 - _loc4_ + 20;
      } else {
        _loc1_ = Main.WIDTH * 0.5 - _loc3_ - (mouseX(this.game) - Main.WIDTH * 0.5) * this.camIntenseX;
        _loc2_ = Main.HEIGHT * 0.5 - _loc4_ - (mouseY(this.game) - Main.HEIGHT * 0.5) * this.camIntenseY + 20;
      }
      this.x += (_loc1_ - this.x) * 0.7;
      this.y += (_loc2_ - this.y) * 0.7;
      if (this.x > 0) {
        this.x = 0;
      }
      if (this.y > 5) {
        this.y = 0; // sic
      }
      if (this.x < -this.wall.width + Main.WIDTH) {
        this.x = -this.wall.width + Main.WIDTH;
      }
      if (this.y < -this.wall.height + Main.HEIGHT) {
        this.y = -this.wall.height + Main.HEIGHT;
      }
    }
    this.game.bg1.x = (Main.WIDTH - this.game.bg1.usebox.width) * (this.x / (Main.WIDTH - this.wall.width));
    this.game.bg1.y = (Main.HEIGHT - this.game.bg1.usebox.height) * (this.y / (Main.HEIGHT - this.wall.height));
    this.game.bg2.x = (Main.WIDTH - this.game.bg2.usebox.width) * (this.x / (Main.WIDTH - this.wall.width));
    this.game.bg2.y = (Main.HEIGHT - this.game.bg2.usebox.height) * (this.y / (Main.HEIGHT - this.wall.height));
    this.x += this.shkOffX;
    this.y += this.shkOffY;
  }

  /**
   * AS3 `destroy()` (called by Game.destroy) only did `wall.dispose()`. Name clash with Pixi's
   * Container.destroy(options): calls carrying Pixi options (the display-list teardown in
   * Main.startClass) go to Pixi.
   */
  override destroy(options?: DestroyOptions): void {
    if (options !== undefined) {
      super.destroy(options);
      return;
    }
    // this.wall.dispose(): our BitmapData is a plain typed array, released by GC with the Arena.
  }

  frame2(): void {
    this.Init();
  }
  frame3(): void {
    this.Init();
  }
  frame4(): void {
    this.Init();
  }
  frame5(): void {
    this.Init();
  }
  frame6(): void {
    this.Init();
  }
  frame7(): void {
    this.Init();
  }
  frame8(): void {
    this.Init();
  }
  frame9(): void {
    this.Init();
  }
  frame10(): void {
    this.Init();
  }
}
