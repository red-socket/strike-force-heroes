// Port of SH.as — sound handler (SFX, single voice channel, crossfaded music).
import { SoundChannel, SoundTransform, sound, type SoundAsset } from '../flash/sound';
import { SD } from './SD';
import { Main } from './Main';
import { MatchSettings } from './MatchSettings';
import { Game } from './Game';

export class SH {
  static chan: SoundChannel | null = null;
  static sound: any;
  static replayAt = NaN;
  private static voiceChan: SoundChannel | null = null;
  private static soundChan: SoundChannel | null = null;
  private static soundVolLow: SoundTransform;
  private static soundVol: SoundTransform;
  private static soundVolLoud: SoundTransform;
  private static noVol: SoundTransform;
  private static musicClass: SoundAsset | null = null;
  private static musicChan: SoundChannel | null = null;
  private static musicVol: SoundTransform;
  private static fadeClass: SoundAsset | null = null;
  private static fadeChan: SoundChannel | null = null;
  private static fadeVol: SoundTransform;
  static songList: SoundAsset[];
  static songNames: string[];
  private static useLowVol = false;
  private static readonly maxVolume = 0.8;

  static Init(): void {
    SH.soundVolLow = new SoundTransform(0.15);
    SH.soundVol = new SoundTransform(0.4);
    SH.soundVolLoud = new SoundTransform(0.9);
    SH.noVol = new SoundTransform(0);
    SH.musicVol = new SoundTransform(SH.maxVolume);
    SH.fadeVol = new SoundTransform(0);
    SH.songList = ['M_Plane', 'M_Rocket', 'M_Train', 'M_Boss', 'M_Theme', 'M_Slow'].map(sound);
    SH.songNames = ['Rose at Midnight', 'Rocket Race', 'Rose at Eclipse', 'Rising Sun', 'A Hero Emerges', 'Slow Victory'];
  }

  /** `snd` may be a SoundAsset or an AS3 class name like 'S_Fire'. */
  static playSound(snd: SoundAsset | string, loud = false): void {
    if (SD.sound) {
      const s = typeof snd === 'string' ? sound(snd) : snd;
      SH.soundChan = s.play();
      if (!SH.useLowVol) SH.soundChan.soundTransform = !loud ? SH.soundVol : SH.soundVolLoud;
      else SH.soundChan.soundTransform = !loud ? SH.soundVolLow : SH.soundVol;
    }
  }

  static playVoice(snd: SoundAsset | string): void {
    if (SD.voices) {
      SH.voiceChan?.stop();
      SH.voiceChan = (typeof snd === 'string' ? sound(snd) : snd).play();
      SH.voiceChan.soundTransform = SH.soundVolLoud;
    }
  }

  static playMusic(snd: SoundAsset | string, instant = false): void {
    const m = typeof snd === 'string' ? sound(snd) : snd;
    if (SH.musicClass != m) {
      if (SH.musicClass) {
        if (SH.fadeClass) SH.fadeChan!.stop();
        SH.fadeVol.volume = !SD.music || instant ? 0 : SH.maxVolume;
        SH.fadeClass = SH.musicClass;
        SH.fadeChan = SH.musicChan;
        SH.fadeChan!.soundTransform = SH.fadeVol;
      } else instant = true;
      SH.musicVol.volume = instant && SD.music ? SH.maxVolume : 0;
      SH.musicClass = m;
      SH.musicChan = m.play(0, 1000);
      SH.musicChan.soundTransform = SH.musicVol;
    }
  }

  static get currentMusic(): SoundAsset | null {
    return SH.musicClass;
  }

  static EnterFrame(): void {
    SH.useLowVol = false;
    if (SH.fadeClass) {
      if (SH.fadeVol.volume <= 0) {
        SH.fadeClass = null;
        SH.fadeChan!.stop();
      } else {
        SH.fadeVol.volume -= 0.025;
        SH.fadeChan!.soundTransform = SH.fadeVol;
      }
    }
    if (SH.musicClass) {
      if (!SD.music) {
        if (SH.musicVol.volume > 0) SH.musicVol.volume -= 0.025;
      } else {
        let target = SH.maxVolume;
        const cur: any = Main.curClass;
        if (cur instanceof Game && MatchSettings.isCampaign && MatchSettings.caType == 0 && !!cur.hud.msgTimer && SD.voices) {
          SH.useLowVol = true;
        }
        if (SH.useLowVol) target = 0.4;
        if (SH.musicVol.volume < target + 0.05) SH.musicVol.volume += 0.05;
        if (SH.musicVol.volume > target - 0.025) SH.musicVol.volume -= 0.025;
      }
    }
    if (SH.musicChan) SH.musicChan.soundTransform = SH.musicVol;
  }

  static updateMusicVolume(): void {
    if (!SD.music) {
      SH.fadeVol.volume = 0;
      SH.musicVol.volume = SH.maxVolume;
    } else {
      SH.fadeVol.volume = 0;
      SH.musicVol.volume = 0;
    }
  }
}
