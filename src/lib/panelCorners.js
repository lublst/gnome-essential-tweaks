import Cairo from 'cairo';
import Clutter from 'gi://Clutter';
import Cogl from 'gi://Cogl';
import GObject from 'gi://GObject';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { ANIMATION_TIME } from 'resource:///org/gnome/shell/ui/overview.js';

export class PanelCorners {
  constructor(settings) {
    this._settings = settings;

    this._signal = this._settings.connect('changed::panel-corners', () => {
      this.update();
    });
  }

  update() {
    if (this._settings.get_boolean('panel-corners')) {
      this.enable();
    } else {
      this.disable();
    }
  }

  enable() {
    this._startupHandler = Main.layoutManager.connect('startup-complete', () => {
      this._updateCorners();
    });

    this._monitorsChangedHandler = Main.layoutManager.connect('monitors-changed', () => {
      this._updateCorners();
    });

    this._workareasChangedHandler = global.display.connect('workareas-changed', () => {
      this._updateCorners();
    });

    this._updateCorners();
  }

  disable() {
    if (this._startupHandler) {
      Main.layoutManager.disconnect(this._startupHandler);
    }

    if (this._monitorsChangedHandler) {
      Main.layoutManager.disconnect(this._monitorsChangedHandler);
    }

    if (this._workareasChangedHandler) {
      global.display.disconnect(this._workareasChangedHandler);
    }

    this._removeCorners();

    this._startupHandler = null;
    this._monitorsChangedHandler = null;
    this._workareasChangedHandler = null;
  }

  destroy() {
    this._settings.disconnect(this._signal);

    this.disable();

    this._settings = null;
    this._signal = null;
  }

  _updateCorners() {
    if (Main.layoutManager._startingUp) {
      return;
    }

    // Remove old corners
    this._removeCorners();

    // Create new panel corners
    Main.panel._leftCorner = new PanelCorner(this._settings, St.Side.LEFT);
    Main.panel._rightCorner = new PanelCorner(this._settings, St.Side.RIGHT);

    this._updateCorner(Main.panel._leftCorner);
    this._updateCorner(Main.panel._rightCorner);
  }

  _updateCorner(corner) {
    Main.panel.bind_property('style', corner, 'style', GObject.BindingFlags.SYNC_CREATE);
    Main.panel.add_child(corner);

    corner.vfunc_style_changed();
  }

  _removeCorners() {
    if (Main.panel._leftCorner) {
      this._removeCorner(Main.panel._leftCorner);
    }

    if (Main.panel._rightCorner) {
      this._removeCorner(Main.panel._rightCorner);
    }

    Main.panel._leftCorner = null;
    Main.panel._rightCorner = null;
  }

  _removeCorner(corner) {
    Main.panel.remove_child(corner);

    corner.disconnectSignals();
    corner.destroy();
  }
}

class PanelCorner extends St.DrawingArea {
  static {
    GObject.registerClass(this);
  }

  constructor(settings, side) {
    super({ style_class: 'panel-corner' });

    const scaleFactor = St.ThemeContext.get_for_stage(global.stage).scale_factor;

    this._settings = settings;
    this._side = side;
    this._radius = 12 * scaleFactor;

    this._signals = [
      this._settings.connect('changed::panel-corners-left-color', this.vfunc_style_changed.bind(this)),
      this._settings.connect('changed::panel-corners-right-color', this.vfunc_style_changed.bind(this))
    ];

    this._positionChangeHandler = Main.panel.connect('notify::position', this._updateCornerPosition.bind(this));
    this._sizeChangeHandler = Main.panel.connect('notify::size', this._updateCornerPosition.bind(this));

    this.set_opacity(0);
  }

  _updateCornerPosition() {
    const childBox = new Clutter.ActorBox();

    switch (this._side) {
      case St.Side.LEFT:
        childBox.x1 = 0;
        childBox.x2 = this._radius;
        childBox.y1 = Main.panel.height;
        childBox.y2 = Main.panel.height + this._radius;

        break;

      case St.Side.RIGHT:
        childBox.x1 = Main.panel.width - this._radius;
        childBox.x2 = Main.panel.width;
        childBox.y1 = Main.panel.height;
        childBox.y2 = Main.panel.height + this._radius;

        break;
    }

    this.allocate(childBox);
  }

  vfunc_repaint() {
    const cr = this.get_context();
    const color = this._getCornerColor();
    const radius = this._radius;

    cr.setOperator(Cairo.Operator.SOURCE);
    cr.setSourceColor(color);

    cr.moveTo(0, 0);

    switch (this._side) {
      case St.Side.LEFT:
        cr.arc(radius, radius, radius, Math.PI, 3 * Math.PI / 2);
        cr.lineTo(radius, 0);

        break;

      case St.Side.RIGHT:
        cr.arc(0, radius, radius, 3 * Math.PI / 2, 2 * Math.PI);
        cr.lineTo(radius, 0);

        break;
    }

    cr.closePath();
    cr.fill();

    cr.$dispose();
  }

  vfunc_style_changed() {
    super.vfunc_style_changed();

    this.set_size(this._radius, this._radius);
    this._updateCornerPosition();

    const panelClass = Main.panel.get_style_pseudo_class();
    const inOverview = panelClass && panelClass.includes('overview');

    this.remove_transition('opacity');
    this.ease({
      opacity: inOverview ? 0 : 255,
      duration: ANIMATION_TIME,
      mode: Clutter.AnimationMode.EASE_IN_OUT_QUAD,
    });
  }

  _getCornerColor() {
    const side = this._side === St.Side.LEFT ? 'left' : 'right';
    const color = this._settings.get_string(`panel-corners-${side}-color`);

    return Cogl.color_from_string(color)[1];
  }

  disconnectSignals() {
    this._signals.forEach(signal => this._settings.disconnect(signal));

    if (this._positionChangeHandler) {
      Main.panel.disconnect(this._positionChangeHandler);
    }

    if (this._sizeChangeHandler) {
      Main.panel.disconnect(this._sizeChangeHandler);
    }

    this._settings = null;
    this._signals = null;
    this._positionChangeHandler = null;
    this._sizeChangeHandler = null;
  }
}
