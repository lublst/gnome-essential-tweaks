import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class EssentialTweaksPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings();
    const builder = new Gtk.Builder();

    builder.add_from_file(`${this.path}/prefs.ui`);

    const behaviorPage = builder.get_object('behavior-page');
    const appearancePage = builder.get_object('appearance-page');

    window.add(behaviorPage);
    window.add(appearancePage);

    const properties = [
      'click-to-close-overview',
      'keep-favorites-in-app-grid',
      'no-favorite-notifications',
      'no-window-ready-notifications',
      'panel-corners',
      'screen-corners',
      'show-overview-on-startup',
      'workspace-wraparound'
    ];

    properties.forEach(property => {
      settings.bind(property, builder.get_object(property), 'active', Gio.SettingsBindFlags.DEFAULT);
    });

    this._bindColorButton(builder.get_object('panel-left-corner-color'), settings, 'panel-left-corner-color');
    this._bindColorButton(builder.get_object('panel-right-corner-color'), settings, 'panel-right-corner-color');
  }

  _bindColorButton(button, settings, key) {
    const dialog = new Gtk.ColorDialog();
    const rgba = new Gdk.RGBA();
    const color = settings.get_string(key);

    if (!rgba.parse(color)) {
      rgba.parse('#000000');
    }

    button.set_dialog(dialog);
    button.set_rgba(rgba);

    button.connect('notify::rgba', () => {
      settings.set_string(key, button.get_rgba().to_string());
    });
  }
}
