// Port of Bullet_Proj_Mine.as — Bouncing Betty: drops, arms on landing, triggers on standing enemies.
import { trace, uint } from '../flash/as3';
import { Bullet } from './Bullet';
import { UT } from './UT';
import type { Game } from './Game';
import type { Unit } from './Unit';

export class Bullet_Proj_Mine extends Bullet {
  private fc = 0;
  private hitWall = false;
  private activated = false;

  constructor(param1: Game, param2: Unit, param3: number, param4: number, param5: number, param6: number, param7: string, param8: Record<string, any> | null = null) {
    super(param1, param2, param3, param4, param5, param6, param7, true, param8);
    this.y -= 30;
    this.yVel = 0;
    trace('Mine created');
  }

  EnterFrame(): void {
    let _loc1_ = 0;
    ++this.fc;
    if (this.activated) {
      this.game.bitscreen.paint(this.x + this.game.arena.x, this.y + this.game.arena.y - 15, true, 'mine0', 'activate', this.fc);
      if (this.fc == 13) {
        this.y -= 40;
        this.doHitEffect(true);
      }
    } else {
      if (!this.hitWall) {
        this.yVel += 2;
        if (this.yVel > 15) {
          this.yVel = 15;
        }
        this.y += this.yVel;
        if (this.hitTestWall(0, 8)) {
          while (this.hitTestWall(0, 8)) {
            this.y -= 3;
          }
          this.hitWall = true;
        }
      } else {
        const units: any[] = this.game.units;
        _loc1_ = 0;
        while (_loc1_ < units.length) {
          if (units[_loc1_] != this.unit) {
            if (!units[_loc1_].dead) {
              if (!(Boolean(this.unit.team) && this.unit.team == units[_loc1_].team)) {
                if (!units[_loc1_].mov.crouching) {
                  if (UT.inBox(units[_loc1_].x, units[_loc1_].y, this.x - 50, this.y - 80, 100, 100)) {
                    this.game.playScreenSound('S_rocketFire', this.x, this.y);
                    this.activated = true;
                    this.fc = 0;
                  }
                }
              }
            }
          }
          _loc1_++;
        }
      }
      if (!(uint(this.fc / 2) % 15 == 0 && this.hitWall)) {
        this.game.bitscreen.paint(this.x + this.game.arena.x, this.y + this.game.arena.y - 15, true, 'mine0', 'off');
      } else {
        this.game.bitscreen.paint(this.x + this.game.arena.x, this.y + this.game.arena.y - 15, true, 'mine0', !(this.unit.human || this.unit.team == 1) ? 'enemy' : 'team');
        this.game.playScreenSound('S_Beep', this.x, this.y);
      }
    }
  }

  protected override removeMe(): void {
    this.remove = true;
  }
}
