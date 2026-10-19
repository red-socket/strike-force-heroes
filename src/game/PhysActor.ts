// Port of PhysActor.as — one death ragdoll: 14 bodies (torso, head, 2×(upper leg, lower leg, foot),
// 2×(upper arm, lower arm, hand)) + revolute joints, Box2DFlash 2.1a → planck.js (same 30 px/m scale).
//
// Box2D → planck mapping used here:
//   b2BodyDef/CreateBody      → world.createBody({ type, position, angle, userData })
//   fixtureDef.filter.groupIndex → createFixture({ filterGroupIndex })
//   b2RevoluteJointDef.Initialize(a, b, anchor) → new planck.RevoluteJoint(def, a, b, anchor)
//   GetDefinition().userData  → getUserData()  (the part's display object)
//   ApplyImpulse / ApplyForce → applyLinearImpulse / applyForce (both wake the body, like 2.1a)
// Forces persist across steps like 2.1a because PhysWorld turns off planck's auto force clearing.
import * as planck from 'planck';
import type { Container } from 'pixi.js';
import { uint } from '../flash/as3';
import type { SwfClip } from '../swf/display';
import { UT } from './UT';
import { SD } from './SD';
import { MatchSettings } from './MatchSettings';
import { PhysBody } from './PhysBody';
import { PhysHead } from './PhysHead';
import { PhysUpperLeg } from './PhysUpperLeg';
import { PhysLowerLeg } from './PhysLowerLeg';
import { PhysFoot } from './PhysFoot';
import { PhysUpperArm } from './PhysUpperArm';
import { PhysLowerArm } from './PhysLowerArm';
import { PhysHand } from './PhysHand';
import type { PhysWorld } from './PhysWorld';
import type { Unit } from './Unit';
import type { Stats_Guns } from './Stats_Guns';

/** b2Settings.b2_pi */
const b2_pi = Math.PI;

type PartClass = new () => SwfClip;

/** Box2D 2.1a b2FixtureDef defaults (the original reuses one def object for all parts). */
class FixtureDef {
  shape: planck.Shape | null = null;
  friction = 0.2;
  restitution = 0;
  density = 0;
  filter = { groupIndex: 0 };
}

export class PhysActor {
  private physWorld: PhysWorld;
  unit: Unit;
  private weapon: Stats_Guns;
  private x = NaN;
  private y = NaN;
  private body: planck.Body | null = null;
  private bodyDef: planck.BodyDef | null = null;
  private boxShape: planck.Polygon | null = null;
  private circleShape: planck.Circle | null = null;
  private fixtureDef: FixtureDef | null = null;
  /** AS3 uint */
  private skin = 0;
  parts: planck.Body[] = null as unknown as planck.Body[];
  rdBody: planck.Body = null as unknown as planck.Body;
  rdHead: planck.Body = null as unknown as planck.Body;
  private physMod: string | null = null;
  /** unused in the original */
  private evaporate = false;
  /** unused in the original */
  private alpha = 1;
  /** AS3 int */
  flip = 0;
  /** AS3 uint */
  fc = 0;

  constructor(param1: PhysWorld, param2: Unit, param3: Unit, param4: Stats_Guns, param5: any) {
    this.physWorld = param1;
    this.unit = param2;
    this.weapon = param4;
    this.x = this.unit.x;
    this.y = this.unit.y - 40;
    this.physMod = MatchSettings.useMap.phys;
    this.flip = this.unit.MC.scale.x | 0;
    this.parts = [];
    this.skin = uint(this.unit.MC.curSkin);
    this.fixtureDef = new FixtureDef();
    const _loc6_ = this.createPart(0, 0, 0.1, 0.8, PhysBody, true);
    if (this.unit.MC.gun.visible) {
      (_loc6_.getUserData() as PhysBody).gun.gotoAndStop(this.unit.MC.gun.currentFrame);
    }
    const _loc7_ = this.createPart(5, -14, 0.05, 1, PhysHead, false);
    this.createJoint(_loc6_, _loc7_, this.createVec(2, 0), -0.1, 0.03);
    const _loc8_ = this.createPart(-2, 17, 0, 0.6, PhysUpperLeg, true);
    this.createJoint(_loc6_, _loc8_, this.createVec(-1, 10), -0.5, 0.2);
    const legGun = this.unit.MC.legup1.child<SwfClip>('gun');
    if (legGun.visible) {
      (_loc8_.getUserData() as PhysUpperLeg).gun.gotoAndStop(legGun.currentFrame);
    }
    const _loc9_ = this.createPart(-2, 28, 0, 0.6, PhysLowerLeg, true);
    this.createJoint(_loc8_, _loc9_, this.createVec(-2, 20), 0, 0.5);
    const _loc10_ = this.createPart(-2, 34, 0, 1, PhysFoot, true);
    this.createJoint(_loc9_, _loc10_, this.createVec(-3, 34), -0.1, 0.2);
    const _loc11_ = this.createPart(-2, 17, 0, 0.6, PhysUpperLeg, true);
    this.createJoint(_loc6_, _loc11_, this.createVec(-1, 10), -0.5, 0.2);
    const _loc12_ = this.createPart(-2, 28, 0, 0.6, PhysLowerLeg, true);
    this.createJoint(_loc11_, _loc12_, this.createVec(-2, 20), 0, 0.5);
    const _loc13_ = this.createPart(-2, 34, 0, 1, PhysFoot, true);
    this.createJoint(_loc12_, _loc13_, this.createVec(-3, 34), -0.1, 0.2);
    const _loc14_ = this.createPart(1, 1, -0.2, 0.5, PhysUpperArm, true);
    this.createJoint(_loc6_, _loc14_, this.createVec(-1, -4), 0, 0);
    const _loc15_ = this.createPart(11, 8, -0.5, 0.6, PhysLowerArm, true);
    this.createJoint(_loc14_, _loc15_, this.createVec(7, 8), -0.4, 0.3);
    const _loc16_ = this.createPart(19, 8, 0, 1, PhysHand, false);
    this.createJoint(_loc15_, _loc16_, this.createVec(17, 8), -0.2, 0.2);
    const _loc17_ = this.createPart(1, 1, -0.2, 0.5, PhysUpperArm, true);
    this.createJoint(_loc6_, _loc17_, this.createVec(-1, -4), 0, 0);
    const _loc18_ = this.createPart(11, 8, -0.5, 0.6, PhysLowerArm, true);
    this.createJoint(_loc17_, _loc18_, this.createVec(7, 8), -0.4, 0.3);
    const _loc19_ = this.createPart(19, 8, 0, 1, PhysHand, false);
    this.createJoint(_loc18_, _loc19_, this.createVec(17, 8), -0.2, 0.2);
    this.parts.push(_loc19_, _loc18_, _loc17_);
    this.parts.push(_loc13_, _loc12_, _loc11_);
    this.parts.push(_loc10_, _loc9_, _loc8_);
    this.parts.push(_loc6_);
    this.parts.push(_loc7_);
    this.parts.push(_loc16_, _loc15_, _loc14_);
    this.rdBody = _loc6_;
    this.rdHead = _loc7_;
    let _loc20_ = 0; // uint
    while (_loc20_ < this.parts.length) {
      this.physWorld.addChild(this.parts[_loc20_].getUserData() as Container);
      _loc20_++;
    }
    if (!this.physWorld.game.gameEnded && (param3 == this.unit.game.player || this.unit == this.unit.game.player || param3 == this.unit)) {
      // (empty in the original)
    }
    if (this.physMod == 'sky') {
      this.forceAll(-4, -1.5);
    }
  }

  EnterFrame(): void {
    ++this.fc;
    if (this.physMod == 'train' && (this.rdBody.getUserData() as Container).y > 1920) {
      this.physMod = '';
      this.forceAll(-8, 4);
      this.impulseAll(new planck.Vec2(-9, 1));
    }
    if (this.fc == 5 * 30) {
      this.physWorld.actors.splice(this.physWorld.actors.indexOf(this), 1);
      this.destroy();
    }
  }

  destroy(): void {
    let _loc1_ = 0; // uint
    while (_loc1_ < this.parts.length) {
      this.physWorld.removeChild(this.parts[_loc1_].getUserData() as Container);
      this.physWorld.m_world.destroyBody(this.parts[_loc1_]);
      _loc1_++;
    }
  }

  impulseBody(param1: planck.Vec2Value): void {
    this.rdBody.applyLinearImpulse(param1, this.rdBody.getWorldCenter(), true);
  }

  /** QUIRK: the head impulse is applied at the *torso's* world centre. */
  impulseHead(param1: planck.Vec2Value): void {
    this.rdHead.applyLinearImpulse(param1, this.rdBody.getWorldCenter(), true);
  }

  impulseAll(param1: planck.Vec2Value | null = null, param2 = -1, param3 = 1): void {
    let _loc4_ = 0; // uint
    while (_loc4_ < this.parts.length) {
      if (!param1) {
        this.parts[_loc4_].applyLinearImpulse(new planck.Vec2(UT.rand(param2, param3), UT.rand(param2, param3)), this.parts[_loc4_].getWorldCenter(), true);
      } else {
        this.parts[_loc4_].applyLinearImpulse(param1, this.parts[_loc4_].getWorldCenter(), true);
      }
      _loc4_++;
    }
  }

  forceAll(param1: number, param2: number): void {
    let _loc3_ = 0; // uint
    while (_loc3_ < this.parts.length) {
      this.parts[_loc3_].applyForce(new planck.Vec2(param1, param2), this.parts[_loc3_].getWorldCenter(), true);
      _loc3_++;
    }
  }

  createVec(param1: number, param2: number): planck.Vec2 {
    return new planck.Vec2((this.x + param1 * this.flip) / 30, (this.y + param2) / 30);
  }

  createJoint(param1: planck.Body, param2: planck.Body, param3: planck.Vec2, param4: number, param5: number): void {
    let _loc7_ = NaN;
    if (MatchSettings.useMod != 'bodypop') {
      if (!(Math.random() < this.weapon.bodBreak && SD.blood == 2)) {
        if (this.flip == -1) {
          _loc7_ = param4;
          param4 = param5 * this.flip;
          param5 = _loc7_ * this.flip;
        }
        const _loc6_ = new planck.RevoluteJoint(
          {
            lowerAngle: param4 * b2_pi,
            upperAngle: param5 * b2_pi,
            enableLimit: Boolean(param4) || Boolean(param5),
            maxMotorTorque: 0.02,
            motorSpeed: 0,
            enableMotor: true,
          },
          param1,
          param2,
          param3,
        );
        this.physWorld.m_world.createJoint(_loc6_);
        return;
      }
      return;
    }
  }

  createPart(param1: number, param2: number, param3: number, param4: number, param5: PartClass, param6: boolean): planck.Body {
    param1 *= this.flip;
    param3 *= this.flip;
    param1 += this.x;
    param2 += this.y;
    const pos = new planck.Vec2(param1 / 30, param2 / 30);
    const angle = param3 * b2_pi;
    const _loc7_ = new param5();
    _loc7_.gotoAndStop(this.skin);
    _loc7_.scale.x = this.flip;
    const fd = this.fixtureDef!;
    if (!param6) {
      this.circleShape = new planck.Circle((_loc7_.width * 0.8 * param4) / 60);
      fd.shape = this.circleShape;
    } else {
      this.boxShape = new planck.Box((_loc7_.width * 0.8 * param4) / 60, (_loc7_.height * 0.8) / 60);
      fd.shape = this.boxShape;
    }
    // QUIRK: `param5 is PhysBody` tests a Class object, so it is always false → every part has density 1.
    if (!((param5 as unknown) instanceof PhysBody)) {
      fd.density = 1;
    } else {
      fd.density = 1.5;
    }
    fd.friction = 0.5;
    fd.restitution = 0.2;
    fd.filter.groupIndex = -1;
    // QUIRK: initial sprite rotation is param3*360 degrees (the body angle is param3*180°); it is corrected
    // by the next PhysWorld.EnterFrame, so it can show for one rendered frame.
    _loc7_.angle = param3 * 360;
    _loc7_.x = param1;
    _loc7_.y = param2;
    this.bodyDef = { type: 'dynamic', position: pos, angle, userData: _loc7_ };
    this.body = this.physWorld.m_world.createBody(this.bodyDef);
    this.body.createFixture({
      shape: fd.shape!,
      density: fd.density,
      friction: fd.friction,
      restitution: fd.restitution,
      filterGroupIndex: fd.filter.groupIndex,
    });
    return this.body;
  }
}
