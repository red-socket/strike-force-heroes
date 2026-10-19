// Port of Player.as — the human-controlled Unit (keyboard + mouse). Always units[0].
import type { FlashKeyboardEvent } from '../flash/as3';
import { uint } from '../flash/as3';
import { mouseX, mouseY } from '../flash/runtime';
import { Unit } from './Unit';
import { UT } from './UT';
import { SD } from './SD';
import { Main } from './Main';
import { Stats_Guns } from './Stats_Guns';
import { Stats_Classes } from './Stats_Classes';
import { Stats_Campaign } from './Stats_Campaign';
import type { Game } from './Game';

export class Player extends Unit {
  // NOTE: no field initialisers that Unit's constructor (which calls spawn()) depends on: TS class
  // fields of a subclass are (re)defined only after super() returns.
  private pressedUp = false;
  private sniperMode = false;

  constructor(param1: Game, param2: any) {
    super(param1, true, param2);
    this.MC.gotoAnim('idle');
    this.game.aimer.gotoAndStop(!this.sniperMode ? 1 : 2);
  }

  override spawn(param1 = 0, param2 = 0, param3 = ''): void {
    this.game.hud.reset();
    this.unitSpawn(param1, param2, param3);
    this.aimX = this.x + 200;
    this.aimY = this.y - 50;
    this.game.aimer.x = mouseX(this.game);
    this.game.aimer.y = mouseY(this.game);
    this.game.hud.setClassChange(false);
    this.status.sSpawn = 2.5 * 30;
  }

  override EnterFrame(): void {
    if (!this.dead) {
      this.MCfilters = [];
      if (!this.unitInfo.extra.noAim) {
        this.aimX += (mouseX(this.game.arena) - this.aimX) * 0.5;
        this.aimY += (mouseY(this.game.arena) - this.aimY) * 0.5;
      }
      if (this.mDown) {
        this.gun.shoot();
      }
      let _loc1_ = UT.getDist(this.x + this.MC.arm1.x, this.y + this.MC.arm1.y, mouseX(this.game.arena), mouseY(this.game.arena));
      _loc1_ *= _loc1_;
      _loc1_ *= 2;
      const _loc2_ = Math.sqrt(_loc1_ - _loc1_ * Math.cos((this.gun.dynRecoilMod * Math.PI) / 180));
      if (!this.sniperMode) {
        this.game.aimer.line1.y = -_loc2_;
        this.game.aimer.line2.x = _loc2_;
        this.game.aimer.line3.y = _loc2_;
        this.game.aimer.line4.x = -_loc2_;
        this.game.aimer.circle.width = this.game.aimer.circle.height = _loc2_ * 2;
      }
      if (!this.unitInfo.extra.noAim) {
        this.game.aimer.x = mouseX(this.game);
        this.game.aimer.y = mouseY(this.game);
      } else {
        this.game.aimer.x = -1000;
        this.game.aimer.y = -1000;
      }
      this.UnitEnterFrame();
      return;
    }
    if (this.respawnTimer) {
      if (this.respawnTimer < 3 * 30) {
        this.game.hud.setRespawnText('Respawn in ' + Math.ceil(this.respawnTimer / 30));
      }
      this.respawnTimer = uint(this.respawnTimer - 1);
    } else {
      this.spawn();
    }
  }

  MouseDown(): void {
    if (!(!this.game.gameStarted || Boolean(this.unitInfo.extra.noShoot))) {
      this.mDown = true;
      return;
    }
  }

  MouseUp(): void {
    this.mDown = false;
    this.gun.releaseMouse();
  }

  KeyDown(param1: FlashKeyboardEvent): void {
    let _loc2_ = false;
    let _loc3_ = 0; // uint
    switch (param1.keyCode) {
      case 27:
      case 80:
        this.game.togglePause();
        break;
      case 69:
      case 17:
        if (!this.game.paused) {
          this.useKillstreak();
        }
        break;
      case 67:
        if (Main.DEBUGMODE) {
          // System.setClipboard
          void navigator.clipboard?.writeText(mouseX(this.game.arena) + ', ' + mouseY(this.game.arena)).catch(() => {});
        }
        break;
      case 79:
        if (Main.DEBUGMODE) {
          _loc2_ = !this.game.arena.wallMC.visible;
          this.game.arena.wallMC.visible = _loc2_;
          _loc3_ = 0;
          while (_loc3_ < this.game.arena.spawns.length) {
            this.game.arena.spawns[_loc3_].visible = _loc2_;
            _loc3_++;
          }
          _loc3_ = 0;
          while (_loc3_ < this.game.arena.spawnsT1.length) {
            this.game.arena.spawnsT1[_loc3_].visible = _loc2_;
            _loc3_++;
          }
          _loc3_ = 0;
          while (_loc3_ < this.game.arena.spawnsT2.length) {
            this.game.arena.spawnsT2[_loc3_].visible = _loc2_;
            _loc3_++;
          }
          _loc3_ = 0;
          while (_loc3_ < this.game.arena.waypoints.length) {
            this.game.arena.waypoints[_loc3_].visible = _loc2_;
            _loc3_++;
          }
          _loc3_ = 0;
          while (_loc3_ < this.game.arena.waypoints.length) {
            this.game.arena.waypoints[_loc3_].showConnectors(_loc2_);
            _loc3_++;
          }
          _loc3_ = 0;
          while (_loc3_ < this.game.arena.aiactions.length) {
            this.game.arena.aiactions[_loc3_].visible = _loc2_;
            _loc3_++;
          }
          _loc3_ = 0;
          while (_loc3_ < this.game.arena.physboxes.length) {
            this.game.arena.physboxes[_loc3_].visible = _loc2_;
            _loc3_++;
          }
        }
        break;
      case 76:
        if (!Main.DEBUGMODE) {
          break;
        }
        SD.graphLights = !SD.graphLights;
        this.game.arena.toggleLights();
        break;
      case 82:
        if (!this.game.paused) {
          this.gun.manualReload();
        }
        break;
      case 16:
      case 81:
        if (!this.dead) {
          if (this.game.paused) {
            break;
          }
          this.gun.swapGuns();
          if (Stats_Campaign.sn != 12) {
            break;
          }
          this.game.hud.gotoAndStop('idle');
          _loc3_ = 0;
          while (_loc3_ < this.game.arena.downarrows.length) {
            if (Number(this.game.arena.downarrows[_loc3_].label.substring(9)) != Stats_Campaign.sn) {
              this.game.arena.downarrows[_loc3_].visible = false;
            } else {
              this.game.arena.downarrows[_loc3_].visible = true;
            }
            _loc3_++;
          }
          ++Stats_Campaign.sn;
          this.game.arena.changeWallFrame(Stats_Campaign.sn);
          this.game.arena.door.gotoAndPlay('open');
        }
        break;
      case 40:
      case 83:
        this.keys |= this.DOWN;
        break;
      case 37:
      case 65:
        this.keys |= this.LEFT;
        break;
      case 39:
      case 68:
        this.keys |= this.RIGHT;
        break;
      case 38:
      case 87:
      case 32:
        if (!this.pressedUp) {
          if (!this.game.paused) {
            this.keys |= this.UP;
            this.mov.doJump();
            this.pressedUp = true;
          }
        }
        break;
      case 48:
        if (Main.DEBUGMODE) {
          this.game.createEffect(this.x, this.y - 50, 'bloodmist');
          this.game.createEffect(this.x, this.y - 50, 'bloodmist');
          this.status.damage(50, this, Stats_Guns.gunOb['env'], {});
        }
        break;
      case 49:
        if (Main.DEBUGMODE) {
          this.game.hud.addExp(Stats_Classes.getNextExp((SD.classSaves[SD.selClass] as any).level));
        }
        break;
      case 50:
        if (Main.DEBUGMODE) {
          this.game.hud.addExp(5);
        }
        break;
      case 51:
        if (Main.DEBUGMODE) {
          this.game.hud.addExp(9);
        }
        break;
      case 52:
        if (Main.DEBUGMODE) {
          this.canUseStreak = true;
          this.useKillstreak();
        }
        break;
      case 53:
        if (Main.DEBUGMODE) {
          this.game.hud.debug.y = 0;
        }
        break;
      case 187:
        if (Main.DEBUGMODE) {
          this.game.endGame(true);
        }
    }
  }

  KeyUp(param1: FlashKeyboardEvent): void {
    switch (param1.keyCode) {
      case 38:
      case 87:
      case 32:
        if (!(this.keys & this.UP)) {
          break;
        }
        this.keys ^= this.UP;
        this.pressedUp = false;
        break;
      case 40:
      case 83:
        if (!(this.keys & this.DOWN)) {
          break;
        }
        this.keys ^= this.DOWN;
        break;
      case 37:
      case 65:
        if (!(this.keys & this.LEFT)) {
          break;
        }
        this.keys ^= this.LEFT;
        break;
      case 39:
      case 68:
        if (!(this.keys & this.RIGHT)) {
          break;
        }
        this.keys ^= this.RIGHT;
    }
  }

  releaseKeys(): void {
    if (this.keys & this.DOWN) {
      this.keys ^= this.DOWN;
    }
    if (this.keys & this.LEFT) {
      this.keys ^= this.LEFT;
    }
    if (this.keys & this.RIGHT) {
      this.keys ^= this.RIGHT;
    }
  }
}
