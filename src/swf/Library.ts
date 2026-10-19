import { Assets, Rectangle, Texture, TextureSource } from 'pixi.js';
import type { CharDef, LibraryData, SpriteDef } from './types';

/** Character dictionary + lazily loaded textures for the converted SWF. */
export class Library {
  readonly data: LibraryData;
  readonly base: string;
  private pages = new Map<string, Texture>();
  private loading = new Map<string, Promise<Texture>>();
  private static placeholder = new TextureSource({ width: 1, height: 1, label: 'swf-placeholder' });
  private frames = new Map<number, Texture>();
  private closures = new Map<string, Set<number>>();
  /** id -> class name (inverse of data.classes) */
  readonly classOf = new Map<number, string>();

  private constructor(data: LibraryData, base: string) {
    this.data = data;
    this.base = base;
    for (const [name, id] of Object.entries(data.classes)) this.classOf.set(id, name);
  }

  static async load(base = 'assets/'): Promise<Library> {
    const data = (await (await fetch(base + 'library.json')).json()) as LibraryData;
    const lib = new Library(data, base);
    await lib.loadFonts();
    return lib;
  }

  char(id: number): CharDef {
    const c = this.data.characters[id];
    if (!c) throw new Error(`no character ${id}`);
    return c;
  }

  sprite(id: number): SpriteDef {
    const c = this.char(id);
    if (c.type !== 'sprite') throw new Error(`character ${id} is ${c.type}, not a sprite`);
    return c;
  }

  idOf(classOrId: string | number): number {
    if (typeof classOrId === 'number') return classOrId;
    const id = this.data.classes[classOrId];
    if (id === undefined) throw new Error(`no class ${classOrId}`);
    return id;
  }

  fontFamily(fontId: number): string {
    return `swf${fontId}`;
  }

  private async loadFonts(): Promise<void> {
    const loads: Promise<unknown>[] = [];
    for (const [id, c] of Object.entries(this.data.characters)) {
      if (c.type !== 'font' || !c.file) continue;
      const face = new FontFace(this.fontFamily(+id), `url(${this.base}fonts/${c.file})`);
      document.fonts.add(face);
      loads.push(face.load().catch((e) => console.warn('font', id, c.name, e)));
    }
    await Promise.all(loads);
  }

  /** All character ids reachable from `id` (optionally only from a frame range of a sprite). */
  closure(id: number, fromFrame = 1, toFrame = Infinity): Set<number> {
    const key = `${id}:${fromFrame}:${toFrame}`;
    let set = this.closures.get(key);
    if (set) return set;
    set = new Set<number>();
    const visit = (cid: number, from = 1, to = Infinity) => {
      if (set!.has(cid) && from === 1 && to === Infinity) return;
      set!.add(cid);
      const c = this.data.characters[cid];
      if (!c) return;
      if (c.type === 'sprite') {
        const end = Math.min(to, c.frames.length);
        for (let f = from; f <= end; f++) {
          for (const op of c.frames[f - 1].ops ?? []) if (op.op === 'place' && op.id !== undefined) visit(op.id);
        }
      } else if (c.type === 'button') {
        for (const r of c.records) visit(r.id);
      }
    };
    if (fromFrame > 1) {
      // Objects placed before fromFrame may still be on stage: include the whole prefix's placements too.
      visit(id, 1, toFrame);
    } else visit(id, fromFrame, toFrame);
    this.closures.set(key, set);
    return set;
  }

  /** Ensure every texture page used by the given characters (and their children) is loaded. */
  async preload(ids: Iterable<number>): Promise<void> {
    const pages = new Set<string>();
    for (const root of ids) {
      for (const cid of this.closure(root)) {
        const c = this.data.characters[cid];
        if (c && (c.type === 'shape' || c.type === 'text') && !this.pages.has(c.tex[0])) pages.add(c.tex[0]);
      }
    }
    await Promise.all([...pages].map((p) => this.loadPage(p)));
  }

  /** Wait for every page load started so far (including lazy ones). */
  async idle(): Promise<void> {
    await Promise.all(this.loading.values());
  }

  private loadPage(p: string): Promise<Texture> {
    let pr = this.loading.get(p);
    if (!pr) {
      pr = Assets.load<Texture>({ alias: p, src: `${this.base}atlas/${p}.png` }).then((tex) => {
        tex.source.scaleMode = 'linear';
        tex.source.autoGenerateMipmaps = false;
        this.pages.set(p, tex);
        return tex;
      });
      this.loading.set(p, pr);
    }
    return pr;
  }

  /**
   * Texture for a rasterised shape/text character. If its page is not loaded yet, returns a
   * correctly-sized placeholder that fills in when the page arrives (preload to avoid pop-in).
   */
  texture(id: number): Texture {
    let t = this.frames.get(id);
    if (t) return t;
    const c = this.char(id);
    if (c.type !== 'shape' && c.type !== 'text') throw new Error(`character ${id} has no texture`);
    const [page, x, y, w, h] = c.tex;
    const src = this.pages.get(page);
    if (src) {
      t = new Texture({ source: src.source, frame: new Rectangle(x, y, w, h) });
    } else {
      const tex = new Texture({
        source: Library.placeholder,
        frame: new Rectangle(0, 0, 1, 1),
        orig: new Rectangle(0, 0, w, h),
        dynamic: true,
      });
      t = tex;
      void this.loadPage(page).then((pg) => {
        tex.source = pg.source;
        tex.frame.copyFrom(new Rectangle(x, y, w, h));
        tex.updateUvs();
        tex.update();
      });
    }
    this.frames.set(id, t);
    return t;
  }

  /** Preload by AS3 class names (screens call this before being shown). */
  preloadClasses(names: string[]): Promise<void> {
    return this.preload(names.filter((n) => n in this.data.classes).map((n) => this.data.classes[n]));
  }
}
