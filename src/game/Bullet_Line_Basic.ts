// Port of Bullet_Line_Basic.as — hitscan bullet; tracer drawn once into game.lineCont.
import { Point, uint } from '../flash/as3';
import type { Graphics } from 'pixi.js';
import { Bullet } from './Bullet';
import { UT } from './UT';
import type { Game } from './Game';
import type { Unit } from './Unit';

export class Bullet_Line_Basic extends Bullet {
  private newLine = false;
  private linePath: Point[] = null as any;

  constructor(param1: Game, param2: Unit, param3: number, param4: number, param5: number, param6: number, param7: string, param8: Record<string, any> | null = null) {
    super(param1, param2, param3, param4, param5, param6, param7, true, param8);
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
    this.linePath = [];
    if (!this.stats.params[0]) {
      this.linePath.push(new Point(this.ox, this.oy));
    } else {
      _loc9_ = uint(UT.irand(0, 100));
      while (_loc9_ < this.curDist) {
        this.linePath.push(new Point(this.ox + UT.xMoveToRot(this.rotation, _loc9_), this.oy + UT.yMoveToRot(this.rotation, _loc9_)));
        _loc9_ = uint(_loc9_ + UT.irand(50, 250));
      }
    }
    // Flash graphics.lineStyle + moveTo/lineTo → Pixi v8: build the path, then stroke() it per pass.
    const g: Graphics = this.game.lineCont;
    let _loc10_ = 0;
    while (_loc10_ < (this.stats.params.length - 1) / 3) {
      this.newLine = true;
      _loc9_ = 0;
      while (_loc9_ < this.linePath.length) {
        if (!this.newLine) {
          g.lineTo(this.linePath[_loc9_].x, this.linePath[_loc9_].y);
        } else {
          g.moveTo(this.linePath[_loc9_].x, this.linePath[_loc9_].y);
        }
        this.newLine = !this.newLine;
        _loc9_++;
      }
      if (!this.newLine) {
        g.lineTo(this.x, this.y);
      }
      g.stroke({
        width: this.stats.params[_loc10_ * 3 + 1],
        color: this.stats.params[_loc10_ * 3 + 2],
        alpha: this.stats.params[_loc10_ * 3 + 3],
        cap: 'round',
        join: 'round',
      });
      _loc10_++;
    }
    this.removeMe();
  }

  EnterFrame(): void {}
}
