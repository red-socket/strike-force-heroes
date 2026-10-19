#!/usr/bin/env python3
"""Build runtime assets for the PixiJS re-implementation from the original SWF.

Inputs : original/strike-force-heroes.swf, extracted/assets/{shapes,texts-svg,morphshapes,sounds,fonts}
         (run scripts/extract.sh first)
Outputs: public/assets/
           library.json      characters, timelines, class links, atlas frames
           atlas/page*.png   rasterised shapes + static texts
           sounds/<id>.mp3   event sounds and timeline stream sounds
           fonts/<id>.ttf    embedded fonts

Shapes and static texts are rasterised from ffdec's SVG export with rsvg-convert at SCALE×.
Morph shapes are converted to start/end vector data and interpolated at runtime.
"""
import json, os, re, shutil, subprocess, sys, math
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
import swf

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SWF = os.path.join(ROOT, 'original', 'strike-force-heroes.swf')
EXT = os.path.join(ROOT, 'extracted', 'assets')
OUT = os.path.join(ROOT, 'public', 'assets')
CACHE = os.path.join(ROOT, 'extracted', 'raster-cache')

SCALE_SMALL = 2.0    # raster resolution for small art (units, guns, effects, UI)
SCALE_LARGE = 1.0    # raster resolution for large art (map layers, backdrops)
LARGE = 600          # Flash-pixel size above which art counts as large
MAX_TEX = 4096       # max page / single-image side
PAGE = 2048          # atlas page size
SOLO = 512           # rasterised images bigger than this get their own file
PAD = 2              # transparent gutter between packed images

SVG_NS = '{http://www.w3.org/2000/svg}'
XLINK = '{http://www.w3.org/1999/xlink}'


# ---------------------------------------------------------------- rasterising

def svg_origin(path):
    """ffdec wraps content in <g transform="matrix(1,0,0,1,-xmin,-ymin)">: return (xmin, ymin, w, h)."""
    head = open(path, encoding='utf-8').read(4096)
    w = float(re.search(r'width="([\d.]+)px"', head).group(1))
    h = float(re.search(r'height="([\d.]+)px"', head).group(1))
    m = re.search(r'<g transform="matrix\(([^)]*)\)"', head)
    vals = [float(v) for v in m.group(1).split(',')]
    return -vals[4], -vals[5], w, h


def rasterise(job):
    key, svg_path = job
    xmin, ymin, w, h = svg_origin(svg_path)
    scale = SCALE_LARGE if max(w, h) > LARGE else SCALE_SMALL
    if max(w, h) * scale > MAX_TEX - 2:
        scale = (MAX_TEX - 2) / max(w, h)
    png = os.path.join(CACHE, f'{key}@{scale:g}.png')
    if not os.path.exists(png) or os.path.getmtime(png) < os.path.getmtime(svg_path):
        if w < 0.05 or h < 0.05:
            Image.new('RGBA', (1, 1)).save(png)
        else:
            subprocess.run(['rsvg-convert', '-z', f'{scale:g}', svg_path, '-o', png], check=True)
    return key, png, scale, (xmin, ymin)


def pack(items):
    """Shelf-pack images (sorted tallest first) into PAGE-sized pages. items: [(key, w, h)]."""
    pages = []          # [(w, h)] actual used size
    placed = {}
    order = sorted(items, key=lambda it: (-it[2], -it[1]))
    shelves = []        # per page: list of [y, height, x_cursor]
    for key, w, h in order:
        pw, ph = w + PAD * 2, h + PAD * 2
        done = False
        for pi, page_shelves in enumerate(shelves):
            for sh in page_shelves:
                if ph <= sh[1] and sh[2] + pw <= PAGE:
                    placed[key] = (pi, sh[2] + PAD, sh[0] + PAD)
                    sh[2] += pw
                    done = True
                    break
            if done:
                break
            top = page_shelves[-1][0] + page_shelves[-1][1] if page_shelves else 0
            if top + ph <= PAGE:
                page_shelves.append([top, ph, pw])
                placed[key] = (pi, PAD, top + PAD)
                done = True
                break
        if not done:
            shelves.append([[0, ph, pw]])
            placed[key] = (len(shelves) - 1, PAD, PAD)
    for page_shelves in shelves:
        pages.append((max(s[2] for s in page_shelves),
                      page_shelves[-1][0] + page_shelves[-1][1]))
    return placed, pages


# ---------------------------------------------------------------- morph shapes

NUM_RE = re.compile(r'-?\d+(?:\.\d+)?(?:[eE]-?\d+)?')


def parse_path(d):
    """'M x y L x y x y Q cx cy x y ... Z' -> flat list of ['M',x,y,'L',x,y,'Q',cx,cy,x,y,'Z']."""
    out = []
    cmd = None
    toks = re.findall(r'[MLQZ]|-?\d+(?:\.\d+)?(?:[eE]-?\d+)?', d)
    i = 0
    while i < len(toks):
        t = toks[i]
        if t in 'MLQZ':
            cmd = t
            i += 1
            if cmd == 'Z':
                out.append('Z')
            continue
        n = {'M': 2, 'L': 2, 'Q': 4}[cmd]
        out.append(cmd)
        out.extend(float(v) for v in toks[i:i + n])
        i += n
        if cmd == 'M':
            cmd = 'L'
    return out


def hex_rgb(c):
    c = c.lstrip('#')
    return int(c, 16)


def anim_values(el):
    vals = {}
    for a in el.findall(SVG_NS + 'animate'):
        s, e = a.get('values').split(';')
        vals[a.get('attributeName')] = (s, e)
    return vals


def two(el, anims, name, default, conv):
    if name in anims:
        s, e = anims[name]
        return [conv(s), conv(e)]
    v = el.get(name, default)
    return [conv(v), conv(v)]


def gradient_matrix(g, which):
    """Compose ffdec's animateTransform chain (scale-reset, translate, rotate, scale, skewX) for start/end."""
    m = [1, 0, 0, 1, 0, 0]

    def mul(m1, m2):  # m1 * m2
        a1, b1, c1, d1, e1, f1 = m1
        a2, b2, c2, d2, e2, f2 = m2
        return [a1 * a2 + c1 * b2, b1 * a2 + d1 * b2, a1 * c2 + c1 * d2, b1 * c2 + d1 * d2,
                a1 * e2 + c1 * f2 + e1, b1 * e2 + d1 * f2 + f1]
    for at in g.findall(SVG_NS + 'animateTransform'):
        v = [float(x) for x in at.get(which).split()]
        t = at.get('type')
        if at.get('additive') == 'replace':
            m = [1, 0, 0, 1, 0, 0]
            continue
        if t == 'translate':
            m = mul(m, [1, 0, 0, 1, v[0], v[1] if len(v) > 1 else 0])
        elif t == 'rotate':
            r = math.radians(v[0])
            m = mul(m, [math.cos(r), math.sin(r), -math.sin(r), math.cos(r), 0, 0])
        elif t == 'scale':
            m = mul(m, [v[0], 0, 0, v[1] if len(v) > 1 else v[0], 0, 0])
        elif t == 'skewX':
            m = mul(m, [1, 0, math.tan(math.radians(v[0])), 1, 0, 0])
    return m


def convert_morph(path):
    tree = ET.parse(path)
    root = tree.getroot()
    grads = {}
    for g in root.iter():
        if g.tag in (SVG_NS + 'linearGradient', SVG_NS + 'radialGradient'):
            stops = []
            for st in g.findall(SVG_NS + 'stop'):
                an = anim_values(st)
                stops.append({
                    'offset': two(st, an, 'offset', '0', float),
                    'color': two(st, an, 'stop-color', '#000000', hex_rgb),
                    'alpha': two(st, an, 'stop-opacity', '1', float),
                })
            grads[g.get('id')] = {
                'type': 'linear' if g.tag.endswith('linearGradient') else 'radial',
                'spread': g.get('spreadMethod', 'pad'),
                'matrix': [gradient_matrix(g, 'from'), gradient_matrix(g, 'to')],
                'stops': stops,
            }
    paths = []
    for p in root.iter(SVG_NS + 'path'):
        an = anim_values(p)
        d = an.get('d', (p.get('d'), p.get('d')))
        item = {'d': [parse_path(d[0]), parse_path(d[1])]}
        fill = p.get('fill', 'none')
        if fill.startswith('url('):
            item['fill'] = {'gradient': grads[fill[5:-1]]}
        elif fill != 'none':
            item['fill'] = {'color': two(p, an, 'fill', '#000000', hex_rgb),
                            'alpha': two(p, an, 'fill-opacity', '1', float)}
        stroke = p.get('stroke', 'none')
        if stroke != 'none':
            w = two(p, an, 'stroke-width', '1', float)
            if max(w) > 0:
                item['stroke'] = {'color': two(p, an, 'stroke', '#000000', hex_rgb),
                                  'alpha': two(p, an, 'stroke-opacity', '1', float),
                                  'width': w,
                                  'cap': p.get('stroke-linecap', 'round'),
                                  'join': p.get('stroke-linejoin', 'round')}
        if 'fill' in item or 'stroke' in item:
            if len(item['d'][0]) != len(item['d'][1]):
                raise ValueError(f'{path}: morph path command mismatch')
            paths.append(item)
    return paths


# ---------------------------------------------------------------- main

def rnd(v, n=4):
    if isinstance(v, float):
        r = round(v, n)
        return int(r) if r == int(r) else r
    if isinstance(v, list):
        return [rnd(x, n) for x in v]
    if isinstance(v, dict):
        return {k: rnd(x, n) for k, x in v.items()}
    return v


def main():
    os.makedirs(CACHE, exist_ok=True)
    for sub in ('atlas', 'sounds', 'fonts'):
        shutil.rmtree(os.path.join(OUT, sub), ignore_errors=True)
        os.makedirs(os.path.join(OUT, sub))

    print('parsing swf…')
    lib = swf.parse_swf(SWF)
    chars = lib['characters']

    # --- rasterise shapes and static texts
    jobs = []
    for cid, c in chars.items():
        if c['type'] == 'shape':
            jobs.append((f's{cid}', os.path.join(EXT, 'shapes', f'{cid}.svg')))
        elif c['type'] == 'text':
            jobs.append((f't{cid}', os.path.join(EXT, 'texts-svg', f'{cid}.svg')))
    print(f'rasterising {len(jobs)} svgs…')
    with ThreadPoolExecutor(os.cpu_count()) as ex:
        results = list(ex.map(rasterise, jobs))

    sizes = {}
    meta = {}
    for key, png, scale, origin in results:
        with Image.open(png) as im:
            sizes[key] = im.size
        meta[key] = (png, scale, origin)
    solo = {k for k, (w, h) in sizes.items() if max(w, h) > SOLO}
    placed, pages = pack([(k, w, h) for k, (w, h) in sizes.items() if k not in solo])
    print(f'packing {len(placed)} images into {len(pages)} pages, {len(solo)} standalone…')
    canvases = [Image.new('RGBA', p) for p in pages]
    textures = {}
    for key, (pi, x, y) in placed.items():
        with Image.open(meta[key][0]) as im:
            canvases[pi].paste(im.convert('RGBA'), (x, y))
        chars[int(key[1:])]['tex'] = [f'page{pi}', x, y, *sizes[key]]
    for i, cv in enumerate(canvases):
        cv.save(os.path.join(OUT, 'atlas', f'page{i}.png'), compress_level=6)
        textures[f'page{i}'] = list(cv.size)
    for key in solo:
        shutil.copy(meta[key][0], os.path.join(OUT, 'atlas', f'{key}.png'))
        chars[int(key[1:])]['tex'] = [key, 0, 0, *sizes[key]]
        textures[key] = list(sizes[key])
    for key, (png, scale, origin) in meta.items():
        chars[int(key[1:])]['scale'] = scale
        chars[int(key[1:])]['origin'] = list(origin)
    lib['textures'] = textures

    # --- morph shapes
    print('converting morph shapes…')
    for cid, c in chars.items():
        if c['type'] == 'morph':
            c['paths'] = convert_morph(os.path.join(EXT, 'morphshapes', f'{cid}.svg'))

    # --- sounds
    print('copying sounds…')
    snd_dir = os.path.join(EXT, 'sounds')
    for fn in os.listdir(snd_dir):
        m = re.match(r'(\d+)(?:_.*)?\.(mp3|wav)$', fn)
        if m and int(m.group(1)) in chars:
            shutil.copy(os.path.join(snd_dir, fn), os.path.join(OUT, 'sounds', f'{m.group(1)}.{m.group(2)}'))
            chars[int(m.group(1))]['file'] = f'{m.group(1)}.{m.group(2)}'
    for cid, c in chars.items():
        st = c.get('stream')
        if st:
            data = st.pop('_data')
            if st['format'] != 2:
                raise ValueError(f'stream in {cid} is not mp3')
            fn = f'stream{cid}.mp3'
            open(os.path.join(OUT, 'sounds', fn), 'wb').write(data)
            st['file'] = fn

    # --- fonts
    font_dir = os.path.join(EXT, 'fonts')
    for fn in os.listdir(font_dir):
        m = re.match(r'(\d+)_.*\.ttf$', fn)
        if m and int(m.group(1)) in chars:
            shutil.copy(os.path.join(font_dir, fn), os.path.join(OUT, 'fonts', f'{m.group(1)}.ttf'))
            chars[int(m.group(1))]['file'] = f'{m.group(1)}.ttf'

    # --- collision bitmaps (rendered 1:1 by tools/render_maps.py with ffdec)
    walls_src = os.path.join(ROOT, 'extracted', 'maps', 'walls')
    walls_out = os.path.join(OUT, 'walls')
    shutil.rmtree(walls_out, ignore_errors=True)
    os.makedirs(walls_out)
    if os.path.isdir(walls_src):
        for fn in os.listdir(walls_src):
            if fn.endswith('.png'):
                shutil.copy(os.path.join(walls_src, fn), os.path.join(walls_out, fn))
    else:
        print('WARNING: no wall bitmaps; run tools/render_maps.py first')

    # --- library.json
    lib['characters'] = {str(k): rnd(v) for k, v in sorted(chars.items())}
    lib['scalingGrids'] = {str(k): v for k, v in lib['scalingGrids'].items()}
    with open(os.path.join(OUT, 'library.json'), 'w') as f:
        json.dump(lib, f, separators=(',', ':'))
    print('done:', os.path.getsize(os.path.join(OUT, 'library.json')) // 1024, 'KiB library')


if __name__ == '__main__':
    main()
