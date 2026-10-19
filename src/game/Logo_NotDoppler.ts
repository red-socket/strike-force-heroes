// Port of Logo_NotDoppler.as — sponsor intro; frame 189 ends it. Skip button shown (Main.SPONSORSITE).
import type { FlashKeyboardEvent } from '../flash/as3';
import { hitTestPoint, mouse, Symbol } from '../flash/runtime';
import type { SwfButton } from '../swf/display';
import { SD } from './SD';
import { Main, type Screen } from './Main';

export class Logo_NotDoppler extends Symbol implements Screen {
  private main: Main;

  get skip() { return this.child<SwfButton>('skip'); }

  constructor(main: Main, _params?: object) {
    super('Logo_NotDoppler');
    this.addFrameScript(188, () => (this.stop(), this.logoDone()));
    this.main = main;
    this.skip.visible = Main.SPONSORSITE;
    this.cursor = this.clickable() ? 'pointer' : 'default';
    this.child('introbutton').visible = this.clickable();
  }

  logoDone(): void {
    this.main.logoDopplerDone();
    this.stop();
  }

  MouseDown(): void {
    if (!(this.skip.visible && hitTestPoint(this.skip, mouse.x, mouse.y))) {
      if (this.clickable()) SD.urlNotDoppler(true);
    } else this.logoDone();
  }

  clickable(): boolean {
    return !Main.ARMORFIRST || !Main.SPONSORSITE;
  }

  MouseUp(): void {}
  KeyDown(_e: FlashKeyboardEvent): void {}
  KeyUp(_e: FlashKeyboardEvent): void {}
  flashActivate(): void {}
  flashDeactivate(): void {}
  EnterFrame(): void {}
}
