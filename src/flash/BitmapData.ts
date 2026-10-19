/**
 * CPU-side ARGB pixel buffer with the BitmapData calls the game uses for collision
 * (getPixel32 / getPixel). Stored unpremultiplied, exactly as Flash returns them.
 */
export class BitmapData {
  readonly width: number;
  readonly height: number;
  /** ARGB packed as uint32 per pixel (0xAARRGGBB) */
  readonly argb: Uint32Array;

  constructor(width: number, height: number, _transparent = true, fill = 0) {
    this.width = Math.max(0, Math.floor(width));
    this.height = Math.max(0, Math.floor(height));
    this.argb = new Uint32Array(this.width * this.height);
    if (fill) this.argb.fill(fill >>> 0);
  }

  /** Flash: out-of-bounds reads return 0. Coordinates are int-coerced (truncated toward zero). */
  getPixel32(x: number, y: number): number {
    const ix = Math.trunc(x);
    const iy = Math.trunc(y);
    if (ix < 0 || iy < 0 || ix >= this.width || iy >= this.height) return 0;
    return this.argb[iy * this.width + ix];
  }

  getPixel(x: number, y: number): number {
    return this.getPixel32(x, y) & 0xffffff;
  }

  setPixel32(x: number, y: number, c: number): void {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || iy < 0 || ix >= this.width || iy >= this.height) return;
    this.argb[iy * this.width + ix] = c >>> 0;
  }

  fillRect(x: number, y: number, w: number, h: number, c: number): void {
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(this.width, Math.floor(x + w));
    const y1 = Math.min(this.height, Math.floor(y + h));
    for (let yy = y0; yy < y1; yy++) this.argb.fill(c >>> 0, yy * this.width + x0, yy * this.width + x1);
  }

  /** Copy all pixels from another bitmap of the same size. */
  copyFrom(src: BitmapData): void {
    this.argb.set(src.argb.subarray(0, this.argb.length));
  }

  /**
   * Load a PNG exactly (no premultiply / colour management), which canvas decoding cannot guarantee.
   * Collision checks depend on exact alpha (== 0xFF) and exact RGB of faint hazard pixels.
   */
  static async loadPNG(url: string): Promise<BitmapData> {
    const buf = new Uint8Array(await (await fetch(url)).arrayBuffer());
    return decodePNG(buf);
  }
}

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate');
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Minimal PNG decoder: 8-bit RGBA/RGB/GA/G, non-interlaced (what PIL writes for our walls). */
async function decodePNG(buf: Uint8Array): Promise<BitmapData> {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let pos = 8;
  let w = 0;
  let h = 0;
  let colorType = 6;
  let depth = 8;
  let palette: Uint8Array | null = null;
  let trns: Uint8Array | null = null;
  const idat: Uint8Array[] = [];
  while (pos < buf.length) {
    const len = dv.getUint32(pos);
    const type = String.fromCharCode(...buf.subarray(pos + 4, pos + 8));
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      w = dv.getUint32(pos + 8);
      h = dv.getUint32(pos + 12);
      depth = buf[pos + 16];
      colorType = buf[pos + 17];
      if (buf[pos + 20] !== 0) throw new Error('interlaced PNG not supported');
    } else if (type === 'PLTE') palette = data;
    else if (type === 'tRNS') trns = data;
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  if (depth !== 8) throw new Error(`PNG bit depth ${depth} not supported`);
  const total = idat.reduce((n, d) => n + d.length, 0);
  const joined = new Uint8Array(total);
  let o = 0;
  for (const d of idat) (joined.set(d, o), (o += d.length));
  const raw = await inflate(joined);
  const bpp = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType]!;
  const stride = w * bpp;
  const out = new BitmapData(w, h);
  let prev = new Uint8Array(stride);
  let cur = new Uint8Array(stride);
  for (let y = 0; y < h; y++) {
    const ft = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0;
      const b = prev[i];
      const c = i >= bpp ? prev[i - bpp] : 0;
      let v = line[i];
      if (ft === 1) v += a;
      else if (ft === 2) v += b;
      else if (ft === 3) v += (a + b) >> 1;
      else if (ft === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[i] = v & 255;
    }
    const row = y * w;
    for (let x = 0; x < w; x++) {
      let r: number, g: number, bl: number, al: number;
      const i = x * bpp;
      if (colorType === 6) [r, g, bl, al] = [cur[i], cur[i + 1], cur[i + 2], cur[i + 3]];
      else if (colorType === 2) [r, g, bl, al] = [cur[i], cur[i + 1], cur[i + 2], 255];
      else if (colorType === 4) [r, g, bl, al] = [cur[i], cur[i], cur[i], cur[i + 1]];
      else if (colorType === 0) [r, g, bl, al] = [cur[i], cur[i], cur[i], 255];
      else {
        const k = cur[i];
        [r, g, bl] = [palette![k * 3], palette![k * 3 + 1], palette![k * 3 + 2]];
        al = trns && k < trns.length ? trns[k] : 255;
      }
      out.argb[row + x] = ((al << 24) | (r << 16) | (g << 8) | bl) >>> 0;
    }
    [prev, cur] = [cur, prev];
  }
  return out;
}
