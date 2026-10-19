// Port of Stats_Achievements.as — achievement ("medal") data + the single popup instance
// (linked symbol 716). Main creates one instance via `new Stats_Achievements()` and keeps it on
// top of every screen; its timeline (frame 2 onwards = popup animation) is advanced by the normal
// SwfClip.tick of the stage tree, exactly like the AS3 (no EnterFrame logic of its own).
import { uint, trace } from '../flash/as3';
import { Symbol } from '../flash/runtime';
import type { SwfClip, SwfTextField } from '../swf/display';
import { SD } from './SD';
import { SH } from './SH';
import { Stats_Misc } from './Stats_Misc';

export class Stats_Achievements extends Symbol {
  static achOrder: string[];

  static ach: Stats_Achievements;

  get icon(): SwfClip {
    return this.child<SwfClip>('icon');
  }

  get txt_desc(): SwfTextField {
    return this.child<SwfTextField>('txt_desc');
  }

  get txt_name(): SwfTextField {
    return this.child<SwfTextField>('txt_name');
  }

  get txt_unlock(): SwfTextField {
    return this.child<SwfTextField>('txt_unlock');
  }

  constructor() {
    super('Stats_Achievements');
    this.addFrameScript(0, () => this.frame1());
    this.stop();
    Stats_Achievements.ach = this;
  }

  static Init(): void {
    Stats_Achievements.achOrder = ['campaign', 'challenges', 'level50', 'allguns', 'allstreaks', 'allskills', 'plug', 'lava', 'drown', 'tutbody'];
  }

  static getAchievementNum(param1: any): any {
    return Stats_Achievements.getAchievement(Stats_Achievements.achOrder[param1]);
  }

  static getAchievement(param1: string): any {
    let _loc2_: any = {};
    _loc2_.id = param1;
    _loc2_.sprite = param1;
    switch(param1)
    {
      case "campaign":
        _loc2_.name = "The End?";
        _loc2_.desc = "Complete the Campaign.";
        break;
      case "challenges":
        _loc2_.name = "Strike Force Hero";
        _loc2_.desc = "Defeat the creators of the game.";
        break;
      case "level50":
        _loc2_.name = "Maxed";
        _loc2_.desc = "Reach level 50 with any soldier.";
        break;
      case "allguns":
        _loc2_.name = "Guns and Ammo";
        _loc2_.desc = "Buy all primary guns with any soldier.";
        break;
      case "allstreaks":
        _loc2_.name = "Streaking";
        _loc2_.desc = "Buy all killstreaks with any soldier.";
        break;
      case "allskills":
        _loc2_.name = "Skilled";
        _loc2_.desc = "Buy all skills with any soldier.";
        break;
      case "plug":
        _loc2_.name = "Human Plug";
        _loc2_.desc = "Hold the flow.";
        _loc2_.unlock = "sky9";
        _loc2_.secret = true;
        break;
      case "lava":
        _loc2_.name = "Embarassing!";
        _loc2_.desc = "Die by falling lava during your killstreak.";
        _loc2_.unlock = "party";
        _loc2_.secret = true;
        break;
      case "drown":
        _loc2_.name = "Waterwings";
        _loc2_.desc = "Drown in the dirty water.";
        _loc2_.unlock = "ammo";
        _loc2_.secret = true;
        break;
      case "tutbody":
        _loc2_.name = "Detective";
        _loc2_.desc = "Investigate the facility.";
        _loc2_.unlock = "bodypop";
        _loc2_.secret = true;
    }
    return _loc2_;
  }

  /** AS3 returns uint: an unknown id (-1) wraps to 4294967295 (kept). */
  private static idToNum(param1: string): number {
    return uint(Stats_Achievements.achOrder.indexOf(param1));
  }

  static setAchievement(param1: any): void {
    // SD.achievements holds achievement indices (numbers) despite its declared type.
    const achievements = SD.achievements as unknown as number[];
    const _loc2_: number = Stats_Achievements.idToNum(param1);
    if (achievements.indexOf(_loc2_) == -1) {
      const _loc3_: any = Stats_Achievements.getAchievement(param1);
      achievements.push(_loc2_);
      SH.playSound('S_Medal', true);
      SD.saveGame();
      trace('Got achievement', _loc3_.name);
      // analytics: Log.CustomMetric(_loc3_.name, "Achievemens");
      const ach = Stats_Achievements.ach;
      ach.icon.gotoAndStop(_loc3_.sprite);
      ach.txt_name.text = _loc3_.name;
      ach.txt_desc.text = _loc3_.desc;
      ach.txt_unlock.text = !_loc3_.unlock ? '' : Stats_Misc.getMod(_loc3_.unlock).name + ' mod unlocked!';
      ach.gotoAndPlay(2);
      return;
    }
  }

  frame1(): any {
    this.stop();
  }
}
