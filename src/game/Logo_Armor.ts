// Port of Logo_Armor.as — sponsor intro; frame 207 ends it. Skip button shown (Main.SPONSORSITE).
import type { FlashKeyboardEvent } from '../flash/as3';
import { hitTestPoint, mouse, Symbol } from '../flash/runtime';
import type { SwfButton } from '../swf/display';
import { SD } from './SD';
import { Main, type Screen } from './Main';

export class Logo_Armor extends Symbol implements Screen {
  private main: Main;

  get skip() { return this.child<SwfButton>('skip'); }

  constructor(main: Main, _params?: object) {
    super('Logo_Armor');
    this.addFrameScript(206, () => (this.stop(), this.logoDone()));
    this.main = main;
    this.skip.visible = Main.SPONSORSITE;
    this.cursor = this.clickable() ? 'pointer' : 'default';
  }

  logoDone(): void {
    this.main.logoArmorDone();
    this.stop();
  }

  MouseDown(): void {
    if (!(this.skip.visible && hitTestPoint(this.skip, mouse.x, mouse.y))) {
      if (this.clickable()) SD.urlArmor(true);
    } else this.logoDone();
  }

  clickable(): boolean {
    return !Main.SPONSORSITE;
  }

  MouseUp(): void {}
  KeyDown(_e: FlashKeyboardEvent): void {}
  KeyUp(_e: FlashKeyboardEvent): void {}
  flashActivate(): void {}
  flashDeactivate(): void {}
  EnterFrame(): void {}
}
