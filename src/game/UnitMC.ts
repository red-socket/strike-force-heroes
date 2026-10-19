// Port of UnitMC.as — the 449-frame body animation symbol (669) of a unit. Named parts are rotated /
// positioned from code (head, arm1, arm2), so those are marked `scripted`.
//
// NAMING DEVIATION: AS3 `UnitMC.goto(label, force)` is exposed as `gotoAnim(label, force)` because the
// foundation's SwfClip declares a *private* `goto(frame:number)` that TypeScript won't let a subclass
// redeclare (and that gotoAndPlay/gotoAndStop call internally). A runtime `goto` shim is installed on the
// prototype below so untyped callers `(mc as any).goto('idle')` still work and SwfClip's internal numeric
// calls keep reaching the base implementation.
import type { Container } from 'pixi.js';
import { uint } from '../flash/as3';
import { Symbol } from '../flash/runtime';
import { SwfClip } from '../swf/display';
import type { Unit } from './Unit';

/** Thrown where Flash's gotoAndPlay(null) would throw ArgumentError #2109 (see Unit.UnitEnterFrame). */
export class FrameLabelError extends Error {}

export class UnitMC extends Symbol {
  get body(): SwfClip {
    return this.child<SwfClip>('body');
  }
  get legup2(): SwfClip {
    return this.child<SwfClip>('legup2');
  }
  get foot1(): SwfClip {
    return this.child<SwfClip>('foot1');
  }
  get headhold(): SwfClip {
    return this.child<SwfClip>('headhold');
  }
  get foot2(): SwfClip {
    return this.child<SwfClip>('foot2');
  }
  get gun(): SwfClip {
    return this.child<SwfClip>('gun');
  }
  get arm1(): SwfClip {
    return this.child<SwfClip>('arm1');
  }
  get arm2(): SwfClip {
    return this.child<SwfClip>('arm2');
  }
  get head(): SwfClip {
    return this.child<SwfClip>('head');
  }
  get arm1hold(): SwfClip {
    return this.child<SwfClip>('arm1hold');
  }
  get leglow1(): SwfClip {
    return this.child<SwfClip>('leglow1');
  }
  get leglow2(): SwfClip {
    return this.child<SwfClip>('leglow2');
  }
  get legup1(): SwfClip {
    return this.child<SwfClip>('legup1');
  }

  private unit: Unit;
  private curAnim: string | null = null;
  /** AS3 uint */
  curSkin = 0;

  constructor(param1: Unit) {
    super('UnitMC');
    this.addFrameScript(
      0, () => this.frame1(),
      19, () => this.frame20(),
      37, () => this.frame38(),
      56, () => this.frame57(),
      74, () => this.frame75(),
      93, () => this.frame94(),
      117, () => this.frame118(),
      141, () => this.frame142(),
      165, () => this.frame166(),
      189, () => this.frame190(),
      207, () => this.frame208(),
      263, () => this.frame264(),
      278, () => this.frame279(),
      289, () => this.frame290(),
      300, () => this.frame301(),
      304, () => this.frame305(),
      320, () => this.frame321(),
      353, () => this.frame354(),
      386, () => this.frame387(),
      390, () => this.frame391(),
      395, () => this.frame396(),
      407, () => this.frame408(),
      448, () => this.frame449(),
    );
    this.unit = param1;
    this.headhold.visible = false;
    this.arm1hold.visible = false;
    this.markScripted();
  }

  /** head / arm1 / arm2 are positioned and rotated by code: stop the timeline from overriding them. */
  private markScripted(): void {
    this.head.scripted = true;
    this.arm1.scripted = true;
    this.arm2.scripted = true;
  }

  EnterFrame(): void {
    this.markScripted(); // cheap; covers a part being re-instantiated by the timeline
    this.head.x = this.headhold.x;
    this.head.y = this.headhold.y;
    this.arm1.x = this.arm1hold.x;
    this.arm1.y = this.arm1hold.y;
    this.arm2.x = this.arm1hold.x;
    this.arm2.y = this.arm1hold.y;
  }

  // --- called by the arm timelines' frame scripts (arm_gun_316 / arm_front_328 → parent) ---

  doneShoot(): void {
    this.unit.gun.setFrame('idle');
  }

  doneReload(): void {
    this.unit.gun.setFrame('idle');
    this.unit.gun.reloaded();
  }

  reloadSound(): void {
    switch (this.unit.gun.curGun.frameReload) {
      case 'pistol':
      case 'mpistol':
      case 'shield':
      case 'shieldCrouch':
        this.unit.game.playScreenSound('S_PistolReload', this.unit.x, this.unit.y, true);
        break;
      case 'magnum':
        this.unit.game.playScreenSound('S_MagnumReload', this.unit.x, this.unit.y, true);
        break;
      case 'rifle':
        this.unit.game.playScreenSound('S_RifleReload', this.unit.x, this.unit.y, true);
        break;
      case 'shotgun':
        this.unit.game.playScreenSound('S_ShotgunReload', this.unit.x, this.unit.y, true);
        break;
      case 'heavy':
        this.unit.game.playScreenSound('S_HeavyReload', this.unit.x, this.unit.y, true);
        break;
      case 'sniper':
        this.unit.game.playScreenSound('S_SniperReload', this.unit.x, this.unit.y, true);
        break;
      case 'rocket':
        this.unit.game.playScreenSound('S_RocketReload', this.unit.x, this.unit.y, true);
        break;
      case 'launcher':
        this.unit.game.playScreenSound('S_LauncherReload', this.unit.x, this.unit.y, true);
        break;
      case 'bullpup':
        this.unit.game.playScreenSound('S_BulpupReload', this.unit.x, this.unit.y, true);
    }
  }

  setUnitVar(param1: string, param2: any): void {
    (this.unit as any)[param1] = param2;
  }

  setUnitObVar(param1: string, param2: string, param3: any): void {
    (this.unit as any)[param1][param2] = param3;
  }

  setShield(param1: SwfClip): void {
    this.unit.gun.setShield(param1);
  }

  getWeaponID(): string {
    return this.unit.gun.curGun.sprite;
  }

  /** AS3 `goto(param1, param2 = false)` — body animation request filter (see header note on the name). */
  gotoAnim(param1: string | null, param2 = false): void {
    if (!param2) {
      const rt = this.unit.unitInfo.runType;
      if (this.curAnim == param1) {
        return;
      }
      if (this.curAnim == 'climbsmall' || this.curAnim == 'climbbig') {
        return;
      }
      if (this.curAnim == 'landhard') {
        return;
      }
      if (this.curAnim == 'jump' && param1 == 'fall') {
        return;
      }
      if (this.curAnim == 'tuck' && param1 == 'fall') {
        return;
      }
      if (this.curAnim == 'land' && param1 == 'idle') {
        return;
      }
      if (this.curAnim == 'landrun' + rt && param1 == 'run' + rt) {
        return;
      }
      if (this.curAnim == 'landrunback' + rt && param1 == 'runback' + rt) {
        return;
      }
      if (this.curAnim == 'duckloop' && param1 == 'duck') {
        return;
      }
      if (this.curAnim == 'duckrun' && param1 == 'duck') {
        param1 = 'duckloop';
      }
      if (this.curAnim == 'duckrunback' && param1 == 'duck') {
        param1 = 'duckloop';
      }
      if (this.curAnim == 'slide' && param1 == 'duck') {
        param1 = 'duckloop';
      }
      if (this.curAnim == 'duck' && param1 == 'idle') {
        param1 = 'getup';
      }
      if ((this.curAnim == 'run' + rt || this.curAnim == 'landrun' + rt) && param1 == 'duckrun') {
        param1 = 'slide';
      }
      if (this.curAnim == 'runback' + rt && param1 == 'duckrunback') {
        param1 = 'duck';
      }
      if (this.curAnim == 'duckrun' && param1 == 'run' + rt) {
        param1 = 'getup';
      }
      if (this.curAnim == 'duckrunback' && param1 == 'runback' + rt) {
        param1 = 'getup';
      }
      if (this.curAnim == 'slide') {
        return;
      }
      if (this.curAnim == 'duck' && param1 == 'duckrun') {
        return;
      }
      if (this.curAnim == 'duck' && param1 == 'duckrunback') {
        return;
      }
      if (this.curAnim == 'getup' && param1 == 'run' + rt) {
        return;
      }
      if (this.curAnim == 'getup' && param1 == 'runback' + rt) {
        return;
      }
      if (this.curAnim == 'duckloop' && param1 == 'idle') {
        param1 = 'getup';
      }
      if (this.curAnim == 'getup' && param1 == 'idle') {
        return;
      }
    }
    this.curAnim = param1;
    if (this.curAnim == null) {
      // QUIRK: Unit.nextAnim is null until Movement first runs (countdown, gameStarted=false), and Flash's
      // gotoAndPlay(null) throws ArgumentError #2109 here (SwfClip would instead go to frame 1).
      throw new FrameLabelError('Error #2109: Frame label null not found');
    }
    this.gotoAndPlay(this.curAnim);
  }

  setSkin(param1: number): void {
    this.curSkin = uint(param1);
    this.setPart(this.head, this.curSkin);
    this.setPart(this.body, this.curSkin);
    this.setPart(this.arm1.child<SwfClip>('arm2up'), this.curSkin);
    this.setPart(this.arm1.child<SwfClip>('arm2low'), this.curSkin);
    this.setPart(this.arm1.child<SwfClip>('hand2'), this.curSkin);
    this.setPart(this.arm2.child<SwfClip>('arm1up'), this.curSkin);
    this.setPart(this.arm2.child<SwfClip>('arm1low'), this.curSkin);
    this.setPart(this.arm2.child<SwfClip>('hand1'), this.curSkin);
    this.setPart(this.legup1, this.curSkin);
    this.setPart(this.legup2, this.curSkin);
    this.legup2.child<Container>('gun').visible = false;
    this.setPart(this.leglow1, this.curSkin);
    this.setPart(this.leglow2, this.curSkin);
    this.setPart(this.foot1, this.curSkin);
    this.setPart(this.foot2, this.curSkin);
  }

  setPart(param1: SwfClip, param2: number): void {
    param1.gotoAndStop(uint(param2));
  }

  frame1(): void {
    this.gotoAnim('idle', true);
  }
  frame20(): void {
    this.gotoAnim('idle', true);
  }
  frame38(): void {
    this.gotoAnim('run1', true);
  }
  frame57(): void {
    this.gotoAnim('run1', true);
  }
  frame75(): void {
    this.gotoAnim('runback1', true);
  }
  frame94(): void {
    this.gotoAnim('runback1', true);
  }
  frame118(): void {
    this.gotoAnim('run2', true);
  }
  frame142(): void {
    this.gotoAnim('run2', true);
  }
  frame166(): void {
    this.gotoAnim('runback2', true);
  }
  frame190(): void {
    this.gotoAnim('runback2', true);
  }
  frame208(): void {
    this.gotoAnim('fall');
  }
  frame264(): void {
    this.gotoAndPlay('fallloop');
  }
  frame279(): void {
    this.gotoAnim('idle', true);
  }
  frame290(): void {
    this.stop();
  }
  frame301(): void {
    this.gotoAnim('duckloop', true);
  }
  frame305(): void {
    this.gotoAnim('duckloop');
  }
  frame321(): void {
    this.gotoAnim('duckloop', true);
  }
  frame354(): void {
    this.gotoAnim('duckrun', true);
  }
  frame387(): void {
    this.gotoAnim('duckrunback', true);
  }
  frame391(): void {
    this.gotoAnim('idle', true);
  }
  frame396(): void {
    this.setUnitObVar('mov', 'climb', 0);
    this.gotoAnim('idle', true);
  }
  frame408(): void {
    this.setUnitObVar('mov', 'climb', 0);
    this.gotoAnim('idle', true);
  }
  frame449(): void {
    this.setUnitObVar('mov', 'landHard', false);
    this.gotoAnim('idle', true);
  }
}

// Runtime shim for the AS3 name `goto` (see header). SwfClip's own (TS-private) goto(frame:number) is used
// internally by gotoAndPlay/gotoAndStop/nextFrame/prevFrame, so numbers are forwarded to it.
{
  const baseGoto = (SwfClip.prototype as any).goto as ((frame: number) => void) | undefined;
  (UnitMC.prototype as any).goto = function (this: UnitMC, a: unknown, b?: boolean): void {
    if (typeof a === 'number' && baseGoto) return baseGoto.call(this, a);
    return this.gotoAnim(a as string | null, !!b);
  };
}
