// world-group helper (not an AS3 class).
//
// Flash assigns the instance `name` of a timeline-placed object BEFORE its constructor runs, and
// several Node* constructors parse `name` (e.g. "k_lefgh"). Our SwfClip runtime constructs the
// object first and assigns `label` right after (src/swf/display.ts syncTo). This hook moves the
// name-dependent tail of such constructors into a callback that runs the moment the label is first
// assigned — i.e. still before anything else can observe the instance (before the parent applies
// the placement matrix and before the parent's frame script runs).
import type { Container } from 'pixi.js';

const LABEL = Symbol('flashName');
const DONE = Symbol('flashNameInit');

export function onFlashName<T extends Container>(
  cls: abstract new (...args: any[]) => T,
  init: (obj: T, name: string) => void,
): void {
  Object.defineProperty(cls.prototype, 'label', {
    configurable: true,
    enumerable: true,
    get(this: any): string {
      return this[LABEL] ?? null;
    },
    set(this: any, v: string) {
      this[LABEL] = v;
      if (v != null && !this[DONE]) {
        this[DONE] = true;
        init(this as T, String(v));
      }
    },
  });
}
