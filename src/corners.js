import Cairo from 'cairo';
import Clutter from 'gi://Clutter';
import Cogl from 'gi://Cogl';
import GObject from 'gi://GObject';
import Meta from 'gi://Meta';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { ANIMATION_TIME } from 'resource:///org/gnome/shell/ui/overview.js';

export class ScreenCorners {
  update() {
    // Remove old corners
    this.remove();

    // Create new corners on every monitor
    const corners = [
      Meta.DisplayCorner.TOPLEFT,
      Meta.DisplayCorner.TOPRIGHT,
      Meta.DisplayCorner.BOTTOMLEFT,
      Meta.DisplayCorner.BOTTOMRIGHT
    ];

    Main.layoutManager.monitors.forEach(monitor => {
      corners.forEach(corner => {
        const actor = new ScreenCorner(corner, monitor);

        Main.layoutManager.addTopChrome(actor, { trackFullscreen: true });
        Main.layoutManager._screenCorners.push(actor);
      });
    });
  }

  remove() {
    if (Main.layoutManager._screenCorners) {
      Main.layoutManager._screenCorners.forEach(corner => {
        corner.destroy();
      });
    }

    Main.layoutManager._screenCorners = [];
  }
}

export class PanelCorners {
  update() {
    // Remove old corners
    this.remove();

    // Create new panel corners
    Main.panel._leftCorner = new PanelCorner(St.Side.LEFT);
    Main.panel._rightCorner = new PanelCorner(St.Side.RIGHT);

    this.update_corner(Main.panel._leftCorner);
    this.update_corner(Main.panel._rightCorner);
  }

  update_corner(corner) {
    Main.panel.bind_property('style', corner, 'style', GObject.BindingFlags.SYNC_CREATE);
    Main.panel.add_child(corner);

    corner.vfunc_style_changed();
  }

  remove() {
    if (Main.panel._leftCorner) {
      this.remove_corner(Main.panel._leftCorner);
    }

    if (Main.panel._rightCorner) {
      this.remove_corner(Main.panel._rightCorner);
    }

    Main.panel._leftCorner = null;
    Main.panel._rightCorner = null;
  }

  remove_corner(corner) {
    Main.panel.remove_child(corner);

    corner.disconnectSignals();
    corner.destroy();
  }
}

export class ScreenCorner extends St.DrawingArea {
  static {
    GObject.registerClass(this);
  }

  constructor(corner, monitor) {
    super({ style_class: 'screen-corner' });

    const scaleFactor = St.ThemeContext.get_for_stage(global.stage).scale_factor;

    this._corner = corner;
    this._monitor = monitor;
    this._radius = 12 * scaleFactor;

    this._update_corner_position();
  }

  _update_corner_position() {
    switch (this._corner) {
      case Meta.DisplayCorner.TOPLEFT:
        this.set_position(
          this._monitor.x,
          this._monitor.y
        );

        break;

      case Meta.DisplayCorner.TOPRIGHT:
        this.set_position(
          this._monitor.x + this._monitor.width - this._radius,
          this._monitor.y
        );

        break;

      case Meta.DisplayCorner.BOTTOMLEFT:
        this.set_position(
          this._monitor.x,
          this._monitor.y + this._monitor.height - this._radius
        );

        break;

      case Meta.DisplayCorner.BOTTOMRIGHT:
        this.set_position(
          this._monitor.x + this._monitor.width - this._radius,
          this._monitor.y + this._monitor.height - this._radius
        );

        break;
    }
  }

  vfunc_repaint() {
    const cr = this.get_context();
    const color = Cogl.color_from_string('#000000ff')[1];
    const radius = this._radius;

    cr.setOperator(Cairo.Operator.SOURCE);
    cr.setSourceColor(color);

    switch (this._corner) {
      case Meta.DisplayCorner.TOPLEFT:
        cr.arc(radius, radius, radius, Math.PI, 3 * Math.PI / 2);
        cr.lineTo(0, 0);

        break;

      case Meta.DisplayCorner.TOPRIGHT:
        cr.arc(0, radius, radius, 3 * Math.PI / 2, 2 * Math.PI);
        cr.lineTo(radius, 0);

        break;

      case Meta.DisplayCorner.BOTTOMLEFT:
        cr.arc(radius, 0, radius, Math.PI / 2, Math.PI);
        cr.lineTo(0, radius);

        break;

      case Meta.DisplayCorner.BOTTOMRIGHT:
        cr.arc(0, 0, radius, 0, Math.PI / 2);
        cr.lineTo(radius, radius);

        break;
    }

    cr.closePath();
    cr.fill();

    cr.$dispose();
  }

  vfunc_style_changed() {
    super.vfunc_style_changed();

    this.set_size(this._radius, this._radius);
    this._update_corner_position();
  }
}

export class PanelCorner extends St.DrawingArea {
  static {
    GObject.registerClass(this);
  }

  constructor(side) {
    super({ style_class: 'panel-corner' });

    const scaleFactor = St.ThemeContext.get_for_stage(global.stage).scale_factor;

    this._side = side;
    this._radius = 12 * scaleFactor;

    this._positionChangeHandler = Main.panel.connect('notify::position', this._update_corner_position.bind(this));
    this._sizeChangeHandler = Main.panel.connect('notify::size', this._update_corner_position.bind(this));

    this.set_opacity(0);
  }

  _update_corner_position() {
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
    const color = Cogl.color_from_string('#000000ff')[1];
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
    this._update_corner_position();

    const panelClass = Main.panel.get_style_pseudo_class();
    const inOverview = panelClass && panelClass.includes('overview');

    this.remove_transition('opacity');
    this.ease({
      opacity: inOverview ? 0 : 255,
      duration: ANIMATION_TIME,
      mode: Clutter.AnimationMode.EASE_IN_OUT_QUAD,
    });
  }

  disconnectSignals() {
    if (this._positionChangeHandler) {
      Main.panel.disconnect(this._positionChangeHandler);
    }

    if (this._sizeChangeHandler) {
      Main.panel.disconnect(this._sizeChangeHandler);
    }

    this._positionChangeHandler = null;
    this._sizeChangeHandler = null;
  }
}
