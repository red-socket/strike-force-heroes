// Global Flash-player-like environment shared by all ported game classes.
import { Container, Point as PixiPoint, type Renderer } from 'pixi.js';
import type { Library } from '../swf/Library';
import { SwfClip } from '../swf/display';

/** The converted SWF library (set once at boot). */
export let lib: Library;
/** Pixi renderer (for render-to-texture work such as the BH bitmap cache). */
export let renderer: Renderer;
/** Root display object (Flash stage). */
export let stageRoot: Container;

export function initRuntime(l: Library, r: Renderer, root: Container): void {
  lib = l;
  renderer = r;
  stageRoot = root;
}

/** Stage-space mouse position (800x600 coordinates), updated by the input layer. */
export const mouse = { x: 0, y: 0, down: false };

/** AS3 `obj.mouseX/mouseY`: the mouse in obj's local coordinates. */
export function mouseX(obj: Container): number {
  return obj.toLocal(new PixiPoint(mouse.x, mouse.y)).x;
}
export function mouseY(obj: Container): number {
  return obj.toLocal(new PixiPoint(mouse.x, mouse.y)).y;
}
export function localMouse(obj: Container): { x: number; y: number } {
  const p = obj.toLocal(new PixiPoint(mouse.x, mouse.y));
  return { x: p.x, y: p.y };
}

/**
 * AS3 hitTestPoint(x, y, shapeFlag=false): x/y are STAGE coordinates; tests the object's
 * bounding box in stage space. (The game only ever uses shapeFlag=false.) Note: many AS3 call
 * sites pass `mouseX, mouseY` of some clip — those are local coords that the original then
 * (incorrectly) treats as stage coords; pass whatever the original passed to stay faithful.
 */
export function hitTestPoint(obj: Container, x: number, y: number): boolean {
  if (!obj.parent && obj !== stageRoot) return false;
  // Pixi marks mask objects unmeasurable; Flash still hit-tests them.
  const m = obj.measurable;
  obj.measurable = true;
  const b = obj.getBounds();
  obj.measurable = m;
  return x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height;
}

/** Register a TS class for a linked symbol so timeline placements instantiate it. */
export function registerSymbol(className: string, make: () => SwfClip): void {
  SwfClip.classes.set(lib.idOf(className), () => make());
}

/**
 * Base for ported AS3 classes linked to a library symbol: `class Hud extends Symbol` →
 * `super('Hud')`. Timeline children for frame 1 exist when the subclass constructor body runs.
 */
export class Symbol extends SwfClip {
  constructor(className: string) {
    super(lib, lib.idOf(className));
  }
}

/** flash.net.SharedObject over localStorage (JSON). */
export class SharedObject {
  readonly data: Record<string, any>;
  private constructor(private key: string) {
    let d: Record<string, any> = {};
    try {
      d = JSON.parse(localStorage.getItem(key) ?? '{}') ?? {};
    } catch {
      d = {};
    }
    this.data = d;
  }
  static getLocal(name: string): SharedObject {
    return new SharedObject(`so:${name}`);
  }
  flush(): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.data));
    } catch (e) {
      console.warn('SharedObject flush failed', e);
    }
  }
  close(): void {}
  clear(): void {
    for (const k of Object.keys(this.data)) delete this.data[k];
    localStorage.removeItem(this.key);
  }
}

/** navigateToURL: sponsor links are disabled in the re-implementation. */
export function navigateToURL(_url: string): void {}
