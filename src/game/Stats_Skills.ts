// Port of Stats_Skills.as — skill definitions per class (index 0 = campaign-only skills).
// Note (kept): skillOb is keyed by id, so later duplicates ("none") overwrite earlier ones.
import { int, uint } from '../flash/as3';
import { UT } from './UT';
import { Stats_Classes } from './Stats_Classes';
import { Stats_Guns } from './Stats_Guns';

export class Stats_Skills {
  static skillOb: Record<string, Stats_Skills>;

  static skillAr: Stats_Skills[];

  static classAr: Stats_Skills[][];

  id!: string;

  sprite!: string;

  name!: string;

  typeName!: string;

  /** AS3 int */
  cost = 0;

  /** AS3 uint */
  lvlReq = 0;

  value = NaN;

  special!: string;

  desc!: string;

  static Init(): void {
    Stats_Skills.skillOb = {};
    Stats_Skills.skillAr = [];
    Stats_Skills.classAr = [];
    let _loc1_: any = 0;
    while(_loc1_ < 5)
    {
      Stats_Skills.classAr.push([]);
      _loc1_++;
    }
    Stats_Skills.addSkill(0,"blur2","blur","Blur","Timed",0,1,10,"Dodge all attacks when below 30% health","When low on health, the Assassin will dodge all attacks for 3 seconds.\n\n(Can only occur once every 30 seconds)");
    Stats_Skills.addSkill(0,"shadow2","shadow","Shadow Blend","Passive",0,1,0.5,"Become invisible while crouching\nMelee attacks get +50% critical when invisible","By crouching and moving slowly, you\'re able to blend into the shadows, unable to be seen.\n\n(Attacking or being attacked will reveal you)");
    Stats_Skills.addSkill(1,"none","none","None","None",0,1,-1,"","No skill equipped.");
    Stats_Skills.addSkill(1,"combat","mastery","Combat Mastery","Passive",0,2,-1,"+3% Critical\n+3% Aim\n+10% Ammo\n+10 Hp","Being a jack of all trades, the Medic is adept at all forms of combat.");
    Stats_Skills.addSkill(1,"regen","regen","Regenerative Tissue","Passive",0,4,-1,"Immediate health regeneration","After years in the field, the Medic\'s body tissue is so used to being healed that it is now always renegerating itself automatically.");
    Stats_Skills.addSkill(1,"charisma","charisma","Charismatic","Passive",0,10,-1,"All killstreaks require 1 less kill","The Medic is a friend to all. Because of this, battle assistance comes to his aid quicker than others.");
    Stats_Skills.addSkill(1,"operation","operation","Self Revive","Timed",0,16,30,"When about to die, heal 50% health","After reaching 0 health, the Medic performs a last second operation on himself, regaining half of his health.\n\n(Can only occur once every 30 seconds)");
    Stats_Skills.addSkill(2,"none","none","None","None",0,1,-1,"","No skill equipped.");
    Stats_Skills.addSkill(2,"critical","mastery","Focus Mastery","Passive",0,2,0.05,"+5% Critical\n+5% Aim","Extreme focus allows you to hone your aim and target enemy weakpoints.");
    Stats_Skills.addSkill(2,"vital","vital","Vital Sight","Passive",0,4,0.25,"Criticals and Headshots do +25% damage","Adds a laser sight to the weapon, allowing you to pinpoint enemy weakpoints.");
    Stats_Skills.addSkill(2,"shadow","shadow","Shadow Blend","Passive",0,10,0.5,"Become invisible while crouching\nMelee attacks get +50% critical when invisible","By crouching and moving slowly, the Assassin is able to blend into the shadows, unable to be seen.\n\n(Attacking or being attacked will reveal you)");
    Stats_Skills.addSkill(2,"blur","blur","Blur","Timed",0,16,30,"Dodge all attacks when below 30% health","When low on health, the Assassin will dodge all attacks for 2 seconds.\n\n(Can only occur once every 30 seconds)");
    Stats_Skills.addSkill(3,"none","none","None","None",0,1,-1,"","No skill equipped.");
    Stats_Skills.addSkill(3,"ammo","mastery","Ammo Mastery","Passive",0,2,0.2,"+20% Ammo","All those extra pockets and slots aren\'t just for show.");
    Stats_Skills.addSkill(3,"resist","resist","Flame Resistance","Passive",0,4,0.6,"-40% explosive damage","Years of explosive training has conditioned the Commando to resist all explosives. No one knows how.");
    Stats_Skills.addSkill(3,"clip","clip","Ammo Feed","Passive",0,10,-1,"Never reload with a machine gun","Instead of clips, the Commando feeds all his ammo directly into the gun so he never needs to reload.\n\n(Machine guns only)");
    Stats_Skills.addSkill(3,"bomb","bomb","Martyrdom","Timed",0,16,30,"Explode on death","Rigging himself with explosives, the Commando will explode on death, taking out all nearby enemies with him.\n\n(Can only occur every 30 seconds)");
    Stats_Skills.addSkill(4,"none","none","None","None",0,1,-1,"","No skill equipped.");
    Stats_Skills.addSkill(4,"health","mastery","Armor Mastery","Passive",0,2,20,"+20 Hp","When it comes to bullets, the Tank can never have too much protection.");
    Stats_Skills.addSkill(4,"adren","adren","Adrenaline","Passive",0,4,3,"3x Hp regeneration","When in danger, the Tank gets a surge of Adrenaline, recovering his health extremely fast.");
    Stats_Skills.addSkill(4,"iron","iron","Full Protection","Passive",0,10,0.85,"Reduce all damage by 15% when using a shield","When using a shield, the Tank becomes one with the it, allowing the unprotected parts of his body to reduce some damage as well.\n\n(Requires Shield)");
    Stats_Skills.addSkill(4,"will","fist","Iron Will","Timed",0,16,5,"Reduce next attack by 70%","Every once in a while, the Tank can reduce the next damage he takes by 70%.\n\n(Can only occur once every 5 seconds)");
  }

  static addSkill(param1: number, param2: string, param3: string, param4: string, param5: string, param6: number, param7: number, param8: number, param9: string, param10: string): void {
    const _loc11_: Stats_Skills = new Stats_Skills();
    _loc11_.id = param2;
    _loc11_.sprite = param3;
    _loc11_.name = param4;
    _loc11_.typeName = param5;
    _loc11_.cost = int(param6);
    _loc11_.lvlReq = uint(param7);
    _loc11_.value = param8;
    _loc11_.special = param9;
    _loc11_.desc = param10;
    _loc11_.cost = int(Stats_Classes.getItemCost(param7, 'skill'));
    Stats_Skills.skillOb[param2] = _loc11_;
    Stats_Skills.skillAr.push(_loc11_);
    Stats_Skills.classAr[param1].push(_loc11_);
  }

  static getRandSkill(param1: Record<string, any>): string {
    let _loc2_: any = null;
    do
    {
      _loc2_ = UT.randEl(Stats_Skills.classAr[param1.soldier]).id;
    }
    while(Stats_Skills.skillOb[_loc2_].id == "none" || Stats_Guns.gunOb[param1.primary].typeName == "Explosive" && Stats_Skills.skillOb[_loc2_].id == "clip" || Stats_Guns.gunOb[param1.primary].typeName == "Shotgun" && Stats_Skills.skillOb[_loc2_].id == "iron" || Stats_Guns.gunOb[param1.primary].typeName == "Melee" && Stats_Skills.skillOb[_loc2_].id == "vital");
    return _loc2_;
  }
}
