// Native vector rendering of SWF shapes / static text (resolution independent, like Flash/Ruffle).
// Data comes from tools/pipeline/vectors.py: ordered ops of even-odd fills (outer contour + holes,
// drawn with Pixi's fill + cut) and strokes.
import { FillGradient, GraphicsContext, Matrix } from 'pixi.js';

/** Solid [rgb, alpha] or a Flash gradient (matrix maps the ±819.2 gradient square into shape space). */
export type VecPaint =
  | [number, number]
  | { g: 'l' | 'r'; m: number[]; s: [number, number, number][]; sp?: string; f?: number; a?: number };
export type VecOp =
  | ['f', VecPaint, [string, string[]][]]
  | ['s', string, number, number, number, string, string, number];

const TOK = /[MLQZ]|-?\d*\.?\d+(?:e[-+]?\d+)?/g;

function drawPath(g: GraphicsContext, d: string): void {
  const t = d.match(TOK);
  if (!t) return;
  let cmd = 'M';
  for (let i = 0; i < t.length; ) {
    const tok = t[i];
    if (tok === 'M' || tok === 'L' || tok === 'Q' || tok === 'Z') {
      cmd = tok;
      i++;
      if (cmd === 'Z') g.closePath();
      continue;
    }
    if (cmd === 'M') {
      g.moveTo(+t[i], +t[i + 1]);
      i += 2;
      cmd = 'L';
    } else if (cmd === 'L') {
      g.lineTo(+t[i], +t[i + 1]);
      i += 2;
    } else if (cmd === 'Q') {
      g.quadraticCurveTo(+t[i], +t[i + 1], +t[i + 2], +t[i + 3]);
      i += 4;
    } else i++;
  }
}

const rgba = (c: number, a: number) => `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;

/**
 * A Flash gradient: defined in Flash's gradient space (linear: x from -819.2 to 819.2; radial: circle of
 * radius 819.2 at the origin, optional focal point on the x axis) and mapped into shape space by the
 * gradient matrix — exact for scaled, rotated and skewed (elliptical) gradients.
 */
export class FlashGradient extends FillGradient {
  private flashMatrix: Matrix;
  constructor(type: 'linear' | 'radial', m: number[], colorStops: { offset: number; color: string }[], focal = 0) {
    super(
      type === 'linear'
        ? { type: 'linear', start: { x: -819.2, y: 0 }, end: { x: 819.2, y: 0 }, colorStops, textureSpace: 'global' }
        : { type: 'radial', center: { x: focal * 819.2, y: 0 }, innerRadius: 0, outerCenter: { x: 0, y: 0 }, outerRadius: 819.2, colorStops, textureSpace: 'global' },
    );
    this.flashMatrix = new Matrix(m[0], m[1], m[2], m[3], m[4], m[5]);
  }
  override buildGradient(): void {
    super.buildGradient();
    // texture -> gradient space (Pixi) followed by gradient -> shape space (Flash)
    this.transform = this.flashMatrix.clone().append(this.transform);
  }
}

function gradient(p: Exclude<VecPaint, [number, number]>): FillGradient {
  const k = p.a ?? 1;
  const colorStops = p.s.map(([offset, c, a]) => ({ offset: Math.min(1, Math.max(0, offset)), color: rgba(c, a * k) }));
  return new FlashGradient(p.g === 'l' ? 'linear' : 'radial', p.m, colorStops, p.f ?? 0);
}

/** Build a (shareable) GraphicsContext for one character. */
export function buildVector(ops: VecOp[]): GraphicsContext {
  const g = new GraphicsContext();
  for (const op of ops) {
    if (op[0] === 'f') {
      const p = op[1];
      const style = Array.isArray(p) ? { color: p[0], alpha: p[1] } : gradient(p);
      for (const [outer, holes] of op[2]) {
        drawPath(g, outer);
        g.fill(style);
        if (holes.length) {
          for (const h of holes) drawPath(g, h);
          g.cut();
        }
      }
    } else {
      const [, d, width, color, alpha, cap, join, miterLimit] = op;
      drawPath(g, d);
      // Flash draws strokes thinner than a pixel as hairlines; keep them visible.
      g.stroke({ width: Math.max(width, 0.1), color, alpha, cap: cap as any, join: join as any, miterLimit });
    }
  }
  return g;
}

/** True when nothing in the character is visible (every fill/stroke fully transparent). */
export function vectorIsClear(ops: VecOp[]): boolean {
  for (const op of ops) {
    if (op[0] === 's') {
      if (op[4] > 0) return false;
      continue;
    }
    const p = op[1];
    if (Array.isArray(p)) {
      if (p[1] > 0) return false;
    } else if ((p.a ?? 1) > 0 && p.s.some((s) => s[2] > 0)) return false;
  }
  return true;
}
