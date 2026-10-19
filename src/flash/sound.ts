// flash.media.Sound / SoundChannel / SoundTransform on Web Audio.
import type { Library } from '../swf/Library';
import { SwfClip } from '../swf/display';

let ctx: AudioContext | null = null;
let master: GainNode;
const buffers = new Map<string, AudioBuffer>(); // file -> decoded
let base = 'assets/';

export function audioContext(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.connect(ctx.destination);
  }
  return ctx;
}

/** Must be called from a user gesture (the loader's Play click) to unlock audio. */
export function resumeAudio(): void {
  void audioContext().resume();
}

export function setMasterVolume(v: number): void {
  audioContext();
  master.gain.value = v;
}

export class SoundTransform {
  constructor(
    public volume = 1,
    public pan = 0,
  ) {}
}

export class SoundChannel {
  private src: AudioBufferSourceNode | null;
  private gain: GainNode;
  private _st = new SoundTransform();
  private started: number;
  onComplete: (() => void) | null = null;

  constructor(buffer: AudioBuffer | undefined, startMs: number, loops: number) {
    const ac = audioContext();
    this.gain = ac.createGain();
    this.gain.connect(master);
    this.started = ac.currentTime;
    if (!buffer) {
      this.src = null;
      return;
    }
    const src = ac.createBufferSource();
    src.buffer = buffer;
    if (loops > 1) src.loop = true;
    src.connect(this.gain);
    src.onended = () => {
      this.src = null;
      this.gain.disconnect();
      this.onComplete?.();
    };
    src.start(0, Math.min(buffer.duration, startMs / 1000));
    this.src = src;
  }

  /** Flash copies the transform on assignment. */
  set soundTransform(t: SoundTransform) {
    this._st = new SoundTransform(t.volume, t.pan);
    this.gain.gain.value = Math.max(0, t.volume);
  }
  get soundTransform(): SoundTransform {
    return new SoundTransform(this._st.volume, this._st.pan);
  }

  /** Playback position in ms (approximate for loops). */
  get position(): number {
    return ((audioContext().currentTime - this.started) * 1000) | 0;
  }

  stop(): void {
    if (this.src) {
      this.src.onended = null;
      try {
        this.src.stop();
      } catch {
        /* already stopped */
      }
      this.src = null;
      this.gain.disconnect();
    }
  }
}

/** A linked Sound class from the SWF (S_Fire, M_Theme, V_k1 …). `new S_X().play()` → `S_X.play()`. */
export class SoundAsset {
  constructor(
    readonly name: string,
    readonly file: string,
  ) {}
  play(startTime = 0, loops = 0, transform?: SoundTransform): SoundChannel {
    const ch = new SoundChannel(buffers.get(this.file), startTime, loops);
    if (transform) ch.soundTransform = transform;
    return ch;
  }
  get length(): number {
    return (buffers.get(this.file)?.duration ?? 0) * 1000;
  }
}

const assets = new Map<string, SoundAsset>();

/** Look up a linked sound by AS3 class name. */
export function sound(name: string): SoundAsset {
  const a = assets.get(name);
  if (!a) throw new Error(`no sound class ${name}`);
  return a;
}

/** Decode every sound referenced by the library (≈3.7 MB of MP3). */
export async function loadSounds(lib: Library, assetBase = 'assets/', onProgress?: (done: number, total: number) => void): Promise<void> {
  base = assetBase;
  const ac = audioContext();
  const files = new Set<string>();
  for (const [id, c] of Object.entries(lib.data.characters)) {
    if (c.type === 'sound' && c.file) {
      files.add(c.file);
      const cls = lib.classOf.get(+id);
      if (cls) assets.set(cls, new SoundAsset(cls, c.file));
    } else if (c.type === 'sprite' && c.stream) files.add(c.stream.file);
  }
  let done = 0;
  await Promise.all(
    [...files].map(async (f) => {
      try {
        const data = await (await fetch(`${base}sounds/${f}`)).arrayBuffer();
        buffers.set(f, await ac.decodeAudioData(data));
      } catch (e) {
        console.warn('sound', f, e);
      }
      onProgress?.(++done, files.size);
    }),
  );
}

/** Timeline-embedded audio (StartSound tags and streams), gated by a predicate (SD.sound etc). */
export function installTimelineSound(lib: Library, enabled: () => boolean, volume = 0.9): void {
  const streams = new WeakMap<SwfClip, SoundChannel>();
  SwfClip.sound = {
    event(_clip, s) {
      if (!enabled()) return;
      const c = lib.char(s.id);
      if (c.type !== 'sound' || !c.file) return;
      const ch = new SoundChannel(buffers.get(c.file), 0, s.loops ?? 0);
      ch.soundTransform = new SoundTransform(volume);
    },
    stream(clip, def) {
      if (!enabled()) return;
      streams.get(clip)?.stop();
      const ch = new SoundChannel(buffers.get(def.file), 0, 0);
      ch.soundTransform = new SoundTransform(volume);
      streams.set(clip, ch);
      clip.once('removed', () => ch.stop());
    },
  };
}
