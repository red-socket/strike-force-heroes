// Port of Stats_Guns.as — every weapon definition (primaries per class, shared secondaries,
// special/killstreak "guns"). The addGun table is a mechanical transcription of the AS3.
// Sound classes are stored as class-name strings; bullet classes are stored by name and
// resolved through `Stats_Guns.bulletClasses` (see `cls`).
import { int, uint } from '../flash/as3';
import { SD } from './SD';
import { UT } from './UT';
import { Stats_Classes } from './Stats_Classes';
import { Stats_Achievements } from './Stats_Achievements';

export class Stats_Guns {
  static gunOb: Record<string, Stats_Guns>;

  static gunAr: Stats_Guns[];

  static classAr: Stats_Guns[][];

  /**
   * Bullet classes by AS3 name ('Bullet_Line_Basic', ...). Filled by registerHud() (reg_hud.ts).
   * Port deviation: the AS3 table holds the classes themselves; importing them here would create
   * a module cycle (Bullet -> Stats_Guns -> Bullet_* -> Bullet) that breaks `extends Bullet`.
   */
  static bulletClasses: Record<string, any> = {};

  id!: string;

  sprite!: string;

  name!: string;

  typeName!: string;

  /** AS3 int */
  cost = 0;

  /** AS3 uint */
  lvlReq = 0;

  /** sound class name (string) or null */
  shotSound: any = undefined;

  /** sound class name (string) or null */
  hitSound: any = undefined;

  /** AS3 uint */
  type = 0;

  dmg = NaN;

  force = NaN;

  bodBreak = NaN;

  splash = NaN;

  splashMult = NaN;

  /** AS3 uint */
  clipSize = 0;

  /** AS3 uint */
  clipSpare = 0;

  /** AS3 uint */
  range = 0;

  recoil = NaN;

  autoFire = false;

  shootDelay = NaN;

  effShoot!: string;

  effHit!: string;

  effShell!: string;

  effHudBullet!: string;

  params!: any[];

  frameIdle!: string;

  frameFire!: string;

  frameReload!: string;

  /** AS3 class name of the bullet class (port addition; see `cls`). */
  clsName: string | null = null;

  /** The bullet class (AS3 `cls:*`), e.g. `new gun.cls(game, unit, ...)`; null if none. */
  get cls(): any {
    return this.clsName ? (Stats_Guns.bulletClasses[this.clsName] ?? null) : null;
  }

  extra!: Record<string, any>;

  desc!: string;

  /** AS3 uint */
  xOff = 0;

  /** AS3 int */
  yOff = 0;

  static Init(): void {
    Stats_Guns.gunOb = {};
    Stats_Guns.gunAr = [];
    Stats_Guns.classAr = [];
    let _loc1_: any = 0;
    while(_loc1_ < 6)
    {
      Stats_Guns.classAr.push([]);
      _loc1_++;
    }
    Stats_Guns.addGun(0,"USP","","","Pistol",0,1,15,3,0,0,0,12,5,66,3,false,0.25,8,-8,"smoke","bulletspark","pistol","pistol","pistol","pistol","pistol",'S_pistolFire',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(0,"Uzi","","","Machine-Pistol",0,3,6,3,0,0,0,18,4,40,7,true,0.12,10,-8,"gas_small","bulletspark","pistol","pistol","mpistol","mpistol","mpistol",'S_uziFire',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(0,"MP5","","","SMG",0,7,8,3,0,0,0,30,3,54,5,true,0.16,6,0,"gas_small","bulletspark","pistol","pistol","rifle","rifle","rifle",'S_mp5',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(0,"Beretta","","","Pistol",0,9,21,3,0,0,0,12,5,66,3,false,0.25,8,-8,"smoke","bulletspark","pistol","pistol","pistol","pistol","pistol",'S_uziFire',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(0,"Skorpion","","","Machine-Pistol",0,13,7,3,0,0,0,22,4,38,6,true,0.09,10,-8,"gas_small","bulletspark","pistol","pistol","rifle","rifle","rifle",'S_pistolFire',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(0,"Vector","","","SMG",0,15,9,3,0,0,0,32,3,50,5,true,0.12,6,0,"gas_small","bulletspark","pistol","pistol","rifle","rifle","rifle",'S_uziFire',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(0,"Socom","","","Pistol",0,18,27,5,0,0,0,12,5,66,3,false,0.25,8,-8,"smoke","bulletspark","pistol","pistol","pistol","pistol","pistol",'S_uziFire',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(0,"Patriot","","","Machine-Pistol",0,21,10,3,0,0,0,16,4,42,7,true,0.12,10,-8,"gas_small","bulletspark","pistol","pistol","mpistol","mpistol","mpistol",'S_pistolFire',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(0,"UMP","","","SMG",0,24,15,3,0,0,0,32,3,58,4,true,0.19,6,0,"gas_small","bulletspark","pistol","pistol","rifle","rifle","rifle",'S_mp5',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(0,"M1911","","","Pistol",0,27,36,8,0,0,0,12,5,66,3,false,0.25,8,-8,"smoke","bulletspark","pistol","pistol","pistol","pistol","pistol",'S_ar2',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(0,"Glock 18","Glock 18v","","Machine-Pistol",0,30,11,3,0,0,0,22,4,40,8,true,0.1,10,-8,"gas_small","bulletspark","pistol","pistol","mpistol","mpistol","mpistol",'S_uziFire',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(0,"Phantom","","","SMG",0,33,13,3,0,0,0,32,3,52,5,true,0.14,6,0,"gas_small","bulletspark","pistol","pistol","rifle","rifle","rifle",'S_assaultFire',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(0,"P99","","","Pistol",0,35,42,10,0,0,0,12,5,66,3,false,0.25,8,-8,"smoke","bulletspark","pistol","pistol","pistol","pistol","pistol",'S_uziFire',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(0,"Raffica","","","Machine-Pistol",0,37,14,3,0,0,0,18,4,42,7,true,0.12,10,-8,"gas_small","bulletspark","pistol","pistol","mpistol","mpistol","mpistol",'S_uziFire',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(0,"AKS","","AKS 74","SMG",0,39,18,3,0,0,0,32,3,56,4,true,0.19,8,0,"gas_small","bulletspark","pistol","pistol","rifle","rifle","rifle",'S_uziFire',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(0,"Desert Eagle","","","Pistol",0,41,58,15,0.3,0,0,7,5,68,4,false,0.3,8,-8,"smoke","bulletspark","pistol","pistol","pistol","pistol","pistol",'S_deagle',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{},"Point five-oh.");
    Stats_Guns.addGun(0,"RCP 90","","","SMG",0,43,18,3,0,0,0,50,3,50,5,true,0.16,6,0,"gas_small","bulletspark","pistol","pistol","bullpup","bullpup","bullpup",'S_rifle',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(0,"Cyclone","","Cyclone","Machine-Pistol",0,50,48,10,0.3,40,0.6,18,3,60,9,true,0.22,10,-8,"gas_small","explosionSmall","pistol","pistol","mpistol","mpistol","mpistol",'S_ripperFire','S_rocketExplode','Bullet_Proj_Basic',["ember",8,0.5],{},"It shoots mini explosives!");
    Stats_Guns.addGun(1,"M4","","","Assault Rifle",0,1,10,3,0.1,0,0,30,3,60,4,true,0.15,10,-1,"gas_small","bulletspark","pistol","arifle","rifle","rifle","rifle",'S_ar2',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(1,"Needler","","","Magnum",0,2,30,3,0.2,0,0,6,3,70,4,false,0.28,10,-8,"smoke","bulletspark","pistol","magnum","magnum","magnum","magnum",'S_aug',null,'Bullet_Line_Basic',[true,3.5,16737792,0.3,1.5,16737792,0.6],{},"");
    Stats_Guns.addGun(1,"Famas","","","Assault Rifle",0,6,18,3,0.1,0,0,30,3,78,2,false,0.18,8,-1,"gas_small","bulletspark","pistol","arifle","bullpup","bullpup","bullpup",'S_assaultFire',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(1,"Cougar","","","Magnum",0,8,42,3,0.2,0,0,6,3,60,4,false,0.35,8,-8,"smoke","bulletspark","pistol","magnum","magnum","magnum","magnum",'S_sniperFire',null,'Bullet_Line_Basic',[false,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(1,"Scar","","","Assault Rifle",0,11,20,3,0.1,0,0,22,3,70,6,true,0.18,10,-1,"gas_small","bulletspark","pistol","arifle","rifle","rifle","rifle",'S_elite',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(1,"p357","","357","Magnum",0,14,46,7,0.2,0,0,6,3,64,2,false,0.25,8,-8,"smoke","bulletspark","pistol","magnum","magnum","magnum","magnum",'S_sniperFire',null,'Bullet_Line_Basic',[false,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(1,"G36","","","Assault Rifle",0,17,18,3,0.1,0,0,30,3,60,5,true,0.15,10,-1,"gas_small","bulletspark","pistol","arifle","rifle","rifle","rifle",'S_rifle',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(1,"Colt 45","","","Magnum",0,20,58,10,0.2,0,0,6,3,70,3,false,0.35,8,-8,"smoke","bulletspark","pistol","magnum","magnum","magnum","magnum",'S_deagle',null,'Bullet_Line_Basic',[false,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(1,"Dragon","","","Assault Rifle",0,23,30,3,0.1,0,0,30,3,90,2,false,0.18,10,-1,"gas_small","bulletspark","pistol","arifle","rifle","rifle","rifle",'S_elite',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(1,"p44","",".44","Magnum",0,26,67,10,0.2,0,0,6,3,82,3,false,0.4,10,-8,"smoke","bulletspark","pistol","magnum","magnum","magnum","magnum",'S_deagle',null,'Bullet_Line_Basic',[false,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(1,"AK 47","","","Assault Rifle",0,29,24,3,0.1,0,0,30,3,46,5,true,0.15,10,-1,"gas_small","bulletspark","pistol","arifle","rifle","rifle","rifle",'S_ak',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(1,"p500","","500","Magnum",0,32,80,20,0.2,0,0,6,3,84,2,false,0.5,10,-8,"smoke","bulletspark","pistol","magnum","magnum","magnum","magnum",'S_autoshotgunFire',null,'Bullet_Line_Basic',[false,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(2,"Scout","","","Sniper",0,1,60,3,0.2,0,0,3,3,250,1,false,0.6,15,-1,"smoke","bulletspark","sniper","sniper","sniper","sniper","sniper",'S_sniperFire',null,'Bullet_Line_Sniper',[true,3.5,13421772,0.3,1.5,15658734,0.6],{"headDmg":0.4},"");
    Stats_Guns.addGun(2,"Knife","","Combat Knife","Melee",0,2,50,3,0.3,0,0,0,0,6,2,false,0.25,6,0,"","","","rocket","knife","knife","knife",'S_Whip1','S_Cut3','Bullet_Melee_Basic',[],{
      "vision":0.3,
      "critical":0.4,
      "criticalDmg":0.1,
      "noAmmo":true
    },"");
    Stats_Guns.addGun(2,"Barrett","","","Sniper",0,6,65,3,0.2,0,0,5,2,250,5,false,0.4,15,-1,"smoke","bulletspark","sniper","sniper","sniper","sniper","rifle",'S_scout',null,'Bullet_Line_Sniper',[true,3.5,16777156,0.3,1.5,16777156,0.6],{
      "vision":1,
      "headDmg":0
    },"Very heavy, not best to run around with.");
    Stats_Guns.addGun(2,"Bat","","","Melee",0,8,85,100,0.3,0,0,0,0,8,2,false,0.5,6,0,"","","","rocket","sword","sword","sword",'S_Whip2','S_Blunt2','Bullet_Melee_Basic',[],{
      "vision":0.3,
      "critical":0,
      "criticalDmg":0.5,
      "noAmmo":true
    },"Knock \'em out of the park!");
    Stats_Guns.addGun(2,"Jackal","","","Sniper",0,11,70,3,0.2,0,0,2,8,250,0,false,0.3,15,-1,"smoke","bulletspark","sniper","sniper","sniper","sniper","sniper",'S_sniper',null,'Bullet_Line_Basic',[false,2.5,13421772,0.3,1.5,13421772,0.6],{
      "vision":0.9,
      "headDmg":0.3
    },"The lightweight Jackal allows for unparalleled accuracy.");
    Stats_Guns.addGun(2,"Baton","","","Melee",0,14,65,3,0.3,0,0,0,0,6,2,false,0.25,6,0,"","","","rocket","knife","knife","knife",'S_Whip1','S_Blunt2','Bullet_Melee_Basic',[],{
      "vision":0.3,
      "critical":0.2,
      "criticalDmg":0.3,
      "noAmmo":true
    },"");
    Stats_Guns.addGun(2,"Dragunov","","","Sniper",0,17,90,3,0.2,0,0,3,3,250,2,false,0.6,15,-1,"smoke","bulletspark","sniper","sniper","sniper","sniper","rifle",'S_autoshotgunFire',null,'Bullet_Line_Sniper',[true,3.5,13421772,0.3,1.5,15658734,0.6],{
      "vision":1,
      "headDmg":0.4
    },"");
    Stats_Guns.addGun(2,"Nine Iron","","","Melee",0,20,110,100,0.3,0,0,0,0,8,2,false,0.5,6,0,"","","","rocket","sword","sword","sword",'S_Whip2','S_Blunt2','Bullet_Melee_Basic',[],{
      "vision":0.3,
      "critical":0,
      "criticalDmg":0.5,
      "noAmmo":true
    },"FORE!");
    Stats_Guns.addGun(2,"Crossbow","","","Sniper",0,23,85,10,0.2,0,0,1,15,250,1,false,0.6,15,-1,"smoke","bulletspark","","sniper","sniper","sniper","rocket",'S_ripperFire',null,'Bullet_Line_Basic',[false,2.5,6697728,0.3,1.5,6697728,0.6],{
      "vision":1,
      "headDmg":1.5
    },"Poison tipped bolts are extremely deadly, but can\'t penetrate body armor properly.");
    Stats_Guns.addGun(2,"Machete","","","Melee",0,26,90,3,0.3,0,0,0,0,6,2,false,0.25,6,0,"","","","rocket","knife","knife","knife",'S_Whip1','S_Cut3','Bullet_Melee_Basic',[],{
      "vision":0.3,
      "critical":0.3,
      "criticalDmg":0.2,
      "noAmmo":true
    },"");
    Stats_Guns.addGun(2,"AWP","","","Sniper",0,29,160,20,0.2,0,0,1,5,250,2,false,0.9,15,-1,"smoke","bulletspark","sniper","sniper","sniper","sniper","rifle",'S_scout',null,'Bullet_Line_Sniper',[true,3.5,16777156,0.3,1.5,16777156,0.6],{
      "vision":1,
      "headDmg":0.2
    },"");
    Stats_Guns.addGun(2,"Katana","","","Melee",0,32,150,20,0.7,0,0,0,0,8,2,false,0.45,6,0,"","","","rocket","sword","sword","sword",'S_Whip2','S_Cut3','Bullet_Melee_Basic',[],{
      "vision":0.3,
      "critical":0.4,
      "criticalDmg":0.3,
      "noAmmo":true
    },"Extremely sharp. Hold on to your limbs!");
    Stats_Guns.addGun(3,"Saw","","","Machine Gun",0,1,11,3,0.2,0,0,50,3,50,7,true,0.13,10,10,"gas_small","bulletspark","pistol","machine","heavy","heavy","heavy",'S_rifle',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(3,"RPG","","","Explosive",0,2,100,25,0.5,100,0.7,1,5,60,7,false,0.9,6,0,"smoke","explosion","rocket","rocket","rocket","rocket","rocket",'S_rocketFire','S_rocketExplode','Bullet_Proj_Basic',["gas_small",7,0.5],{},"");
    Stats_Guns.addGun(3,"RPD","","","Machine Gun",0,6,16,3,0.2,0,0,50,3,62,6,true,0.23,10,10,"gas_small","bulletspark","pistol","machine","heavy","heavy","heavy",'S_ak',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(3,"Thumper","","","Explosive",0,8,80,20,0.5,60,0.5,2,3,60,6,false,0.5,10,-1,"smoke","explosionSmall","rocket","rocket","launcher","launcher","launcher",'S_ripperFire','S_rocketExplode','Bullet_Proj_Bounce',["grenade",3,4,1.5],{},"");
    Stats_Guns.addGun(3,"AUG HBAR","","","Machine Gun",0,11,18,10,0.2,0,0,30,3,58,2,true,0.18,10,-1,"gas_small","bulletspark","pistol","machine","bullpup","bullpup","bullpup",'S_aug',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(3,"Stinger","","","Explosive",0,14,90,25,0.5,100,0.7,1,5,70,3,false,0.9,6,0,"smoke","explosion","rocket","rocket","rocket","rocket","rocket",'S_rocketFire','S_rocketExplode','Bullet_Proj_Follow',["gas_small",2,0,180,6],{},"");
    Stats_Guns.addGun(3,"First Blood","","","Machine Gun",0,17,17,3,0.2,0,0,50,3,52,5,true,0.1,10,10,"gas_small","bulletspark","pistol","machine","heavy","heavy","heavy",'S_elite',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(3,"Lawnchair","","M-32","Explosive",0,20,55,15,0.3,50,0.5,6,3,60,6,false,0.4,10,-4,"smoke","explosionSmall","rocket","rocket","launcher","launcher","sniper",'S_ripperFire','S_rocketExplode','Bullet_Proj_Bounce',["grenade",3,4,1.5],{},"");
    Stats_Guns.addGun(3,"OICW","","","Machine Gun",0,23,46,10,0.2,0,0,14,3,68,5,true,0.28,10,-1,"gas_small","bulletspark","sniper","shotgun","bullpup","bullpup","bullpup",'S_deagle',null,'Bullet_Line_Basic',[true,4.5,11202303,0.3,2.5,11202303,0.6],{},"An experimental weapon. Slow, but powerful.");
    Stats_Guns.addGun(3,"Javelin","","","Explosive",0,26,115,25,0.5,100,0.7,1,3,80,2,false,0.9,6,0,"smoke","explosion","rocket","rocket","rocket","rocket","rocket",'S_rocketFire','S_rocketExplode','Bullet_Proj_Follow',["gas_small",3,0,150,11],{},"Extremely accurate homing capabilities, but low ammo.");
    Stats_Guns.addGun(3,"Mini Gun","","","Machine Gun",0,29,15,10,0.2,0,0,100,1,42,9,true,0.07,10,10,"gas_small","bulletspark","pistol","machine","heavy","heavy","heavy",'S_mp5',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(3,"Commando","","","Explosive",0,32,100,25,0.5,100,0.8,4,3,60,6,false,0.4,6,0,"smoke","explosion","rocket","rocket","rocket","rocket","rocket",'S_rocketFire','S_rocketExplode','Bullet_Proj_Basic',["gas_small",7,0.5],{},"Can carry multiple rockets at once.");
    Stats_Guns.addGun(4,"M3","","Defriender","Shotgun",0,1,12,10,0.3,0,0,4,3,34,9,false,0.5,10,0,"smoke","bulletspark","shotgun","shotgun","shotgun","shotgun","shotgun",'S_shotgunFire',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{
      "vision":0.3,
      "extraShots":4
    },"");
    Stats_Guns.addGun(4,"Riot","","","Shield",0,2,0,3,0,0,0,0,0,0,0,false,1,6,0,"smoke","bulletspark","pistol","rocket","shield","shield","shield",null,null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{
      "reflect":0.1,
      "reduce":0.2,
      "useSecondary":true,
      "halfAim":true
    },"");
    Stats_Guns.addGun(4,"AA 12","","","Shotgun",0,6,6,10,0.3,0,0,8,3,28,9,true,0.25,10,0,"smoke","bulletspark","shotgun","shotgun","shotgun","shotgun","rifle",'S_autoshotgunFire',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{
      "vision":0.3,
      "extraShots":4
    },"");
    Stats_Guns.addGun(4,"Police","","","Shield",0,8,0,3,0,0,0,0,0,0,0,false,1,6,0,"smoke","bulletspark","pistol","rocket","shield","shield","shield",null,null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{
      "reflect":0.05,
      "reduce":0.3,
      "useSecondary":true,
      "halfAim":true
    },"");
    Stats_Guns.addGun(4,"SPAS 12","","","Shotgun",0,11,15,10,0.3,0,0,7,3,40,9,false,0.5,10,0,"smoke","bulletspark","shotgun","shotgun","shotgun","shotgun","shotgun",'S_shotgunFire',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{
      "vision":0.3,
      "extraShots":4
    },"");
    Stats_Guns.addGun(4,"Blast","","","Shield",0,14,0,3,0,0,0,0,0,0,0,false,1,6,0,"smoke","bulletspark","pistol","rocket","shield","shield","shield",null,null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{
      "reflect":0,
      "reduce":0.25,
      "useSecondary":true,
      "halfAim":true,
      "resist":0.3
    },"");
    Stats_Guns.addGun(4,"Striker","","","Shotgun",0,17,13,10,0.3,0,0,12,3,30,9,false,0.3,10,0,"smoke","bulletspark","shotgun","shotgun","rifle","rifle","sniper",'S_autoshotgunFire',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{
      "vision":0.3,
      "extraShots":4
    },"");
    Stats_Guns.addGun(4,"Pointy","","Buckler","Shield",0,20,0,3,0,0,0,0,0,0,0,false,1,6,0,"smoke","bulletspark","pistol","rocket","shield","shield","shield",null,null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{
      "reflect":0,
      "reduce":0.2,
      "useSecondary":true
    },"Very lightweight. Allows for great accuracy while blocking.");
    Stats_Guns.addGun(4,"Judgement","","","Shotgun",0,23,15,10,0.3,0,0,4,3,52,5,false,0.5,10,0,"smoke","bulletspark","shotgun","shotgun","shotgun","shotgun","shotgun",'S_sniper',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{
      "vision":0.3,
      "extraShots":4
    },"They won\'t be back.");
    Stats_Guns.addGun(4,"Meat","","","Shield",0,26,0,3,0,0,0,0,0,0,0,false,1,6,0,"smoke","bulletspark","pistol","rocket","shield","shield","shield",null,null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{
      "reflect":0,
      "reduce":0.45,
      "useSecondary":true,
      "halfAim":true
    },"Pleased to meat you.");
    Stats_Guns.addGun(4,"Omar","","","Shotgun",0,29,25,10,0.3,0,0,2,3,30,9,false,0.1,10,0,"smoke","bulletspark","shotgun","shotgun","launcher","launcher","launcher",'S_deagle',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{
      "vision":0.3,
      "extraShots":4
    },"Double barrel means extremely fast firing speed, but only 2 rounds.");
    Stats_Guns.addGun(4,"Siegius","","","Shield",0,32,0,3,0,0,0,0,0,0,0,false,1,6,0,"smoke","bulletspark","pistol","rocket","shield","shield","shield",null,null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{
      "reflect":0.3,
      "reduce":0.1,
      "useSecondary":true,
      "halfAim":true
    },"Provides little defense, but is extremely effective at reflecting attacks.");
    Stats_Guns.addGun(5,"poison","","Poison","",0,0,0,0,0,0,0,0,0,0,0,false,1,0,0,"","","","","","","",null,null,null,[],{},"");
    Stats_Guns.addGun(5,"curse","","Vampire Curse","",0,0,0,0,0,0,0,0,0,0,0,false,1,0,0,"","","","","","","",null,null,null,[],{},"");
    Stats_Guns.addGun(5,"env","","Environment","",0,0,0,0,0,0,0,0,0,0,0,false,1,0,0,"","","","","","","",null,null,null,[],{},"");
    Stats_Guns.addGun(5,"env2","","Environment","",0,0,0,0,0,0,0,0,0,0,0,false,1,0,0,"","","","","","","",null,null,null,[],{},"");
    Stats_Guns.addGun(5,"env3","","Environment","",0,0,0,0,0,0,0,0,0,0,0,false,1,0,0,"","","","","","","",null,null,null,[],{},"");
    Stats_Guns.addGun(5,"heli","","Helicopter","",0,1,18,3,0.2,0,0,12,3,70,3,false,0.3,0,0,"gas_small","gas_small","pistol","","","","",'S_uziFire',null,'Bullet_Line_Basic',[false,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(5,"airs","","Air Strike","Explosive",0,1,300,25,0.8,140,1,3,3,300,6,false,0.15,0,0,"gas_small","explosion","rocket","","","","",null,'S_rocketExplode','Bullet_Proj_Basic',["gas_small",7,0.5],{"noAllyDmg":true},"");
    Stats_Guns.addGun(5,"bomb","","Martyrdom","Explosive",0,1,150,25,0.4,100,1,2,3,60,6,false,0.15,0,0,"","explosion","","","","","",null,'S_rocketExplode','Bullet_Splash',[true],{},"");
    Stats_Guns.addGun(5,"fire","","Combustion","Explosive",0,1,12,3,0,150,1,2,3,60,6,false,0.15,0,0,"","","","","","","",null,null,'Bullet_Splash',[false],{},"");
    Stats_Guns.addGun(5,"none","","No Weapon","",0,1,9,3,0,150,1,0,0,60,6,false,0.15,0,0,"","","","rocket","","","",null,null,'Bullet_Splash',[false],{
      "vision":0.0001,
      "noShoot":true
    },"");
    Stats_Guns.addGun(5,"mine","","Bouncing Betty","",0,1,150,15,0.5,140,1,0,0,60,6,false,0.15,0,0,"","explosion","","","","","",null,'S_rocketExplode','Bullet_Proj_Mine',[],{},"");
    Stats_Guns.addGun(5,"USP2","USP","USP","Pistol",0,1,15,3,0,0,0,1,0,66,3,false,0.25,8,-8,"smoke","bulletspark","pistol","pistol","pistol","pistol","pistol",'S_pistolFire',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{"noAmmo":true},"");
    Stats_Guns.addGun(5,"Saw2","Saw","Saw","Machine Gun",0,1,11,3,0.2,0,0,50,100,50,7,true,0.13,10,10,"gas_small","bulletspark","pistol","machine","heavy","heavy","heavy",'S_rifle',null,'Bullet_Line_Basic',[true,3.5,16777156,0.3,1.5,16777156,0.6],{},"");
    Stats_Guns.addGun(5,"Golden Gun","","","Pistol",0,1,500,20,0,0,0,1,15,70,0,false,0.4,6,0,"gas_small","gas_small","pistol","pistol","pistol","pistol","pistol",'S_sniperFire',null,'Bullet_Line_Basic',[false,3.5,16750899,0.3,1.5,16764006,0.6],{},"");
    Stats_Guns.addGun(5,"Butter Knife","","","Melee",0,1,500,2,10,0,0,0,0,8,2,false,0.25,6,0,"","","","rocket","knife","knife","knife",'S_Whip1','S_Cut3','Bullet_Melee_Basic',[],{
      "vision":0.3,
      "noAmmo":true
    },"");
  }

  static addGun(param1: number, param2: string, param3: string, param4: string, param5: string, param6: number, param7: number, param8: number, param9: number, param10: number, param11: number, param12: number, param13: number, param14: number, param15: number, param16: number, param17: boolean, param18: number, param19: number, param20: number, param21: string, param22: string, param23: string, param24: string, param25: string, param26: string, param27: string, param28: any, param29: any, param30: any, param31: any[], param32: Record<string, any>, param33: string): void {
    const _loc34_: Stats_Guns = new Stats_Guns();
    _loc34_.id = param2;
    _loc34_.sprite = !param3 ? param2 : param3;
    _loc34_.name = !param4 ? param2 : param4;
    _loc34_.typeName = param5;
    _loc34_.lvlReq = uint(param7);
    _loc34_.shotSound = param28;
    _loc34_.hitSound = param29;
    _loc34_.type = uint(param1);
    _loc34_.dmg = param8;
    _loc34_.force = param9;
    _loc34_.bodBreak = param10 * 0.2;
    _loc34_.splash = param11;
    _loc34_.splashMult = param12;
    _loc34_.clipSize = uint(param13);
    _loc34_.clipSpare = uint(param14);
    _loc34_.range = uint(param15);
    _loc34_.recoil = param16;
    _loc34_.autoFire = param17;
    _loc34_.shootDelay = param18;
    _loc34_.xOff = uint(param19);
    _loc34_.yOff = int(param20);
    _loc34_.effShoot = param21;
    _loc34_.effShell = param23;
    _loc34_.effHudBullet = param24;
    _loc34_.effHit = param22;
    _loc34_.params = param31;
    _loc34_.frameIdle = param25;
    _loc34_.frameFire = param26;
    _loc34_.frameReload = param27;
    _loc34_.clsName = param30;
    _loc34_.extra = param32;
    _loc34_.desc = param33;
    _loc34_.cost = int(Stats_Classes.getItemCost(param7));
    Stats_Guns.gunOb[param2] = _loc34_;
    Stats_Guns.gunAr.push(_loc34_);
    Stats_Guns.classAr[param1].push(_loc34_);
  }

  static getRandPrimary(param1: Record<string, any>): string {
    let _loc3_ = 0;
    let _loc2_: number = int(param1.level * UT.rand(0.7, 1) + UT.irand(-8, 4));
    if (_loc2_ < 1) {
      _loc2_ = 1;
    }
    _loc3_ = 0;
    while (_loc3_ < Stats_Guns.classAr[param1.soldier].length - 1 && _loc2_ > Stats_Guns.classAr[param1.soldier][_loc3_].lvlReq) {
      _loc3_++;
    }
    return Stats_Guns.classAr[param1.soldier][_loc3_].id;
  }

  /** Quirk (kept): the randomised level `_loc2_` is computed and then ignored; `param1.level` is used. */
  static getRandSecondary(param1: Record<string, any>): string {
    let _loc3_ = 0;
    const _loc2_: number = int(param1.level * UT.rand(0.7, 1.1) + UT.irand(-8, 4));
    _loc3_ = 0;
    while (_loc3_ < Stats_Guns.classAr[0].length - 1 && param1.level > Stats_Guns.classAr[0][_loc3_].lvlReq) {
      _loc3_++;
    }
    return Stats_Guns.classAr[0][_loc3_].id;
  }

  static checkWeapMedal(): void {
    let _loc1_ = true;
    let _loc2_ = 0;
    while (_loc2_ < Stats_Guns.classAr[SD.selClass].length) {
      if (SD.unlocks.indexOf(Stats_Guns.classAr[SD.selClass][_loc2_].id) == -1) {
        _loc1_ = false;
      }
      _loc2_++;
    }
    if (_loc1_) {
      Stats_Achievements.setAchievement('allguns');
    }
  }
}
