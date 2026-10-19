// Port of NodePickup.as — health / ammo pickup. Instance name "<type>_<respawnSeconds>".
import { uint } from '../flash/as3';
import { Symbol } from '../flash/runtime';
import type { SwfClip } from '../swf/display';
import type { Game } from './Game';
import { SH } from './SH';
import { UT } from './UT';
import type { Unit } from './Unit';
import { onFlashName } from './nameInit';

export class NodePickup extends Symbol {
  game: Game = null as any;
  id: string = null as any;
  private spawnTime = 0; // uint
  taken = 0; // uint
  private yRot = 0; // uint

  get rim(): SwfClip {
    return this.child<SwfClip>('rim');
  }

  constructor() {
    super('NodePickup');
  }

  /** Tail of the AS3 constructor that reads `name` (Flash sets the name before construction). */
  private nameInit(name: string): void {
    const _loc1_: string[] = name.split('_');
    this.id = _loc1_[0];
    this.spawnTime = uint(Number(_loc1_[1]));
    switch (this.id) {
      case 'ammo':
      case 'ammobig':
        this.gotoAndStop('yellow');
        break;
      case 'health':
      case 'healthbig':
        this.gotoAndStop('green');
    }
  }

  static {
    onFlashName(NodePickup, (o, n) => o.nameInit(n));
  }

  EnterFrame(): void {
    if (this.taken) {
      --this.taken;
      this.alpha = 0.5;
      this.rim.stop();
    } else {
      this.yRot = uint(this.yRot + 5);
      // quirk kept: `rotation * 0.5` is added to the screen x (pickups are never rotated in practice)
      this.game.bitscreen.paint(
        this.x + this.game.arena.x + this.angle * 0.5,
        this.y + this.game.arena.y - 30 - UT.yMoveToRot(this.yRot, 4),
        true,
        'pickups0',
        this.id,
      );
      this.alpha = 1;
      this.rim.play();
    }
  }

  getPickup(param1: Unit): void {
    switch (this.id) {
      case 'health':
        if (param1.human) {
          SH.playSound('S_Heal');
        }
        param1.status.heal(param1.status.hpMax * 0.5);
        break;
      case 'healthbig':
        if (param1.human) {
          SH.playSound('S_Heal');
        }
        param1.status.heal(param1.status.hpMax);
        break;
      case 'ammo':
        if (param1.human) {
          SH.playSound('S_Equip');
        }
        param1.gun.addAmmo(0.5);
        break;
      case 'ammobig':
        if (param1.human) {
          SH.playSound('S_Equip');
        }
        param1.gun.addAmmo(1);
    }
    this.taken = uint(this.spawnTime * 30);
  }
}
