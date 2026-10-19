// Port of Status.as — hp / armor / regeneration, timed status effects (glows), damage pipeline.
import { BlurFilter, type Filter } from 'pixi.js';
import { FlashGlowFilter } from '../swf/flashFilters';
import { uint } from '../flash/as3';
import { UT } from './UT';
import { SD } from './SD';
import { MatchSettings } from './MatchSettings';
import { Stats_Guns } from './Stats_Guns';
import type { Unit } from './Unit';

export class Status {
  private unit: Unit;
  hpCur = NaN;
  hpMax = NaN;
  shCur = NaN;
  private bar_width = NaN;
  /** AS3 uint */
  private regenDelay = 0;
  /** AS3 uint */
  stealthDelay = 0;
  /** AS3 uint */
  sSpawn = 0;
  sInvis = 0;
  sSurge = 0;
  sRapidHeal = 0;
  sReflect = 0;
  sFire = 0;
  sBlur = 0;
  /** AS3 uint */
  private fc = 0;
  /** AS3 untyped (`*`) */
  private bigSkillCooldown: any = 0;

  /** Pixi filter instances reused across frames (the original allocated new Flash filters every frame). */
  private filterCache = new Map<string, Filter>();

  constructor(param1: Unit) {
    this.unit = param1;
    this.unit.bar_hurt.width = 0;
    this.stealthDelay = 60;
  }

  /** flash.filters.GlowFilter(color, alpha, blurX, blurY, strength, quality, inner, knockout) */
  private glow(color: number, alpha = 1, blurX = 6, blurY = 6, strength = 2, quality = 1, inner = false, knockout = false): Filter {
    const key = `g${color}|${blurX}|${blurY}|${strength}|${quality}|${inner}|${knockout}`;
    let f = this.filterCache.get(key) as FlashGlowFilter | undefined;
    if (!f) {
      f = new FlashGlowFilter(color, alpha, blurX, blurY, strength, quality, inner, knockout);
      this.filterCache.set(key, f);
    }
    f.alpha = Math.max(0, Math.min(1, alpha));
    return f;
  }

  /** flash.filters.BlurFilter(blurX, blurY, quality) */
  private blur(blurX: number, blurY: number, quality: number): Filter {
    const key = `b${blurX}|${blurY}|${quality}`;
    let f = this.filterCache.get(key);
    if (!f) {
      // Flash: `quality` box passes of width blurX → σ = blurX·√q/√12; Pixi's 9-tap pass has σ ≈ 1.864·strength
      // (same mapping as src/swf/effects.ts).
      const q = Math.max(1, quality);
      const sigma = (b: number) => (b * Math.sqrt(q)) / Math.sqrt(12) / 1.864;
      f = new BlurFilter({ strengthX: sigma(blurX), strengthY: sigma(blurY), quality: q, kernelSize: 9 });
      this.filterCache.set(key, f);
    }
    return f;
  }

  reset(): void {
    this.hpCur = this.hpMax = this.unit.unitInfo.hp;
    this.shCur = 0;
    this.sInvis = 0;
    this.sSurge = 0;
    this.sRapidHeal = 0;
    this.sReflect = 0;
    this.sFire = 0;
    this.sBlur = 0;
    this.bar_width = 40 + this.hpMax / 10;
    this.heal(this.hpMax, false, true);
    if (this.unit.human) {
      this.unit.game.hud.bloodyscreen.alpha = 0;
      this.unit.game.hud.bloodyscreen.scale.x = UT.coinFlip(1, -1);
      this.unit.game.hud.bloodyscreen.scale.y = UT.coinFlip(1, -1);
      this.unit.game.hud.bloodyscreen.gotoAndStop(!SD.screenBlood ? 2 : 1);
    }
  }

  heal(param1: number, param2 = true, param3 = false): void {
    if (!(Boolean(this.unit.dead) && !param3)) {
      this.hpCur += param1;
      if (this.hpCur > this.hpMax) {
        this.hpCur = this.hpMax;
      }
      if (param2) {
        this.unit.game.createEffect(this.unit.x, this.unit.y - 40, 'heal');
      }
      this.setBars();
      return;
    }
  }

  damage(param1: number, param2: Unit, param3: Stats_Guns, param4: any, param5 = false): void {
    let _loc7_ = NaN;
    let _loc8_ = NaN;
    if (!this.unit.dead) {
      if (!((Boolean(this.sSpawn) || Boolean(this.sReflect)) && !param5)) {
        if (this.unit == param2) {
          if (param3.extra.noAllyDmg) {
            param1 *= 0.4;
          }
        } else if (!this.unit.human) {
          if (!(MatchSettings.isCampaign && !this.unit.human && !param2.human)) {
            if (!this.unit.human && !param2.human) {
              param1 *= 0.6 + param2.diff * 0.04;
            }
          } else {
            param1 *= 0.4 + param2.diff * 0.03;
          }
        } else {
          param1 *= 0.3 + param2.diff * 0.07;
        }
        if (this.unit.isJug) {
          param1 *= 0.7;
        }
        if (this.unit.unitInfo.skill.id == 'will' && this.bigSkillCooldown == 0) {
          param1 *= 0.3;
          this.bigSkillCooldown = this.unit.unitInfo.skill.value * 20;
          this.unit.game.createParticle(this.unit.x + UT.rand(-5, 5), this.unit.y - UT.rand(40, 65), 'text', 0, null, 'bigText', 'ironwill');
        }
        if (this.sSurge) {
          param1 *= 0.7;
        }
        if (param2.status.sSurge) {
          param1 *= 1.3;
        }
        if (Boolean(this.unit.team) && Boolean(this.unit.team == param2.team) && this.unit != param2) {
          param1 *= 0.3;
          param4.teamkill = true;
          if (param3.extra.noAllyDmg) {
            return;
          }
        }
        let _loc6_ = Number(param2.unitInfo.crit);
        if (param2.unitInfo.skill.id == 'shadow' && param2.status.sInvis == 1 && param2.gun.curGun.typeName == 'Melee') {
          _loc6_ += param2.unitInfo.skill.value;
        }
        if (param2.gun.curGun.extra.critical) {
          _loc6_ += param2.gun.curGun.extra.critical;
        }
        if (!(Boolean(param4.headMult && param3.typeName != 'Explosive') && Boolean(param3.typeName != 'Melee') && this.unit != param2)) {
          if (Math.random() <= _loc6_ && this.unit != param2) {
            param4.critMult = true;
            _loc8_ = Number(param2.unitInfo.critBonus);
            if (param2.gun.curGun.extra.criticalDmg) {
              _loc8_ += param2.gun.curGun.extra.criticalDmg;
            }
            param1 *= _loc8_;
            this.unit.game.createParticle(this.unit.x + UT.rand(-5, 5), this.unit.y - UT.rand(25, 50), 'text', 0, null, 'bigText', 'critical');
          }
        } else {
          _loc7_ = Number(param2.unitInfo.headBonus);
          if (param2.gun.curGun.extra.headDmg) {
            // QUIRK (original bug): adds to the crit variable, so gun head-damage bonuses have no effect.
            _loc8_ += param2.gun.curGun.extra.headDmg;
          }
          param1 *= _loc7_;
          this.unit.game.createParticle(this.unit.x + UT.rand(-5, 5), this.unit.y - UT.rand(50, 55), 'text', 0, null, 'bigText', 'headshot');
        }
        if (param4.splashMult) {
          param1 *= param4.splashMult;
        }
        // QUIRK: checks the attacker's *current* gun type, not the damaging weapon.
        if (param2.gun.curGun.typeName == 'Explosive' && this.unit.unitInfo.skill.id == 'resist') {
          param1 *= this.unit.unitInfo.skill.value;
        }
        if (param2.gun.curGun.typeName == 'Explosive' && Boolean(this.unit.gun.primary.extra.resist)) {
          param1 *= this.unit.gun.primary.extra.resist;
        }
        if (!param4.shielded) {
          if (this.unit.gun.primary.typeName == 'Shield' && this.unit.unitInfo.skill.id == 'iron') {
            param1 *= this.unit.unitInfo.skill.value;
          }
        } else {
          param1 *= 1 - this.unit.gun.primary.extra.reduce;
        }
        if (Boolean(this.shCur) && !param5) {
          this.shCur -= param1;
          if (this.shCur > 0) {
            param1 = 0;
          } else {
            param1 = -this.shCur;
            this.shCur = 0;
          }
        }
        this.hpCur -= param1;
        if (!param5 && this.hpCur <= 0 && this.unit.unitInfo.skill.id == 'operation' && !this.bigSkillCooldown) {
          this.bigSkillCooldown = this.unit.unitInfo.skill.value * 30;
          this.heal(this.hpMax * 0.5);
        }
        if (this.hpCur > 0) {
          if ((this.unit.unitInfo.skill.id == 'blur' || this.unit.unitInfo.skill.id == 'blur2') && !this.bigSkillCooldown && this.hpCur < this.hpMax * 0.3) {
            this.bigSkillCooldown = this.unit.unitInfo.skill.value * 30;
            this.sBlur = 2 * 30;
          }
        } else {
          this.hpCur = 0;
          this.unit.die(param2, param3, param4);
          if (this.unit.human) {
            this.unit.game.hud.bloodyscreen.alpha = 1;
          }
          if (this.unit.unitInfo.skill.id == 'bomb' && !this.bigSkillCooldown) {
            this.bigSkillCooldown = this.unit.unitInfo.skill.value * 30;
            this.unit.gun.makeBullet(Stats_Guns.gunOb['bomb']);
          }
        }
        this.setStealthDelay();
        if (this.unit.unitInfo.skill.id != 'regen') {
          this.regenDelay = 30 * 3;
        }
        this.setBars();
        return;
      }
      return;
    }
  }

  setBars(): void {
    const _loc1_ = this.unit.bar_hp.width;
    this.unit.bar_hp.width = (this.hpCur / this.hpMax) * this.bar_width;
    if (_loc1_ - this.unit.bar_hp.width > 0) {
      this.unit.bar_hurt.width += _loc1_ - this.unit.bar_hp.width;
    } else {
      this.unit.bar_hurt.width = 0;
    }
    this.unit.bar_hurt.x = this.unit.bar_hp.x + this.unit.bar_hp.width;
    if (this.unit.human) {
      this.unit.game.hud.txt_hp.text = Math.ceil(this.hpCur) + ' Hp';
    }
  }

  setStealthDelay(): void {
    if (this.unit.unitInfo.skill.id != 'shadow2') {
      this.stealthDelay = 60;
    } else {
      this.stealthDelay = 10;
    }
  }

  EnterFrame(): void {
    let _loc1_ = NaN;
    ++this.fc;
    if (this.bigSkillCooldown) {
      --this.bigSkillCooldown;
    }
    if (this.unit.unitInfo.extra.permaSurge) {
      this.sSurge = 99;
    }
    if (this.sSurge) {
      if (this.sSurge > 10 || this.sSurge % 2 != 0) {
        if (!SD.graphGlow) {
          this.unit.MCfilters.push(this.glow(16711680, 1, 10, 10, 1.5));
        } else {
          this.unit.MCfilters.push(this.glow(16711680, 1, 20, 20, 1.5, 1, true, false), this.glow(16711680, 1, 5, 5, 1));
        }
      }
      if (this.sSurge == 1) {
        this.unit.endKillstreak();
      }
      --this.sSurge;
    }
    if (this.sReflect) {
      if (this.sReflect > 10 || this.sReflect % 2 != 0) {
        this.unit.MCfilters.push(this.glow(10092543, 1, 20, 20, 1.5, 1, true));
        this.unit.game.bitscreen.paint(this.unit.x + this.unit.game.arena.x, this.unit.y + this.unit.game.arena.y - 30, true, 'mirror0', 'ball');
      }
      if (this.sReflect == 1) {
        this.unit.endKillstreak();
      }
      --this.sReflect;
    }
    if (this.sBlur) {
      if (this.sBlur > 10 || this.sBlur % 2 != 0) {
        this.unit.MCfilters.push(this.blur(10, 0, 1));
      }
      --this.sBlur;
    }
    if (this.sFire) {
      if (this.sFire % 17 == 0) {
        this.unit.game.playScreenSound('S_Fire', this.unit.x, this.unit.y);
      }
      if (this.sFire > 10 || this.sFire % 2 != 0) {
        if (SD.graphGlow) {
          this.unit.MCfilters.push(this.glow(16758272, 1, 20, 20, 1.5, 1, true, false), this.glow(16758272, 1, 5, 5, 1));
        } else {
          this.unit.MCfilters.push(this.glow(16758272, 1, 10, 10, 1.5));
        }
        this.unit.game.createEffect(this.unit.x + UT.rand(-10, 10), this.unit.y + UT.rand(-55, -10), 'flame');
      }
      if (this.fc % 10 == 0) {
        this.unit.gun.makeBullet(Stats_Guns.gunOb['fire']);
      }
      if (this.unit.unitInfo.streak.id == 'fire' && this.unit.streakInProgress && this.sFire == 1) {
        this.unit.endKillstreak();
      }
      --this.sFire;
    }
    if (this.sSpawn) {
      if (this.sSpawn > 10 || this.sSpawn % 2 != 0) {
        if (SD.graphGlow) {
          this.unit.MCfilters.push(this.glow(10092543, 1, 10, 10, 1.5, 1, true, false), this.glow(16777215, 1, 5, 5, 1));
        } else {
          this.unit.MCfilters.push(this.glow(13434879, 1, 10, 10, 1.5));
        }
      }
      this.sSpawn = uint(this.sSpawn - 1);
    }
    if (this.shCur) {
      if (!SD.graphGlow) {
        this.unit.MCfilters.push(this.glow(16777164, this.shCur / 120 + 0.5, 10, 10, 1.5));
      } else {
        this.unit.MCfilters.push(this.glow(16777164, this.shCur / 120 + 0.2, 15, 15, 1, 1, true, false), this.glow(16777164, this.shCur / 120 + 0.5, 4, 4, 1));
      }
    }
    if (this.unit.isJug) {
      this.unit.MCfilters.push(this.glow(16724736, 1, 8, 8, 2));
    }
    if (!this.sInvis) {
      this.unit.alpha = 1;
      this.unit.MC.alpha = 1;
    } else if (!(this.unit.human || this.unit.team == 1)) {
      this.unit.alpha = 1 - this.sInvis;
    } else {
      this.unit.MC.alpha = 1 - this.sInvis * 0.8;
    }
    if (this.unit.bar_hurt.width <= 0) {
      this.unit.bar_hurt.width = 0;
    } else {
      this.unit.bar_hurt.width += (0 - this.unit.bar_hurt.width) * 0.1;
    }
    if (this.unit.unitInfo.skill.id != 'shadow') {
      if (this.unit.unitInfo.skill.id == 'shadow2') {
        if (this.unit.hasFlag) {
          this.stealthDelay = 60;
        }
        if (!this.stealthDelay) {
          this.sInvis += 0.1;
          if (this.sInvis > 1) {
            this.sInvis = 1;
          }
        } else {
          this.stealthDelay = uint(this.stealthDelay - 1);
          this.sInvis -= 0.1;
          if (this.sInvis < 0) {
            this.sInvis = 0;
          }
        }
      }
    } else {
      if (!this.unit.mov.crouching || Boolean(this.unit.hasFlag)) {
        this.stealthDelay = 60;
      }
      if (!this.stealthDelay) {
        this.sInvis += 0.05;
        if (this.sInvis > 1) {
          this.sInvis = 1;
        }
      } else {
        this.stealthDelay = uint(this.stealthDelay - 1);
        this.sInvis -= 0.1;
        if (this.sInvis < 0) {
          this.sInvis = 0;
        }
      }
    }
    if (!this.sRapidHeal) {
      if (!this.regenDelay) {
        this.heal(this.unit.unitInfo.regen, false);
        if (this.hpCur < this.hpMax) {
          if (this.unit.unitInfo.skill.id != 'adren') {
            if (this.fc % 10 == 0) {
              this.unit.game.createEffect(this.unit.x + UT.rand(-10, 10), this.unit.y + UT.rand(-45, -10), 'healthRegen');
            }
          } else if (this.fc % 3 == 0) {
            this.unit.game.createEffect(this.unit.x + UT.rand(-10, 10), this.unit.y + UT.rand(-45, -10), 'healthRegenRed');
          }
        }
      } else {
        this.regenDelay = uint(this.regenDelay - 1);
      }
    } else {
      this.heal(this.hpMax * 0.003, false);
      if (this.fc % 3 == 0) {
        this.unit.game.createEffect(this.unit.x + UT.rand(-10, 10), this.unit.y + UT.rand(-45, -10), 'healthRegen');
      }
      if (this.sRapidHeal > 10 || this.sRapidHeal % 2 != 0) {
        this.unit.MCfilters.push(this.glow(65280, 0.8, 10, 10, 1, 1, true));
      }
      if (this.unit.unitInfo.streak.id == 'rapid' && this.unit.streakInProgress && this.sRapidHeal == 1) {
        this.unit.endKillstreak();
      }
      --this.sRapidHeal;
    }
    if (this.unit.human) {
      _loc1_ = this.hpCur / this.hpMax;
      if (_loc1_ <= 0.5) {
        this.unit.game.hud.bloodyscreen.alpha = 1 - _loc1_ * 1.8;
      } else {
        this.unit.game.hud.bloodyscreen.alpha = 0;
      }
    }
  }
}
