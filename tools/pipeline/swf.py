"""Minimal SWF parser: character dictionary + display-list timelines.

Only what the runtime needs to replay Flash timelines: character bounds, sprite
frame ops (place/move/remove with matrix, colour transform, name, ratio, clip
depth, filters, blend mode), frame labels, timeline sounds, buttons, edit texts,
morph-shape bounds and symbol-class links. Shape *geometry* is rasterised
separately (ffdec SVG export + rsvg-convert), so shape records are skipped.
"""
import struct

T_END, T_SHOWFRAME, T_DEFINESHAPE, T_PLACEOBJECT, T_REMOVEOBJECT = 0, 1, 2, 4, 5
T_DEFINEBITS, T_DEFINEBUTTON, T_JPEGTABLES, T_SETBG = 6, 7, 8, 9
T_DEFINEFONT, T_DEFINETEXT, T_DOACTION, T_DEFINEFONTINFO = 10, 11, 12, 13
T_DEFINESOUND, T_STARTSOUND, T_SOUNDSTREAMHEAD, T_SOUNDSTREAMBLOCK = 14, 15, 18, 19
T_DEFINEBITSLOSSLESS, T_DEFINEBITSJPEG2, T_DEFINESHAPE2 = 20, 21, 22
T_PLACEOBJECT2, T_REMOVEOBJECT2, T_DEFINESHAPE3, T_DEFINETEXT2 = 26, 28, 32, 33
T_DEFINEBUTTON2, T_DEFINEBITSJPEG3, T_DEFINEBITSLOSSLESS2, T_DEFINEEDITTEXT = 34, 35, 36, 37
T_DEFINESPRITE, T_FRAMELABEL, T_SOUNDSTREAMHEAD2, T_DEFINEMORPHSHAPE = 39, 43, 45, 46
T_DEFINEFONT2, T_PLACEOBJECT3, T_DEFINEFONT3, T_SYMBOLCLASS = 48, 70, 75, 76
T_DEFINESCALINGGRID, T_DEFINESHAPE4, T_DEFINEMORPHSHAPE2 = 78, 83, 84
T_DEFINEFONTNAME, T_STARTSOUND2, T_DEFINEBITSJPEG4 = 88, 89, 90

SHAPE_TAGS = {T_DEFINESHAPE, T_DEFINESHAPE2, T_DEFINESHAPE3, T_DEFINESHAPE4}
BITMAP_TAGS = {T_DEFINEBITS, T_DEFINEBITSJPEG2, T_DEFINEBITSJPEG3, T_DEFINEBITSJPEG4,
               T_DEFINEBITSLOSSLESS, T_DEFINEBITSLOSSLESS2}
TEXT_TAGS = {T_DEFINETEXT, T_DEFINETEXT2}
FONT_TAGS = {T_DEFINEFONT2, T_DEFINEFONT3}

BLEND_MODES = [None, 'normal', 'layer', 'multiply', 'screen', 'lighten', 'darken',
               'difference', 'add', 'subtract', 'invert', 'alpha', 'erase', 'overlay', 'hardlight']


class Reader:
    def __init__(self, data, pos=0):
        self.d = data
        self.pos = pos
        self.bit = 0

    # --- byte-aligned ---
    def align(self):
        if self.bit:
            self.bit = 0
            self.pos += 1

    def u8(self):
        self.align(); v = self.d[self.pos]; self.pos += 1; return v

    def u16(self):
        self.align(); v = struct.unpack_from('<H', self.d, self.pos)[0]; self.pos += 2; return v

    def s16(self):
        self.align(); v = struct.unpack_from('<h', self.d, self.pos)[0]; self.pos += 2; return v

    def u32(self):
        self.align(); v = struct.unpack_from('<I', self.d, self.pos)[0]; self.pos += 4; return v

    def f32(self):
        self.align(); v = struct.unpack_from('<f', self.d, self.pos)[0]; self.pos += 4; return v

    def fixed(self):  # 16.16
        self.align(); v = struct.unpack_from('<i', self.d, self.pos)[0]; self.pos += 4; return v / 65536.0

    def fixed8(self):  # 8.8
        self.align(); v = struct.unpack_from('<h', self.d, self.pos)[0]; self.pos += 2; return v / 256.0

    def string(self):
        self.align()
        e = self.d.index(b'\0', self.pos)
        s = self.d[self.pos:e].decode('utf-8', 'replace')
        self.pos = e + 1
        return s

    def rgba(self):
        return [self.u8(), self.u8(), self.u8(), self.u8()]

    def rgb(self):
        return [self.u8(), self.u8(), self.u8()]

    # --- bit-level ---
    def ub(self, n):
        v = 0
        for _ in range(n):
            v = (v << 1) | ((self.d[self.pos] >> (7 - self.bit)) & 1)
            self.bit += 1
            if self.bit == 8:
                self.bit = 0
                self.pos += 1
        return v

    def sb(self, n):
        if n == 0:
            return 0
        v = self.ub(n)
        return v - (1 << n) if v & (1 << (n - 1)) else v

    def fb(self, n):
        return self.sb(n) / 65536.0

    # --- records ---
    def rect(self):
        self.align()
        n = self.ub(5)
        xmin, xmax, ymin, ymax = (self.sb(n) / 20 for _ in range(4))
        self.align()
        return [xmin, ymin, xmax, ymax]

    def matrix(self):
        """Returns [a, b, c, d, tx, ty] in pixels (Flash/Pixi convention)."""
        self.align()
        a = d = 1.0
        b = c = 0.0
        if self.ub(1):
            n = self.ub(5); a = self.fb(n); d = self.fb(n)
        if self.ub(1):
            n = self.ub(5); b = self.fb(n); c = self.fb(n)
        n = self.ub(5)
        tx = self.sb(n) / 20; ty = self.sb(n) / 20
        self.align()
        return [a, b, c, d, tx, ty]

    def cxform(self, alpha):
        """Returns [rm, gm, bm, am, ra, ga, ba, aa]; multipliers as floats (1 = identity)."""
        self.align()
        has_add = self.ub(1); has_mult = self.ub(1); n = self.ub(4)
        m = [1.0, 1.0, 1.0, 1.0]
        a = [0, 0, 0, 0]
        k = 4 if alpha else 3
        if has_mult:
            m[:k] = [self.sb(n) / 256 for _ in range(k)]
        if has_add:
            a[:k] = [self.sb(n) for _ in range(k)]
        self.align()
        return m + a

    def filters(self):
        out = []
        for _ in range(self.u8()):
            fid = self.u8()
            if fid == 0:  # drop shadow
                f = dict(type='dropShadow', color=self.rgba(), blurX=self.fixed(), blurY=self.fixed(),
                         angle=self.fixed(), distance=self.fixed(), strength=self.fixed8())
                fl = self.u8()
                f.update(inner=bool(fl & 0x80), knockout=bool(fl & 0x40), passes=fl & 0x1f)
            elif fid == 1:
                f = dict(type='blur', blurX=self.fixed(), blurY=self.fixed())
                f['passes'] = self.u8() >> 3
            elif fid == 2:
                f = dict(type='glow', color=self.rgba(), blurX=self.fixed(), blurY=self.fixed(),
                         strength=self.fixed8())
                fl = self.u8()
                f.update(inner=bool(fl & 0x80), knockout=bool(fl & 0x40), passes=fl & 0x1f)
            elif fid == 3:
                f = dict(type='bevel', shadow=self.rgba(), highlight=self.rgba(), blurX=self.fixed(),
                         blurY=self.fixed(), angle=self.fixed(), distance=self.fixed(), strength=self.fixed8())
                fl = self.u8()
                f.update(inner=bool(fl & 0x80), knockout=bool(fl & 0x40), onTop=bool(fl & 0x10), passes=fl & 0x0f)
            elif fid in (4, 7):
                nc = self.u8()
                cols = [self.rgba() for _ in range(nc)]
                ratios = [self.u8() for _ in range(nc)]
                f = dict(type='gradientGlow' if fid == 4 else 'gradientBevel', colors=cols, ratios=ratios,
                         blurX=self.fixed(), blurY=self.fixed(), angle=self.fixed(), distance=self.fixed(),
                         strength=self.fixed8())
                fl = self.u8()
                f.update(inner=bool(fl & 0x80), knockout=bool(fl & 0x40), onTop=bool(fl & 0x10), passes=fl & 0x0f)
            elif fid == 5:
                mx, my = self.u8(), self.u8()
                f = dict(type='convolution', matrixX=mx, matrixY=my, divisor=self.f32(), bias=self.f32())
                f['matrix'] = [self.f32() for _ in range(mx * my)]
                f['color'] = self.rgba()
                f['flags'] = self.u8()
            elif fid == 6:
                f = dict(type='colorMatrix', matrix=[self.f32() for _ in range(20)])
            else:
                raise ValueError(f'unknown filter {fid}')
            out.append(f)
        return out

    def sound_info(self):
        fl = self.u8()
        info = {}
        if fl & 0x20: info['stop'] = True
        if fl & 0x10: info['noMultiple'] = True
        if fl & 0x01: info['inPoint'] = self.u32()
        if fl & 0x02: info['outPoint'] = self.u32()
        if fl & 0x04: info['loops'] = self.u16()
        if fl & 0x08:
            info['envelope'] = [[self.u32(), self.u16(), self.u16()] for _ in range(self.u8())]
        return info


def iter_tags(d, pos, end):
    while pos < end:
        h = struct.unpack_from('<H', d, pos)[0]
        pos += 2
        code, ln = h >> 6, h & 0x3f
        if ln == 0x3f:
            ln = struct.unpack_from('<I', d, pos)[0]
            pos += 4
        yield code, pos, ln
        pos += ln
        if code == T_END:
            break


def parse_place(code, d, pos, ln):
    r = Reader(d, pos)
    op = {'op': 'place'}
    if code == T_PLACEOBJECT:
        op['id'] = r.u16(); op['depth'] = r.u16(); op['matrix'] = r.matrix()
        if r.pos < pos + ln:
            op['cx'] = r.cxform(False)
        return op
    f1 = r.u8()
    f2 = r.u8() if code == T_PLACEOBJECT3 else 0
    op['depth'] = r.u16()
    if f1 & 0x01: op['move'] = True
    if code == T_PLACEOBJECT3 and (f2 & 0x08 or (f2 & 0x10 and f1 & 0x02)):
        op['className'] = r.string()
    if f1 & 0x02: op['id'] = r.u16()
    if f1 & 0x04: op['matrix'] = r.matrix()
    if f1 & 0x08: op['cx'] = r.cxform(True)
    if f1 & 0x10: op['ratio'] = r.u16()
    if f1 & 0x20: op['name'] = r.string()
    if f1 & 0x40: op['clipDepth'] = r.u16()
    if code == T_PLACEOBJECT3:
        if f2 & 0x01: op['filters'] = r.filters()
        if f2 & 0x02: op['blend'] = BLEND_MODES[r.u8()] if True else None
        if f2 & 0x04: op['cacheAsBitmap'] = bool(r.u8())
        if f2 & 0x20: op['visible'] = bool(r.u8())
        if f2 & 0x40: op['bg'] = r.rgba()
    return op


def parse_timeline(d, pos, end, lib, frame_count):
    """Parse control tags into a list of frames; each frame = {ops, label?, sounds?}."""
    frames = []
    cur = {'ops': []}
    stream = None
    for code, p, ln in iter_tags(d, pos, end):
        if code == T_SHOWFRAME:
            frames.append(cur)
            cur = {'ops': []}
        elif code in (T_PLACEOBJECT, T_PLACEOBJECT2, T_PLACEOBJECT3):
            cur['ops'].append(parse_place(code, d, p, ln))
        elif code == T_REMOVEOBJECT:
            cur['ops'].append({'op': 'remove', 'depth': struct.unpack_from('<H', d, p + 2)[0]})
        elif code == T_REMOVEOBJECT2:
            cur['ops'].append({'op': 'remove', 'depth': struct.unpack_from('<H', d, p)[0]})
        elif code == T_FRAMELABEL:
            cur['label'] = Reader(d, p).string()
        elif code in (T_STARTSOUND, T_STARTSOUND2):
            r = Reader(d, p)
            if code == T_STARTSOUND:
                sid = r.u16()
            else:
                sid = r.string()  # class name
            s = {'id': sid}
            s.update(r.sound_info())
            cur.setdefault('sounds', []).append(s)
        elif code in (T_SOUNDSTREAMHEAD, T_SOUNDSTREAMHEAD2):
            if stream is None:
                fmt = d[p + 1]
                stream = {'blocks': 0, 'startFrame': None, 'format': fmt >> 4,
                          'rate': [5512, 11025, 22050, 44100][(fmt >> 2) & 3], 'stereo': bool(fmt & 1),
                          '_data': bytearray()}
        elif code == T_SOUNDSTREAMBLOCK:
            if stream is not None:
                if stream['startFrame'] is None:
                    stream['startFrame'] = len(frames)
                stream['blocks'] += 1
                # MP3 blocks: u16 sampleCount, s16 seekSamples, then raw MP3 frames.
                stream['_data'] += d[p + 4:p + ln] if stream['format'] == 2 else d[p:p + ln]
        elif code == T_END:
            break
        else:
            parse_definition(code, d, p, ln, lib)
    if cur['ops'] or 'label' in cur or 'sounds' in cur:
        frames.append(cur)
    # Pad to declared frame count (trailing empty frames).
    while len(frames) < frame_count:
        frames.append({'ops': []})
    for f in frames:
        if not f['ops']:
            del f['ops']
    return frames, (stream if stream and stream['blocks'] else None)


def parse_definition(code, d, p, ln, lib):
    r = Reader(d, p)
    chars = lib['characters']
    if code in SHAPE_TAGS:
        cid = r.u16()
        chars[cid] = {'type': 'shape', 'bounds': r.rect()}
    elif code in (T_DEFINEMORPHSHAPE, T_DEFINEMORPHSHAPE2):
        cid = r.u16()
        chars[cid] = {'type': 'morph', 'startBounds': r.rect(), 'endBounds': r.rect()}
    elif code in TEXT_TAGS:
        cid = r.u16()
        chars[cid] = {'type': 'text', 'bounds': r.rect(), 'matrix': r.matrix()}
    elif code == T_DEFINEEDITTEXT:
        cid = r.u16()
        c = {'type': 'edittext', 'bounds': r.rect()}
        f1 = r.u8(); f2 = r.u8()
        c['wordWrap'] = bool(f1 & 0x40); c['multiline'] = bool(f1 & 0x20)
        c['password'] = bool(f1 & 0x10); c['readOnly'] = bool(f1 & 0x08)
        c['autoSize'] = bool(f2 & 0x40); c['noSelect'] = bool(f2 & 0x10)
        c['border'] = bool(f2 & 0x08); c['html'] = bool(f2 & 0x02); c['useOutlines'] = bool(f2 & 0x01)
        if f1 & 0x01:
            c['font'] = r.u16(); c['size'] = r.u16() / 20
        if f2 & 0x80:
            c['fontClass'] = r.string()
        if f1 & 0x04:
            c['color'] = r.rgba()
        if f1 & 0x02:
            c['maxLength'] = r.u16()
        if f2 & 0x20:
            c['align'] = ['left', 'right', 'center', 'justify'][r.u8()]
            c['leftMargin'] = r.u16() / 20; c['rightMargin'] = r.u16() / 20
            c['indent'] = r.u16() / 20; c['leading'] = r.s16() / 20
        c['variable'] = r.string()
        if f1 & 0x80:
            c['text'] = r.string()
        chars[cid] = c
    elif code in FONT_TAGS:
        cid = r.u16()
        fl = r.u8()
        r.u8()  # language
        name = r.d[r.pos + 1:r.pos + 1 + r.d[r.pos]].decode('latin-1').rstrip('\0')
        chars[cid] = {'type': 'font', 'name': name, 'bold': bool(fl & 1), 'italic': bool(fl & 2)}
    elif code == T_DEFINEBUTTON2:
        cid = r.u16()
        r.u8()  # flags (track as menu)
        r.u16()  # action offset
        records = []
        while True:
            fl = r.u8()
            if fl == 0:
                break
            rec = {'states': [s for s, bit in (('up', 1), ('over', 2), ('down', 4), ('hit', 8)) if fl & bit],
                   'id': r.u16(), 'depth': r.u16(), 'matrix': r.matrix(), 'cx': r.cxform(True)}
            if fl & 0x10:
                rec['filters'] = r.filters()
            if fl & 0x20:
                rec['blend'] = BLEND_MODES[r.u8()]
            records.append(rec)
        chars[cid] = {'type': 'button', 'records': records}
    elif code in BITMAP_TAGS:
        cid = r.u16()
        chars[cid] = {'type': 'bitmap'}
    elif code == T_DEFINESOUND:
        cid = r.u16()
        fl = r.u8()
        chars[cid] = {'type': 'sound', 'format': fl >> 4, 'rate': [5512, 11025, 22050, 44100][(fl >> 2) & 3],
                      'stereo': bool(fl & 1), 'samples': r.u32()}
    elif code == T_DEFINESPRITE:
        cid = r.u16()
        fc = r.u16()
        frames, stream = parse_timeline(d, r.pos, p + ln, lib, fc)
        c = {'type': 'sprite', 'frameCount': fc, 'frames': frames}
        if stream:
            c['stream'] = stream
        chars[cid] = c
    elif code == T_DEFINESCALINGGRID:
        cid = r.u16()
        lib['scalingGrids'][cid] = r.rect()
    elif code == T_SYMBOLCLASS:
        for _ in range(r.u16()):
            cid = r.u16()
            lib['classes'][r.string()] = cid


def parse_swf(path):
    d = open(path, 'rb').read()
    if d[:3] == b'CWS':
        import zlib
        d = d[:8] + zlib.decompress(d[8:])
    elif d[:3] != b'FWS':
        raise ValueError('unsupported SWF signature')
    r = Reader(d, 8)
    rect = r.rect()
    rate = r.u16() / 256
    count = r.u16()
    lib = {'width': rect[2], 'height': rect[3], 'frameRate': rate, 'characters': {},
           'classes': {}, 'scalingGrids': {}}
    frames, stream = parse_timeline(d, r.pos, len(d), lib, count)
    lib['characters'][0] = {'type': 'sprite', 'frameCount': count, 'frames': frames}
    if stream:
        lib['characters'][0]['stream'] = stream
    return lib
