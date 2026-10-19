// Timeline-instantiated symbols owned by the "ui" group. Wire `registerUi()` into registry.ts.
import { registerSymbol } from '../flash/runtime';
import { ScrollBar } from './ScrollBar';
import { Debug } from './Debug';
import { CheckBox, RadioButton } from './FlControls';

export function registerUi(): void {
  // Menu (MBFZ_fla.Timeline_275) primary/secondary/skill/killstreak frames: `scrollbar`
  registerSymbol('ScrollBar', () => new ScrollBar());
  // Hud frame 1: `debug`
  registerSymbol('Debug', () => new Debug());
  // fl.controls components on the Menu "options" frame and the Hud "pause" frame
  registerSymbol('fl.controls.CheckBox', () => new CheckBox());
  registerSymbol('fl.controls.RadioButton', () => new RadioButton());
}
