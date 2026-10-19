// Port of NodePhysBox.as — invisible static Box2D box for ragdolls (read by PhysWorld.generateWorld).
import { Symbol } from '../flash/runtime';

export class NodePhysBox extends Symbol {
  constructor() {
    super('NodePhysBox');
    this.visible = false;
  }
}
