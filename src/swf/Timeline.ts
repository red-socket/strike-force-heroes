import type { CX, FlashFilter, Mat, PlaceOp, SpriteDef } from './types';

/** Immutable resolved state of one depth slot at some frame. */
export interface DepthState {
  depth: number;
  id: number;
  /** Frame (1-based) of the PlaceObject that created this instance; identity key across seeks. */
  born: number;
  matrix?: Mat;
  cx?: CX;
  ratio?: number;
  name?: string;
  clipDepth?: number;
  filters?: FlashFilter[];
  blend?: string;
  visible?: boolean;
  cacheAsBitmap?: boolean;
}

/** Display-list state per frame for a sprite definition, computed once and shared by all instances. */
export class Timeline {
  readonly def: SpriteDef;
  readonly totalFrames: number;
  readonly labels = new Map<string, number>();
  /** labelAt[f-1] = most recent label at or before frame f (Flash currentLabel) */
  readonly labelAt: (string | null)[] = [];
  /** states[f-1] = depth-sorted slot states; same array reference when frame has no ops. */
  private states: DepthState[][] | null = null;

  private static cache = new WeakMap<SpriteDef, Timeline>();

  static of(def: SpriteDef): Timeline {
    let t = Timeline.cache.get(def);
    if (!t) Timeline.cache.set(def, (t = new Timeline(def)));
    return t;
  }

  private constructor(def: SpriteDef) {
    this.def = def;
    this.totalFrames = Math.max(1, def.frames.length);
    let cur: string | null = null;
    def.frames.forEach((f, i) => {
      if (f.label !== undefined) {
        if (!this.labels.has(f.label)) this.labels.set(f.label, i + 1);
        cur = f.label;
      }
      this.labelAt.push(cur);
    });
    if (this.labelAt.length === 0) this.labelAt.push(null);
  }

  frameLabel(frame: number): string | null {
    return this.def.frames[frame - 1]?.label ?? null;
  }

  stateAt(frame: number): DepthState[] {
    if (!this.states) this.build();
    return this.states![Math.min(Math.max(frame, 1), this.totalFrames) - 1];
  }

  private build(): void {
    const states: DepthState[][] = [];
    const slots = new Map<number, DepthState>();
    let prev: DepthState[] = [];
    this.def.frames.forEach((f, i) => {
      const frame = i + 1;
      const ops = f.ops;
      if (!ops || ops.length === 0) {
        states.push(prev);
        return;
      }
      for (const op of ops) {
        if (op.op === 'remove') {
          slots.delete(op.depth);
          continue;
        }
        const old = slots.get(op.depth);
        slots.set(op.depth, apply(old, op, frame));
      }
      prev = [...slots.values()].sort((a, b) => a.depth - b.depth);
      states.push(prev);
    });
    if (states.length === 0) states.push([]);
    this.states = states;
  }
}

function apply(old: DepthState | undefined, op: PlaceOp, frame: number): DepthState {
  if (op.move && old) {
    const s: DepthState = { ...old };
    if (op.id !== undefined && op.id !== old.id) {
      // Character swap on an existing depth: new instance, keeps unspecified properties.
      s.id = op.id;
      s.born = frame;
    }
    assign(s, op);
    return s;
  }
  if (op.id === undefined) {
    // Move with no existing object: ignore (malformed), keep previous if any.
    return old ?? { depth: op.depth, id: -1, born: frame };
  }
  const s: DepthState = { depth: op.depth, id: op.id, born: frame };
  assign(s, op);
  return s;
}

function assign(s: DepthState, op: PlaceOp): void {
  if (op.matrix) s.matrix = op.matrix;
  if (op.cx) s.cx = op.cx;
  if (op.ratio !== undefined) s.ratio = op.ratio;
  if (op.name !== undefined) s.name = op.name;
  if (op.clipDepth !== undefined) s.clipDepth = op.clipDepth;
  if (op.filters) s.filters = op.filters;
  if (op.blend !== undefined) s.blend = op.blend;
  if (op.visible !== undefined) s.visible = op.visible;
  if (op.cacheAsBitmap !== undefined) s.cacheAsBitmap = op.cacheAsBitmap;
}
