// Port of BitScreen.as — screen-space effects layer. The original copyPixels() cached BH bitmaps
// into one 800x600 BitmapData cleared each frame; here we pool sprites, which composites the same.
import { Container, Graphics, Rectangle, Sprite } from 'pixi.js';
import { BH } from './BH';
import { Main } from './Main';
import type { Game } from './Game';

export class BitScreen extends Container {
  rect: Rectangle;
  private pool: Sprite[] = [];
  private used = 0;
  private fillLayer = new Graphics();
  private game: Game;

  constructor(game: Game) {
    super();
    this.game = game;
    this.rect = new Rectangle(0, 0, Main.WIDTH, Main.HEIGHT);
    this.addChild(this.fillLayer);
  }

  /** data.fillRect(rect, 0) */
  EnterFrame(): void {
    for (let i = 0; i < this.used; i++) this.pool[i].visible = false;
    this.used = 0;
    this.fillLayer.clear();
  }

  /** data.fillRect(rect, argb) used by Killstreak_Gas: replaces everything painted so far this frame. */
  fill(argb: number): void {
    this.EnterFrame();
    const a = ((argb >>> 24) & 255) / 255;
    if (a > 0) this.fillLayer.rect(0, 0, Main.WIDTH, Main.HEIGHT).fill({ color: argb & 0xffffff, alpha: a });
  }

  paint(x: number, y: number, centre: boolean, name: string, sub = 'idle', frame = 1): void {
    const tex = BH.getBit(name, sub, frame);
    let s = this.pool[this.used];
    if (!s) {
      s = new Sprite();
      this.pool.push(s);
      this.addChild(s);
    }
    this.used++;
    s.texture = tex;
    s.visible = true;
    const w = tex.width;
    const h = tex.height;
    // copyPixels takes an integer destination point
    s.position.set(Math.trunc(centre ? x - w / 2 : x), Math.trunc(centre ? y - h / 2 : y));
  }

  destroy(): void {
    super.destroy({ children: true });
  }
}
