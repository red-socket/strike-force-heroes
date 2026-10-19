// Timeline-instantiation registrations for the world group: classes linked to library symbols that
// the SWF timelines place by themselves (Node* markers on Arena map frames, DownArrow on the tut frame
// and in Hud/Cutscene). Code-constructed symbols (Arena, Bg, BgSky, Radar, ScoreBar) need no factory,
// but registering them is harmless and keeps `instanceof` working if a timeline ever places one.
import { registerSymbol } from '../flash/runtime';
import { Bg } from './Bg';
import { BgSky } from './BgSky';
import { DownArrow } from './DownArrow';
import { NodeAiAction } from './NodeAiAction';
import { NodeCtfFlag } from './NodeCtfFlag';
import { NodeHoldpoint } from './NodeHoldpoint';
import { NodePhysBox } from './NodePhysBox';
import { NodePickup } from './NodePickup';
import { NodeSpawn } from './NodeSpawn';
import { NodeWaypoint } from './NodeWaypoint';

export function registerWorld(): void {
  registerSymbol('NodeWaypoint', () => new NodeWaypoint());
  registerSymbol('NodeSpawn', () => new NodeSpawn());
  registerSymbol('NodeAiAction', () => new NodeAiAction());
  registerSymbol('NodePhysBox', () => new NodePhysBox());
  registerSymbol('NodePickup', () => new NodePickup());
  registerSymbol('NodeHoldpoint', () => new NodeHoldpoint());
  registerSymbol('NodeCtfFlag', () => new NodeCtfFlag());
  registerSymbol('DownArrow', () => new DownArrow());
  registerSymbol('Bg', () => new Bg());
  registerSymbol('BgSky', () => new BgSky());
}
