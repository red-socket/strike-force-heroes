// Port of Effect.as — one-shot BH bitmap animation painted into the bitscreen, one frame per tick.
import { uint } from '../flash/as3';
import { BH } from './BH';
import { UT } from './UT';
import type { Game } from './Game';

export class Effect {
  private game: Game;
  remove = false;
  private name: string;
  private sub: string;
  private x: number;
  private y: number;
  private stats: any = null;
  private frame = 0;
  private rotation = 0;

  constructor(param1: Game, param2: number, param3: number, param4: string, param5: string, param6: number) {
    this.game = param1;
    this.x = param2;
    this.y = param3;
    this.name = param4;
    this.sub = param5;
    try {
      this.stats = BH.getBitAniStats(this.name + 0, this.sub);
    } catch {
      // DEVIATION: the original throws here for sheets that BH never registered (mud_splash,
      // snow_splash, leaf_splash, leaves…), aborting the rest of the tick. We make the effect inert.
      this.remove = true;
      this.frame = uint(param6);
      return;
    }
    this.rotation = uint(UT.irand(0, this.stats.rotAmt - 1));
    this.frame = uint(param6);
    this.name += this.rotation;
  }

  EnterFrame(): void {
    if (!this.remove) {
      this.game.bitscreen.paint(this.x + this.game.arena.x, this.y + this.game.arena.y, true, this.name, this.sub, this.frame);
      ++this.frame;
      if (this.frame > this.stats.frames) {
        this.remove = true;
      }
      return;
    }
  }
}
