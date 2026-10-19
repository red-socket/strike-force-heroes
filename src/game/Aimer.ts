// Port of Aimer.as (symbol 1431) — the crosshair. Frame 1: four lines + circle (positioned/sized by
// Player.EnterFrame); frame 2: sniper scope (never used: Player.sniperMode is never set).
import { Symbol } from '../flash/runtime';
import type { SwfClip } from '../swf/display';

export class Aimer extends Symbol {
  get line1(): SwfClip {
    return this.child<SwfClip>('line1');
  }
  get line2(): SwfClip {
    return this.child<SwfClip>('line2');
  }
  get circle(): SwfClip {
    return this.child<SwfClip>('circle');
  }
  get line3(): SwfClip {
    return this.child<SwfClip>('line3');
  }
  get line4(): SwfClip {
    return this.child<SwfClip>('line4');
  }

  constructor() {
    super('Aimer');
    // Moved / resized from code every frame (Player.EnterFrame)
    for (const n of ['line1', 'line2', 'line3', 'line4', 'circle']) {
      const c = this.maybeChild(n);
      if (c) c.scripted = true;
    }
  }
}
