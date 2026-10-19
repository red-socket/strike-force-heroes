// Port of Logo_Sky9Games.as — sponsor intro; frame 154 ends it. Skip button shown (Main.SPONSORSITE).
import type { FlashKeyboardEvent } from '../flash/as3';
import { hitTestPoint, mouse, Symbol } from '../flash/runtime';
import type { SwfButton } from '../swf/display';
import { SD } from './SD';
import { SH } from './SH';
import { Main, type Screen } from './Main';

export class Logo_Sky9Games extends Symbol implements Screen {
  private main: Main;

  get skip() { return this.child<SwfButton>('skip'); }

  constructor(main: Main, _params?: object) {
    super('Logo_Sky9Games');
    this.addFrameScript(153, () => (this.stop(), this.logoDone()));
    this.main = main;
    this.skip.visible = Main.SPONSORSITE;
    this.cursor = this.clickable() ? 'pointer' : 'default';
    SH.playMusic('M_Menu');
  }

  logoDone(): void {
    this.main.logoSky9Done();
    this.stop();
  }

  MouseDown(): void {
    if (!(this.skip.visible && hitTestPoint(this.skip, mouse.x, mouse.y))) {
      if (this.clickable()) SD.urlSky9Games(true);
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
