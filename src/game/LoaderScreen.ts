// Port of LoaderScreen.as. Everything is already downloaded by the time it shows, so it goes
// straight to the "Play" prompt; the click doubles as the user gesture that unlocks Web Audio.
import type { FlashKeyboardEvent } from '../flash/as3';
import { hitTestPoint, mouse, Symbol } from '../flash/runtime';
import { resumeAudio } from '../flash/sound';
import { setFlashMask, type SwfClip, type SwfTextField } from '../swf/display';
import { SD } from './SD';
import type { Main, Screen } from './Main';

export class LoaderScreen extends Symbol implements Screen {
  private main: Main;
  private otxtHeight: number;

  get txt_size() { return this.child<SwfTextField>('txt_size'); }
  get logo1() { return this.child<SwfClip>('logo1'); }
  get logo2() { return this.child<SwfClip>('logo2'); }
  get smoke() { return this.child<SwfClip>('smoke'); }
  get txt_loading() { return this.child<SwfTextField>('txt_loading'); }
  get txt_play() { return this.child<SwfTextField>('txt_play'); }
  get pslight() { return this.child<SwfClip>('pslight'); }

  constructor(main: Main, _params?: object) {
    super('LoaderScreen');
    this.addFrameScript(0, () => setFlashMask(this.smoke, this.pslight));
    this.main = main;
    this.otxtHeight = this.txt_play.y;
    this.txt_play.y = 2000;
    SD.setLogos(this.logo1, this.logo2);
  }

  MouseDown(): void {
    if (hitTestPoint(this.txt_play, mouse.x, mouse.y)) {
      resumeAudio();
      this.main.loadDone();
      this.txt_play.y = 2000;
      this.txt_loading.text = 'Rendering\nPlease wait';
      this.txt_size.text = '';
    }
  }

  MouseUp(): void {}
  KeyDown(_e: FlashKeyboardEvent): void {}
  KeyUp(_e: FlashKeyboardEvent): void {}
  flashActivate(): void {}
  flashDeactivate(): void {}

  EnterFrame(): void {
    // bytesLoaded == bytesTotal: show the play prompt
    if (this.txt_loading.text !== 'Rendering\nPlease wait') {
      this.txt_play.y = this.otxtHeight;
      this.txt_loading.text = '';
      this.txt_size.text = '';
    }
    this.txt_play.textColor = !hitTestPoint(this.txt_play, mouse.x, mouse.y) ? 12303291 : 16777215;
  }
}
