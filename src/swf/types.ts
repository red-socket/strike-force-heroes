// Shape of public/assets/library.json (written by tools/pipeline/build_assets.py).

/** [a, b, c, d, tx, ty] */
export type Mat = [number, number, number, number, number, number];
/** [rMul, gMul, bMul, aMul, rAdd, gAdd, bAdd, aAdd]; multipliers 1 = identity, adds in 0..255 */
export type CX = [number, number, number, number, number, number, number, number];
export type Rect = [number, number, number, number]; // xmin, ymin, xmax, ymax

export interface FlashFilter {
  type: 'dropShadow' | 'blur' | 'glow' | 'bevel' | 'gradientGlow' | 'gradientBevel' | 'convolution' | 'colorMatrix';
  [k: string]: any;
}

export interface PlaceOp {
  op: 'place';
  depth: number;
  id?: number;
  move?: true;
  matrix?: Mat;
  cx?: CX;
  ratio?: number;
  name?: string;
  clipDepth?: number;
  filters?: FlashFilter[];
  blend?: string;
  visible?: boolean;
  className?: string;
  cacheAsBitmap?: boolean;
}
export interface RemoveOp { op: 'remove'; depth: number }
export type FrameOp = PlaceOp | RemoveOp;

export interface SoundStart {
  id: number;
  stop?: true;
  noMultiple?: true;
  loops?: number;
  inPoint?: number;
  outPoint?: number;
}

export interface FrameDef {
  ops?: FrameOp[];
  label?: string;
  sounds?: SoundStart[];
}

interface Rastered { tex: [string, number, number, number, number]; scale: number; origin: [number, number] }

export interface ShapeDef extends Rastered { type: 'shape'; bounds: Rect }
export interface TextDef extends Rastered { type: 'text'; bounds: Rect; matrix: Mat }
export interface SpriteDef {
  type: 'sprite';
  frameCount: number;
  frames: FrameDef[];
  stream?: { startFrame: number; blocks: number; file: string; rate: number };
}
export interface MorphPaint {
  color?: [number, number];
  alpha?: [number, number];
  gradient?: {
    type: 'linear' | 'radial';
    spread: string;
    matrix: [Mat, Mat];
    stops: { offset: [number, number]; color: [number, number]; alpha: [number, number] }[];
  };
}
export interface MorphDef {
  type: 'morph';
  startBounds: Rect;
  endBounds: Rect;
  paths: {
    d: [(string | number)[], (string | number)[]];
    fill?: MorphPaint;
    stroke?: { color: [number, number]; alpha: [number, number]; width: [number, number]; cap: string; join: string };
  }[];
}
export interface EditTextDef {
  type: 'edittext';
  bounds: Rect;
  font?: number;
  fontClass?: string;
  size?: number;
  color?: [number, number, number, number];
  align?: 'left' | 'right' | 'center' | 'justify';
  leftMargin?: number;
  rightMargin?: number;
  indent?: number;
  leading?: number;
  wordWrap: boolean;
  multiline: boolean;
  html: boolean;
  border: boolean;
  autoSize: boolean;
  useOutlines: boolean;
  variable: string;
  text?: string;
  maxLength?: number;
  readOnly: boolean;
}
export interface ButtonRecord {
  states: ('up' | 'over' | 'down' | 'hit')[];
  id: number;
  depth: number;
  matrix: Mat;
  cx: CX;
  filters?: FlashFilter[];
  blend?: string;
}
export interface ButtonDef { type: 'button'; records: ButtonRecord[] }
export interface FontDef { type: 'font'; name: string; bold: boolean; italic: boolean; file?: string }
export interface SoundDef { type: 'sound'; file?: string; rate: number; stereo: boolean; samples: number }
export interface BitmapDef { type: 'bitmap' }

export type CharDef = ShapeDef | TextDef | SpriteDef | MorphDef | EditTextDef | ButtonDef | FontDef | SoundDef | BitmapDef;

export interface LibraryData {
  width: number;
  height: number;
  frameRate: number;
  characters: Record<string, CharDef>;
  classes: Record<string, number>;
  scalingGrids: Record<string, Rect>;
  textures: Record<string, [number, number]>;
}
