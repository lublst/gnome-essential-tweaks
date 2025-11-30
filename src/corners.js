import Cairo from 'cairo';
import Cogl from 'gi://Cogl';
import GObject from 'gi://GObject';
import Meta from 'gi://Meta';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

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
    // Remove old screen corners
    if (Main.layoutManager._screenCorners) {
      Main.layoutManager._screenCorners.forEach(corner => {
        corner.destroy();
      });
    }

    Main.layoutManager._screenCorners = [];
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
