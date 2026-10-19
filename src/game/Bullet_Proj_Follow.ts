// Port of Bullet_Proj_Follow.as — homing missile (turns toward every enemy in range).
import { Bullet } from './Bullet';
import { SD } from './SD';
import { UT } from './UT';
import type { Game } from './Game';
import type { Unit } from './Unit';

export class Bullet_Proj_Follow extends Bullet {
  countDistX = NaN;
  countDistY = NaN;

  constructor(param1: Game, param2: Unit, param3: number, param4: number, param5: number, param6: number, param7: string, param8: Record<string, any> | null = null) {
    super(param1, param2, param3, param4, param5, param6, param7, true, param8);
    this.doHitEffect();
    this.xVel *= 0.5;
    this.yVel *= 0.5;
    this.countDistX = param6 * Math.abs(this.xVel);
    this.countDistY = param6 * Math.abs(this.yVel);
  }

  EnterFrame(): void {
    let _loc1_ = 0;
    this.yVel += this.stats.params[2] * 0.1;
    this.rotation = UT.getRotation(this.x, this.y, this.x + this.xVel, this.y + this.yVel);
    const units: any[] = this.game.units;
    _loc1_ = 0;
    while (_loc1_ < units.length) {
      if (units[_loc1_] != this.unit) {
        if (!units[_loc1_].dead) {
          if (!(Boolean(this.unit.team) && this.unit.team == units[_loc1_].team)) {
            if (UT.getDist(this.x, this.y, units[_loc1_].x, units[_loc1_].y - 40) < this.stats.params[3]) {
              this.rotation +=
                UT.rotateDirection(this.rotation, UT.getRotation(this.x, this.y, units[_loc1_].x, units[_loc1_].y - 40)) * this.stats.params[4];
            }
          }
        }
      }
      _loc1_++;
    }
    this.xVel = UT.xMoveToRot(this.rotation, 5);
    this.yVel = UT.yMoveToRot(this.rotation, 5);
    _loc1_ = 0;
    while (_loc1_ < this.stats.params[1]) {
      this.game.createEffect(this.x, this.y, this.stats.params[0]);
      this.x += this.xVel;
      this.y += this.yVel;
      if (SD.graphPart) {
        this.game.createEffect(this.x, this.y, this.stats.params[0]);
      }
      this.x += this.xVel;
      this.y += this.yVel;
      this.countDistX += Math.abs(this.xVel) * 2;
      this.countDistY += Math.abs(this.yVel) * 2;
      if ((this.hitObject = this.hitTestAll())) {
        break;
      }
      _loc1_++;
    }
    this.doHitEffect();
    if (UT.getPythagorean(this.countDistX, this.countDistY) >= this.maxDist) {
      this.removeMe();
    }
    if (this.x < 0 || this.x > 3000 || this.y < 0 || this.y > 3000) {
      this.removeMe();
    }
  }
}
