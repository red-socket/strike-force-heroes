// Port of Bullet.as — base class of every bullet type (hit testing, impact handling, splash).
import { uint } from '../flash/as3';
import { SD } from './SD';
import { UT } from './UT';
import { Stats_Guns } from './Stats_Guns';
import { Stats_Campaign } from './Stats_Campaign';
import type { Game } from './Game';
import type { Unit } from './Unit';

/** Constructor shape shared by every concrete bullet class (Stats_Guns.cls). */
export type BulletClass = new (
  game: Game,
  unit: Unit,
  rot: number,
  x: number,
  y: number,
  xOff: number,
  id: string,
  extra?: Record<string, any> | null,
) => Bullet;

export class Bullet {
  protected game: Game;
  protected unit: Unit;
  protected stats: Stats_Guns;
  remove = false;
  protected rotation = NaN;
  protected x = NaN;
  protected y = NaN;
  protected ox = NaN;
  protected oy = NaN;
  protected xVel = NaN;
  protected yVel = NaN;
  private isProjectile = false;
  protected hitType: string | null = null;
  protected hitObject: any = undefined;
  protected curDist = NaN;
  protected maxDist = NaN;
  protected dmgMod = NaN;
  protected extra: Record<string, any>;

  constructor(
    param1: Game,
    param2: Unit,
    param3: number,
    param4: number,
    param5: number,
    param6: number,
    param7: string,
    param8: boolean,
    param9: Record<string, any> | null = null,
  ) {
    let _loc10_ = 0;
    this.game = param1;
    this.unit = param2;
    if (!param9) {
      this.extra = {};
    } else {
      this.extra = param9;
    }
    this.dmgMod = !this.extra.dmgMod ? 1 : Number(this.extra.dmgMod);
    this.stats = Stats_Guns.gunOb[param7];
    this.isProjectile = param8;
    this.curDist = 0;
    this.maxDist = (!this.extra.range ? this.stats.range : this.extra.range) + UT.irand(-3, 3);
    this.maxDist *= 10;
    if (!this.extra.noMove) {
      this.rotation = param3;
      if (this.extra.noUnit) {
        this.x = param4;
        this.y = param5;
      } else {
        this.x = param4 + UT.xMoveToRot(this.rotation + 90 * this.unit.MC.scale.x, this.stats.yOff);
        this.y = param5 + UT.yMoveToRot(this.rotation + 90 * this.unit.MC.scale.x, this.stats.yOff);
      }
      this.xVel = UT.xMoveToRot(this.rotation, 10);
      this.yVel = UT.yMoveToRot(this.rotation, 10);
      // param6 is declared uint in the AS3 signature (xOff)
      const xOff = uint(param6);
      _loc10_ = 0;
      while (_loc10_ <= xOff) {
        this.x += this.xVel * 0.5;
        this.y += this.yVel * 0.5;
        if ((this.hitObject = this.hitTestAll())) {
          break;
        }
        _loc10_++;
      }
    } else {
      this.xVel = 0;
      this.yVel = 0;
    }
    this.ox = this.x;
    this.oy = this.y;
    if (this.stats.effShoot) {
      this.game.createEffect(this.ox, this.oy, this.stats.effShoot);
    }
  }

  protected doHitEffect(param1 = false): void {
    let _loc2_ = 0;
    let _loc3_: any = undefined;
    let _loc4_ = NaN;
    if (!this.hitType) {
      if (!param1) {
        return;
      }
      this.hitType = 'wall';
    }
    if (!(Boolean(this.hitType) && Boolean(this.stats.extra.bounceShots))) {
      if (this.hitType == 'unit') {
        if (this.hitObject.status.sReflect) {
          if (this.extra.reflect) {
            return;
          }
          _loc3_ = UT.rotBounceOff(this.rotation, this.x - this.xVel * 10, this.y - this.yVel * 10, this.hitObject.x, this.hitObject.y - 20);
          this.unit.game.bullets.push(
            new (this.stats.cls as BulletClass)(this.unit.game, this.hitObject, _loc3_ + UT.rand(-10, 10), this.x, this.y, 0, this.stats.id, {
              reflect: this.unit,
            }),
          );
          if (this.isProjectile) {
            this.removeMe();
          }
          return;
        }
        if (this.hitObject.gun.reflecting) {
          _loc4_ = this.hitObject.aimRoation - UT.getRotation(this.hitObject.x, this.hitObject.y, this.x, this.y);
          if (Math.abs(_loc4_) < 80) {
            if (
              Math.random() < this.hitObject.gun.reflecting &&
              this.stats.typeName != 'Melee' &&
              (this.stats.typeName != 'Explosive' || this.stats.id == 'Thumper' || this.stats.id == 'Lawnchair')
            ) {
              if (this.extra.reflect) {
                return;
              }
              _loc3_ = UT.rotBounceOff(this.rotation, this.x - this.xVel * 10, this.y - this.yVel * 10, this.hitObject.x, this.hitObject.y - 20);
              this.unit.game.bullets.push(
                new (this.stats.cls as BulletClass)(this.unit.game, this.hitObject, _loc3_ + UT.rand(-10, 10), this.x, this.y, 0, this.stats.id, {
                  reflect: this.unit,
                }),
              );
              if (this.isProjectile) {
                this.removeMe();
              }
              this.game.playScreenSound(UT.randEl(['S_Reflect1', 'S_Reflect2', 'S_Reflect3']), this.x, this.y);
              this.game.createEffect(this.x, this.y, 'bulletspark');
              return;
            }
            this.extra.shielded = true;
          }
        }
        if (!this.hitObject.status.sSpawn) {
          if (!(Boolean(this.extra.shielded) || Boolean(this.hitObject.status.shCur))) {
            if (SD.blood) {
              this.game.createEffect(this.x, this.y, 'bloodmist');
            }
          } else {
            this.game.createEffect(this.x, this.y, 'bulletspark');
          }
        }
        if (!this.isProjectile) {
          this.x -= this.xVel * 0.5;
          this.y -= this.yVel * 0.5;
        } else {
          this.x -= this.xVel;
          this.y -= this.yVel;
          if (!this.stats.extra.pierce) {
            this.removeMe();
          }
        }
        if (this.stats.effHit) {
          this.game.createEffect(this.x, this.y, this.stats.effHit);
        }
        if (this.stats.splash) {
          this.extra.hitX = this.x;
          this.extra.hitY = this.y;
        }
        this.hitObject.status.damage(this.stats.dmg * this.dmgMod, this.unit, this.stats, this.extra);
      }
      if (this.hitType == 'corpse') {
        if (SD.blood) {
          this.game.createEffect(this.x, this.y, 'bloodmist');
        }
        if (this.isProjectile) {
          this.x -= this.xVel;
          this.y -= this.yVel;
          if (!this.stats.extra.pierce) {
            this.removeMe();
          }
        }
        if (this.stats.effHit) {
          this.game.createEffect(this.x, this.y, this.stats.effHit);
        }
        if (this.stats.splash) {
          this.extra.hitX = this.x;
          this.extra.hitY = this.y;
        }
        this.game.physWorld.hitCorpse(this.hitObject, this.unit, this.stats, this.extra);
      }
      if (this.hitType == 'wall') {
        if (this.isProjectile) {
          this.x -= this.xVel;
          this.y -= this.yVel;
          if (this.stats.extra.burrow) {
            this.extra.burrowMult = 2;
            this.yVel -= this.stats.params[2] * 0.1;
          } else {
            this.removeMe();
          }
        }
        if (this.stats.extra.burrow) {
          this.game.createEffect(this.x, this.y, 'mud_splash');
        } else if (this.stats.effHit) {
          this.game.createEffect(this.x, this.y, this.stats.effHit);
        }
        switch (this.hitObject) {
          case '9900ff':
            if (Stats_Campaign.sn != 9) {
              break;
            }
            this.game.hud.gotoAndStop('idle');
            this.game.hud.setMsg(this.game.player, "It looks like the elevator's out.. I'll have to jump.", 5, true, 'V_Ca1_7');
            ++Stats_Campaign.sn;
            this.game.player.gun.curAmmo.clipCur = 0;
            this.game.player.gun.curAmmo.spareCur = 0;
            this.game.arena.changeWallFrame(Stats_Campaign.sn);
            this.game.arena.elevator.play();
            _loc2_ = 0;
            while (_loc2_ < this.unit.game.arena.downarrows.length) {
              this.unit.game.arena.downarrows[_loc2_].visible = false;
              _loc2_++;
            }
            break;
          case '993300':
            if (!SD.graphPart) {
              break;
            }
            this.game.createEffect(this.x, this.y, 'mud_splash');
            break;
          case 'ffffff':
            if (!SD.graphPart) {
              break;
            }
            this.game.createEffect(this.x, this.y, 'snow_splash');
            break;
          case '006600':
            this.game.createEffect(this.x, this.y, 'leaf_splash');
            _loc2_ = 0;
            while (_loc2_ < SD.graphPart) {
              // AS3 passed hitFrame=null (uint 0) and extra="leaves" (args shifted by one in the original)
              this.game.createParticle(this.x + UT.rand(-10, 10), this.y, 'leaf', 0, 'leaves' as any, 'leaf' + UT.irand(1, 4));
              _loc2_++;
            }
        }
      }
      if (this.stats.hitSound) {
        this.unit.game.playScreenSound(this.stats.hitSound, this.x, this.y);
      }
      this.checkSplash();
      return;
    }
    if (this.hitType == 'unit') {
      this.hitObject.status.damage(this.stats.dmg * this.dmgMod, this.unit, this.stats, this.extra);
    }
    this.x -= this.xVel * 3;
    this.y -= this.yVel * 3;
    _loc2_ = 0;
    while (_loc2_ < this.stats.extra.bounceShots) {
      this.unit.game.bullets.push(
        new (Stats_Guns.gunOb['bouncer'].cls as BulletClass)(this.unit.game, this.unit, UT.rand(0, 360), this.x, this.y, 0, 'bouncer'),
      );
      _loc2_++;
    }
    if (this.isProjectile) {
      this.removeMe();
    }
  }

  protected hitTestAll(param1 = 0, param2 = 0, param3 = false): any {
    let _loc5_ = 0;
    let _loc6_ = 0;
    const _loc4_: number = uint(this.game.arena.wall.getPixel32(this.x + param1, this.y + param2));
    if (!this.extra.ignoreAll) {
      if (Boolean(!param3) && Boolean(_loc4_) && _loc4_.toString(16).substring(0, 2) == 'ff') {
        this.hitType = 'wall';
        return _loc4_.toString(16).substring(2);
      }
    }
    const units: any[] = this.game.units;
    _loc5_ = 0;
    for (; _loc5_ < units.length; _loc5_++) {
      const u = units[_loc5_];
      if (u != this.unit) {
        if (!u.dead) {
          if (!u.status.sBlur) {
            if (!(Boolean(this.unit.team) && this.unit.team == u.team)) {
              _loc6_ = 0;
              if (u.mov.crouching) {
                if (!UT.inBox(this.x, this.y, u.x - 13, u.y - 44, 26, 44)) {
                  continue;
                }
                if (!UT.inBox(this.x, this.y, u.x - 13, u.y - 28, 26, 28)) {
                  _loc6_ = 2;
                } else {
                  _loc6_ = 1;
                }
              } else {
                if (!UT.inBox(this.x, this.y, u.x - 13, u.y - 66, 26, 66)) {
                  continue;
                }
                if (!UT.inBox(this.x, this.y, u.x - 13, u.y - 44, 26, 44)) {
                  _loc6_ = 2;
                } else {
                  _loc6_ = 1;
                }
              }
              if (_loc6_ == 1) {
                this.hitType = 'unit';
                if (this.stats.splash >= 80) {
                  this.extra.splashDirect = true;
                }
                return u;
              }
              if (_loc6_ == 2) {
                if (UT.getPosNegSign(this.unit.x - u.x) != u.MC.scale.x) {
                  this.extra.assassin = 1.5;
                }
                this.extra.headMult = 1.5;
                this.hitType = 'unit';
                if (this.stats.splash >= 80) {
                  this.extra.splashDirect = true;
                }
                return u;
              }
            }
          }
        }
      }
    }
    const actors: any[] = this.game.physWorld.actors;
    _loc5_ = 0;
    while (_loc5_ < actors.length) {
      // Box2D rdBody.GetDefinition().userData → planck body.getUserData() (the torso sprite)
      const ud = actors[_loc5_].rdBody.getUserData();
      if (UT.getDist(this.x, this.y, ud.x, ud.y) < 30) {
        this.hitType = 'corpse';
        return actors[_loc5_];
      }
      _loc5_++;
    }
    this.hitType = '';
    return null;
  }

  protected hitTestWall(param1 = 0, param2 = 0): boolean {
    const _loc3_: number = uint(this.game.arena.wall.getPixel32(this.x + param1, this.y + param2));
    return Boolean(_loc3_) && _loc3_.toString(16).substring(0, 2) == 'ff';
  }

  protected checkSplash(): void {
    let _loc2_ = NaN;
    let _loc3_ = 0;
    if (this.stats.splash) {
      const units: any[] = this.game.units;
      let _loc1_ = 0;
      while (_loc1_ < units.length) {
        if (!units[_loc1_].dead) {
          if (!(this.hitType == 'unit' && this.hitObject == units[_loc1_])) {
            if (UT.getDist(this.x, this.y, units[_loc1_].x, units[_loc1_].y - 45) < this.stats.splash) {
              this.cleanExtra();
              _loc2_ = UT.getRotation(this.x, this.y, units[_loc1_].x, units[_loc1_].y - 45);
              _loc3_ = uint(this.game.arena.wall.getPixel32(this.x + UT.xMoveToRot(_loc2_, 10), this.y + UT.yMoveToRot(_loc2_, 10)));
              if (!(Boolean(_loc3_) && _loc3_.toString(16).substring(0, 2) == 'ff')) {
                if (Boolean(this.stats.splash) && this.stats.splash < 80) {
                  this.extra.splashIndirect = true;
                }
                this.extra.hitX = this.x;
                this.extra.hitY = this.y;
                this.extra.splashMult = this.stats.splashMult;
                units[_loc1_].status.damage(this.stats.dmg, this.unit, this.stats, this.extra);
              }
            }
          }
        }
        _loc1_++;
      }
      return;
    }
  }

  protected removeMe(): void {
    this.remove = true;
  }

  protected cleanExtra(): void {
    const _loc1_: Record<string, any> = {};
    _loc1_.corpseStick = this.extra.corpseStick;
    _loc1_.reflect = this.extra.reflect;
    this.extra = _loc1_;
  }

  /** Every concrete bullet class defines EnterFrame (called by Game each tick). */
  EnterFrame(): void {}
}
