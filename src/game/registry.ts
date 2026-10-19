// Registers TS classes for library symbols that timelines instantiate by themselves
// (Node* markers on Arena frames, holders inside UnitMC, menu widgets, ...).
import { registerCombat } from './reg_combat';
import { registerHud } from './reg_hud';
import { registerUi } from './reg_ui';
import { registerUnits } from './reg_units';
import { registerWorld } from './reg_world';

export function registerAll(): void {
  registerHud();
  registerUi();
  registerUnits();
  registerCombat();
  registerWorld();
}
