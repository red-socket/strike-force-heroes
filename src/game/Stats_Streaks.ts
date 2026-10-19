// Port of Stats_Streaks.as — killstreak definitions per class. Voice classes (V_k*) are stored
// as class-name strings (SH.playVoice accepts them).
// Note (kept): streakOb is keyed by id, so later duplicates overwrite earlier ones.
import { int, uint } from '../flash/as3';
import { UT } from './UT';
import { Stats_Classes } from './Stats_Classes';

export class Stats_Streaks {
  static streakOb: Record<string, Stats_Streaks>;

  static streakAr: Stats_Streaks[];

  static classAr: Stats_Streaks[][];

  id!: string;

  sprite!: string;

  name!: string;

  global = false;

  /** AS3 int */
  cost = 0;

  /** AS3 uint */
  lvlReq = 0;

  kills = NaN;

  special!: string;

  desc!: string;

  allyUse!: string;

  /** voice class name (string) or null */
  allySound: any = undefined;

  enemyUse!: string;

  /** voice class name (string) or null */
  enemySound: any = undefined;

  static Init(): void {
    Stats_Streaks.streakOb = {};
    Stats_Streaks.streakAr = [];
    Stats_Streaks.classAr = [];
    let _loc1_: any = 0;
    while(_loc1_ < 5)
    {
      Stats_Streaks.classAr.push([]);
      _loc1_++;
    }
    Stats_Streaks.addStreak(0,"hotdog","none","None",false,0,1,0,"","No killstreak equipped.","",null,"",null);
    Stats_Streaks.addStreak(1,"none","none","None",false,0,1,0,"","No killstreak equipped.","",null,"",null);
    Stats_Streaks.addStreak(1,"surge","surge","Surge",false,0,3,3,"","Gain a sudden surge of power, increasing the damage you deal by 30%, while reducing the damage you take by 30% for 5 seconds.","",null,"",null);
    Stats_Streaks.addStreak(1,"rapid","rapid","Rapid Regen",false,0,5,4,"","Give all allies rapid health regeneration for 8 seconds.","Health regeneration up!",'V_k3',"Enemy is regenerating their health!",'V_k4');
    Stats_Streaks.addStreak(1,"vest","vest","Kevlar Vests",false,0,12,4,"","Equip the entire team with kevlar vests that block some damage.","Kevlar Vests out!",'V_k5',"Enemy has a Kevlar Vests, focus fire!",'V_k6');
    Stats_Streaks.addStreak(1,"chopper","chopper","Attack Chopper",true,0,19,5,"*No effect on indoor maps*","An attack chopper follows you around for 10 seconds.","Chopper inbound!",'V_k1',"Attack Chopper, take cover!",'V_k2');
    Stats_Streaks.addStreak(2,"none","none","None",false,0,1,0,"","No killstreak equipped.","",null,"",null);
    Stats_Streaks.addStreak(2,"surge","surge","Surge",false,0,3,3,"","Gain a sudden surge of power, increasing the damage you deal by 30%, while reducing the damage you take by 30% for 5 seconds.","",null,"",null);
    Stats_Streaks.addStreak(2,"smoke","smoke","Smoke Bomb",false,0,5,2,"","Throw down a smoke bomb and teleport to a new area.","",null,"",null);
    Stats_Streaks.addStreak(2,"radar","radar","Full Radar",true,0,12,3,"","Grants vision of enemies on radar for 10 seconds.\nAllies will also be much more effective in combat.","Full Radar up, let \'em have it!",'V_k7',"Enemy has Full Radar, stay sharp!",'V_k8');
    Stats_Streaks.addStreak(2,"chopper","chopper","Attack Chopper",true,0,19,5,"*No effect on indoor maps*","An attack chopper follows you around for 10 seconds.","Chopper inbound!",'V_k1',"Attack Chopper, take cover!",'V_k2');
    Stats_Streaks.addStreak(3,"none","none","None",false,0,1,0,"","No killstreak equipped.","",null,"",null);
    Stats_Streaks.addStreak(3,"surge","surge","Surge",false,0,3,3,"","Gain a sudden surge of power, increasing the damage you deal by 30%, while reducing the damage you take by 30% for 5 seconds.","",null,"",null);
    Stats_Streaks.addStreak(3,"mine","mine","Bouncing Betty",false,0,5,2,"","Drop a landmine that launches into the air and explodes when an enemy comes near.\n\n(Moving while crouched will not activate the mine)","",null,"",null);
    Stats_Streaks.addStreak(3,"gas","gas","Tear Gas",true,0,12,3,"","Fills the map with a thick tear gas for 8 seconds, making all enemies much less effective in combat.","Enemies are gassed, let \'em have it!",'V_k11',"We\'ve been gassed, stay sharp!",'V_k12');
    Stats_Streaks.addStreak(3,"airstrike","airstrike","Air Strike",true,0,19,4,"*No effect on indoor maps*","Rain bombs from the sky.","Airstrike inbound!",'V_k9',"Enemy Airstrike, take cover!",'V_k10');
    Stats_Streaks.addStreak(4,"none","none","None",false,0,1,0,"","No killstreak equipped.","",null,"",null);
    Stats_Streaks.addStreak(4,"surge","surge","Surge",false,0,3,3,"","Gain a sudden surge of power, increasing the damage you deal by 30%, while reducing the damage you take by 30% for 5 seconds.","",null,"",null);
    Stats_Streaks.addStreak(4,"fire","fire","Combustion",false,0,5,3,"","Burst into flames, dealing damage to everyone around you for 10 seconds.","HUUURRAAAAAAAGH!!",'V_k15',"Enemy tank is on fire, literally!",'V_k16');
    Stats_Streaks.addStreak(4,"mirror","mirror","Ricochet",false,0,12,3,"","Reflect all bullets and projectiles for 5 seconds.","Quit hitting yourself!",'V_k13',"Enemy tank reflecting bullets!",'V_k14');
    Stats_Streaks.addStreak(4,"airstrike","airstrike","Air Strike",true,0,19,4,"*No effect on indoor maps*","Rain bombs from the sky.","Airstrike inbound!",'V_k9',"Enemy Airstrike, take cover!",'V_k10');
  }

  static addStreak(param1: number, param2: string, param3: string, param4: string, param5: boolean, param6: number, param7: number, param8: number, param9: string, param10: string, param11: string, param12: any, param13: string, param14: any): void {
    const _loc15_: Stats_Streaks = new Stats_Streaks();
    _loc15_.id = param2;
    _loc15_.sprite = param3;
    _loc15_.name = param4;
    _loc15_.global = param5;
    _loc15_.cost = int(param6);
    _loc15_.lvlReq = uint(param7);
    _loc15_.kills = param8;
    _loc15_.special = param9;
    _loc15_.desc = param10;
    _loc15_.allyUse = param11;
    _loc15_.allySound = param12;
    _loc15_.enemyUse = param13;
    _loc15_.enemySound = param14;
    _loc15_.cost = int(Stats_Classes.getItemCost(param7, 'streak'));
    Stats_Streaks.streakOb[param2] = _loc15_;
    Stats_Streaks.streakAr.push(_loc15_);
    Stats_Streaks.classAr[param1].push(_loc15_);
  }

  static getRandStreak(param1: Record<string, any>): string {
    let _loc2_: any = null;
    do
    {
      _loc2_ = UT.randEl(Stats_Streaks.classAr[param1.soldier]).id;
    }
    while(Stats_Streaks.streakOb[_loc2_].id == "none");
    return _loc2_;
  }
}
