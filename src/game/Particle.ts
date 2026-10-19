// Port of Particle.as — behaviour-driven BH bitmap particle painted into the bitscreen.
import { uint } from '../flash/as3';
import { BH } from './BH';
import { UT } from './UT';
import type { Game } from './Game';

export class Particle {
  private game: Game;
  remove = false;
  private behave: string;
  private name: string;
  private sub: string;
  private x: number;
  private y: number;
  private hitFrame = 0;
  private stats: any = null;
  private frame = 0;
  private holdFrame = false;
  private xSpd = NaN;
  private ySpd = NaN;
  private xVel = NaN;
  private yVel = NaN;
  private extra: any;
  private hitCount = 0;
  private rotation = NaN;
  private fc = 0;

  constructor(
    param1: Game,
    param2: number,
    param3: number,
    param4: string,
    param5: number,
    param6: any,
    param7: string,
    param8: string,
    param9: number,
  ) {
    this.game = param1;
    this.x = param2;
    this.y = param3;
    this.fc = 0;
    this.behave = param4;
    this.hitFrame = uint(param5);
    this.name = param7;
    this.sub = param8;
    this.extra = !param6 ? {} : param6;
    try {
      this.stats = BH.getBitAniStats(this.name + 0, this.sub);
    } catch {
      // DEVIATION: unregistered BH sheets (e.g. "leaves"/"leafN" from Bullet's 006600 case) throw in
      // the original and abort the tick; here the particle is simply inert.
      this.remove = true;
      return;
    }
    this.rotation = UT.irand(0, this.stats.rotAmt - 1);
    if (!uint(param9)) {
      this.frame = 1;
    } else {
      this.frame = uint(param9);
      this.holdFrame = true;
    }
    this.name += this.rotation;
    switch (this.behave) {
      case 'fairy':
        this.extra.rot1 = Math.random() * 360;
        this.extra.rot2 = Math.random() * 360;
        break;
      case 'waterdrop':
        this.holdFrame = true;
        this.xSpd = UT.rand(-1, 1);
        this.ySpd = UT.rand(0, 1);
        break;
      case 'water':
        this.xSpd = UT.rand(this.extra.min, this.extra.max);
        this.ySpd = UT.rand(-1, 3);
        break;
      case 'snow':
        this.xSpd = UT.rand(0, 1);
        this.ySpd = UT.rand(3, 5);
        break;
      case 'shell':
        this.xSpd = UT.xMoveToRot(this.extra.rot - 110 * this.extra.flip + UT.rand(-15, 15), 8);
        this.ySpd = UT.yMoveToRot(this.extra.rot - 110 * this.extra.flip + UT.rand(-15, 15), 8);
        break;
      case 'spark':
        this.xSpd = UT.rand(-2, 2);
        this.ySpd = UT.rand(-1, 3);
        if (this.extra.xSpd) {
          this.xSpd = this.extra.xSpd;
        }
        if (!this.extra.ySpd) {
          break;
        }
        this.ySpd = this.extra.ySpd;
        break;
      case 'geiser':
        this.xSpd = UT.rand(-2, 2);
        this.ySpd = UT.rand(-1, 0);
        if (this.extra.xSpd) {
          this.xSpd = this.extra.xSpd;
        }
        if (!this.extra.ySpd) {
          break;
        }
        this.ySpd = this.extra.ySpd;
        break;
      case 'leaf':
        this.hitFrame = 10;
        this.xSpd = UT.rand(0, 1);
        this.ySpd = UT.rand(0.5, 3);
        this.rotation = Math.random() * 360;
        break;
      case 'raise':
        this.ySpd = UT.rand(1, 3) * param6.spd;
        this.xSpd = !(this.ySpd * this.extra.xspd) ? 0 : Number(this.extra.xspd);
        break;
      case 'move':
        this.ySpd = this.extra.yspd;
        this.xSpd = this.extra.xspd;
        break;
      case 'fish':
        this.extra.rot1 = Math.random() * 360;
        this.extra.rot2 = Math.random() * 360;
        break;
      case 'text':
        this.ySpd = -1;
        this.yVel = 20;
        this.holdFrame = true;
        this.frame = 1;
        break;
      case 'slowText':
        this.ySpd = -0.7;
        this.yVel = 35;
    }
  }

  EnterFrame(): void {
    let _loc1_ = 0;
    if (!this.remove) {
      ++this.fc;
      const g = this.game;
      switch (this.behave) {
        case 'fairy':
          this.extra.rot1 += 1;
          this.extra.rot2 += 2;
          this.x += UT.xMoveToRot(this.extra.rot1, 1);
          this.y += UT.yMoveToRot(this.extra.rot2, 0.6);
          g.bitscreen.paint(this.x + g.arena.x, this.y + g.arena.y, true, this.name, this.sub, this.frame);
          break;
        case 'waterdrop':
          this.x += this.xSpd;
          this.y += this.ySpd;
          this.ySpd += 0.5;
          if (!this.hitCount && (Boolean(this.hitTest()) || Boolean(this.hitTestPlayer()))) {
            this.y -= this.ySpd;
            this.ySpd = 0;
            this.hitCount = 1;
          }
          g.bitscreen.paint(this.x + g.arena.x, this.y + g.arena.y, true, this.name, this.sub, this.frame);
          if (!this.hitCount) {
            break;
          }
          ++this.frame;
          if (this.frame != this.stats.frames) {
            break;
          }
          this.remove = true;
          break;
        case 'water':
          this.x += this.xSpd;
          this.y += this.ySpd;
          this.ySpd += 0.5;
          if (!this.hitCount) {
            if (this.fc >= this.hitFrame && Boolean(this.hitTest())) {
              this.hitCount = 1;
            }
            const units: any[] = g.units;
            _loc1_ = 0;
            while (_loc1_ < units.length) {
              if (!units[_loc1_].dead) {
                if (UT.inBox(this.x, this.y, units[_loc1_].x - 25, units[_loc1_].y - 70, 50, 50)) {
                  this.hitCount = 1;
                }
              }
              _loc1_++;
            }
          }
          if (this.hitCount == 1) {
            this.xSpd *= 3;
            this.y -= this.ySpd;
            this.ySpd *= -UT.rand(0.2, 0.5);
            this.hitCount = 1;
            g.createEffect(this.x, this.y, 'snow_splash');
          }
          if (!this.hitCount) {
            g.bitscreen.paint(this.x + g.arena.x, this.y + g.arena.y, true, this.name, this.sub, 1);
            break;
          }
          ++this.hitCount;
          if (this.hitCount == 20) {
            this.remove = true;
          }
          g.bitscreen.paint(this.x + g.arena.x, this.y + g.arena.y, true, this.name, this.sub, uint(this.hitCount / 10) + 2);
          break;
        case 'snow':
          this.x += this.xSpd;
          this.y += this.ySpd;
          if (this.fc > 150 && this.fc % 3 == 0 && Boolean(this.hitTest())) {
            g.createEffect(this.x, this.y, 'snow_splash');
            this.remove = true;
          }
          g.bitscreen.paint(this.x + g.arena.x, this.y + g.arena.y, true, this.name, this.sub, this.frame);
          break;
        case 'shell':
          this.x += this.xSpd;
          this.y += this.ySpd;
          this.ySpd += 1;
          if (this.hitTest()) {
            this.remove = true;
          }
          g.bitscreen.paint(this.x + g.arena.x, this.y + g.arena.y, true, this.name, this.sub, this.frame);
          break;
        case 'spark':
          this.x += this.xSpd;
          this.y += this.ySpd;
          this.ySpd += 0.5;
          if (!this.hitCount && (Boolean(this.hitTest()) || Boolean(this.hitTestPlayer()))) {
            this.xSpd *= 3;
            this.y -= this.ySpd;
            this.ySpd *= -UT.rand(0.2, 0.5);
            this.hitCount = 1;
          }
          if (!this.hitCount) {
            g.bitscreen.paint(this.x + g.arena.x, this.y + g.arena.y, true, this.name, this.sub, 1);
            break;
          }
          ++this.hitCount;
          if (this.hitCount == 20) {
            this.remove = true;
          }
          g.bitscreen.paint(this.x + g.arena.x, this.y + g.arena.y, true, this.name, this.sub, uint(this.hitCount / 10) + 2);
          break;
        case 'geiser':
          this.x += this.xSpd;
          this.y += this.ySpd;
          this.ySpd += 0.5;
          if (!this.hitCount && (Boolean(this.hitTest()) || Boolean(this.hitTestPlayer()))) {
            this.xSpd *= 10;
            this.ySpd = UT.rand(-2, 2);
            this.hitCount = 1;
          }
          if (!this.hitCount && this.ySpd > 0) {
            this.hitCount = 1;
          }
          if (!this.hitCount) {
            g.bitscreen.paint(this.x + g.arena.x, this.y + g.arena.y, true, this.name, this.sub, 1);
            break;
          }
          ++this.hitCount;
          if (this.hitCount == 20) {
            this.remove = true;
          }
          g.bitscreen.paint(this.x + g.arena.x, this.y + g.arena.y, true, this.name, this.sub, uint(this.hitCount / 10) + 2);
          break;
        case 'leaf':
          this.rotation += 5;
          this.x += UT.xMoveToRot(this.rotation, 2);
          this.x += this.xSpd;
          this.y += this.ySpd;
          if (this.fc >= this.hitFrame && Boolean(this.hitTest())) {
            this.remove = true;
          }
          g.bitscreen.paint(this.x + g.arena.x, this.y + g.arena.y, true, this.name, this.sub, this.frame);
          break;
        case 'raise':
          this.x += this.xSpd;
          this.y -= this.ySpd;
          if (this.fc == 20) {
            this.remove = true;
          }
          g.bitscreen.paint(this.x + g.arena.x, this.y + g.arena.y, true, this.name, this.sub, this.frame);
          break;
        case 'move':
          this.x += this.xSpd;
          this.y += this.ySpd;
          if (this.frame == this.stats.frames) {
            this.remove = true;
          }
          g.bitscreen.paint(this.x + g.arena.x, this.y + g.arena.y, true, this.name, this.sub, this.frame);
          break;
        case 'fish':
          this.extra.rot1 += 0.4;
          this.extra.rot2 += 2;
          this.xVel = UT.xMoveToRot(this.extra.rot1, 1);
          this.yVel = UT.yMoveToRot(this.extra.rot2, 0.1);
          this.x += this.xVel;
          this.y += this.yVel;
          g.bitscreen.paint(this.x + g.arena.x, this.y + g.arena.y, true, this.name, this.sub, this.xVel <= 0 ? 2 : 1);
          break;
        case 'text':
        case 'slowText':
          this.y += this.ySpd;
          g.bitscreen.paint(this.x + g.arena.x, this.y + g.arena.y, true, this.name, this.sub, this.frame);
          if (this.fc <= this.yVel) {
            break;
          }
          this.remove = true;
      }
      if (!this.holdFrame) {
        ++this.frame;
        if (this.frame > this.stats.frames) {
          this.frame = 1;
        }
      }
      return;
    }
  }

  private hitTest(param1 = 0, param2 = 0): number {
    if (this.fc >= this.hitFrame) {
      const _loc3_: number = uint(this.game.arena.wall.getPixel32(this.x + param1, this.y + param2));
      if (_loc3_) {
        return _loc3_.toString(16).substring(0, 2) != 'ff' ? 0 : _loc3_;
      }
      return _loc3_;
    }
    return 0;
  }

  private hitTestPlayer(): boolean {
    if (!this.game.player.dead) {
      if (this.fc >= this.hitFrame) {
        return UT.inBox(this.x, this.y, this.game.player.x - 20, this.game.player.y - UT.rand(55, 70), 40, 50);
      }
      return false;
    }
    return false;
  }
}
