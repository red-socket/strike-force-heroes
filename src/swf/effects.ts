import { BlurFilter, ColorMatrixFilter, Container, Filter } from 'pixi.js';
import { BevelFilter, DropShadowFilter, GlowFilter } from 'pixi-filters';
import type { CX, FlashFilter } from './types';

const rgb = (c: number[]) => (c[0] << 16) | (c[1] << 8) | c[2];

/** Flash blur sizes are box-filter widths; Pixi strength is roughly a radius. */
const blurStrength = (b: number) => b * 0.5;

const filterCache = new WeakMap<FlashFilter[], Filter[]>();

/** Convert a Flash filter list into Pixi filters (cached per source list; instances are shared). */
export function toPixiFilters(list: FlashFilter[]): Filter[] {
  let out = filterCache.get(list);
  if (out) return out;
  out = [];
  for (const f of list) {
    const pf = convert(f);
    if (pf) out.push(pf);
  }
  filterCache.set(list, out);
  return out;
}

function convert(f: FlashFilter): Filter | null {
  switch (f.type) {
    case 'blur': {
      if (f.blurX <= 1 && f.blurY <= 1) return null;
      return new BlurFilter({
        strengthX: blurStrength(f.blurX),
        strengthY: blurStrength(f.blurY),
        quality: Math.max(1, f.passes),
      });
    }
    case 'glow': {
      const d = Math.min(20, Math.max(1, Math.round(Math.max(f.blurX, f.blurY) / 2)));
      return new GlowFilter({
        distance: d,
        outerStrength: f.inner ? 0 : f.strength,
        innerStrength: f.inner ? f.strength : 0,
        color: rgb(f.color),
        alpha: f.color[3] / 255,
        knockout: f.knockout,
        quality: 0.2,
      });
    }
    case 'dropShadow': {
      if (f.inner) return null; // not supported by pixi-filters; rare
      return new DropShadowFilter({
        offset: { x: Math.cos(f.angle) * f.distance, y: Math.sin(f.angle) * f.distance },
        color: rgb(f.color),
        alpha: Math.min(1, (f.color[3] / 255) * f.strength),
        blur: blurStrength(Math.max(f.blurX, f.blurY)) / 2,
        shadowOnly: f.knockout,
        quality: Math.max(1, f.passes),
      });
    }
    case 'bevel':
      return new BevelFilter({
        rotation: (f.angle * 180) / Math.PI,
        thickness: f.distance,
        lightColor: rgb(f.highlight),
        lightAlpha: f.highlight[3] / 255,
        shadowColor: rgb(f.shadow),
        shadowAlpha: f.shadow[3] / 255,
      });
    case 'colorMatrix': {
      const cm = new ColorMatrixFilter();
      const m = f.matrix.slice() as number[];
      for (const i of [4, 9, 14, 19]) m[i] /= 255;
      cm.matrix = m as any;
      return cm;
    }
    default:
      return null;
  }
}

const IDENTITY_CX: CX = [1, 1, 1, 1, 0, 0, 0, 0];

/**
 * Apply a Flash colour transform. Pure multiplicative transforms map onto tint+alpha (cheap,
 * inherited by children like Flash); anything with additive terms or >1 multipliers needs a filter.
 */
export function applyColorTransform(obj: Container & { _cxFilter?: ColorMatrixFilter | null }, cx: CX | undefined): Filter | null {
  const c = cx ?? IDENTITY_CX;
  const simple = c[4] === 0 && c[5] === 0 && c[6] === 0 && c[7] === 0 && c[0] <= 1 && c[1] <= 1 && c[2] <= 1;
  if (simple) {
    obj.alpha = Math.max(0, Math.min(1, c[3]));
    const r = Math.max(0, Math.round(c[0] * 255));
    const g = Math.max(0, Math.round(c[1] * 255));
    const b = Math.max(0, Math.round(c[2] * 255));
    obj.tint = (r << 16) | (g << 8) | b;
    obj._cxFilter = null;
    return null;
  }
  obj.alpha = 1;
  obj.tint = 0xffffff;
  const f = obj._cxFilter ?? new ColorMatrixFilter();
  f.matrix = [
    c[0], 0, 0, 0, c[4] / 255,
    0, c[1], 0, 0, c[5] / 255,
    0, 0, c[2], 0, c[6] / 255,
    0, 0, 0, c[3], c[7] / 255,
  ] as any;
  obj._cxFilter = f;
  return f;
}
