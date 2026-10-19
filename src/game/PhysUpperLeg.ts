// Port of PhysUpperLeg.as (symbol 688) — ragdoll part sprite (200 costume frames, one per skin), created by PhysActor.
import { Symbol } from '../flash/runtime';
import type { SwfClip } from '../swf/display';

export class PhysUpperLeg extends Symbol {
  /** holstered gun copied from the unit (PhysActor) */
  get gun(): SwfClip {
    return this.child<SwfClip>('gun');
  }

  constructor() {
    super('PhysUpperLeg');
  }
}
