#!/usr/bin/env python3
"""Render per-map layers of Strike Force Heroes with ffdec.

Outputs into OUTDIR:
  <label>_wall.png        collision bitmap (wallMC rendered 1:1, world coords = pixel coords)
  <label>_wall_fN.png     extra wall frames (foundry: 2 = lava pour; tut: 1..16 tutorial steps)
  <label>_bg.png          art behind units   (Arena children depth < 753), cropped to wall rect
  <label>_fg.png          art in front of units (depth > 753, includes 'light' overlays)
Usage: render_maps.py SWF SYMBOLS_CSV OUTDIR [--no-art]
"""
import sys, os, struct, subprocess, tempfile, shutil, glob, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from extract_maps import tags, parse_place, load_index, timeline, bounds
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
FFDEC = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ffdec-cli')
WALLS = {'foundry':1261,'train':1308,'train2':1308,'plane':1323,'swamp':1342,'cave':1350,
         'tut':1378,'dropship':1406,'missile':1411}
MARK = (-1500.0, -1500.0)

class BW:
    def __init__(s): s.bits=[]
    def ub(s,v,n): s.bits += [(v>>(n-1-i))&1 for i in range(n)]
    def sb(s,v,n): s.ub(v & ((1<<n)-1), n)
    def bytes(s):
        b=s.bits+[0]*((8-len(s.bits)%8)%8)
        return bytes(int(''.join(map(str,b[i:i+8])),2) for i in range(0,len(b),8))

def matrix_bytes(scale, tx, ty):
    w=BW(); sv=int(scale*65536); n=max(sv.bit_length()+1,2)
    w.ub(1,1); w.ub(n,5); w.sb(sv,n); w.sb(sv,n); w.ub(0,1)
    t=[int(tx*20),int(ty*20)]; n=max(max(abs(v) for v in t).bit_length()+1,2)
    w.ub(n,5); w.sb(t[0],n); w.sb(t[1],n)
    return w.bytes()

def patch(src_bytes, sprites, cls, layer):
    d=src_bytes; start,end,fc=sprites[1413]
    drop=lambda k: k.startswith('Node') or k=='DownArrow'
    body=bytes([0x06])+struct.pack('<HH',16000,1263)+matrix_bytes(0.1,*MARK)
    inner=bytearray(struct.pack('<H',(26<<6)|len(body))+body)
    live={}
    for code,p,ln in tags(d,start,end):
        keep=True
        if code in (26,70):
            r=parse_place(code,d,p); dep=r['depth']
            if 'char' in r and not r['move']:
                ok=not drop(cls.get(r['char'],'')) and r.get('name') not in ('wallMC','waterMC','botCont','midCont')
                live[dep]=ok and ((dep<753) if layer=='bg' else (dep>753))
            keep=live.get(dep,False)
        elif code==28: keep=live.pop(struct.unpack_from('<H',d,p)[0],False)
        elif code==5:  keep=live.pop(struct.unpack_from('<H',d,p+2)[0],False)
        if keep: inner+=struct.pack('<HI',(code<<6)|0x3f,ln)+d[p:p+ln]
    sb=struct.pack('<HH',1413,fc)+bytes(inner)
    hs=start-4-6
    assert struct.unpack_from('<H',d,hs)[0]==(39<<6)|0x3f
    out=bytearray(d[:hs])+struct.pack('<HI',(39<<6)|0x3f,len(sb))+sb+d[end:]
    struct.pack_into('<I',out,4,len(out)); return bytes(out)

def ffdec_sprites(swf, ids, outdir):
    subprocess.run([FFDEC,'-format','sprite:png','-selectid',','.join(map(str,ids)),'-export','sprite',outdir,swf],
                   check=True, stdout=subprocess.DEVNULL)

def frame_png(outdir, cid, n):
    g=glob.glob(os.path.join(outdir,'DefineSprite_%d*'%cid,'%d.png'%n)); return g[0] if g else None

def main(swf, symcsv, out, *flags):
    os.makedirs(out, exist_ok=True)
    d,shapes,sprites=load_index(swf)
    cls={int(a):b.strip().strip('"') for a,b in (l.strip().split(';',1) for l in open(symcsv))}
    fr={f['frame']:f for f in timeline(d,sprites,1413)}
    labels={f['labels'][0]:n for n,f in fr.items() if f['labels'] and 2<=n<=10}
    tmp=tempfile.mkdtemp()
    try:
        ffdec_sprites(swf, sorted(set(WALLS.values())), os.path.join(tmp,'walls'))
        size={}
        for lab,cid in WALLS.items():
            b=bounds(d,shapes,sprites,cid); W,H=int(b[1]-b[0]),int(b[3]-b[2]); size[lab]=(W,H)
            nfr=sprites[cid][2]
            for k in range(1,nfr+1):
                im=Image.open(frame_png(os.path.join(tmp,'walls'),cid,k)).convert('RGBA')
                # ffdec canvas origin == local bounds min (walls have xmin=0; tut ymin=-1.15)
                ox,oy=round(-b[0]),round(-b[2])
                canvas=Image.new('RGBA',(W,H)); canvas.paste(im.crop((ox,oy,ox+W,oy+H)),(0,0))
                canvas.save(os.path.join(out,'%s_wall%s.png'%(lab,'' if k==1 else '_f%d'%k)))
        if '--no-art' not in flags:
            src=open(swf,'rb').read()
            for layer in ('bg','fg'):
                p=os.path.join(tmp,layer+'.swf'); open(p,'wb').write(patch(src,sprites,cls,layer))
                od=os.path.join(tmp,layer); ffdec_sprites(p,[1413],od)
                for lab,n in labels.items():
                    im=Image.open(frame_png(od,1413,n)).convert('RGBA')
                    # locate marker (NodePhysBox scaled 0.1 at MARK) in top-left area
                    bb=im.crop((0,0,400,400)).getbbox()
                    mx,my=(bb[0]+bb[2])/2,(bb[1]+bb[3])/2
                    ox,oy=round(mx-MARK[0]),round(my-MARK[1])
                    W,H=size[lab]
                    im.crop((ox,oy,ox+W,oy+H)).save(os.path.join(out,'%s_%s.png'%(lab,layer)))
                    print(lab,layer,'origin offset in ffdec canvas',ox,oy)
    finally:
        shutil.rmtree(tmp)

if __name__=='__main__':
    main(*sys.argv[1:])
