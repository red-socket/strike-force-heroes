// Port of NodeSpawn.as — spawn marker. Instance name "<waypointId>_<team>" (team "" = FFA/0, 1, 2).
import { uint } from '../flash/as3';
import { Symbol } from '../flash/runtime';
import type { SwfTextField } from '../swf/display';
import type { NodeWaypoint } from './NodeWaypoint';
import { onFlashName } from './nameInit';

export class NodeSpawn extends Symbol {
  id: string = null as any;
  team = 0; // uint
  waypoint: NodeWaypoint = null as any;
  initialSpawned = false;

  get txt_id(): SwfTextField {
    return this.child<SwfTextField>('txt_id');
  }

  constructor() {
    super('NodeSpawn');
  }

  /** Tail of the AS3 constructor that reads `name` (Flash sets the name before construction). */
  private nameInit(name: string): void {
    const _loc1_: string[] = name.split('_');
    this.id = _loc1_[0];
    if (_loc1_[1] == '') {
      this.team = 0;
    } else {
      this.team = uint(Number(_loc1_[1])); // uint = String
    }
    this.txt_id.text = this.id.toUpperCase();
    this.visible = false;
  }

  static {
    onFlashName(NodeSpawn, (o, n) => o.nameInit(n));
  }

  setWaypoint(param1: NodeWaypoint): void {
    this.waypoint = param1;
  }
}
