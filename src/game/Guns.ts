// Port of Guns.as — per-unit weapon state: ammo, firing, spread, reload, swapping.
import { BevelFilter } from 'pixi-filters';
import { int, trace, uint } from '../flash/as3';
import type { SwfClip } from '../swf/display';
import { SD } from './SD';
import { UT } from './UT';
import { MatchSettings } from './MatchSettings';
import { Stats_Guns } from './Stats_Guns';
import type { BulletClass } from './Bullet';
import type { Hud } from './Hud';
import type { Unit } from './Unit';

export class Guns {
  private unit: Unit;
  private shootDelay = 0; // uint
  private shotPressed = false;
  reloading = false;
  reflecting = NaN;
  curFrame: string | null = null;
  dynRecoil = NaN;
  dynRecoilMod = NaN;
  primary: Stats_Guns = null as any;
  private secondary: Stats_Guns = null as any;
  curGun: Stats_Guns = null as any;
  private primaryAmmo: any = null;
  private secondaryAmmo: any = null;
  curAmmo: any = null;
  private hud: Hud | null = null;
  private soundFrames = 0; // uint
  private shotTimer = 0; // uint (unused in the original)

  constructor(param1: Unit) {
    this.unit = param1;
    if (this.unit.human) {
      this.hud = this.unit.game.hud;
    }
  }

  setGuns(param1: string, param2: string): void {
    trace('setGUN', param1, param2);
    this.primary = Stats_Guns.gunOb[param1];
    this.secondary = Stats_Guns.gunOb[param2];
    if (!(this.unit.unitInfo.skill.id == 'clip' && this.primary.typeName == 'Machine Gun')) {
      this.primaryAmmo = {};
      this.primaryAmmo.total = Math.ceil(this.primary.clipSize * (this.primary.clipSpare + 1) * this.unit.unitInfo.amm);
      if (!this.primary.clipSize) {
        this.primaryAmmo.clipCur = this.primaryAmmo.clipMax = 1;
      } else {
        this.primaryAmmo.clipCur = this.primaryAmmo.clipMax = this.primary.clipSize;
      }
      this.primaryAmmo.spareCur = this.primaryAmmo.spareMax = this.primaryAmmo.total - this.primary.clipSize;
    } else {
      this.primaryAmmo = {};
      this.primaryAmmo.total = Math.ceil(this.primary.clipSize * (this.primary.clipSpare + 1) * this.unit.unitInfo.amm);
      this.primaryAmmo.clipCur = this.primaryAmmo.clipMax = 2;
      this.primaryAmmo.spareCur = this.primaryAmmo.spareMax = this.primaryAmmo.total;
    }
    this.secondaryAmmo = {};
    this.secondaryAmmo.total = Math.ceil(this.secondary.clipSize * (this.secondary.clipSpare + 1) * this.unit.unitInfo.amm);
    if (!this.secondary.clipSize) {
      this.secondaryAmmo.clipCur = this.secondaryAmmo.clipMax = 1;
    } else {
      this.secondaryAmmo.clipCur = this.secondaryAmmo.clipMax = this.secondary.clipSize;
    }
    this.secondaryAmmo.spareCur = this.secondaryAmmo.spareMax = this.secondaryAmmo.total - this.secondary.clipSize;
    if (!this.unit.human && this.primary.typeName == 'Shield') {
      this.secondaryAmmo.spareCur = this.secondaryAmmo.spareMax = 999999;
    }
    if (!this.unit.human && this.secondary.type == 0) {
      this.secondaryAmmo.spareCur = this.secondaryAmmo.spareMax = 999999;
    }
    this.unit.MC.gun.gotoAndStop(this.primary.sprite);
    this.unit.MC.legup1.child<SwfClip>('gun').gotoAndStop(this.secondary.sprite);
    this.reset();
  }

  setShield(param1: SwfClip): void {
    if (this.primary.typeName == 'Shield') {
      param1.gotoAndStop(this.primary.sprite + (!this.reflecting ? '' : 'b'));
    }
    if (this.unit.hasFlag) {
      param1.gotoAndStop('flag' + this.unit.hasFlag.team);
    }
  }

  setShieldPos(): void {
    if (this.primary.typeName != 'Shield' || this.reloading || Boolean(this.shootDelay)) {
      return;
    }
    this.setFrame('idle');
  }

  reset(): void {
    this.reflecting = 0;
    this.shootDelay = 0;
    this.curGun = null as any;
    this.swapGuns();
    if (this.unit.unitInfo.extra.forcePistol) {
      this.swapGuns();
    }
  }

  swapGuns(): void {
    if (this.primary.typeName == 'Shield' || Boolean(this.unit.hasFlag)) {
      this.curGun = this.primary;
    }
    if (this.curGun == this.primary) {
      this.curGun = this.secondary;
      this.curAmmo = this.secondaryAmmo;
      this.unit.MC.gun.visible = Boolean(this.unit.hasFlag) || this.primary.typeName != 'Shield';
      this.unit.MC.legup1.child<SwfClip>('gun').visible = false;
      if (this.hud) {
        this.hud.setGuns(this.secondary, this.primary);
      }
    } else {
      this.curGun = this.primary;
      this.curAmmo = this.primaryAmmo;
      this.unit.MC.gun.visible = false;
      this.unit.MC.legup1.child<SwfClip>('gun').visible = true;
      if (this.hud) {
        this.hud.setGuns(this.primary, this.secondary);
      }
    }
    this.dynRecoil = this.curGun.recoil;
    this.unit.MC.arm1.child<SwfClip>('gun').gotoAndStop(this.curGun.sprite);
    this.setFrame('idle');
    if (this.unit.mDown) {
      this.shotPressed = true;
    }
    if (this.hud) {
      trace('GUN', this.curGun.extra.vision);
      if (!this.curGun.extra.vision) {
        this.unit.game.arena.setFocus(this.unit, true);
      } else {
        this.unit.game.arena.setFocus(this.unit, true, this.curGun.extra.vision);
      }
      this.hud.setAmmoImage(this.curAmmo.clipCur, this.curAmmo.clipMax, this.curGun.effHudBullet, this.curAmmo.spareCur);
    }
    this.reloading = false;
    this.checkReload();
  }

  addAmmo(param1: number, param2 = true): void {
    this.primaryAmmo.spareCur += int(this.primaryAmmo.spareMax * param1);
    if (this.primaryAmmo.spareCur > this.primaryAmmo.spareMax) {
      this.primaryAmmo.spareCur = this.primaryAmmo.spareMax;
    }
    this.secondaryAmmo.spareCur += int(this.secondaryAmmo.spareMax * param1);
    if (this.secondaryAmmo.spareCur > this.secondaryAmmo.spareMax) {
      this.secondaryAmmo.spareCur = this.secondaryAmmo.spareMax;
    }
    if (this.hud) {
      this.hud.setAmmoImage(this.curAmmo.clipCur, this.curAmmo.clipMax, this.curGun.effHudBullet, this.curAmmo.spareCur);
    }
    if (param2) {
      this.unit.game.createEffect(this.unit.x, this.unit.y - 40, 'ammoPickup');
    }
    this.checkReload();
  }

  EnterFrame(): void {
    if (this.shootDelay) {
      --this.shootDelay;
    }
    if (this.dynRecoil > this.curGun.recoil) {
      this.dynRecoil -= 0.05;
    }
    if (!this.reflecting) {
      if (!this.unit.mov.crouching) {
        if (!this.unit.mov.jumping) {
          if (!this.unit.mov.xVel) {
            this.dynRecoilMod = this.dynRecoil;
          } else {
            this.dynRecoilMod = this.dynRecoil * 1.1;
          }
        } else {
          this.dynRecoilMod = this.dynRecoil * 1.2;
        }
      } else {
        this.dynRecoilMod = this.dynRecoil * 0.6;
      }
    } else {
      this.dynRecoilMod = this.dynRecoil * 2;
    }
    if (!this.reflecting) {
      this.dynRecoilMod *= 2 - this.unit.unitInfo.aim;
    } else {
      this.dynRecoilMod *= 2 - this.unit.unitInfo.aim * 0.5;
    }
    if (this.soundFrames) {
      --this.soundFrames;
    }
  }

  resetFrame(): void {
    this.unit.MC.arm1.gotoAndStop(this.curGun.frameIdle);
    this.unit.MC.arm2.gotoAndStop(this.curGun.frameIdle);
  }

  setFrame(param1: string): void {
    this.curFrame = param1;
    let _loc2_ = '';
    switch (param1) {
      case 'idle':
        _loc2_ = this.curGun.frameIdle;
        break;
      case 'fire':
        _loc2_ = this.curGun.frameFire;
        break;
      case 'reload':
        _loc2_ = this.curGun.frameReload;
    }
    if (!this.unit.hasFlag) {
      if (this.primary.typeName == 'Shield') {
        if (!this.unit.mov.crouching) {
          _loc2_ = 'shield';
          this.reflecting = 0;
        } else {
          _loc2_ = 'shieldCrouch';
          this.reflecting = this.primary.extra.reflect;
        }
      }
    } else {
      _loc2_ = 'shield';
      this.reflecting = 0;
    }
    switch (param1) {
      case 'idle':
        this.unit.MC.arm1.gotoAndStop(_loc2_);
        this.unit.MC.arm2.gotoAndStop(_loc2_);
        break;
      case 'fire':
      case 'reload':
        _loc2_ += '_' + param1;
        this.unit.MC.arm1.gotoAndPlay(_loc2_);
        this.unit.MC.arm2.gotoAndPlay(_loc2_);
    }
  }

  changeGun(param1: string): void {
    this.curGun = Stats_Guns.gunOb[param1];
    this.unit.MC.arm1.gotoAndStop(this.curGun.frameIdle);
    this.unit.MC.arm2.gotoAndStop(this.curGun.frameIdle);
    this.unit.MC.arm1.child<SwfClip>('gun').gotoAndStop(this.curGun.id);
    if (this.unit.mDown) {
      this.shotPressed = true;
    }
    this.dynRecoil = this.curGun.recoil;
  }

  releaseMouse(): void {
    this.shotPressed = false;
  }

  shoot(): void {
    let _loc1_ = 0;
    if (!(Boolean(this.shootDelay) || Boolean(this.shotPressed) || this.reloading)) {
      if (
        !(
          !this.curAmmo.clipCur ||
          (this.unit.unitInfo.skill.id == 'clip' && this.curGun.typeName == 'Machine Gun' && !this.curAmmo.spareCur)
        )
      ) {
        if (!this.curGun.extra.noShoot) {
          this.unit.status.setStealthDelay();
          if (!this.curGun.autoFire && this.unit.human) {
            this.shotPressed = true;
          }
          this.setFrame('fire');
          this.makeBullet(this.curGun);
          if (this.curGun.extra.extraShots) {
            _loc1_ = 0;
            while (_loc1_ < this.curGun.extra.extraShots) {
              this.makeBullet(this.curGun);
              _loc1_++;
            }
          }
          if (this.curGun.shotSound) {
            if (!this.curGun.extra.soundFrames) {
              this.unit.game.playScreenSound(this.curGun.shotSound, this.unit.x, this.unit.y);
            } else if (!this.soundFrames) {
              this.unit.game.playScreenSound(this.curGun.shotSound, this.unit.x, this.unit.y);
              this.soundFrames = uint(this.curGun.extra.soundFrames);
            }
          }
          if (Boolean(this.curGun.effShell) && Boolean(SD.graphPart)) {
            this.unit.game.createParticle(
              this.unit.x + UT.xMoveToRot(this.unit.aimRoation, 28),
              this.unit.y + this.unit.MC.arm1.y + UT.yMoveToRot(this.unit.aimRoation, 28),
              'shell',
              0,
              {
                rot: this.unit.aimRoation,
                flip: this.unit.MC.scale.x,
              },
              'shell',
              this.curGun.effShell,
            );
          }
          if (SD.graphPart == 2 || (SD.graphPart == 1 && this.unit.human)) {
            // Flash: new BevelFilter(7, aim+90, 0xFFFF99|0xFFFFCC, 1, 0x000000, 0.5, 10, 10, 1, 1)
            this.unit.MCfilters.push(
              new BevelFilter({
                rotation: this.unit.aimRoation + 90,
                thickness: 7,
                lightColor: Math.random() >= 0.5 ? 16777113 : 16777164,
                lightAlpha: 1,
                shadowColor: 0,
                shadowAlpha: 0.5,
              }),
            );
          }
          this.shootDelay = uint(this.curGun.shootDelay * 30);
          if (!this.curGun.extra.noAmmo && MatchSettings.useMod != 'ammo') {
            if (!(this.unit.unitInfo.skill.id == 'clip' && this.curGun.typeName == 'Machine Gun')) {
              --this.curAmmo.clipCur;
            } else {
              --this.curAmmo.spareCur;
            }
          }
          if (this.hud) {
            this.hud.setAmmoImage(this.curAmmo.clipCur, this.curAmmo.clipMax, this.curGun.effHudBullet, this.curAmmo.spareCur);
            this.unit.game.arena.setShake(2, 2);
            if (this.dynRecoil < this.curGun.recoil * 1.7) {
              this.dynRecoil += 0.3;
            }
          }
          this.checkReload();
          return;
        }
        return;
      }
      this.unit.game.playScreenSound('S_GunClick', this.unit.x, this.unit.y);
      return;
    }
  }

  makeBullet(param1: Stats_Guns): void {
    this.unit.game.bullets.push(
      new (param1.cls as BulletClass)(
        this.unit.game,
        this.unit,
        this.unit.aimRoation + UT.rand(-this.dynRecoil, this.dynRecoilMod),
        // Flash DisplayObject.rotation reads back normalised to [-180, 180]
        this.unit.x + UT.fixRotation(this.unit.MC.angle) * 1.2,
        this.unit.y + this.unit.MC.arm1.y,
        param1.xOff,
        param1.id,
      ),
    );
  }

  reloaded(): void {
    this.reloading = false;
    this.setFrame('idle');
    const _loc1_ = uint(this.curAmmo.clipMax - this.curAmmo.clipCur);
    if (this.curAmmo.spareCur >= _loc1_) {
      this.curAmmo.clipCur = this.curAmmo.clipMax;
      if (MatchSettings.useMod != 'clips') {
        this.curAmmo.spareCur -= _loc1_;
      }
    } else {
      this.curAmmo.clipCur += this.curAmmo.spareCur;
      if (MatchSettings.useMod != 'clips') {
        this.curAmmo.spareCur = 0;
      }
    }
    if (this.hud) {
      this.hud.setAmmoImage(this.curAmmo.clipCur, this.curAmmo.clipMax, this.curGun.effHudBullet, this.curAmmo.spareCur);
    }
  }

  manualReload(): void {
    if (!(this.curAmmo.clipCur == this.curAmmo.clipMax || !this.curAmmo.spareCur)) {
      if (!(this.reloading || Boolean(this.shootDelay))) {
        if (this.curGun.extra.noShoot) {
          return;
        }
        this.checkReload(true);
        return;
      }
      return;
    }
  }

  checkReload(param1 = false): void {
    if (!this.curGun.extra.noShoot) {
      if (!this.unit.human && !this.curAmmo.clipCur && !this.curAmmo.spareCur) {
        this.swapGuns();
      }
      if (!(!param1 && (Boolean(this.curAmmo.clipCur) || Boolean(!this.curAmmo.spareCur)))) {
        this.setFrame('reload');
        this.reloading = true;
        return;
      }
      return;
    }
  }
}
