// Port of Score.as — per-unit statistics (kills, deaths, streak counter) and personal score update.
import { int, uint } from '../flash/as3';
import { MatchSettings } from './MatchSettings';
import type { Unit } from './Unit';

export class Score {
  private unit: Unit;
  headshots = 0; // uint
  killed1 = 0; // uint
  killed2 = 0; // uint
  killed3 = 0; // uint
  killed4 = 0; // uint
  bulletsFired = 0; // uint
  bulletsHit = 0; // uint
  flagCap = 0; // uint
  domCap = 0; // uint
  jugKill = 0; // uint
  lives = 0; // int
  kills = 0; // uint
  deaths = 0; // uint
  suicides = 0; // uint
  betrayals = 0; // uint
  killtimer = 0; // uint
  multikill = 0; // uint
  spree = 0; // uint
  streak = 0; // uint

  constructor(param1: Unit) {
    this.unit = param1;
  }

  setKills(param1: number): void {
    this.kills = uint(param1);
    this.updateScore();
  }

  EnterFrame(): void {
    if (!this.killtimer) {
      this.multikill = 0;
    } else {
      --this.killtimer;
    }
  }

  addKill(): void {
    ++this.multikill;
    ++this.spree;
    ++this.kills;
    this.killtimer = uint(3.5 * 30);
    const u: any = this.unit;
    if (Boolean(u.unitInfo.streak.kills && !u.canUseStreak) && Boolean(!u.streakInProgress) && !u.dead) {
      ++this.streak;
      u.setKillstreakNum(this.streak);
      if (
        this.streak >= u.unitInfo.streak.kills ||
        (u.unitInfo.skill.id == 'charisma' && this.streak >= u.unitInfo.streak.kills - 1)
      ) {
        this.streak = 0;
        u.startKillstreak();
      }
    }
    if (u.human) {
      u.game.hud.debug.debug1.text = 'Streak: ' + this.streak;
    }
    this.updateScore();
  }

  addDeath(): void {
    this.spree = 0;
    ++this.deaths;
    this.lives = int(this.lives - 1);
    this.streak = 0;
  }

  addSuicide(): void {
    ++this.suicides;
    this.updateScore();
  }

  addBetrayal(): void {
    ++this.betrayals;
    this.updateScore();
  }

  updateScore(): void {
    const u: any = this.unit;
    switch (MatchSettings.useMode) {
      case 'dm':
      case 'tdm':
      case 'jug':
      case 'zom':
        // uint arithmetic yields a Number in AS3; assigned to int pscore
        u.pscore = int(this.kills - this.suicides - this.betrayals);
    }
    u.game.matchSettings.updateScores();
  }
}
