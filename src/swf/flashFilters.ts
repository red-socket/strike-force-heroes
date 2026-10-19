// Flash-accurate GlowFilter / BevelFilter for Pixi v8 (WebGL).
//
// pixi-filters' GlowFilter is a distance-weighted radial glow and its BevelFilter is an unblurred
// 1-px edge offset, so both look noticeably different from Flash: Flash blurs the source alpha with a
// box filter (blurX × blurY, `quality` passes), multiplies it by `strength`, clamps, and composites
// it (outer: under the object; inner: inside it, masked by the object's alpha). The bevel takes the
// difference of that blurred alpha sampled at ±distance along `angle`: highlight on the side facing
// away from `angle` (default 45° → lit from the top-left), shadow on the other side.
//
// The box blur is done in a single pass with bilinear taps spaced ~2 px apart (each tap averages
// two texels per axis), which is a close approximation of Flash's box for the small sizes used here.
import { Filter, GlProgram } from 'pixi.js';

const VERTEX = `in vec2 aPosition;
out vec2 vTextureCoord;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;
vec4 filterVertexPosition(void) {
  vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
  position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
  position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
  return vec4(position, 0.0, 1.0);
}
vec2 filterTextureCoord(void) { return aPosition * (uOutputFrame.zw * uInputSize.zw); }
void main(void) { gl_Position = filterVertexPosition(); vTextureCoord = filterTextureCoord(); }
`;

/** Number of bilinear taps per axis for a box of total width `blur` px (Flash blurX/Y). */
const taps = (blur: number) => Math.max(1, Math.min(16, Math.ceil(blur / 2)));

/** GLSL for `float boxAlpha(vec2 uv)`: mean alpha over a blurX×blurY box (quality passes widen it). */
function boxFn(blurX: number, blurY: number): string {
  const nx = taps(blurX);
  const ny = taps(blurY);
  const f = (n: number) => n.toFixed(1);
  return `
const float NX = ${f(nx)};
const float NY = ${f(ny)};
float boxAlpha(vec2 uv) {
  vec2 px = vec2(1.0) / uInputSize.xy;
  float sum = 0.0;
  for (float i = 0.0; i < NX; i += 1.0) {
    for (float j = 0.0; j < NY; j += 1.0) {
      vec2 o = vec2((i + 0.5) / NX - 0.5, (j + 0.5) / NY - 0.5) * uBlur;
      sum += texture(uTexture, clamp(uv + o * px, uInputClamp.xy, uInputClamp.zw)).a;
    }
  }
  return sum / (NX * NY);
}
`;
}

const HEADER = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform vec4 uInputClamp;
uniform vec2 uBlur;
`;

const GLOW_FRAG = (blurX: number, blurY: number) => `${HEADER}
uniform vec3 uColor;
uniform float uAlpha;
uniform float uStrength;
uniform float uInner;
uniform float uKnockout;
${boxFn(blurX, blurY)}
void main(void) {
  vec4 src = texture(uTexture, vTextureCoord);
  float a = boxAlpha(vTextureCoord);
  if (uInner > 0.5) {
    float g = clamp((1.0 - a) * uStrength, 0.0, 1.0) * uAlpha * src.a;
    if (uKnockout > 0.5) finalColor = vec4(uColor * g, g);
    else finalColor = vec4(src.rgb * (1.0 - g) + uColor * g, src.a);
  } else {
    float g = clamp(a * uStrength, 0.0, 1.0) * uAlpha;
    vec4 glow = vec4(uColor * g, g);
    if (uKnockout > 0.5) finalColor = glow * (1.0 - src.a);
    else finalColor = src + glow * (1.0 - src.a);
  }
}
`;

const BEVEL_FRAG = (blurX: number, blurY: number) => `${HEADER}
uniform vec2 uOffset;
uniform vec3 uHighlight;
uniform float uHighlightAlpha;
uniform vec3 uShadow;
uniform float uShadowAlpha;
uniform float uStrength;
uniform float uKnockout;
${boxFn(blurX, blurY)}
void main(void) {
  vec2 px = vec2(1.0) / uInputSize.xy;
  vec4 src = texture(uTexture, vTextureCoord);
  float a1 = boxAlpha(vTextureCoord + uOffset * px);
  float a2 = boxAlpha(vTextureCoord - uOffset * px);
  float h = clamp((a1 - a2) * uStrength, 0.0, 1.0) * uHighlightAlpha * src.a;
  float s = clamp((a2 - a1) * uStrength, 0.0, 1.0) * uShadowAlpha * src.a;
  vec3 bev = uHighlight * h + uShadow * s;
  float ba = h + s;
  if (uKnockout > 0.5) finalColor = vec4(bev, ba);
  else finalColor = vec4(src.rgb * (1.0 - ba) + bev, src.a);
}
`;

const programs = new Map<string, GlProgram>();
function program(kind: 'glow' | 'bevel', blurX: number, blurY: number): GlProgram {
  const key = `${kind}|${taps(blurX)}|${taps(blurY)}`;
  let p = programs.get(key);
  if (!p) {
    p = GlProgram.from({ vertex: VERTEX, fragment: (kind === 'glow' ? GLOW_FRAG : BEVEL_FRAG)(blurX, blurY), name: `flash-${kind}` });
    programs.set(key, p);
  }
  return p;
}

const rgb3 = (c: number) => new Float32Array([((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255]);

/** flash.filters.GlowFilter(color, alpha, blurX, blurY, strength, quality, inner, knockout) */
export class FlashGlowFilter extends Filter {
  constructor(color = 0xff0000, alpha = 1, blurX = 6, blurY = 6, strength = 2, quality = 1, inner = false, knockout = false) {
    const q = Math.max(1, quality);
    // Repeated box passes widen the effective kernel by ~sqrt(passes).
    const bx = blurX * Math.sqrt(q);
    const by = blurY * Math.sqrt(q);
    super({
      glProgram: program('glow', bx, by),
      resources: {
        u: {
          uBlur: { value: new Float32Array([bx, by]), type: 'vec2<f32>' },
          uColor: { value: rgb3(color), type: 'vec3<f32>' },
          uAlpha: { value: alpha, type: 'f32' },
          uStrength: { value: strength, type: 'f32' },
          uInner: { value: inner ? 1 : 0, type: 'f32' },
          uKnockout: { value: knockout ? 1 : 0, type: 'f32' },
        },
      },
      padding: Math.ceil(Math.max(bx, by) / 2) + 1,
    });
  }
  get alpha(): number {
    return this.resources.u.uniforms.uAlpha;
  }
  set alpha(v: number) {
    this.resources.u.uniforms.uAlpha = v;
  }
}

/** flash.filters.BevelFilter(distance, angle°, highlightColor, highlightAlpha, shadowColor, shadowAlpha,
 *  blurX, blurY, strength, quality, type="inner", knockout) — only the default "inner" type. */
export class FlashBevelFilter extends Filter {
  constructor(distance = 4, angle = 45, highlightColor = 0xffffff, highlightAlpha = 1, shadowColor = 0, shadowAlpha = 1, blurX = 4, blurY = 4, strength = 1, quality = 1, knockout = false) {
    const q = Math.max(1, quality);
    const bx = blurX * Math.sqrt(q);
    const by = blurY * Math.sqrt(q);
    const r = (angle * Math.PI) / 180;
    const distanceArg = distance;
    super({
      glProgram: program('bevel', bx, by),
      resources: {
        u: {
          uBlur: { value: new Float32Array([bx, by]), type: 'vec2<f32>' },
          uOffset: { value: new Float32Array([Math.cos(r) * distance, Math.sin(r) * distance]), type: 'vec2<f32>' },
          uHighlight: { value: rgb3(highlightColor), type: 'vec3<f32>' },
          uHighlightAlpha: { value: highlightAlpha, type: 'f32' },
          uShadow: { value: rgb3(shadowColor), type: 'vec3<f32>' },
          uShadowAlpha: { value: shadowAlpha, type: 'f32' },
          uStrength: { value: strength, type: 'f32' },
          uKnockout: { value: knockout ? 1 : 0, type: 'f32' },
        },
      },
      padding: Math.ceil(Math.max(bx, by) / 2 + distance) + 1,
    });
    this._distance = distanceArg;
  }
  private _distance = 0;
  /** Re-aim a cached instance (Flash code allocates a new filter per shot; same result). */
  setAngle(angle: number, distance = this._distance): this {
    const r = (angle * Math.PI) / 180;
    const o = this.resources.u.uniforms.uOffset as Float32Array;
    o[0] = Math.cos(r) * distance;
    o[1] = Math.sin(r) * distance;
    return this;
  }
}
