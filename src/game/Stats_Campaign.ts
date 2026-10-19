// Port of Stats_Campaign.as — campaign/challenge mission definitions (setMatch) and the
// per-frame mission scripts (runScripts). Bodies are a mechanical transcription of the AS3;
// sound/music/voice classes used as values are class-name strings (SH.* accepts them).
import { uint } from '../flash/as3';
import { MatchSettings } from './MatchSettings';
import { SH } from './SH';
import { UT } from './UT';
import { Stats_Classes } from './Stats_Classes';
import { Stats_Guns } from './Stats_Guns';
import { Stats_Skills } from './Stats_Skills';
import { Stats_Streaks } from './Stats_Streaks';
import type { Game } from './Game';

export class Stats_Campaign {
  private static showStatsOnly = false;

  /** AS3 uint: script step of the current mission */
  static sn = 0;

  /** AS3 uint: frame counter of the current script step */
  static fc = 0;

  static setMatch(param1: number, param2: boolean = false): void {
    param1 = uint(param1);
    MatchSettings.caStage = param1;
    Stats_Campaign.showStatsOnly = param2;
    switch(MatchSettings.caType)
    {
      case 0:
        switch(MatchSettings.caStage)
        {
          case 1:
            Stats_Campaign.setCutscene('M_Slow',[1,2,3],null,[4,5,35]);
            Stats_Campaign.setLvl("tdm",15,"tut",1,null,"Under Siege","A research facility is being attacked. You hold very vital information, escape with your life!\n\n[Tutorial Level]","Play as Scientist",{});
            Stats_Campaign.setPlr(1,"Scientist","medic",7,"M4","USP","none","none",0,{
              "spawn":{
                "x":285,
                "y":705,
                "node":"a"
              },
              "noAim":true
            });
            Stats_Campaign.addBot(2,"Unknown","tank",5,"Beretta","USP","none","none",0,{"spawn":{
              "x":1530,
              "y":695,
              "node":"a"
            }});
            Stats_Campaign.addBot(2,"Unknown","soldier",5,"Socom","USP","none","none",0,{
              "spawn":{
                "x":1760,
                "y":695,
                "node":"a"
              },
              "aimReverse":true
            });
            Stats_Campaign.addBot(2,"Unknown","medic",5,"USP","USP","none","none",0,{
              "spawn":{
                "x":1790,
                "y":695,
                "node":"a"
              },
              "aimReverse":true
            });
            Stats_Campaign.addBot(1,"Soldier","soldier",1,"Saw","USP","none","none",7,{"noSpawn":true});
            break;
          case 2:
            Stats_Campaign.setCutscene('M_Slow',[6,7],null,null);
            Stats_Campaign.setLvl("tdm",20,"swamp",2,'M_Rocket',"Rebellion","Rebels are setting up camp near a civilian dig site in South America, put an end to it.","",{});
            Stats_Campaign.setPlr(1,"","",1,"","","","",0,{});
            Stats_Campaign.addBot(1,"Toad","medic",1,"","","regen","rapid",3,{});
            Stats_Campaign.addBot(1,"Bull","tank",1,"","","will","vest",3,{});
            Stats_Campaign.addBot(1,"Riggs","soldier",1,"","","resist","gas",3,{});
            Stats_Campaign.addBot(1,"Shadow","sniper",1,"","","vital","radar",3,{});
            Stats_Campaign.addBot(2,"Rebel","sniper",3,"","","none","none",2,{});
            Stats_Campaign.addBot(2,"Rebel","medic",3,"","","none","none",2,{});
            Stats_Campaign.addBot(2,"Rebel","soldier",3,"","","none","none",2,{});
            break;
          case 3:
            Stats_Campaign.setCutscene('M_Plane',[8,9],null,[10]);
            Stats_Campaign.setLvl("tdm",25,"plane",2,null,"Hijacked","On the plane trip back you\'re attacked by an unknown enemy force... Why?","",{});
            Stats_Campaign.setPlr(1,"","",1,"","","","",0,{});
            Stats_Campaign.addBot(1,"Jenkins","sniper",2,"","","none","none",3,{});
            Stats_Campaign.addBot(1,"Toad","medic",1,"","","regen","rapid",3,{});
            Stats_Campaign.addBot(1,"Bull","tank",1,"","","will","vest",3,{});
            Stats_Campaign.addBot(1,"Riggs","soldier",1,"","","resist","gas",3,{});
            Stats_Campaign.addBot(1,"Shadow","sniper",1,"","","vital","radar",3,{});
            Stats_Campaign.addBot(2,"Unknown","medic",5,"","","none","none",3,{});
            Stats_Campaign.addBot(2,"Unknown","tank",5,"","","none","none",3,{});
            Stats_Campaign.addBot(2,"Unknown","soldier",5,"","","none","none",3,{});
            Stats_Campaign.addBot(2,"Unknown","sniper",5,"","","none","none",3,{});
            break;
          case 4:
            Stats_Campaign.setCutscene(null,null,null,null);
            Stats_Campaign.setLvl("dm",15,"cave",3,'M_Slow',"Infection","You have crash landed on an island near a reasearch facility. Some of your friends are here, but something\'s wrong...","",{});
            Stats_Campaign.setPlr(1,"","",1,"","","","",0,{
              "spawn":{
                "x":368,
                "y":81,
                "node":"a"
              },
              "parachute":true,
              "constAnim":"parachute1",
              "paraOnce":true
            });
            Stats_Campaign.addBot(1,"Jenkins","sniper",2,"","","none","none",4,{});
            Stats_Campaign.addBot(0,"Miller","sniper",6,"","","none","none",3,{});
            Stats_Campaign.addBot(0,"Tomson","medic",6,"","","none","none",3,{});
            Stats_Campaign.addBot(0,"Carter","soldier",6,"","","none","none",3,{});
            Stats_Campaign.addBot(0,"McCoy","tank",6,"","","none","none",3,{});
            break;
          case 5:
            Stats_Campaign.setCutscene('M_Train',[11],'M_Slow',[40,12,13,14,41,15,16]);
            Stats_Campaign.setLvl("tdm",15,"tut",3,null,"Siege Under","A nearby building seems to be under attack. Investigate and rescue any survivors.","",{});
            Stats_Campaign.setPlr(1,"","",1,"","","","",0,{
              "spawn":{
                "x":1010,
                "y":160,
                "node":"a"
              },
              "noShoot":true
            });
            Stats_Campaign.addBot(2,"Unknown","tank",5,"Beretta","USP","none","none",4,{});
            Stats_Campaign.addBot(2,"Unknown","soldier",5,"Socom","USP","none","none",4,{});
            Stats_Campaign.addBot(2,"Unknown","medic",5,"USP","USP","none","none",4,{});
            Stats_Campaign.addBot(1,"Scientist","medic",7,"M4","USP","none","none",5,{});
            break;
          case 6:
            Stats_Campaign.setCutscene(null,null,null,[17,18]);
            Stats_Campaign.setLvl("dom",100,"swamp2",4,'M_Slow',"The Cure","Search the swamps for the special plants for the toxin cure.","",{});
            Stats_Campaign.setPlr(1,"","",1,"","","","",0,{});
            Stats_Campaign.addBot(1,"Toad","medic",1,"","","regen","rapid",4,{});
            Stats_Campaign.addBot(1,"Bull","tank",1,"","","will","vest",4,{});
            Stats_Campaign.addBot(1,"Riggs","soldier",1,"","","resist","gas",4,{});
            Stats_Campaign.addBot(1,"Shadow","sniper",1,"","","vital","radar",4,{});
            Stats_Campaign.addBot(2,"Unknown","medic",5,"","","none","none",4,{"noSpawn":true});
            Stats_Campaign.addBot(2,"Unknown","tank",5,"","","none","none",4,{"noSpawn":true});
            Stats_Campaign.addBot(2,"Unknown","soldier",5,"","","none","none",4,{"noSpawn":true});
            Stats_Campaign.addBot(2,"Unknown","sniper",5,"","","none","none",4,{"noSpawn":true});
            break;
          case 7:
            Stats_Campaign.setCutscene(null,null,'M_Slow',[34,19]);
            Stats_Campaign.setLvl("ctf",3,"foundry",4,'M_Rocket',"Intelligence","We have the headquarters location of our unknown enemies. Infiltrate their base and see what you can find.","",{});
            Stats_Campaign.setPlr(1,"","",1,"","","","",0,{});
            Stats_Campaign.addBot(1,"Toad","medic",1,"","","regen","rapid",4,{});
            Stats_Campaign.addBot(1,"Bull","tank",1,"","","will","vest",4,{});
            Stats_Campaign.addBot(1,"Riggs","soldier",1,"","","resist","gas",4,{});
            Stats_Campaign.addBot(1,"Shadow","sniper",1,"","","vital","radar",4,{});
            Stats_Campaign.addBot(2,"Unknown","medic",5,"","","none","none",4,{});
            Stats_Campaign.addBot(2,"Unknown","tank",5,"","","none","none",4,{});
            Stats_Campaign.addBot(2,"Unknown","soldier",5,"","","none","none",4,{});
            Stats_Campaign.addBot(2,"Unknown","sniper",5,"","","none","none",4,{});
            break;
          case 8:
            Stats_Campaign.setCutscene('M_Plane',[20],null,null);
            Stats_Campaign.setLvl("tdm",20,"cave2",5,null,"Tropic Thunder","Globex is assaulting the research facility: stop them at once! We need that facility intact for the cure; it\'s our only hope!","",{});
            Stats_Campaign.setPlr(1,"","",1,"","","","",0,{});
            Stats_Campaign.addBot(1,"Toad","medic",1,"","","regen","rapid",5,{});
            Stats_Campaign.addBot(1,"Bull","tank",1,"","","will","vest",5,{});
            Stats_Campaign.addBot(1,"Riggs","soldier",1,"","","resist","gas",5,{});
            Stats_Campaign.addBot(1,"Shadow","sniper",1,"","","vital","radar",5,{});
            Stats_Campaign.addBot(2,"Globex","medic",5,"","","none","none",5,{});
            Stats_Campaign.addBot(2,"Globex","tank",5,"","","none","none",5,{});
            Stats_Campaign.addBot(2,"Globex","soldier",5,"","","none","none",5,{});
            Stats_Campaign.addBot(2,"Globex","sniper",5,"","","none","none",5,{});
            break;
          case 9:
            Stats_Campaign.setCutscene(null,null,null,[21]);
            Stats_Campaign.setLvl("dom",100,"tut",5,'M_Slow',"Hide and Seek","The facility is destroyed and overrun with the infected, secure all of the remaining data.","",{});
            Stats_Campaign.setPlr(1,"","",1,"","","","",0,{});
            Stats_Campaign.addBot(1,"Bull","tank",1,"","","will","vest",6,{});
            Stats_Campaign.addBot(2,"Infected","tank",6,"","","health","surge",4,{});
            Stats_Campaign.addBot(2,"Infected","medic",6,"","","health","surge",4,{});
            Stats_Campaign.addBot(2,"Infected","soldier",6,"","","health","surge",4,{});
            Stats_Campaign.addBot(2,"Infected","sniper",6,"","","health","surge",4,{});
            break;
          case 10:
            Stats_Campaign.setCutscene(null,null,null,[22]);
            Stats_Campaign.setLvl("tdm",30,"foundry2",6,'M_Boss',"The Return","Globex won\'t give up their assault... We need to find out all of what they know.","",{});
            Stats_Campaign.setPlr(1,"","",1,"","","","",0,{});
            Stats_Campaign.addBot(1,"Toad","medic",1,"","","regen","rapid",6,{});
            Stats_Campaign.addBot(1,"Bull","tank",1,"","","will","vest",6,{});
            Stats_Campaign.addBot(1,"Riggs","soldier",1,"","","resist","gas",6,{});
            Stats_Campaign.addBot(2,"Globex","medic",5,"","","charisma","rapid",5,{});
            Stats_Campaign.addBot(2,"Globex","tank",5,"","","charisma","vest",5,{});
            Stats_Campaign.addBot(2,"Globex","soldier",5,"","","charisma","mine",5,{});
            Stats_Campaign.addBot(2,"Globex","sniper",5,"","","charisma","mine",7,{"noSpawn":true});
            Stats_Campaign.addBot(2,"Globex","tank",5,"","","charisma","mine",8,{"noSpawn":true});
            break;
          case 11:
            Stats_Campaign.setCutscene(null,null,null,null);
            Stats_Campaign.setLvl("tdm",20,"train2",6,'M_Slow',"Plan B","Globex is planning on launching a nuke to stop the infection from spreading. Stop them at all costs.","",{});
            Stats_Campaign.setPlr(1,"","",1,"","","","",0,{});
            Stats_Campaign.addBot(1,"Toad","medic",1,"","","regen","rapid",6,{});
            Stats_Campaign.addBot(1,"Bull","tank",1,"","","will","vest",6,{});
            Stats_Campaign.addBot(1,"Riggs","soldier",1,"","","resist","gas",6,{});
            Stats_Campaign.addBot(1,"Shadow","sniper",1,"","","vital","radar",6,{});
            Stats_Campaign.addBot(2,"Globex","tank",5,"","","none","rapid",6,{});
            Stats_Campaign.addBot(2,"Globex","tank",5,"","","none","vest",6,{});
            Stats_Campaign.addBot(2,"Globex","tank",5,"","","none","chopper",6,{});
            Stats_Campaign.addBot(2,"Globex","tank",5,"","","none","airstrike",6,{});
            break;
          case 12:
            Stats_Campaign.setCutscene(null,null,null,[23,24]);
            Stats_Campaign.setLvl("dom",100,"train",7,'M_Train',"On Rails","The train is in motion, we can\'t stop it. We need more time to distribute the cure. Disable that nuke!","",{});
            Stats_Campaign.setPlr(1,"","",1,"","","","",0,{});
            Stats_Campaign.addBot(1,"Toad","medic",1,"","","regen","rapid",7,{});
            Stats_Campaign.addBot(1,"Bull","tank",1,"","","will","vest",7,{});
            Stats_Campaign.addBot(1,"Riggs","soldier",1,"","","resist","gas",7,{});
            Stats_Campaign.addBot(1,"Shadow","sniper",1,"","","vital","radar",7,{});
            Stats_Campaign.addBot(2,"Globex","medic",5,"","","none","rapid",7,{});
            Stats_Campaign.addBot(2,"Globex","tank",5,"","","none","vest",7,{});
            Stats_Campaign.addBot(2,"Globex","soldier",5,"","","none","chopper",7,{});
            Stats_Campaign.addBot(2,"Globex","sniper",5,"","","none","airstrike",7,{});
            break;
          case 13:
            Stats_Campaign.setCutscene('M_Plane',[25],null,[26]);
            Stats_Campaign.setLvl("tdm",15,"dropship",7,null,"Boarding Action","Intercept the nuke before it reaches it\'s target! But beware, you\'re not alone in the sky...","",{"expmod":0.4});
            Stats_Campaign.setPlr(1,"","",1,"","","","",0,{"teamSpawn":true});
            Stats_Campaign.addBot(2,"Paratrooper","soldier",5,"","","","none",6,{
              "noSpawn":true,
              "teamSpawn":true,
              "parachute":true,
              "constAnim":"parachute2"
            });
            Stats_Campaign.addBot(2,"Paratrooper","tank",5,"","","","none",6,{
              "noSpawn":true,
              "teamSpawn":true,
              "parachute":true,
              "constAnim":"parachute2"
            });
            Stats_Campaign.addBot(2,"Paratrooper","medic",5,"","","","none",6,{
              "noSpawn":true,
              "teamSpawn":true,
              "parachute":true,
              "constAnim":"parachute2"
            });
            Stats_Campaign.addBot(2,"Paratrooper","sniper",5,"","","","none",6,{
              "noSpawn":true,
              "teamSpawn":true,
              "parachute":true,
              "constAnim":"parachute2"
            });
            break;
          case 14:
            Stats_Campaign.setCutscene(null,null,null,null);
            Stats_Campaign.setLvl("dom",100,"missile",8,'M_Rocket',"One Final Effort","Replace the warhead of the nuke with the cure before it explodes.","",{});
            Stats_Campaign.setPlr(1,"","",1,"","","","",0,{
              "teamSpawn":true,
              "parachute":true,
              "constAnim":"parachute1"
            });
            Stats_Campaign.addBot(2,"Globex","soldier",5,"","","","none",4,{
              "teamSpawn":true,
              "parachute":true,
              "constAnim":"parachute2"
            });
            Stats_Campaign.addBot(2,"Globex","tank",5,"","","","none",5,{
              "teamSpawn":true,
              "parachute":true,
              "constAnim":"parachute2"
            });
            Stats_Campaign.addBot(2,"Globex","medic",5,"","","","none",5,{
              "teamSpawn":true,
              "parachute":true,
              "constAnim":"parachute2"
            });
            Stats_Campaign.addBot(2,"Globex","sniper",5,"","","","none",4,{
              "teamSpawn":true,
              "parachute":true,
              "constAnim":"parachute2"
            });
            break;
          case 15:
            Stats_Campaign.setCutscene('M_Slow',[27,43],null,[28,29,30,31,32,36,37,38,39,44]);
            Stats_Campaign.setLvl("tdm",15,"missile2",8,'M_Boss',"The Final Showdown","The leader of Globex has boarded the nuke in an attempt to stop you. Defeat him!","",{});
            Stats_Campaign.setPlr(1,"","",1,"","","","",0,{});
            Stats_Campaign.addBot(2,"Globex Leader","soldier",7,"Mini Gun","Socom","blur","none",7,{
              "hp":240,
              "forcePistol":true
            });
        }
        break;
      case 1:
        Stats_Campaign.setCutscene(null,null,null,null);
        switch(MatchSettings.caStage)
        {
          case 1:
            Stats_Campaign.setLvl("tdm",15,"cave",8,'M_Rocket',"Double Agent","Every 10 seconds, both teams are completely randomized!","",{"randomTeam":30 * 10});
            Stats_Campaign.setPlr(1,"","",2,"","","","",0,{});
            Stats_Campaign.addBot(1,"","",2,"","","","",7,{});
            Stats_Campaign.addBot(1,"","",2,"","","","",7,{});
            Stats_Campaign.addBot(1,"","",2,"","","","",7,{});
            Stats_Campaign.addBot(2,"","",3,"","","","",7,{});
            Stats_Campaign.addBot(2,"","",3,"","","","",7,{});
            Stats_Campaign.addBot(2,"","",3,"","","","",7,{});
            Stats_Campaign.addBot(2,"","",3,"","","","",7,{});
            break;
          case 2:
            Stats_Campaign.setLvl("dm",30,"plane",8,'M_Plane',"Kevlar","Each kill grants you a brand new Kevlar vest, but beware, the enemies get this bonus too!","Killstreaks Disabled",{"kevlarKill":true});
            Stats_Campaign.setPlr(0,"","",0,"","","","none",0,{});
            Stats_Campaign.addBot(0,"","",0,"","","","none",7,{});
            Stats_Campaign.addBot(0,"","",0,"","","","none",7,{});
            Stats_Campaign.addBot(0,"","",0,"","","","none",7,{});
            Stats_Campaign.addBot(0,"","",0,"","","","none",7,{});
            Stats_Campaign.addBot(0,"","",0,"","","","none",7,{});
            Stats_Campaign.addBot(0,"","",0,"","","","none",7,{});
            break;
          case 3:
            Stats_Campaign.setLvl("tdm",25,"tut",9,'M_Slow',"Man with the Golden Gun","Fight an elite group of assassins with an experimental weapon.","Weapon: Golden Gun",{"expmod":0.2});
            Stats_Campaign.setPlr(1,"","",0,"Golden Gun","none","","",0,{});
            Stats_Campaign.addBot(2,"Assassin","soldier",5,"M4","","vital","",9,{});
            Stats_Campaign.addBot(2,"Assassin","soldier",5,"M4","","vital","",9,{});
            Stats_Campaign.addBot(2,"Assassin","soldier",5,"M4","","vital","",9,{});
            Stats_Campaign.addBot(2,"Assassin","soldier",5,"M4","","vital","",9,{});
            break;
          case 4:
            Stats_Campaign.setLvl("dm",20,"train",9,'M_Train',"Rocket Race","Explosives only on a speeding train.","Skills Disabled",{"expmod":0.8});
            Stats_Campaign.setPlr(0,"","",0,"RPG","Thumper","none","",0,{});
            Stats_Campaign.addBot(0,"","",0,"RPG","Thumper","none","",8,{});
            Stats_Campaign.addBot(0,"","",0,"RPG","Thumper","none","",8,{});
            Stats_Campaign.addBot(0,"","",0,"RPG","Thumper","none","",8,{});
            Stats_Campaign.addBot(0,"","",0,"RPG","Thumper","none","",8,{});
            break;
          case 5:
            Stats_Campaign.setLvl("dm",15,"foundry",10,'M_Rocket',"Prepared","Grenade launchers and highly reflective shields. What more could you want?","Weapons: Custom, Skills Disabled",{});
            Stats_Campaign.setPlr(0,"","",0,"Siegius","Lawnchair","none","",0,{"expmod":0.8});
            Stats_Campaign.addBot(0,"","",0,"Siegius","Lawnchair","none","",8,{});
            Stats_Campaign.addBot(0,"","",0,"Siegius","Lawnchair","none","",8,{});
            Stats_Campaign.addBot(0,"","",0,"Siegius","Lawnchair","none","",8,{});
            Stats_Campaign.addBot(0,"","",0,"Siegius","Lawnchair","none","",8,{});
            break;
          case 6:
            Stats_Campaign.setLvl("tdm",25,"swamp",10,'M_Theme',"Norris, Chuck","As an unstoppable Super Soldier, you prefer to make fights more even by using only a butter knife.\nYou have only 1 life.","Character: Super Soldier",{"expmod":0.2});
            Stats_Campaign.setPlr(1,"","soldier",4,"Butter Knife","none","adren","none",0,{"hp":700});
            Stats_Campaign.addBot(2,"","",3,"","","","none",10,{"kills":4});
            Stats_Campaign.addBot(2,"","",3,"","","","none",10,{"kills":4});
            Stats_Campaign.addBot(2,"","",3,"","","","none",10,{"kills":4});
            Stats_Campaign.addBot(2,"","",3,"","","","none",10,{"kills":4});
            Stats_Campaign.addBot(2,"","",3,"","","","none",10,{"kills":4});
            Stats_Campaign.addBot(2,"","",3,"","","","none",10,{"kills":4});
            break;
          case 7:
            Stats_Campaign.setLvl("tdm",20,"dropship",11,'M_Plane',"Golf Season","Angry golfers are falling from the sky, kill them before they get too close!","",{"expmod":0.2});
            Stats_Campaign.setPlr(1,"","",0,"","","","",0,{"teamSpawn":true});
            Stats_Campaign.addBot(2,"Angry Golfer","soldier",6,"Nine Iron","","","none",10,{
              "teamSpawn":true,
              "parachute":true,
              "constAnim":"parachute1",
              "kills":2
            });
            Stats_Campaign.addBot(2,"Angry Golfer","tank",6,"Nine Iron","","","none",10,{
              "teamSpawn":true,
              "parachute":true,
              "constAnim":"parachute1",
              "kills":2
            });
            Stats_Campaign.addBot(2,"Angry Golfer","medic",6,"Nine Iron","","","none",10,{
              "teamSpawn":true,
              "parachute":true,
              "constAnim":"parachute1",
              "kills":2
            });
            Stats_Campaign.addBot(2,"Angry Golfer","sniper",6,"Nine Iron","","","none",10,{
              "teamSpawn":true,
              "parachute":true,
              "constAnim":"parachute1",
              "kills":2
            });
            Stats_Campaign.addBot(2,"Angry Golfer","soldier",6,"Nine Iron","","","none",10,{
              "teamSpawn":true,
              "parachute":true,
              "constAnim":"parachute1",
              "kills":2
            });
            Stats_Campaign.addBot(2,"Angry Golfer","tank",6,"Nine Iron","","","none",10,{
              "teamSpawn":true,
              "parachute":true,
              "constAnim":"parachute1",
              "kills":2
            });
            Stats_Campaign.addBot(2,"Angry Golfer","medic",6,"Nine Iron","","","none",10,{
              "teamSpawn":true,
              "parachute":true,
              "constAnim":"parachute1",
              "kills":2
            });
            Stats_Campaign.addBot(2,"Angry Golfer","sniper",6,"Nine Iron","","","none",10,{
              "teamSpawn":true,
              "parachute":true,
              "constAnim":"parachute1",
              "kills":2
            });
            break;
          case 8:
            Stats_Campaign.setLvl("tdm",25,"plane2",11,'M_Boss',"Ninja Assault","Ninja\'s have boarded your plane, eliminate them!","",{"expmod":0.8});
            Stats_Campaign.setPlr(1,"","",0,"","","","radar",0,{});
            Stats_Campaign.addBot(2,"Ninja","sniper",5,"Katana","Knife","shadow2","none",10,{});
            Stats_Campaign.addBot(2,"Ninja","sniper",5,"Katana","Knife","shadow2","none",10,{});
            Stats_Campaign.addBot(2,"Ninja","sniper",5,"Katana","Knife","shadow2","none",10,{});
            Stats_Campaign.addBot(2,"Ninja","sniper",5,"Katana","Knife","shadow2","none",10,{});
            Stats_Campaign.addBot(2,"Ninja","sniper",5,"Katana","Knife","shadow2","none",10,{});
            Stats_Campaign.addBot(2,"Ninja","sniper",5,"Katana","Knife","shadow2","none",10,{});
            break;
          case 9:
            Stats_Campaign.setLvl("jug",20,"cave2",12,'M_Train',"Poison","A deadly poison is spreading that only infects Juggernauts.","",{"jugDrain":true});
            Stats_Campaign.setPlr(0,"","",0,"","","","",0,{});
            Stats_Campaign.addBot(0,"","",0,"","","","",8,{});
            Stats_Campaign.addBot(0,"","",0,"","","","",8,{});
            Stats_Campaign.addBot(0,"","",0,"","","","",8,{});
            Stats_Campaign.addBot(0,"","",0,"","","","",8,{});
            Stats_Campaign.addBot(0,"","",0,"","","","",8,{});
            Stats_Campaign.addBot(0,"","",0,"","","","",8,{});
            break;
          case 10:
            Stats_Campaign.setLvl("tdm",12,"train",12,'M_Boss',"Big Brother","There\'s no weapons, but everyone has permanent air support, protect your ally!","Custom: No weapon/skill/killstreak",{"expmod":0.6});
            Stats_Campaign.setPlr(1,"","",0,"none","none","none","chopper",0,{"permaStreak":true});
            Stats_Campaign.addBot(1,"","",0,"none","none","none","chopper",15,{"permaStreak":true});
            Stats_Campaign.addBot(2,"","",0,"none","none","none","chopper",15,{
              "permaStreak":true,
              "kills":3
            });
            Stats_Campaign.addBot(2,"","",0,"none","none","none","chopper",15,{
              "permaStreak":true,
              "kills":3
            });
            break;
          case 11:
            Stats_Campaign.setLvl("ctf",7,"tut",13,'M_Slow',"Self Experiments","Scientists have been experimenting on themselves with strange chemicals. We need their intel!","",{});
            Stats_Campaign.setPlr(1,"","",4,"","","","",0,{});
            Stats_Campaign.addBot(1,"","",4,"","","","",9,{});
            Stats_Campaign.addBot(1,"","",4,"","","","",9,{});
            Stats_Campaign.addBot(2,"Scientist","medic",7,"","","","none",8,{"permaRapid":true});
            Stats_Campaign.addBot(2,"Scientist","medic",7,"","","","none",8,{"permaRapid":true});
            Stats_Campaign.addBot(2,"Scientist","medic",7,"","","","none",8,{"permaRapid":true});
            break;
          case 12:
            Stats_Campaign.setLvl("tdm",20,"swamp",13,'M_Slow',"Knife to a Gunfight","Enemies have been spotted in the jungle with knives. Take them out from a distance but beware, they\'re heavily armored.","Soldier: Assassin",{"expmod":0.8});
            Stats_Campaign.setPlr(1,"","sniper",1,"","","","",0,{});
            Stats_Campaign.addBot(1,"","sniper",1,"","","","",10,{});
            Stats_Campaign.addBot(1,"","sniper",1,"","","","",10,{});
            Stats_Campaign.addBot(2,"","tank",4,"Katana","none","","",10,{"hp":400});
            Stats_Campaign.addBot(2,"","tank",4,"Machete","none","","",10,{"hp":400});
            Stats_Campaign.addBot(2,"","tank",4,"Knife","none","","",10,{"hp":400});
            break;
          case 13:
            Stats_Campaign.setLvl("tdm",15,"swamp2",14,'M_Slow',"Hide and Seek","Stay in the shadows and pick your fights wisely.","Skill: Improved Shadowblend",{"expmod":0.8});
            Stats_Campaign.setPlr(1,"","",5,"","","shadow2","",0,{});
            Stats_Campaign.addBot(2,"","",1,"","","","none",15,{"kills":2});
            Stats_Campaign.addBot(2,"","",1,"","","","none",15,{"kills":2});
            Stats_Campaign.addBot(2,"","",1,"","","","none",15,{"kills":2});
            Stats_Campaign.addBot(2,"","",1,"","","","none",15,{"kills":2});
            Stats_Campaign.addBot(2,"","",1,"","","","none",15,{"kills":2});
            Stats_Campaign.addBot(2,"","",1,"","","","none",15,{"kills":2});
            break;
          case 14:
            Stats_Campaign.setLvl("dm",20,"swamp",14,'M_Rocket',"Vampire","The hot sun damages all vampires. Kill enemies to regain some health.","",{"vampire":true});
            Stats_Campaign.setPlr(0,"","",0,"","","","",0,{});
            Stats_Campaign.addBot(0,"","",0,"","","","",9,{});
            Stats_Campaign.addBot(0,"","",0,"","","","",9,{});
            Stats_Campaign.addBot(0,"","",0,"","","","",9,{});
            Stats_Campaign.addBot(0,"","",0,"","","","",9,{});
            Stats_Campaign.addBot(0,"","",0,"","","","",9,{});
            Stats_Campaign.addBot(0,"","",0,"","","","",9,{});
            break;
          case 15:
            Stats_Campaign.setLvl("tdm",15,"tut",15,'M_Rocket',"Meet Your Makers","Fight those who created you.","",{"expmod":1.2});
            Stats_Campaign.setPlr(1,"","",0,"","","","",0,{});
            Stats_Campaign.addBot(2,"Justin","soldier",8,"Mini Gun","Machete","blur","rapid",11,{"level":60});
            Stats_Campaign.addBot(2,"Mike","tank",8,"Siegius","SPAS 12","will","vest",8,{"level":60});
        }
    }
  }

  static runScripts(param1: Game): void {
    switch(MatchSettings.caType)
    {
      case 0:
        switch(MatchSettings.caStage)
        {
          case 1:
            if(Stats_Campaign.sn == 1)
            {
              if(Stats_Campaign.fc == 0)
              {
                param1.player.gun.setGuns("none","none");
              }
              if(Stats_Campaign.fc == 20)
              {
                param1.hud.setMsg(param1.player,"They\'re here! I have to escape!",4,true,'V_Ca1_1');
              }
              if(Stats_Campaign.fc == 3 * 30)
              {
                param1.hud.gotoAndStop("tutmove");
              }
            }
            if(Stats_Campaign.sn == 14)
            {
              if(Stats_Campaign.fc == 5 * 30)
              {
                param1.hud.setMsg(param1.player,"Oh dear...",3,true,'V_Ca1_11');
              }
              if(Stats_Campaign.fc == 12 * 30)
              {
                param1.units[4].spawn(770,870,"z");
                param1.hud.setMsg(param1.units[4],"Sorry I\'m late.",4,true,'V_Ca1_12');
                SH.playMusic('M_Theme');
              }
              if(Stats_Campaign.fc == 15 * 30)
              {
                param1.hud.setMsg(param1.player,"What? I don\'t know who you are, but help me!",5,true,'V_Ca1_13');
              }
              if(Stats_Campaign.fc == 20 * 30)
              {
                param1.hud.setMsg(param1.units[4],"Don\'t worry I\'ve got you.",4,true,'V_Ca1_14');
              }
            }
            if(param1.matchSettings.team1score == 6 && Stats_Campaign.sn == 14)
            {
              param1.hud.setMsg(param1.units[4],"Hehehah, take some of this!",5,true,'V_Ca1_15');
              ++Stats_Campaign.sn;
            }
            if(param1.matchSettings.team1score == 9 && Stats_Campaign.sn == 15)
            {
              param1.hud.setMsg(param1.player,"I\'m very sorry for killing you!",4,true,'V_Ca1_16');
              ++Stats_Campaign.sn;
            }
            if(param1.matchSettings.team1score == 12 && Stats_Campaign.sn == 16)
            {
              param1.hud.setMsg(param1.units[1],"Their firepower is too strong... Aeuughh!",5,true,'V_Ca1_17');
              ++Stats_Campaign.sn;
            }
            if(!(param1.matchSettings.team1score == 14 && Stats_Campaign.sn == 17))
            {
              break;
            }
            param1.hud.setMsg(param1.units[4],"These guys are smalltime!",5,true,'V_Ca1_18');
            ++Stats_Campaign.sn;
            break;
          case 2:
            if(Stats_Campaign.fc == 5 * 30)
            {
              param1.hud.setMsg(param1.player,"This should be a quick mission. Eliminate the Rebels and move out.",6,true,'V_Ca2_1');
            }
            if(Stats_Campaign.fc == 10 * 30)
            {
              param1.hud.setMsg(param1.units[3],"Roger that.",4,true,'V_Ca2_2');
            }
            if(Stats_Campaign.fc == 35 * 30)
            {
              param1.hud.setMsg(param1.units[2],"Ah, I\'m hit!",4,true,'V_Ca2_3');
            }
            if(Stats_Campaign.fc == 39 * 30)
            {
              param1.hud.setMsg(param1.player,"Oh it\'s just a flesh wound, you\'ll live!",5,true,'V_Ca2_4');
            }
            if(Stats_Campaign.fc != 44 * 30)
            {
              break;
            }
            param1.hud.setMsg(param1.units[2],"Yes sir!",4,true,'V_Ca2_5');
            break;
          case 3:
            if(Stats_Campaign.fc == 1 * 30)
            {
              SH.playSound('S_Jet');
            }
            if(Stats_Campaign.fc == 3 * 30)
            {
              param1.hud.setMsg(param1.player,"Jenkins, what\'s going on here?",4,true,'V_Ca3_1');
            }
            if(Stats_Campaign.fc == 7 * 30)
            {
              param1.hud.setMsg(param1.units[1],"They just attacked out of nowhere... I have no idea sir! ",6,true,'V_Ca3_2');
            }
            if(Stats_Campaign.fc != 12 * 30)
            {
              break;
            }
            param1.hud.setMsg(param1.player,"Well we have 30,000 feet to find out!",6,true,'V_Ca3_3');
            break;
          case 4:
            if(Stats_Campaign.fc == 5 * 30)
            {
              param1.hud.setMsg(param1.units[1],"Sir, thank god you\'re here! Something\'s wrong with these soldiers...",6,true,'V_Ca4_1');
            }
            if(Stats_Campaign.fc == 11 * 30)
            {
              param1.hud.setMsg(param1.player,"What do you me-- Whoa, hey, watch your fire!",4,true,'V_Ca4_2');
            }
            if(Stats_Campaign.fc == 24 * 30)
            {
              param1.hud.setMsg(param1.units[1],"Sir, I don\'t feel so...auugh!",6,true,'V_Ca4_3');
            }
            if(Stats_Campaign.fc == 25 * 30)
            {
              param1.units[1].changeTeam(0);
              param1.units[1].changeSkin(2);
            }
            if(Stats_Campaign.fc == 30 * 30)
            {
              param1.hud.setMsg(param1.player,"Jenkins! Friendly Fire!",4,true,'V_Ca4_4');
            }
            if(Stats_Campaign.fc == 34 * 30)
            {
              param1.hud.setMsg(param1.units[1],"YAAGHH--AARRAAAUGH!",4,true,'V_Ca4_5');
            }
            if(Stats_Campaign.fc != 40 * 30)
            {
              break;
            }
            param1.hud.setMsg(param1.player,"What the hell is this place...",4,true,'V_Ca4_6');
            break;
          case 5:
            if(Stats_Campaign.sn == 1 && Stats_Campaign.fc == 2 * 30)
            {
              param1.hud.setCharMsg("sniper",7,"Shadow","Sir, whatever was out there must have come from this place. Goodluck.",6,true,'V_Ca5_1');
            }
            if(Stats_Campaign.sn == 3)
            {
              if(Stats_Campaign.fc == 5 * 30)
              {
                param1.hud.setMsg(param1.units[4],"What? I don\'t know who you are, but help me!",5,true,'V_Ca1_13');
              }
              if(Stats_Campaign.fc == 10 * 30)
              {
                param1.hud.setMsg(param1.player,"Don\'t worry I\'ve got you.",4,true,'V_Ca1_14');
              }
            }
            if(param1.matchSettings.team1score == 6 && Stats_Campaign.sn == 3)
            {
              param1.hud.setMsg(param1.player,"Hehehah, take some of this!",5,true,'V_Ca1_15');
              ++Stats_Campaign.sn;
            }
            if(param1.matchSettings.team1score == 9 && Stats_Campaign.sn == 4)
            {
              param1.hud.setMsg(param1.units[4],"I\'m very sorry for killing you!",4,true,'V_Ca1_16');
              ++Stats_Campaign.sn;
            }
            if(param1.matchSettings.team1score == 12 && Stats_Campaign.sn == 5)
            {
              param1.hud.setMsg(param1.units[1],"Their firepower is too strong... Aeuughh!",5,true,'V_Ca1_17');
              ++Stats_Campaign.sn;
            }
            if(param1.matchSettings.team1score == 14 && Stats_Campaign.sn == 6)
            {
              param1.hud.setMsg(param1.player,"These guys are smalltime!",5,true,'V_Ca1_18');
              ++Stats_Campaign.sn;
            }
            break;
          case 6:
            if(Stats_Campaign.fc == 3 * 30 && Stats_Campaign.sn == 1)
            {
              param1.hud.setMsg(param1.player,"Alright men, let\'s spread out and find all those plants.",6,true,'V_Ca6_1');
            }
            if(Stats_Campaign.fc == 9 * 30 && Stats_Campaign.sn == 1)
            {
              param1.hud.setMsg(param1.units[3],"Sir! I think I heard something.",4,true,'V_Ca6_2');
            }
            if(Stats_Campaign.fc == 14 * 30 && Stats_Campaign.sn == 1)
            {
              param1.hud.setMsg(param1.player,"Stay alert, remember our priority is those plants.",6,true,'V_Ca6_3');
            }
            if(param1.matchSettings.team1score >= 25 && Stats_Campaign.sn == 1)
            {
              SH.playMusic('M_Train');
              param1.hud.setMsg(param1.units[1],"AMBUSH!",5,true,'V_Ca6_4');
              param1.units[5].spawn();
              param1.units[6].spawn();
              param1.units[7].spawn();
              param1.units[8].spawn();
              ++Stats_Campaign.sn;
            }
            if(param1.matchSettings.team1score >= 75 && Stats_Campaign.sn == 3)
            {
              ++Stats_Campaign.sn;
              Stats_Campaign.fc = 0;
            }
            if(Stats_Campaign.fc == 3 * 30 && Stats_Campaign.sn == 4)
            {
              param1.hud.setMsg(param1.units[2],"Sir we\'re almost done for the sample!",6,true,'V_Ca6_5');
            }
            if(Stats_Campaign.fc == 9 * 30 && Stats_Campaign.sn == 4)
            {
              param1.hud.setMsg(param1.player,"Right, clear the area and I\'ll call for evac.",6,true,'V_Ca6_6');
            }
            break;
          case 7:
            if(Stats_Campaign.fc == 3 * 30 && Stats_Campaign.sn == 1)
            {
              param1.hud.setMsg(param1.player,"It\'s time to find out who these guys are. Gather as much intel as you can!",6,true,'V_Ca7_1');
            }
            if(Stats_Campaign.fc == 12 * 30 && Stats_Campaign.sn == 1)
            {
              param1.hud.setMsg(param1.units[5],"They\'re out for our intel, stop them!",5,true,'V_Ca7_2');
            }
            if(param1.matchSettings.team1score == 1 && Stats_Campaign.sn == 1)
            {
              ++Stats_Campaign.sn;
              Stats_Campaign.fc = 0;
            }
            if(Stats_Campaign.fc == 3 * 30 && Stats_Campaign.sn == 2)
            {
              param1.hud.setMsg(param1.units[1],"I\'ve analyzed some of the intel. They\'re an organization called \"Globex\".",6,true,'V_Ca7_3');
            }
            if(Stats_Campaign.fc == 9 * 30 && Stats_Campaign.sn == 2)
            {
              param1.hud.setMsg(param1.units[2],"Globex? I don\'t like the sound of that. It sounds...global.",6,true,'V_Ca7_4');
            }
            break;
          case 8:
            if(Stats_Campaign.fc == 3 * 30)
            {
              param1.hud.setMsg(param1.player,"We have to stop Globex from destroying the research facility. We need that cure!",7,true,'V_Ca8_1');
            }
            if(Stats_Campaign.fc != 12 * 30)
            {
              break;
            }
            param1.hud.setMsg(param1.units[5],"The facility needs to be destroyed, continue the assault!",6,true,'V_Ca8_2');
            break;
          case 9:
            if(Stats_Campaign.fc == 5 * 30 && Stats_Campaign.sn == 2)
            {
              param1.hud.setMsg(param1.player,"Ok men, we need to secure that research before it\'s destroyed!",6,true,'V_Ca9_1');
            }
            if(Stats_Campaign.fc == 11 * 30 && Stats_Campaign.sn == 2)
            {
              param1.hud.setMsg(param1.units[1],"Roger that.",4,true,'V_Ca9_2');
            }
            if(param1.matchSettings.team1score >= 25 && Stats_Campaign.sn == 2)
            {
              ++Stats_Campaign.sn;
              Stats_Campaign.fc = 0;
            }
            if(Stats_Campaign.fc == 3 * 30 && Stats_Campaign.sn == 3)
            {
              param1.hud.setMsg(param1.units[1],"What are these things? Zombies?!",6,true,'V_Ca9_3');
            }
            if(Stats_Campaign.fc == 9 * 30 && Stats_Campaign.sn == 3)
            {
              param1.hud.setMsg(param1.player,"Keep your head straight! Whatever they are, they\'re dangerous.",6,true,'V_Ca9_4');
            }
            if(param1.matchSettings.team1score >= 50 && Stats_Campaign.sn == 3)
            {
              ++Stats_Campaign.sn;
              Stats_Campaign.fc = 0;
            }
            if(Stats_Campaign.fc == 3 * 30 && Stats_Campaign.sn == 4)
            {
              param1.hud.setMsg(param1.units[3],"Brraaagh!",4,true,'V_Ca9_5');
            }
            if(Stats_Campaign.fc == 9 * 30 && Stats_Campaign.sn == 4)
            {
              param1.hud.setMsg(param1.units[1],"What, did he just say BRAINS??",6,true,'V_Ca9_6');
            }
            if(param1.matchSettings.team1score >= 75 && Stats_Campaign.sn == 4)
            {
              param1.hud.setMsg(param1.player,"We\'ve almost secured all of the research. That cure is ours!",5,true,'V_Ca9_7');
              ++Stats_Campaign.sn;
            }
            break;
          case 10:
            if(Stats_Campaign.fc == 3 * 30)
            {
              param1.hud.setMsg(param1.player,"All that\'s left is the intel on that main terminal.",6,true,'V_Ca10_1');
            }
            if(Stats_Campaign.fc == 7 * 30)
            {
              param1.hud.setMsg(param1.player,"But we\'ll need to eliminate them all to get to it.",6,true,'V_Ca10_2');
            }
            if(Stats_Campaign.fc == 13 * 30)
            {
              param1.hud.setMsg(param1.units[1],"Yes sir!",4,true,'V_Ca10_3');
            }
            if(param1.matchSettings.team1score >= 14 && Stats_Campaign.sn == 1)
            {
              param1.hud.setMsg(param1.units[5],"Requesting backup! Use your landmines!",6,true,'V_Ca10_4');
              param1.units[7].spawn();
              ++Stats_Campaign.sn;
            }
            if(!(param1.matchSettings.team1score >= 22 && Stats_Campaign.sn == 2))
            {
              break;
            }
            param1.hud.setMsg(param1.units[5],"More backup! We need all forces, now!",6,true,'V_Ca10_5');
            param1.units[8].spawn();
            ++Stats_Campaign.sn;
            break;
          case 11:
            if(Stats_Campaign.fc != 3 * 30)
            {
              break;
            }
            param1.hud.setMsg(param1.player,"We have to stop that missile, take out all the guards!",6,true,'V_Ca11_1');
            break;
          case 12:
            if(Stats_Campaign.fc == 3 * 30 && Stats_Campaign.sn == 1)
            {
              param1.hud.setMsg(param1.player,"We\'ve got to stop this train!",5,true,'V_Ca12_1');
            }
            if(Stats_Campaign.fc == 9 * 30 && Stats_Campaign.sn == 1)
            {
              param1.hud.setMsg(param1.units[1],"Maybe if we can find some sort of access panel...",6,true,'V_Ca12_2');
            }
            if(param1.matchSettings.team1score >= 50 && Stats_Campaign.sn == 1)
            {
              ++Stats_Campaign.sn;
              Stats_Campaign.fc = 0;
            }
            if(Stats_Campaign.fc == 3 * 30 && Stats_Campaign.sn == 2)
            {
              param1.hud.setMsg(param1.units[3],"They\'ve blown the brakes, we can\'t stop the train!",6,true,'V_Ca12_3');
            }
            if(Stats_Campaign.fc == 9 * 30 && Stats_Campaign.sn == 2)
            {
              param1.hud.setMsg(param1.player,"Keep looking! There\'s got to be a way to stop this launch!",6,true,'V_Ca12_4');
            }
            break;
          case 13:
            if(Stats_Campaign.fc == 3 * 30)
            {
              param1.hud.setCharMsg("sniper",7,"Shadow","Sir I\'m spotting multiple enemy MiG\'s on the radar.",4,true,'V_Ca13_1');
            }
            if(Stats_Campaign.fc == 7 * 30)
            {
              SH.playSound('S_Jet');
            }
            if(Stats_Campaign.fc == 9 * 30)
            {
              param1.units[1].spawn();
              param1.units[2].spawn();
              param1.hud.setMsg(param1.player,"Ahehehehe, like fish in a barrel!",6,true,'V_Ca13_2');
            }
            if(Stats_Campaign.fc == 17 * 30)
            {
              param1.units[3].spawn();
              param1.units[4].spawn();
            }
            if(!(param1.matchSettings.team1score == 13 && Stats_Campaign.sn == 1))
            {
              break;
            }
            param1.hud.setCharMsg("sniper",7,"Shadow","We\'re approaching the missile, you\'ll have to jump!",6,true,'V_Ca13_3');
            ++Stats_Campaign.sn;
            break;
          case 14:
            if(Stats_Campaign.fc == 3 * 30 && Stats_Campaign.sn == 1)
            {
              param1.hud.gotoAndStop("tutparachute");
            }
            if(Stats_Campaign.fc == 6 * 30 && Stats_Campaign.sn == 1)
            {
              param1.hud.setMsg(param1.player,"So I have to replace the warhead with the cure...",6,true,'V_Ca14_1');
            }
            if(Stats_Campaign.fc == 12 * 30 && Stats_Campaign.sn == 1)
            {
              param1.hud.setCharMsg("sniper",7,"Shadow","I hope you know what you\'re doing.",4,true,'V_Ca14_2');
              param1.hud.gotoAndStop("idle");
            }
            if(param1.matchSettings.team1score >= 40 && Stats_Campaign.sn == 1)
            {
              ++Stats_Campaign.sn;
              Stats_Campaign.fc = 0;
            }
            if(Stats_Campaign.fc == 3 * 30 && Stats_Campaign.sn == 2)
            {
              param1.hud.setCharMsg("sniper",7,"Shadow","Be careful not to alter the guidance system.",6,true,'V_Ca14_3');
            }
            if(Stats_Campaign.fc == 9 * 30 && Stats_Campaign.sn == 2)
            {
              param1.hud.setMsg(param1.player,"Damn it, this isn\'t brain surgery, it\'s rocket science!",6,true,'V_Ca14_4');
            }
            if(param1.matchSettings.team1score >= 70 && Stats_Campaign.sn == 2)
            {
              ++Stats_Campaign.sn;
              Stats_Campaign.fc = 0;
            }
            if(Stats_Campaign.fc == 3 * 30 && Stats_Campaign.sn == 3)
            {
              param1.hud.setMsg(param1.player,"So do I cut the red wire or the blue wire?",6,true,'V_Ca14_5');
            }
            if(Stats_Campaign.fc == 9 * 30 && Stats_Campaign.sn == 3)
            {
              param1.hud.setCharMsg("sniper",7,"Shadow","The uh... the green one!",6,true,'V_Ca14_6');
            }
            break;
          case 15:
            if(Stats_Campaign.fc == 3 * 30 && Stats_Campaign.sn == 1)
            {
              param1.hud.setMsg(param1.units[1],"This nuke is going to wipe that toxin off the face of the earth!",5,true,'V_Ca15_1');
            }
            if(Stats_Campaign.fc == 9 * 30 && Stats_Campaign.sn == 1)
            {
              param1.hud.setMsg(param1.player,"You\'re insane! Millions will die!",5,true,'V_Ca15_2');
            }
            if(param1.matchSettings.team1score == 4 && Stats_Campaign.sn == 1)
            {
              param1.units[1].unitInfo.secondary = "Desert Eagle";
              ++Stats_Campaign.sn;
              Stats_Campaign.fc = 0;
            }
            if(Stats_Campaign.fc == 3 * 30 && Stats_Campaign.sn == 2)
            {
              param1.hud.setMsg(param1.units[1],"And who do you think is at fault here?",5,true,'V_Ca15_3');
            }
            if(Stats_Campaign.fc == 9 * 30 && Stats_Campaign.sn == 2)
            {
              param1.hud.setMsg(param1.player,"Hey! We\'ve been trying to cure the infection!",5,true,'V_Ca15_4');
            }
            if(param1.matchSettings.team1score == 7 && Stats_Campaign.sn == 2)
            {
              param1.units[1].unitInfo.extra.forcePistol = false;
              ++Stats_Campaign.sn;
              Stats_Campaign.fc = 0;
            }
            if(Stats_Campaign.fc == 3 * 30 && Stats_Campaign.sn == 3)
            {
              param1.hud.setMsg(param1.units[1],"It\'s not that simple you see, things aren\'t exactly what they seem...",6,true,'V_Ca15_5');
            }
            if(Stats_Campaign.fc == 9 * 30 && Stats_Campaign.sn == 3)
            {
              param1.hud.setMsg(param1.player,"No, this ends now!",4,true,'V_Ca15_6');
            }
            if(param1.matchSettings.team1score == 10 && Stats_Campaign.sn == 3)
            {
              ++Stats_Campaign.sn;
              Stats_Campaign.fc = 0;
            }
            if(!(Stats_Campaign.fc == 3 * 30 && Stats_Campaign.sn == 4))
            {
              break;
            }
            param1.hud.setMsg(param1.units[1],"Ha ha ha ha ha ha ha!",4,true,'V_Ca15_7');
            param1.units[1].unitInfo.extra.permaSurge = true;
        }
        break;
      case 1:
        switch(MatchSettings.caStage)
        {
          case 1:
        }
    }
    ++Stats_Campaign.fc;
  }

  private static setPlr(param1: number, param2: string, param3: string, param4: number, param5: string, param6: string, param7: string, param8: string, param9: number, param10: Record<string, any>): any {
    if(!Stats_Campaign.showStatsOnly)
    {
      MatchSettings.caPlayer = {};
      MatchSettings.caPlayer.team = param1;
      MatchSettings.caPlayer.name = param2;
      if(!param3)
      {
        MatchSettings.caPlayer.soldier = 0;
      }
      else
      {
        MatchSettings.caPlayer.soldier = Stats_Classes.classNums.indexOf(param3);
      }
      MatchSettings.caPlayer.skin = param4;
      MatchSettings.caPlayer.primary = param5;
      MatchSettings.caPlayer.secondary = param6;
      MatchSettings.caPlayer._skill = param7;
      MatchSettings.caPlayer._streak = param8;
      MatchSettings.caPlayer.extra = param10;
      return;
    }
  }

  private static addBot(param1: number, param2: string, param3: string, param4: number, param5: string, param6: string, param7: string, param8: string, param9: number, param10: Record<string, any>): any {
    let _loc12_: any = false;
    let _loc13_: any = 0;
    if(!Stats_Campaign.showStatsOnly)
    {
      let _loc11_: any = {};
      _loc11_.team = param1;
      if(!param2)
      {
        while(!_loc12_)
        {
          param2 = UT.randEl(MatchSettings.qmBotNames);
          _loc12_ = true;
          _loc13_ = 0;
          while(_loc13_ < MatchSettings.caBots.length)
          {
            if(MatchSettings.caBots[_loc13_].name == param2)
            {
              _loc12_ = false;
            }
            _loc13_++;
          }
        }
      }
      _loc11_.name = param2;
      _loc11_.diff = param9;
      _loc11_.level = Stats_Classes.getAiLevel(param9);
      _loc11_.extra = param10;
      if(param3 != "")
      {
        _loc11_.soldier = Stats_Classes.classNums.indexOf(param3);
      }
      else
      {
        _loc11_.soldier = UT.irand(1,4);
      }
      if(param4 != 0)
      {
        _loc11_.skin = param4;
      }
      else
      {
        _loc11_.skin = UT.irand(1,5);
      }
      if(param5 != "")
      {
        _loc11_.primary = param5;
      }
      else
      {
        _loc11_.primary = Stats_Guns.getRandPrimary(_loc11_);
      }
      if(param6 != "")
      {
        _loc11_.secondary = param6;
      }
      else
      {
        _loc11_.secondary = Stats_Guns.getRandSecondary(_loc11_);
      }
      if(param7 != "")
      {
        _loc11_._skill = param7;
      }
      else
      {
        _loc11_._skill = Stats_Skills.getRandSkill(_loc11_);
      }
      if(param8 != "")
      {
        _loc11_._streak = param8;
      }
      else
      {
        _loc11_._streak = Stats_Streaks.getRandStreak(_loc11_);
      }
      MatchSettings.caBots.push(_loc11_);
      return;
    }
  }

  private static setLvl(param1: string, param2: number, param3: string, param4: number, param5: any, param6: string, param7: string, param8: string, param9: Record<string, any>): void {
    Stats_Campaign.sn = 1;
    Stats_Campaign.fc = 0;
    MatchSettings.caMode = param1;
    MatchSettings.caScore = param2;
    MatchSettings.caMap = param3;
    MatchSettings.caBots = [];
    MatchSettings.caName = param6;
    MatchSettings.caDesc = param7;
    MatchSettings.caSpecial = param8;
    MatchSettings.caDiff = param4;
    MatchSettings.useSong = param5;
    MatchSettings.useExtra = param9;
  }

  private static setCutscene(param1: any, param2: any, param3: any, param4: any): void {
    if(!Stats_Campaign.showStatsOnly)
    {
      MatchSettings.preCutSong = param1;
      MatchSettings.preCutFrames = param2;
      MatchSettings.postCutSong = param3;
      MatchSettings.postCutFrames = param4;
      return;
    }
  }
}
