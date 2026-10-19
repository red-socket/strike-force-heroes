// Timeline-instantiated symbols owned by the combat group.
import { registerSymbol } from '../flash/runtime';
import { Holder_Gun } from './Holder_Gun';
import { Holder_Skill } from './Holder_Skill';
import { Helicopter } from './Helicopter';

export function registerCombat(): void {
  registerSymbol('Holder_Gun', () => new Holder_Gun());
  registerSymbol('Holder_Skill', () => new Holder_Skill());
  registerSymbol('Helicopter', () => new Helicopter());
}
