// Port of NodeCtfFlag.as — CTF flag base. Instance name "<waypointId>__<team>" (double underscore).
import { uint } from '../flash/as3';
import { Symbol } from '../flash/runtime';
import type { SwfClip } from '../swf/display';
import { onFlashName } from './nameInit';

export class NodeCtfFlag extends Symbol {
  id: string = null as any;
  team = 0; // uint
  unitCaptured: any = undefined;

  get rim(): SwfClip {
    return this.child<SwfClip>('rim');
  }
  get flag(): SwfClip {
    return this.child<SwfClip>('flag');
  }

  constructor() {
    super('NodeCtfFlag');
  }

  /** Tail of the AS3 constructor that reads `name` (Flash sets the name before construction). */
  private nameInit(name: string): void {
    let _loc1_: string[] = null as any;
    _loc1_ = name.split('__');
    this.id = _loc1_[0];
    this.flag.visible = true;
    this.team = uint(Number(_loc1_[1]));
  }

  static {
    onFlashName(NodeCtfFlag, (o, n) => o.nameInit(n));
  }

  setTeam(param1: number): void {
    this.team = uint(param1);
    this.gotoAndStop(param1);
    this.flag.gotoAndStop('flag' + param1);
  }

  capture(param1: any): void {
    if (this.team == param1.team) {
      if (param1.hasFlag) {
        if (param1.human) {
          ++param1.score.flagCap;
        }
        param1.game.hud.addCustomFeed(param1, 'flag');
        ++param1.pscore;
        param1.gun.resetFrame();
        param1.hasFlag.reset();
        param1.game.matchSettings.updateScores();
        param1.game.playScreenSound('S_Skill', param1.x, param1.y);
      }
    } else {
      if (this.unitCaptured) {
        return;
      }
      this.unitCaptured = param1;
      this.flag.visible = false;
      this.alpha = 0.7;
      this.rim.stop();
      param1.status.sInvis = 0;
      param1.hasFlag = this;
      param1.gun.resetFrame();
      param1.gun.swapGuns();
      param1.game.playScreenSound('S_Equip', param1.x, param1.y);
    }
  }

  reset(): void {
    const _loc1_: any = this.unitCaptured;
    this.unitCaptured.hasFlag = null;
    this.unitCaptured.gun.swapGuns();
    this.unitCaptured = null;
    this.flag.visible = true;
    this.alpha = 1;
    this.rim.play();
  }
}
