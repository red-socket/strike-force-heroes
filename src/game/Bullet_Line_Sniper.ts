// Port of Bullet_Line_Sniper.as — hitscan bullet with a lingering, rising, fading trail.
import { uint } from '../flash/as3';
import type { Graphics } from 'pixi.js';
import { Bullet } from './Bullet';
import { UT } from './UT';
import type { Game } from './Game';
import type { Unit } from './Unit';

interface TrailPoint {
  x: number;
  y: number;
  lift: number;
}

export class Bullet_Line_Sniper extends Bullet {
  private linePath: TrailPoint[] = null as any;
  private alpha = 1;

  constructor(param1: Game, param2: Unit, param3: number, param4: number, param5: number, param6: number, param7: string, param8: Record<string, any> | null = null) {
    super(param1, param2, param3, param4, param5, param6, param7, false, param8);
    let _loc9_ = 0;
    _loc9_ = 0;
    while (_loc9_ < uint(this.maxDist / 10)) {
      this.x += this.xVel;
      this.y += this.yVel;
      if ((this.hitObject = this.hitTestAll())) {
        break;
      }
      _loc9_++;
    }
    this.doHitEffect();
    this.curDist = Math.round(UT.getDist(this.ox, this.oy, this.x, this.y));
    const _loc10_ = !this.stats.params[0] ? -0.2 : 0.2;
    const _loc11_ = !this.stats.params[0] ? 0.2 : 0.5;
    this.linePath = [];
    this.linePath.push({ x: this.ox, y: this.oy, lift: UT.rand(_loc10_, _loc11_) });
    _loc9_ = 0;
    while (_loc9_ < this.curDist) {
      this.linePath.push({
        x: this.ox + UT.xMoveToRot(this.rotation, _loc9_),
        y: this.oy + UT.yMoveToRot(this.rotation, _loc9_),
        lift: UT.rand(_loc10_, _loc11_),
      });
      _loc9_ += 30;
    }
    this.linePath.push({ x: this.x, y: this.y, lift: UT.rand(_loc10_, _loc11_) });
    this.drawTrail(1);
  }

  /** The two identical drawing loops of the original (constructor uses alpha factor 1). */
  private drawTrail(alphaMul: number): void {
    const g: Graphics = this.game.lineCont;
    let _loc12_ = 0;
    while (_loc12_ < (this.stats.params.length - 1) / 3) {
      let _loc9_ = 0;
      while (_loc9_ < this.linePath.length) {
        if (_loc9_ != 0) {
          g.lineTo(this.linePath[_loc9_].x, this.linePath[_loc9_].y);
        } else {
          g.moveTo(this.linePath[_loc9_].x, this.linePath[_loc9_].y);
        }
        _loc9_++;
      }
      // Flash clamps lineStyle alpha to [0,1]
      const a = this.stats.params[_loc12_ * 3 + 3] * alphaMul;
      g.stroke({
        width: this.stats.params[_loc12_ * 3 + 1],
        color: this.stats.params[_loc12_ * 3 + 2],
        alpha: Math.max(0, Math.min(1, a)),
        cap: 'round',
        join: 'round',
      });
      _loc12_++;
    }
  }

  EnterFrame(): void {
    let _loc1_ = 0;
    this.alpha -= 0.03;
    _loc1_ = 0;
    while (_loc1_ < this.linePath.length) {
      this.linePath[_loc1_].y -= this.linePath[_loc1_].lift;
      _loc1_++;
    }
    this.drawTrail(this.alpha);
    if (this.alpha <= 0) {
      this.removeMe();
    }
  }
}
