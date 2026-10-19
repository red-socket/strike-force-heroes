// Port of Debug.as — FPS / frame-time / memory overlay (symbol 1500), placed in the Hud timeline
// as `debug` (off-screen unless debug key 5 moves it). Timeline-instantiated → registered in reg_ui.ts.
import { getTimer } from '../flash/as3';
import { Symbol } from '../flash/runtime';
import type { SwfClip, SwfTextField } from '../swf/display';

export class Debug extends Symbol {
  // `public dynamic class` in AS3
  [k: string]: any;

  get debug1() { return this.child<SwfTextField>('debug1'); }
  get debug2() { return this.child<SwfTextField>('debug2'); }
  get debug3() { return this.child<SwfTextField>('debug3'); }
  get debug4() { return this.child<SwfTextField>('debug4'); }
  get iBar() { return this.child<SwfClip>('iBar'); }
  get tf() { return this.child<SwfTextField>('tf'); }

  time: number = NaN;
  frameTime: number = NaN;
  prevFrameTime: number = NaN;
  secondTime: number = NaN;
  prevSecondTime: number = NaN;
  frames: number = NaN;
  fps: string = null!;

  constructor() {
    super('Debug');
    this.addFrameScript(0, () => this.frame1(), 1, () => this.frame2());
  }

  onEnterFrame(_param1?: unknown): void {
    if (this.destroyed) return;
    this.time = getTimer();
    this.frameTime = this.time - this.prevFrameTime;
    this.secondTime = this.time - this.prevSecondTime;
    if (this.secondTime < 1000) {
      ++this.frames;
    } else {
      this.fps = this.frames.toString();
      this.frames = 0;
      this.prevSecondTime = this.time;
    }
    this.prevFrameTime = this.time;
    // System.totalMemory → JS heap size where the browser exposes it (Chrome), else 0.
    const totalMemory: number = (performance as any).memory?.usedJSHeapSize ?? 0;
    this.tf.text = this.fps + ' FPS / ' + this.frameTime + ' MS / ' + Number(totalMemory / 1024 / 1024).toFixed(2) + 'Mb';
    this.iBar.scripted = true;
    this.iBar.scale.x -= (this.iBar.scale.x - this.frameTime / 10) / 5;
  }

  frame1(): void {
    this.prevFrameTime = getTimer();
    this.prevSecondTime = getTimer();
    this.frames = 0;
    this.fps = '...';
  }

  frame2(): void {
    this.stop();
    // addEventListener(Event.ENTER_FRAME, onEnterFrame): no per-object ENTER_FRAME in the runtime;
    // Pixi's per-render hook is the closest equivalent (this meter measures wall-clock anyway).
    this.onRender = () => this.onEnterFrame();
  }
}
