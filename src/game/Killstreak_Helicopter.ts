// Port of Killstreak_Helicopter.as — attack chopper that follows its owner and shoots nearby enemies.
import { uint } from '../flash/as3';
import { UT } from './UT';
import { Stats_Guns } from './Stats_Guns';
import { Helicopter } from './Helicopter';
import type { BulletClass } from './Bullet';
import type { Game } from './Game';

export class Killstreak_Helicopter {
  private game: Game;
  unit: any;
  private MC: Helicopter;
  private maxWidth = NaN;
  x = NaN;
  y = NaN;
  private _x = NaN;
  private _y = NaN;
  private toX = NaN;
  private toY = NaN;
  private rot1 = NaN;
  private rot2 = NaN;
  private rotX = NaN;
  private rotY = NaN;
  private rot = NaN;
  private fc = 0; // uint
  private target: any = undefined;
  private done = 0;
  private gunRot = NaN;
  private timer = 0; // uint

  constructor(param1: Game, param2: any) {
    this.game = param1;
    this.unit = param2;
    this.MC = new Helicopter();
    this.game.unitCont.addChild(this.MC);
    this.maxWidth = this.game.arena.wall.width;
    this._x = this.MC.x = this.maxWidth / 2;
    this._y = this.MC.y = -100;
    this.rot1 = UT.rand(0, 360);
    this.rot2 = UT.rand(0, 360);
    this.rot = UT.getRotation(this._x, this._y, this.toX, this.toY);
    this.gunRot = 180;
    this.timer = 10 * 30;
    if (this.unit.unitInfo.extra.permaStreak) {
      this.timer = uint(9999999);
    }
  }

  EnterFrame(): void {
    let _loc1_ = 0;
    ++this.fc;
    this.rot1 += 1;
    this.rot2 += 2;
    this.rotX = UT.xMoveToRot(this.rot1, 80);
    this.rotY = UT.yMoveToRot(this.rot2, 35);
    if (!this.done) {
      this._x += (this.unit.x - this._x) * 0.04;
      this._y += (this.unit.y - 200 - this._y) * 0.06;
      this.MC.x = this.x = this._x + this.rotX;
      this.MC.y = this.y = this._y + this.rotY;
      if (this.fc % 6 == 0) {
        this.target = null;
        const units: any[] = this.game.units;
        _loc1_ = 0;
        while (_loc1_ < units.length) {
          if (units[_loc1_] != this.unit) {
            if (!units[_loc1_].dead) {
              if (!(Boolean(this.unit.team) && units[_loc1_].team == this.unit.team)) {
                if (UT.getDist(this.x, this.y, units[_loc1_].x, units[_loc1_].y) < 300) {
                  this.target = units[_loc1_];
                }
              }
            }
          }
          _loc1_++;
        }
      }
      if (this.target) {
        this.gunRot += UT.rotateDirection(this.gunRot, UT.getRotation(this.x, this.y, this.target.x, this.target.y)) * 3;
      } else {
        this.gunRot += UT.rotateDirection(this.gunRot, 180) * 3;
      }
      // AS3 MC.gun.rotation (degrees); script-controlled from now on
      this.MC.gun.scripted = true;
      this.MC.gun.angle = this.gunRot;
      if (Boolean(this.target) && this.fc % 3 == 0) {
        this.game.playScreenSound('S_assaultFire', this.MC.x, this.MC.y);
        this.game.bullets.push(
          new (Stats_Guns.gunOb['heli'].cls as BulletClass)(this.game, this.unit, this.gunRot, this.x, this.y, 0, 'heli', { noUnit: true }),
        );
      }
      if (Boolean(this.unit.dead) || this.fc >= this.timer) {
        this.done = 1;
      }
      return;
    }
    this._y -= this.done;
    this.done += 1;
    this.MC.x = this.x = this._x + this.rotX;
    this.MC.y = this.y = this._y + this.rotY;
    if (this.y < -100) {
      this.end();
    }
  }

  end(): void {
    this.unit.endKillstreak();
    this.game.unitCont.removeChild(this.MC);
    this.game.killstreaks.splice(this.game.killstreaks.indexOf(this), 1);
  }
}
