// Flash blend modes that Pixi only offers as "advanced" (filter-based) blend modes.
//
// Pixi's advanced blend filters (pixi.js/advanced-blend-modes) feed the *premultiplied* source colour into
// the blend function and use the source alpha as the opacity, so any translucent source (a hardlight shape
// with fill alpha 0.8, a lighten glow at alpha 0.5…) comes out too dark. These replacements use the W3C
// separable-blend compositing formula on un-premultiplied colours:
//   co = (1 - Sa)·Dc + (1 - Da)·Sc + Sa·Da·B(Dc/Da, Sc/Sa)      (Sc, Dc premultiplied)
// and are registered under the same names, so both `obj.blendMode = 'hard-light'` and `new HardLightBlend()`
// behave like Flash.
import { BlendModeFilter, extensions, ExtensionType } from 'pixi.js';

const glMain = (fn: string) => `
    vec3 bm_s = front.a > 0.0 ? front.rgb / front.a : vec3(0.0);
    vec3 bm_d = back.a > 0.0 ? back.rgb / back.a : vec3(0.0);
    vec3 bm_c = (1.0 - front.a) * back.rgb + (1.0 - back.a) * front.rgb + front.a * back.a * ${fn}(bm_d, bm_s);
    finalColor = vec4(bm_c, blendedAlpha) * uBlend;
`;
const gpuMain = (fn: string) => `
    var bm_s = vec3<f32>(0.0);
    if (front.a > 0.0) { bm_s = front.rgb / front.a; }
    var bm_d = vec3<f32>(0.0);
    if (back.a > 0.0) { bm_d = back.rgb / back.a; }
    let bm_c = (1.0 - front.a) * back.rgb + (1.0 - back.a) * front.rgb + front.a * back.a * ${fn}(bm_d, bm_s);
    out = vec4<f32>(bm_c, blendedAlpha) * blendUniforms.uBlend;
`;

/** B(base, blend) per channel, GLSL and WGSL. */
const MODES: Record<string, { gl: string; gpu: string }> = {
  'hard-light': {
    gl: `float bm1(float b, float s) { return s <= 0.5 ? 2.0 * b * s : 1.0 - 2.0 * (1.0 - b) * (1.0 - s); }
         vec3 bmBlend(vec3 b, vec3 s) { return vec3(bm1(b.r, s.r), bm1(b.g, s.g), bm1(b.b, s.b)); }`,
    gpu: `fn bm1(b: f32, s: f32) -> f32 { return select(1.0 - 2.0 * (1.0 - b) * (1.0 - s), 2.0 * b * s, s <= 0.5); }
          fn bmBlend(b: vec3<f32>, s: vec3<f32>) -> vec3<f32> { return vec3<f32>(bm1(b.r, s.r), bm1(b.g, s.g), bm1(b.b, s.b)); }`,
  },
  overlay: {
    gl: `float bm1(float b, float s) { return b <= 0.5 ? 2.0 * b * s : 1.0 - 2.0 * (1.0 - b) * (1.0 - s); }
         vec3 bmBlend(vec3 b, vec3 s) { return vec3(bm1(b.r, s.r), bm1(b.g, s.g), bm1(b.b, s.b)); }`,
    gpu: `fn bm1(b: f32, s: f32) -> f32 { return select(1.0 - 2.0 * (1.0 - b) * (1.0 - s), 2.0 * b * s, b <= 0.5); }
          fn bmBlend(b: vec3<f32>, s: vec3<f32>) -> vec3<f32> { return vec3<f32>(bm1(b.r, s.r), bm1(b.g, s.g), bm1(b.b, s.b)); }`,
  },
  difference: {
    gl: `vec3 bmBlend(vec3 b, vec3 s) { return abs(b - s); }`,
    gpu: `fn bmBlend(b: vec3<f32>, s: vec3<f32>) -> vec3<f32> { return abs(b - s); }`,
  },
  lighten: {
    gl: `vec3 bmBlend(vec3 b, vec3 s) { return max(b, s); }`,
    gpu: `fn bmBlend(b: vec3<f32>, s: vec3<f32>) -> vec3<f32> { return max(b, s); }`,
  },
  darken: {
    gl: `vec3 bmBlend(vec3 b, vec3 s) { return min(b, s); }`,
    gpu: `fn bmBlend(b: vec3<f32>, s: vec3<f32>) -> vec3<f32> { return min(b, s); }`,
  },
  subtract: {
    gl: `vec3 bmBlend(vec3 b, vec3 s) { return max(vec3(0.0), b - s); }`,
    gpu: `fn bmBlend(b: vec3<f32>, s: vec3<f32>) -> vec3<f32> { return max(vec3<f32>(0.0), b - s); }`,
  },
};

function makeBlend(name: string): new () => BlendModeFilter {
  const m = MODES[name];
  const cls = class extends BlendModeFilter {
    constructor() {
      super({ gl: { functions: m.gl, main: glMain('bmBlend') }, gpu: { functions: m.gpu, main: gpuMain('bmBlend') } });
    }
  };
  extensions.add({ name, type: ExtensionType.BlendMode, ref: cls });
  return cls;
}

export const HardLightBlend = makeBlend('hard-light');
export const OverlayBlend = makeBlend('overlay');
export const DifferenceBlend = makeBlend('difference');
export const LightenBlend = makeBlend('lighten');
export const DarkenBlend = makeBlend('darken');
export const SubtractBlend = makeBlend('subtract');
