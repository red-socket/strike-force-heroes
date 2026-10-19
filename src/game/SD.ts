// Port of SD.as — settings + save data (SharedObject "SFH_SFFJJRrj4qrjq" → localStorage).
import { trace } from '../flash/as3';
import { SharedObject, navigateToURL, hitTestPoint } from '../flash/runtime';
import type { SwfClip } from '../swf/display';
import { Main } from './Main';

export interface ClassSave {
  skin: number;
  primary: string;
  secondary: string;
  skill: string;
  streak: string;
  level: number;
  exp: number;
  funds: number;
}

const SO_NAME = 'SFH_SFFJJRrj4qrjq';

export class SD {
  static warnQuickmatch = false;
  static warnChallenges = false;
  static sound = true;
  static music = true;
  static voices = true;
  static graphQual = 1;
  static graphPart = 2;
  static graphLights = true;
  static graphGlow = true;
  static screenShake = true;
  static screenBlood = false;
  static blood = 2;
  static selClass = 1;
  /** index 0 is a dummy `0`; 1..4 = Medic, Assassin, Commando, Tank (see Stats_Classes) */
  static classSaves: (ClassSave | 0)[];
  static curCampaign = 1;
  static curChallenge = 1;
  static unlocks: string[];
  /** indices into Stats_Achievements list */
  static achievements: number[];
  static name = 'Player';
  static saveList: string[];

  static Init(): void {
    SD.warnQuickmatch = false;
    SD.warnChallenges = false;
    SD.saveList = ['name', 'selClass', 'sound', 'music', 'voices', 'graphQual', 'graphLights', 'graphGlow', 'graphPart', 'screenShake', 'screenBlood', 'blood', 'curCampaign', 'curChallenge', 'classSaves', 'unlocks', 'achievements'];
    SD.name = 'Player';
    SD.selClass = 1;
    SD.sound = true;
    SD.music = true;
    SD.voices = true;
    SD.graphQual = 1;
    SD.graphLights = true;
    SD.graphGlow = true;
    SD.graphPart = 2;
    SD.screenShake = true;
    SD.screenBlood = false;
    SD.blood = 2;
    SD.curCampaign = 1;
    SD.curChallenge = 1;
    const mk = (primary: string): ClassSave => ({ skin: 1, primary, secondary: 'USP', skill: 'none', streak: 'none', level: 1, exp: 0, funds: 0 });
    SD.classSaves = [0, mk('M4'), mk('Scout'), mk('Saw'), mk('M3')];
    SD.unlocks = ['M4', 'Scout', 'Saw', 'M3', 'USP', 'none'];
    SD.achievements = [];
    if (SD.checkSave()) SD.loadGame();
  }

  /** Typed accessor for classSaves[n] (n >= 1). */
  static cls(n: number): ClassSave {
    return SD.classSaves[n] as ClassSave;
  }

  static eraseGame(): void {
    const so = SharedObject.getLocal(SO_NAME);
    so.data.savedBefore = false;
    so.flush();
    so.close();
  }

  static checkSave(): boolean {
    const so = SharedObject.getLocal(SO_NAME);
    const r = !!so.data.savedBefore;
    so.close();
    return r;
  }

  static saveGame(): void {
    trace('saving game');
    const so = SharedObject.getLocal(SO_NAME);
    for (const k of SD.saveList) so.data[k] = (SD as any)[k];
    so.data.savedBefore = true;
    so.flush();
    so.close();
  }

  static loadGame(): void {
    const so = SharedObject.getLocal(SO_NAME);
    // Like the original, values are copied verbatim (missing keys become undefined).
    for (const k of SD.saveList) (SD as any)[k] = so.data[k];
    so.close();
    trace('[SD]', 'Unlocks', SD.unlocks);
  }

  static setLogos(a: SwfClip, b: SwfClip): void {
    a.gotoAndStop(!Main.ARMORFIRST ? 2 : 1);
    b.gotoAndStop(!Main.ARMORFIRST ? 1 : 2);
  }

  static pressLogos(_from: unknown, a: SwfClip, b: SwfClip, mx: number, my: number): void {
    if (hitTestPoint(a, mx, my)) Main.ARMORFIRST ? SD.urlArmor() : SD.urlNotDoppler();
    if (hitTestPoint(b, mx, my)) Main.ARMORFIRST ? SD.urlNotDoppler() : SD.urlArmor();
  }

  static urlSky9Games(_intro = false): void {
    navigateToURL('http://www.sky9games.com');
  }
  static urlArmor(_intro = false): void {
    navigateToURL('http://armor.ag/MoreGames');
  }
  static urlNotDoppler(_intro = false): void {
    navigateToURL('http://www.notdoppler.com/?ref=strikeforceheroes');
  }
}
