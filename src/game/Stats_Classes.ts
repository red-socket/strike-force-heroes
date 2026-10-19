// Port of Stats_Classes.as — soldier classes, per-level stat interpolation, exp/level/cost formulas.
import { int, uint } from '../flash/as3';
import { SD } from './SD';
import { UT } from './UT';
import { Stats_Guns } from './Stats_Guns';
import { Stats_Skills } from './Stats_Skills';
import { Stats_Streaks } from './Stats_Streaks';

export class Stats_Classes {
  static classNums: string[];

  static Init(): void {
    Stats_Classes.classNums = ['rand', 'medic', 'sniper', 'soldier', 'tank'];
  }

  static getClass(param1: number, param2: number = 1): any {
    param1 = uint(param1);
    param2 = uint(param2);
    let _loc3_: any = {};
    switch(param1)
    {
      case 0:
        _loc3_.num = 0;
        _loc3_.name = "Random";
        _loc3_.id = _loc3_.icon = "rand";
        break;
      case 1:
        _loc3_.num = 1;
        _loc3_.name = "Medic";
        _loc3_.id = _loc3_.icon = "medic";
        _loc3_.startFrame = 50;
        _loc3_.hpMin = 85;
        _loc3_.critMin = 6;
        _loc3_.aimMin = 70;
        _loc3_.ammMin = 90;
        _loc3_.hpMax = 190;
        _loc3_.critMax = 30;
        _loc3_.aimMax = 110;
        _loc3_.ammMax = 190;
        _loc3_.runType = 1;
        break;
      case 2:
        _loc3_.num = 2;
        _loc3_.name = "Assassin";
        _loc3_.id = _loc3_.icon = "sniper";
        _loc3_.startFrame = 0;
        _loc3_.hpMin = 70;
        _loc3_.critMin = 10;
        _loc3_.aimMin = 80;
        _loc3_.ammMin = 65;
        _loc3_.hpMax = 140;
        _loc3_.critMax = 50;
        _loc3_.aimMax = 130;
        _loc3_.ammMax = 130;
        _loc3_.runType = 1;
        break;
      case 3:
        _loc3_.num = 3;
        _loc3_.name = "Commando";
        _loc3_.id = _loc3_.icon = "soldier";
        _loc3_.startFrame = 150;
        _loc3_.hpMin = 100;
        _loc3_.critMin = 4;
        _loc3_.aimMin = 60;
        _loc3_.ammMin = 130;
        _loc3_.hpMax = 230;
        _loc3_.critMax = 20;
        _loc3_.aimMax = 90;
        _loc3_.ammMax = 300;
        _loc3_.runType = 2;
        break;
      case 4:
        _loc3_.num = 4;
        _loc3_.name = "Tank";
        _loc3_.id = _loc3_.icon = "tank";
        _loc3_.startFrame = 100;
        _loc3_.hpMin = 130;
        _loc3_.critMin = 2;
        _loc3_.aimMin = 55;
        _loc3_.ammMin = 100;
        _loc3_.hpMax = 300;
        _loc3_.critMax = 10;
        _loc3_.aimMax = 80;
        _loc3_.ammMax = 230;
        _loc3_.runType = 2;
    }
    _loc3_.hp = _loc3_.hpMin + (_loc3_.hpMax - _loc3_.hpMin) / 49 * (param2 - 1);
    _loc3_.crit = _loc3_.critMin + (_loc3_.critMax - _loc3_.critMin) / 49 * (param2 - 1);
    _loc3_.aim = _loc3_.aimMin + (_loc3_.aimMax - _loc3_.aimMin) / 49 * (param2 - 1);
    _loc3_.amm = _loc3_.ammMin + (_loc3_.ammMax - _loc3_.ammMin) / 49 * (param2 - 1);
    return _loc3_;
  }

  static getNextExp(param1: number): number {
    param1 = uint(param1);
    return uint(param1 * param1 * 3 + 40);
  }

  static getUnitExp(param1: number): number {
    param1 = uint(param1);
    return uint(4 + param1 * 1.4);
  }

  static getAiLevel(param1: number): number {
    param1 = int(param1);
    const _loc2_: number = int(param1 * 3 + UT.irand(-3, 4));
    return _loc2_ <= 0 ? 1 : _loc2_;
  }

  static getReccLevel(param1: number): string {
    param1 = int(param1);
    let _loc2_: number = int((param1 - 1) * 3);
    if (_loc2_ <= 1) {
      _loc2_ = 1;
    }
    const _loc3_: number = int((param1 + 1) * 3);
    return _loc2_ + '-' + _loc3_;
  }

  static getItemCost(param1: number, param2: string = ''): number {
    param1 = uint(param1);
    let _loc3_: any = param1 * param1 * 3.5 + param1 * 18;
    if (param2 == 'skill') {
      _loc3_ *= 0.9;
      _loc3_ += 0;
    }
    if (param2 == 'streak') {
      _loc3_ *= 1.1;
      _loc3_ += 50;
    }
    return uint(Math.round(_loc3_ / 25) * 25);
  }

  static getDiffName(param1: number): string {
    return UT.getEl(uint(param1), ['-TEST-', 'Very Easy', 'Very Easy', 'Easy', 'Easy', 'Normal', 'Normal', 'Hard', 'Hard', 'Insane', 'Insane', 'Unreal', 'Unreal', 'Nightmare', 'Nightmare', 'Impossible']);
  }

  /**
   * Quirk (kept): the skill and killstreak loops are bounded by classAr[param2] but index
   * classAr[SD.selClass].
   */
  static getLevelUnlock(param1: number, param2: number): string {
    let _loc4_ = 0;
    let _loc3_ = '';
    _loc4_ = 0;
    while (_loc4_ < Stats_Guns.classAr[param2].length) {
      if (Stats_Guns.classAr[param2][_loc4_].lvlReq == param1) {
        if (Stats_Guns.classAr[param2][_loc4_].typeName != 'Melee') {
          _loc3_ += '\n' + Stats_Guns.classAr[param2][_loc4_].typeName + ' Unlocked!';
          break;
        }
        _loc3_ += '\nMelee Weapon Unlocked!';
        break;
      }
      _loc4_++;
    }
    _loc4_ = 0;
    while (_loc4_ < Stats_Guns.classAr[0].length) {
      if (Stats_Guns.classAr[0][_loc4_].lvlReq == param1) {
        _loc3_ += '\n' + Stats_Guns.classAr[0][_loc4_].typeName + ' Unlocked!';
        break;
      }
      _loc4_++;
    }
    _loc4_ = 0;
    while (_loc4_ < Stats_Skills.classAr[param2].length) {
      if (Stats_Skills.classAr[SD.selClass][_loc4_].lvlReq == param1) {
        _loc3_ += '\nSkill Unlocked!';
        break;
      }
      _loc4_++;
    }
    _loc4_ = 0;
    while (_loc4_ < Stats_Streaks.classAr[param2].length) {
      if (Stats_Streaks.classAr[SD.selClass][_loc4_].lvlReq == param1) {
        _loc3_ += '\nKillstreak Unlocked!';
        break;
      }
      _loc4_++;
    }
    return _loc3_;
  }
}
