// Port of Killstreak_Radar.as — +5 AI difficulty for the owner's team for 10 s (radar shown by Radar).
import type { Game } from './Game';

export class Killstreak_Radar {
  private game: Game;
  unit: any;
  private fc = 0; // uint

  constructor(param1: Game, param2: any) {
    this.game = param1;
    this.unit = param2;
    this.setDifficulties();
  }

  EnterFrame(): void {
    ++this.fc;
    if (this.fc % 20 == 0) {
      this.setDifficulties();
    }
    if (this.fc >= 30 * 10) {
      this.end();
    }
  }

  setDifficulties(): void {
    let _loc1_ = 0;
    const units: any[] = this.game.units;
    if (this.unit.team != 0) {
      _loc1_ = 0;
      while (_loc1_ < units.length) {
        if (units[_loc1_].team == this.unit.team) {
          units[_loc1_].setDiffStats(units[_loc1_].odiff + 5);
        }
        _loc1_++;
      }
    } else {
      _loc1_ = 0;
      while (_loc1_ < units.length) {
        if (units[_loc1_] == this.unit) {
          units[_loc1_].setDiffStats(units[_loc1_].odiff + 5);
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
