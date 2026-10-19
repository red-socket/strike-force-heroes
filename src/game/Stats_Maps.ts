// Port of Stats_Maps.as — map definitions (art/background/sky/particle ids, physics, water colour).
export class Stats_Maps {
  static mapOrder: string[];

  static Init(): void {
    Stats_Maps.mapOrder = ['tut', 'foundry', 'foundry2', 'train', 'train2', 'plane', 'plane2', 'swamp', 'swamp2', 'cave', 'cave2'];
  }

  static getMap(param1: string): any {
    let _loc2_: any = {};
    _loc2_.id = param1;
    switch(param1)
    {
      case "foundry":
        _loc2_.map = "foundry";
        _loc2_.bg1 = "foundry";
        _loc2_.bg2 = "foundryb";
        _loc2_.sky = "foundry";
        _loc2_.particles = "foundry";
        _loc2_.name = "Foundry";
        _loc2_.desc = "A large smelting plant that houses a dark secret. Beware the lava down pour.";
        _loc2_.phys = "";
        _loc2_.extra = "";
        _loc2_.outdoors = false;
        _loc2_.water = 0;
        break;
      case "foundry2":
        _loc2_.map = "foundry";
        _loc2_.bg1 = "foundry2";
        _loc2_.bg2 = "foundryb2";
        _loc2_.sky = "foundry";
        _loc2_.particles = "foundry";
        _loc2_.name = "Foundry (Night)";
        _loc2_.desc = "A large smelting plant that houses a dark secret. Beware the lava down pour.";
        _loc2_.phys = "";
        _loc2_.extra = "";
        _loc2_.outdoors = false;
        _loc2_.water = 0;
        break;
      case "train":
        _loc2_.map = "train";
        _loc2_.bg1 = "desert";
        _loc2_.bg2 = "desertb";
        _loc2_.sky = "desert";
        _loc2_.particles = "train";
        _loc2_.name = "Speeding Train";
        _loc2_.desc = "A speeding train carrying a live nuclear missile.";
        _loc2_.phys = "train";
        _loc2_.extra = "train";
        _loc2_.outdoors = true;
        _loc2_.water = 0;
        break;
      case "train2":
        _loc2_.map = "train2";
        _loc2_.bg1 = "desert2";
        _loc2_.bg2 = "desertb2";
        _loc2_.sky = "desert2";
        _loc2_.particles = "";
        _loc2_.name = "Dormant Train";
        _loc2_.desc = "A dormant train carrying a live nuclear missile.";
        _loc2_.phys = "";
        _loc2_.extra = "";
        _loc2_.outdoors = true;
        _loc2_.water = 0;
        break;
      case "plane":
        _loc2_.map = "plane";
        _loc2_.bg1 = "clouds";
        _loc2_.bg2 = "cloudssmall";
        _loc2_.sky = "sky";
        _loc2_.particles = "plane";
        _loc2_.name = "Hijack";
        _loc2_.desc = "A 747 cargo plane that was ambushed and shot down by enemies.";
        _loc2_.phys = "sky";
        _loc2_.extra = "plane";
        _loc2_.outdoors = true;
        _loc2_.water = 0;
        break;
      case "plane2":
        _loc2_.map = "plane";
        _loc2_.bg1 = "desert";
        _loc2_.bg2 = "desertb";
        _loc2_.sky = "plane_dusk";
        _loc2_.particles = "plane";
        _loc2_.name = "Hijack (Dawn)";
        _loc2_.desc = "A 747 cargo plane that was ambushed and shot down by enemies.";
        _loc2_.phys = "sky";
        _loc2_.extra = "plane";
        _loc2_.outdoors = true;
        _loc2_.water = 0;
        break;
      case "swamp":
        _loc2_.map = "swamp";
        _loc2_.bg1 = "jungle2";
        _loc2_.bg2 = "jungleb2";
        _loc2_.sky = "sky";
        _loc2_.particles = "swamp";
        _loc2_.name = "Village";
        _loc2_.desc = "A once thriving village in South East Asia, now completely abandoned.";
        _loc2_.phys = "";
        _loc2_.extra = "";
        _loc2_.outdoors = true;
        _loc2_.water = 6710784;
        break;
      case "swamp2":
        _loc2_.map = "swamp";
        _loc2_.bg1 = "jungle";
        _loc2_.bg2 = "jungleb";
        _loc2_.sky = "night";
        _loc2_.particles = "swamp";
        _loc2_.name = "Village (Night)";
        _loc2_.desc = "A once thriving village in South East Asia, now completely abandoned.";
        _loc2_.phys = "";
        _loc2_.extra = "";
        _loc2_.outdoors = true;
        _loc2_.water = 6710784;
        break;
      case "cave":
        _loc2_.map = "cave";
        _loc2_.bg1 = "cave";
        _loc2_.bg2 = "caveb";
        _loc2_.sky = "sky";
        _loc2_.particles = "cave";
        _loc2_.name = "Caverns";
        _loc2_.desc = "A tropical cove outside a secret research facility.";
        _loc2_.phys = "";
        _loc2_.extra = "";
        _loc2_.outdoors = true;
        _loc2_.water = 6737151;
        break;
      case "cave2":
        _loc2_.map = "cave";
        _loc2_.bg1 = "cave2";
        _loc2_.bg2 = "caveb2";
        _loc2_.sky = "dusk";
        _loc2_.particles = "cave";
        _loc2_.name = "Caverns (Dusk)";
        _loc2_.desc = "A tropical cove outside a secret research facility.";
        _loc2_.phys = "";
        _loc2_.extra = "";
        _loc2_.outdoors = true;
        _loc2_.water = 6737151;
        break;
      case "tut":
        _loc2_.map = "tut";
        _loc2_.bg1 = "cave";
        _loc2_.bg2 = "caveb";
        _loc2_.sky = "night";
        _loc2_.particles = "tut";
        _loc2_.name = "Facility";
        _loc2_.desc = "A secret research facility located on an island far off in the ocean.";
        _loc2_.phys = "";
        _loc2_.extra = "";
        _loc2_.outdoors = false;
        _loc2_.water = 0;
        break;
      case "dropship":
        _loc2_.map = "dropship";
        _loc2_.bg1 = "clouds2";
        _loc2_.bg2 = "cloudssmall2";
        _loc2_.sky = "sky";
        _loc2_.particles = "dropship";
        _loc2_.name = "Dropship";
        _loc2_.desc = "A secret research facility located on an island far off in the ocean.";
        _loc2_.phys = "sky";
        _loc2_.extra = "plane";
        _loc2_.outdoors = true;
        _loc2_.water = 0;
        break;
      case "missile":
        _loc2_.map = "missile";
        _loc2_.bg1 = "clouds2";
        _loc2_.bg2 = "cloudssmall2";
        _loc2_.sky = "sky";
        _loc2_.particles = "dropship";
        _loc2_.name = "The Nuke";
        _loc2_.desc = "A secret research facility located on an island far off in the ocean.";
        _loc2_.phys = "sky";
        _loc2_.extra = "plane";
        _loc2_.outdoors = true;
        _loc2_.water = 0;
        break;
      case "missile2":
        _loc2_.map = "missile";
        _loc2_.bg1 = "clouds2";
        _loc2_.bg2 = "cloudssmall2";
        _loc2_.sky = "dusk";
        _loc2_.particles = "dropship";
        _loc2_.name = "The Nuke (Dawn)";
        _loc2_.desc = "A secret research facility located on an island far off in the ocean.";
        _loc2_.phys = "sky";
        _loc2_.extra = "plane";
        _loc2_.outdoors = true;
        _loc2_.water = 0;
    }
    return _loc2_;
  }
}
