// Port of Bullet_Melee_Basic.as — invisible short-range hitscan.
import { uint } from '../flash/as3';
import { Bullet } from './Bullet';
import type { Game } from './Game';
import type { Unit } from './Unit';

export class Bullet_Melee_Basic extends Bullet {
  constructor(param1: Game, param2: Unit, param3: number, param4: number, param5: number, param6: number, param7: string, param8: Record<string, any> | null = null) {
    super(param1, param2, param3, param4, param5, param6, param7, true, param8);
    let _loc9_ = 0;
    while (_loc9_ < uint(this.maxDist / 10)) {
      this.x += this.xVel;
      this.y += this.yVel;
      if ((this.hitObject = this.hitTestAll())) {
        break;
      }
      _loc9_++;
    }
    this.doHitEffect();
    this.removeMe();
  }

  EnterFrame(): void {}
}
