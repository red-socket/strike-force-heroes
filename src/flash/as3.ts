// AS3 language semantics that differ from JS and matter for a faithful port.

/** AS3 int(x) / implicit coercion to `int`: ToInt32 (truncates, NaN -> 0, wraps). */
export const int = (v: number): number => v | 0;

/** AS3 uint(x) / implicit coercion to `uint`: ToUint32 (truncates, NaN -> 0, negatives wrap to 2^32-n). */
export const uint = (v: number): number => v >>> 0;

/** AS3 Boolean(x) */
export const bool = (v: unknown): boolean => !!v;

/** AS3 Number(x) for strings/booleans/undefined (undefined -> NaN, null -> 0). */
export const num = (v: unknown): number => Number(v);

export let TRACE = import.meta.env.DEV;
export function setTrace(on: boolean): void {
  TRACE = on;
}

/** AS3 trace(): space-joined, dev builds only. */
export function trace(...args: unknown[]): void {
  if (TRACE) console.log(...args);
}

/** flash.utils.getTimer(): ms since start. */
const t0 = performance.now();
export const getTimer = (): number => Math.floor(performance.now() - t0);

/** Flash keyCode constants used by the game (browser KeyboardEvent.keyCode matches these). */
export const Keyboard = {
  BACKSPACE: 8,
  TAB: 9,
  ENTER: 13,
  SHIFT: 16,
  CONTROL: 17,
  ESCAPE: 27,
  SPACE: 32,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  DELETE: 46,
  A: 65,
  D: 68,
  E: 69,
  P: 80,
  Q: 81,
  R: 82,
  S: 83,
  W: 87,
} as const;

/** Minimal flash.events.KeyboardEvent shape passed to game KeyDown/KeyUp handlers. */
export interface FlashKeyboardEvent {
  keyCode: number;
  charCode: number;
  shiftKey: boolean;
  ctrlKey: boolean;
}

export function toFlashKey(e: KeyboardEvent): FlashKeyboardEvent {
  return {
    keyCode: e.keyCode,
    charCode: e.key.length === 1 ? e.key.charCodeAt(0) : 0,
    shiftKey: e.shiftKey,
    ctrlKey: e.ctrlKey,
  };
}

/** flash.geom.Point */
export class Point {
  constructor(
    public x = 0,
    public y = 0,
  ) {}
  get length(): number {
    return Math.hypot(this.x, this.y);
  }
  static distance(a: Point, b: Point): number {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
}
