// Port of AI.as — bot controller (extends Unit): waypoint wandering/path-finding, objective logic,
// target acquisition with ray-marched line of sight, aim lerp, random waits/crouches, action boxes.
//
// IMPORTANT (TS port): Unit's constructor calls the virtual spawn() → setClass() → setDiffStats() and
// setAiSpawnNode() → getNextWaypoint(), i.e. AI code runs *before* AI's own field initialisers would.
// AS3 initialises all slots before any constructor runs; TS (useDefineForClassFields) would reset the
// fields after super(). Hence every AI field is `declare`d (no emitted initialiser) and the AS3 default
// is applied after super() only where super() left it unset.
import { uint, trace } from '../flash/as3';
import { rdBodyUserData } from './Arena';
import { Main } from './Main';
import { MatchSettings } from './MatchSettings';
import type { NodeSpawn } from './NodeSpawn';
import type { NodeWaypoint } from './NodeWaypoint';
import { NodeWaypointPath } from './NodeWaypointPath';
import { Unit } from './Unit';
import { UT } from './UT';
import type { Game } from './Game';

export class AI extends Unit {
  declare private curWp: NodeWaypoint;
  declare private nextWp: NodeWaypoint;
  declare private wpTimer: number; // uint
  declare private focusX: number;
  declare private focusY: number;
  declare private target: any;
  declare private path: string;
  declare private getTargetTimer: number; // uint
  declare private getTargetEvent: number; // uint
  declare private wait: number; // uint
  declare private nowait: number; // uint
  declare crouch: number; // uint
  declare nocrouch: number; // uint
  declare private shootSpd: number;
  declare private waitNormal: number;
  declare private waitTarget: number;
  declare private crouchNormal: number;
  declare private crouchTarget: number;
  declare private waitFlag: number;
  declare private shotChance: number;
  declare private aimSpeed: number;
  declare private diffRev: number; // uint

  constructor(param1: Game, param2: any) {
    super(param1, false, param2);
    // AS3 slot defaults (see header): only where the super constructor did not assign them.
    this.curWp ??= null as any;
    this.nextWp ??= null as any;
    this.wpTimer ??= 0;
    this.focusX ??= NaN;
    this.focusY ??= NaN;
    // target: `*` defaults to undefined
    this.path ??= null as any;
    this.getTargetTimer ??= 0;
    this.getTargetEvent ??= 0;
    this.wait ??= 0;
    this.nowait ??= 0;
    this.crouch ??= 0;
    this.nocrouch ??= 0;
    this.shootSpd ??= NaN;
    this.waitNormal ??= NaN;
    this.waitTarget ??= NaN;
    this.crouchNormal ??= NaN;
    this.crouchTarget ??= NaN;
    this.waitFlag ??= NaN;
    this.shotChance ??= NaN;
    this.aimSpeed ??= NaN;
    this.diffRev ??= 0;
    this.MC.gotoAnim('idle');
    this.path = '@@';
    this.getTargetEvent = uint(UT.irand(1, 12));
  }

  override setDiffStats(param1 = -99, param2 = false, param3 = true): void {
    if (param1 == -99) {
      param1 = this.odiff;
    }
    if (param3) {
      if (param1 < 0) {
        param1 = 0;
      }
    } else if (param1 < 1) {
      param1 = 1;
    }
    if (param1 > 15) {
      param1 = 15;
    }
    this.diff = uint(param1);
    if (param2) {
      this.odiff = uint(param1);
    }
    this.diffRev = uint(15 - this.diff);
    this.waitNormal = 0.01 * (this.diffRev * 0.3);
    this.waitTarget = 0.03 * (this.diffRev * 0.3);
    this.crouchNormal = 0.01 * (this.diffRev * 0.3);
    this.crouchTarget = 0.02 * (this.diffRev * 0.3);
    this.waitFlag = 0.005 * (this.diffRev * 0.3);
    this.shotChance = this.diff * 0.29 + 0.1;
    if (this.diff == 10) {
      this.shotChance = 1000;
    }
    this.aimSpeed = 0.3 * (this.diff * 0.1 + 0.1);
    if (this.unitInfo.id == 'medic') {
      this.waitNormal *= 2;
    }
    if (this.unitInfo.id == 'sniper') {
      this.waitTarget *= 2;
      this.crouchTarget *= 2;
    }
    if (this.unitInfo.id == 'tank') {
      this.waitTarget *= 0.5;
    }
    if (this.unitInfo.id == 'soldier') {
      this.crouchTarget *= 0.5;
    }
    if (this.gun.primary.typeName == 'Shield') {
      this.crouchTarget = 0.09;
    }
    if (this.unitInfo.skill.id == 'shadow') {
      this.crouchNormal *= 3;
      this.crouchNormal = 0.03;
    }
  }

  override spawn(param1 = 0, param2 = 0, param3 = ''): void {
    this.unitSpawn(param1, param2, param3);
    this.aimX = this.x + 100;
    this.aimY = this.y - 50;
    if (this.unitInfo.extra.aimReverse) {
      this.aimX = this.y - 100; // sic (typo for x - 100 in the original)
      this.MC.scale.x = -1;
    }
    this.status.sSpawn = 0.5 * 30;
  }

  protected override setAiSpawnNode(param1: NodeSpawn): void {
    this.getNextWaypoint(param1.waypoint, true);
  }

  private moveToObjective(): void {
    const arena: any = this.game.arena;
    if (this.hasFlag) {
      this.path = this.pathFind(arena['flag' + this.team].id, 5);
      trace('SET PATH TO HOME FLAG', this.path);
    } else if (Math.random() < 0.3 && !arena['flag' + (this.team != 1 ? 1 : 2)].unitCaptured) {
      this.path = this.pathFind(arena['flag' + (this.team != 1 ? 1 : 2)].id, 5);
      trace('SET PATH TO ENEMY FLAG', this.path);
    }
  }

  override getNextWaypoint(param1: NodeWaypoint | null = null, param2 = false): void {
    this.wpTimer = 0;
    if (!(!param2 && this.mov.jumping && Math.abs(this.y - this.nextWp.y) > 30)) {
      if (param1) {
        this.curWp = this.nextWp;
        this.nextWp = param1;
      } else {
        this.curWp = this.nextWp;
        if (MatchSettings.useMode == 'ctf' && !this.path && this.path.charAt(0) != '@') {
          this.moveToObjective();
        }
        if (Math.abs(this.y - this.curWp.y) <= 50) {
          if (Math.abs(this.y - this.curWp.y) < 50) {
            if (!(Boolean(this.path) && this.path.charAt(0) != '@')) {
              this.nextWp = UT.randEl(this.curWp.connects);
              if (this.path.charAt(0) == '@') {
                this.path = this.path.substring(1);
              }
            } else {
              this.nextWp = this.game.arena.wpOb[this.path.charAt(0)];
              this.path = this.path.substring(1);
              if (this.path == '') {
                this.path = '@';
              }
              trace(this.path);
            }
          }
        } else {
          this.getClosestWp();
        }
      }
      if (Main.DEBUGMODE) {
        this.txt_name.text = (this.curWp ? this.curWp.id.toUpperCase() : 'Null') + ' to ' + this.nextWp.id.toUpperCase();
      }
      return;
    }
  }

  getClosestWp(): void {
    if (this.diff) {
      this.wpTimer = 0;
      this.path = '@';
      const _loc1_: { dist: number; wp: NodeWaypoint }[] = new Array();
      const wps = this.game.arena.waypoints;
      let _loc2_ = 0;
      while (_loc2_ < wps.length) {
        if (Math.abs(this.y - wps[_loc2_].y) < 100) {
          _loc1_.push({
            dist: Math.abs(this.x - wps[_loc2_].x),
            wp: wps[_loc2_],
          });
        }
        _loc2_++;
      }
      if (!_loc1_.length) {
        this.nextWp = UT.randEl(this.curWp.connects);
      } else {
        _loc1_.sort((a, b) => a.dist - b.dist); // sortOn("dist", NUMERIC)
        this.nextWp = _loc1_[0].wp;
      }
      return;
    }
  }

  pathFind(param1: string, param2 = 0): string {
    param2 = uint(param2);
    const _loc3_: NodeWaypointPath[] = [];
    let _loc4_ = 0;
    while (_loc4_ < this.curWp.connects.length) {
      this.searchNode(this.curWp.connects[_loc4_].id, param1, this.curWp.id, _loc3_);
      _loc4_++;
    }
    _loc3_.sort((a, b) => a.dist - b.dist); // sortOn("dist", NUMERIC)
    if (param2 > _loc3_.length - 1) {
      param2 = uint(_loc3_.length - 1); // no path: wraps to 4294967295 like AS3
    }
    const pick = _loc3_[UT.irand(0, param2)];
    if (!pick) {
      // AS3 throws a TypeError here (undefined.path) when no path exists (dropship/missile CTF), aborting
      // the rest of the frame's update. We keep the path unchanged instead of crashing.
      return this.path;
    }
    return pick.path.substring(1);
  }

  private searchNode(param1: string, param2: string, param3: string, param4: NodeWaypointPath[]): void {
    let _loc6_: string = null as any;
    param3 += param1;
    if (param1 == param2) {
      param4.push(new NodeWaypointPath(param3, this.game.arena.wpOb));
    }
    let _loc5_ = 0;
    while (_loc5_ < this.game.arena.wpOb[param1].connects.length) {
      _loc6_ = this.game.arena.wpOb[param1].connects[_loc5_].id;
      if (param3.indexOf(_loc6_) == -1) {
        this.searchNode(_loc6_, param2, param3, param4);
      }
      _loc5_++;
    }
  }

  EnterFrame(): void {
    let _loc1_ = 0;
    let _loc2_: any[] = null as any;
    let _loc3_ = NaN;
    let _loc4_ = false;
    let _loc5_ = 0;
    const game: any = this.game;
    if (!this.unitInfo.extra.noSpawn) {
      if (!this.mov.jumping && !this.wait && !this.crouch) {
        this.wpTimer = uint(this.wpTimer + 1);
      }
      if (this.wpTimer >= 30 * 4) {
        this.getClosestWp();
      }
      if (!this.dead) {
        this.MCfilters = [];
        this.keys = 0;
        if (this.diff) {
          if (!(this.nextWp.x > this.x - 30 && this.nextWp.x < this.x + 30)) {
            if (!(!this.wait && this.nextWp.x > this.x)) {
              if (!this.wait && this.nextWp.x < this.x) {
                this.keys |= this.LEFT;
              }
            } else {
              this.keys |= this.RIGHT;
            }
          } else {
            this.getNextWaypoint();
          }
        }
        if (MatchSettings.useMode == 'dom') {
          const hp: any[] = game.arena.holdpoints;
          _loc1_ = 0;
          while (_loc1_ < hp.length) {
            if (UT.inBox(this.x, this.y, hp[_loc1_].x - 120, hp[_loc1_].y - 150, 240, 200)) {
              // AS3 bug kept: `holdpoint.flag` is the flag MovieClip, so `flag > -50` is always false (NaN)
              if (!this.wait && !this.nowait && (this.team != hp[_loc1_].curTeam || (hp[_loc1_].flag as unknown as number) > -50)) {
                if (Math.random() >= 0.5) {
                  this.crouch = uint(UT.irand(1, 8) * 30);
                } else {
                  this.wait = uint(UT.irand(1, 8) * 30);
                }
                this.nowait = 0;
              }
            }
            _loc1_++;
          }
        }
        if (MatchSettings.useMode == 'ctf') {
          const own: any = game.arena['flag' + this.team];
          if (!own.unitCaptured && UT.inBox(this.x, this.y, own.x - 100, own.y - 40, 200, 100)) {
            if (!this.wait && !this.nowait && !this.hasFlag) {
              this.defendingFlag = true;
              if (Math.random() >= 0.5) {
                this.crouch = uint(UT.irand(1, 8) * 30);
              } else {
                this.wait = uint(UT.irand(1, 8) * 30);
              }
              this.nowait = uint(this.wait + UT.irand(0, 2) * 30);
            }
          }
          if (!this.wait && !this.nowait) {
            this.defendingFlag = false;
          }
        }
        if (
          !this.wait &&
          !this.nowait &&
          !this.mov.jumping &&
          Math.random() < (this.target ? this.waitTarget : this.waitNormal) &&
          !this.status.sSpawn
        ) {
          this.wait = uint(UT.irand(2, 6) * (this.diffRev * 0.1) * 30);
          this.nowait = uint(this.wait + UT.irand(2, 6) * (this.diff * 0.1) * 30);
          if (this.hasFlag) {
            this.wait = uint(this.wait * 0.2);
          }
        }
        if (!this.crouch && Math.random() < (this.target ? this.crouchTarget : 0) && !this.status.sSpawn) {
          this.crouch = uint(UT.irand(2, 4) * (this.diffRev * 0.1) * 30);
          this.nocrouch = uint(this.crouch / 2);
        }
        if (this.wait) {
          --this.wait;
        }
        if (this.nowait) {
          --this.nowait;
        }
        if (Boolean(this.crouch) && Boolean(this.keys & this.LEFT) && Boolean(this.mov.hitTest(-19, -20))) {
          this.crouch = 0;
        }
        if (Boolean(this.crouch) && Boolean(this.keys & this.RIGHT) && Boolean(this.mov.hitTest(19, -20))) {
          this.crouch = 0;
        }
        if (Boolean(this.crouch) && Boolean(this.diff)) {
          this.keys |= this.DOWN;
          --this.crouch;
        }
        this.getTargetTimer = uint(this.getTargetTimer + 1);
        if (this.getTargetTimer > 12) {
          this.getTargetTimer = 0;
        }
        if (this.getTargetTimer == this.getTargetEvent) {
          const units: any[] = game.units;
          _loc2_ = [];
          _loc1_ = 0;
          while (_loc1_ < units.length) {
            if (units[_loc1_] != this) {
              if (!units[_loc1_].dead) {
                if (!(Boolean(this.team) && this.team == units[_loc1_].team)) {
                  if (units[_loc1_].status.sInvis != 1) {
                    if (!units[_loc1_].status.sSpawn) {
                      _loc3_ = UT.getDist(this.x, this.y, units[_loc1_].x, units[_loc1_].y);
                      if (_loc3_ < Math.min(this.gun.curGun.range * 10, 450)) {
                        _loc2_.push({
                          dist: _loc3_,
                          unit: units[_loc1_],
                          rot: UT.getRotation(this.x, this.y, units[_loc1_].x, units[_loc1_].y),
                        });
                      }
                    }
                  }
                }
              }
            }
            _loc1_++;
          }
          if (!this.gun.curGun.extra.burrow) {
            _loc1_ = 0;
            while (_loc1_ < _loc2_.length) {
              _loc4_ = true;
              _loc5_ = 0;
              while (_loc4_ && _loc5_ < _loc2_[_loc1_].dist) {
                if (
                  this.mov.hitTest(
                    UT.xMoveToRot(_loc2_[_loc1_].rot, _loc5_),
                    UT.yMoveToRot(_loc2_[_loc1_].rot, _loc5_) - (!this.mov.crouching ? 50 : 20),
                  )
                ) {
                  _loc4_ = false;
                }
                _loc5_ += 20;
              }
              if (!_loc4_) {
                _loc2_.splice(_loc1_, 1);
                // uint loop var: 0 - 1 wraps to 4294967295 and the ++ below wraps back to 0
                _loc1_ = uint(_loc1_ - 1);
              }
              _loc1_ = uint(_loc1_ + 1);
            }
          }
          if (_loc2_.length) {
            _loc2_.sort((a, b) => a.dist - b.dist); // sortOn("dist", NUMERIC)
            this.target = _loc2_[0].unit;
          } else {
            this.target = null;
          }
        }
        if (this.target) {
          this.focusX = this.target.dead ? Number(rdBodyUserData(this.target.dead).x) : Number(this.target.x);
          this.focusY = this.target.dead
            ? rdBodyUserData(this.target.dead).y + 10
            : this.target.y - (!this.target.mov.crouching ? 40 : 20);
          this.aimX += (this.focusX - this.aimX) * this.aimSpeed;
          this.aimY += (this.focusY - this.aimY) * this.aimSpeed;
        } else {
          this.focusX = this.x + this.MC.scale.x * 50 + this.mov.xVel * 10;
          this.focusY = this.y - 40 + this.mov.yVel * 8;
          this.aimX += (this.focusX - this.aimX) * 0.4;
          this.aimY += (this.focusY - this.aimY) * 0.3;
        }
        if (Boolean(game.gameStarted && this.target) && Boolean(this.diff) && !this.status.sSpawn) {
          this.shootSpd = 0.05 + (1 - (this.gun.curGun.shootDelay > 0.9 ? 0.9 : this.gun.curGun.shootDelay)) * 0.2;
          this.shootSpd *= this.shotChance;
          if (Math.random() < this.shootSpd) {
            this.gun.shoot();
          }
        }
        if (this.canUseStreak) {
          this.useKillstreak();
        }
        _loc1_ = 0;
        for (; _loc1_ < this.nextWp.actionBoxes.length; _loc1_++) {
          const box = this.nextWp.actionBoxes[_loc1_];
          if (!UT.inBox(this.x, this.y, box.x, box.y, box.width, box.height)) {
            continue;
          }
          if (this.keys & this.DOWN) {
            this.keys ^= this.DOWN;
          }
          switch (box.action) {
            case 'j':
              if (!this.capturing) {
                this.wait = 0;
                this.nowait = 30;
                if (!this.mov.jumping) {
                  this.mov.doJump();
                }
              }
              break;
            case 'c':
              this.keys |= this.DOWN;
              break;
            case 'fc':
              this.getNextWaypoint(game.arena.wpOb['c'], true);
              break;
            case 'fp':
              this.getNextWaypoint(game.arena.wpOb['p'], true);
              break;
            case 'fd':
              this.getNextWaypoint(game.arena.wpOb['d'], true);
          }
        }
        this.UnitEnterFrame();
        return;
      }
      if (this.respawnTimer) {
        --this.respawnTimer;
      } else {
        this.spawn();
      }
      return;
    }
  }
}
