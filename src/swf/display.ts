import {
  AlphaFilter,
  AlphaMask,
  CanvasTextGenerator,
  CanvasTextMetrics,
  fontStringFromTextStyle,
  Container,
  MaskEffectManager,
  FillGradient,
  Graphics,
  GraphicsContext,
  MaskFilter,
  Matrix,
  Rectangle,
  Sprite,
  Text,
  type Texture,
  type BLEND_MODES,
  type Filter,
} from 'pixi.js';
import 'pixi.js/advanced-blend-modes';
// premultiplied-correct replacements for the Flash blend modes (registered over Pixi's after the import above)
import { DarkenBlend, DifferenceBlend, HardLightBlend, LightenBlend, OverlayBlend, SubtractBlend } from './blendModes';
import { applyColorTransform, toPixiFilters } from './effects';
import type { Library } from './Library';
import { Timeline, type DepthState } from './Timeline';
import type { ButtonDef, EditTextDef, MorphDef, SoundStart, SpriteDef } from './types';

declare module 'pixi.js' {
  interface Container {
    /** Flash cacheAsBitmap flag (affects mask semantics only; not Pixi's own cacheAsBitmap). */
    swfCacheAsBitmap?: boolean;
    /**
     * Set by game code once it takes over a timeline child's transform (AS3 code assigning
     * x/y/rotation/scale). Timeline moves then no longer overwrite its matrix, like Flash.
     */
    scripted?: boolean;
  }
}

export type FrameScript = (clip: SwfClip) => void;
/** Creates the TS game-class instance for a timeline placement of a linked symbol. */
export type SwfClipFactory = (lib: Library, id: number) => SwfClip;

/** Extra per-object bookkeeping we hang off Pixi containers. */
interface SwfObj extends Container {
  _swfBlend?: string;
  _blendFilter?: Filter;
  _cxFilter?: any;
  _flashFilters?: Filter[];
  swfDepth?: number;
}

/**
 * Flash masks are shape coverage: colour and alpha of the mask are ignored. Our shapes are
 * rasterised sprites, so Pixi's default stencil masks (for containers) would mask with whole quads.
 * We (1) route SWF objects to Pixi's render-to-texture AlphaMask and (2) patch the shared mask
 * shader so any coverage counts as fully opaque (soft only on the anti-aliased rim).
 */
let alphaMaskInstalled = false;
export function installSwfMasks(): void {
  if (alphaMaskInstalled) return;
  alphaMaskInstalled = true;
  MaskEffectManager.init();
  (MaskEffectManager as any)._tests.unshift({
    test: (m: unknown) => m instanceof SwfClip || m instanceof SwfShape || m instanceof SwfMorph,
    maskClass: AlphaMask,
  });
  const prog = new MaskFilter({ sprite: new Sprite() }).glProgram as any;
  const before = prog.fragment as string;
  // Default ("red") channel → Flash coverage; "alpha" channel stays a true alpha mask, which Flash
  // uses when both mask and maskee are cacheAsBitmap (see setFlashMask).
  const coverage = 'a = clamp(masky.a * 8.0, 0.0, 1.0) * npmAlpha * clip;';
  prog.fragment = before.replace(/float alphaMul = [^;]*;\s*a = alphaMul \* masky\.r \* npmAlpha \* clip;/, coverage);
  if (prog.fragment === before) console.warn('mask shader patch did not apply');
  prog._key = `${prog._key}-swfcoverage`;
}

/**
 * AS3 `target.mask = mask`. Flash masks by shape coverage, except when both objects are
 * cacheAsBitmap, in which case the mask's alpha channel is used.
 */
export function setFlashMask(target: Container, mask: Container | null): void {
  const prev = target.mask as Container | null;
  if (prev?.parent instanceof SwfShape && prev.parent.children[0] === prev) prev.parent.measurable = true;
  if (!mask) {
    target.mask = null;
    return;
  }
  const alpha = !!(target.swfCacheAsBitmap && mask.swfCacheAsBitmap);
  if (!alpha) addClearShapeCoverage(mask);
  // A plain shape masks with its raster sprite directly (Pixi's sprite-mask path). Pixi's
  // render-to-texture mask path misplaces the whole output when the masked object sits inside a
  // filtered ancestor (e.g. the menu's locked medal icons: colour-matrix filter + clipDepth mask).
  // The shape itself stays unmeasurable, as Pixi makes any mask object.
  const m = mask instanceof SwfShape && !mask.maskCover ? mask.children[0] : mask;
  target.setMask({ mask: m, channel: alpha ? 'alpha' : 'red' });
  if (m !== mask) mask.measurable = false;
}

/**
 * Flash ignores fill colour/alpha in a mask, but a shape filled with alpha 0 (e.g. the menu shop's
 * `gunMask`) rasterises to an empty texture. Give such shapes a coverage rect over their declared bounds;
 * it only ever renders as part of the mask (Pixi never draws a mask subtree normally).
 * Approximation: exact for the rectangular invisible shapes the game uses as masks.
 */
function addClearShapeCoverage(o: Container): void {
  if (o instanceof SwfShape) {
    if (!o.maskCover && o.isClear()) {
      const b = o.boundsArea;
      o.maskCover = new Graphics().rect(b.x, b.y, b.width, b.height).fill(0xffffff);
      o.addChild(o.maskCover);
    }
    return;
  }
  for (const c of o.children) addClearShapeCoverage(c);
}
const clearShapes = new Map<number, boolean>();

/**
 * If a rasterised shape is a single-colour axis-aligned rectangle filling its bounds, its colour as
 * 0xAARRGGBB, else null. Cached per character; only small rasters are inspected.
 */
const solidRects = new Map<number, number | null>();
function solidRectColor(id: number, tex: Texture): number | null {
  let v = solidRects.get(id);
  if (v !== undefined) return v;
  v = null;
  if (!tex?.frame) return v;
  const res = tex.source?.resource as CanvasImageSource | undefined;
  const { x, y, width: w, height: h } = tex.frame;
  if (res && w >= 3 && h >= 3 && w * h <= 16384 && typeof OffscreenCanvas !== 'undefined') {
    try {
      const W = Math.round(w);
      const H = Math.round(h);
      const ctx = new OffscreenCanvas(W, H).getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(res, x, y, w, h, 0, 0, W, H);
      const px = ctx.getImageData(0, 0, W, H).data;
      const at = (i: number, j: number) => (j * W + i) * 4;
      const c0 = at(W >> 1, H >> 1);
      const [r, g, b, a] = [px[c0], px[c0 + 1], px[c0 + 2], px[c0 + 3]];
      let ok = a > 0;
      // Interior (all but the 1-px anti-aliased rim) must be exactly that colour.
      for (let j = 1; ok && j < H - 1; j++)
        for (let i = 1; i < W - 1; i++) {
          const k = at(i, j);
          if (px[k] !== r || px[k + 1] !== g || px[k + 2] !== b || px[k + 3] !== a) {
            ok = false;
            break;
          }
        }
      // The rim may only fade that colour out (no differently coloured outline).
      for (let j = 0; ok && j < H; j++)
        for (let i = 0; i < W; i += j === 0 || j === H - 1 ? 1 : W - 1) {
          const k = at(i, j);
          const tol = px[k + 3] < 64 ? 24 : 4;
          if (px[k + 3] && (Math.abs(px[k] - r) > tol || Math.abs(px[k + 1] - g) > tol || Math.abs(px[k + 2] - b) > tol)) {
            ok = false;
            break;
          }
        }
      if (ok) v = ((a << 24) | (r << 16) | (g << 8) | b) >>> 0;
    } catch {
      v = null;
    }
    solidRects.set(id, v);
  }
  return v;
}

const BLEND: Record<string, BLEND_MODES> = {
  normal: 'normal',
  layer: 'normal',
  multiply: 'multiply',
  screen: 'screen',
  lighten: 'lighten',
  darken: 'darken',
  difference: 'difference',
  add: 'add',
  subtract: 'subtract',
  invert: 'difference',
  alpha: 'normal',
  erase: 'erase',
  overlay: 'overlay',
  hardlight: 'hard-light',
};

export interface SoundHooks {
  /** StartSound tag on a timeline frame */
  event(clip: SwfClip, s: SoundStart): void;
  /** streamed timeline audio reached its first frame */
  stream(clip: SwfClip, def: NonNullable<SpriteDef['stream']>): void;
}

/** Create a display object for any character id, honouring class registrations. */
export function createCharacter(lib: Library, id: number): Container {
  const c = lib.char(id);
  switch (c.type) {
    case 'sprite': {
      const make = SwfClip.classes.get(id);
      return make ? make(lib, id) : new SwfClip(lib, id);
    }
    case 'shape':
    case 'text':
      return new SwfShape(lib, id);
    case 'morph':
      return new SwfMorph(c);
    case 'edittext':
      return new SwfTextField(lib, c);
    case 'button':
      return new SwfButton(lib, c);
    default:
      return new Container();
  }
}

/** Rasterised shape / static text: wrapper whose local space matches Flash's. */
export class SwfShape extends Container {
  readonly charId: number;
  constructor(lib: Library, id: number) {
    super();
    this.charId = id;
    const c = lib.char(id) as { scale: number; origin: [number, number]; bounds: [number, number, number, number] };
    // Measure by the declared shape bounds (the raster is rounded up to whole pixels).
    const [x0, y0, x1, y1] = c.bounds;
    this.boundsArea = new Rectangle(x0, y0, x1 - x0, y1 - y0);
    const tex = lib.texture(id);
    const fill = solidRectColor(id, tex);
    if (fill !== null) {
      // A plain filled rectangle (e.g. the 46.5×4.9 unit bar stretched 100× into backgrounds and
      // masks): draw it as geometry, since a magnified raster smears its anti-aliased rim by
      // tens of pixels (and masks would leak through that rim).
      this.addChild(new Graphics().rect(x0, y0, x1 - x0, y1 - y0).fill({ color: fill & 0xffffff, alpha: (fill >>> 24) / 255 }));
      return;
    }
    const s = new Sprite(tex);
    s.position.set(c.origin[0], c.origin[1]);
    s.scale.set(1 / c.scale);
    this.addChild(s);
  }

  /** Mask-only coverage for a fully transparent shape (see addClearShapeCoverage). */
  maskCover?: Graphics;

  /** True when the rasterised shape has no visible pixel (all fills alpha 0). Cached per character. */
  isClear(): boolean {
    let v = clearShapes.get(this.charId);
    if (v === undefined) {
      v = false;
      const spr = this.children[0];
      if (!(spr instanceof Sprite)) return false; // drawn as geometry (solid rectangle): never clear
      const tex = spr.texture;
      const res = tex?.source?.resource as CanvasImageSource | undefined;
      const { x, y, width: w, height: h } = tex.frame;
      if (res && w >= 1 && h >= 1 && typeof OffscreenCanvas !== 'undefined') {
        try {
          const ctx = new OffscreenCanvas(Math.ceil(w), Math.ceil(h)).getContext('2d')!;
          ctx.drawImage(res, x, y, w, h, 0, 0, w, h);
          const px = ctx.getImageData(0, 0, Math.ceil(w), Math.ceil(h)).data;
          v = true;
          for (let i = 3; i < px.length; i += 4) {
            if (px[i]) {
              v = false;
              break;
            }
          }
        } catch {
          v = false;
        }
      }
      clearShapes.set(this.charId, v);
    }
    return v;
  }
}

// ------------------------------------------------------------------ MovieClip

interface Slot {
  obj: SwfObj;
  state: DepthState;
}

export class SwfClip extends Container {
  /** symbol id -> factory for the TS class to instantiate for timeline placements */
  static classes = new Map<number, SwfClipFactory>();
  /** symbol id -> frame (1-based) -> script, for timeline-only symbols */
  static scripts = new Map<number, Map<number, FrameScript>>();
  static sound: SoundHooks | null = null;
  private static tickId = 0;

  readonly lib: Library;
  readonly charId: number;
  readonly timeline: Timeline;
  currentFrame = 1;
  playing = true;
  private slots = new Map<number, Slot>();
  private lastStates: DepthState[] | null = null;
  private instScripts: Map<number, FrameScript> | null = null;
  private bornTick = SwfClip.tickId;
  private holders: Container[] = [];
  private initDone = false;
  /** New clips whose frame-1 script has not run yet (Flash runs it in the frame they appear). */
  private static pending: SwfClip[] = [];

  constructor(lib: Library, id: number) {
    super();
    this.lib = lib;
    this.charId = id;
    this.timeline = Timeline.of(lib.sprite(id));
    this.syncTo(1);
    this.enterFrameMedia(1);
    SwfClip.pending.push(this);
  }

  /** Run frame-1 scripts of clips created since the last flush (timeline- or code-constructed). */
  static flushPending(): void {
    while (SwfClip.pending.length) {
      const c = SwfClip.pending.shift()!;
      if (c.initDone || c.destroyed) continue;
      // Timeline children removed again before their first frame ran never execute scripts in Flash.
      if ((c as SwfObj).swfDepth !== undefined && !c.parent) continue;
      c.initDone = true;
      if (c.currentFrame === 1) c.runFrameScript(1);
    }
  }

  get totalFrames(): number {
    return this.timeline.totalFrames;
  }
  get currentLabel(): string | null {
    return this.timeline.labelAt[this.currentFrame - 1];
  }
  get currentFrameLabel(): string | null {
    return this.timeline.frameLabel(this.currentFrame);
  }
  get className(): string | undefined {
    return this.lib.classOf.get(this.charId);
  }

  /** AS3 addFrameScript(frameIndex0, fn, ...) */
  addFrameScript(...pairs: (number | FrameScript)[]): void {
    this.instScripts ??= new Map();
    for (let i = 0; i < pairs.length; i += 2) this.instScripts.set((pairs[i] as number) + 1, pairs[i + 1] as FrameScript);
  }

  /** Runs the script for the current frame. Call once after construction for frame 1 (like Flash does). */
  runFrameScript(frame = this.currentFrame): void {
    if (frame === 1) this.initDone = true;
    const fn = this.instScripts?.get(frame) ?? SwfClip.scripts.get(this.charId)?.get(frame);
    if (!fn) return;
    try {
      fn(this);
    } catch (e) {
      // Flash reports uncaught errors in frame scripts and carries on.
      console.error(`frame script ${this.className ?? this.charId}@${frame}`, e);
    }
  }

  // --- playhead control (Flash semantics: frames are 1-based, labels accepted) ---

  private resolve(frame: number | string): number {
    if (typeof frame === 'number') return Math.min(Math.max(1, Math.floor(frame)), this.totalFrames);
    const f = this.timeline.labels.get(frame);
    if (f === undefined) {
      const n = Number(frame);
      if (!Number.isNaN(n)) return this.resolve(n);
      // Flash player (as Ruffle shows) does not throw for an unknown label: it goes to frame 1.
      // The game relies on it, e.g. Guns.setGuns("none","none") in the tutorial → empty gun frame 1.
      return 1;
    }
    return f;
  }

  hasLabel(label: string): boolean {
    return this.timeline.labels.has(label);
  }

  gotoAndStop(frame: number | string): void {
    this.playing = false;
    this.seekTo(this.resolve(frame));
  }

  gotoAndPlay(frame: number | string): void {
    this.playing = true;
    this.seekTo(this.resolve(frame));
  }

  stop(): void {
    this.playing = false;
  }

  play(): void {
    this.playing = true;
  }

  nextFrame(): void {
    this.playing = false;
    if (this.currentFrame < this.totalFrames) this.seekTo(this.currentFrame + 1);
  }

  prevFrame(): void {
    this.playing = false;
    if (this.currentFrame > 1) this.seekTo(this.currentFrame - 1);
  }

  private seekTo(frame: number): void {
    if (frame === this.currentFrame) return;
    this.syncTo(frame);
    this.enterFrameMedia(frame);
    this.runFrameScript(frame);
  }

  /** One timeline tick (called by SwfClip.tick for every clip in the tree). */
  private advance(): void {
    if (!this.playing || this.totalFrames <= 1 || this.bornTick === SwfClip.tickId) return;
    const next = this.currentFrame >= this.totalFrames ? 1 : this.currentFrame + 1;
    this.syncTo(next);
    this.enterFrameMedia(next);
    this.runFrameScript(next);
  }

  private enterFrameMedia(frame: number): void {
    const h = SwfClip.sound;
    if (!h) return;
    const f = this.timeline.def.frames[frame - 1];
    if (f?.sounds) for (const s of f.sounds) h.event(this, s);
    const st = this.timeline.def.stream;
    if (st && st.startFrame + 1 === frame) h.stream(this, st);
  }

  /** Advance every playing clip under `root` by one frame (parents before children). */
  static tick(root: Container): void {
    // Clips constructed between ticks (e.g. after an async preload) get their frame-1 script first.
    SwfClip.flushPending();
    SwfClip.tickId++;
    const visit = (o: Container) => {
      if (o instanceof SwfClip) o.advance();
      // Copy: scripts may add/remove children while we iterate.
      const kids = o.children.slice();
      for (const k of kids) if (k.parent) visit(k as Container);
    };
    visit(root);
    SwfClip.flushPending();
  }

  // --- display list sync ---

  private syncTo(frame: number): void {
    const states = this.timeline.stateAt(frame);
    this.currentFrame = frame;
    if (states === this.lastStates) return;
    let structural = false;
    const seen = new Set<number>();
    for (const st of states) {
      seen.add(st.depth);
      const slot = this.slots.get(st.depth);
      if (slot && slot.state.id === st.id && slot.state.born === st.born) {
        if (slot.state !== st) {
          if (slot.state.clipDepth !== st.clipDepth) structural = true;
          applyState(slot.obj, st, slot.state);
          slot.state = st;
        }
        continue;
      }
      if (slot) this.dropSlot(slot);
      if (st.id < 0) continue;
      const obj = createCharacter(this.lib, st.id) as SwfObj;
      obj.swfDepth = st.depth;
      if (st.name) obj.label = st.name;
      applyState(obj, st, undefined);
      this.slots.set(st.depth, { obj, state: st });
      structural = true;
    }
    for (const [d, slot] of this.slots) {
      if (!seen.has(d)) {
        this.dropSlot(slot);
        this.slots.delete(d);
        structural = true;
      }
    }
    this.lastStates = states;
    if (structural) this.reorder();
  }

  private dropSlot(slot: Slot): void {
    slot.obj.removeFromParent();
    if (slot.obj instanceof SwfClip) slot.obj.dispose();
  }

  /** Release per-instance resources (timeline children); textures are shared and kept. */
  dispose(): void {
    for (const s of this.slots.values()) if (s.obj instanceof SwfClip) s.obj.dispose();
    this.slots.clear();
    this.lastStates = null;
  }

  private reorder(): void {
    const timelineObjs = new Set<Container>();
    for (const s of this.slots.values()) timelineObjs.add(s.obj);
    // Script-added children keep their relative order above the timeline content.
    const extra = this.children.filter((c) => !timelineObjs.has(c) && !this.holders.includes(c));
    for (const h of this.holders) h.removeChildren();
    this.removeChildren();
    this.holders = [];
    const sorted = [...this.slots.values()].sort((a, b) => a.state.depth - b.state.depth);
    let holder: Container | null = null;
    let clipTo = -1;
    for (const s of sorted) {
      if (holder && s.state.depth > clipTo) holder = null;
      const target: Container = holder ?? this;
      if (s.state.clipDepth !== undefined) {
        target.addChild(s.obj);
        const h = new Container();
        setFlashMask(h, s.obj);
        target.addChild(h);
        this.holders.push(h);
        holder = h;
        clipTo = s.state.clipDepth;
      } else {
        target.addChild(s.obj);
      }
    }
    for (const e of extra) this.addChild(e);
  }

  /** Timeline child by instance name (AS3 `this.someName`). */
  child<T extends Container = Container>(name: string): T {
    for (const s of this.slots.values()) if (s.state.name === name) return s.obj as unknown as T;
    for (const c of this.children) if (c.label === name) return c as T;
    throw new Error(`no child "${name}" in ${this.className ?? this.charId} @${this.currentFrame}`);
  }

  maybeChild<T extends Container = Container>(name: string): T | null {
    for (const s of this.slots.values()) if (s.state.name === name) return s.obj as unknown as T;
    return null;
  }

  /** Timeline children in depth order (for iteration like AS3 getChildAt loops). */
  timelineChildren(): Container[] {
    return [...this.slots.values()].sort((a, b) => a.state.depth - b.state.depth).map((s) => s.obj);
  }
}

/** Advanced blends Pixi implements as back-buffer filters. */
const ADV_BLEND: Record<string, new () => Filter> = {
  overlay: OverlayBlend,
  hardlight: HardLightBlend,
  difference: DifferenceBlend,
  invert: DifferenceBlend,
  lighten: LightenBlend,
  darken: DarkenBlend,
  subtract: SubtractBlend,
};

/**
 * Combine Flash filters, the colour-transform filter and the blend mode. Pixi ignores a container's
 * blendMode once the container has filters, so blending then has to happen in the filter chain:
 * advanced modes as a trailing blend filter, basic ones as the blend mode of a pass-through filter.
 */
function rebuildFilters(obj: SwfObj): void {
  const list: Filter[] = [...(obj._flashFilters ?? [])];
  if (obj._cxFilter) list.push(obj._cxFilter);
  const blend = obj._swfBlend ?? 'normal';
  if (list.length && blend !== 'normal' && blend !== 'layer') {
    obj.blendMode = 'normal';
    const Adv = ADV_BLEND[blend];
    if (!obj._blendFilter) {
      obj._blendFilter = Adv ? new Adv() : new AlphaFilter({ alpha: 1 });
      if (!Adv) obj._blendFilter.blendMode = BLEND[blend] ?? 'normal';
    }
    list.push(obj._blendFilter);
  } else {
    // 'normal' must stay 'inherit' in Pixi: an explicit 'normal' would cut off a blended parent's mode
    // (e.g. an overlay light clip whose child shapes are placed with the default blend).
    obj.blendMode = blend === 'normal' || blend === 'layer' ? 'inherit' : (BLEND[blend] ?? 'normal');
  }
  obj.filters = list.length ? list : null;
}

function applyState(obj: SwfObj, st: DepthState, prev: DepthState | undefined): void {
  if (!obj.scripted && st.matrix !== prev?.matrix) {
    const m = st.matrix;
    if (m) obj.setFromMatrix(new Matrix(m[0], m[1], m[2], m[3], m[4], m[5]));
    else obj.setFromMatrix(new Matrix());
  }
  let filtersDirty = false;
  if (st.cx !== prev?.cx || !prev) {
    applyColorTransform(obj, st.cx);
    filtersDirty = true;
  }
  if (st.filters !== prev?.filters) {
    obj._flashFilters = st.filters ? toPixiFilters(st.filters) : undefined;
    filtersDirty = true;
  }
  if (st.blend !== prev?.blend) {
    obj._swfBlend = st.blend ?? 'normal';
    filtersDirty = true;
  }
  if (filtersDirty) rebuildFilters(obj);
  if (st.visible !== prev?.visible) obj.visible = st.visible ?? true;
  if (st.cacheAsBitmap !== prev?.cacheAsBitmap) obj.swfCacheAsBitmap = st.cacheAsBitmap;
  if (st.ratio !== prev?.ratio && obj instanceof SwfMorph) obj.setRatio((st.ratio ?? 0) / 65535);
}

// ------------------------------------------------------------------ morph shapes

export class SwfMorph extends Graphics {
  private static contexts = new WeakMap<MorphDef, Map<number, GraphicsContext>>();
  readonly def: MorphDef;

  constructor(def: MorphDef) {
    super();
    this.def = def;
    this.setRatio(0);
  }

  setRatio(r: number): void {
    let cache = SwfMorph.contexts.get(this.def);
    if (!cache) SwfMorph.contexts.set(this.def, (cache = new Map()));
    const key = Math.round(r * 1000);
    let ctx = cache.get(key);
    if (!ctx) cache.set(key, (ctx = buildMorph(this.def, key / 1000)));
    this.context = ctx;
  }
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpColor = (a: number, b: number, t: number) =>
  (Math.round(lerp((a >> 16) & 255, (b >> 16) & 255, t)) << 16) |
  (Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, t)) << 8) |
  Math.round(lerp(a & 255, b & 255, t));

function buildMorph(def: MorphDef, t: number): GraphicsContext {
  const g = new GraphicsContext();
  for (const p of def.paths) {
    const [a, b] = p.d;
    for (let i = 0; i < a.length; ) {
      const cmd = a[i];
      const n = (j: number) => lerp(a[i + j] as number, b[i + j] as number, t);
      if (cmd === 'M') (g.moveTo(n(1), n(2)), (i += 3));
      else if (cmd === 'L') (g.lineTo(n(1), n(2)), (i += 3));
      else if (cmd === 'Q') (g.quadraticCurveTo(n(1), n(2), n(3), n(4)), (i += 5));
      else (g.closePath(), (i += 1));
    }
    if (p.fill) {
      if (p.fill.gradient) g.fill(morphGradient(p.fill.gradient, t));
      else g.fill({ color: lerpColor(p.fill.color![0], p.fill.color![1], t), alpha: lerp(p.fill.alpha![0], p.fill.alpha![1], t) });
    }
    if (p.stroke) {
      g.stroke({
        width: lerp(p.stroke.width[0], p.stroke.width[1], t),
        color: lerpColor(p.stroke.color[0], p.stroke.color[1], t),
        alpha: lerp(p.stroke.alpha[0], p.stroke.alpha[1], t),
        cap: p.stroke.cap as any,
        join: p.stroke.join as any,
      });
    }
  }
  return g;
}

function morphGradient(gr: NonNullable<MorphDef['paths'][number]['fill']>['gradient'] & {}, t: number): FillGradient {
  const m = gr.matrix[0].map((v, i) => lerp(v, gr.matrix[1][i], t));
  const tp = (x: number, y: number) => ({ x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] });
  const colorStops = gr.stops.map((s) => {
    const c = lerpColor(s.color[0], s.color[1], t);
    const al = lerp(s.alpha[0], s.alpha[1], t);
    return { offset: lerp(s.offset[0], s.offset[1], t), color: `rgba(${c >> 16},${(c >> 8) & 255},${c & 255},${al})` };
  });
  if (gr.type === 'linear') {
    return new FillGradient({ type: 'linear', start: tp(-819.2, 0), end: tp(819.2, 0), colorStops, textureSpace: 'global' });
  }
  const c = tp(0, 0);
  const e = tp(819.2, 0);
  const r = Math.hypot(e.x - c.x, e.y - c.y);
  const ey = tp(0, 819.2);
  const ry = Math.hypot(ey.x - c.x, ey.y - c.y);
  return new FillGradient({
    type: 'radial',
    center: c,
    innerRadius: 0,
    outerCenter: c,
    outerRadius: r,
    scale: r ? ry / r : 1,
    rotation: Math.atan2(e.y - c.y, e.x - c.x),
    colorStops,
    textureSpace: 'global',
  });
}

// ------------------------------------------------------------------ text fields

/**
 * Flash lays text out with fractional glyph advances. Chrome's canvas rounds each advance to whole
 * pixels unless geometric precision is requested, which made Pixi wrap lines earlier than Flash
 * (e.g. the menu medal descriptions). The measuring canvas is never resized, so this sticks.
 */
let textPrecisionSet = false;
function useGeometricTextMetrics(): void {
  if (textPrecisionSet) return;
  textPrecisionSet = true;
  const ctx = CanvasTextMetrics._context as unknown as { textRendering?: string };
  if (!ctx || !('textRendering' in ctx)) return;
  ctx.textRendering = 'geometricPrecision';
  // Draw with the same advances (pooled canvases are resized per text, which resets context state),
  // or glyph runs end up wider than the measured texture and get cut at the right edge.
  const gen = CanvasTextGenerator as unknown as { _renderTextToCanvas: (...a: any[]) => void };
  const render = gen._renderTextToCanvas;
  gen._renderTextToCanvas = function (this: unknown, ...a: any[]) {
    (a[3].context as { textRendering: string }).textRendering = 'geometricPrecision';
    return render.apply(this, a);
  };
}

export class SwfTextField extends Container {
  readonly def: EditTextDef;
  private field: Text;
  private _text = '';
  private boundsRect: Rectangle;
  /** Clip rect, present only while the text overflows the box (Flash clips text to the field). */
  private clip: Graphics | null = null;

  constructor(lib: Library, def: EditTextDef) {
    super();
    useGeometricTextMetrics();
    this.def = def;
    const [x0, y0, x1, y1] = def.bounds;
    this.boundsRect = new Rectangle(x0, y0, x1 - x0, y1 - y0);
    // Flash measures (and hit-tests) a TextField by its box, not by the glyphs drawn.
    this.boundsArea = this.boundsRect;
    const col = def.color ?? [0, 0, 0, 255];
    this.field = new Text({
      text: '',
      resolution: 2,
      style: {
        fontFamily: def.font !== undefined ? lib.fontFamily(def.font) : 'sans-serif',
        fontSize: def.size ?? 12,
        fill: (col[0] << 16) | (col[1] << 8) | col[2],
        align: def.align === 'justify' ? 'left' : (def.align ?? 'left'),
        wordWrap: def.wordWrap,
        wordWrapWidth: Math.max(1, this.boundsRect.width - 4),
        lineHeight: def.leading !== undefined ? (def.size ?? 12) * 1.15 + def.leading : undefined,
      },
    });
    this.field.alpha = col[3] / 255;
    this.addChild(this.field);
    const init = def.text ?? '';
    if (def.html) this.htmlText = init;
    else this.text = init;
  }

  get text(): string {
    return this._text;
  }
  set text(v: string) {
    this._text = String(v);
    this.field.text = this._text.replace(/\r\n?/g, '\n');
    this.layoutField();
  }

  /** Minimal htmlText: strips tags, honours <br>/<p>. */
  set htmlText(v: string) {
    const plain = String(v)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&');
    this.text = plain;
  }

  set textColor(c: number) {
    this.field.style.fill = c;
  }

  private layoutField(): void {
    const b = this.boundsRect;
    const w = this.field.width;
    let x = b.x + 2;
    if (!this.def.wordWrap) {
      if (this.def.align === 'center') x = b.x + (b.width - w) / 2;
      else if (this.def.align === 'right') x = b.x + b.width - 2 - w;
    } else if (this.def.align === 'center') x = b.x + 2 + (b.width - 4 - w) / 2;
    else if (this.def.align === 'right') x = b.x + b.width - 2 - w;
    // Pixi centres each line in its lineHeight box; Flash adds the leading below the line instead.
    const st = this.field.style;
    const lh = st.lineHeight;
    const shift = lh ? Math.max(0, (lh - CanvasTextMetrics.measureFont(fontStringFromTextStyle(st)).fontSize) / 2) : 0;
    this.field.position.set(x, b.y + 2 - shift);
    // Flash clips a field's text to its box (e.g. a wrapped second line in a one-line field).
    // Only clip on a real overflow so small metric differences never shave glyphs.
    const fy = this.field.y;
    const over = !this.def.autoSize && (fy + this.field.height > b.y + b.height + 2 || x < b.x - 2 || x + w > b.x + b.width + 2);
    if (over && !this.clip) {
      this.clip = new Graphics().rect(b.x, b.y, b.width, b.height).fill(0xffffff);
      this.addChild(this.clip);
      this.field.mask = this.clip;
    } else if (!over && this.clip) {
      this.field.mask = null;
      this.clip.destroy();
      this.clip = null;
    }
  }
}

// ------------------------------------------------------------------ buttons

export class SwfButton extends Container {
  private states: Record<'up' | 'over' | 'down', Container> = { up: new Container(), over: new Container(), down: new Container() };
  private hover = false;
  private pressed = false;

  constructor(lib: Library, def: ButtonDef) {
    super();
    const hit = new Container();
    for (const rec of [...def.records].sort((a, b) => a.depth - b.depth)) {
      for (const s of rec.states) {
        const obj = createCharacter(lib, rec.id) as SwfObj;
        const m = rec.matrix;
        obj.setFromMatrix(new Matrix(m[0], m[1], m[2], m[3], m[4], m[5]));
        applyColorTransform(obj, rec.cx);
        const fl: Filter[] = [...(rec.filters ? toPixiFilters(rec.filters) : [])];
        if (obj._cxFilter) fl.push(obj._cxFilter);
        if (fl.length) obj.filters = fl;
        if (s === 'hit') hit.addChild(obj);
        else this.states[s].addChild(obj);
      }
    }
    for (const k of ['up', 'over', 'down'] as const) this.addChild(this.states[k]);
    this.addChild(hit);
    hit.renderable = false;
    const hb = hit.getLocalBounds();
    this.hitArea = new Rectangle(hb.x, hb.y, hb.width, hb.height);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointerover', () => ((this.hover = true), this.refresh()));
    this.on('pointerout', () => ((this.hover = false), (this.pressed = false), this.refresh()));
    this.on('pointerdown', () => ((this.pressed = true), this.refresh()));
    this.on('pointerup', () => ((this.pressed = false), this.refresh()));
    this.refresh();
  }

  private refresh(): void {
    const s = this.pressed ? 'down' : this.hover ? 'over' : 'up';
    for (const k of ['up', 'over', 'down'] as const) this.states[k].visible = k === s;
  }
}
