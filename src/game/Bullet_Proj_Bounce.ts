// Port of Bullet_Proj_Bounce.as — grenade: bounces off terrain, fuse of params[3] seconds.
import { Bullet } from './Bullet';
import { SD } from './SD';
import type { Game } from './Game';
import type { Unit } from './Unit';

export class Bullet_Proj_Bounce extends Bullet {
  private fc: any = 0;

  constructor(param1: Game, param2: Unit, param3: number, param4: number, param5: number, param6: number, param7: string, param8: Record<string, any> | null = null) {
    super(param1, param2, param3, param4, param5, param6, param7, true, param8);
    this.extra.bounce = 0;
    this.doHitEffect();
    this.xVel *= 0.5;
    this.yVel *= 0.5;
  }

  EnterFrame(): void {
    ++this.fc;
    this.yVel += this.stats.params[2] * 0.1;
    let _loc1_ = 0;
    while (_loc1_ < this.stats.params[1]) {
      this.game.createEffect(this.x, this.y, this.stats.params[0]);
      this.x += this.xVel;
      this.y += this.yVel;
      if (SD.graphPart) {
        this.game.createEffect(this.x, this.y, this.stats.params[0]);
      }
      this.x += this.xVel;
      this.y += this.yVel;
      if ((this.hitObject = this.hitTestAll(0, 0, true))) {
        break;
      }
      if (this.hitTestWall(0, 0)) {
        if (this.hitTestWall(0, 15)) {
          ++this.extra.bounce;
          this.y -= this.yVel * 4;
          this.yVel *= -0.5;
          this.xVel *= 0.8;
        }
        if (this.hitTestWall(0, -15)) {
          ++this.extra.bounce;
          this.y -= this.yVel * 4;
          this.yVel *= -0.5;
          this.xVel *= 0.8;
        }
        if (this.hitTestWall(10, -10)) {
          ++this.extra.bounce;
          this.x -= this.xVel * 2;
          this.xVel *= -0.6;
          this.yVel *= 0.7;
        }
        if (this.hitTestWall(-10, -10)) {
          ++this.extra.bounce;
          this.x -= this.xVel * 2;
          this.xVel *= -0.6;
          this.yVel *= 0.7;
        }
      }
      _loc1_++;
    }
    this.doHitEffect();
    if (this.fc == this.stats.params[3] * 30) {
      this.doHitEffect(true);
    }
    if (this.x < 0 || this.x > 3000 || this.y < 0 || this.y > 3000) {
      this.removeMe();
    }
  }
}
