"""Convert ffdec's SVG export of shapes / static texts into compact vector data for the runtime.

Flash fills are even-odd regions; PixiJS only makes holes through `cut()`, so every fill path is split
into contours and grouped as (outer, [holes]) by containment depth (even depth = outer, odd = hole).

Output per character (None if it uses bitmap fills -> stays rasterised): ordered draw ops
  ["f", paint, [[outer, [hole, ...]], ...]]          even-odd fill
  ["s", d, width, color, alpha, cap, join, miter]    stroke
  paint: [rgb, alpha]  or  {"g": "l"|"r", "m": [a,b,c,d,tx,ty], "s": [[offset, rgb, alpha], ...], "f": focal, "sp": spread}
  d: compact path string "M x y L x y Q cx cy x y Z" (absolute, Flash local coordinates)
"""
import math
import re
import xml.etree.ElementTree as ET

SVG = '{http://www.w3.org/2000/svg}'
XLINK = '{http://www.w3.org/1999/xlink}'
TOK = re.compile(r'[MLQZmlqzHVhvCc]|-?\d*\.?\d+(?:[eE][-+]?\d+)?')


def mat_mul(m1, m2):
    a1, b1, c1, d1, e1, f1 = m1
    a2, b2, c2, d2, e2, f2 = m2
    return [a1 * a2 + c1 * b2, b1 * a2 + d1 * b2, a1 * c2 + c1 * d2, b1 * c2 + d1 * d2,
            a1 * e2 + c1 * f2 + e1, b1 * e2 + d1 * f2 + f1]


IDENT = [1.0, 0.0, 0.0, 1.0, 0.0, 0.0]


def parse_transform(t):
    m = IDENT
    if not t:
        return m
    for name, args in re.findall(r'(\w+)\s*\(([^)]*)\)', t):
        v = [float(x) for x in re.split(r'[\s,]+', args.strip()) if x]
        if name == 'matrix':
            m = mat_mul(m, v)
        elif name == 'translate':
            m = mat_mul(m, [1, 0, 0, 1, v[0], v[1] if len(v) > 1 else 0])
        elif name == 'scale':
            m = mat_mul(m, [v[0], 0, 0, v[1] if len(v) > 1 else v[0], 0, 0])
        elif name == 'rotate':
            r = math.radians(v[0])
            m = mat_mul(m, [math.cos(r), math.sin(r), -math.sin(r), math.cos(r), 0, 0])
        else:
            raise ValueError(f'unsupported transform {name}')
    return m


def parse_d(d, m):
    """SVG path (M/L/Q/Z absolute, as ffdec writes) -> list of contours of commands, transformed by m."""
    toks = TOK.findall(d)
    contours, cur = [], None
    i, cmd = 0, None
    a, b, c, dd, e, f = m

    def tp(x, y):
        return round(a * x + c * y + e, 3), round(b * x + dd * y + f, 3)
    while i < len(toks):
        t = toks[i]
        if t.isalpha():
            if t not in 'MLQZ':
                raise ValueError(f'unsupported path command {t}')
            cmd = t
            i += 1
            if cmd == 'Z':
                if cur:
                    cur.append(['Z'])
            continue
        if cmd == 'M':
            x, y = tp(float(toks[i]), float(toks[i + 1]))
            cur = [['M', x, y]]
            contours.append(cur)
            i += 2
            cmd = 'L'
        elif cmd == 'L':
            x, y = tp(float(toks[i]), float(toks[i + 1]))
            cur.append(['L', x, y])
            i += 2
        elif cmd == 'Q':
            cx, cy = tp(float(toks[i]), float(toks[i + 1]))
            x, y = tp(float(toks[i + 2]), float(toks[i + 3]))
            cur.append(['Q', cx, cy, x, y])
            i += 4
        else:
            raise ValueError('path data without command')
    return contours


def polygon(contour):
    """Flattened points of a contour (quadratics sampled) for containment tests."""
    pts = []
    px = py = 0.0
    for cmd in contour:
        if cmd[0] in 'ML':
            px, py = cmd[1], cmd[2]
            pts.append((px, py))
        elif cmd[0] == 'Q':
            cx, cy, x, y = cmd[1:]
            for k in (0.25, 0.5, 0.75, 1.0):
                u = 1 - k
                pts.append((u * u * px + 2 * u * k * cx + k * k * x, u * u * py + 2 * u * k * cy + k * k * y))
            px, py = x, y
    return pts


def area(pts):
    s = 0.0
    for i in range(len(pts)):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % len(pts)]
        s += x1 * y2 - x2 * y1
    return s / 2


def inside(pt, poly):
    x, y = pt
    c = False
    j = len(poly) - 1
    for i in range(len(poly)):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-12) + xi:
            c = not c
        j = i
    return c


def group_evenodd(contours):
    """[(outer, [holes])] from contours of one even-odd fill."""
    polys = [polygon(c) for c in contours]
    keep = [i for i, p in enumerate(polys) if len(p) >= 3 and abs(area(p)) > 1e-6]
    bbox = {i: (min(x for x, _ in polys[i]), min(y for _, y in polys[i]),
                max(x for x, _ in polys[i]), max(y for _, y in polys[i])) for i in keep}

    def contains(j, i):  # does contour j contain contour i?
        bj, bi = bbox[j], bbox[i]
        if not (bj[0] <= bi[0] + 1e-6 and bj[1] <= bi[1] + 1e-6 and bj[2] >= bi[2] - 1e-6 and bj[3] >= bi[3] - 1e-6):
            return False
        pts = polys[i]
        step = max(1, len(pts) // 7)
        votes = [inside(pts[k], polys[j]) for k in range(0, len(pts), step)]
        return sum(votes) * 2 > len(votes)

    parents = {}
    depth = {}
    for i in keep:
        cont = [j for j in keep if j != i and contains(j, i)]
        depth[i] = len(cont)
        # nearest container = smallest-area one
        parents[i] = min(cont, key=lambda j: abs(area(polys[j])), default=None)
    groups = {}
    order = []
    for i in keep:
        if depth[i] % 2 == 0:
            groups[i] = []
            order.append(i)
    for i in keep:
        if depth[i] % 2 == 1:
            p = parents[i]
            while p is not None and depth[p] % 2 == 1:
                p = parents[p]
            if p is not None:
                groups[p].append(i)
    flat = compact
    return [[flat(contours[o]), [flat(contours[h]) for h in groups[o]]] for o in order]


def num(v):
    r = f'{v:.2f}'.rstrip('0').rstrip('.')
    return '0' if r in ('-0', '') else r


def compact(contour):
    out = []
    for cmd in contour:
        out.append(cmd[0] + ' '.join(num(v) for v in cmd[1:]))
    return ''.join(out)


def hexrgb(s):
    s = s.strip().lstrip('#')
    return int(s, 16)


def gradient(el, m_elem):
    stops = []
    for st in el.findall(SVG + 'stop'):
        stops.append([round(float(st.get('offset', '0')), 4), hexrgb(st.get('stop-color', '#000000')),
                      round(float(st.get('stop-opacity', '1')), 4)])
    gm = parse_transform(el.get('gradientTransform'))
    g = {'g': 'l' if el.tag.endswith('linearGradient') else 'r', 'm': [round(v, 5) for v in mat_mul(m_elem, gm)],
         's': stops, 'sp': el.get('spreadMethod', 'pad')}
    if g['g'] == 'r' and el.get('fx') is not None:
        g['f'] = round(float(el.get('fx')) / 819.2, 4)
    return g


def convert(svg_path):
    tree = ET.parse(svg_path)
    root = tree.getroot()
    ids = {el.get('id'): el for el in root.iter() if el.get('id')}
    if root.find('.//' + SVG + 'image') is not None or root.find('.//' + SVG + 'pattern') is not None:
        return None
    ops = []

    def paint_of(attr, m):
        if attr.startswith('url('):
            ref = ids.get(attr[5:-1])
            if ref is None or ref.tag.endswith('pattern'):
                raise BitmapFill()
            return gradient(ref, m)
        return hexrgb(attr)

    def visit(el, m, inherited):
        tag = el.tag.replace(SVG, '')
        if tag in ('defs', 'linearGradient', 'radialGradient', 'pattern', 'image'):
            return
        attrs = dict(inherited)
        for k in ('fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-linecap',
                  'stroke-linejoin', 'stroke-miterlimit'):
            if el.get(k) is not None:
                attrs[k] = el.get(k)
        m2 = mat_mul(m, parse_transform(el.get('transform')))
        if tag == 'use':
            ref = ids.get((el.get(XLINK + 'href') or '').lstrip('#'))
            if ref is not None:
                visit(ref, m2, attrs)
            return
        if tag == 'path':
            contours = parse_d(el.get('d', ''), m2)
            fill = attrs.get('fill', '#000000')
            if fill != 'none' and contours:
                p = paint_of(fill, m2)
                alpha = round(float(attrs.get('fill-opacity', '1')), 4)
                paint = p if isinstance(p, dict) else [p, alpha]
                if isinstance(p, dict) and alpha != 1:
                    paint['a'] = alpha
                groups = group_evenodd(contours)
                if groups:
                    ops.append(['f', paint, groups])
            stroke = attrs.get('stroke', 'none')
            if stroke != 'none' and contours:
                w = float(attrs.get('stroke-width', '1'))
                sa = float(attrs.get('stroke-opacity', '1'))
                scale = math.sqrt(abs(m2[0] * m2[3] - m2[1] * m2[2])) or 1
                if sa > 0 and not stroke.startswith('url('):
                    ops.append(['s', ''.join(compact(c) for c in contours), round(w * scale, 3), hexrgb(stroke),
                                round(sa, 4), attrs.get('stroke-linecap', 'round'), attrs.get('stroke-linejoin', 'round'),
                                float(attrs.get('stroke-miterlimit', '3'))])
            return
        for ch in el:
            visit(ch, m2, attrs)

    try:
        # The root <g> translates by -bounds.min into the SVG viewport; its children are in Flash space.
        for top in root:
            if top.tag == SVG + 'g':
                for ch in top:
                    visit(ch, IDENT, {})
            elif not top.tag.endswith('defs'):
                visit(top, IDENT, {})
    except BitmapFill:
        return None
    return ops


class BitmapFill(Exception):
    pass
