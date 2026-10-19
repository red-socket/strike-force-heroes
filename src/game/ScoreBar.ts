// Port of ScoreBar.as — one scoreboard row (symbol 1556). Frames: top, ffa_player/ffa_ai,
// team<N>_player/team<N>_ai (team<N>_player doubles as the team header row).
import { int } from '../flash/as3';
import { Symbol } from '../flash/runtime';
import type { SwfClip, SwfTextField } from '../swf/display';

export class ScoreBar extends Symbol {
  get txt_deaths(): SwfTextField {
    return this.child<SwfTextField>('txt_deaths');
  }
  get icon_status(): SwfClip {
    return this.child<SwfClip>('icon_status');
  }
  get txt_score(): SwfTextField {
    return this.child<SwfTextField>('txt_score');
  }
  get txt_kills(): SwfTextField {
    return this.child<SwfTextField>('txt_kills');
  }
  get icon_class(): SwfClip {
    return this.child<SwfClip>('icon_class');
  }
  get txt_name(): SwfTextField {
    return this.child<SwfTextField>('txt_name');
  }

  private unit: any = undefined;

  constructor(param1: number, param2: any = null, param3 = '', param4 = '', param5 = 0) {
    super('ScoreBar');
    param5 = int(param5);
    this.y = param1;
    this.unit = param2;
    if (Boolean(param3) && !param4) {
      this.gotoAndStop(param3);
      this.icon_status.visible = false;
      this.icon_class.visible = false;
    } else if (!(Boolean(param3) && Boolean(param4))) {
      if (this.unit.team) {
        this.gotoAndStop('team' + this.unit.team + '_' + (!this.unit.human ? 'ai' : 'player'));
      } else {
        this.gotoAndStop('ffa_' + (this.unit.human ? 'player' : 'ai'));
      }
      this.icon_class.gotoAndStop(this.unit.unitInfo.icon);
      this.txt_name.text = this.unit.label; // AS3 unit.name (Unit sets name = unitInfo.name)
      this.txt_score.text = '' + this.unit.pscore;
      this.txt_kills.text = '' + this.unit.score.kills;
      this.txt_deaths.text = '' + this.unit.score.deaths;
      if (!this.unit.dead) {
        this.icon_status.visible = false;
      } else {
        this.icon_status.gotoAndStop('dm');
      }
    } else {
      this.gotoAndStop(param3);
      this.icon_status.visible = false;
      this.icon_class.visible = false;
      this.txt_name.text = param4;
      this.txt_score.text = '' + param5;
      this.txt_kills.text = '';
      this.txt_deaths.text = '';
    }
  }
}
