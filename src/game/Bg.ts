// Port of Bg.as — parallax background layer (21 labelled frames); `usebox` gives its virtual size.
import { Rectangle, type Container } from 'pixi.js';
import { lib, Symbol } from '../flash/runtime';
import { SwfShape, type SwfClip } from '../swf/display';

/**
 * Flash `width/height` use the shapes' declared bounds; a rasterised SwfShape measures its texture, which is
 * rounded up to whole texels (usebox shape 29 is 42.8x70.1 but its texture is 43x70.5 → usebox.width 2407
 * instead of 2395.8). Pin the declared bounds so the parallax formula sees Flash's numbers.
 */
function pinShapeBounds(o: Container): void {
  if (o instanceof SwfShape) {
    const c = lib.char(o.charId) as { bounds?: [number, number, number, number] };
    if (c.bounds) o.boundsArea = new Rectangle(c.bounds[0], c.bounds[1], c.bounds[2] - c.bounds[0], c.bounds[3] - c.bounds[1]);
    return;
  }
  for (const k of o.children) pinShapeBounds(k as Container);
}

export class Bg extends Symbol {
  get usebox(): SwfClip {
    return this.child<SwfClip>('usebox');
  }

  constructor() {
    super('Bg');
    this.addFrameScript(0, () => this.frame1());
    pinShapeBounds(this.usebox);
  }

  frame1(): void {
    this.stop();
  }
}
