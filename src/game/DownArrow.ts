// Port of DownArrow.as — tutorial arrow (Arena tut frame, also placed in Hud/Cutscene timelines).
// Not listed in the ownership table; ported by the world group because Arena.Init tests `is DownArrow`.
import { Symbol } from '../flash/runtime';

export class DownArrow extends Symbol {
  constructor() {
    super('DownArrow');
  }
}
