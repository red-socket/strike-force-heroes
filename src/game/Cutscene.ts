// Port of Cutscene.as — story panels (symbol 1891, 46 frames, one panel per frame).
// new Cutscene(main, {type:"pre"|"post"}) shows MatchSettings[type+"CutFrames"] in order.
import type { FlashKeyboardEvent } from '../flash/as3';
import { hitTestPoint, lib, mouseX, mouseY, Symbol } from '../flash/runtime';
import type { SwfClip, SwfTextField } from '../swf/display';
import { SH } from './SH';
import { MatchSettings } from './MatchSettings';
import { Game } from './Game';
import { Menu } from './Menu';
import type { Main, Screen } from './Main';

export class Cutscene extends Symbol implements Screen {
  get but_next() { return this.child<SwfTextField>('but_next'); }
  get txt_title() { return this.child<SwfTextField>('txt_title'); }
  /** DownArrow instance (only on frame 35). */
  get downarrow10() { return this.maybeChild<SwfClip>('downarrow10'); }
  get but_prev() { return this.child<SwfTextField>('but_prev'); }

  private main: Main;
  private type: string = null!;
  private song: any;
  private frames: any[] = null!;
  private curFrame = 0; // uint

  /** Make sure every panel's art is loaded before the screen is shown. */
  static async preload(_params: Record<string, any>): Promise<void> {
    await lib.preloadClasses(['Cutscene']);
  }

  constructor(param1: Main, param2: Record<string, any>) {
    super('Cutscene');
    this.addFrameScript(
      2, () => this.frame3(),
      8, () => this.frame9(),
      10, () => this.frame11(),
      19, () => this.frame20(),
      22, () => this.frame23(),
      24, () => this.frame25(),
      26, () => this.frame27(),
      30, () => this.frame31(),
      31, () => this.frame32(),
      43, () => this.frame44(),
      44, () => this.frame45(),
      45, () => this.frame46(),
    );
    this.main = param1;
    this.txt_title.text = MatchSettings.caName;
    this.type = param2.type;
    this.song = (MatchSettings as any)[this.type + 'CutSong'];
    this.frames = (MatchSettings as any)[this.type + 'CutFrames'];
    if (this.song) {
      SH.playMusic(this.song);
    }
    this.gotoAndStop(this.frames[this.curFrame]);
    this.setButs();
  }

  EnterFrame(): void {
    this.but_prev.alpha = !this.ht(this.but_prev) ? 0.5 : 1;
    this.but_next.alpha = !this.ht(this.but_next) ? 0.5 : 1;
  }

  MouseDown(): void {
    if (!(this.ht(this.but_prev) && this.but_prev.text == 'Previous')) {
      if (!(this.ht(this.but_next) && this.but_next.text == 'Next')) {
        if (this.ht(this.but_next) && this.but_next.text == 'Start Game') {
          this.main.startClass(Game);
        } else if (this.ht(this.but_next) && this.but_next.text == 'Back to Menu') {
          this.main.startClass(Menu);
        }
      } else {
        ++this.curFrame;
        this.setButs();
        this.gotoAndStop(this.frames[this.curFrame]);
      }
    } else {
      --this.curFrame;
      this.setButs();
      this.gotoAndStop(this.frames[this.curFrame]);
    }
  }

  setButs(): void {
    if (!(this.curFrame == this.frames.length - 1 && this.type == 'pre')) {
      if (!(this.curFrame == this.frames.length - 1 && this.type == 'post')) {
        if (this.curFrame != 0) {
          this.but_prev.visible = true;
          this.but_next.visible = true;
          this.but_prev.text = 'Previous';
          this.but_next.text = 'Next';
        } else {
          this.but_prev.visible = false;
          this.but_next.visible = true;
          this.but_prev.text = '';
          this.but_next.text = 'Next';
        }
      } else {
        if (this.frames.length > 1) {
          this.but_prev.visible = true;
          this.but_prev.text = 'Previous';
        } else {
          this.but_prev.visible = false;
          this.but_prev.text = '';
        }
        this.but_next.visible = true;
        this.but_next.text = 'Back to Menu';
      }
    } else {
      if (this.frames.length > 1) {
        this.but_prev.visible = true;
        this.but_prev.text = 'Previous';
      } else {
        this.but_prev.visible = false;
        this.but_prev.text = '';
      }
      this.but_next.visible = true;
      this.but_next.text = 'Start Game';
    }
  }

  MouseUp(): void {}

  KeyDown(_param1: FlashKeyboardEvent): void {}

  KeyUp(_param1: FlashKeyboardEvent): void {}

  MouseWheel(_param1: number): void {}

  flashActivate(): void {}

  flashDeactivate(): void {}

  private ht(param1: any): boolean {
    if (!param1 || !param1.visible) {
      return false;
    }
    return hitTestPoint(param1, mouseX(this), mouseY(this));
  }

  frame3(): void {
    SH.playMusic('M_Train');
    SH.playSound('S_rocketExplode');
  }

  frame9(): void {
    SH.playSound('S_Jet');
  }

  frame11(): void {
    SH.playSound('S_rocketExplode');
  }

  frame20(): void {
    SH.playSound('S_rocketExplode');
  }

  frame23(): void {
    SH.playSound('S_Missile');
  }

  frame25(): void {
    SH.playSound('S_Jet');
  }

  frame27(): void {
    SH.playSound('S_Jet');
  }

  frame31(): void {
    SH.playSound('S_Missile');
  }

  frame32(): void {
    SH.playMusic('M_Slow');
    SH.playSound('S_rocketExplode');
  }

  frame44(): void {
    this.but_next.visible = false;
    this.but_prev.visible = false;
  }

  frame45(): void {
    SH.playMusic('M_Silence');
  }

  frame46(): void {
    SH.playMusic('M_Theme', true);
  }
}
