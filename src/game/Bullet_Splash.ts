// Port of Bullet_Splash.as — instant area burst at the muzzle point (Martyrdom, Combustion, "none").
import { Bullet } from './Bullet';
import type { Game } from './Game';
import type { Unit } from './Unit';

export class Bullet_Splash extends Bullet {
  countDistX = NaN;
  countDistY = NaN;

  constructor(param1: Game, param2: Unit, param3: number, param4: number, param5: number, param6: number, param7: string, param8: Record<string, any> | null = null) {
    super(param1, param2, param3, param4, param5, param6, param7, true, param8);
    if (!this.stats.params[0]) {
      this.hitType = 'unit';
      this.hitObject = this.unit;
    }
    if (this.stats.effHit) {
      this.game.createEffect(this.x, this.y, this.stats.effHit);
    }
    this.checkSplash();
    this.removeMe();
  }

  EnterFrame(): void {}
}
