// Port of Logo_NoPlay.as — site-lock "no play" screen (symbol 59). Never started by code in the
// original (Main.NOPLAY is never read); only an inert instance sat on the main timeline's frame 1.
import type { FlashKeyboardEvent } from '../flash/as3';
import { Symbol } from '../flash/runtime';
import type { Main, Screen } from './Main';

export class Logo_NoPlay extends Symbol implements Screen {
  private main: Main | null;

  constructor(param1: Main | null = null, _param2: object | null = null) {
    super('Logo_NoPlay');
    this.main = param1;
  }

  logoDone(): void {}

  MouseDown(): void {}

  MouseUp(): void {}

  KeyDown(_param1: FlashKeyboardEvent): void {}

  KeyUp(_param1: FlashKeyboardEvent): void {}

  flashActivate(): void {}

  flashDeactivate(): void {}

  EnterFrame(): void {}
}
