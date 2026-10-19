// Port of NodeWaypoint.as — AI navigation node placed on Arena frames. Instance name "<id>_<connects>".
import type { Graphics } from 'pixi.js';
import { Symbol } from '../flash/runtime';
import type { SwfTextField } from '../swf/display';
import type { Arena } from './Arena';
import type { NodeAiAction } from './NodeAiAction';
import { onFlashName } from './nameInit';

export class NodeWaypoint extends Symbol {
  arena: Arena = null as any;
  id: string = null as any;
  con: string = null as any;
  connects: NodeWaypoint[] = null as any;
  actionBoxes: NodeAiAction[] = null as any;

  get txt_con(): SwfTextField {
    return this.child<SwfTextField>('txt_con');
  }
  get txt_id(): SwfTextField {
    return this.child<SwfTextField>('txt_id');
  }

  constructor() {
    super('NodeWaypoint');
    this.actionBoxes = new Array();
    this.connects = new Array();
    // name-dependent part of the AS3 constructor: see nameInit() (runs when the label is assigned)
  }

  /** Tail of the AS3 constructor that reads `name` (Flash sets the name before construction). */
  private nameInit(name: string): void {
    const _loc1_: string[] = name.split('_');
    this.id = _loc1_[0];
    this.con = _loc1_[1];
    this.txt_id.text = this.id.toUpperCase();
    this.txt_con.text = this.con;
    this.visible = false;
  }

  static {
    onFlashName(NodeWaypoint, (o, n) => o.nameInit(n));
  }

  setConnectors(param1: Record<string, NodeWaypoint>): void {
    let _loc2_ = 0;
    while (_loc2_ < this.con.length) {
      this.connects.push(param1[this.con.charAt(_loc2_)]);
      _loc2_++;
    }
  }

  /** Debug only (Main.DEBUGMODE "O" key). botCont is a timeline MovieClip in Flash; here we draw into a
   * Graphics child of botCont created on demand (Flash MovieClip.graphics equivalent). */
  showConnectors(param1: boolean): void {
    let _loc2_ = 0;
    const g = NodeWaypoint.botGraphics(this.arena);
    if (!param1) {
      g.clear();
    } else {
      _loc2_ = 0;
      while (_loc2_ < this.connects.length) {
        g.moveTo(this.x, this.y - 20)
          .lineTo((this.x + this.connects[_loc2_].x) * 0.5, (this.y + this.connects[_loc2_].y) * 0.5 - 20)
          .stroke({ width: 3, color: 16776960, alpha: 0.3 });
        _loc2_++;
      }
      _loc2_ = 0;
      while (_loc2_ < this.actionBoxes.length) {
        g.moveTo(this.x, this.y - 20)
          .lineTo(
            this.actionBoxes[_loc2_].x + this.actionBoxes[_loc2_].width / 2,
            this.actionBoxes[_loc2_].y + this.actionBoxes[_loc2_].height / 2,
          )
          .stroke({ width: 3, color: 16751103, alpha: 0.3 });
        _loc2_++;
      }
    }
  }

  private static botGraphics(arena: Arena): Graphics {
    return arena.botContGraphics();
  }

  setActionBox(param1: NodeAiAction): void {
    this.actionBoxes.push(param1);
  }
}
