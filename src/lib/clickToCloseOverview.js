import Clutter from 'gi://Clutter';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export class ClickToCloseOverview {
  constructor(settings) {
    this._settings = settings;

    this._signal = this._settings.connect('changed::click-to-close-overview', () => {
      this.update();
    });
  }

  update() {
    if (this._settings.get_boolean('click-to-close-overview')) {
      this.enable();
    } else {
      this.disable();
    }
  }

  enable() {
    this._overviewClickGesture = new Clutter.ClickGesture();

    this._overviewClickGesture.connect('recognize', action => {
      // Only allow left click
      if (action.get_button() > Clutter.BUTTON_PRIMARY) {
        return;
      }

      // Ignore clicks on the search box
      const [x, y] = global.get_pointer();
      const searchEntry = Main.overview._overview._controls._searchEntry;

      let actor = global.stage.get_actor_at_pos(Clutter.PickMode.ALL, x, y);

      while (actor) {
        if (actor === searchEntry) {
          return;
        }

        actor = actor.get_parent();
      }

      // Close the overview
      Main.overview.toggle();
    });

    Main.layoutManager.overviewGroup.add_action(this._overviewClickGesture);
  }

  disable() {
    if (this._overviewClickGesture) {
      Main.layoutManager.overviewGroup.remove_action(this._overviewClickGesture);
    }

    this._overviewClickGesture = null;
  }

  destroy() {
    this._settings.disconnect(this._signal);

    this.disable();

    this._settings = null;
    this._signal = null;
  }
}
