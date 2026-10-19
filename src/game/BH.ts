// Port of BH.as — renders effect animations (symbol "BH", 39 labelled frames each holding a box +
// child "MC") into a cache of bitmaps at startup, one BH frame per tick, like the original.
import { Container, Rectangle, Texture } from 'pixi.js';
import { trace, uint } from '../flash/as3';
import { renderer, Symbol } from '../flash/runtime';
import type { SwfClip } from '../swf/display';
import type { Main } from './Main';

/** Bitmaps are rendered at the screen's pixel density (at least 2×) so effects stay crisp when scaled. */
const res = () => Math.min(4, Math.max(2, Math.ceil(renderer.resolution)));

interface BitInfo {
  pos?: number;
  sub?: Record<string, { pos: number; frames: number }>;
  width: number;
  height: number;
  rot: number;
  rotAmt: number;
}

export class BH extends Symbol {
  private static BitAr: Texture[] = [];
  static BITS: Record<string, BitInfo> = {};

  complete = false;
  private main: Main;
  private i = 1;
  rotate = 0;

  constructor(main: Main) {
    super('BH');
    // frame scripts: rotation variants per frame (from BH.as frame1..frame39)
    const rot: Record<number, number> = { 2: 3, 3: 3, 4: 3, 7: 4, 14: 4, 16: 4, 17: 4, 19: 3 };
    for (let f = 1; f <= this.totalFrames; f++) {
      const r = rot[f] ?? 0;
      this.addFrameScript(f - 1, () => (this.rotate = r));
    }
    this.main = main;
    BH.BitAr = [];
    BH.BITS = {};
    this.i = 1;
    this.complete = false;
  }

  get MC(): SwfClip | null {
    return this.maybeChild<SwfClip>('MC');
  }

  static getBitAniStats(name: string, sub: string) {
    if (!BH.BITS[name] || !BH.BITS[name].sub?.[sub]) trace('Bit', name, sub, 'not found!');
    const b = BH.BITS[name];
    return { name, sub, width: b.width, height: b.height, frames: b.sub![sub].frames, pos: b.sub![sub].pos, rotAmt: b.rotAmt };
  }

  static getBit(name: string, sub = '', frame = 1): Texture {
    try {
      const b = BH.BITS[name];
      const t = sub ? BH.BitAr[b.sub![sub].pos + (frame - 1)] : BH.BitAr[b.pos!];
      if (t) return t;
    } catch {
      /* fall through */
    }
    trace('Error: Could not find bit: ' + name + ', ' + sub + ', ' + frame);
    return Texture.EMPTY; // original indexes a non-existent "error" entry and throws
  }

  private snapshot(w: number, h: number): Texture {
    // Flash: new BitmapData(width, height) truncates; draw(this) with identity matrix.
    return renderer.generateTexture({
      target: this as Container,
      frame: new Rectangle(0, 0, Math.max(1, uint(w)), Math.max(1, uint(h))),
      resolution: res(),
      antialias: true,
    });
  }

  /** Called once per tick by Main until complete. */
  setup(): void {
    const mc = this.MC;
    const label = this.currentLabel ?? '';
    if (!mc) {
      // Flash width/height = bounds size (the bitmap is still drawn from the origin).
      const b = this.getLocalBounds();
      const w = b.width;
      const h = b.height;
      BH.BitAr.push(this.snapshot(w, h));
      BH.BITS[label + '0'] = { pos: BH.BitAr.length - 1, width: uint(w), height: uint(h), rot: this.rotate, rotAmt: 1 };
    } else {
      const rotAmt = this.rotate ? uint(this.rotate) : 1;
      const step = 360 / rotAmt;
      for (let r = 0; r < rotAmt; r++) {
        mc.angle = r * step;
        mc.scripted = true;
        const sub: Record<string, { pos: number; frames: number }> = {};
        let lastLabel: string | null = '';
        let w = 0;
        let h = 0;
        for (let f = 1; f <= mc.totalFrames; f++) {
          mc.gotoAndStop(f);
          if (mc.currentLabel != lastLabel) {
            lastLabel = mc.currentLabel;
            sub[lastLabel ?? 'null'] = { pos: BH.BitAr.length, frames: 0 };
          }
          sub[lastLabel ?? 'null'].frames++;
          const b = this.getLocalBounds();
          w = b.width;
          h = b.height;
          BH.BitAr.push(this.snapshot(w, h));
        }
        BH.BITS[label + r] = { sub, width: uint(w), height: uint(h), rot: this.rotate, rotAmt };
      }
    }
    if (this.i != this.totalFrames) {
      this.i++;
      this.gotoAndStop(this.i);
    } else this.doComplete();
  }

  doComplete(): void {
    this.complete = true;
    this.main.renderDone();
  }
}
