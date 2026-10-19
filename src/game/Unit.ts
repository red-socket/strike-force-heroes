// Port of Unit.as (symbol 687) — base class of Player and AI: stats, spawning, death, killstreaks,
// surface effects, aiming/flip and the per-frame unit update (UnitEnterFrame).
import { Container, type Filter } from 'pixi.js';
import { trace, uint } from '../flash/as3';
import { Symbol } from '../flash/runtime';
import type { SwfClip, SwfTextField } from '../swf/display';
import { applyColorTransform } from '../swf/effects';
import { UT } from './UT';
import { SH } from './SH';
import { MatchSettings } from './MatchSettings';
import { Stats_Classes } from './Stats_Classes';
import { Stats_Skills } from './Stats_Skills';
import { Stats_Streaks } from './Stats_Streaks';
import { Stats_Guns } from './Stats_Guns';
import { Stats_Misc } from './Stats_Misc';
import { Stats_Achievements } from './Stats_Achievements';
import { Stats_Campaign } from './Stats_Campaign';
import { UnitMC, FrameLabelError } from './UnitMC';
import { Movement, hexStartsFF } from './Movement';
import { Status } from './Status';
import { Guns } from './Guns';
import { Score } from './Score';
import type { Game } from './Game';
import type { Debug } from './Debug';
import type { PhysActor } from './PhysActor';
import type { NodeSpawn } from './NodeSpawn';
import type { NodeWaypoint } from './NodeWaypoint';
import type { NodeCtfFlag } from './NodeCtfFlag';

/** AS3 `obj.transform.colorTransform = ct` where `ct.color = c` (multipliers 0, offsets = rgb, alpha 1). */
function setColorTransformColor(obj: Container, color: number): void {
  const f = applyColorTransform(obj as any, [0, 0, 0, 1, (color >> 16) & 255, (color >> 8) & 255, color & 255, 0]);
  const list: Filter[] = [...((obj as any)._flashFilters ?? [])];
  if (f) list.push(f);
  obj.filters = list.length ? list : null;
}

/** Hard cap for the `vital` laser-sight ray march (the original loops until it hits something). */
const LASER_MAX_STEPS = 4000;

export class Unit extends Symbol {
  get icon(): SwfClip {
    return this.child<SwfClip>('icon');
  }
  get bar_hurt(): SwfClip {
    return this.child<SwfClip>('bar_hurt');
  }
  get txt_name(): SwfTextField {
    return this.child<SwfTextField>('txt_name');
  }
  get bar_hp(): SwfClip {
    return this.child<SwfClip>('bar_hp');
  }
  get txt_level(): SwfTextField {
    return this.child<SwfTextField>('txt_level');
  }

  game: Game;
  mDown = false;
  /** AS3 uint */
  laserColor = 16711680;
  laserX = NaN;
  laserY = NaN;
  laserOX = NaN;
  laserOY = NaN;
  human: boolean;
  unitInfo: any;
  /** AS3 uint */
  team = 0;
  /** AS3 uint */
  odiff = 0;
  /** AS3 uint */
  diff = 0;
  /** AS3 int */
  pscore = 0;
  dead: PhysActor | null = null;
  private firstSpawn = true;
  /** AS3 uint */
  respawnTimer = 0;
  canUseStreak = false;
  streakInProgress = false;
  /** AS3 uint */
  sEvent = 1;
  hasFlag: NodeCtfFlag | null = null;
  isJug = false;
  onPoint = false;
  capturing = false;
  defendingFlag = false;
  flip = false;
  aimX = NaN;
  aimY = NaN;
  /** (sic) gun heading in degrees, 0 = up */
  aimRoation = NaN;
  private rotArm = NaN;
  private rotReload = 0;
  mov: Movement;
  gun: Guns;
  status: Status;
  score: Score;
  /** AS3 uint */
  private achPlug = 0;
  /** AS3 uint */
  private underWater = 0;
  /** AS3 uint bitmask of UP/DOWN/LEFT/RIGHT */
  keys = 0;
  readonly UP = 1;
  readonly DOWN = 2;
  readonly LEFT = 4;
  readonly RIGHT = 8;
  MC: UnitMC;
  spinMC: Container;
  MCfilters: Filter[] = null as unknown as Filter[];
  nextAnim: string | null = null;
  private surface: string | null = null;
  constAnim: string | null = null;
  private greenBar: number;
  private greenBarBack: number;
  private blueBar: number;
  private blueBarBack: number;
  private redBar: number;
  private redBarBack: number;
  /** AS3 uint */
  private fc = 0;

  constructor(param1: Game, param2: boolean, param3: any) {
    super('Unit');
    this.addFrameScript(0, () => this.frame1());
    this.game = param1;
    this.human = param2;
    this.unitInfo = param3;
    this.odiff = uint(this.unitInfo.diff);
    // ColorTransform objects with .color set (only the colour is used)
    this.greenBar = 3407667;
    this.greenBarBack = 39168;
    this.blueBar = 3381708;
    this.blueBarBack = 26367;
    this.redBar = 13408512;
    this.redBarBack = 13395456;
    // HP bars are resized/moved by code (Status.setBars)
    this.bar_hp.scripted = true;
    this.bar_hurt.scripted = true;
    this.spinMC = new Container();
    this.addChild(this.spinMC);
    this.MC = new UnitMC(this);
    this.spinMC.addChild(this.MC);
    this.spinMC.y = -50;
    this.MC.y = 50;
    this.mov = new Movement(this);
    this.gun = new Guns(this);
    this.status = new Status(this);
    this.score = new Score(this);
    this.team = uint(this.unitInfo.team);
    this.label = this.unitInfo.name;
    this.txt_name.text = this.label;
    if (this.unitInfo.extra.kills) {
      this.score.setKills(this.unitInfo.extra.kills);
    }
    this.MCfilters = [];
    if (!this.unitInfo.extra.noSpawn) {
      if (!this.unitInfo.extra.spawn) {
        this.spawn();
      } else {
        this.spawn(this.unitInfo.extra.spawn.x, this.unitInfo.extra.spawn.y, this.unitInfo.extra.spawn.node);
      }
    } else {
      this.visible = false;
      this.x = -4000;
      this.y = -4000;
    }
  }

  /**
   * Not in Unit.as: Game calls `units[i].EnterFrame()` on the untyped array; Player and AI define it.
   * Declared here (no-op) so `Unit[]` typing works.
   */
  EnterFrame(): void {}

  setClass(): void {
    if (this.human) {
      MatchSettings.updatePlayer();
      this.unitInfo = MatchSettings.usePlayer;
    }
    if (this.unitInfo.extra.level) {
      this.unitInfo.level = this.unitInfo.extra.level;
    }
    if (this.human) {
      trace('Get stats for level', this.unitInfo.level);
    }
    const _loc1_: any = Stats_Classes.getClass(this.unitInfo.soldier, this.unitInfo.level);
    this.unitInfo.hp = _loc1_.hp;
    this.unitInfo.crit = _loc1_.crit * 0.01;
    this.unitInfo.aim = _loc1_.aim * 0.01;
    this.unitInfo.amm = _loc1_.amm * 0.01;
    this.unitInfo.headBonus = 1.45;
    this.unitInfo.critBonus = 1.35;
    if (this.unitInfo.extra.hp) {
      this.unitInfo.hp = this.unitInfo.extra.hp;
    }
    this.unitInfo.icon = _loc1_.icon;
    this.unitInfo.startFrame = _loc1_.startFrame;
    this.unitInfo.className = _loc1_.name;
    this.unitInfo.num = _loc1_.num;
    this.unitInfo.runType = _loc1_.runType;
    this.unitInfo.id = _loc1_.id;
    this.unitInfo.frame = _loc1_.startFrame + this.unitInfo.skin;
    this.unitInfo.skill = Stats_Skills.skillOb[!MatchSettings.useSkills ? 'none' : this.unitInfo._skill];
    this.unitInfo.streak = Stats_Streaks.streakOb[!MatchSettings.useStreaks ? 'none' : this.unitInfo._streak];
    if (!MatchSettings.useMap.outdoors && Boolean(this.unitInfo.streak.special)) {
      this.unitInfo.streak = Stats_Streaks.streakOb['none'];
    }
    trace('Unit Stats', this.label, this.unitInfo.skill.name, this.unitInfo.streak.name, this.unitInfo.level);
    if (this.unitInfo.skill.id == 'health') {
      this.unitInfo.hp += this.unitInfo.skill.value;
    }
    if (this.unitInfo.skill.id == 'ammo') {
      this.unitInfo.amm += this.unitInfo.skill.value;
    }
    if (this.unitInfo.skill.id == 'critical') {
      this.unitInfo.aim += this.unitInfo.skill.value;
      this.unitInfo.crit += this.unitInfo.skill.value;
    }
    if (this.unitInfo.skill.id == 'combat') {
      this.unitInfo.hp += 10;
      this.unitInfo.amm += 0.1;
      this.unitInfo.aim += 0.03;
      this.unitInfo.crit += 0.03;
    }
    if (this.unitInfo.skill.id == 'vital') {
      this.unitInfo.headBonus += this.unitInfo.skill.value;
      this.unitInfo.critBonus += this.unitInfo.skill.value;
    }
    this.unitInfo.regen = this.unitInfo.hp * 0.001;
    if (this.unitInfo.skill.id == 'adren') {
      this.unitInfo.regen = this.unitInfo.hp * 0.001 * this.unitInfo.skill.value;
    }
    this.MC.setSkin(this.unitInfo.frame);
    if (MatchSettings.useMod != 'party') {
      this.gun.setGuns(this.unitInfo.primary, this.unitInfo.secondary);
    } else {
      this.gun.setGuns(UT.randEl<any>(Stats_Guns.classAr[UT.irand(1, 4)]).id, UT.randEl<any>(Stats_Guns.classAr[0]).id);
    }
    this.icon.gotoAndStop(this.unitInfo.icon);
    this.txt_level.text = String(this.unitInfo.level);
    if (!this.human) {
      this.setDiffStats();
    } else {
      this.game.hud.txt_classname.text = this.unitInfo.className;
      this.game.hud.icon.gotoAndStop(this.unitInfo.icon);
      this.game.hud.mc_skill.gotoAndStop(this.unitInfo.skill.sprite);
      this.game.hud.mc_skill.visible = this.unitInfo.skill.sprite != 'none';
      this.game.hud.mc_streak.gotoAndStop(this.unitInfo.streak.sprite);
      this.game.hud.mc_streak.visible = this.unitInfo.streak.sprite != 'none';
      this.game.hud.txt_level.text = 'lvl: ' + this.unitInfo.level;
      this.game.hud.addExp(0);
      this.setKillstreakNum(0);
    }
    this.endKillstreak();
    if (this.unitInfo.extra.constAnim) {
      this.constAnim = this.unitInfo.extra.constAnim;
      if (this.unitInfo.extra.paraOnce) {
        this.unitInfo.extra.constAnim = false;
      }
    }
    this.setBarColour();
    if (MatchSettings.useMode == 'jug' && !this.isJug) {
      this.changeTeam(1);
    }
  }

  changeTeam(param1: number): void {
    param1 = uint(param1);
    this.team = param1;
    this.setBarColour();
    if (Boolean(MatchSettings.useMod) && param1 == 2) {
      this.unitInfo.skin = 5;
    } else {
      this.unitInfo.skin = param1 + 1;
    }
    this.unitInfo.frame = this.unitInfo.startFrame + this.unitInfo.skin;
    this.MC.setSkin(this.unitInfo.frame);
  }

  changeSkin(param1: number): void {
    this.unitInfo.skin = uint(param1);
    this.unitInfo.frame = this.unitInfo.startFrame + this.unitInfo.skin;
    this.MC.setSkin(this.unitInfo.frame);
  }

  setBarColour(): void {
    let _loc1_: number | null = null;
    let _loc2_: number | null = null;
    switch (this.team) {
      case 0:
        if (!this.human) {
          _loc1_ = this.greenBarBack;
        } else {
          _loc1_ = this.greenBar;
        }
        _loc2_ = this.greenBar;
        break;
      case 1:
        if (!this.human) {
          _loc1_ = this.blueBarBack;
        } else {
          _loc1_ = this.blueBar;
        }
        _loc2_ = this.blueBar;
        break;
      case 2:
        _loc1_ = this.redBarBack;
        _loc2_ = this.redBar;
    }
    // (team is always 0..2; Flash would throw on a null ColorTransform)
    setColorTransformColor(this.bar_hp, _loc1_!);
    setColorTransformColor(this.icon, _loc2_!);
    this.icon.alpha = 0.7;
    setColorTransformColor(this.txt_level, _loc2_!);
    this.txt_level.alpha = 0.7;
    setColorTransformColor(this.txt_name, _loc2_!);
    this.txt_name.alpha = 0.7;
  }

  /** Overridden by AI. */
  setDiffStats(param1 = -99, param2 = false, param3 = true): void {}

  /** Overridden by Player / AI. */
  spawn(param1 = 0, param2 = 0, param3 = ''): void {}

  /** Overridden by AI. */
  getNextWaypoint(param1: NodeWaypoint | null = null, param2 = false): void {}

  unitSpawn(param1: number, param2: number, param3: string): void {
    let _loc4_ = 0; // uint
    let _loc5_: NodeSpawn | null = null;
    if (this.unitInfo.extra.noSpawn) {
      this.unitInfo.extra.noSpawn = false;
    }
    this.mov.reset();
    if (!this.human) {
      this.setClass();
    } else {
      this.setClass();
    }
    this.status.reset();
    this.MC.gotoAnim('idle');
    this.dead = null;
    this.visible = true;
    if (!(Boolean(param1) && Boolean(param2) && Boolean(param3))) {
      _loc5_ = this.getSpawnNode();
      this.setAiSpawnNode(_loc5_);
      this.x = _loc5_.x + UT.rand(-5, 5);
      this.y = _loc5_.y;
    } else {
      if (!this.human) {
        _loc4_ = 0;
        while (_loc4_ < this.game.arena.waypoints.length) {
          if (this.game.arena.waypoints[_loc4_].id == param3) {
            this.getNextWaypoint(this.game.arena.waypoints[_loc4_], true);
            break;
          }
          _loc4_++;
        }
      }
      this.x = param1;
      this.y = param2;
    }
    this.MC.angle = 0;
    this.game.createEffect(this.x, this.y - 50, 'spawn', 'idle', true);
    if (this.unitInfo.extra.permaStreak) {
      this.canUseStreak = true;
      this.useKillstreak();
    }
  }

  protected getSpawnNode(): NodeSpawn {
    let _loc1_: NodeSpawn[];
    let _loc2_: NodeSpawn;
    if (!((Boolean(MatchSettings.useMode == 'ctf') && Boolean(this.team)) || Boolean(this.unitInfo.extra.teamSpawn))) {
      _loc1_ = this.game.arena.spawns;
    } else {
      _loc1_ = (this.game.arena as any)['spawnsT' + this.team];
    }
    if (!this.firstSpawn) {
      return UT.randEl(_loc1_);
    }
    do {
      _loc2_ = UT.randEl(_loc1_);
    } while (_loc2_.initialSpawned);
    _loc2_.initialSpawned = true;
    this.firstSpawn = false;
    return _loc2_;
  }

  /** Overridden by AI. */
  protected setAiSpawnNode(param1: NodeSpawn): void {}

  die(param1: Unit, param2: Stats_Guns, param3: any): void {
    let _loc4_: any = undefined;
    let _loc5_ = 0; // uint
    let _loc6_ = NaN;
    let _loc7_ = NaN;
    if (Boolean(param3.headMult) || Boolean(param3.critMult) || param2.typeName == 'Melee') {
      switch (UT.irand(0, 2)) {
        case 0:
          this.game.playScreenSound('S_Headshot1', this.x, this.y);
          break;
        case 1:
          this.game.playScreenSound('S_Headshot2', this.x, this.y);
          break;
        case 2:
          this.game.playScreenSound('S_Headshot3', this.x, this.y);
      }
    } else if (Math.random() < 0.35) {
      switch (UT.irand(0, 5)) {
        case 0:
          this.game.playScreenSound('S_Die1', this.x, this.y);
          break;
        case 1:
          this.game.playScreenSound('S_Die2', this.x, this.y);
          break;
        case 2:
          this.game.playScreenSound('S_Die6', this.x, this.y);
          break;
        case 3:
          this.game.playScreenSound('S_Die7', this.x, this.y);
          break;
        case 4:
          this.game.playScreenSound('S_Die8', this.x, this.y);
          break;
        case 5:
          this.game.playScreenSound('S_Die9', this.x, this.y);
      }
    }
    if (!this.game.gameEnded) {
      this.game.hud.addKillFeed(this, param1, param2);
      this.score.addDeath();
      if (this != param1) {
        if (!param3.teamkill) {
          param1.score.addKill();
          if (param3.headMult) {
            ++param1.score.headshots;
          }
          ++(param1.score as any)['killed' + this.unitInfo.num];
          if (this.isJug) {
            param3.jugKill = true;
            param1.setJug();
          }
          if (this.hasFlag) {
            param3.hasFlag = true;
          }
          if (param1.human) {
            _loc5_ = uint(Math.min(Stats_Classes.getUnitExp(param1.unitInfo.level + 3), Stats_Classes.getUnitExp(this.unitInfo.level)));
            if (MatchSettings.useMod) {
              _loc5_ = uint(_loc5_ * Stats_Misc.getMod(MatchSettings.useMod).expmod);
            }
            if (MatchSettings.useExtra.expmod) {
              _loc5_ = uint(_loc5_ * MatchSettings.useExtra.expmod);
            }
            _loc5_ = uint(Math.ceil(_loc5_));
            this.game.hud.addExp(_loc5_);
            _loc6_ = this.x + UT.rand(-5, 5) - 8;
            _loc7_ = this.y - UT.rand(55, 60);
            this.game.createParticle(_loc6_, _loc7_, 'slowText', 0, null, 'expText', 'idle', 11);
            if (_loc5_ >= 10) {
              this.game.createParticle(_loc6_ + 8, _loc7_, 'slowText', 0, null, 'expText', 'idle', uint(_loc5_ * 0.1) + 1);
              this.game.createParticle(_loc6_ + 16, _loc7_, 'slowText', 0, null, 'expText', 'idle', (_loc5_ % 10) + 1);
            } else {
              this.game.createParticle(_loc6_ + 8, _loc7_, 'slowText', 0, null, 'expText', 'idle', _loc5_ + 1);
            }
          }
          if (MatchSettings.useExtra.vampire) {
            param1.status.heal(param1.status.hpMax * 0.6, true);
          }
          if (MatchSettings.useExtra.kevlarKill) {
            param1.getKevlar();
          }
        } else {
          this.score.addBetrayal();
        }
      } else {
        this.score.addSuicide();
        if (this.isJug) {
          while (true) {
            _loc4_ = UT.randEl(this.game.units);
            if (_loc4_ != this) {
              break;
            }
          }
          _loc4_.setJug();
        }
      }
      if (this.human) {
        if (!MatchSettings.useSoldiers) {
          this.game.hud.setClassChange(true);
        }
        if (param2.id == 'env2' && this.streakInProgress) {
          Stats_Achievements.setAchievement('lava');
        }
        if (param2.id == 'env3') {
          Stats_Achievements.setAchievement('drown');
        }
        this.game.hud.mc_streakarrow.visible = false;
      }
      if (this.constAnim) {
        this.game.createParticle(this.x, this.y - 110, 'move', 0, { xspd: -50, yspd: 0 }, this.constAnim, 'animate');
      }
    }
    if (this.hasFlag) {
      this.hasFlag.reset();
      this.hasFlag = null;
    }
    this.dead = this.game.physWorld.createCorpse(this, param1, param2, param3);
    this.visible = false;
    this.respawnTimer = 30 * 5;
    this.canUseStreak = false;
    if (this.human) {
      this.endKillstreak();
      this.game.aimer.x = -5000;
      this.game.aimer.y = -5000;
    }
  }

  setJug(): void {
    if (this.human) {
    }
    let _loc1_ = 0; // uint
    while (_loc1_ < this.game.units.length) {
      this.game.units[_loc1_].changeTeam(1);
      this.game.units[_loc1_].isJug = false;
      this.game.units[_loc1_].gotoAndStop(1);
      _loc1_++;
    }
    this.changeTeam(2);
    this.status.heal(999, false);
    this.isJug = true;
    this.gotoAndStop(2);
    this.game.hud.addCustomFeed(this, 'jug');
  }

  UnitEnterFrame(): void {
    let _loc1_ = 0; // uint
    ++this.fc;
    // QUIRK: fixed 2880 px bounds regardless of map size
    if (this.x < 0 || this.y < 0 || this.x > 2880 || this.y > 2880) {
      this.status.damage(9999, this, Stats_Guns.gunOb['env'], {}, true);
    }
    this.status.EnterFrame();
    this.gun.EnterFrame();
    this.MC.EnterFrame();
    this.mov.EnterFrame();
    if (this.constAnim) {
      this.game.bitscreen.paint(this.x + this.game.arena.x, this.y + this.game.arena.y - 110, true, this.constAnim + '0');
    }
    _loc1_ = 0;
    while (_loc1_ < this.game.arena.pickups.length) {
      if (!this.game.arena.pickups[_loc1_].taken) {
        if (UT.inBox(this.x, this.y, this.game.arena.pickups[_loc1_].x - 40, this.game.arena.pickups[_loc1_].y - 80, 80, 150)) {
          this.game.arena.pickups[_loc1_].getPickup(this);
        }
      }
      _loc1_++;
    }
    this.onPoint = false;
    this.capturing = false;
    _loc1_ = 0;
    while (this.game.gameStarted && _loc1_ < this.game.arena.holdpoints.length) {
      if (UT.inBox(this.x, this.y, this.game.arena.holdpoints[_loc1_].x - 120, this.game.arena.holdpoints[_loc1_].y - 100, 240, 200)) {
        this.onPoint = true;
        this.capturing = this.game.arena.holdpoints[_loc1_].curTeam != this.team;
        this.game.arena.holdpoints[_loc1_].capture(this);
      }
      _loc1_++;
    }
    _loc1_ = 0;
    while (_loc1_ < this.game.arena.ctfflags.length) {
      if (UT.inBox(this.x, this.y, this.game.arena.ctfflags[_loc1_].x - 40, this.game.arena.ctfflags[_loc1_].y - 70, 80, 95)) {
        this.game.arena.ctfflags[_loc1_].capture(this);
      }
      _loc1_++;
    }
    if (this.hasFlag) {
      if (this.fc % (!(Boolean(this.keys & this.LEFT) || Boolean(this.keys & this.RIGHT)) ? 30 : 10) == 0) {
        this.game.createEffect(this.x + UT.rand(-7, 7), this.y + UT.rand(3, 7), 'paper', 'idle' + UT.irand(1, 2));
      }
    }
    if (Boolean(this.isJug) && Boolean(MatchSettings.useExtra.jugDrain) && this.fc % 10 == 0) {
      this.status.damage(this.status.hpMax * 0.05, this, Stats_Guns.gunOb['poison'], {}, false);
    }
    if (Boolean(MatchSettings.useExtra.vampire) && this.fc % 20 == 0) {
      this.status.damage(this.status.hpMax * 0.05, this, Stats_Guns.gunOb['curse'], {}, false);
    }
    if (this.unitInfo.extra.permaRapid) {
      this.status.sRapidHeal = 100;
    }
    this.mov.resetMods();
    this.surface = this.getPixel(0, 1).toString(16).substring(2);
    if (this.human) {
      (this.game.hud.debug as unknown as Debug).debug1.text = this.surface;
    }
    switch (this.surface) {
      case 'ff00ff':
        if (this.human) {
          if (!(MatchSettings.isCampaign && MatchSettings.caType == 0 && MatchSettings.caStage == 1)) {
            if (MatchSettings.isCampaign && MatchSettings.caType == 0 && MatchSettings.caStage == 5) {
              switch (Stats_Campaign.sn) {
                case 2:
                  SH.playMusic('M_Theme');
                  this.game.hud.setMsg(this.game.player, "Sorry I'm late.", 4, true, 'V_Ca1_12');
                  this.game.player.unitInfo.extra.noShoot = false;
              }
            }
          } else {
            this.game.hud.gotoAndStop('idle');
            switch (Stats_Campaign.sn) {
              case 1:
                this.game.hud.gotoAndStop('tutjump');
                break;
              case 3:
                this.game.hud.gotoAndStop('tutduck');
                this.game.hud.setMsg(this.game.units[0], 'That looks dangerous... I should find another way around.', 5, true, 'V_Ca1_2');
                break;
              case 5:
                this.game.hud.setMsg(this.game.units[1], "What's the status, did we get them all?", 6, true, 'V_Ca1_3');
                break;
              case 6:
                this.game.hud.setMsg(this.game.units[2], 'Yes sir. There was some resistance, we lost one of our men.', 6, true, 'V_Ca1_4');
                break;
              case 7:
                this.game.hud.setMsg(this.game.units[1], 'Casualties happen. Clean the area and move on.', 5, true, 'V_Ca1_5');
                break;
              case 8:
                this.game.hud.gotoAndStop('tutshoot');
                this.game.hud.setMsg(this, "Oh, a pistol... I'm a little rusty.", 4, true, 'V_Ca1_6');
                this.gun.setGuns('USP2', 'none');
                this.unitInfo.extra.noAim = false;
                break;
              case 10:
                this.game.hud.gotoAndStop('tutclimb');
                this.game.hud.setMsg(this, "Ahhh, my legs! I... I can't jump...", 5, true, 'V_Ca1_8');
                this.status.heal(this.status.hpMax, false, true);
                this.status.damage(this.status.hpCur * 0.8, this, Stats_Guns.gunOb['env'], {}, true);
                this.mov.noJump = true;
                SH.playSound('S_Mine1');
                SH.playSound('S_Pan');
                break;
              case 11:
                SH.playSound('S_Equip');
                this.game.hud.setMsg(this, 'Nice, some more ammo and a new weapon.', 5, true, 'V_Ca1_9');
                this.gun.setGuns('M4', 'USP');
                this.gun.swapGuns();
                this.game.hud.gotoAndStop('tutswitch');
                this.mov.noJump = false;
                break;
              case 13:
                this.game.hud.setMsg(this.game.units[1], "There's one more. We can't let him escape, eliminate him!", 6, true, 'V_Ca1_10');
                this.game.units[1].setDiffStats(1, true);
                this.game.units[2].setDiffStats(1, true);
                this.game.units[3].setDiffStats(1, true);
                this.game.units[1].spawn(300, 1200, 'i');
                this.game.units[2].spawn(750, 1130, 'h');
                this.game.units[3].spawn(270, 1470, 'a');
                this.game.arena.door.gotoAndPlay('close');
            }
            _loc1_ = 0;
            while (_loc1_ < this.game.arena.downarrows.length) {
              if (Number(this.game.arena.downarrows[_loc1_].label.substring(9)) != Stats_Campaign.sn) {
                this.game.arena.downarrows[_loc1_].visible = false;
              } else {
                this.game.arena.downarrows[_loc1_].visible = true;
              }
              _loc1_++;
            }
          }
          ++Stats_Campaign.sn;
          Stats_Campaign.fc = 0;
          this.game.arena.changeWallFrame(Stats_Campaign.sn);
        }
        break;
      case 'ffff00':
        Stats_Achievements.setAchievement('tutbody');
        break;
      case '00ffff':
        this.mov.modJump = 1.8;
        this.achPlug = uint(this.achPlug + 1);
        if (this.achPlug < 10 * 30) {
          break;
        }
        Stats_Achievements.setAchievement('plug');
        break;
      case '993300':
        this.mov.modSpeed = 0.3;
        this.mov.modBrake = 0.25;
        this.mov.modJump = 0.8;
        this.mov.modSlide = 0.2;
        if (!(Math.abs(this.mov.xVel) > 5 && this.fc % 3 == 0)) {
          break;
        }
        this.game.createEffect(this.x, this.y - 4, 'mud_splash');
        break;
      case 'ccffff':
        this.mov.modSpeed = 0.3;
        this.mov.modBrake = 1;
        this.mov.modSlide = 0.3;
        break;
      case 'ffffff':
        this.mov.modMax = 0.7;
        this.mov.modJump = 0.8;
        this.mov.modBrake = 2;
        if (!(Math.abs(this.mov.xVel) > 1 && this.fc % 3 == 0)) {
          break;
        }
        this.game.createEffect(this.x, this.y - 4, 'snow_splash');
        break;
      case '670067':
        this.mov.modJump = 0.6;
        this.mov.modGrav = 0.4;
        break;
      case '6699ff':
        this.mov.modSpeed = 0.3;
        this.mov.modBrake = 1.8;
        this.mov.modGrav = 0.1;
        break;
      case '666666':
        this.mov.modMove = 8;
        break;
      case '999999':
        this.mov.modMove = -8;
        break;
      // QUIRK: "993300" is listed again here in the original (lava) but the mud case above matches first.
      case '993300':
      case '993200':
        this.status.damage(20, this, Stats_Guns.gunOb['env2'], {}, true);
        if (this.status.sFire) {
          break;
        }
        this.status.sFire = 2 * 30;
        break;
      case '330000':
      case '320000':
      case '2c0000':
      case '2a0000':
      case '2e0000':
      case '2b0000':
      case '2f0000':
      case '2d0000':
        this.status.damage(9999, this, Stats_Guns.gunOb['env'], {}, true);
        break;
      case '009999':
        if (!this.mov.crouching) {
          this.underWater = 0;
        } else {
          this.underWater = uint(this.underWater + 1);
        }
        if (this.underWater < 30 * 5) {
          break;
        }
        this.status.damage(0.5, this, Stats_Guns.gunOb['env3'], {}, true);
        break;
      default:
        this.achPlug = 0;
        this.underWater = 0;
    }
    try {
      this.MC.gotoAnim(this.nextAnim);
    } catch (e) {
      // QUIRK: Flash's gotoAndPlay(null) throws (only while nextAnim is still null, i.e. before the first
      // Movement update of the match); the exception aborted the rest of this method. (In Flash it also
      // aborted the rest of Game.EnterFrame for that tick — not reproduced.)
      if (e instanceof FrameLabelError) return;
      throw e;
    }
    this.flip = !this.mov.jumping ? UT.fixRotation(this.aimRoation - this.MC.angle) < 0 : this.aimX < this.x;
    this.MC.scale.x = !this.flip ? 1 : -1;
    // QUIRK: shoulder x-offset (MC.arm1.x) is not mirrored when flipped
    this.rotArm = UT.getRotation(this.x + this.MC.arm1.x + this.MC.angle * 1.2, this.y + this.MC.arm1.y, this.aimX, this.aimY) - 90;
    this.aimRoation = UT.fixRotation(this.rotArm + 90) + this.spinMC.angle;
    if (this.flip) {
      this.rotArm = -this.rotArm + 180;
    }
    this.rotArm = UT.fixRotation(this.rotArm - this.angle) + (!this.flip ? -this.MC.angle : this.MC.angle);
    this.rotReload += ((!(this.gun.reloading && this.rotArm < 30) ? 0 : 30) - this.rotReload) * 0.2;
    this.MC.arm1.angle = this.rotReload + this.rotArm;
    this.MC.arm2.angle = this.rotReload + this.rotArm;
    this.MC.head.angle = this.rotReload + this.rotArm * 0.6;
    if (this.unitInfo.skill.id == 'vital' && this.gun.curGun.typeName != 'Melee') {
      this.laserX = this.laserOX = this.MC.arm1.x + UT.xMoveToRot(this.aimRoation + this.MC.angle, 38);
      this.laserY = this.laserOY = this.MC.arm1.y + UT.yMoveToRot(this.aimRoation + this.MC.angle, 38);
      // DEVIATION: step cap added; the original marched until it hit something (would hang off-map).
      let steps = 0;
      while (!this.hitTestAll(this.laserX, this.laserY) && steps++ < LASER_MAX_STEPS) {
        this.laserX += UT.xMoveToRot(this.aimRoation, 15);
        this.laserY += UT.yMoveToRot(this.aimRoation, 15);
      }
      steps = 0;
      while (this.hitTestAll(this.laserX, this.laserY, true) && steps++ < LASER_MAX_STEPS) {
        this.laserX -= UT.xMoveToRot(this.aimRoation, 3);
        this.laserY -= UT.yMoveToRot(this.aimRoation, 3);
      }
      // lineCont is a Shape in AS3 (lineStyle/moveTo/lineTo) → Pixi Graphics
      this.game.lineCont
        .moveTo(this.x + this.laserOX, this.y + this.laserOY)
        .lineTo(this.x + this.laserX, this.y + this.laserY)
        .stroke({ width: 3, color: this.laserColor, alpha: 0.15 });
      this.game.bitscreen.paint(this.x + this.laserX + this.game.arena.x, this.y + this.laserY + this.game.arena.y, true, 'laserdot0');
    }
    this.MC.filters = this.MCfilters.length ? this.MCfilters.slice() : null; // Flash copies the array
  }

  useKillstreak(): void {
    let _loc1_: NodeSpawn;
    let _loc2_ = 0; // uint
    if (this.canUseStreak) {
      if (!this.dead) {
        if (this.human) {
          this.game.hud.mc_streakarrow.visible = false;
        }
        this.canUseStreak = false;
        this.streakInProgress = true;
        if (this.human) {
          this.game.hud.txt_streakready.text = this.unitInfo.streak.name + '\nin progress!';
        }
        this.game.createEffect(this.x, this.y - 100, 'useStreak');
        this.game.hud.addKillstreakFeed(this, this.unitInfo.streak);
        if (!this.unitInfo.streak.global) {
          switch (this.unitInfo.streak.id) {
            case 'mine':
              this.game.bullets.push(new Stats_Guns.gunOb['mine'].cls(this.game, this, this.aimRoation, this.x, this.y, 0, 'mine'));
              this.endKillstreak();
              break;
            case 'smoke':
              this.game.playScreenSound('S_Skill', this.x, this.y);
              this.game.createEffect(this.x, this.y - 50, 'smokeBomb', 'idle', true);
              _loc2_ = 0;
              do {
                _loc2_++;
                _loc1_ = UT.randEl<NodeSpawn>(this.game.arena.spawns);
              } while (UT.getDist(this.x, this.y, _loc1_.x, _loc1_.y) < 80 && _loc2_ < 20);
              this.setAiSpawnNode(_loc1_);
              this.x = _loc1_.x + UT.rand(-5, 5);
              this.y = _loc1_.y;
              this.mov.xVel = 0;
              this.mov.yVel = 0;
              this.game.createEffect(this.x, this.y - 50, 'smokeBomb', 'idle', true);
              this.game.playScreenSound('S_Skill', this.x, this.y);
              this.endKillstreak();
              break;
            case 'surge':
              this.game.playScreenSound('S_Skill', this.x, this.y);
              this.status.sSurge = 5 * 30;
              this.game.createEffect(this.x, this.y - 30, 'surge');
              this.game.arena.setShake(5, 5);
              break;
            case 'mirror':
              this.game.playScreenSound('S_Skill', this.x, this.y);
              this.game.playScreenSound('S_Ice', this.x, this.y);
              this.status.sReflect = 5 * 30;
              this.game.createEffect(this.x, this.y - 30, 'shieldHexBlue');
              break;
            case 'fire':
              this.game.playScreenSound('S_Skill', this.x, this.y);
              this.status.sFire = 10 * 30;
              this.game.createEffect(this.x, this.y - 30, 'surge');
              this.game.arena.setShake(8, 8);
              break;
            case 'vest':
              if (!this.team) {
                this.getKevlar();
              } else {
                SH.playSound('S_Ice');
                _loc2_ = 0;
                while (_loc2_ < this.game.units.length) {
                  if (!this.game.units[_loc2_].dead) {
                    if (this.game.units[_loc2_].team == this.team) {
                      this.game.units[_loc2_].getKevlar(false);
                    }
                  }
                  _loc2_++;
                }
              }
              this.endKillstreak();
              break;
            case 'rapid':
              if (!this.team) {
                this.game.playScreenSound('S_Heal', this.x, this.y);
                this.status.sRapidHeal = 10 * 30;
                this.game.createEffect(this.x, this.y - 40, 'heal');
                break;
              }
              SH.playSound('S_Heal');
              _loc2_ = 0;
              while (_loc2_ < this.game.units.length) {
                if (!this.game.units[_loc2_].dead) {
                  if (this.game.units[_loc2_].team == this.team) {
                    this.game.units[_loc2_].status.sRapidHeal = 10 * 30;
                    this.game.createEffect(this.game.units[_loc2_].x, this.game.units[_loc2_].y - 40, 'heal');
                  }
                }
                _loc2_++;
              }
          }
        } else {
          this.game.createKillstreak(this, this.unitInfo.streak.id);
        }
        if (!(this.human && Boolean(this.unitInfo.streak.allyUse))) {
          if (!(this.team == 1 && Boolean(this.unitInfo.streak.allyUse))) {
            if (!(this.team == 2 && Boolean(this.unitInfo.streak.enemyUse))) {
              if (this.team == 0 && Boolean(this.unitInfo.streak.enemyUse)) {
                this.game.hud.setMsg(this.game.player, this.unitInfo.streak.enemyUse);
                if (this.unitInfo.streak.enemySound) {
                  SH.playVoice(this.unitInfo.streak.enemySound);
                }
              }
            } else {
              this.game.hud.setMsgRandomTeammate(1, this.unitInfo.streak.enemyUse);
              if (this.unitInfo.streak.enemySound) {
                SH.playVoice(this.unitInfo.streak.enemySound);
              }
            }
          } else {
            this.game.hud.setMsg(this, this.unitInfo.streak.allyUse);
            if (this.unitInfo.streak.allySound) {
              SH.playVoice(this.unitInfo.streak.allySound);
            }
          }
        } else {
          this.game.hud.setMsg(this, this.unitInfo.streak.allyUse);
          if (this.unitInfo.streak.allySound) {
            SH.playVoice(this.unitInfo.streak.allySound);
          }
        }
        return;
      }
      return;
    }
  }

  getKevlar(param1 = true): void {
    this.game.playScreenSound('S_Ice', this.x, this.y);
    this.status.shCur = 100;
    this.game.createEffect(this.x, this.y - 30, 'shieldHex');
  }

  startKillstreak(): void {
    this.canUseStreak = true;
    this.streakInProgress = false;
    this.game.createParticle(this.x, this.y - 70, 'slowText', 0, null, 'bigText', 'killstreak');
    this.game.createParticle(this.x, this.y - 60, 'slowText', 0, null, 'bigText', 'ready');
    if (this.human) {
      this.game.hud.txt_streakready.text = this.unitInfo.streak.name + ' ready,\nPress E or Ctrl to use!';
      SH.playSound('S_Killstreak', true);
      this.game.hud.mc_streakarrow.visible = true;
    }
  }

  endKillstreak(): void {
    this.streakInProgress = false;
    this.canUseStreak = false;
    this.setKillstreakNum(0);
    if (this.human) {
      this.game.hud.txt_streakready.text = '';
    }
  }

  setKillstreakNum(param1: number): void {
    param1 = uint(param1);
    if (this.human) {
      if (this.unitInfo.streak.id != 'none') {
        this.game.hud.txt_streaknum.text = param1 + '/' + (this.unitInfo.skill.id != 'charisma' ? this.unitInfo.streak.kills : this.unitInfo.streak.kills - 1);
        return;
      }
      this.game.hud.txt_streaknum.text = '';
      return;
    }
  }

  /** Returns: wall RGB hex string, a hit Unit, a hit PhysActor (corpse, if param3) or null. */
  private hitTestAll(param1 = 0, param2 = 0, param3 = false): any {
    let _loc5_ = 0; // uint
    const _loc4_ = uint(this.game.arena.wall.getPixel32(this.x + param1, this.y + param2));
    if (!(Boolean(_loc4_) && hexStartsFF(_loc4_))) {
      _loc5_ = 0;
      while (_loc5_ < this.game.units.length) {
        if (this.game.units[_loc5_] != this) {
          if (!this.game.units[_loc5_].dead) {
            if (!(Boolean(this.team) && this.team == this.game.units[_loc5_].team)) {
              if (UT.inBox(this.x + param1, this.y + param2, this.game.units[_loc5_].x - 20, this.game.units[_loc5_].y - 80, 40, 80)) {
                return this.game.units[_loc5_];
              }
            }
          }
        }
        _loc5_++;
      }
      if (param3) {
        _loc5_ = 0;
        while (_loc5_ < this.game.physWorld.actors.length) {
          const rd = this.game.physWorld.actors[_loc5_].rdBody.getUserData() as Container;
          if (UT.getDist(this.x + param1, this.y + param2, rd.x, rd.y) < 30) {
            return this.game.physWorld.actors[_loc5_];
          }
          _loc5_++;
        }
      }
      return null;
    }
    return _loc4_.toString(16).substring(2);
  }

  protected getPixel(param1 = 0, param2 = 0): number {
    return uint(this.game.arena.wall.getPixel32(this.x + param1, this.y + param2));
  }

  frame1(): void {
    this.stop();
  }
}
