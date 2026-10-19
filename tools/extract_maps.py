#!/usr/bin/env python3
"""Extract Strike Force Heroes map data from the SWF.

Parses DefineSprite 1413 (class `Arena`) whose frames 2..10 (labels foundry, train,
train2, plane, swamp, cave, tut, dropship, missile) each hold one level built from
placed MovieClips (NodeWaypoint / NodeSpawn / NodeAiAction / NodePhysBox / NodePickup /
NodeHoldpoint / NodeCtfFlag, the invisible collision clip `wallMC`, optional `waterMC`,
plus art).  Instance names encode node parameters (e.g. "k_lefgh" = waypoint k linked to l,e,f,g,h).

Usage: extract_maps.py <swf> <symbols.csv> <out.json>
Pure python, no deps.  Wall bitmaps: render with ffdec, e.g.
  ffdec-cli -format sprite:png -selectid 1261,1308,1323,1342,1350,1378,1406,1411 -export sprite OUT SWF
"""
import struct, sys, json, math, zlib

class Bits:
    def __init__(s, data, pos=0): s.d=data; s.byte=pos; s.bit=0
    def ub(s,n):
        v=0
        for _ in range(n):
            v=(v<<1)|((s.d[s.byte]>>(7-s.bit))&1); s.bit+=1
            if s.bit==8: s.bit=0; s.byte+=1
        return v
    def sb(s,n):
        if n==0: return 0
        v=s.ub(n)
        return v-(1<<n) if v&(1<<(n-1)) else v
    def fb(s,n): return s.sb(n)/65536.0
    def align(s):
        if s.bit: s.bit=0; s.byte+=1

def read_rect(d,pos):
    b=Bits(d,pos); n=b.ub(5); v=[b.sb(n)/20 for _ in range(4)]; b.align()
    return (v[0],v[1],v[2],v[3]), b.byte          # xmin,xmax,ymin,ymax

def read_matrix(d,pos):
    b=Bits(d,pos); a=dd=1.0; bb=c=0.0
    if b.ub(1): n=b.ub(5); a=b.fb(n); dd=b.fb(n)
    if b.ub(1): n=b.ub(5); bb=b.fb(n); c=b.fb(n)
    n=b.ub(5); tx=b.sb(n); ty=b.sb(n); b.align()
    return dict(a=a,b=bb,c=c,d=dd,tx=tx/20,ty=ty/20), b.byte

def read_cx(d,pos):
    b=Bits(d,pos); ha=b.ub(1); hm=b.ub(1); n=b.ub(4)
    if hm: [b.sb(n) for _ in range(4)]
    if ha: [b.sb(n) for _ in range(4)]
    b.align(); return b.byte

def read_str(d,pos):
    e=d.index(b'\0',pos); return d[pos:e].decode('utf-8','replace'), e+1

def tags(d,pos,end):
    while pos<end:
        h=struct.unpack_from('<H',d,pos)[0]; pos+=2
        code=h>>6; ln=h&0x3f
        if ln==0x3f: ln=struct.unpack_from('<I',d,pos)[0]; pos+=4
        yield code,pos,ln
        pos+=ln
        if code==0: break

def parse_place(code,d,p):
    r={}
    f=d[p]; p+=1
    f2=0
    if code==70: f2=d[p]; p+=1
    r['depth']=struct.unpack_from('<H',d,p)[0]; p+=2
    r['move']=bool(f&1)
    if code==70 and ((f2&8) or ((f2&16) and (f&2))): r['className'],p=read_str(d,p)
    if f&2: r['char']=struct.unpack_from('<H',d,p)[0]; p+=2
    if f&4: r['matrix'],p=read_matrix(d,p)
    if f&8: p=read_cx(d,p)
    if f&16: p+=2
    if f&32: r['name'],p=read_str(d,p)
    if f&64: r['clipdepth']=struct.unpack_from('<H',d,p)[0]
    return r

def load_index(path):
    d=open(path,'rb').read()
    if d[:3]==b'CWS': d=d[:8]+zlib.decompress(d[8:])
    _,pos=read_rect(d,8); pos+=4
    shapes={}; sprites={}
    for code,p,ln in tags(d,pos,len(d)):
        if code in (2,22,32,83,46,84,11,33,37):
            shapes[struct.unpack_from('<H',d,p)[0]]=read_rect(d,p+2)[0]
        elif code==39:
            cid,fc=struct.unpack_from('<HH',d,p); sprites[cid]=(p+4,p+ln,fc)
    return d,shapes,sprites

def timeline(d,sprites,cid):
    start,end,fc=sprites[cid]; frames=[]; disp={}; labels=[]; frame=1
    for code,p,ln in tags(d,start,end):
        if code in (26,70):
            r=parse_place(code,d,p); dep=r['depth']
            if r['move'] and dep in disp:
                nd=dict(disp[dep]); nd.update({k:v for k,v in r.items() if k!='move'}); disp[dep]=nd
            else:
                disp[dep]={k:v for k,v in r.items() if k!='move'}
        elif code==28: disp.pop(struct.unpack_from('<H',d,p)[0],None)
        elif code==5:  disp.pop(struct.unpack_from('<H',d,p+2)[0],None)
        elif code==43: labels.append(read_str(d,p)[0])
        elif code==1:
            frames.append(dict(frame=frame,labels=labels,display={k:dict(v) for k,v in disp.items()}))
            labels=[]; frame+=1
    return frames

_bc={}
def bounds(d,shapes,sprites,cid):
    if cid in shapes: return shapes[cid]
    if cid in _bc: return _bc[cid]
    if cid not in sprites: return None
    fr=timeline(d,sprites,cid); xs=[];ys=[]
    for o in (fr[0]['display'].values() if fr else []):
        if 'char' not in o or 'clipdepth' in o: continue
        b=bounds(d,shapes,sprites,o['char'])
        if not b: continue
        m=o.get('matrix',dict(a=1,b=0,c=0,d=1,tx=0,ty=0))
        for x in b[:2]:
            for y in b[2:]:
                xs.append(m['a']*x+m['c']*y+m['tx']); ys.append(m['b']*x+m['d']*y+m['ty'])
    r=(min(xs),max(xs),min(ys),max(ys)) if xs else None
    _bc[cid]=r; return r

def decompose(m):
    sx=math.hypot(m['a'],m['b']); sy=math.hypot(m['c'],m['d'])
    rot=math.degrees(math.atan2(m['b'],m['a']))
    return sx,sy,rot

R=lambda v,n=1: round(v,n)

def main(swf,symcsv,out):
    d,shapes,sprites=load_index(swf)
    cls={}
    for line in open(symcsv):
        a,b=line.strip().split(';',1); cls[int(a)]=b.strip('"')
    frames=timeline(d,sprites,1413)
    maps={}
    for f in frames:
        if not f['labels'] or f['frame']<2 or f['frame']>10: continue
        label=f['labels'][0]
        M=dict(frame=f['frame'],label=label,waypoints=[],spawns=[],aiActions=[],physBoxes=[],
               pickups=[],holdpoints=[],ctfFlags=[],lights=[],downArrows=[],namedClips=[],
               art=dict(background=[],foreground=[]))
        ident=dict(a=1,b=0,c=0,d=1,tx=0,ty=0)
        for dep in sorted(f['display']):
            o=f['display'][dep]; c=o.get('char'); m=o.get('matrix',ident)
            name=o.get('name'); k=cls.get(c,'')
            x,y=R(m['tx'],2),R(m['ty'],2); sx,sy,rot=decompose(m)
            if k=='NodeWaypoint':
                wid,con=name.split('_')[:2]
                M['waypoints'].append(dict(id=wid,x=x,y=y,connects=list(con),depth=dep))
            elif k=='NodeSpawn':
                p=name.split('_'); M['spawns'].append(dict(waypoint=p[0],team=int(p[1]) if p[1] else 0,x=x,y=y))
            elif k=='NodeAiAction':
                p=name.split('_'); b=bounds(d,shapes,sprites,c)
                M['aiActions'].append(dict(action=p[0],waypoints=list(p[1]),
                    rect=[x,y,R((b[1]-b[0])*sx,2),R((b[3]-b[2])*sy,2)],name=name))
            elif k=='NodePhysBox':
                b=bounds(d,shapes,sprites,c)
                M['physBoxes'].append(dict(cx=x,cy=y,w=R((b[1]-b[0])*sx,2),h=R((b[3]-b[2])*sy,2),rotation=R(rot,2)))
            elif k=='NodePickup':
                p=name.split('_'); M['pickups'].append(dict(type=p[0],respawnSec=int(p[1]),x=x,y=y,rotation=R(rot,2)))
            elif k=='NodeHoldpoint':
                M['holdpoints'].append(dict(x=x,y=y))
            elif k=='NodeCtfFlag':
                p=name.split('__'); M['ctfFlags'].append(dict(waypoint=p[0],team=int(p[1]),x=x,y=y))
            elif k=='DownArrow':
                M['downArrows'].append(dict(name=name,x=x,y=y,rotation=R(rot,2)))
            elif name=='light':
                M['lights'].append(dict(char=c,depth=dep,matrix={kk:R(v,4) for kk,v in m.items()}))
            elif name in ('wallMC','waterMC','door','elevator'):
                b=bounds(d,shapes,sprites,c)
                ent=dict(name=name,char=c,cls=k or None,depth=dep,x=x,y=y,scaleX=R(sx,4),scaleY=R(sy,4),rotation=R(rot,3),
                         localBounds=[R(v,2) for v in b] if b else None,frames=sprites[c][2] if c in sprites else 1)
                if name=='waterMC':
                    ent['rect']=[x,y,R((b[1]-b[0])*sx,2),R((b[3]-b[2])*sy,2)]
                if name=='wallMC':
                    ent['bitmapSize']=[int(b[1]-b[0]) if b[0]>=0 else int(b[1]-b[0]), int(b[3]-b[2])]
                    M['wall']=ent
                M['namedClips'].append(ent)
            elif name in ('botCont','midCont'):
                pass
            else:
                M['art']['background' if dep<753 else 'foreground'].append(
                    dict(depth=dep,char=c,cls=k or None,type='shape' if c in shapes else 'sprite',
                         matrix={kk:R(v,4) for kk,v in m.items()}))
        hp=sorted(M['holdpoints'],key=lambda h:h['x'])
        for i,h in enumerate(hp): h['letter']='ABCDE'[i] if i<5 else None
        M['holdpoints']=hp
        maps[label]=M
    json.dump(maps,open(out,'w'),indent=1)
    for k,M in maps.items():
        print(k,'frame',M['frame'],'wall',M['wall']['char'],M['wall']['localBounds'],
              {kk:len(v) for kk,v in M.items() if isinstance(v,list)})

if __name__=='__main__':
    main(*sys.argv[1:4])
