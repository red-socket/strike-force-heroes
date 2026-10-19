// Port of Killstreak_Gas.as — green screen tint + AI accuracy debuff for the other team.
import type { Game } from './Game';

export class Killstreak_Gas {
  private game: Game;
  unit: any;
  private fc = 0; // uint
  private alpha = 0;
  private gasOn = false;
  private gasMax = NaN;

  constructor(param1: Game, param2: any) {
    this.game = param1;
    this.unit = param2;
    if (!(Boolean(this.unit.human) || this.unit.team == 1)) {
      this.gasMax = 0.98;
    } else {
      this.gasMax = 0.6;
    }
    this.setDifficulties();
  }

  EnterFrame(): void {
    ++this.fc;
    if (this.fc % 20 == 0) {
      this.setDifficulties();
    }
    if (this.gasOn) {
      ++this.fc;
      if (this.fc >= 9 * 30) {
        this.alpha -= 0.02;
        if (this.alpha < 0) {
          this.alpha = 0;
          this.end();
        }
      }
    } else {
      this.alpha += 0.04;
      if (this.alpha >= this.gasMax) {
        this.alpha = this.gasMax;
        this.gasOn = true;
      }
    }
    // bitscreen.data.fillRect(bitscreen.rect, (alpha*255 << 24) + 0x3300)
    this.game.bitscreen.fill(((this.alpha * 255) << 24) + 13056);
  }

  setDifficulties(): void {
    let _loc1_ = 0;
    const units: any[] = this.game.units;
    if (this.unit.team != 0) {
      _loc1_ = 0;
      while (_loc1_ < units.length) {
        if (units[_loc1_].team != this.unit.team) {
          units[_loc1_].setDiffStats(units[_loc1_].odiff - 5, false, false);
        }
        _loc1_++;
      }
    } else {
      _loc1_ = 0;
      while (_loc1_ < units.length) {
        if (units[_loc1_] != this.unit) {
          units[_loc1_].setDiffStats(units[_loc1_].odiff - 5, false, false);
        }
        _loc1_++;
      }
    }
  }

  end(): void {
    this.unit.endKillstreak();
    this.game.killstreaks.splice(this.game.killstreaks.indexOf(this), 1);
    const units: any[] = this.game.units;
    let _loc1_ = 0;
    while (_loc1_ < units.length) {
      units[_loc1_].setDiffStats();
      _loc1_++;
    }
  }
}
