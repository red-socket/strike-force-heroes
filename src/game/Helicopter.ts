// Port of Helicopter.as — linked symbol (symbol1417) used by Killstreak_Helicopter.
import { Symbol } from '../flash/runtime';
import type { SwfClip } from '../swf/display';

export class Helicopter extends Symbol {
  get gun(): SwfClip {
    return this.child<SwfClip>('gun');
  }

  constructor() {
    super('Helicopter');
  }
}
