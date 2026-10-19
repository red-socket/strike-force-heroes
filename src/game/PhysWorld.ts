// Port of PhysWorld.as — the Box2D world used only for death ragdolls (Box2DFlash 2.1a → planck.js),
// and the display container (in arena.midCont) holding the ragdoll part sprites.
// Scale 30 px/m, gravity (0, 10) m/s² y-down, step 1/30 s, 10 velocity / 10 position iterations, sleeping on.
import * as planck from 'planck';
import { Container } from 'pixi.js';
import { uint } from '../flash/as3';
import { UT } from './UT';
import { MatchSettings } from './MatchSettings';
import { PhysActor } from './PhysActor';
import type { Game } from './Game';
import type { Unit } from './Unit';
import type { Stats_Guns } from './Stats_Guns';

export class PhysWorld extends Container {
  game: Game;
  m_world: planck.World;
  /** AS3 int */
  m_velocityIterations = 10;
  /** AS3 int */
  m_positionIterations = 10;
  m_timeStep = 0.03333333333333333;
  private body: planck.Body | null = null;
  private bodyDef: planck.BodyDef | null = null;
  private boxShape: planck.Polygon | null = null;
  private fixtureDef: planck.FixtureDef | null = null;
  actors: PhysActor[];

  constructor(param1: Game) {
    super();
    this.game = param1;
    this.actors = [];
    this.m_world = new planck.World({ gravity: new planck.Vec2(0, 10), allowSleep: true });
    // Box2DFlash 2.1a never clears accumulated forces (b2World.Step does not call ClearForces and the game
    // never does); they only reset when a body falls asleep. This is what makes the "sky"/"train" map
    // forces act as continuous wind. planck clears them every step by default → turn that off.
    this.m_world.setAutoClearForces(false);
    // (The original configured a b2DebugDraw on this sprite, but DrawDebugData() is never called.)
  }

  /** Static colliders from the map's NodePhysBox markers (85×85 centre-registered squares scaled in the editor). */
  generateWorld(param1: any[]): void {
    let _loc3_ = NaN;
    let _loc2_ = 0; // uint
    while (_loc2_ < param1.length) {
      _loc3_ = Number(param1[_loc2_].angle);
      param1[_loc2_].angle = 0;
      const position = new planck.Vec2(param1[_loc2_].x / 30, param1[_loc2_].y / 30);
      this.boxShape = new planck.Box(param1[_loc2_].width / 60, param1[_loc2_].height / 60);
      const angle = _loc3_ / (180 / Math.PI);
      this.bodyDef = { type: 'static', position, angle };
      this.fixtureDef = { shape: this.boxShape, friction: 0.3, density: 0 };
      this.body = this.m_world.createBody(this.bodyDef);
      this.body.createFixture(this.fixtureDef);
      param1[_loc2_].angle = _loc3_;
      _loc2_++;
    }
  }

  createCorpse(param1: Unit, param2: Unit, param3: Stats_Guns, param4: any): PhysActor {
    let _loc7_ = NaN;
    const _loc5_ = new PhysActor(this, param1, param2, param3, param4);
    this.actors.push(_loc5_);
    _loc5_.impulseAll();
    // the unit's px/frame velocity used directly as an impulse (N·s) on the torso
    _loc5_.impulseBody(new planck.Vec2(param1.mov.xVel, param1.mov.yVel));
    let _loc6_ = Number(param3.force);
    if (MatchSettings.useMod == 'sky9') {
      _loc6_ *= 3;
    }
    if (_loc6_) {
      if (param3.splash) {
        if (param4.hitX == param1.x && param4.hitY == param1.y) {
          ++param4.hitY;
        }
        _loc7_ = UT.getRotation(param4.hitX, param4.hitY, param1.x, param1.y - 40);
      } else {
        if (param2.x == param1.x && param2.y == param1.y) {
          param1.y -= 2; // QUIRK: moves the (dead) victim unit
        }
        _loc7_ = UT.getRotation(param2.x, param2.y, param1.x, param1.y);
      }
      _loc5_.impulseBody(new planck.Vec2(UT.xMoveToRot(_loc7_, _loc6_), UT.yMoveToRot(_loc7_, _loc6_)));
    }
    if (param4.headMult) {
      if (param2.x == param1.x && param2.y == param1.y - 10) {
        --param1.y;
      }
      _loc7_ = UT.getRotation(param2.x, param2.y, param1.x, param1.y - 10);
      _loc5_.impulseHead(new planck.Vec2(UT.xMoveToRot(_loc7_, 8), UT.yMoveToRot(_loc7_, 8)));
    }
    return _loc5_;
  }

  hitCorpse(param1: PhysActor, param2: Unit, param3: Stats_Guns, param4: any): void {
    let _loc6_ = NaN;
    param1.impulseAll(null, -0.5, 0.5);
    let _loc5_ = Number(param3.force);
    if (MatchSettings.useMod == 'sky9') {
      _loc5_ *= 1.5;
    }
    if (_loc5_) {
      // rdBody.GetDefinition().userData → the torso sprite
      const rd = param1.rdBody.getUserData() as Container;
      if (!param3.splash) {
        if (param2.x == rd.x && param2.y == rd.y) {
          --rd.y;
        }
        _loc6_ = UT.getRotation(param2.x, param2.y, rd.x, rd.y);
      } else {
        if (param4.hitX == rd.x && param4.hitY == rd.y) {
          ++param4.hitY;
        }
        _loc6_ = UT.getRotation(param4.hitX, param4.hitY, rd.x, rd.y - 40);
      }
      param1.impulseBody(new planck.Vec2(UT.xMoveToRot(_loc6_, _loc5_), UT.yMoveToRot(_loc6_, _loc5_)));
    }
  }

  EnterFrame(): void {
    let _loc3_: Container | null = null;
    this.m_world.step(this.m_timeStep, this.m_velocityIterations, this.m_positionIterations);
    let _loc1_ = this.m_world.getBodyList();
    while (_loc1_) {
      if (_loc1_.getUserData() instanceof Container) {
        _loc3_ = _loc1_.getUserData() as Container;
        _loc3_.x = _loc1_.getPosition().x * 30;
        _loc3_.y = _loc1_.getPosition().y * 30;
        _loc3_.angle = _loc1_.getAngle() * (180 / Math.PI);
      }
      _loc1_ = _loc1_.getNext();
    }
    let _loc2_ = 0; // uint
    // (actors removing themselves mid-loop skip the next actor for one tick, as in the original)
    while (_loc2_ < this.actors.length) {
      this.actors[_loc2_].EnterFrame();
      _loc2_ = uint(_loc2_ + 1);
    }
  }

  destroy(): void {}
}
