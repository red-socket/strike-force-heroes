// Crafted save games for side-by-side tests: the same profile for the original (Ruffle) and the port.
//
//   import { makeProfile, refStorageState, portStorageState } from './saves.mjs';
//   const prof = makeProfile((d) => { d.classSaves[1].level = 20; d.classSaves[1].funds = 5000; d.curCampaign = 5; });
//   const ref = await openRef(browser, { storageState: refStorageState(prof) });
//   const prt = await openPort(browser, { storageState: portStorageState(prof) });
//
// With a save present both games start on the menu's home screen instead of "New Profile".
// Ruffle keeps SharedObjects in localStorage as base64 .sol files (AMF3) under
// "<host>/<swf path>/<name>"; the port stores JSON under "so:<name>".
import { BASE, REF_BASE } from './lib.mjs';

export const SO_NAME = 'SFH_SFFJJRrj4qrjq';

/** Default fresh profile (SD.as saveList), optionally modified by `mutate(d)`. */
export function makeProfile(mutate) {
  const cs = (primary) => ({ primary, funds: 0, secondary: 'USP', level: 1, exp: 0, skin: 1, streak: 'none', skill: 'none' });
  const d = {
    graphQual: 1, achievements: [], selClass: 1, graphPart: 2, screenBlood: false, curCampaign: 1, blood: 2, graphGlow: true,
    music: true, classSaves: [0, cs('M4'), cs('Scout'), cs('Saw'), cs('M3')], savedBefore: true,
    unlocks: ['M4', 'Scout', 'Saw', 'M3', 'USP', 'none'], curChallenge: 1, name: 'Player', graphLights: true, voices: true,
    screenShake: true, sound: true,
  };
  mutate?.(d);
  return d;
}

/** Encode a profile as a Flash SharedObject file (.sol, AMF3), base64. */
export function encodeSol(name, data) {
  const out = [];
  const u29 = (v) => {
    v &= 0x1fffffff;
    if (v < 0x80) out.push(v);
    else if (v < 0x4000) out.push((v >> 7) | 0x80, v & 0x7f);
    else if (v < 0x200000) out.push((v >> 14) | 0x80, ((v >> 7) & 0x7f) | 0x80, v & 0x7f);
    else out.push((v >> 22) | 0x80, ((v >> 15) & 0x7f) | 0x80, ((v >> 8) & 0x7f) | 0x80, v & 0xff);
  };
  const str = (s) => {
    const b = Buffer.from(s, 'utf8');
    u29((b.length << 1) | 1);
    out.push(...b);
  };
  const val = (v) => {
    if (v === undefined) out.push(0);
    else if (v === null) out.push(1);
    else if (v === false) out.push(2);
    else if (v === true) out.push(3);
    else if (typeof v === 'number') {
      if (Number.isInteger(v) && v >= -(1 << 28) && v < 1 << 28) (out.push(4), u29(v));
      else {
        const b = Buffer.alloc(8);
        b.writeDoubleBE(v);
        out.push(5, ...b);
      }
    } else if (typeof v === 'string') (out.push(6), str(v));
    else if (Array.isArray(v)) {
      out.push(9);
      u29((v.length << 1) | 1);
      out.push(1); // no associative part
      for (const x of v) val(x);
    } else {
      out.push(10, 0x0b, 1); // dynamic anonymous object
      for (const [k, x] of Object.entries(v)) (str(k), val(x));
      out.push(1);
    }
  };
  for (const [k, v] of Object.entries(data)) (str(k), val(v), out.push(0));
  const nb = Buffer.from(name, 'utf8');
  const body = Buffer.concat([Buffer.from('TCSO'), Buffer.from([0, 4, 0, 0, 0, 0, nb.length >> 8, nb.length & 255]), nb, Buffer.from([0, 0, 0, 3]), Buffer.from(out)]);
  const hdr = Buffer.alloc(6);
  hdr.writeUInt16BE(0x00bf);
  hdr.writeUInt32BE(body.length, 2);
  return Buffer.concat([hdr, body]).toString('base64');
}

const state = (origin, name, value) => ({ cookies: [], origins: [{ origin, localStorage: [{ name, value }] }] });

/** Playwright storageState for openRef(): the profile as Ruffle's localStorage SharedObject. */
export function refStorageState(profile, refBase = REF_BASE) {
  const u = new URL(refBase);
  return state(u.origin, `${u.hostname}/original/strike-force-heroes.swf/${SO_NAME}`, encodeSol(SO_NAME, profile));
}

/** Playwright storageState for openPort(): the profile as the port's JSON save. */
export function portStorageState(profile, base = BASE) {
  return state(new URL(base).origin, `so:${SO_NAME}`, JSON.stringify(profile));
}
