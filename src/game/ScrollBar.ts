// Port of ScrollBar.as — shop list scrollbar (symbol 960, placed as `scrollbar` on the menu's
// primary/secondary/skill/killstreak frames). Driven by Menu: EnterFrame(menfr) / MouseDown(menfr) /
// MouseUp() / MouseWheel(delta).
import { hitTestPoint, mouseX, mouseY, Symbol } from '../flash/runtime';
import type { SwfClip } from '../swf/display';

export class ScrollBar extends Symbol {
  get but_down() { return this.child<SwfClip>('but_down'); }
  get but_up() { return this.child<SwfClip>('but_up'); }
  get bar() { return this.child<SwfClip>('bar'); }

  scrollPos: number = NaN;
  // Number field: NaN until the first MouseUp, so `barGrab < 0` is false and the arrow buttons
  // do nothing (and stay at alpha 0.5) until then — original quirk, kept.
  private barGrab: number = NaN;

  constructor() {
    super('ScrollBar');
    this.bar.scripted = true;
    this.scrollPos = 0;
  }

  EnterFrame(param1: SwfClip): void {
    if (this.barGrab >= 0) {
      this.bar.y = mouseY(this) - this.barGrab;
    }
    if (this.bar.y < 24) {
      this.bar.y = 24;
    }
    if (this.bar.y > 240) {
      this.bar.y = 240;
    }
    this.scrollPos = (this.bar.y - 24) / (240 - 24);
    if (!(hitTestPoint(this.bar, mouseX(param1), mouseY(param1)) || this.barGrab >= 0)) {
      this.bar.alpha = 0.5;
    } else {
      this.bar.alpha = 1;
    }
    if (hitTestPoint(this.but_up, mouseX(param1), mouseY(param1)) && this.barGrab < 0) {
      this.but_up.alpha = 1;
    } else {
      this.but_up.alpha = 0.5;
    }
    if (hitTestPoint(this.but_down, mouseX(param1), mouseY(param1)) && this.barGrab < 0) {
      this.but_down.alpha = 1;
    } else {
      this.but_down.alpha = 0.5;
    }
  }

  MouseDown(param1: SwfClip): void {
    if (hitTestPoint(this.bar, mouseX(param1), mouseY(param1))) {
      this.barGrab = mouseY(this) - this.bar.y;
    }
    if (hitTestPoint(this.but_down, mouseX(param1), mouseY(param1)) && this.barGrab < 0) {
      this.bar.y += 50;
      if (this.bar.y > 240) {
        this.bar.y = 240;
      }
    }
    if (hitTestPoint(this.but_up, mouseX(param1), mouseY(param1)) && this.barGrab < 0) {
      this.bar.y -= 50;
      if (this.bar.y < 24) {
        this.bar.y = 24;
      }
    }
  }

  MouseUp(): void {
    this.barGrab = -1;
  }

  /** `delta` = MouseEvent.delta (positive = wheel up), as passed by Main.MouseWheel. */
  MouseWheel(delta: number): void {
    if (this.barGrab < 0) {
      this.bar.y += delta <= 0 ? 20 : -20;
      if (this.bar.y < 24) {
        this.bar.y = 24;
      }
      if (this.bar.y > 240) {
        this.bar.y = 240;
      }
    }
  }
}
