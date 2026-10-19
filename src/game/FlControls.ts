// Minimal stand-ins for the Flash CS component classes fl.controls.CheckBox / fl.controls.RadioButton
// (+ RadioButtonGroup), which the menu "options" frame and the Hud "pause" frame place on their timelines
// (rd_qual*, rd_part*, rd_blood*, cb_*). Only the parts the game touches are reproduced:
//   - `selected`, `enabled`, `groupName`, `label` (as `labelText`), `labelPlacement`, `value`
//   - icon skin per state (up/over/down/disabled, selected*), drawn from the library's
//     CheckBox_*Icon / RadioButton_*Icon symbols
//   - UIComponent size semantics (placement scale → width/height, scale reset to 1) and the
//     CheckBox/RadioButton "left" label layout with an empty label, so bounds (hitTestPoint) match Flash.
// The components never toggle themselves: in the original the game code drives them on MouseDown
// (checkboxes are disabled while pressed, so the component never receives its own CLICK).
// The `__setProp_*` component-inspector handlers of the MBFZ_fla timelines are not generated, so the
// group name is derived from the instance name (rd_qual* → qualGroup, rd_part* → partGroup,
// rd_blood* → partBlood) unless set explicitly; label is "" and labelPlacement "left" for every instance.
import { Graphics } from 'pixi.js';
import { hitTestPoint, lib, mouse } from '../flash/runtime';
import { SwfClip } from '../swf/display';

const TEXT_PADDING = 5;

abstract class LabelToggle extends SwfClip {
  /** fl.controls `label` (always "" here); renamed because Pixi's `label` is the AS3 instance `name`. */
  labelText = '';
  labelPlacement = 'left';
  protected _selected = false;
  private _enabled = true;
  private icon: SwfClip | null = null;
  private iconName = '';
  private background: Graphics;
  private compWidth = NaN;
  private compHeight = NaN;
  private readonly skin: string;

  constructor(className: string, skin: string) {
    super(lib, lib.idOf(className));
    this.skin = skin;
    this.stop();
    // UIComponent.configUI: removeChildAt(0) — drop the authoring avatar.
    for (const c of this.timelineChildren()) {
      c.visible = false;
      c.measurable = false;
    }
    this.background = new Graphics();
    this.addChild(this.background);
    this.onRender = () => this.draw();
  }

  get enabled(): boolean {
    return this._enabled;
  }
  set enabled(v: boolean) {
    this._enabled = v;
    this.draw();
  }

  get selected(): boolean {
    return this._selected;
  }
  set selected(v: boolean) {
    this._selected = v;
    this.draw();
  }

  /** UIComponent.configUI: width/height come from the placed (scaled) avatar, then scale resets to 1. */
  private ensureSize(): void {
    if (!Number.isNaN(this.compWidth)) return;
    // Avatar is 100x22 at scale 1 (symbol 989 = 80x22 shape at scaleX 1.25).
    this.compWidth = 100 * this.scale.x;
    this.compHeight = 22 * this.scale.y;
    this.scripted = true;
    this.scale.set(1, 1);
  }

  private mouseState(): string {
    if (!this.parent) return 'up';
    const over = hitTestPoint(this, mouse.x, mouse.y);
    return over ? (mouse.down ? 'down' : 'over') : 'up';
  }

  /** LabelButton.drawIcon + CheckBox/RadioButton.drawLayout (empty label). */
  draw(): void {
    if (this.destroyed || !this.parent) return;
    this.ensureSize();
    let state = !this._enabled ? 'disabled' : this.mouseState();
    if (this._selected) state = 'selected' + state.substr(0, 1).toUpperCase() + state.substr(1);
    const name = `${this.skin}_${state}Icon`;
    if (name !== this.iconName) {
      const old = this.icon;
      this.icon = new SwfClip(lib, lib.idOf(name));
      this.iconName = name;
      this.addChildAt(this.icon, Math.min(1, this.children.length));
      if (old) old.destroy({ children: true });
    }
    const icon = this.icon!;
    const b = icon.getLocalBounds();
    const iw = b.width;
    const ih = b.height;
    const w = this.compWidth;
    const h = this.compHeight;
    icon.y = Math.round((h - ih) / 2);
    let tfx = 0;
    const tfy = 0;
    if (this.labelPlacement === 'left') {
      icon.x = w - iw - TEXT_PADDING;
      tfx = w - iw - TEXT_PADDING * 2;
    } else {
      icon.x = TEXT_PADDING;
      tfx = icon.x + iw + TEXT_PADDING;
    }
    const bx = Math.min(icon.x - TEXT_PADDING, tfx - TEXT_PADDING);
    const by = Math.min(icon.y - TEXT_PADDING, tfy - TEXT_PADDING);
    const bw = iw + TEXT_PADDING * 3;
    const bh = ih + TEXT_PADDING * 2;
    this.background.clear().rect(bx, by, bw, bh).fill({ color: 0, alpha: 0 });
  }
}

export class CheckBox extends LabelToggle {
  constructor() {
    super('fl.controls.CheckBox', 'CheckBox');
  }
}

interface Group {
  name: string;
  radioButtons: RadioButton[];
  selection: RadioButton | null;
}

const GROUP_BY_PREFIX: [string, string][] = [
  ['rd_qual', 'qualGroup'],
  ['rd_part', 'partGroup'],
  ['rd_blood', 'partBlood'],
];

export class RadioButton extends LabelToggle {
  static groups = new Map<string, Group>();
  value: unknown = '';
  private _group: Group | null = null;
  private groupResolved = false;

  constructor() {
    super('fl.controls.RadioButton', 'RadioButton');
  }

  static getGroup(name: string): Group {
    let g = RadioButton.groups.get(name);
    if (!g) RadioButton.groups.set(name, (g = { name, radioButtons: [], selection: null }));
    return g;
  }

  /** Emulates the timeline's __setProp handler (groupName per instance name) on first use. */
  private resolveGroup(): void {
    if (this.groupResolved) return;
    this.groupResolved = true;
    let name = 'RadioButtonGroup';
    const inst = this.label ?? ''; // Pixi label = AS3 instance name
    for (const [p, g] of GROUP_BY_PREFIX) if (inst.startsWith(p)) name = g;
    this.groupName = name;
  }

  get groupName(): string | null {
    this.resolveGroup();
    return this._group ? this._group.name : null;
  }
  set groupName(v: string | null) {
    this.groupResolved = true;
    if (this._group) {
      const i = this._group.radioButtons.indexOf(this);
      if (i != -1) this._group.radioButtons.splice(i, 1);
      if (this._group.selection == this) this._group.selection = null;
    }
    this._group = v != null ? RadioButton.getGroup(v) : null;
    if (this._group) {
      this._group.radioButtons.push(this);
      if (this._selected) this.setSelection(this._group, this);
    }
  }

  private setSelection(g: Group, rb: RadioButton): void {
    if (g.selection == rb || g.radioButtons.indexOf(rb) == -1) return;
    g.selection = rb;
    // Event.CHANGE → handleChange on every member
    g.radioButtons = g.radioButtons.filter((r) => !r.destroyed);
    for (const r of g.radioButtons) r.handleChange(g);
  }

  private handleChange(g: Group): void {
    super.selected = g.selection == this;
  }

  override get selected(): boolean {
    return this._selected;
  }
  override set selected(v: boolean) {
    if (v == false || this.selected) return;
    this.resolveGroup();
    if (this._group == null) super.selected = v;
    else this.setSelection(this._group, this);
  }
}
