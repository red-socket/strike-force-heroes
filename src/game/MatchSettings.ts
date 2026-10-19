// Port of MatchSettings.as — static quickmatch/campaign configuration (decides the map before Game is
// constructed) plus the per-match score keeper (instance, owned by Game).
import { int, uint } from '../flash/as3';
import type { Game } from './Game';
import { SD } from './SD';
import { ScoreBar } from './ScoreBar';
import { Stats_Classes } from './Stats_Classes';
import { Stats_Guns } from './Stats_Guns';
import { Stats_Maps } from './Stats_Maps';
import { Stats_Misc } from './Stats_Misc';
import { Stats_Skills } from './Stats_Skills';
import { Stats_Streaks } from './Stats_Streaks';
import { UT } from './UT';
import type { Container } from 'pixi.js';

/** AS3 Array.sortOn(field, Array.NUMERIC | Array.DESCENDING) */
function sortOnNumericDesc(ar: any[], field: string): void {
  ar.sort((a, b) => Number(b[field]) - Number(a[field]));
}

export class MatchSettings {
  static qmBotNames: string[] = null as any;
  static qmMap: string = null as any;
  static qmMode: string = null as any;
  static qmSoldiers = 0; // int
  static qmScore = 0; // uint
  static qmMod: string = null as any;
  static qmSkills = false;
  static qmStreaks = false;
  static qmTeams = false;
  static qmDiff = 0; // uint
  static qmBots0: any[] = null as any;
  static qmBots1: any[] = null as any;
  static qmBots2: any[] = null as any;
  static caStage = 0; // uint
  static caType = 0; // uint
  static caMap: string = null as any;
  static caMode: string = null as any;
  static caScore = 0; // uint
  static caDiff = 0; // uint
  static caSpecial: string = null as any;
  static caName: string = null as any;
  static caDesc: string = null as any;
  static caBots: any[] = null as any;
  static caPlayer: any = null;
  static preCutSong: any = undefined;
  static preCutFrames: any[] = null as any;
  static postCutSong: any = undefined;
  static postCutFrames: any[] = null as any;
  static useMap: any = null;
  static useMode: string = null as any;
  static useSoldiers = 0; // int
  static useScore = 0; // uint
  static useMod: string = null as any;
  static useSkills = false;
  static useStreaks = false;
  static useBots: any[] = null as any;
  static usePlayer: any = null;
  static useTeams = false;
  static useExtra: any = null;
  static useSong: any = undefined;
  static isCampaign = false;

  private game: Game;
  private initiated = false;
  private team0: any[] = null as any;
  private team1: any[] = null as any;
  private team2: any[] = null as any;
  team1score = 0; // int
  team2score = 0; // int
  private fc = 0; // uint

  constructor(param1: Game) {
    this.game = param1;
  }

  static Init(): void {
    MatchSettings.qmBotNames = [];
    MatchSettings.qmBotNames.push("GameBuilder15","Mir","Thrax","R3taliate","Dovahkiin","Caboose","Stg Don","Sir","Jack Krauser","Theraze","Noobkiller","Chickitay","Supa4ourz","Vagueshade","Yours Truly","Bullish","Masterfish","Juice_Box","Sundalo37","Sgt. Sledge","Hurmboy","Captain Boehlke","DB2016");
    MatchSettings.qmBotNames.push("Rising Legend","Standgrounding","Ec10125","Necro creed","Ecks2579","Vandroid X","legend2012","Cpt. Citrus","Dr. Ducko","Commandodude","xXNutron101Xx","The Operator","Roland","Malfurion","myguy25","Corporal Poy");
    MatchSettings.qmBotNames.push("Sgt. Johnson");
    MatchSettings.qmBotNames.push("J.A. Prufrock","J. Locke","J. Ramirez","M. McFly","P. North","S. Claus","T. Soprano","M. Corleone","C.F. Kane","J. Milton","A. Gold","N. Thompson","Pvt. Pile","N. Stark","J. McNulty","R. Hazuki","J.T. Kirk","Mischief","J. Matrix","J. Bond","J. Bourne","J. Bauer");
    MatchSettings.qmBotNames.push("JoeyJ","Saint","Morde","Garen","Goldeneye","PeeWee","Bravo","Johnson","MrMatrix","Jeepers","Polly","Donut","Raze");
    MatchSettings.qmBotNames.push("MaestroRage","WaterFlame","NemesisTheory","sonicmega");
    MatchSettings.qmMap = 'foundry';
    MatchSettings.qmMode = 'dm';
    MatchSettings.qmTeams = Boolean(0);
    MatchSettings.qmSoldiers = 0;
    MatchSettings.qmScore = 10;
    MatchSettings.qmMod = 'none';
    MatchSettings.qmSkills = true;
    MatchSettings.qmStreaks = true;
    MatchSettings.qmDiff = 1;
    MatchSettings.qmBots0 = [];
    MatchSettings.qmBots1 = [];
    MatchSettings.qmBots2 = [];
  }

  static addBot(param1: number): void {
    param1 = uint(param1);
    let _loc4_: string = null as any;
    let _loc6_ = 0;
    const _loc2_: any[] = (MatchSettings as any)['qmBots' + param1];
    let _loc3_ = false;
    while (!_loc3_) {
      _loc4_ = UT.randEl(MatchSettings.qmBotNames);
      _loc3_ = true;
      _loc6_ = 0;
      while (_loc6_ < _loc2_.length) {
        if (_loc2_[_loc6_].name == _loc4_) {
          _loc3_ = false;
        }
        _loc6_++;
      }
    }
    const _loc5_: any = {
      name: _loc4_,
      skin: param1 ? param1 + 1 : UT.irand(1, 5),
      team: param1,
      level: 1,
      extra: {},
    };
    _loc2_.push(_loc5_);
  }

  static remBot(param1: number): void {
    (MatchSettings as any)['qmBots' + uint(param1)].pop();
  }

  static setBotStats(param1: any): void {
    param1.diff = MatchSettings.qmDiff;
    param1.level = Stats_Classes.getAiLevel(MatchSettings.qmDiff);
    if (param1.level < 1) {
      param1.level = 1;
    }
    param1.soldier = !MatchSettings.useSoldiers ? UT.irand(1, 4) : MatchSettings.useSoldiers;
    param1.primary = Stats_Guns.getRandPrimary(param1);
    param1.secondary = Stats_Guns.getRandSecondary(param1);
    param1._skill = Stats_Skills.getRandSkill(param1);
    param1._streak = Stats_Streaks.getRandStreak(param1);
  }

  static startQuickmatch(): void {
    MatchSettings.isCampaign = false;
    MatchSettings.useMap = Stats_Maps.getMap(MatchSettings.qmMap);
    MatchSettings.useMode = MatchSettings.qmMode;
    MatchSettings.useSoldiers = MatchSettings.qmSoldiers;
    MatchSettings.useScore = MatchSettings.qmScore;
    MatchSettings.useMod = MatchSettings.qmMod;
    MatchSettings.useSkills = MatchSettings.qmSkills;
    MatchSettings.useStreaks = MatchSettings.qmStreaks;
    MatchSettings.useTeams = MatchSettings.qmTeams;
    MatchSettings.useExtra = {};
    MatchSettings.postCutFrames = [];
    MatchSettings.preCutFrames = [];
    MatchSettings.postCutSong = null;
    MatchSettings.preCutSong = null;
    if (!MatchSettings.useTeams) {
      MatchSettings.useBots = MatchSettings.qmBots0;
    } else {
      MatchSettings.useBots = MatchSettings.qmBots1.concat(MatchSettings.qmBots2);
    }
    let _loc1_ = 0;
    while (_loc1_ < MatchSettings.useBots.length) {
      MatchSettings.setBotStats(MatchSettings.useBots[_loc1_]);
      _loc1_++;
    }
    MatchSettings.updatePlayer();
  }

  static startCampaign(): void {
    MatchSettings.isCampaign = true;
    MatchSettings.useMap = Stats_Maps.getMap(MatchSettings.caMap);
    MatchSettings.useMode = MatchSettings.caMode;
    MatchSettings.useScore = MatchSettings.caScore;
    MatchSettings.useMod = '';
    MatchSettings.useSkills = true;
    MatchSettings.useStreaks = true;
    MatchSettings.useTeams = Stats_Misc.getGameMode(MatchSettings.useMode).teams == 2;
    MatchSettings.useBots = MatchSettings.caBots;
    if (!MatchSettings.caPlayer.soldier) {
      MatchSettings.useSoldiers = 0;
    } else {
      MatchSettings.useSoldiers = int(MatchSettings.caPlayer.soldier);
    }
    MatchSettings.updatePlayer();
  }

  static updatePlayer(): void {
    let _loc1_ = 0;
    const SDc = SD.classSaves as any[];
    if (!MatchSettings.isCampaign) {
      _loc1_ = !MatchSettings.useSoldiers ? uint(SD.selClass) : uint(MatchSettings.useSoldiers);
      MatchSettings.usePlayer = {};
      MatchSettings.usePlayer.name = SD.name;
      MatchSettings.usePlayer.soldier = _loc1_;
      MatchSettings.usePlayer.skin = !MatchSettings.qmTeams ? SDc[_loc1_].skin : 2;
      MatchSettings.usePlayer.team = !MatchSettings.useTeams ? 0 : 1;
      MatchSettings.usePlayer._skill = SDc[_loc1_].skill;
      MatchSettings.usePlayer._streak = SDc[_loc1_].streak;
      MatchSettings.usePlayer.primary = SDc[_loc1_].primary;
      MatchSettings.usePlayer.secondary = SDc[_loc1_].secondary;
      MatchSettings.usePlayer.level = SDc[_loc1_].level;
      MatchSettings.usePlayer.extra = {};
    } else {
      const caPlayer = MatchSettings.caPlayer;
      const usePlayer: any = (MatchSettings.usePlayer = {});
      usePlayer.name = !caPlayer.name ? SD.name : caPlayer.name;
      usePlayer.soldier = !caPlayer.soldier ? SD.selClass : caPlayer.soldier;
      usePlayer.skin = !caPlayer.skin ? SDc[usePlayer.soldier].skin : caPlayer.skin;
      usePlayer.team = caPlayer.team;
      usePlayer._skill = !caPlayer._skill ? SDc[usePlayer.soldier].skill : caPlayer._skill;
      usePlayer._streak = !caPlayer._streak ? SDc[usePlayer.soldier].streak : caPlayer._streak;
      usePlayer.primary = !caPlayer.primary ? SDc[usePlayer.soldier].primary : caPlayer.primary;
      usePlayer.secondary = !caPlayer.secondary ? SDc[usePlayer.soldier].secondary : caPlayer.secondary;
      usePlayer.level = SDc[usePlayer.soldier].level;
      usePlayer.extra = caPlayer.extra;
    }
    MatchSettings.usePlayer.diff = 10;
  }

  Init(): void {
    let _loc1_ = 0;
    this.initiated = true;
    if (MatchSettings.useTeams) {
      this.team1 = [];
      this.team2 = [];
      _loc1_ = 0;
      while (_loc1_ < this.game.units.length) {
        (this as any)['team' + this.game.units[_loc1_].team].push(this.game.units[_loc1_]);
        _loc1_++;
      }
      this.game.hud.setScoreBar(1, 0, 2, 0);
    } else {
      this.team0 = this.game.units.concat();
      this.game.hud.setScoreBar(
        this.game.player.team,
        this.game.player.pscore,
        this.game.units[1].team,
        this.game.units[1].pscore,
      );
    }
    this.updateScores();
  }

  EnterFrame(): void {
    let _loc1_ = 0;
    this.fc = uint(this.fc + 1);
    if (MatchSettings.useMode == 'dom' && this.fc % (30 * 3) == 0) {
      _loc1_ = 0;
      while (_loc1_ < this.game.arena.holdpoints.length) {
        if (this.game.arena.holdpoints[_loc1_].curTeam) {
          ++this.game.arena.holdpoints[_loc1_].unitCaptured.pscore;
        }
        _loc1_++;
      }
      this.updateScores();
    }
  }

  updateScores(): void {
    let _loc2_ = 0;
    if (this.initiated) {
      let _loc1_: any = null;
      switch (MatchSettings.useMode) {
        case 'dm':
        case 'zom':
        case 'jug':
          _loc2_ = 0;
          while (_loc2_ < this.team0.length) {
            if (!this.team0[_loc2_].human && (!_loc1_ || this.team0[_loc2_].pscore > _loc1_.pscore)) {
              _loc1_ = this.team0[_loc2_];
            }
            if (this.team0[_loc2_].pscore >= MatchSettings.useScore) {
              this.team0[_loc2_].pscore = MatchSettings.useScore;
              this.game.endGame(this.team0[_loc2_].human);
            }
            _loc2_++;
          }
          this.game.hud.setScoreBar(this.game.player.team, this.game.player.pscore, _loc1_.team, _loc1_.pscore);
          break;
        case 'tdm':
        case 'dom':
        case 'ctf':
          sortOnNumericDesc(this.team1, 'pscore');
          sortOnNumericDesc(this.team2, 'pscore');
          this.team1score = 0;
          _loc2_ = 0;
          while (_loc2_ < this.team1.length) {
            this.team1score = int(this.team1score + this.team1[_loc2_].pscore);
            _loc2_++;
          }
          this.team2score = 0;
          _loc2_ = 0;
          while (_loc2_ < this.team2.length) {
            this.team2score = int(this.team2score + this.team2[_loc2_].pscore);
            _loc2_++;
          }
          if (this.team1score >= MatchSettings.useScore) {
            this.team1score = int(MatchSettings.useScore);
            this.game.endGame(true);
          } else if (this.team2score >= MatchSettings.useScore) {
            this.team2score = int(MatchSettings.useScore);
            this.game.endGame(false);
          }
          this.game.hud.setScoreBar(1, this.team1score, 2, this.team2score);
      }
      return;
    }
  }

  showScores(param1: Container): void {
    let _loc3_ = 0;
    let _loc4_ = 0;
    let _loc5_ = 0;
    let _loc2_ = 0;
    const self = this as any;
    param1.addChild(new ScoreBar(_loc2_, null, 'top'));
    if (MatchSettings.useTeams) {
      sortOnNumericDesc(this.team1, 'pscore');
      sortOnNumericDesc(this.team2, 'pscore');
      this.team1score = 0;
      _loc3_ = 0;
      while (_loc3_ < this.team1.length) {
        this.team1score = int(this.team1score + this.team1[_loc3_].pscore);
        _loc3_++;
      }
      this.team2score = 0;
      _loc3_ = 0;
      while (_loc3_ < this.team2.length) {
        this.team2score = int(this.team2score + this.team2[_loc3_].pscore);
        _loc3_++;
      }
      if (this.team1score > MatchSettings.useScore) {
        this.team1score = int(MatchSettings.useScore);
      }
      if (this.team2score > MatchSettings.useScore) {
        this.team2score = int(MatchSettings.useScore);
      }
      if (this.team1score < this.team2score) {
        _loc4_ = 2;
        _loc5_ = 1;
      } else {
        _loc4_ = 1;
        _loc5_ = 2;
      }
      param1.addChild(
        new ScoreBar(
          (_loc2_ = _loc2_ + 20),
          null,
          'team' + _loc4_ + '_player',
          (_loc4_ != 1 ? 'Orange' : 'Blue') + ' Team',
          self['team' + _loc4_ + 'score'],
        ),
      );
      _loc3_ = 0;
      while (_loc3_ < self['team' + _loc4_].length) {
        if (!self['team' + _loc4_][_loc3_].unitInfo.extra.noSpawn) {
          param1.addChild(new ScoreBar((_loc2_ = _loc2_ + 20), self['team' + _loc4_][_loc3_]));
        }
        _loc3_++;
      }
      param1.addChild(
        new ScoreBar(
          (_loc2_ = _loc2_ + 20),
          null,
          'team' + _loc5_ + '_player',
          (_loc5_ != 1 ? 'Orange' : 'Blue') + ' Team',
          self['team' + _loc5_ + 'score'],
        ),
      );
      _loc3_ = 0;
      while (_loc3_ < self['team' + _loc5_].length) {
        if (!self['team' + _loc5_][_loc3_].unitInfo.extra.noSpawn) {
          param1.addChild(new ScoreBar((_loc2_ = _loc2_ + 20), self['team' + _loc5_][_loc3_]));
        }
        _loc3_++;
      }
    } else {
      sortOnNumericDesc(this.team0, 'pscore');
      _loc3_ = 0;
      while (_loc3_ < this.team0.length) {
        if (!this.team0[_loc3_].unitInfo.extra.noSpawn) {
          param1.addChild(new ScoreBar((_loc2_ = _loc2_ + 20), this.team0[_loc3_]));
        }
        _loc3_++;
      }
    }
  }
}
