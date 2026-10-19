// Port of Hud.as — in-match HUD (linked symbol 1541). Its timeline drives the match flow:
//   1 "idle" | 2-8 tutorial prompts | 15 "pause" (frame15: options + InitPause) |
//   16 "start" countdown (frame74: startGame, frame104: back to idle) |
//   105 "end" (frame105: InitEnd) … frame255: EndGame → game.destroy().
// Pause-menu option controls are fl.controls components (see FlControls.ts); all buttons are
// hit-tested in code like the original.
import { Container, Graphics, Text } from 'pixi.js';
import { uint } from '../flash/as3';
import { Symbol, hitTestPoint, lib, mouseX, mouseY } from '../flash/runtime';
import type { SwfClip, SwfTextField } from '../swf/display';
import type { CheckBox, RadioButton } from './FlControls';
import type { DownArrow } from './DownArrow';
import type { Game } from './Game';
import { Main } from './Main';
import { MatchSettings } from './MatchSettings';
import { SD } from './SD';
import { SH } from './SH';
import { UT } from './UT';
import { Stats_Achievements } from './Stats_Achievements';
import { Stats_Classes } from './Stats_Classes';
import type { Stats_Guns } from './Stats_Guns';
import { Stats_Misc } from './Stats_Misc';
import type { Stats_Streaks } from './Stats_Streaks';

/** Timeline child lookup on a nested clip (AS3 `clip.someName`). */
function c<T extends Container = SwfClip>(clip: Container, name: string): T {
  return (clip as SwfClip).child<T>(name);
}

/** A kill-feed entry: text segments with one colour each. */
interface Feed {
  txt: string[];
  col: number[];
  timer: number;
}

export class Hud extends Symbol {
  get cc1(): SwfClip {
    return this.child<SwfClip>('cc1');
  }

  get rd_qualM(): RadioButton {
    return this.child<RadioButton>('rd_qualM');
  }

  get cc2(): SwfClip {
    return this.child<SwfClip>('cc2');
  }

  get txt_changeclass(): SwfTextField {
    return this.child<SwfTextField>('txt_changeclass');
  }

  get txt_respawn(): SwfTextField {
    return this.child<SwfTextField>('txt_respawn');
  }

  get txt_flags(): SwfTextField {
    return this.child<SwfTextField>('txt_flags');
  }

  get icon(): SwfClip {
    return this.child<SwfClip>('icon');
  }

  /** only on the pause/end frames (null elsewhere, like an AS3 timeline var) */
  get logo1(): SwfClip {
    return this.maybeChild<SwfClip>('logo1') as SwfClip;
  }

  get cb_voices(): CheckBox {
    return this.child<CheckBox>('cb_voices');
  }

  get rd_bloodH(): RadioButton {
    return this.child<RadioButton>('rd_bloodH');
  }

  get rd_qualL(): RadioButton {
    return this.child<RadioButton>('rd_qualL');
  }

  get debug(): SwfClip {
    return this.child<SwfClip>('debug');
  }

  get cc3(): SwfClip {
    return this.child<SwfClip>('cc3');
  }

  get txt_nextsong(): SwfTextField {
    return this.child<SwfTextField>('txt_nextsong');
  }

  get txt_streakready(): SwfTextField {
    return this.child<SwfTextField>('txt_streakready');
  }

  get txt_classname(): SwfTextField {
    return this.child<SwfTextField>('txt_classname');
  }

  /** only on the pause/end frames (null elsewhere, like an AS3 timeline var) */
  get logo2(): SwfClip {
    return this.maybeChild<SwfClip>('logo2') as SwfClip;
  }

  get cc4(): SwfClip {
    return this.child<SwfClip>('cc4');
  }

  get mc_streak(): SwfClip {
    return this.child<SwfClip>('mc_streak');
  }

  get bulletCont(): SwfClip {
    return this.child<SwfClip>('bulletCont');
  }

  get rd_partM(): RadioButton {
    return this.child<RadioButton>('rd_partM');
  }

  get txt_ammo(): SwfTextField {
    return this.child<SwfTextField>('txt_ammo');
  }

  get cb_sound(): CheckBox {
    return this.child<CheckBox>('cb_sound');
  }

  get txt_quit(): SwfTextField {
    return this.child<SwfTextField>('txt_quit');
  }

  get rd_partL(): RadioButton {
    return this.child<RadioButton>('rd_partL');
  }

  get flag1(): SwfClip {
    return this.child<SwfClip>('flag1');
  }

  get rd_qualH(): RadioButton {
    return this.child<RadioButton>('rd_qualH');
  }

  get flag2(): SwfClip {
    return this.child<SwfClip>('flag2');
  }

  get txt_feed(): SwfTextField {
    return this.child<SwfTextField>('txt_feed');
  }

  get bloodyscreen(): SwfClip {
    return this.child<SwfClip>('bloodyscreen');
  }

  get flag3(): SwfClip {
    return this.child<SwfClip>('flag3');
  }

  get nextgun(): SwfClip {
    return this.child<SwfClip>('nextgun');
  }

  get txt_win(): SwfTextField {
    return this.child<SwfTextField>('txt_win');
  }

  get expholder(): SwfClip {
    return this.child<SwfClip>('expholder');
  }

  get rd_partH(): RadioButton {
    return this.child<RadioButton>('rd_partH');
  }

  get mc_streakarrow(): DownArrow {
    return this.child<DownArrow>('mc_streakarrow');
  }

  get cb_light(): CheckBox {
    return this.child<CheckBox>('cb_light');
  }

  get mc_speak(): SwfClip {
    return this.child<SwfClip>('mc_speak');
  }

  get mc_skill(): SwfClip {
    return this.child<SwfClip>('mc_skill');
  }

  get txt_curgun(): SwfTextField {
    return this.child<SwfTextField>('txt_curgun');
  }

  get curgun(): SwfClip {
    return this.child<SwfClip>('curgun');
  }

  get txt_hp(): SwfTextField {
    return this.child<SwfTextField>('txt_hp');
  }

  get cb_music(): CheckBox {
    return this.child<CheckBox>('cb_music');
  }

  get scorebar(): SwfClip {
    return this.child<SwfClip>('scorebar');
  }

  get txt_level(): SwfTextField {
    return this.child<SwfTextField>('txt_level');
  }

  get barCont(): SwfClip {
    return this.child<SwfClip>('barCont');
  }

  get txt_streaknum(): SwfTextField {
    return this.child<SwfTextField>('txt_streaknum');
  }

  get rd_bloodL(): RadioButton {
    return this.child<RadioButton>('rd_bloodL');
  }

  get txt_resume(): SwfTextField {
    return this.child<SwfTextField>('txt_resume');
  }

  get cb_bloody(): CheckBox {
    return this.child<CheckBox>('cb_bloody');
  }

  get txt_song(): SwfTextField {
    return this.child<SwfTextField>('txt_song');
  }

  get rd_bloodM(): RadioButton {
    return this.child<RadioButton>('rd_bloodM');
  }

  get cb_shake(): CheckBox {
    return this.child<CheckBox>('cb_shake');
  }

  /** AS3 `new Dictionary(true)` (weak keys). */
  __setPropDict: WeakMap<object, number> = new WeakMap();

  private game: Game;

  private classChange = false;

  private pauseButs: any[] | null = null;

  won = false;

  msgForce = false;

  /** AS3 uint */
  msgTimer = 0;

  /** AS3 uint */
  respawnTimer = 0;

  private feeds!: Feed[];

  /** AS3 TextFormat (only `color` is used). */
  private txtFmt!: { color: number };

  private curSong: any = undefined;

  /** Port addition: Graphics standing in for `bulletCont.graphics`. */
  private bulletGfx: Graphics | null = null;

  /** Port addition: per-segment coloured rendering of txt_feed (stands in for setTextFormat). */
  private feedLayer: Container | null = null;

  constructor(param1: Game) {
    super('Hud');
    this.addFrameScript(14, () => this.frame15(), 73, () => this.frame74(), 103, () => this.frame104(), 104, () => this.frame105(), 254, () => this.frame255());
    this.game = param1;
    let _loc2_ = 1;
    while (_loc2_ <= 4) {
      this.child<SwfClip>('cc' + _loc2_).gotoAndStop(Stats_Classes.getClass(_loc2_).icon);
      _loc2_++;
    }
    this.gotoAndPlay('start');
    this.reset();
    c<SwfTextField>(this.scorebar, 'modetxt').text = Stats_Misc.getGameMode(MatchSettings.useMode).name;
    this.feeds = [];
    this.txtFmt = { color: 0 };
    this.processFeed();
    if (MatchSettings.useMode != 'dom') {
      if (MatchSettings.useMode != 'ctf') {
        this.flag1.visible = false;
        this.flag2.visible = false;
        this.flag3.visible = false;
      } else {
        this.flag2.visible = false;
        this.flag1.gotoAndStop(this.game.arena.flag1.team * 5);
        this.flag3.gotoAndStop(this.game.arena.flag2.team * 5);
        c<SwfTextField>(this.flag1, 'txt_letter').text = '';
        c<SwfTextField>(this.flag3, 'txt_letter').text = '';
      }
    } else {
      c<SwfTextField>(this.flag1, 'txt_letter').text = 'A';
      c<SwfTextField>(this.flag2, 'txt_letter').text = 'B';
      c<SwfTextField>(this.flag3, 'txt_letter').text = 'C';
    }
    this.txt_flags.text = '';
    if (!(!MatchSettings.isCampaign && Boolean(SH.songList.length))) {
      this.txt_song.visible = false;
      this.txt_nextsong.visible = false;
    } else {
      this.curSong = UT.randEl(SH.songList);
      SH.playMusic(this.curSong);
      this.txt_song.alpha = 0.5;
      this.txt_nextsong.alpha = 0.5;
      this.txt_song.text = 'Song: ' + SH.songNames[SH.songList.indexOf(this.curSong)];
    }
    if (MatchSettings.isCampaign && Boolean(MatchSettings.useSong)) {
      SH.playMusic(MatchSettings.useSong);
    }
    this.mc_streakarrow.visible = false;
  }

  reset(): void {
    this.txt_respawn.text = '';
    this.setClassChange();
  }

  setClassChange(param1: any = false): void {
    this.classChange = param1;
    this.txt_changeclass.visible = this.classChange;
    let _loc2_ = 1;
    while (_loc2_ <= 4) {
      this.child<SwfClip>('cc' + _loc2_).visible = this.classChange;
      _loc2_++;
    }
  }

  setGuns(param1: Stats_Guns, param2: Stats_Guns): void {
    this.txt_curgun.text = param1.name;
    this.curgun.gotoAndStop(param1.sprite);
    this.nextgun.gotoAndStop(param2.sprite);
  }

  addExp(param1: number = 0): void {
    param1 = uint(param1);
    let _loc2_ = 0;
    if (this.game.player) {
      const save: any = SD.classSaves[this.game.player.unitInfo.num];
      save.funds += param1;
      if (save.level != 50) {
        save.exp += param1;
        const bar_exp = c<SwfClip>(this.expholder, 'bar_exp');
        bar_exp.scripted = true;
        bar_exp.width = (save.exp / Stats_Classes.getNextExp(save.level)) * 420;
        c<SwfTextField>(this.expholder, 'txt_exp').text = 'Exp ' + save.exp + ' / ' + Stats_Classes.getNextExp(save.level);
        if (save.exp >= Stats_Classes.getNextExp(save.level)) {
          save.exp = 0;
          ++save.level;
          SH.playSound('S_Powerup', true);
          SH.playSound('S_rocketExplode');
          this.game.arena.setShake(10, 10);
          _loc2_ = 0;
          while (_loc2_ < 20) {
            this.game.createParticle(
              this.game.player.x + UT.rand(-10, 10),
              this.game.player.y + UT.rand(-40, 0),
              'spark',
              20,
              {
                xSpd: UT.rand(-5, 5),
                ySpd: UT.rand(-8, -3),
              },
              'ember',
            );
            _loc2_++;
          }
          this.game.createEffect(this.game.player.x, this.game.player.y - 100, 'levelup', 'idle', true);
          this.game.createParticle(this.game.player.x, this.game.player.y - 60, 'slowText', 0, null, 'bigText', 'levelup');
          this.addCustomFeed(this.game.player, 'levelup');
          this.txt_level.text = 'lvl: ' + save.level;
          this.game.player.txt_level.text = save.level;
          this.game.hud.setRespawnText('Level up!' + Stats_Classes.getLevelUnlock(save.level, this.game.player.unitInfo.num), 16776960);
          this.addExp(0);
        }
        return;
      }
      const bar_exp = c<SwfClip>(this.expholder, 'bar_exp');
      bar_exp.scripted = true;
      bar_exp.width = 420;
      c<SwfTextField>(this.expholder, 'txt_exp').text = 'Level Maxed';
      Stats_Achievements.setAchievement('level50');
      return;
    }
  }

  setAmmoImage(param1: number, param2: number, param3: string, param4: number = 0): void {
    param1 = uint(param1);
    param2 = uint(param2);
    param4 = uint(param4);
    let _loc5_ = NaN;
    let _loc6_ = 0;
    this.bulletGraphics().clear();
    switch (param3) {
      case 'pistol':
        _loc6_ = 0;
        while (_loc6_ < param2) {
          this.drawBox(_loc6_, 2, 2, 6, param1 > _loc6_);
          _loc6_++;
        }
        break;
      case 'magnum':
        _loc6_ = 0;
        while (_loc6_ < param2) {
          this.drawBox(_loc6_, 3, 3, 7, param1 > _loc6_);
          _loc6_++;
        }
        break;
      case 'arifle':
        _loc6_ = 0;
        while (_loc6_ < param2) {
          this.drawBox(_loc6_, 2, 2, 10, param1 > _loc6_);
          _loc6_++;
        }
        break;
      case 'sniper':
        _loc6_ = 0;
        while (_loc6_ < param2) {
          this.drawBox(_loc6_, 3, 20, 5, param1 > _loc6_);
          _loc6_++;
        }
        break;
      case 'shotgun':
        _loc6_ = 0;
        while (_loc6_ < param2) {
          this.drawBox(_loc6_, 2, 5, 8, param1 > _loc6_);
          _loc6_++;
        }
        break;
      case 'rocket':
        _loc6_ = 0;
        while (_loc6_ < param2) {
          this.drawBox(_loc6_, 3, 7, 12, param1 > _loc6_);
          _loc6_++;
        }
        break;
      case 'machine':
        _loc5_ = param1 - param2 / 2;
        if (_loc5_ < 0) {
          _loc5_ = 0;
        }
        param1 = uint(param1 - _loc5_);
        _loc6_ = 0;
        while (_loc6_ < param2 / 2) {
          this.drawBox(_loc6_, 2, 2, 5, param1 > _loc6_);
          _loc6_++;
        }
        _loc6_ = 0;
        while (_loc6_ < param2 / 2) {
          this.drawBox(_loc6_, 2, 2, 5, _loc5_ > _loc6_, 7);
          _loc6_++;
        }
    }
    this.txt_ammo.text = '' + param4;
  }

  /** Port helper: `bulletCont.graphics` (a Graphics kept under bulletCont's timeline content). */
  private bulletGraphics(): Graphics {
    const cont = this.bulletCont;
    if (!this.bulletGfx || this.bulletGfx.destroyed || this.bulletGfx.parent !== cont) {
      this.bulletGfx = new Graphics();
      cont.addChildAt(this.bulletGfx, 0);
    }
    return this.bulletGfx;
  }

  drawBox(param1: number, param2: number, param3: number, param4: number, param5: boolean, param6: number = 0): void {
    const _loc7_: number = param1 * (param2 + param3);
    const g = this.bulletGraphics();
    g.moveTo(_loc7_, param6);
    g.lineTo(_loc7_ + param3, param6);
    g.lineTo(_loc7_ + param3, param6 + param4);
    g.lineTo(_loc7_, param6 + param4);
    g.lineTo(_loc7_, param6);
    g.fill({ color: 16777215, alpha: !param5 ? 0.2 : 1 });
    g.stroke({ width: 0.5, color: 16777215, alpha: !param5 ? 0.4 : 1 });
  }

  InitPause(): void {
    this.pauseButs = [this.rd_qualL, this.rd_qualM, this.rd_qualH, this.rd_partL, this.rd_partM, this.rd_partH, this.cb_light, this.cb_music, this.cb_sound, this.cb_voices, this.cb_shake, this.cb_bloody, this.rd_bloodL, this.rd_bloodM, this.rd_bloodH];
    if (SD.graphQual == 0) {
      this.rd_qualL.selected = true;
    }
    if (SD.graphQual == 1) {
      this.rd_qualM.selected = true;
    }
    if (SD.graphQual == 2) {
      this.rd_qualH.selected = true;
    }
    if (SD.graphPart == 0) {
      this.rd_partL.selected = true;
    }
    if (SD.graphPart == 1) {
      this.rd_partM.selected = true;
    }
    if (SD.graphPart == 2) {
      this.rd_partH.selected = true;
    }
    this.cb_light.selected = SD.graphLights;
    this.cb_music.selected = SD.music;
    this.cb_sound.selected = SD.sound;
    this.cb_voices.selected = SD.voices;
    this.cb_shake.selected = SD.screenShake;
    this.cb_bloody.selected = SD.screenBlood;
    if (SD.blood == 0) {
      this.rd_bloodL.selected = true;
    }
    if (SD.blood == 1) {
      this.rd_bloodM.selected = true;
    }
    if (SD.blood == 2) {
      this.rd_bloodH.selected = true;
    }
    this.game.matchSettings.showScores(this.barCont);
  }

  InitEnd(): void {
    this.txt_respawn.text = '';
    this.txt_win.text = !this.won ? 'Defeat' : 'Victory';
    this.txt_win.textColor = !this.won ? 16764057 : 13434879;
    this.game.matchSettings.showScores(this.barCont);
    if (MatchSettings.isCampaign && this.won) {
      if (MatchSettings.caType == 0 && MatchSettings.caStage == SD.curCampaign && MatchSettings.caStage < 15) {
        ++SD.curCampaign;
      }
      if (MatchSettings.caType == 1 && MatchSettings.caStage == SD.curChallenge && MatchSettings.caStage < 15) {
        ++SD.curChallenge;
      }
    }
    SD.saveGame();
  }

  EnterFrame(): void {
    let _loc1_ = 0;
    let _loc2_ = 0;
    if (this.curSong) {
      this.txt_nextsong.alpha = !hitTestPoint(this.txt_nextsong, mouseX(this), mouseY(this)) ? 0.5 : 1;
    }
    if (!this.game.paused) {
      if (this.classChange) {
        _loc1_ = 1;
        while (_loc1_ <= 4) {
          const cc = this.child<SwfClip>('cc' + _loc1_);
          if (_loc1_ != SD.selClass) {
            if (!hitTestPoint(cc, mouseX(this.game), mouseY(this.game))) {
              cc.alpha = 0.3;
            } else {
              cc.alpha = 0.6;
            }
          } else {
            cc.alpha = 1;
          }
          _loc1_++;
        }
      }
      if (this.msgTimer == 1) {
        this.mc_speak.gotoAndPlay('close');
        this.msgForce = false;
      }
      if (this.msgTimer) {
        --this.msgTimer;
      }
      if (this.respawnTimer == 1) {
        this.txt_respawn.text = '';
      }
      if (this.respawnTimer) {
        --this.respawnTimer;
      }
      _loc1_ = 0;
      while (_loc1_ < this.feeds.length) {
        --this.feeds[_loc1_].timer;
        if (!this.feeds[_loc1_].timer) {
          this.feeds.pop();
          this.processFeed();
        }
        _loc1_++;
      }
      if (MatchSettings.useMode == 'dom') {
        _loc2_ = 0;
        _loc1_ = 0;
        while (_loc1_ < this.game.arena.holdpoints.length) {
          if (this.game.arena.holdpoints[_loc1_].curTeam == 1) {
            _loc2_++;
          }
          this.child<SwfClip>('flag' + (_loc1_ + 1)).gotoAndStop(this.game.arena.holdpoints[_loc1_].curTeam + 1);
          _loc1_++;
        }
        this.txt_flags.text = _loc2_ + ' point' + (_loc2_ == 1 ? '' : 's') + ' per 3 sec';
      } else if (MatchSettings.useMode == 'ctf') {
        this.txt_flags.text = '';
        if (!this.game.arena.flag1.unitCaptured) {
          this.flag1.gotoAndStop(this.game.arena.flag1.team * 5);
          c<SwfTextField>(this.flag1, 'txt_letter').text = '';
        } else {
          this.flag1.gotoAndStop(this.game.arena.flag1.team * 5 + 1);
          c<SwfTextField>(this.flag1, 'txt_letter').text = this.game.arena.flag1.team != 1 ? '!' : '?';
          if (this.game.arena.flag1.team == 1) {
            this.txt_flags.text = 'Your flag is taken!';
          }
        }
        if (!this.game.arena.flag2.unitCaptured) {
          this.flag3.gotoAndStop(this.game.arena.flag2.team * 5);
          c<SwfTextField>(this.flag3, 'txt_letter').text = '';
        } else {
          this.flag3.gotoAndStop(this.game.arena.flag2.team * 5 + 1);
          c<SwfTextField>(this.flag3, 'txt_letter').text = this.game.arena.flag2.team != 1 ? '!' : '?';
          if (this.game.arena.flag2.team == 1) {
            this.txt_flags.text = 'Your flag is taken!';
          }
        }
      }
      return;
    }
    this.txt_resume.alpha = !hitTestPoint(this.txt_resume, mouseX(this), mouseY(this)) ? 0.5 : 1;
    this.txt_quit.alpha = !hitTestPoint(this.txt_quit, mouseX(this), mouseY(this)) ? 0.5 : 1;
    SD.setLogos(this.logo1, this.logo2);
  }

  EndGame(): void {
    this.game.destroy();
  }

  MouseUp(): void {
    if (this.game.paused) {
      let _loc1_ = 0;
      while (_loc1_ < this.pauseButs!.length) {
        this.pauseButs![_loc1_].enabled = true;
        _loc1_++;
      }
      return;
    }
  }

  MouseDown(): void {
    let _loc1_ = 0;
    if (!this.game.paused) {
      if (this.classChange) {
        _loc1_ = 1;
        while (_loc1_ <= 4) {
          if (hitTestPoint(this.child<SwfClip>('cc' + _loc1_), mouseX(this.game), mouseY(this.game))) {
            SD.selClass = _loc1_;
          }
          _loc1_++;
        }
      }
      if (Boolean(this.curSong) && hitTestPoint(this.txt_nextsong, mouseX(this), mouseY(this))) {
        this.curSong = UT.getNextEl(this.curSong, true, SH.songList);
        SH.playMusic(this.curSong);
        this.txt_song.text = 'Song: ' + SH.songNames[SH.songList.indexOf(this.curSong)];
      }
      return;
    }
    const pauseButs = this.pauseButs!;
    _loc1_ = 0;
    for (; _loc1_ < pauseButs.length; _loc1_++) {
      if (!hitTestPoint(pauseButs[_loc1_], mouseX(this), mouseY(this))) {
        continue;
      }
      // AS3 `name` = Pixi `label` (instance name).
      if (pauseButs[_loc1_].label.charAt(0) != 'r') {
        pauseButs[_loc1_].enabled = false;
        pauseButs[_loc1_].selected = !pauseButs[_loc1_].selected;
      } else {
        pauseButs[_loc1_].selected = true;
      }
      switch (pauseButs[_loc1_].label) {
        case 'rd_qualL':
          SD.graphQual = 0;
          (Main.STAGE as any).quality = 'low'; // stage.quality: no direct Pixi equivalent
          break;
        case 'rd_qualM':
          SD.graphQual = 1;
          (Main.STAGE as any).quality = 'medium';
          break;
        case 'rd_qualH':
          SD.graphQual = 2;
          (Main.STAGE as any).quality = 'high';
          break;
        case 'rd_partL':
          SD.graphPart = 0;
          break;
        case 'rd_partM':
          SD.graphPart = 1;
          break;
        case 'rd_partH':
          SD.graphPart = 2;
          break;
        case 'cb_light':
          SD.graphLights = this.cb_light.selected;
          this.game.arena.toggleLights();
          break;
        case 'cb_music':
          SD.music = this.cb_music.selected;
          break;
        case 'cb_sound':
          SD.sound = this.cb_sound.selected;
          break;
        case 'cb_voices':
          SD.voices = this.cb_voices.selected;
          break;
        case 'cb_shake':
          SD.screenShake = this.cb_shake.selected;
          break;
        case 'cb_bloody':
          SD.screenBlood = this.cb_bloody.selected;
          this.bloodyscreen.gotoAndStop(!SD.screenBlood ? 2 : 1);
          break;
        case 'rd_bloodL':
          SD.blood = 0;
          break;
        case 'rd_bloodM':
          SD.blood = 1;
          break;
        case 'rd_bloodH':
          SD.blood = 2;
      }
    }
    if (!hitTestPoint(this.txt_resume, mouseX(this.game), mouseY(this.game))) {
      if (hitTestPoint(this.txt_quit, mouseX(this.game), mouseY(this.game))) {
        if (this.txt_quit.text == 'Quit') {
          this.txt_resume.text = 'Confirm Quit';
          this.txt_quit.text = 'Cancel';
        } else if (this.txt_quit.text == 'Cancel') {
          this.txt_resume.text = 'Resume';
          this.txt_quit.text = 'Quit';
        }
      }
    } else if (this.txt_resume.text != 'Resume') {
      if (this.txt_resume.text == 'Confirm Quit') {
        this.game.destroy();
      }
    } else {
      this.game.togglePause();
    }
    // AS3 SD.pressLogos(this, logo1, logo2) reads this.mouseX/mouseY; the TS signature takes them.
    // After "Resume" the Hud is already back on "idle" (no logos) and AS3 threw #1009 here, ending the
    // handler; nothing follows, so skipping the call is equivalent without the uncaught error.
    if (this.destroyed || !this.logo1 || !this.logo2) return;
    SD.pressLogos(this, this.logo1, this.logo2, mouseX(this), mouseY(this));
  }

  setScoreBar(param1: number, param2: number, param3: number, param4: number): void {
    const scorebar1 = c<SwfClip>(this.scorebar, 'scorebar1');
    const scorebar2 = c<SwfClip>(this.scorebar, 'scorebar2');
    c<SwfClip>(scorebar1, 'barfade').gotoAndStop(param1 + (param1 != 0 ? 2 : 1));
    c<SwfClip>(scorebar1, 'bar').gotoAndStop(param1 + (param1 != 0 ? 2 : 1));
    c<SwfClip>(scorebar2, 'barfade').gotoAndStop(param3 + 2);
    c<SwfClip>(scorebar2, 'bar').gotoAndStop(param3 + 2);
    const bar1 = c<SwfClip>(scorebar1, 'bar');
    const bar2 = c<SwfClip>(scorebar2, 'bar');
    const cap1 = c<SwfClip>(scorebar1, 'cap');
    const cap2 = c<SwfClip>(scorebar2, 'cap');
    bar1.scripted = bar2.scripted = cap1.scripted = cap2.scripted = true;
    bar1.width = (param2 / MatchSettings.useScore) * 125;
    bar2.width = (param4 / MatchSettings.useScore) * 125;
    cap1.x = bar1.x + bar1.width;
    cap2.x = bar2.x + bar2.width;
    c<SwfTextField>(this.scorebar, 'scoretxt1').text = '> ' + param2;
    c<SwfTextField>(this.scorebar, 'scoretxt2').text = '' + param4;
  }

  startGame(): void {
    this.game.startGame();
  }

  setRespawnText(param1: string, param2: number = 16777215): void {
    this.txt_respawn.text = param1;
    this.txt_respawn.textColor = uint(param2);
    this.respawnTimer = 3 * 30;
  }

  setMsg(param1: any, param2: string, param3: number = 4, param4: boolean = false, param5: any = null): void {
    if (!(this.msgForce && !param4)) {
      this.mc_speak.gotoAndPlay('open');
      c<SwfClip>(this.mc_speak, 'head').gotoAndStop(param1.unitInfo.frame);
      c<SwfTextField>(this.mc_speak, 'txt_name').text = param1.name;
      c<SwfTextField>(this.mc_speak, 'txt_desc').text = param2;
      this.msgForce = param4;
      this.msgTimer = uint(uint(param3) * 30);
      if (param5) {
        SH.playVoice(param5);
      }
      return;
    }
  }

  setCharMsg(param1: string, param2: number, param3: string, param4: string, param5: number = 4, param6: boolean = false, param7: any = null): void {
    if (this.msgForce && !param6) {
      return;
    }
    this.mc_speak.gotoAndPlay('open');
    c<SwfClip>(this.mc_speak, 'head').gotoAndStop(Stats_Classes.getClass(Stats_Classes.classNums.indexOf(param1)).startFrame + uint(param2));
    c<SwfTextField>(this.mc_speak, 'txt_name').text = param3;
    c<SwfTextField>(this.mc_speak, 'txt_desc').text = param4;
    this.msgForce = param6;
    this.msgTimer = uint(uint(param5) * 30);
    if (param7) {
      SH.playVoice(param7);
    }
  }

  setMsgRandomTeammate(param1: number, param2: string): void {
    let _loc3_: any = undefined;
    let _loc4_: any = 0;
    do {
      _loc3_ = UT.randEl(this.game.units);
      if (++_loc4_ == 20) {
        _loc3_ = this.game.player;
        break;
      }
    } while (_loc3_.team != param1 || _loc3_ == this.game.player);
    this.setMsg(_loc3_, param2, 5);
  }

  addCustomFeed(param1: any, param2: string): void {
    switch (param2) {
      case 'levelup':
        this.feeds.unshift({
          txt: [param1.name, ' has LEVELED UP'],
          col: [this.getUnitColour(param1), 16776960],
          timer: 90,
        });
        break;
      case 'flag':
        this.feeds.unshift({
          txt: [param1.name + ' has captured ' + (param1.team != 1 ? 'your' : 'the enemy') + ' flag!'],
          col: [this.getUnitColour(param1)],
          timer: 90,
        });
        break;
      case 'jug':
        this.feeds.unshift({
          txt: [param1.name + ' has become the Juggernaut!'],
          col: [this.getUnitColour(param1)],
          timer: 90,
        });
        break;
      case 'holdpoint':
        this.feeds.unshift({
          txt: [(param1.team != 1 ? 'Your' : 'An enemy') + ' point has been captured!'],
          col: [this.getUnitColour(param1)],
          timer: 90,
        });
    }
    this.processFeed();
  }

  addKillstreakFeed(param1: any, param2: Stats_Streaks): void {
    this.feeds.unshift({
      txt: [param1.name, ' used killstreak ', param2.name],
      col: [this.getUnitColour(param1), 13421772, 13434879],
      timer: 90,
    });
    this.processFeed();
  }

  addKillFeed(param1: any, param2: any, param3: Stats_Guns): void {
    const _loc4_: number = this.getUnitColour(param2);
    const _loc5_: number = this.getUnitColour(param1);
    if (param1 != param2) {
      this.feeds.unshift({
        txt: [param2.name, ' [' + param3.name + '] ', param1.name],
        col: [_loc4_, 13421772, _loc5_],
        timer: 90,
      });
      this.processFeed();
      return;
    }
    this.feeds.unshift({
      txt: ['Suicide', ' [' + param3.name + '] ', param2.name],
      col: [16751103, 13421772, _loc4_],
      timer: 90,
    });
    this.processFeed();
  }

  processFeed(): void {
    let _loc1_ = 0;
    let _loc3_ = 0;
    if (this.feeds.length > 13) {
      this.feeds.pop();
    }
    this.txt_feed.text = '';
    _loc1_ = 0;
    while (_loc1_ < this.feeds.length) {
      this.txt_feed.text += this.feeds[_loc1_].txt.join('') + '\n';
      _loc1_++;
    }
    // AS3: per-segment txtFmt.color + txt_feed.setTextFormat(txtFmt, begin, end). SwfTextField has
    // no rich text, so the segments are drawn as separate Texts over the (hidden) field instead.
    const segs: { line: number; text: string; color: number }[] = [];
    let _loc2_ = 0;
    _loc1_ = 0;
    while (_loc1_ < this.feeds.length) {
      _loc3_ = 0;
      while (_loc3_ < this.feeds[_loc1_].txt.length) {
        this.txtFmt.color = this.feeds[_loc1_].col[_loc3_];
        segs.push({ line: _loc1_, text: this.feeds[_loc1_].txt[_loc3_], color: this.txtFmt.color });
        _loc2_ += this.feeds[_loc1_].txt[_loc3_].length;
        _loc3_++;
      }
      _loc2_ += 1;
      _loc1_++;
    }
    this.drawFeed(segs);
  }

  /** Port helper: renders coloured kill-feed segments in place of txt_feed's single-colour text. */
  private drawFeed(segs: { line: number; text: string; color: number }[]): void {
    const tf = this.txt_feed;
    for (const ch of tf.children) if (ch !== this.feedLayer) ch.visible = false;
    if (!this.feedLayer || this.feedLayer.destroyed || this.feedLayer.parent !== tf) {
      this.feedLayer = new Container();
      tf.addChild(this.feedLayer);
    }
    const layer = this.feedLayer;
    for (const old of layer.removeChildren()) old.destroy();
    const def = tf.def;
    const size = def.size ?? 12;
    const lineH = size * 1.15 + (def.leading ?? 0);
    const alpha = (def.color?.[3] ?? 255) / 255;
    const family = def.font !== undefined ? lib.fontFamily(def.font) : 'sans-serif';
    let x = 0;
    let line = -1;
    for (const s of segs) {
      if (s.line !== line) {
        line = s.line;
        x = def.bounds[0] + 2;
      }
      if (!s.text) continue;
      const t = new Text({ text: s.text, style: { fontFamily: family, fontSize: size, fill: s.color } });
      t.alpha = alpha;
      t.position.set(x, def.bounds[1] + 2 + line * lineH);
      x += t.width;
      layer.addChild(t);
    }
  }

  getUnitColour(param1: any): number {
    return !param1.human ? (param1.team != 1 ? 16737792 : 6724095) : 10079487;
  }

  /** Common body of the __setProp_rd_* handlers (component inspector values). */
  private setRadioProps(rd: RadioButton, group: string): void {
    if (this.__setPropDict.get(rd) == undefined || uint(this.__setPropDict.get(rd)!) != 15) {
      this.__setPropDict.set(rd, 15);
      rd.enabled = true;
      rd.groupName = group;
      rd.labelText = '';
      rd.labelPlacement = 'left';
      rd.selected = false;
      rd.value = '';
      rd.visible = true;
    }
  }

  /** Common body of the __setProp_cb_* handlers (component inspector values). */
  private setCheckProps(cb: CheckBox): void {
    if (this.__setPropDict.get(cb) == undefined || uint(this.__setPropDict.get(cb)!) != 15) {
      this.__setPropDict.set(cb, 15);
      cb.enabled = true;
      cb.labelText = '';
      cb.labelPlacement = 'left';
      cb.selected = false;
      cb.visible = true;
    }
  }

  __setProp_rd_qualH_(): any {
    this.setRadioProps(this.rd_qualH, 'qualGroup');
  }

  __setProp_rd_qualM_(): any {
    this.setRadioProps(this.rd_qualM, 'qualGroup');
  }

  __setProp_rd_qualL_(): any {
    this.setRadioProps(this.rd_qualL, 'qualGroup');
  }

  __setProp_rd_partH_(): any {
    this.setRadioProps(this.rd_partH, 'partGroup');
  }

  __setProp_rd_partM_(): any {
    this.setRadioProps(this.rd_partM, 'partGroup');
  }

  __setProp_rd_partL_(): any {
    this.setRadioProps(this.rd_partL, 'partGroup');
  }

  __setProp_cb_light_(): any {
    this.setCheckProps(this.cb_light);
  }

  __setProp_cb_shake_(): any {
    this.setCheckProps(this.cb_shake);
  }

  __setProp_cb_bloody_(): any {
    this.setCheckProps(this.cb_bloody);
  }

  __setProp_rd_bloodH_(): any {
    this.setRadioProps(this.rd_bloodH, 'partBlood');
  }

  __setProp_rd_bloodM_(): any {
    this.setRadioProps(this.rd_bloodM, 'partBlood');
  }

  __setProp_rd_bloodL_(): any {
    this.setRadioProps(this.rd_bloodL, 'partBlood');
  }

  __setProp_cb_music_(): any {
    this.setCheckProps(this.cb_music);
  }

  __setProp_cb_sound_(): any {
    this.setCheckProps(this.cb_sound);
  }

  __setProp_cb_voices_(): any {
    this.setCheckProps(this.cb_voices);
  }

  frame15(): any {
    this.__setProp_cb_voices_();
    this.__setProp_cb_sound_();
    this.__setProp_cb_music_();
    this.__setProp_rd_bloodL_();
    this.__setProp_rd_bloodM_();
    this.__setProp_rd_bloodH_();
    this.__setProp_cb_bloody_();
    this.__setProp_cb_shake_();
    this.__setProp_cb_light_();
    this.__setProp_rd_partL_();
    this.__setProp_rd_partM_();
    this.__setProp_rd_partH_();
    this.__setProp_rd_qualL_();
    this.__setProp_rd_qualM_();
    this.__setProp_rd_qualH_();
    this.InitPause();
  }

  frame74(): any {
    this.startGame();
  }

  frame104(): any {
    this.gotoAndStop('idle');
  }

  frame105(): any {
    this.InitEnd();
  }

  frame255(): any {
    this.EndGame();
  }
}
