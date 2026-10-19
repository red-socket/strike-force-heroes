import { BlurFilter, ColorMatrixFilter, Container, Filter } from 'pixi.js';
import { BevelFilter, DropShadowFilter } from 'pixi-filters';
import type { CX, FlashFilter } from './types';
import { FlashBevelFilter, FlashGlowFilter } from './flashFilters';

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
      // Flash runs `passes` box blurs of width blurX: σ = blurX·√passes/√12. Pixi's 9-tap Gaussian
      // pass spreads σ ≈ 1.864·strength (its passes keep σ and only smooth the result).
      const passes = Math.max(1, f.passes);
      const sigma = (b: number) => (b * Math.sqrt(passes)) / Math.sqrt(12) / 1.864;
      return new BlurFilter({
        strengthX: sigma(f.blurX),
        strengthY: sigma(f.blurY),
        quality: passes,
        kernelSize: 9,
      });
    }
    case 'glow':
      return new FlashGlowFilter(rgb(f.color), f.color[3] / 255, f.blurX, f.blurY, f.strength, Math.max(1, f.passes), f.inner, f.knockout);
    case 'dropShadow': {
      if (f.inner) return null; // not supported by pixi-filters; rare
      return new DropShadowFilter({
        offset: { x: Math.cos(f.angle) * f.distance, y: Math.sin(f.angle) * f.distance },
        color: rgb(f.color),
        alpha: Math.min(1, (f.color[3] / 255) * f.strength),
        // Flash blur is a box width; pixi-filters' Kawase blur strength is roughly a radius.
        blur: Math.max(f.blurX, f.blurY) / 2,
        shadowOnly: f.knockout,
        quality: Math.max(1, f.passes),
      });
    }
    case 'bevel': {
      if (f.inner && !f.onTop) {
        // SWF stores the highlight colour first (the spec's field order is wrong; Ruffle reads it so),
        // so the pipeline's `shadow` is Flash's highlight and vice versa.
        const hi = f.shadow;
        const sh = f.highlight;
        return new FlashBevelFilter(f.distance, (f.angle * 180) / Math.PI, rgb(hi), hi[3] / 255, rgb(sh), sh[3] / 255, f.blurX, f.blurY, f.strength, Math.max(1, f.passes), f.knockout);
      }
      // Flash strength scales the bevel's intensity; Pixi's bevel has no blur, so soften via alpha.
      const k = Math.min(1, f.strength) * (f.blurX > 2 || f.blurY > 2 ? 0.75 : 1);
      return new BevelFilter({
        rotation: (f.angle * 180) / Math.PI,
        thickness: f.distance,
        lightColor: rgb(f.shadow),
        lightAlpha: (f.shadow[3] / 255) * k,
        shadowColor: rgb(f.highlight),
        shadowAlpha: (f.highlight[3] / 255) * k,
      });
    }
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
