// Port of Movement.as — hand-written kinematic controller colliding against the arena's per-pixel
// collision bitmap (`game.arena.wall`). Not Box2D. Literal port: keep the probe offsets, the 0.5/1 px
// push-out loops and the statement order (game feel depends on them).
import { int, uint } from '../flash/as3';
import { UT } from './UT';
import type { Unit } from './Unit';

/**
 * AS3 `c.toString(16).substring(0, 2) == "ff"` for a uint `c` (c > 0), without allocating strings.
 * True when the two leading hex digits of c are "ff" — usually alpha == 0xFF, but also e.g.
 * 0x00FF1234 or 0x0FF12345 (quirk of the original string test, preserved).
 */
export function hexStartsFF(c: number): boolean {
  c = c >>> 0;
  if (c === 0) return false;
  const digits = Math.ceil((32 - Math.clz32(c)) / 4);
  if (digits < 2) return false;
  return c >>> (4 * (digits - 2)) === 0xff;
}

export class Movement {
  private unit: Unit;

  xVel = 0;
  xVelSlide = 0;
  readonly xAcc = 1.8;
  readonly xBrake = 1.7;
  readonly xCrouchBrake = 0.5;
  readonly xAirAcc = 1.4;
  readonly xAirBrake = 0.4;
  readonly xMax = 9.5;
  readonly xCrouchMax = 4;
  yVel = 0;
  readonly yGrav = 0.8;
  readonly yMax = 20;
  readonly yJump = 13;
  readonly yJumpBoost = 6;
  /** unused in the original (no double jump) */
  readonly yDjump = 10;
  manualJump = false;
  jumping = false;
  crouching = false;
  tiltL = NaN;
  tiltR = NaN;
  modSpeed = NaN;
  modMax = NaN;
  modBrake = NaN;
  modJump = NaN;
  modSlide = NaN;
  modMove = NaN;
  modGrav = NaN;
  /** unused in the original */
  modMegaJump = false;
  /** AS3 int */
  climb = 0;
  /** AS3 uint */
  climbSize = 0;
  /** AS3 uint */
  private falltimer = 0;
  landHard = false;
  noJump = false;
  parachute = false;

  constructor(param1: Unit) {
    this.unit = param1;
    this.reset();
  }

  reset(): void {
    this.resetMods();
    this.manualJump = false;
    this.jumping = false;
    this.crouching = false;
    this.falltimer = 0;
    this.climb = 0;
    this.climbSize = 0;
    this.xVel = 0;
    this.yVel = 0;
    this.parachute = false;
    if (this.unit.unitInfo.extra.parachute) {
      this.parachute = true;
      if (this.unit.unitInfo.extra.paraOnce) {
        this.unit.unitInfo.extra.parachute = false;
      }
    }
  }

  resetMods(): void {
    this.modMegaJump = false;
    this.modSpeed = 1;
    this.modMax = 1;
    this.modBrake = 1;
    this.modJump = 1;
    this.modGrav = 1;
    this.modSlide = 0;
    this.modMove = 0;
  }

  doJump(param1 = 0): void {
    param1 = int(param1);
    if (this.unit.game.gameStarted) {
      if (this.crouching) {
        return;
      }
      if (!this.climb) {
        if (!this.landHard) {
          if (this.unit.constAnim) {
            this.unit.game.createParticle(this.unit.x, this.unit.y - 120, 'move', 0, { xspd: -50, yspd: 0 }, this.unit.constAnim, 'animate');
            this.unit.constAnim = '';
          }
          this.parachute = false;
          if (!param1) {
            if (!this.jumping && !this.noJump) {
              this.unit.y -= this.yJumpBoost;
              this.yVel -= this.yJump * this.modJump;
              this.jumping = true;
              this.manualJump = true;
              this.unit.MC.gotoAnim('jump');
            }
          } else {
            this.climb = param1;
            if (this.climbSize != 1) {
              if (this.climbSize == 2) {
                this.yVel = -10;
              }
            } else {
              this.yVel = -7;
            }
            this.unit.MC.gotoAnim('climb' + (this.climbSize != 1 ? 'big' : 'small'));
          }
          return;
        }
        return;
      }
      return;
    }
  }

  private toggleCrouch(param1: boolean): void {
    const _loc2_ = param1 != this.crouching;
    this.crouching = param1;
    if (_loc2_) {
      this.unit.gun.setShieldPos();
    }
  }

  EnterFrame(): void {
    let _loc4_ = NaN;
    let _loc5_ = NaN;
    let _loc6_ = 0; // uint
    if (this.unit.game.gameStarted) {
      if (!(!this.jumping && Boolean(this.unit.keys & this.unit.DOWN) && !this.landHard)) {
        if (!(this.crouching && (Boolean(this.hitTest(-17, -45)) || Boolean(this.hitTest(17, -45))))) {
          this.toggleCrouch(false);
        } else {
          this.toggleCrouch(true);
        }
      } else {
        this.toggleCrouch(true);
      }
      if (this.parachute) {
        this.modGrav = 0.2;
      }
      let _loc1_ = 'back';
      if (Boolean(this.unit.keys & this.unit.LEFT) && !this.landHard) {
        if (this.unit.human && Boolean(this.unit.unitInfo.extra.noAim)) {
          this.unit.aimX = this.unit.x - 200;
          this.unit.aimY = this.unit.y - 0;
          _loc1_ = '';
        }
        if (!this.crouching) {
          this.unit.nextAnim = (!this.unit.flip ? 'run' + _loc1_ : 'run') + this.unit.unitInfo.runType;
          this.xVel += (!this.jumping ? -this.xAcc : -this.xAirAcc) * this.modSpeed;
          if (this.xVel < -this.xMax * this.modMax) {
            this.xVel = -this.xMax * this.modMax;
          }
        } else {
          this.unit.nextAnim = !this.unit.flip ? 'duckrun' + _loc1_ : 'duckrun';
          this.xVel += (!this.jumping ? -this.xAcc : -this.xAirAcc) * this.modSpeed;
          if (this.xVel < -this.xCrouchMax * this.modMax) {
            this.xVel = -this.xCrouchMax * this.modMax;
          }
        }
      } else if (Boolean(this.unit.keys & this.unit.RIGHT) && !this.landHard) {
        if (this.unit.human && Boolean(this.unit.unitInfo.extra.noAim)) {
          this.unit.aimX = this.unit.x + 200;
          this.unit.aimY = this.unit.y - 0;
          _loc1_ = '';
        }
        if (!this.crouching) {
          this.unit.nextAnim = (!this.unit.flip ? 'run' : 'run' + _loc1_) + this.unit.unitInfo.runType;
          this.xVel += (!this.jumping ? this.xAcc : this.xAirAcc) * this.modSpeed;
          if (this.xVel > this.xMax * this.modMax) {
            this.xVel = this.xMax * this.modMax;
          }
        } else {
          this.unit.nextAnim = this.unit.flip ? 'duckrun' + _loc1_ : 'duckrun';
          this.xVel += (!this.jumping ? this.xAcc : this.xAirAcc) * this.modSpeed;
          if (this.xVel > this.xCrouchMax * this.modMax) {
            this.xVel = this.xCrouchMax * this.modMax;
          }
        }
      } else {
        this.unit.nextAnim = 'idle';
        _loc5_ = (!this.jumping ? (!this.crouching ? this.xBrake : this.xCrouchBrake) : this.xAirBrake) * this.modBrake;
        if (this.xVel > _loc5_) {
          this.xVel -= _loc5_;
        }
        if (this.xVel < -_loc5_) {
          this.xVel += _loc5_;
        }
        if (this.xVel > -_loc5_ - 0.1 && this.xVel < _loc5_ + 0.1) {
          this.xVel = 0;
        }
      }
      if (this.climb == 1) {
        this.xVel = 5;
      } else if (this.climb == -1) {
        this.xVel = -5;
      }
      this.unit.x += this.xVel;
      this.unit.x += this.modMove;
      if (!this.modSlide) {
        this.xVel += this.xVelSlide;
      }
      this.xVelSlide = Math.round(this.unit.MC.angle) * this.modSlide;
      if (this.xVelSlide > 0) {
        this.xVelSlide -= 0.05;
      }
      if (this.xVelSlide < 0) {
        this.xVelSlide += 0.05;
      }
      if (this.xVelSlide > -0.1 && this.xVelSlide < 0.1) {
        this.xVelSlide = 0;
      }
      this.unit.x += this.xVelSlide;
      this.unit.y += this.yVel;
      if (!this.climb) {
        while (Boolean(this.hitTest(0, 8)) && !this.hitTest(0, -1)) {
          this.unit.y += 0.5;
        }
      } else {
        while (Boolean(this.hitTest(0, 6)) && !this.hitTest(0, -1)) {
          this.unit.y += 0.5;
        }
      }
      if (!this.hitTest(0, 1)) {
        if (this.yVel > 0) {
          ++this.falltimer;
        }
        this.unit.nextAnim = 'fall';
        this.jumping = true;
        this.yVel += this.yGrav * this.modGrav;
        if (this.yVel > this.yMax * this.modGrav) {
          this.yVel = this.yMax * this.modGrav;
        }
      } else {
        if (this.falltimer >= 1.3 * 30) {
          if (this.unit.human) {
            this.unit.game.arena.setShake(4, 8);
          }
          this.landHard = true;
        }
        if (this.yVel > 0) {
          if (!(this.unit.keys & this.unit.LEFT)) {
            if (!(this.unit.keys & this.unit.RIGHT)) {
              this.unit.nextAnim = 'land';
            } else {
              this.unit.nextAnim = (!this.unit.flip ? 'landrun' : 'landrunback') + this.unit.unitInfo.runType;
            }
          } else {
            this.unit.nextAnim = (!this.unit.flip ? 'landrunback' : 'landrun') + this.unit.unitInfo.runType;
          }
        }
        this.manualJump = false;
        this.jumping = false;
        this.yVel = 0;
        this.falltimer = 0;
        if (this.unit.constAnim) {
          this.unit.game.createParticle(this.unit.x, this.unit.y - 120, 'move', 0, { xspd: -50, yspd: 0 }, this.unit.constAnim, 'animate');
          this.unit.constAnim = '';
        }
        this.parachute = false;
      }
      while (this.hitTest(0, -50)) {
        ++this.unit.y;
        if (this.yVel < 0) {
          this.yVel = 0;
        }
      }
      let _loc2_ = false;
      if (!(Boolean(this.unit.keys & this.unit.RIGHT) && Boolean(this.hitTest(17, -40)) && !this.hitTest(17, -55))) {
        if (Boolean(this.unit.keys & this.unit.RIGHT) && Boolean(this.hitTest(17, -20)) && !this.hitTest(17, -55)) {
          this.climbSize = 1;
          _loc2_ = true;
        }
      } else {
        this.climbSize = 2;
        _loc2_ = true;
      }
      if (!this.crouching) {
        while (Boolean(this.hitTest(17, -20)) || Boolean(this.hitTest(17, -25)) || Boolean(this.hitTest(17, -35)) || Boolean(this.hitTest(17, -45))) {
          --this.unit.x;
        }
      } else {
        while (Boolean(this.hitTest(17, -20)) || Boolean(this.hitTest(17, -25)) || Boolean(this.hitTest(17, -35))) {
          --this.unit.x;
        }
      }
      let _loc3_ = false;
      if (!(Boolean(this.unit.keys & this.unit.LEFT) && Boolean(this.hitTest(-17, -40)) && !this.hitTest(-17, -55))) {
        if (Boolean(this.unit.keys & this.unit.LEFT) && Boolean(this.hitTest(-17, -20)) && !this.hitTest(-17, -55)) {
          this.climbSize = 1;
          _loc3_ = true;
        }
      } else {
        this.climbSize = 2;
        _loc3_ = true;
      }
      if (!this.crouching) {
        while (Boolean(this.hitTest(-17, -20)) || Boolean(this.hitTest(-17, -25)) || Boolean(this.hitTest(-17, -35)) || Boolean(this.hitTest(-17, -45))) {
          ++this.unit.x;
        }
      } else {
        while (Boolean(this.hitTest(-17, -20)) || Boolean(this.hitTest(-17, -25)) || Boolean(this.hitTest(-17, -35))) {
          ++this.unit.x;
        }
      }
      while (this.hitTest(0, 0)) {
        this.unit.y -= 0.5;
      }
      if (_loc2_) {
        this.doJump(1);
      }
      if (_loc3_) {
        this.doJump(-1);
      }
      if (this.jumping) {
        _loc4_ = 0;
      } else {
        this.tiltL = this.tiltR = -10;
        _loc6_ = 0;
        while (_loc6_ < 30 && !this.hitTest(-10, this.tiltL)) {
          _loc6_ = uint(_loc6_ + 1);
          ++this.tiltL;
        }
        _loc6_ = 0;
        while (_loc6_ < 30 && !this.hitTest(10, this.tiltR)) {
          _loc6_ = uint(_loc6_ + 1);
          ++this.tiltR;
        }
        if (!(this.tiltL < 20 && this.tiltR < 20)) {
          _loc4_ = 0;
        } else {
          _loc4_ = UT.getRotation(-10, this.tiltL, 10, this.tiltR) - 90;
        }
      }
      this.unit.MC.angle += (_loc4_ - this.unit.MC.angle) * 0.3;
      if (this.crouching && !(this.unit.keys & this.unit.LEFT) && !(this.unit.keys & this.unit.RIGHT)) {
        this.unit.nextAnim = 'duck';
      }
      if (this.landHard) {
        this.unit.nextAnim = 'landhard';
      }
      return;
    }
  }

  /** Returns the pixel (uint) if solid (leading hex digits "ff", i.e. alpha 0xFF), else 0. */
  hitTest(param1 = 0, param2 = 0): number {
    const _loc3_ = uint(this.unit.game.arena.wall.getPixel32(this.unit.x + param1, this.unit.y + param2));
    if (_loc3_) {
      return !hexStartsFF(_loc3_) ? 0 : _loc3_;
    }
    return _loc3_;
  }
}
