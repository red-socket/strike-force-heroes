// Port of Radar.as — minimap (symbol 1422, 160x120 at the HUD's top-right).
//
// `data` (288x288) is the wall clip drawn at scale 0.1, `dotdata` (160x120) is cleared every frame and
// receives BH "radar0" blips via copyPixels. Port: `data` is built once on a canvas from the arena's
// collision bitmap (the same pixels as wallMC frame 1), `dotdata` is a clipped container of pooled sprites.
import { Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import { Symbol } from '../flash/runtime';
import type { SwfClip } from '../swf/display';
import { BH } from './BH';
import type { Game } from './Game';
import { Killstreak_Helicopter } from './Killstreak_Helicopter';
import { Killstreak_Radar } from './Killstreak_Radar';
import { Main } from './Main';
import { MatchSettings } from './MatchSettings';

export class Radar extends Symbol {
  get radarcont(): SwfClip {
    return this.child<SwfClip>('radarcont');
  }

  private game: Game;
  private bmp: Sprite;
  private dotbmp: Container;
  private dotRect: Rectangle;
  /** AS3 `scale` (0.1) — renamed: Pixi's `scale` is the display transform. */
  private scaleR = NaN;
  private dotPool: Sprite[] = [];
  private dotUsed = 0;

  constructor(param1: Game, param2: SwfClip) {
    super('Radar');
    this.game = param1;
    this.x = Main.WIDTH - 160;
    this.y = 0;
    this.scaleR = 0.1;
    // this.data = new BitmapData(2880 * scale, 2880 * scale, true, 0); data.draw(param2, Matrix.scale(0.1))
    this.bmp = new Sprite(Radar.drawWall(param1, param2, 2880 * this.scaleR, this.scaleR));
    this.radarcont.addChild(this.bmp);
    // this.dotdata = new BitmapData(160, 120, true, 0)
    this.dotbmp = new Container();
    const clip = new Graphics().rect(0, 0, 160, 120).fill(0xffffff);
    this.dotbmp.addChild(clip);
    this.dotbmp.mask = clip;
    this.addChild(this.dotbmp);
    this.dotRect = new Rectangle(0, 0, 160, 120);
  }

  /** BitmapData.draw(wallMC, scale 0.1) into a size x size bitmap. */
  private static drawWall(game: Game, _wallMC: SwfClip, size: number, scale: number): Texture {
    const wall = game.arena.wall;
    const n = Math.floor(size);
    const out = document.createElement('canvas');
    out.width = n;
    out.height = n;
    if (wall && wall.width && wall.height) {
      const src = document.createElement('canvas');
      src.width = wall.width;
      src.height = wall.height;
      const sctx = src.getContext('2d')!;
      const img = sctx.createImageData(wall.width, wall.height);
      const px = img.data;
      const a = wall.argb;
      for (let i = 0, j = 0; i < a.length; i++, j += 4) {
        const v = a[i];
        px[j] = (v >>> 16) & 255;
        px[j + 1] = (v >>> 8) & 255;
        px[j + 2] = v & 255;
        px[j + 3] = v >>> 24;
      }
      sctx.putImageData(img, 0, 0);
      const ctx = out.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(src, 0, 0, wall.width * scale, wall.height * scale);
      src.width = src.height = 0;
    }
    return Texture.from(out);
  }

  EnterFrame(): void {
    let _loc2_ = 0;
    // dotdata.fillRect(dotRect, 0)
    for (let i = 0; i < this.dotUsed; i++) this.dotPool[i].visible = false;
    this.dotUsed = 0;
    this.bmp.x = this.game.player.x * -this.scaleR + 80;
    this.bmp.y = this.game.player.y * -this.scaleR + 60;
    let _loc1_ = false;
    const ks: any[] = this.game.killstreaks;
    _loc2_ = 0;
    while (_loc2_ < ks.length) {
      if (ks[_loc2_] instanceof Killstreak_Radar && (Boolean(ks[_loc2_].unit.human) || Boolean(ks[_loc2_].unit.team == 1))) {
        _loc1_ = true;
      }
      if (ks[_loc2_] instanceof Killstreak_Helicopter) {
        this.paint(
          ks[_loc2_].x * this.scaleR + this.bmp.x + 2,
          ks[_loc2_].y * this.scaleR + this.bmp.y - 3,
          true,
          'radar0',
          'heli' + (ks[_loc2_].unit.team != 2 ? 'ally' : 'enemy'),
        );
      }
      _loc2_++;
    }
    const units: any[] = this.game.units;
    _loc2_ = 0;
    while (_loc2_ < units.length) {
      if (!(Boolean(units[_loc2_].human) && !units[_loc2_].dead)) {
        if (units[_loc2_].team != 1) {
          if (!units[_loc2_].dead && _loc1_) {
            this.paint(units[_loc2_].x * this.scaleR + this.bmp.x + 2, units[_loc2_].y * this.scaleR + this.bmp.y - 3, true, 'radar0', 'enemy');
          }
        } else if (units[_loc2_].dead) {
          this.paint(units[_loc2_].x * this.scaleR + this.bmp.x + 2, units[_loc2_].y * this.scaleR + this.bmp.y - 4, true, 'radar0', 'allyskull');
        } else {
          this.paint(units[_loc2_].x * this.scaleR + this.bmp.x + 2, units[_loc2_].y * this.scaleR + this.bmp.y - 4, true, 'radar0', 'ally');
        }
      } else {
        this.paint(units[_loc2_].x * this.scaleR + this.bmp.x + 2, units[_loc2_].y * this.scaleR + this.bmp.y - 4, true, 'radar0', 'player');
      }
      _loc2_++;
    }
    if (MatchSettings.useMode == 'dom') {
      const hp = this.game.arena.holdpoints;
      _loc2_ = 0;
      while (_loc2_ < hp.length) {
        this.paint(hp[_loc2_].x * this.scaleR + this.bmp.x + 2, hp[_loc2_].y * this.scaleR + this.bmp.y - 3, true, 'radar0', 'flag' + hp[_loc2_].curTeam);
        _loc2_++;
      }
    } else if (MatchSettings.useMode == 'ctf') {
      const cf = this.game.arena.ctfflags;
      _loc2_ = 0;
      while (_loc2_ < cf.length) {
        if (!cf[_loc2_].unitCaptured) {
          this.paint(cf[_loc2_].x * this.scaleR + this.bmp.x + 2, cf[_loc2_].y * this.scaleR + this.bmp.y - 3, true, 'radar0', 'flag' + cf[_loc2_].team);
        }
        _loc2_++;
      }
    }
  }

  /** dotdata.copyPixels(BH.getBit(...), rect, point, null, null, mergeAlpha=true) */
  paint(param1: number, param2: number, param3: boolean, param4: string, param5 = '', param6 = 1): void {
    const _loc7_: Texture = BH.getBit(param4, param5, param6);
    const px = !param3 ? param1 : param1 - _loc7_.width / 2;
    const py = !param3 ? param2 : param2 - _loc7_.height / 2;
    let s = this.dotPool[this.dotUsed];
    if (!s) {
      s = new Sprite();
      this.dotPool.push(s);
      this.dotbmp.addChild(s);
    }
    this.dotUsed++;
    s.texture = _loc7_;
    s.visible = true;
    // copyPixels takes an integer destination point
    s.position.set(Math.trunc(px), Math.trunc(py));
  }
}
