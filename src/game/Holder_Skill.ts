// Port of Holder_Skill.as — shop/loadout skill or killstreak tile (symbol763).
import { Symbol } from '../flash/runtime';
import type { SwfClip, SwfTextField } from '../swf/display';
import { SD, type ClassSave } from './SD';
import { UT } from './UT';
import { Stats_Skills } from './Stats_Skills';
import { Stats_Streaks } from './Stats_Streaks';
import { parentClip } from './Holder_Gun';

const tf = (mc: SwfClip, name: string) => mc.child<SwfTextField>(name);

export class Holder_Skill extends Symbol {
  get txt_kills(): SwfTextField {
    return this.child<SwfTextField>('txt_kills');
  }
  get txt_name(): SwfTextField {
    return this.child<SwfTextField>('txt_name');
  }
  get mc_skill(): SwfClip {
    return this.child<SwfClip>('mc_skill');
  }
  get txt_status(): SwfTextField {
    return this.child<SwfTextField>('txt_status');
  }

  skill: Stats_Skills | null = null;
  streak: Stats_Streaks | null = null;

  /** See Holder_Gun._parent: resolved lazily instead of captured in the constructor. */
  private get _parent(): SwfClip {
    return parentClip(this)!;
  }

  constructor(param1: any = null) {
    super('Holder_Skill');
    this.addFrameScript(0, () => this.frame1());
    if (Boolean(param1) && param1 instanceof Stats_Skills) {
      this.setSkill(param1, true);
    }
    if (Boolean(param1) && param1 instanceof Stats_Streaks) {
      this.setStreak(param1, true);
    }
  }

  setSkill(param1: Stats_Skills, param2 = false): void {
    this.skill = param1;
    this.txt_name.text = this.skill.name;
    this.mc_skill.gotoAndStop(this.skill.sprite);
    this.txt_kills.text = '';
    this.streak = null;
    if (!param2) {
      this.txt_status.text = '';
    } else {
      this.setStatus();
    }
  }

  setStreak(param1: Stats_Streaks, param2 = false): void {
    this.streak = param1;
    this.txt_name.text = this.streak.name;
    this.mc_skill.gotoAndStop(this.streak.sprite);
    if (!this.streak.kills) {
      this.txt_kills.text = '';
    } else {
      this.txt_kills.text = this.streak.kills + ' kills';
    }
    this.skill = null;
    if (!param2) {
      this.txt_status.text = '';
    } else {
      this.setStatus();
    }
  }

  setStatus(): void {
    const save = SD.classSaves[SD.selClass] as ClassSave;
    if (!this.skill) {
      if (this.streak) {
        if (save.streak != this.streak.id) {
          if (save.level >= this.streak.lvlReq) {
            if (SD.unlocks.indexOf(this.streak.id) == -1) {
              this.txt_status.textColor = 16764006;
              this.txt_status.text = '$' + UT.addNumCommas(this.streak.cost);
            } else {
              this.txt_status.text = '';
            }
          } else {
            this.txt_status.textColor = 16750899;
            this.txt_status.text = 'Req lvl ' + this.streak.lvlReq;
          }
        } else {
          this.txt_status.textColor = 13421772;
          this.txt_status.text = 'Equipped';
        }
      }
    } else if (save.skill != this.skill.id) {
      if (save.level >= this.skill.lvlReq) {
        if (SD.unlocks.indexOf(this.skill.id) == -1) {
          this.txt_status.textColor = 16764006;
          this.txt_status.text = '$' + UT.addNumCommas(this.skill.cost);
        } else {
          this.txt_status.text = '';
        }
      } else {
        this.txt_status.textColor = 16750899;
        this.txt_status.text = 'Req lvl ' + this.skill.lvlReq;
      }
    } else {
      this.txt_status.textColor = 13421772;
      this.txt_status.text = 'Equipped';
    }
  }

  setText(param1: SwfClip): void {
    if (this.skill) {
      tf(this._parent, 'txt_special').text = this.skill.special;
      tf(param1, 'txt_desc').text = this.skill.desc;
      this.txt_name.text = '';
      tf(this._parent, 'txt_name').text = this.skill.name;
      tf(this._parent, 'txt_type').text = '';
    }
    if (this.streak) {
      if (this.streak.id == 'none') {
        tf(this._parent, 'txt_special').text = '';
      } else {
        tf(this._parent, 'txt_special').text = this.streak.kills + ' kills\nPress E or Ctrl to activate\n';
        tf(this._parent, 'txt_special').text += this.streak.special;
      }
      tf(param1, 'txt_desc').text = this.streak.desc;
      this.txt_name.text = '';
      this.txt_kills.text = '';
      tf(this._parent, 'txt_name').text = this.streak.name;
      tf(this._parent, 'txt_type').text = '';
    }
  }

  frame1(): void {
    this.stop();
  }
}
