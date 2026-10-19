// hud-data group registrations.
//  - fl.controls RadioButton/CheckBox placed on the Hud "pause" frame (FlControls.ts is shared with
//    the Menu options frame; registering the same factory twice is harmless).
//  - Stats_Guns bullet classes: the AS3 weapon table stores bullet classes as values. Stats_Guns keeps
//    their names and resolves them through this map, so it does not import Bullet_* itself (that would
//    form a module cycle Bullet -> Stats_Guns -> Bullet_* -> Bullet and break `extends Bullet`).
//    Must run before the first `gun.cls` access (registerAll() runs before `new Main()`).
import { registerSymbol } from '../flash/runtime';
import { CheckBox, RadioButton } from './FlControls';
import { Stats_Guns } from './Stats_Guns';
import { Bullet_Line_Basic } from './Bullet_Line_Basic';
import { Bullet_Line_Sniper } from './Bullet_Line_Sniper';
import { Bullet_Melee_Basic } from './Bullet_Melee_Basic';
import { Bullet_Proj_Basic } from './Bullet_Proj_Basic';
import { Bullet_Proj_Bounce } from './Bullet_Proj_Bounce';
import { Bullet_Proj_Follow } from './Bullet_Proj_Follow';
import { Bullet_Proj_Mine } from './Bullet_Proj_Mine';
import { Bullet_Splash } from './Bullet_Splash';

export function registerHud(): void {
  registerSymbol('fl.controls.RadioButton', () => new RadioButton());
  registerSymbol('fl.controls.CheckBox', () => new CheckBox());
  Object.assign(Stats_Guns.bulletClasses, {
    Bullet_Line_Basic,
    Bullet_Line_Sniper,
    Bullet_Melee_Basic,
    Bullet_Proj_Basic,
    Bullet_Proj_Bounce,
    Bullet_Proj_Follow,
    Bullet_Proj_Mine,
    Bullet_Splash,
  });
}
