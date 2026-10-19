// Port of Water.as — purely visual spring-chain water surface (gameplay water is a wall-bitmap colour).
// Flash Shape → Pixi Graphics; blend mode "hardlight".
import { Graphics } from 'pixi.js';
import { int, uint } from '../flash/as3';
import type { SwfClip } from '../swf/display';
import { UT } from './UT';
import { MatchSettings } from './MatchSettings';
import type { Game } from './Game';

interface Dot {
  x: number;
  y: number;
  oy: number;
  toY: number;
  yVel: number;
  yAcc: number;
  mass: number;
}

export class Water extends Graphics {
  private game: Game;
  private dots: Dot[] = null as unknown as Dot[];
  private waterSet = false;
  private MC: SwfClip | null = null;
  /** AS3 uint */
  private fc = 0;

  constructor(param1: Game) {
    super();
    this.game = param1;
    this.fc = 0;
    this.blendMode = 'hard-light';
  }

  setWater(param1: SwfClip): void {
    let _loc3_: Dot;
    this.MC = param1;
    this.MC.visible = false;
    this.dots = [];
    let _loc2_ = 0; // uint
    while (_loc2_ < this.MC.width / 20) {
      _loc3_ = {} as Dot;
      _loc3_.x = _loc2_ * 20 + this.MC.x;
      _loc3_.y = _loc3_.oy = _loc3_.toY = this.MC.y;
      _loc3_.yVel = 0;
      _loc3_.yAcc = 0;
      _loc3_.mass = 10;
      this.dots.push(_loc3_);
      _loc2_++;
    }
    this.waterSet = true;
  }

  disableWater(param1: SwfClip): void {
    this.MC = param1;
    this.MC.visible = false;
    this.dots = [];
    this.waterSet = false;
  }

  inWater(param1: number, param2: number): boolean {
    if (this.waterSet) {
      return UT.inBox(param1, param2, this.MC!.x, this.MC!.y, this.MC!.width, this.MC!.height);
    }
    return false;
  }

  startWave(param1: number, param2: number): void {
    param1 = int(param1);
    if (this.waterSet) {
      if (!(param1 < 0 || param1 >= this.dots.length)) {
        this.dots[param1].yVel = param2;
        return;
      }
      return;
    }
  }

  startWaveAtPos(param1: number, param2: number): void {
    if (this.waterSet) {
      const _loc3_ = int(Math.round((param1 - this.MC!.x) / 20));
      if (!(_loc3_ < 0 || _loc3_ >= this.dots.length)) {
        this.dots[_loc3_].yVel = param2;
        return;
      }
      return;
    }
  }

  EnterFrame(): void {
    let _loc1_ = 0; // uint
    let _loc2_ = 0; // uint
    let _loc3_ = NaN;
    let _loc4_ = NaN;
    let _loc5_ = NaN;
    let _loc6_ = NaN;
    let _loc7_ = NaN;
    if (this.waterSet) {
      const MC = this.MC!;
      ++this.fc;
      if (this.fc % 20 == 0) {
        this.startWave(0, 2);
        this.startWave(this.dots.length - 1, 2);
        this.startWave(uint(this.dots.length / 2), 1);
      }
      _loc1_ = 0;
      while (_loc1_ < this.game.units.length) {
        if (!this.game.units[_loc1_].dead) {
          if (this.inWater(this.game.units[_loc1_].x, this.game.units[_loc1_].y)) {
            _loc2_ = uint(Math.round((this.game.units[_loc1_].x - MC.x) / 20));
            if (!(Boolean(this.game.units[_loc1_].mov.jumping) && this.game.units[_loc1_].mov.yVel > 0)) {
              if (!(Boolean(this.game.units[_loc1_].mov.jumping) && this.game.units[_loc1_].mov.yVel < 0)) {
                if (this.game.units[_loc1_].mov.xVel >= 0) {
                  if (this.game.units[_loc1_].mov.xVel <= 0) {
                    if (this.game.units[_loc1_].mov.crouching) {
                      this.startWave(_loc2_, 0.5);
                    }
                  } else {
                    this.startWave(_loc2_ + 1, 2);
                    this.startWave(_loc2_ + 3, -2);
                    this.startWave(_loc2_ - 1, -1);
                  }
                } else {
                  this.startWave(_loc2_ - 1, 2);
                  this.startWave(_loc2_ - 3, -2);
                  this.startWave(_loc2_ + 1, -1);
                }
              } else {
                this.startWave(_loc2_, -5);
              }
            } else {
              this.startWave(_loc2_, 4);
            }
          }
        }
        _loc1_++;
      }
      _loc1_ = 0;
      while (_loc1_ < this.dots.length) {
        _loc3_ = 0;
        _loc4_ = 0;
        _loc5_ = 5;
        _loc6_ = 1.05;
        _loc7_ = 0.7;
        if (_loc1_ > 0) {
          _loc3_ = this.dots[_loc1_ - 1].y - this.dots[_loc1_].y;
          _loc4_ += _loc3_ * -_loc7_;
        }
        if (_loc1_ < this.dots.length - 1) {
          _loc3_ = this.dots[_loc1_].y - this.dots[_loc1_ + 1].y;
          _loc4_ += _loc3_ * _loc7_;
        }
        _loc3_ = this.dots[_loc1_].y - this.dots[_loc1_].oy;
        _loc4_ += (_loc7_ / _loc5_) * _loc3_;
        this.dots[_loc1_].yAcc = -_loc4_ / this.dots[_loc1_].mass;
        this.dots[_loc1_].yVel += this.dots[_loc1_].yAcc;
        this.dots[_loc1_].toY += this.dots[_loc1_].yVel;
        this.dots[_loc1_].yVel /= _loc6_;
        _loc1_++;
      }
      _loc1_ = 0;
      while (_loc1_ < this.dots.length) {
        this.dots[_loc1_].y = this.dots[_loc1_].toY;
        _loc1_++;
      }
      // graphics.lineStyle(2, water, 1); beginFill(water, 0.8); ... endFill()
      const col = MatchSettings.useMap.water;
      this.clear();
      this.moveTo(this.dots[0].x, this.dots[0].y);
      _loc1_ = 1;
      while (_loc1_ < this.dots.length) {
        if (_loc1_ != 1) {
          if (_loc1_ < this.dots.length - 1) {
            this.quadraticCurveTo(
              this.dots[_loc1_ - 1].x,
              this.dots[_loc1_ - 1].y,
              (this.dots[_loc1_ - 1].x + this.dots[_loc1_].x) / 2,
              (this.dots[_loc1_ - 1].y + this.dots[_loc1_].y) / 2,
            );
          }
        } else {
          this.lineTo((this.dots[_loc1_ - 1].x + this.dots[_loc1_].x) / 2, (this.dots[_loc1_ - 1].y + this.dots[_loc1_].y) / 2);
        }
        _loc1_++;
      }
      this.lineTo(this.dots[this.dots.length - 1].x, this.dots[this.dots.length - 1].y);
      this.lineTo(MC.x + MC.width, MC.y + MC.height);
      this.lineTo(MC.x, MC.y + MC.height);
      this.lineTo(this.dots[0].x, this.dots[0].y);
      this.fill({ color: col, alpha: 0.8 });
      this.stroke({ width: 2, color: col, alpha: 1 });
      return;
    }
  }
}
