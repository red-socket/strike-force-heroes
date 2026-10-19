// Port of NodeWaypointPath.as — a candidate path (string of waypoint ids) ranked by summed length.
import { uint } from '../flash/as3';
import type { NodeWaypoint } from './NodeWaypoint';
import { UT } from './UT';

export class NodeWaypointPath {
  dist = NaN;
  nodes = 0; // uint
  path: string = null as any;

  constructor(param1: any, param2: Record<string, NodeWaypoint>) {
    this.path = param1;
    this.nodes = uint(this.path.length);
    this.dist = 0;
    let _loc3_ = 0;
    // `nodes - 1` is Number arithmetic in AS3 (no uint wrap); paths always have >= 2 chars here.
    while (_loc3_ < this.nodes - 1) {
      this.dist += UT.getDist(
        param2[this.path.charAt(_loc3_)].x,
        param2[this.path.charAt(_loc3_)].y,
        param2[this.path.charAt(_loc3_ + 1)].x,
        param2[this.path.charAt(_loc3_ + 1)].y,
      );
      _loc3_++;
    }
  }
}
