// Port of NodeAiAction.as — AI action box ("j" jump, "c" crouch, "fc"/"fp"/"fd" foundry re-route).
// Instance name "<action>_<waypointIds>". Top-left registration, 69x69 local bounds.
import { Rectangle } from 'pixi.js';
import { Symbol } from '../flash/runtime';
import type { SwfTextField } from '../swf/display';
import { onFlashName } from './nameInit';

export class NodeAiAction extends Symbol {
  con: string = null as any;
  action: string = null as any;

  get txt_con(): SwfTextField {
    return this.child<SwfTextField>('txt_con');
  }
  get txt_action(): SwfTextField {
    return this.child<SwfTextField>('txt_action');
  }

  constructor() {
    super('NodeAiAction');
    // AI.as reads `width`/`height` of this box. Flash bounds = union of the 69x69 shape (-1..68) and the two
    // edit-text boxes (inside it). Pixi would measure rendered text glyphs instead, so pin the Flash bounds.
    this.boundsArea = new Rectangle(-1, -1, 69, 69);
  }

  /** Tail of the AS3 constructor that reads `name` (Flash sets the name before construction). */
  private nameInit(name: string): void {
    const _loc1_: string[] = name.split('_');
    this.action = _loc1_[0];
    this.con = _loc1_[1];
    this.txt_con.text = this.con.toUpperCase();
    switch (this.action) {
      case 'c':
        this.txt_action.text = 'Crouch';
        break;
      case 'j':
        this.txt_action.text = 'Jump';
        break;
      case 'fp':
        this.txt_action.text = 'Fix P';
        break;
      case 'fc':
        this.txt_action.text = 'Fix C';
        break;
      case 'fd':
        this.txt_action.text = 'Fix D';
    }
    this.visible = false;
  }

  static {
    onFlashName(NodeAiAction, (o, n) => o.nameInit(n));
  }
}
