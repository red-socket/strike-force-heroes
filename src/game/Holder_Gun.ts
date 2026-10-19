// Port of Holder_Gun.as — shop/loadout gun tile (symbol729). Placed on Menu timelines and created in code.
import type { Container } from 'pixi.js';
import { Symbol } from '../flash/runtime';
import { SwfClip, type SwfTextField } from '../swf/display';
import { SD, type ClassSave } from './SD';
import { UT } from './UT';
import { Stats_Guns } from './Stats_Guns';
import { Bullet_Proj_Follow } from './Bullet_Proj_Follow';
import { Bullet_Proj_Bounce } from './Bullet_Proj_Bounce';

/** Nearest SwfClip ancestor (skips the runtime's mask-holder Containers). */
export function parentClip(obj: Container): SwfClip | null {
  let p = obj.parent;
  while (p && !(p instanceof SwfClip)) p = p.parent;
  return p;
}

const tf = (mc: SwfClip, name: string) => mc.child<SwfTextField>(name);

export class Holder_Gun extends Symbol {
  get mc_gun(): SwfClip {
    return this.child<SwfClip>('mc_gun');
  }
  get txt_name(): SwfTextField {
    return this.child<SwfTextField>('txt_name');
  }
  get txt_status(): SwfTextField {
    return this.child<SwfTextField>('txt_status');
  }

  gun: Stats_Guns = null as any;
  private mSpd = NaN;

  /**
   * AS3 captured `MovieClip(parent)` in the constructor (valid for timeline placements, null for
   * code-created tiles). Our timeline attaches children after construction, so resolve lazily.
   */
  private get _parent(): SwfClip {
    return parentClip(this)!;
  }

  constructor(param1: Stats_Guns | null = null) {
    super('Holder_Gun');
    this.addFrameScript(0, () => this.frame1());
    if (param1) {
      this.setGun(param1);
    }
  }

  setGun(param1: Stats_Guns, param2: any = '', param3: SwfClip | null = null): void {
    this.gun = param1;
    this.mc_gun.gotoAndStop(this.gun.sprite);
    this.txt_status.text = '';
    if (!(Boolean(param2) && param2 != 'Soldiers')) {
      if (!param3) {
        this.txt_name.text = this.gun.name;
        this.setStatus();
      } else {
        this.setText(param3);
        tf(this._parent, 'txt_name').text = this.gun.name;
        this.txt_name.text = '';
        tf(this._parent, 'txt_type').text = this.gun.typeName;
      }
    } else {
      tf(this._parent, 'txt_name').text = param2;
      this.txt_name.text = this.gun.name;
      tf(this._parent, 'txt_type').text = '';
    }
  }

  setStatus(): void {
    const save = SD.classSaves[SD.selClass] as ClassSave;
    if (!(save.primary == this.gun.id || save.secondary == this.gun.id)) {
      if (save.level >= this.gun.lvlReq) {
        if (SD.unlocks.indexOf(this.gun.id) == -1) {
          this.txt_status.textColor = 16764006;
          this.txt_status.text = '$' + UT.addNumCommas(this.gun.cost);
        } else {
          this.txt_status.text = '';
        }
      } else {
        this.txt_status.textColor = 16750899;
        this.txt_status.text = 'Req lvl ' + this.gun.lvlReq;
      }
    } else {
      this.txt_status.textColor = 13421772;
      this.txt_status.text = 'Equipped';
    }
  }

  modStats(param1 = false): void {
    if (!param1) {
      this.mSpd = 0.3;
    } else {
      this.mSpd = 1;
    }
    const _loc2_: any = Math.ceil(1 / this.gun.shootDelay);
    const P = this._parent;
    const bar = (name: string) => P.child<Container>(name);
    switch (this.gun.typeName) {
      case 'Shield':
        tf(P, 'txtn_dmg').text = 'Reduce';
        tf(P, 'txtn_acc').text = 'Reflect';
        tf(P, 'txtn_rng').text = 'N/A';
        tf(P, 'txtn_spd').text = 'N/A';
        tf(P, 'txtn_amm').text = 'N/A';
        tf(P, 'txt_dmg').text = this.gun.extra.reduce * 100 + '%';
        tf(P, 'txt_acc').text = this.gun.extra.reflect * 100 + '%';
        tf(P, 'txt_rng').text = '';
        tf(P, 'txt_spd').text = '';
        tf(P, 'txt_amm').text = '';
        bar('bar_dmg').width += (this.gun.extra.reduce * 80 - bar('bar_dmg').width) * this.mSpd;
        bar('bar_acc').width += (this.gun.extra.reflect * 80 - bar('bar_acc').width) * this.mSpd;
        bar('bar_rng').width += (0 - bar('bar_rng').width) * this.mSpd;
        bar('bar_spd').width += (0 - bar('bar_spd').width) * this.mSpd;
        bar('bar_amm').width += (0 - bar('bar_amm').width) * this.mSpd;
        break;
      case 'Melee':
        tf(P, 'txtn_dmg').text = 'Damage';
        tf(P, 'txtn_acc').text = 'Critical';
        tf(P, 'txtn_rng').text = 'Crit Dmg';
        tf(P, 'txtn_spd').text = 'Fire Rate';
        tf(P, 'txtn_amm').text = 'N/A';
        tf(P, 'txt_dmg').text = this.gun.dmg + '';
        tf(P, 'txt_acc').text = '+' + this.gun.extra.critical * 100 + '%';
        tf(P, 'txt_rng').text = '+' + this.gun.extra.criticalDmg * 100 + '%';
        tf(P, 'txt_spd').text = Math.ceil(1 / this.gun.shootDelay) + '';
        tf(P, 'txt_amm').text = '';
        bar('bar_dmg').width += ((this.gun.dmg / 250) * 80 - bar('bar_dmg').width) * this.mSpd;
        bar('bar_acc').width += (this.gun.extra.critical * 80 - bar('bar_acc').width) * this.mSpd;
        bar('bar_rng').width += (this.gun.extra.criticalDmg * 80 - bar('bar_rng').width) * this.mSpd;
        bar('bar_spd').width += ((_loc2_ / 15) * 80 - bar('bar_spd').width) * this.mSpd;
        bar('bar_amm').width += (0 - bar('bar_amm').width) * this.mSpd;
        break;
      case 'Sniper':
        tf(P, 'txtn_dmg').text = 'Damage';
        tf(P, 'txtn_acc').text = 'Accuracy';
        tf(P, 'txtn_rng').text = 'Head Dmg';
        tf(P, 'txtn_spd').text = 'Fire Rate';
        tf(P, 'txtn_amm').text = 'Ammo';
        tf(P, 'txt_dmg').text = this.gun.dmg + '';
        tf(P, 'txt_acc').text = (10 - this.gun.recoil) * 10 + '%';
        tf(P, 'txt_rng').text = '+' + this.gun.extra.headDmg * 100 + '%';
        tf(P, 'txt_spd').text = Math.ceil(1 / this.gun.shootDelay) + ' rps';
        tf(P, 'txt_amm').text = this.gun.clipSize + 'x' + (this.gun.clipSpare + 1);
        bar('bar_dmg').width += ((this.gun.dmg / 250) * 80 - bar('bar_dmg').width) * this.mSpd;
        bar('bar_acc').width += (((10 - this.gun.recoil) / 10) * 80 - bar('bar_acc').width) * this.mSpd;
        bar('bar_rng').width += (((this.gun.extra.headDmg * 100) / 150) * 80 - bar('bar_rng').width) * this.mSpd;
        bar('bar_spd').width += ((_loc2_ / 15) * 80 - bar('bar_spd').width) * this.mSpd;
        bar('bar_amm').width += (((this.gun.clipSize * (this.gun.clipSpare + 1)) / 200) * 80 - bar('bar_amm').width) * this.mSpd;
        break;
      default:
        tf(P, 'txtn_dmg').text = 'Damage';
        tf(P, 'txtn_acc').text = 'Accuracy';
        tf(P, 'txtn_rng').text = 'Range';
        tf(P, 'txtn_spd').text = 'Fire Rate';
        tf(P, 'txtn_amm').text = 'Ammo';
        if (!this.gun.extra.extraShots) {
          tf(P, 'txt_dmg').text = this.gun.dmg + '';
        } else {
          tf(P, 'txt_dmg').text = this.gun.dmg + 'x' + (this.gun.extra.extraShots + 1);
        }
        tf(P, 'txt_acc').text = (10 - this.gun.recoil) * 10 + '%';
        tf(P, 'txt_rng').text = this.gun.range * 0.5 + ' ft';
        tf(P, 'txt_spd').text = Math.ceil(1 / this.gun.shootDelay) + ' rps';
        tf(P, 'txt_amm').text = this.gun.clipSize + 'x' + (this.gun.clipSpare + 1);
        if (!this.gun.extra.extraShots) {
          bar('bar_dmg').width += ((this.gun.dmg / 250) * 80 - bar('bar_dmg').width) * this.mSpd;
        } else {
          bar('bar_dmg').width += (((this.gun.dmg * (this.gun.extra.extraShots + 1)) / 250) * 80 - bar('bar_dmg').width) * this.mSpd;
        }
        bar('bar_acc').width += (((10 - this.gun.recoil) / 10) * 80 - bar('bar_acc').width) * this.mSpd;
        bar('bar_rng').width += ((this.gun.range / 250) * 80 - bar('bar_rng').width) * this.mSpd;
        bar('bar_spd').width += ((_loc2_ / 15) * 80 - bar('bar_spd').width) * this.mSpd;
        bar('bar_amm').width += (((this.gun.clipSize * (this.gun.clipSpare + 1)) / 200) * 80 - bar('bar_amm').width) * this.mSpd;
    }
  }

  setText(param1: SwfClip): void {
    const d = tf(param1, 'txt_desc');
    this.txt_status.text = '';
    d.text = '';
    if (this.gun.extra.vision) {
      d.text += 'Vision ' + (this.gun.extra.vision <= 0.5 ? '' : '+') + (this.gun.extra.vision - 0.5) * 100 + '%\n';
    }
    if (this.gun.typeName == 'Assault Rifle' && !this.gun.autoFire) {
      d.text += 'Single Fire\n';
    }
    if (this.gun.typeName == 'Shotgun' && this.gun.autoFire) {
      d.text += 'Auto Fire\n';
    }
    if (this.gun.typeName == 'Explosive' && this.gun.cls == Bullet_Proj_Follow) {
      d.text += 'Fires homing missiles\n';
    }
    if (this.gun.typeName == 'Explosive' && this.gun.cls == Bullet_Proj_Bounce) {
      d.text += 'Fires grenades\n';
    }
    if (this.gun.typeName != 'Melee') {
      if (this.gun.extra.critical) {
        d.text += '+' + this.gun.extra.critical * 100 + '% critical chance\n';
      }
      if (this.gun.extra.criticalDmg) {
        d.text += '+' + this.gun.extra.criticalDmg * 100 + '% critical damage\n';
      }
    } else {
      d.text += 'Increased critical chance\n';
      d.text += 'Increased critical damage\n';
    }
    if (this.gun.typeName == 'Shield') {
      if (this.gun.extra.resist) {
        d.text += this.gun.extra.resist * 100 + '% resistance to explosives' + '\n';
      }
      d.text += 'Used with the secondary weapon' + '\n';
      if (this.gun.extra.halfAim) {
        d.text += 'Reduces accuracy while blocking' + '\n';
      }
      d.text += '\n';
      d.text += 'Reduce damage when blocking \n';
      d.text += 'Chance to reflect bullets when blocking\n';
      d.text += '(Crouch to block)\n';
    }
    if (d.text != '') {
      d.text += '\n';
    }
    if (this.gun.desc) {
      d.text += '"' + this.gun.desc + '"';
    }
    if (d.text == '') {
      d.text = 'None';
    }
  }

  frame1(): void {
    this.stop();
  }
}
