// Port of NodeHoldpoint.as — Domination capture point (lettered A.. by Arena.Init).
import { uint } from '../flash/as3';
import { Symbol } from '../flash/runtime';
import type { SwfClip } from '../swf/display';

export class NodeHoldpoint extends Symbol {
  curTeam = 0; // uint
  unitCaptured: any = undefined;
  private flagPos = NaN;
  private flagSpd = NaN;
  letter = 'X';

  get flag(): SwfClip {
    return this.child<SwfClip>('flag');
  }

  constructor() {
    super('NodeHoldpoint');
    this.flag.scripted = true; // code drives flag.y
    this.curTeam = 0;
    this.flagPos = -65;
    this.flagSpd = 1;
    this.flag.y = this.flagPos;
    this.gotoAndStop(this.curTeam + 1);
    this.flag.gotoAndStop(this.curTeam + 1);
  }

  capture(param1: any): void {
    if (param1.team == this.curTeam) {
      this.flagPos -= this.flagSpd;
      if (this.flagPos < -65) {
        this.flagPos = -65;
      }
    } else {
      this.flagPos += this.flagSpd;
      if (this.flagPos >= -10) {
        this.curTeam = uint(param1.team);
        this.gotoAndStop(this.curTeam + 1);
        this.flag.gotoAndStop(this.curTeam + 1);
        this.unitCaptured = param1;
        param1.game.hud.addCustomFeed(param1, 'holdpoint');
        if (param1.human) {
          ++param1.score.domCap;
        }
        this.flagPos = -15;
      }
    }
    this.flag.y = this.flagPos;
  }
}
