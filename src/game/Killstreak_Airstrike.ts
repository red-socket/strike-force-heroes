// Port of Killstreak_Airstrike.as — a line of "airs" bombs dropped across the map.
import { trace } from '../flash/as3';
import { Stats_Guns } from './Stats_Guns';
import type { BulletClass } from './Bullet';
import type { Game } from './Game';

export class Killstreak_Airstrike {
  private game: Game;
  unit: any;
  private maxWidth = NaN;
  x = NaN;
  y = NaN;
  private fc = 0; // uint
  private endTimer = 0; // uint

  constructor(param1: Game, param2: any) {
    this.game = param1;
    this.unit = param2;
    this.maxWidth = this.game.arena.wall.width;
    this.x = 80;
    this.y = 80;
    trace('airstrike created');
  }

  EnterFrame(): void {
    ++this.fc;
    if (this.endTimer) {
      ++this.endTimer;
      if (this.endTimer >= 60) {
        this.end();
      }
    } else if (this.fc > 50 && this.fc % 3 == 0) {
      trace('Shoot missile');
      this.game.bullets.push(
        new (Stats_Guns.gunOb['airs'].cls as BulletClass)(this.game, this.unit, 180, this.x, this.y, 0, 'airs', { noUnit: true }),
      );
      this.x += 150;
      if (this.x >= this.maxWidth - 80) {
        this.endTimer = 1;
      }
    }
  }

  end(): void {
    this.unit.endKillstreak();
    this.game.killstreaks.splice(this.game.killstreaks.indexOf(this), 1);
  }
}
