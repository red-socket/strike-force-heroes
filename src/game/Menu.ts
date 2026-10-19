// Port of Menu.as — main menu screen (symbol 1137). `menfr` (MBFZ_fla.Timeline_275, symbol 1132) holds one
// labelled keyframe per screen; each labelled frame's script calls `Menu(parent).Init()` (timelineScripts.ts),
// and TeamSelection_281's frame scripts call `Menu(parent.parent).setTeams(this, n)`.
// All interaction is code-driven: MouseDown/MouseUp/MouseWheel/KeyDown + hitTestPoint on timeline children.
import type { FlashKeyboardEvent } from '../flash/as3';
import { trace } from '../flash/as3';
import { hitTestPoint, mouseX, mouseY, Symbol } from '../flash/runtime';
import { setFlashMask, type SwfClip, type SwfTextField } from '../swf/display';
import { Graphics, type Container } from 'pixi.js';
import { Main, type Screen } from './Main';
import { SD } from './SD';
import { SH } from './SH';
import { UT } from './UT';
import { MatchSettings } from './MatchSettings';
import { Stats_Misc } from './Stats_Misc';
import { Stats_Maps } from './Stats_Maps';
import { Stats_Classes } from './Stats_Classes';
import { Stats_Campaign } from './Stats_Campaign';
import { Stats_Guns } from './Stats_Guns';
import { Stats_Skills } from './Stats_Skills';
import { Stats_Streaks } from './Stats_Streaks';
import { Stats_Achievements } from './Stats_Achievements';
import { Holder_Gun } from './Holder_Gun';
import { Holder_Skill } from './Holder_Skill';
import { Game } from './Game';
import { Cutscene } from './Cutscene';

/**
 * AS3 dynamic child access `parent.name` on a timeline clip: the named child on the current frame, or
 * null when it is not placed on that frame. (A null `parent` throws a TypeError, as in Flash.)
 */
function ch(parent: any, name: string): any {
  return parent.maybeChild(name);
}

export class Menu extends Symbol implements Screen {
  static CURPLAYLABEL: string = null!;

  get menumask() { return this.child<SwfClip>('menumask'); }
  get bg() { return this.child<SwfClip>('bg'); }
  get menfr() { return this.child<SwfClip>('menfr'); }

  private curLabel: string = null!;
  private curTab: string = null!;
  private tabbuts: any[] = null!;
  private tempbuts: any[] = null!;
  private main: Main;
  private tempAr: any[] = null!;
  private tempNum: number = NaN;
  private tempStr: string = null!;
  private tempOb: any = null;

  // --- port helpers (not in the AS3) ---
  /** Frame scripts of `menfr` are not re-entrant in Flash: a gotoAndStop issued while a frame script of the
   *  same clip runs queues the target frame's script until the current one returns. Init() is that
   *  frame script, so a nested Init() is deferred until the outer one finishes. */
  private initRunning = false;
  private initQueued = false;
  /** Emulated keyboard focus of the input TextField `txt_name` (home/play/name frames). */
  private nameFocus: SwfTextField | null = null;
  private nameCaret: Graphics | null = null;
  private caretTimer = 0;

  /** `this.menfr[name]` */
  private f(name: string): any {
    return this.menfr.maybeChild(name);
  }

  constructor(param1: Main, _param2?: Record<string, any>) {
    super('Menu');
    this.main = param1;
    this.tabbuts = ['play', 'soldiers', 'options', 'medals', 'tips', 'version'];
    this.menfr.stop();
    this.menumask.stop();
    SH.playMusic('M_Menu');
    if (!Menu.CURPLAYLABEL) {
      if (!SD.checkSave()) {
        this.menfr.gotoAndStop('name');
      }
    } else {
      this.curTab = this.tabbuts[0];
      this.f('btn_' + this.curTab).textColor = 16777215;
      this.menfr.gotoAndStop(Menu.CURPLAYLABEL);
    }
    trace(this.menfr.currentLabel);
    trace(this.menumask.currentLabel);
  }

  setTeams(param1: SwfClip, param2: number): void {
    let _loc3_ = 0; // uint
    ch(ch(param1, 'barp'), 'txt_name').text = SD.name;
    ch(ch(param1, 'barp'), 'txt_num').text = '1';
    ch(param1, 'barp').gotoAndStop(2);
    switch (param2) {
      case 1:
        MatchSettings.qmTeams = false;
        if (!MatchSettings.qmBots0.length) {
          MatchSettings.addBot(0);
        }
        _loc3_ = 0;
        while (_loc3_ < 11) {
          if (_loc3_ >= MatchSettings.qmBots0.length) {
            ch(param1, 'bar' + _loc3_).visible = false;
          } else {
            ch(ch(param1, 'bar' + _loc3_), 'txt_name').text = MatchSettings.qmBots0[_loc3_].name;
            ch(ch(param1, 'bar' + _loc3_), 'txt_num').text = '' + (_loc3_ + 2);
            ch(param1, 'bar' + _loc3_).visible = true;
          }
          _loc3_++;
        }
        ch(param1, 'bt_rem0').visible = MatchSettings.qmBots0.length > 1;
        ch(param1, 'bt_add0').visible = MatchSettings.qmBots0.length < 11;
        break;
      case 2:
        MatchSettings.qmTeams = true;
        _loc3_ = 0;
        while (_loc3_ < 5) {
          if (_loc3_ >= MatchSettings.qmBots1.length) {
            ch(param1, 'bar1_' + _loc3_).visible = false;
          } else {
            ch(ch(param1, 'bar1_' + _loc3_), 'txt_name').text = MatchSettings.qmBots1[_loc3_].name;
            ch(ch(param1, 'bar1_' + _loc3_), 'txt_num').text = '' + (_loc3_ + 2);
            ch(param1, 'bar1_' + _loc3_).visible = true;
          }
          _loc3_++;
        }
        ch(param1, 'bt_rem1').visible = MatchSettings.qmBots1.length > 0;
        ch(param1, 'bt_add1').visible = MatchSettings.qmBots1.length < 5;
        if (!MatchSettings.qmBots2.length) {
          MatchSettings.addBot(2);
        }
        _loc3_ = 0;
        while (_loc3_ < 6) {
          if (_loc3_ >= MatchSettings.qmBots2.length) {
            ch(param1, 'bar2_' + _loc3_).visible = false;
          } else {
            ch(ch(param1, 'bar2_' + _loc3_), 'txt_name').text = MatchSettings.qmBots2[_loc3_].name;
            ch(ch(param1, 'bar2_' + _loc3_), 'txt_num').text = '' + (_loc3_ + 1);
            ch(param1, 'bar2_' + _loc3_).visible = true;
          }
          _loc3_++;
        }
        ch(param1, 'bt_rem2').visible = MatchSettings.qmBots2.length > 1;
        ch(param1, 'bt_add2').visible = MatchSettings.qmBots2.length < 6;
    }
  }

  Init(): void {
    if (this.initRunning) {
      this.initQueued = true;
      return;
    }
    this.initRunning = true;
    try {
      this.InitBody();
    } finally {
      this.initRunning = false;
    }
    if (this.initQueued) {
      this.initQueued = false;
      this.Init();
    }
  }

  /** Body of AS3 Menu.Init(). */
  private InitBody(): void {
    let _loc1_ = 0; // uint
    let _loc2_: any = null;
    let _loc3_: any = undefined;
    let _loc4_: Holder_Gun = null!;
    let _loc5_: Holder_Skill = null!;
    this.curLabel = this.menfr.currentLabel!;
    this.f('bg').gotoAndPlay(this.bg.currentFrame);
    this.menumask.gotoAndStop(this.menfr.currentFrame);
    if (this.curLabel == 'campaign' || this.curLabel == 'quickmatch' || this.curLabel == 'challenges') {
      Menu.CURPLAYLABEL = this.curLabel;
    }
    _loc1_ = 0;
    while (_loc1_ < this.tabbuts.length) {
      this.f('btn_' + this.tabbuts[_loc1_]).textColor = 13421772;
      _loc1_++;
    }
    if (this.curTab) {
      this.f('btn_' + this.curTab).textColor = 16777215;
    }
    switch (this.curLabel) {
      case 'play':
        this.f('newsbox').visible = false;
        if (Menu.CURPLAYLABEL) {
          this.menfr.gotoAndStop(Menu.CURPLAYLABEL);
        }
        if (Main.NEWS) {
          this.f('newsbox').visible = true;
          ch(this.f('newsbox'), 'txt_news').text = Main.NEWS;
        }
      // falls through
      case 'home':
      case 'name':
        this.f('txt_name').text = SD.name;
        break;
      case 'quickmatch':
        if (!(SD.curCampaign == 1 && !SD.warnQuickmatch)) {
          Stats_Misc.buildModList();
          _loc2_ = Stats_Maps.getMap(MatchSettings.qmMap);
          this.f('mc_map').gotoAndStop(_loc2_.id);
          this.f('txt_name').text = _loc2_.name;
          this.f('txt_mapdesc').text = _loc2_.desc;
          _loc1_ = 0;
          while (_loc1_ < Stats_Misc.gameModes.length) {
            this.f('mc_icon' + _loc1_).gotoAndStop(Stats_Misc.getGameMode(Stats_Misc.gameModes[_loc1_]).sprite);
            this.f('mc_icon' + _loc1_).alpha = Stats_Misc.gameModes[_loc1_] != MatchSettings.qmMode ? 0.5 : 1;
            _loc1_++;
          }
          this.tempOb = Stats_Misc.getGameMode(MatchSettings.qmMode);
          this.f('txt_mode').text = this.tempOb.name;
          this.f('txt_desc').text = this.tempOb.desc;
          this.f('txt_scoretype').text = this.tempOb.scoretype;
          this.f('txt_type').text = this.tempOb.teams != 1 ? 'Blue vs Orange' : 'Free for All';
          if (this.f('mc_teams').currentFrame != this.tempOb.teams) {
            this.f('mc_teams').gotoAndStop('teams_' + this.tempOb.teams);
          } else {
            this.setTeams(this.f('mc_teams'), this.tempOb.teams);
          }
          this.f('txt_score').text = String(MatchSettings.qmScore);
          this.f('txt_soldiers').text = MatchSettings.qmSoldiers ? Stats_Classes.getClass(MatchSettings.qmSoldiers).name + 's Only' : 'All';
          this.f('txt_skills').text = !MatchSettings.qmSkills ? 'Disabled' : 'Enabled';
          this.f('txt_streaks').text = !MatchSettings.qmStreaks ? 'Disabled' : 'Enabled';
          this.f('txt_modifier').text = Stats_Misc.getMod(MatchSettings.qmMod).name;
          this.f('txt_moddesc').text = Stats_Misc.getMod(MatchSettings.qmMod).desc;
          this.f('txt_modexp').text = Stats_Misc.getMod(MatchSettings.qmMod).exp;
          this.f('txt_diff').text = Stats_Classes.getDiffName(MatchSettings.qmDiff);
          this.f('txt_recc').text = 'Recommended Level: ' + Stats_Classes.getReccLevel(MatchSettings.qmDiff);
          this.tempAr = ['pscore', 'nscore', 'psoldiers', 'nsoldiers', 'pskills', 'nskills', 'pstreaks', 'nstreaks', 'pmod', 'nmod', 'pdiff', 'ndiff'];
          break;
        }
        SD.warnQuickmatch = true;
        this.menfr.gotoAndStop('toquickmatch');
        break;
      case 'campaign':
        MatchSettings.caType = 0;
        _loc1_ = 1;
        while (_loc1_ <= 15) {
          ch(this.f('bar' + _loc1_), 'txt_num').text = '' + _loc1_;
          if (_loc1_ > SD.curCampaign) {
            ch(this.f('bar' + _loc1_), 'txt_name').text = 'Locked';
            this.f('bar' + _loc1_).alpha = 0.5;
          } else {
            Stats_Campaign.setMatch(_loc1_, true);
            ch(this.f('bar' + _loc1_), 'txt_name').text = MatchSettings.caName;
          }
          _loc1_++;
        }
        ch(this.f('mc_map'), 'bt_prev').visible = false;
        ch(this.f('mc_map'), 'bt_next').visible = false;
        this.selectMission(SD.curCampaign);
        break;
      case 'challenges':
        if (!(SD.curChallenge == 1 && SD.curCampaign <= 7 && !SD.warnChallenges)) {
          MatchSettings.caType = 1;
          _loc1_ = 1;
          while (_loc1_ <= 15) {
            ch(this.f('bar' + _loc1_), 'txt_num').text = '' + _loc1_;
            if (_loc1_ > SD.curChallenge) {
              ch(this.f('bar' + _loc1_), 'txt_name').text = 'Locked';
              this.f('bar' + _loc1_).alpha = 0.5;
            } else {
              Stats_Campaign.setMatch(_loc1_, true);
              ch(this.f('bar' + _loc1_), 'txt_name').text = MatchSettings.caName;
            }
            _loc1_++;
          }
          ch(this.f('mc_map'), 'bt_prev').visible = false;
          ch(this.f('mc_map'), 'bt_next').visible = false;
          this.selectMission(SD.curChallenge);
          break;
        }
        SD.warnChallenges = true;
        this.menfr.gotoAndStop('tochallenges');
        break;
      case 'soldiers': {
        const cs = SD.cls(SD.selClass);
        _loc1_ = 1;
        while (_loc1_ <= 4) {
          this.f('bt_icon' + _loc1_).alpha = 0.5;
          this.f('bt_icon' + _loc1_).gotoAndStop(Stats_Classes.getClass(_loc1_).icon);
          _loc1_++;
        }
        this.f('bt_icon' + SD.selClass).alpha = 1;
        _loc1_ = 1;
        while (_loc1_ <= 5) {
          this.f('bt_color' + _loc1_).alpha = 0.5;
          this.f('bt_color' + _loc1_).gotoAndStop(_loc1_);
          _loc1_++;
        }
        this.f('bt_color' + cs.skin).alpha = 1;
        this.f('txt_classname').text = Stats_Classes.getClass(SD.selClass).name;
        this.f('txt_level').text = 'Level ' + cs.level;
        const bar_exp = this.f('bar_exp');
        bar_exp.scripted = true;
        if (cs.level != 50) {
          this.f('txt_exp').text = 'Exp ' + cs.exp + ' / ' + Stats_Classes.getNextExp(cs.level);
          bar_exp.width = (cs.exp / Stats_Classes.getNextExp(cs.level)) * 220;
        } else {
          this.f('txt_exp').text = 'Level Maxed';
          bar_exp.width = 220;
        }
        _loc3_ = Stats_Classes.getClass(SD.selClass).startFrame + cs.skin;
        const char = this.f('char');
        ch(char, 'headhold').gotoAndStop(_loc3_);
        ch(char, 'body').gotoAndStop(_loc3_);
        ch(char, 'legup1').gotoAndStop(_loc3_);
        ch(ch(char, 'legup1'), 'gun').visible = false;
        ch(char, 'legup2').gotoAndStop(_loc3_);
        ch(ch(char, 'legup2'), 'gun').visible = false;
        ch(char, 'leglow1').gotoAndStop(_loc3_);
        ch(char, 'leglow2').gotoAndStop(_loc3_);
        ch(char, 'foot1').gotoAndStop(_loc3_);
        ch(char, 'foot2').gotoAndStop(_loc3_);
        ch(char, 'gun').gotoAndStop(Stats_Guns.gunOb[cs.primary].sprite);
        ch(ch(char, 'arm1hold'), 'armup1').gotoAndStop(_loc3_);
        ch(ch(char, 'arm1hold'), 'armlow1').gotoAndStop(_loc3_);
        ch(ch(char, 'arm1hold'), 'hand1').gotoAndStop(_loc3_);
        ch(ch(char, 'arm1hold'), 'hand2').gotoAndStop(_loc3_);
        ch(ch(char, 'arm1hold'), 'gun').gotoAndStop(Stats_Guns.gunOb[cs.secondary].sprite);
        ch(this.f('bt_primary'), 'mc_gun').setGun(Stats_Guns.gunOb[cs.primary], 'Primary');
        ch(this.f('bt_secondary'), 'mc_gun').setGun(Stats_Guns.gunOb[cs.secondary], 'Secondary');
        this.f('bt_skill').setSkill(Stats_Skills.skillOb[cs.skill]);
        this.f('bt_killstreak').setStreak(Stats_Streaks.streakOb[cs.streak]);
        if (!this.tempOb || !this.tempOb.hp) {
          this.tempOb = {
            hp: 0,
            aim: 0,
            amm: 0,
            crit: 0,
          };
        }
        if (this.tempStr == 'return') {
          ch(this.f('bt_primary'), 'mc_gun').modStats(true);
          ch(this.f('bt_secondary'), 'mc_gun').modStats(true);
        }
        this.tempStr = '';
        this.f('txt_funds').text = '$' + UT.addNumCommas(cs.funds);
        break;
      }
      case 'primary':
        this.f('txt_funds').text = '$' + UT.addNumCommas(SD.cls(SD.selClass).funds);
        ch(this.f('bt_gun'), 'mc_gun').setGun(Stats_Guns.gunOb[SD.cls(SD.selClass).primary], '', this.menfr);
        ch(this.f('bt_gun'), 'mc_gun').modStats(true);
        this.tempAr = [];
        this.tempStr = SD.cls(SD.selClass).primary;
        _loc1_ = 0;
        while (_loc1_ < Stats_Guns.classAr[SD.selClass].length) {
          _loc4_ = new Holder_Gun(Stats_Guns.classAr[SD.selClass][_loc1_]);
          _loc4_.y = _loc1_ * 95;
          this.tempAr.push(_loc4_);
          this.f('gunCont').addChild(_loc4_);
          if (_loc4_.gun.id == this.tempStr) {
            _loc4_.gotoAndStop(3);
          }
          _loc1_++;
        }
        setFlashMask(this.f('gunCont'), this.f('gunMask'));
        break;
      case 'secondary':
        this.f('txt_funds').text = '$' + UT.addNumCommas(SD.cls(SD.selClass).funds);
        ch(this.f('bt_gun'), 'mc_gun').setGun(Stats_Guns.gunOb[SD.cls(SD.selClass).secondary], '', this.menfr);
        ch(this.f('bt_gun'), 'mc_gun').modStats(true);
        this.tempAr = [];
        this.tempStr = SD.cls(SD.selClass).secondary;
        _loc1_ = 0;
        while (_loc1_ < Stats_Guns.classAr[0].length) {
          _loc4_ = new Holder_Gun(Stats_Guns.classAr[0][_loc1_]);
          _loc4_.y = _loc1_ * 95;
          this.tempAr.push(_loc4_);
          this.f('gunCont').addChild(_loc4_);
          if (_loc4_.gun.id == this.tempStr) {
            _loc4_.gotoAndStop(3);
          }
          _loc1_++;
        }
        setFlashMask(this.f('gunCont'), this.f('gunMask'));
        break;
      case 'skill':
        this.f('txt_funds').text = '$' + UT.addNumCommas(SD.cls(SD.selClass).funds);
        ch(this.f('bt_skillbox'), 'mc_skill').setSkill(Stats_Skills.skillOb[SD.cls(SD.selClass).skill]);
        ch(this.f('bt_skillbox'), 'mc_skill').setText(this.menfr);
        this.tempAr = [];
        this.tempStr = SD.cls(SD.selClass).skill;
        _loc1_ = 0;
        while (_loc1_ < Stats_Skills.classAr[SD.selClass].length) {
          _loc5_ = new Holder_Skill(Stats_Skills.classAr[SD.selClass][_loc1_]);
          _loc5_.y = _loc1_ * 95;
          this.tempAr.push(_loc5_);
          this.f('gunCont').addChild(_loc5_);
          if (_loc5_.skill!.id == this.tempStr) {
            _loc5_.gotoAndStop(3);
          }
          _loc1_++;
        }
        setFlashMask(this.f('gunCont'), this.f('gunMask'));
        break;
      case 'killstreak':
        this.f('txt_funds').text = '$' + UT.addNumCommas(SD.cls(SD.selClass).funds);
        ch(this.f('bt_skillbox'), 'mc_skill').setStreak(Stats_Streaks.streakOb[SD.cls(SD.selClass).streak]);
        ch(this.f('bt_skillbox'), 'mc_skill').setText(this.menfr);
        this.tempAr = [];
        this.tempStr = SD.cls(SD.selClass).streak;
        _loc1_ = 0;
        while (_loc1_ < Stats_Streaks.classAr[SD.selClass].length) {
          _loc5_ = new Holder_Skill(Stats_Streaks.classAr[SD.selClass][_loc1_]);
          _loc5_.y = _loc1_ * 95;
          this.tempAr.push(_loc5_);
          this.f('gunCont').addChild(_loc5_);
          if (_loc5_.streak!.id == this.tempStr) {
            _loc5_.gotoAndStop(3);
          }
          _loc1_++;
        }
        setFlashMask(this.f('gunCont'), this.f('gunMask'));
        break;
      case 'options':
        this.tempAr = [
          this.f('rd_qualL'),
          this.f('rd_qualM'),
          this.f('rd_qualH'),
          this.f('rd_partL'),
          this.f('rd_partM'),
          this.f('rd_partH'),
          this.f('cb_light'),
          this.f('cb_music'),
          this.f('cb_sound'),
          this.f('cb_voices'),
          this.f('cb_shake'),
          this.f('cb_bloody'),
          this.f('rd_bloodL'),
          this.f('rd_bloodM'),
          this.f('rd_bloodH'),
        ];
        if (SD.graphQual == 0) {
          this.f('rd_qualL').selected = true;
        }
        if (SD.graphQual == 1) {
          this.f('rd_qualM').selected = true;
        }
        if (SD.graphQual == 2) {
          this.f('rd_qualH').selected = true;
        }
        if (SD.graphPart == 0) {
          this.f('rd_partL').selected = true;
        }
        if (SD.graphPart == 1) {
          this.f('rd_partM').selected = true;
        }
        if (SD.graphPart == 2) {
          this.f('rd_partH').selected = true;
        }
        this.f('cb_light').selected = SD.graphLights;
        this.f('cb_music').selected = SD.music;
        this.f('cb_sound').selected = SD.sound;
        this.f('cb_voices').selected = SD.voices;
        this.f('cb_shake').selected = SD.screenShake;
        this.f('cb_bloody').selected = SD.screenBlood;
        if (SD.blood == 0) {
          this.f('rd_bloodL').selected = true;
        }
        if (SD.blood == 1) {
          this.f('rd_bloodM').selected = true;
        }
        if (SD.blood == 2) {
          this.f('rd_bloodH').selected = true;
        }
        // Dead code: no sl_music/sl_sound instances exist, so in Flash this line throws a TypeError
        // (swallowed by the release player) at the end of Init. Guarded here so nothing breaks.
        if (this.f('sl_music')) this.f('sl_music').value = SD.music;
        if (this.f('sl_sound')) this.f('sl_sound').value = SD.sound;
        break;
      case 'medals':
        _loc1_ = 0;
        while (_loc1_ < 10) {
          ch(this.f('ach' + _loc1_), 'txt_desc').text = Stats_Achievements.getAchievementNum(_loc1_).desc;
          if ((SD.achievements as any[]).indexOf(_loc1_) == -1) {
            if (Stats_Achievements.getAchievementNum(_loc1_).secret) {
              ch(this.f('ach' + _loc1_), 'txt_desc').text = 'Secret achievement';
            }
            this.f('ach' + _loc1_).gotoAndStop(2);
          } else {
            this.f('ach' + _loc1_).gotoAndStop(1);
          }
          ch(this.f('ach' + _loc1_), 'icon').gotoAndStop(Stats_Achievements.achOrder[_loc1_]);
          ch(this.f('ach' + _loc1_), 'txt_name').text = Stats_Achievements.getAchievementNum(_loc1_).name;
          if (!Stats_Achievements.getAchievementNum(_loc1_).unlock) {
            ch(this.f('ach' + _loc1_), 'txt_unlock').text = '';
          } else {
            ch(this.f('ach' + _loc1_), 'txt_unlock').text = 'Unlocks ' + Stats_Misc.getMod(Stats_Achievements.getAchievementNum(_loc1_).unlock).name + ' mod';
          }
          _loc1_++;
        }
    }
  }

  EnterFrame(): void {
    let _loc1_ = 0; // uint
    let _loc2_: any = null;
    _loc1_ = 0;
    while (_loc1_ < this.tabbuts.length) {
      if (this.curTab != this.tabbuts[_loc1_]) {
        if (!this.ht(this.f('btn_' + this.tabbuts[_loc1_]))) {
          this.f('btn_' + this.tabbuts[_loc1_]).alpha = 0.5;
        } else {
          this.f('btn_' + this.tabbuts[_loc1_]).alpha = 1;
        }
      }
      _loc1_++;
    }
    SD.setLogos(this.f('logo1'), this.f('logo2'));
    switch (this.curLabel) {
      case 'play':
        if (this.f('bt_campaign')) {
          this.f('bt_campaign').alpha = !this.ht(this.f('bt_campaign')) ? 0.5 : 1;
        }
        if (this.f('bt_challenges')) {
          this.f('bt_challenges').alpha = !this.ht(this.f('bt_challenges')) ? 0.5 : 1;
        }
        if (this.f('bt_quickmatch')) {
          this.f('bt_quickmatch').alpha = !this.ht(this.f('bt_quickmatch')) ? 0.5 : 1;
        }
      // falls through
      case 'home':
        SD.name = this.f('txt_name').text;
        break;
      case 'name':
        SD.name = this.f('txt_name').text;
        if (!this.f('bt_continue')) {
          break;
        }
        this.f('bt_continue').alpha = !this.ht(this.f('bt_continue')) ? 0.5 : 1;
        break;
      case 'toquickmatch':
        if (this.f('bt_goto')) {
          this.f('bt_goto').alpha = !this.ht(this.f('bt_goto')) ? 0.5 : 1;
        }
        if (!this.f('bt_continue')) {
          break;
        }
        this.f('bt_continue').alpha = !this.ht(this.f('bt_continue')) ? 0.5 : 1;
        break;
      case 'tochallenges':
        if (this.f('bt_goto')) {
          this.f('bt_goto').alpha = !this.ht(this.f('bt_goto')) ? 0.5 : 1;
        }
        if (!this.f('bt_continue')) {
          break;
        }
        this.f('bt_continue').alpha = !this.ht(this.f('bt_continue')) ? 0.5 : 1;
        break;
      case 'quickmatch': {
        const mc_map = this.f('mc_map');
        const mc_teams = this.f('mc_teams');
        ch(mc_map, 'bt_prev').alpha = !this.ht(ch(mc_map, 'bt_prev')) ? 0.5 : 1;
        ch(mc_map, 'bt_next').alpha = !this.ht(ch(mc_map, 'bt_next')) ? 0.5 : 1;
        this.f('bt_start').alpha = !this.ht(this.f('bt_start')) ? 0.5 : 1;
        this.f('bt_back').alpha = !this.ht(this.f('bt_back')) ? 0.5 : 1;
        if (ch(mc_teams, 'bt_add0')) {
          ch(mc_teams, 'bt_add0').alpha = !this.ht(ch(mc_teams, 'bt_add0')) ? 0.5 : 1;
        }
        if (ch(mc_teams, 'bt_add1')) {
          ch(mc_teams, 'bt_add1').alpha = !this.ht(ch(mc_teams, 'bt_add1')) ? 0.5 : 1;
        }
        if (ch(mc_teams, 'bt_add2')) {
          ch(mc_teams, 'bt_add2').alpha = !this.ht(ch(mc_teams, 'bt_add2')) ? 0.5 : 1;
        }
        if (ch(mc_teams, 'bt_rem0')) {
          ch(mc_teams, 'bt_rem0').alpha = !this.ht(ch(mc_teams, 'bt_rem0')) ? 0.5 : 1;
        }
        if (ch(mc_teams, 'bt_rem1')) {
          ch(mc_teams, 'bt_rem1').alpha = !this.ht(ch(mc_teams, 'bt_rem1')) ? 0.5 : 1;
        }
        if (ch(mc_teams, 'bt_rem2')) {
          ch(mc_teams, 'bt_rem2').alpha = !this.ht(ch(mc_teams, 'bt_rem2')) ? 0.5 : 1;
        }
        _loc1_ = 0;
        while (_loc1_ < Stats_Misc.gameModes.length) {
          if (Stats_Misc.gameModes[_loc1_] != MatchSettings.qmMode) {
            this.f('mc_icon' + _loc1_).alpha = !this.ht(this.f('mc_icon' + _loc1_)) ? 0.5 : 1;
          }
          _loc1_++;
        }
        _loc1_ = 0;
        while (_loc1_ < this.tempAr.length) {
          this.f('bt_' + this.tempAr[_loc1_]).alpha = !this.ht(this.f('bt_' + this.tempAr[_loc1_])) ? 0.2 : 1;
          _loc1_++;
        }
        break;
      }
      case 'campaign':
        _loc1_ = 1;
        while (_loc1_ <= SD.curCampaign) {
          if (_loc1_ != MatchSettings.caStage) {
            if (!this.ht(this.f('bar' + _loc1_))) {
              this.f('bar' + _loc1_).gotoAndStop(1);
            } else {
              this.f('bar' + _loc1_).gotoAndStop(2);
            }
          }
          _loc1_++;
        }
        this.f('bt_start').alpha = !this.ht(this.f('bt_start')) ? 0.5 : 1;
        this.f('bt_back').alpha = !this.ht(this.f('bt_back')) ? 0.5 : 1;
        break;
      case 'challenges':
        _loc1_ = 1;
        while (_loc1_ <= SD.curChallenge) {
          if (_loc1_ != MatchSettings.caStage) {
            if (!this.ht(this.f('bar' + _loc1_))) {
              this.f('bar' + _loc1_).gotoAndStop(1);
            } else {
              this.f('bar' + _loc1_).gotoAndStop(2);
            }
          }
          _loc1_++;
        }
        this.f('bt_start').alpha = !this.ht(this.f('bt_start')) ? 0.5 : 1;
        this.f('bt_back').alpha = !this.ht(this.f('bt_back')) ? 0.5 : 1;
        break;
      case 'soldiers': {
        _loc1_ = 1;
        while (_loc1_ <= 4) {
          if (SD.selClass != _loc1_) {
            if (!this.ht(this.f('bt_icon' + _loc1_))) {
              this.f('bt_icon' + _loc1_).alpha = 0.5;
            } else {
              this.f('bt_icon' + _loc1_).alpha = 0.8;
            }
          }
          _loc1_++;
        }
        _loc1_ = 1;
        while (_loc1_ <= 5) {
          if (SD.cls(SD.selClass).skin != _loc1_) {
            if (!this.ht(this.f('bt_color' + _loc1_))) {
              this.f('bt_color' + _loc1_).alpha = 0.5;
            } else {
              this.f('bt_color' + _loc1_).alpha = 0.8;
            }
          }
          _loc1_++;
        }
        _loc2_ = Stats_Classes.getClass(SD.selClass, SD.cls(SD.selClass).level);
        const bar_hp = this.scriptedChild('bar_hp');
        const bar_crit = this.scriptedChild('bar_crit');
        const bar_aim = this.scriptedChild('bar_aim');
        const bar_amm = this.scriptedChild('bar_amm');
        const box_hp = this.scriptedChild('box_hp');
        const box_crit = this.scriptedChild('box_crit');
        const box_aim = this.scriptedChild('box_aim');
        const box_amm = this.scriptedChild('box_amm');
        bar_hp.width += ((_loc2_.hp / 300) * 135 - bar_hp.width) * 0.3;
        bar_crit.width += ((_loc2_.crit / 50) * 135 - bar_crit.width) * 0.3;
        bar_aim.width += ((_loc2_.aim / 130) * 135 - bar_aim.width) * 0.3;
        bar_amm.width += ((_loc2_.amm / 300) * 135 - bar_amm.width) * 0.3;
        box_hp.width += ((_loc2_.hpMax / 300) * 135 - box_hp.width) * 0.3;
        box_crit.width += ((_loc2_.critMax / 50) * 135 - box_crit.width) * 0.3;
        box_aim.width += ((_loc2_.aimMax / 130) * 135 - box_aim.width) * 0.3;
        box_amm.width += ((_loc2_.ammMax / 300) * 135 - box_amm.width) * 0.3;
        this.tempOb.hp += (_loc2_.hp - this.tempOb.hp) * 0.5;
        this.tempOb.crit += (_loc2_.crit - this.tempOb.crit) * 0.5;
        this.tempOb.aim += (_loc2_.aim - this.tempOb.aim) * 0.5;
        this.tempOb.amm += (_loc2_.amm - this.tempOb.amm) * 0.5;
        this.f('txt_hp').text = Math.round(this.tempOb.hp) + '';
        this.f('txt_crit').text = Math.round(this.tempOb.crit) + '%';
        this.f('txt_aim').text = Math.round(this.tempOb.aim) + '%';
        this.f('txt_amm').text = Math.round(this.tempOb.amm) + '%';
        ch(this.f('bt_primary'), 'mc_gun').modStats();
        ch(this.f('bt_secondary'), 'mc_gun').modStats();
        if (!this.ht(ch(this.f('bt_primary'), 'mc_gun'))) {
          ch(this.f('bt_primary'), 'mc_gun').gotoAndStop(1);
        } else {
          ch(this.f('bt_primary'), 'mc_gun').gotoAndStop(2);
        }
        if (!this.ht(ch(this.f('bt_secondary'), 'mc_gun'))) {
          ch(this.f('bt_secondary'), 'mc_gun').gotoAndStop(1);
        } else {
          ch(this.f('bt_secondary'), 'mc_gun').gotoAndStop(2);
        }
        if (!this.ht(this.f('bt_skill'))) {
          this.f('bt_skill').gotoAndStop(1);
        } else {
          this.f('bt_skill').gotoAndStop(2);
        }
        if (!this.ht(this.f('bt_killstreak'))) {
          this.f('bt_killstreak').gotoAndStop(1);
          break;
        }
        this.f('bt_killstreak').gotoAndStop(2);
        break;
      }
      case 'primary':
      case 'secondary':
        this.f('scrollbar').EnterFrame(this.menfr);
        ch(this.f('bt_gun'), 'mc_gun').modStats();
        this.scriptedChild('gunCont').y = this.f('gunMask').y + this.f('scrollbar').scrollPos * (this.f('gunMask').height - this.unmaskedHeight(this.f('gunCont')));
        _loc1_ = 0;
        while (_loc1_ < this.tempAr.length) {
          if (this.tempAr[_loc1_].gun.id != this.tempStr) {
            if (!(this.ht(this.tempAr[_loc1_]) && this.ht(this.f('gunMask')))) {
              this.tempAr[_loc1_].gotoAndStop(1);
            } else {
              this.tempAr[_loc1_].gotoAndStop(2);
            }
          }
          _loc1_++;
        }
        this.f('bt_back').alpha = !this.ht(this.f('bt_back')) ? 0.5 : 1;
        this.f('bt_equip').alpha = !this.ht(this.f('bt_equip')) ? 0.5 : 1;
        break;
      case 'skill':
        this.f('scrollbar').EnterFrame(this.menfr);
        this.scriptedChild('gunCont').y = this.f('gunMask').y + this.f('scrollbar').scrollPos * (this.f('gunMask').height - this.unmaskedHeight(this.f('gunCont')));
        _loc1_ = 0;
        while (_loc1_ < this.tempAr.length) {
          if (this.tempAr[_loc1_].skill.id != this.tempStr) {
            if (!(this.ht(this.tempAr[_loc1_]) && this.ht(this.f('gunMask')))) {
              this.tempAr[_loc1_].gotoAndStop(1);
            } else {
              this.tempAr[_loc1_].gotoAndStop(2);
            }
          }
          _loc1_++;
        }
        this.f('bt_back').alpha = !this.ht(this.f('bt_back')) ? 0.5 : 1;
        this.f('bt_equip').alpha = !this.ht(this.f('bt_equip')) ? 0.5 : 1;
        break;
      case 'killstreak':
        this.f('scrollbar').EnterFrame(this.menfr);
        this.scriptedChild('gunCont').y = this.f('gunMask').y + this.f('scrollbar').scrollPos * (this.f('gunMask').height - this.unmaskedHeight(this.f('gunCont')));
        _loc1_ = 0;
        while (_loc1_ < this.tempAr.length) {
          if (this.tempAr[_loc1_].streak.id != this.tempStr) {
            if (!(this.ht(this.tempAr[_loc1_]) && this.ht(this.f('gunMask')))) {
              this.tempAr[_loc1_].gotoAndStop(1);
            } else {
              this.tempAr[_loc1_].gotoAndStop(2);
            }
          }
          _loc1_++;
        }
        this.f('bt_back').alpha = !this.ht(this.f('bt_back')) ? 0.5 : 1;
        this.f('bt_equip').alpha = !this.ht(this.f('bt_equip')) ? 0.5 : 1;
    }
    this.updateNameInput();
  }

  MouseDown(): void {
    let _loc1_ = 0; // uint
    this.focusNameInput();
    if (Boolean(this.f('logo1')) && Boolean(this.f('logo2'))) {
      SD.pressLogos(this, this.f('logo1'), this.f('logo2'), mouseX(this), mouseY(this));
    }
    _loc1_ = 0;
    while (_loc1_ < this.tabbuts.length) {
      if (!(this.curTab == this.tabbuts[_loc1_] && this.tabbuts[_loc1_] != 'play')) {
        if (this.ht(this.f('btn_' + this.tabbuts[_loc1_]))) {
          this.curTab = this.tabbuts[_loc1_];
          this.menfr.gotoAndStop(this.tabbuts[_loc1_]);
          SD.saveGame();
          if (this.curTab == 'soldiers') {
            switch (SD.selClass) {
              case 1:
                SH.playVoice(UT.randEl(['V_Medic1', 'V_Medic2']));
                break;
              case 2:
                SH.playVoice(UT.randEl(['V_Sniper1', 'V_Sniper2']));
                break;
              case 3:
                SH.playVoice(UT.randEl(['V_Soldier1', 'V_Soldier2']));
                break;
              case 4:
                SH.playVoice(UT.randEl(['V_Tank1', 'V_Tank2', 'V_Tank3']));
            }
          }
          SH.playSound('S_Click', true);
        }
      }
      _loc1_++;
    }
    switch (this.curLabel) {
      case 'play':
        if (this.ht(this.f('bt_campaign'))) {
          SH.playSound('S_Click', true);
          this.menfr.gotoAndStop('campaign');
        }
        if (this.ht(this.f('bt_challenges'))) {
          SH.playSound('S_Click', true);
          this.menfr.gotoAndStop('challenges');
        }
        if (this.ht(this.f('bt_quickmatch'))) {
          SH.playSound('S_Click', true);
          this.menfr.gotoAndStop('quickmatch');
        }
        if (!Main.DEBUGMODE) {
          break;
        }
        if (this.ht(this.f('bt_ucamp'))) {
          SH.playSound('S_Equip');
          SD.curCampaign = 15;
        }
        if (this.ht(this.f('bt_uchal'))) {
          SH.playSound('S_Equip');
          SD.curChallenge = 15;
        }
        if (this.ht(this.f('bt_msold'))) {
          SH.playSound('S_Equip');
          SD.cls(1).level = 50;
          SD.cls(2).level = 50;
          SD.cls(3).level = 50;
          SD.cls(4).level = 50;
        }
        if (this.ht(this.f('bt_mfund'))) {
          SH.playSound('S_Equip');
          SD.cls(1).funds = 999999;
          SD.cls(2).funds = 999999;
          SD.cls(3).funds = 999999;
          SD.cls(4).funds = 999999;
        }
        if (!this.ht(this.f('bt_reset'))) {
          break;
        }
        SH.playSound('S_rocketExplode');
        SD.eraseGame();
        SD.Init();
        this.f('txt_name').text = 'Player';
        break;
      case 'name':
        if (!this.ht(this.f('bt_continue'))) {
          break;
        }
        SH.playSound('S_Click', true);
        this.menfr.gotoAndStop('home');
        break;
      case 'toquickmatch':
        if (this.ht(this.f('bt_goto'))) {
          SH.playSound('S_Click', true);
          this.menfr.gotoAndStop('campaign');
        }
        if (!this.ht(this.f('bt_continue'))) {
          break;
        }
        SH.playSound('S_Click', true);
        this.menfr.gotoAndStop('quickmatch');
        break;
      case 'tochallenges':
        if (this.ht(this.f('bt_goto'))) {
          SH.playSound('S_Click', true);
          this.menfr.gotoAndStop('campaign');
        }
        if (!this.ht(this.f('bt_continue'))) {
          break;
        }
        SH.playSound('S_Click', true);
        this.menfr.gotoAndStop('challenges');
        break;
      case 'quickmatch':
        _loc1_ = 0;
        while (_loc1_ < Stats_Misc.gameModes.length) {
          if (Stats_Misc.gameModes[_loc1_] != MatchSettings.qmMode) {
            if (this.ht(this.f('mc_icon' + _loc1_))) {
              MatchSettings.qmMode = Stats_Misc.gameModes[_loc1_];
              MatchSettings.qmScore = Stats_Misc.getGameMode(MatchSettings.qmMode).startscore;
              this.Init();
            }
          }
          _loc1_++;
        }
        // Quirk (literal): Init() sits in the loop's update clause, so it runs after every iteration.
        for (_loc1_ = 0; _loc1_ < this.tempAr.length; this.Init(), _loc1_++) {
          if (!this.ht(this.f('bt_' + this.tempAr[_loc1_]))) {
            continue;
          }
          switch (this.tempAr[_loc1_]) {
            case 'pscore':
              MatchSettings.qmScore = UT.getNextEl(MatchSettings.qmScore, false, this.tempOb.scorelist);
              break;
            case 'nscore':
              MatchSettings.qmScore = UT.getNextEl(MatchSettings.qmScore, true, this.tempOb.scorelist);
              break;
            case 'psoldiers':
              --MatchSettings.qmSoldiers;
              if (MatchSettings.qmSoldiers < 0) {
                MatchSettings.qmSoldiers = 4;
              }
              break;
            case 'nsoldiers':
              ++MatchSettings.qmSoldiers;
              if (MatchSettings.qmSoldiers > 4) {
                MatchSettings.qmSoldiers = 0;
              }
              break;
            case 'pskills':
            case 'nskills':
              MatchSettings.qmSkills = !MatchSettings.qmSkills;
              break;
            case 'pstreaks':
            case 'nstreaks':
              MatchSettings.qmStreaks = !MatchSettings.qmStreaks;
              break;
            case 'pmod':
              MatchSettings.qmMod = UT.getNextEl(MatchSettings.qmMod, false, Stats_Misc.mods);
              break;
            case 'nmod':
              MatchSettings.qmMod = UT.getNextEl(MatchSettings.qmMod, true, Stats_Misc.mods);
              break;
            case 'pdiff':
              MatchSettings.qmDiff = UT.getNextEl(MatchSettings.qmDiff, false, [1, 3, 5, 7, 9]);
              break;
            case 'ndiff':
              MatchSettings.qmDiff = UT.getNextEl(MatchSettings.qmDiff, true, [1, 3, 5, 7, 9]);
          }
        }
        if (this.ht(ch(this.f('mc_teams'), 'bt_add0'))) {
          MatchSettings.addBot(0);
          trace('added');
          this.Init();
        }
        if (this.ht(ch(this.f('mc_teams'), 'bt_add1'))) {
          MatchSettings.addBot(1);
          this.Init();
        }
        if (this.ht(ch(this.f('mc_teams'), 'bt_add2'))) {
          MatchSettings.addBot(2);
          this.Init();
        }
        if (this.ht(ch(this.f('mc_teams'), 'bt_rem0'))) {
          MatchSettings.remBot(0);
          this.Init();
        }
        if (this.ht(ch(this.f('mc_teams'), 'bt_rem1'))) {
          MatchSettings.remBot(1);
          this.Init();
        }
        if (this.ht(ch(this.f('mc_teams'), 'bt_rem2'))) {
          MatchSettings.remBot(2);
          this.Init();
        }
        if (this.ht(ch(this.f('mc_map'), 'bt_next'))) {
          MatchSettings.qmMap = UT.getNextEl(MatchSettings.qmMap, true, Stats_Maps.mapOrder);
          this.Init();
        }
        if (this.ht(ch(this.f('mc_map'), 'bt_prev'))) {
          MatchSettings.qmMap = UT.getNextEl(MatchSettings.qmMap, false, Stats_Maps.mapOrder);
          this.Init();
        }
        if (this.ht(this.f('bt_start'))) {
          MatchSettings.startQuickmatch();
          this.main.startClass(Game);
        }
        if (!this.ht(this.f('bt_back'))) {
          break;
        }
        SH.playSound('S_Click', true);
        Menu.CURPLAYLABEL = '';
        this.menfr.gotoAndStop('play');
        break;
      case 'campaign':
        _loc1_ = 1;
        while (_loc1_ <= SD.curCampaign) {
          if (this.ht(this.f('bar' + _loc1_))) {
            this.selectMission(_loc1_);
          }
          _loc1_++;
        }
        if (this.ht(this.f('bt_start'))) {
          MatchSettings.startCampaign();
          if (!MatchSettings.preCutFrames) {
            this.main.startClass(Game);
          } else {
            this.main.startClass(Cutscene, { type: 'pre' });
          }
        }
        if (!this.ht(this.f('bt_back'))) {
          break;
        }
        SH.playSound('S_Click', true);
        Menu.CURPLAYLABEL = '';
        this.menfr.gotoAndStop('play');
        break;
      case 'challenges':
        _loc1_ = 1;
        while (_loc1_ <= SD.curChallenge) {
          if (this.ht(this.f('bar' + _loc1_))) {
            this.selectMission(_loc1_);
          }
          _loc1_++;
        }
        if (this.ht(this.f('bt_start'))) {
          MatchSettings.startCampaign();
          if (!MatchSettings.preCutFrames) {
            this.main.startClass(Game);
          } else {
            this.main.startClass(Cutscene, { type: 'pre' });
          }
        }
        if (!this.ht(this.f('bt_back'))) {
          break;
        }
        SH.playSound('S_Click', true);
        Menu.CURPLAYLABEL = '';
        this.menfr.gotoAndStop('play');
        break;
      case 'soldiers':
        _loc1_ = 1;
        while (_loc1_ <= 4) {
          if (SD.selClass != _loc1_) {
            if (this.ht(this.f('bt_icon' + _loc1_))) {
              SD.selClass = _loc1_;
              switch (_loc1_) {
                case 1:
                  SH.playVoice(UT.randEl(['V_Medic1', 'V_Medic2']));
                  break;
                case 2:
                  SH.playVoice(UT.randEl(['V_Sniper1', 'V_Sniper2']));
                  break;
                case 3:
                  SH.playVoice(UT.randEl(['V_Soldier1', 'V_Soldier2']));
                  break;
                case 4:
                  SH.playVoice(UT.randEl(['V_Tank1', 'V_Tank2', 'V_Tank3']));
              }
              this.Init();
            }
          }
          _loc1_++;
        }
        _loc1_ = 1;
        while (_loc1_ <= 5) {
          if (SD.cls(SD.selClass).skin != _loc1_) {
            if (this.ht(this.f('bt_color' + _loc1_))) {
              SD.cls(SD.selClass).skin = _loc1_;
              this.Init();
            }
          }
          _loc1_++;
        }
        if (!this.ht(ch(this.f('bt_primary'), 'mc_gun'))) {
          if (!this.ht(ch(this.f('bt_secondary'), 'mc_gun'))) {
            if (!this.ht(this.f('bt_skill'))) {
              if (!this.ht(this.f('bt_killstreak'))) {
                break;
              }
              SH.playSound('S_Click', true);
              this.menfr.gotoAndStop('killstreak');
              return;
            }
            SH.playSound('S_Click', true);
            this.menfr.gotoAndStop('skill');
            return;
          }
          SH.playSound('S_Click', true);
          this.menfr.gotoAndStop('secondary');
          return;
        }
        SH.playSound('S_Click', true);
        this.menfr.gotoAndStop('primary');
        return;
      case 'primary':
        this.f('scrollbar').MouseDown(this.menfr);
        _loc1_ = 0;
        while (_loc1_ < this.tempAr.length) {
          if (this.tempAr[_loc1_].gun.id != this.tempStr) {
            if (this.ht(this.tempAr[_loc1_]) && this.ht(this.f('gunMask'))) {
              this.tempAr[_loc1_].gotoAndStop(3);
              this.tempStr = this.tempAr[_loc1_].gun.id;
              ch(this.f('bt_gun'), 'mc_gun').setGun(this.tempAr[_loc1_].gun, '', this.menfr);
              if (SD.cls(SD.selClass).primary != this.tempAr[_loc1_].gun.id) {
                if (SD.cls(SD.selClass).level >= this.tempAr[_loc1_].gun.lvlReq) {
                  if (SD.unlocks.indexOf(this.tempAr[_loc1_].gun.id) == -1) {
                    if (SD.cls(SD.selClass).funds >= this.tempAr[_loc1_].gun.cost) {
                      this.f('bt_equip').textColor = 16776960;
                      this.f('bt_equip').text = 'Buy $' + this.tempAr[_loc1_].gun.cost;
                    } else {
                      this.f('bt_equip').textColor = 16750899;
                      this.f('bt_equip').text = 'Req $' + this.tempAr[_loc1_].gun.cost;
                    }
                  } else {
                    this.f('bt_equip').textColor = 16777215;
                    this.f('bt_equip').text = 'Equip';
                  }
                } else {
                  this.f('bt_equip').textColor = 16750899;
                  this.f('bt_equip').text = 'Req lvl ' + this.tempAr[_loc1_].gun.lvlReq;
                }
              } else {
                this.f('bt_equip').textColor = 13421772;
                this.f('bt_equip').text = 'Equipped';
              }
            }
          }
          _loc1_++;
        }
        if (!this.ht(this.f('bt_back'))) {
          if (!this.ht(this.f('bt_equip'))) {
            break;
          }
          if (this.f('bt_equip').text != 'Equip') {
            if (!(this.f('bt_equip').text.substring(0, 3) == 'Buy' && SD.cls(SD.selClass).funds >= Stats_Guns.gunOb[this.tempStr].cost)) {
              SH.playSound('S_Error');
            } else {
              SD.cls(SD.selClass).funds -= Stats_Guns.gunOb[this.tempStr].cost;
              SD.unlocks.push(this.tempStr);
              SD.cls(SD.selClass).primary = this.tempStr;
              this.tempStr = 'return';
              this.menfr.gotoAndStop('soldiers');
              Stats_Guns.checkWeapMedal();
              SH.playSound('S_Equip');
            }
          } else {
            SD.cls(SD.selClass).primary = this.tempStr;
            this.tempStr = 'return';
            this.menfr.gotoAndStop('soldiers');
            SH.playSound('S_Equip');
          }
          return;
        }
        SH.playSound('S_Click', true);
        this.tempStr = 'return';
        this.menfr.gotoAndStop('soldiers');
        return;
      case 'secondary':
        this.f('scrollbar').MouseDown(this.menfr);
        _loc1_ = 0;
        while (_loc1_ < this.tempAr.length) {
          if (this.tempAr[_loc1_].gun.id != this.tempStr) {
            if (this.ht(this.tempAr[_loc1_]) && this.ht(this.f('gunMask'))) {
              this.tempAr[_loc1_].gotoAndStop(3);
              this.tempStr = this.tempAr[_loc1_].gun.id;
              ch(this.f('bt_gun'), 'mc_gun').setGun(this.tempAr[_loc1_].gun, '', this.menfr);
              if (SD.cls(SD.selClass).secondary != this.tempAr[_loc1_].gun.id) {
                if (SD.cls(SD.selClass).level >= this.tempAr[_loc1_].gun.lvlReq) {
                  if (SD.unlocks.indexOf(this.tempAr[_loc1_].gun.id) == -1) {
                    if (SD.cls(SD.selClass).funds >= this.tempAr[_loc1_].gun.cost) {
                      this.f('bt_equip').textColor = 16776960;
                      this.f('bt_equip').text = 'Buy $' + this.tempAr[_loc1_].gun.cost;
                    } else {
                      this.f('bt_equip').textColor = 16750899;
                      this.f('bt_equip').text = 'Req $' + this.tempAr[_loc1_].gun.cost;
                    }
                  } else {
                    this.f('bt_equip').textColor = 16777215;
                    this.f('bt_equip').text = 'Equip';
                  }
                } else {
                  this.f('bt_equip').textColor = 16750899;
                  this.f('bt_equip').text = 'Req lvl ' + this.tempAr[_loc1_].gun.lvlReq;
                }
              } else {
                this.f('bt_equip').textColor = 13421772;
                this.f('bt_equip').text = 'Equipped';
              }
            }
          }
          _loc1_++;
        }
        if (this.ht(this.f('bt_back'))) {
          SH.playSound('S_Click', true);
          this.tempStr = 'return';
          this.menfr.gotoAndStop('soldiers');
          return;
        }
        if (!this.ht(this.f('bt_equip'))) {
          break;
        }
        if (this.f('bt_equip').text == 'Equip') {
          SD.cls(SD.selClass).secondary = this.tempStr;
          this.tempStr = 'return';
          this.menfr.gotoAndStop('soldiers');
          SH.playSound('S_Equip');
        } else if (!(this.f('bt_equip').text.substring(0, 3) == 'Buy' && SD.cls(SD.selClass).funds >= Stats_Guns.gunOb[this.tempStr].cost)) {
          SH.playSound('S_Error');
        } else {
          SD.cls(SD.selClass).funds -= Stats_Guns.gunOb[this.tempStr].cost;
          SD.unlocks.push(this.tempStr);
          SD.cls(SD.selClass).secondary = this.tempStr;
          this.tempStr = 'return';
          this.menfr.gotoAndStop('soldiers');
          SH.playSound('S_Equip');
        }
        return;
      case 'skill':
        this.f('scrollbar').MouseDown(this.menfr);
        _loc1_ = 0;
        while (_loc1_ < this.tempAr.length) {
          if (this.tempAr[_loc1_].skill.id != this.tempStr) {
            if (this.ht(this.tempAr[_loc1_]) && this.ht(this.f('gunMask'))) {
              this.tempAr[_loc1_].gotoAndStop(3);
              this.tempStr = this.tempAr[_loc1_].skill.id;
              ch(this.f('bt_skillbox'), 'mc_skill').setSkill(this.tempAr[_loc1_].skill);
              ch(this.f('bt_skillbox'), 'mc_skill').setText(this.menfr);
              if (SD.cls(SD.selClass).skill != this.tempAr[_loc1_].skill.id) {
                if (SD.cls(SD.selClass).level >= this.tempAr[_loc1_].skill.lvlReq) {
                  if (SD.unlocks.indexOf(this.tempAr[_loc1_].skill.id) == -1) {
                    if (SD.cls(SD.selClass).funds >= this.tempAr[_loc1_].skill.cost) {
                      this.f('bt_equip').textColor = 16776960;
                      this.f('bt_equip').text = 'Buy $' + this.tempAr[_loc1_].skill.cost;
                    } else {
                      this.f('bt_equip').textColor = 16750899;
                      this.f('bt_equip').text = 'Req $' + this.tempAr[_loc1_].skill.cost;
                    }
                  } else {
                    this.f('bt_equip').textColor = 16777215;
                    this.f('bt_equip').text = 'Equip';
                  }
                } else {
                  this.f('bt_equip').textColor = 16750899;
                  this.f('bt_equip').text = 'Req lvl ' + this.tempAr[_loc1_].skill.lvlReq;
                }
              } else {
                this.f('bt_equip').textColor = 13421772;
                this.f('bt_equip').text = 'Equipped';
              }
            }
          }
          _loc1_++;
        }
        if (!this.ht(this.f('bt_back'))) {
          if (!this.ht(this.f('bt_equip'))) {
            break;
          }
          if (this.f('bt_equip').text != 'Equip') {
            if (!(this.f('bt_equip').text.substring(0, 3) == 'Buy' && SD.cls(SD.selClass).funds >= Stats_Skills.skillOb[this.tempStr].cost)) {
              SH.playSound('S_Error');
            } else {
              SD.cls(SD.selClass).funds -= Stats_Skills.skillOb[this.tempStr].cost;
              SD.unlocks.push(this.tempStr);
              SD.cls(SD.selClass).skill = this.tempStr;
              this.tempStr = 'return';
              if (
                SD.unlocks.indexOf(Stats_Skills.classAr[SD.selClass][1].id) != -1 &&
                SD.unlocks.indexOf(Stats_Skills.classAr[SD.selClass][2].id) != -1 &&
                SD.unlocks.indexOf(Stats_Skills.classAr[SD.selClass][3].id) != -1 &&
                SD.unlocks.indexOf(Stats_Skills.classAr[SD.selClass][4].id) != -1
              ) {
                Stats_Achievements.setAchievement('allskills');
              }
              this.menfr.gotoAndStop('soldiers');
              SH.playSound('S_Equip');
            }
          } else {
            SD.cls(SD.selClass).skill = this.tempStr;
            this.tempStr = 'return';
            this.menfr.gotoAndStop('soldiers');
            SH.playSound('S_Equip');
          }
          return;
        }
        SH.playSound('S_Click', true);
        this.tempStr = 'return';
        this.menfr.gotoAndStop('soldiers');
        return;
      case 'killstreak':
        this.f('scrollbar').MouseDown(this.menfr);
        _loc1_ = 0;
        while (_loc1_ < this.tempAr.length) {
          if (this.tempAr[_loc1_].streak.id != this.tempStr) {
            if (this.ht(this.tempAr[_loc1_]) && this.ht(this.f('gunMask'))) {
              this.tempAr[_loc1_].gotoAndStop(3);
              this.tempStr = this.tempAr[_loc1_].streak.id;
              ch(this.f('bt_skillbox'), 'mc_skill').setStreak(this.tempAr[_loc1_].streak);
              ch(this.f('bt_skillbox'), 'mc_skill').setText(this.menfr);
              if (SD.cls(SD.selClass).streak != this.tempAr[_loc1_].streak.id) {
                if (SD.cls(SD.selClass).level >= this.tempAr[_loc1_].streak.lvlReq) {
                  if (SD.unlocks.indexOf(this.tempAr[_loc1_].streak.id) == -1) {
                    if (SD.cls(SD.selClass).funds >= this.tempAr[_loc1_].streak.cost) {
                      this.f('bt_equip').textColor = 16776960;
                      this.f('bt_equip').text = 'Buy $' + this.tempAr[_loc1_].streak.cost;
                    } else {
                      this.f('bt_equip').textColor = 16750899;
                      this.f('bt_equip').text = 'Req $' + this.tempAr[_loc1_].streak.cost;
                    }
                  } else {
                    this.f('bt_equip').textColor = 16777215;
                    this.f('bt_equip').text = 'Equip';
                  }
                } else {
                  this.f('bt_equip').textColor = 16750899;
                  this.f('bt_equip').text = 'Req lvl ' + this.tempAr[_loc1_].streak.lvlReq;
                }
              } else {
                this.f('bt_equip').textColor = 13421772;
                this.f('bt_equip').text = 'Equipped';
              }
            }
          }
          _loc1_++;
        }
        if (!this.ht(this.f('bt_back'))) {
          if (!this.ht(this.f('bt_equip'))) {
            break;
          }
          if (this.f('bt_equip').text != 'Equip') {
            if (!(this.f('bt_equip').text.substring(0, 3) == 'Buy' && SD.cls(SD.selClass).funds >= Stats_Streaks.streakOb[this.tempStr].cost)) {
              SH.playSound('S_Error');
            } else {
              SD.cls(SD.selClass).funds -= Stats_Streaks.streakOb[this.tempStr].cost;
              SD.unlocks.push(this.tempStr);
              SD.cls(SD.selClass).streak = this.tempStr;
              this.tempStr = 'return';
              if (
                SD.unlocks.indexOf(Stats_Streaks.classAr[SD.selClass][1].id) != -1 &&
                SD.unlocks.indexOf(Stats_Streaks.classAr[SD.selClass][2].id) != -1 &&
                SD.unlocks.indexOf(Stats_Streaks.classAr[SD.selClass][3].id) != -1 &&
                SD.unlocks.indexOf(Stats_Streaks.classAr[SD.selClass][4].id) != -1
              ) {
                Stats_Achievements.setAchievement('allstreaks');
              }
              this.menfr.gotoAndStop('soldiers');
              SH.playSound('S_Equip');
            }
          } else {
            SD.cls(SD.selClass).streak = this.tempStr;
            this.tempStr = 'return';
            this.menfr.gotoAndStop('soldiers');
            SH.playSound('S_Equip');
          }
          return;
        }
        SH.playSound('S_Click', true);
        this.tempStr = 'return';
        this.menfr.gotoAndStop('soldiers');
        return;
      case 'options':
        // The decompiled `while` never increments on `continue` (would hang); it is a decompiler artefact
        // of a plain for-loop (cf. Hud.as:591-596), ported as such.
        for (_loc1_ = 0; _loc1_ < this.tempAr.length; _loc1_++) {
          if (!hitTestPoint(this.tempAr[_loc1_], mouseX(this), mouseY(this))) {
            continue;
          }
          if (this.tempAr[_loc1_].label.charAt(0) == 'r') {
            this.tempAr[_loc1_].selected = true;
          } else {
            this.tempAr[_loc1_].enabled = false;
            this.tempAr[_loc1_].selected = !this.tempAr[_loc1_].selected;
          }
          switch (this.tempAr[_loc1_].label) {
            case 'rd_qualL':
              SD.graphQual = 0;
              (Main.STAGE as any).quality = 'low';
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
              SD.graphLights = this.f('cb_light').selected;
              break;
            case 'cb_music':
              SD.music = this.f('cb_music').selected;
              break;
            case 'cb_sound':
              SD.sound = this.f('cb_sound').selected;
              break;
            case 'cb_voices':
              SD.voices = this.f('cb_voices').selected;
              break;
            case 'cb_shake':
              SD.screenShake = this.f('cb_shake').selected;
              break;
            case 'cb_bloody':
              SD.screenBlood = this.f('cb_bloody').selected;
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
    }
  }

  selectMission(param1: any): void {
    this.f('bar' + param1).gotoAndStop(3);
    Stats_Campaign.setMatch(param1);
    this.f('mc_map').gotoAndStop(MatchSettings.caMap);
    this.f('txt_desc').text = MatchSettings.caDesc;
    this.f('txt_name').text = Stats_Maps.getMap(MatchSettings.caMap).name;
    this.f('txt_mapdesc').text = Stats_Maps.getMap(MatchSettings.caMap).desc;
    this.f('txt_mode').text = Stats_Misc.getGameMode(MatchSettings.caMode).name;
    this.f('txt_scoretype').text = Stats_Misc.getGameMode(MatchSettings.caMode).scoretype;
    this.f('txt_score').text = String(MatchSettings.caScore);
    this.f('txt_special').text = !MatchSettings.caSpecial ? 'None' : MatchSettings.caSpecial;
    this.f('txt_diff').text = Stats_Classes.getDiffName(MatchSettings.caDiff);
    this.f('txt_recc').text = 'Recommended Level: ' + Stats_Classes.getReccLevel(MatchSettings.caDiff);
    const _temp_1: any = ch(this.f('mc_map'), 'bt_prev');
    ch(this.f('mc_map'), 'bt_next').visible = false;
    _temp_1.visible = false;
  }

  ht(param1: any): boolean {
    return Boolean(param1) && Boolean(param1.visible) && this.hitTestMaskable(param1, mouseX(this), mouseY(this));
  }

  MouseUp(): void {
    let _loc1_ = 0; // uint
    switch (this.curLabel) {
      case 'primary':
      case 'secondary':
      case 'skill':
      case 'killstreak':
        this.f('scrollbar').MouseUp();
        break;
      case 'options':
        _loc1_ = 0;
        while (_loc1_ < this.tempAr.length) {
          this.tempAr[_loc1_].enabled = true;
          _loc1_++;
        }
    }
  }

  /** `param1` = MouseEvent.delta (Main.MouseWheel passes the wheel delta). */
  MouseWheel(param1: number): void {
    switch (this.curLabel) {
      case 'primary':
      case 'secondary':
      case 'skill':
      case 'killstreak':
        this.f('scrollbar').MouseUp();
        this.f('scrollbar').MouseWheel(param1);
    }
  }

  KeyDown(param1: FlashKeyboardEvent): void {
    this.nameInputKey(param1);
    if (Main.DEBUGMODE && param1.keyCode == 32) {
      SH.playSound('S_rocketExplode');
      SD.eraseGame();
      SD.Init();
      this.f('txt_name').text = 'Player';
    }
  }

  KeyUp(_param1: FlashKeyboardEvent): void {}

  flashActivate(): void {}

  flashDeactivate(): void {}

  // AS3 `private function destroy():void {}` — empty and never called; not ported under that name because
  // it would shadow Pixi's Container.destroy(), which Main.startClass relies on.

  // ------------------------------------------------------------------ port-only helpers

  /**
   * hitTestPoint that also works on an object currently used as a mask (`gunMask`): Pixi marks masks
   * `measurable = false`, so their bounds come back empty; Flash still hit-tests a mask's own shape box.
   */
  private hitTestMaskable(o: Container, x: number, y: number): boolean {
    if (o.measurable !== false) return hitTestPoint(o, x, y);
    o.measurable = true;
    try {
      return hitTestPoint(o, x, y);
    } finally {
      o.measurable = false;
    }
  }

  /**
   * Flash `height` of a masked container (`gunCont`): Pixi clips a masked object's bounds to the mask,
   * Flash does not. Union of the children's stage-space bounds (the menu is unscaled, so stage px = local px).
   */
  private unmaskedHeight(o: Container): number {
    let minY = Infinity;
    let maxY = -Infinity;
    for (const c of o.children) {
      if (!c.visible || !c.measurable) continue;
      const r = c.getBounds();
      if (r.width == 0 && r.height == 0) continue;
      minY = Math.min(minY, r.minY);
      maxY = Math.max(maxY, r.maxY);
    }
    return maxY > minY ? maxY - minY : 0;
  }

  /** Timeline child whose transform code takes over (AS3 assigns width/y): stop timeline overrides. */
  private scriptedChild(name: string): any {
    const o = this.f(name);
    o.scripted = true;
    return o;
  }

  /**
   * Flash input TextField emulation for `txt_name` (editable on the home/play/name frames): clicking the
   * field gives it keyboard focus, clicking elsewhere removes it (Main.startClass also resets stage focus,
   * so the field starts unfocused like in Flash).
   */
  private nameField(): SwfTextField | null {
    if (this.curLabel != 'home' && this.curLabel != 'play' && this.curLabel != 'name') return null;
    const t = this.f('txt_name') as SwfTextField | null;
    return t && !t.def.readOnly ? t : null;
  }

  private focusNameInput(): void {
    const t = this.nameField();
    this.setNameFocus(t && this.ht(t) ? t : null);
  }

  private setNameFocus(t: SwfTextField | null): void {
    if (this.nameCaret && this.nameCaret.parent !== t) {
      this.nameCaret.destroy();
      this.nameCaret = null;
    }
    this.nameFocus = t;
    this.caretTimer = 0;
    if (t && !this.nameCaret) {
      this.nameCaret = new Graphics().rect(0, 0, 1, t.def.size ?? 12).fill({ color: 0xcccccc });
      t.addChild(this.nameCaret);
    }
  }

  private nameInputKey(e: FlashKeyboardEvent): void {
    const t = this.nameFocus;
    if (!t || t.destroyed || !t.parent || t !== this.nameField()) return;
    if (e.keyCode == 8) {
      t.text = t.text.substring(0, t.text.length - 1);
    } else if (e.charCode >= 32 && !e.ctrlKey) {
      t.text = t.text + String.fromCharCode(e.charCode);
    }
    this.caretTimer = 0;
  }

  private updateNameInput(): void {
    const t = this.nameFocus;
    if (t && (t.destroyed || !t.parent || t !== this.nameField())) {
      this.setNameFocus(null);
      return;
    }
    if (!t || !this.nameCaret) return;
    const field = t.children[0] as Container;
    const [x0, y0] = t.def.bounds;
    this.nameCaret.x = t.text.length ? field.x + field.width + 1 : x0 + 2;
    this.nameCaret.y = y0 + 2;
    this.nameCaret.visible = this.caretTimer++ % 30 < 15;
  }
}
