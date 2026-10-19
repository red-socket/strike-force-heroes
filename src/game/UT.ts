// Port of UT.as — misc math/string utilities. Angles are in degrees like the original.
import { Point, int, uint } from '../flash/as3';

export class UT {
  static rotateDirection(a: number, b: number): number {
    return UT.fixRotation(b - a) <= 0 ? -1 : 1;
  }

  static fixRotation(r: number): number {
    if (r > 180) r -= 360;
    if (r < -180) r += 360;
    return r;
  }

  static fixRotation360(r: number): number {
    if (r > 360) r -= 360;
    if (r < 0) r += 360;
    return r;
  }

  static rotateDistance(a: number, b: number): number {
    return UT.fixRotation(b - a);
  }

  static getDist(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /** Angle in degrees from (x2,y2) towards (x1,y1); 0 = up, 90 = right (Flash rotation convention). */
  static getRotation(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x1 - x2;
    const dy = y1 - y2;
    const d = Math.sqrt(dx * dx + dy * dy);
    const a = dy >= 0 ? Math.acos(dx / d) : Math.PI * 2 - Math.acos(dx / d);
    return UT.fixRotation((a * 180) / Math.PI - 90);
  }

  static randLinePoint(x1: number, y1: number, x2: number, y2: number): Point {
    const p = new Point();
    p.x = UT.rand(x1, x2);
    p.y = y1 + ((p.x - x1) / (x2 - x1)) * (y2 - y1);
    return p;
  }

  static rand(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  static irand(min: number, max: number): number {
    return int(uint(Math.random() * (max - min + 1)) + min);
  }

  static getOrdinal(n: number): string {
    let s: string;
    if (!(n % 100 > 10 && n % 100 < 14)) {
      switch (n % 10) {
        case 1:
          s = 'st';
          break;
        case 2:
          s = 'nd';
          break;
        case 3:
          s = 'rd';
          break;
        default:
          s = 'th';
      }
    } else s = 'th';
    return n + s;
  }

  static fixFloat(n: number): number {
    return int(Math.round(n * 10)) / 10;
  }

  static getRatio(a: number, b: number): string {
    let r = 'UT Error';
    if ((!a && !b) || a == b) r = '1 : 1';
    else if (!(!!a && !b)) {
      if (!a && !!b) r = '0 : ' + b;
      else if (a <= b) {
        if (b > a) r = '1 : ' + Math.round((b / a) * 100) / 100;
      } else r = Math.round((a / b) * 100) / 100 + ' : 1';
    } else r = a + ' : 0';
    return r;
  }

  static inBox(px: number, py: number, x: number, y: number, w: number, h: number): boolean {
    return px > Math.min(x, x + w) && px < Math.max(x, x + w) && py > Math.min(y, y + h) && py < Math.max(y, y + h);
  }

  static xMoveToRot(rot: number, speed: number): number {
    return rot == 0 || rot == 180 || rot == -180 ? 0 : Math.sin(rot * (Math.PI / 180)) * speed;
  }

  static yMoveToRot(rot: number, speed: number): number {
    return !(rot == 90 || rot == -90) ? Math.cos(rot * (Math.PI / 180)) * -speed : 0;
  }

  static randEl<T>(ar: T[]): T {
    return ar[uint(Math.random() * ar.length)];
  }

  static getPosNegSign(n: number): number {
    return n < 0 ? -1 : 1;
  }

  /** Original inserted newlines using TextField line metrics; Pixi Text wraps on its own. */
  static wordWrap(s: string, _field?: unknown): string {
    return s;
  }

  static rotBounceOff(rot: number, x1: number, y1: number, x2: number, y2: number): number {
    const r = UT.getRotation(x1, y1, x2, y2);
    const d = UT.fixRotation(rot - r);
    return UT.fixRotation(rot - d + 180);
  }

  static getSideFacing(rot: number): string {
    rot = UT.fixRotation(rot);
    if (rot >= -45 && rot <= 45) return 'up';
    if (rot >= -135 && rot <= -45) return 'left';
    if (rot <= 135 && rot >= 45) return 'right';
    return 'down';
  }

  static getTimeString(frames: number, pad: boolean): string {
    const s = uint((frames / 30) % 60);
    const m = uint(frames / 30 / 60);
    return (pad && m < 10 ? '0' + m : m) + ':' + (s >= 10 ? s : '0' + s);
  }

  static replaceString(s: string, find: string, rep = ''): string {
    while (s.indexOf(find) != -1) s = s.replace(find, rep);
    return s;
  }

  static mergeObject(into: Record<string, any>, from: Record<string, any>): void {
    for (const k in from) into[k] = from[k];
  }

  static cloneObject<T extends Record<string, any>>(o: T): T {
    const c: Record<string, any> = {};
    for (const k in o) c[k] = o[k];
    return c as T;
  }

  static addNumCommas(n: number): string {
    let s = '' + uint(n);
    let i = s.length;
    for (let j = 0; j < s.length; j += 3) {
      if (i < s.length && i > 0) s = s.substring(0, i) + ',' + s.substring(i);
      i -= 3;
    }
    return s;
  }

  static getEl<T>(i: number, ar: T[]): T {
    return ar[i];
  }

  static getNextEl<T>(cur: T, forward: boolean, ar: T[]): T {
    let i = ar.indexOf(cur);
    i += !forward ? -1 : 1;
    if (i == ar.length) i = 0;
    if (i < 0) i = ar.length - 1;
    return ar[i];
  }

  static roundToDecimal(n: number, places: number): number {
    const p = uint(Math.pow(10, places));
    return Math.round(n * p) / p;
  }

  static getPythagorean(a: number, b: number): number {
    return Math.sqrt(a * a + b * b);
  }

  static coinFlip<A, B>(a: A, b: B): A | B {
    return Math.random() >= 0.5 ? b : a;
  }
}
