// Dev tool: inspect any SWF symbol through the runtime. URL: /viewer.html#UnitMC or #1413
import { Application, Container, Graphics } from 'pixi.js';
import { Library } from './swf/Library';
import { createCharacter, installSwfMasks, SwfClip } from './swf/display';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

async function main() {
  const lib = await Library.load();
  const app = new Application();
  await app.init({ width: 800, height: 600, background: 0x7f7f7f, antialias: true, resolution: window.devicePixelRatio, autoDensity: true, useBackBuffer: true, preference: 'webgl' });
  installSwfMasks();
  $('stage').appendChild(app.canvas);
  app.ticker.stop();

  const dl = $<HTMLDataListElement>('classes');
  for (const name of Object.keys(lib.data.classes).sort()) {
    const o = document.createElement('option');
    o.value = name;
    dl.appendChild(o);
  }

  const holder = new Container();
  const cross = new Graphics().moveTo(-6, 0).lineTo(6, 0).moveTo(0, -6).lineTo(0, 6).stroke({ color: 0xff00ff, width: 1 });
  app.stage.addChild(holder, cross);

  let current: Container | null = null;
  let paused = false;

  const show = async (sym: string) => {
    if (!sym) return;
    const id = /^\d+$/.test(sym) ? +sym : lib.idOf(sym);
    await lib.preload([id]);
    if (current) {
      current.destroy();
      holder.removeChildren();
    }
    current = createCharacter(lib, id);
    if (current instanceof SwfClip) current.runFrameScript = () => {}; // no game logic in the viewer
    holder.addChild(current);
    const [x, y] = $<HTMLInputElement>('off').value.split(',').map(Number);
    holder.position.set(x, y);
    holder.scale.set(Number($<HTMLInputElement>('zoom').value) || 1);
    cross.position.set(x, y);
    const labels = $('labels');
    labels.innerHTML = '';
    if (current instanceof SwfClip) {
      for (const [name, f] of current.timeline.labels) {
        const b = document.createElement('button');
        b.textContent = `${name} (${f})`;
        b.onclick = () => (current as SwfClip).gotoAndPlay(f);
        labels.appendChild(b);
      }
    }
    const b = current.getLocalBounds();
    $('info').textContent = `id ${id} ${lib.classOf.get(id) ?? ''} ${lib.char(id).type}\nbounds ${b.x.toFixed(1)},${b.y.toFixed(1)} ${b.width.toFixed(1)}x${b.height.toFixed(1)}`;
    history.replaceState(null, '', `#${sym}@${$<HTMLInputElement>('zoom').value}@${$<HTMLInputElement>('off').value}`);
  };

  $<HTMLInputElement>('sym').onchange = (e) => show((e.target as HTMLInputElement).value.trim());
  $<HTMLInputElement>('off').onchange = () => show($<HTMLInputElement>('sym').value.trim());
  $<HTMLInputElement>('zoom').onchange = () => holder.scale.set(Number($<HTMLInputElement>('zoom').value) || 1);
  // Hash form: #Symbol[@zoom[@x,y]]
  const fromHash = () => {
    const [sym, zoom, off] = decodeURIComponent(location.hash.slice(1)).split('@');
    if (zoom) $<HTMLInputElement>('zoom').value = zoom;
    if (off) $<HTMLInputElement>('off').value = off;
    if (sym) $<HTMLInputElement>('sym').value = sym;
    return sym;
  };
  const hSym = fromHash();
  window.addEventListener('hashchange', () => show(fromHash()));
  $('toggle').onclick = () => {
    paused = !paused;
    $('toggle').textContent = paused ? '⏵' : '⏸';
  };
  $('next').onclick = () => current instanceof SwfClip && current.gotoAndStop(current.currentFrame % current.totalFrames + 1);
  $('prev').onclick = () => current instanceof SwfClip && current.gotoAndStop(Math.max(1, current.currentFrame - 1));

  // Fixed 30 Hz like the original.
  let acc = 0;
  let last = performance.now();
  const loop = (now: number) => {
    acc += Math.min(250, now - last);
    last = now;
    let stepped = false;
    while (acc >= 1000 / 30) {
      acc -= 1000 / 30;
      if (!paused) SwfClip.tick(app.stage);
      stepped = true;
    }
    if (stepped) {
      if (current instanceof SwfClip) $('frame').textContent = `${current.currentFrame}/${current.totalFrames} ${current.currentLabel ?? ''}`;
      app.render();
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  const initial = hSym || 'UnitMC';
  $<HTMLInputElement>('sym').value = initial;
  await show(initial);
}

main();
