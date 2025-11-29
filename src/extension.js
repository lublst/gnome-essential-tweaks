import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

export default class EssentialTweaksExtension extends Extension {
  enable() {
    // Load extension settings
    this._settings = this.getSettings();

    // Focus new windows instead of showing a "window is ready" notification
    this._windowAttentionHandler = global.display.connect("window-demands-attention", (_, window) => {
      if (this._settings.get_boolean("no-window-attention") && !Main.overview._shown) {
        Main.activateWindow(window);
      }
    });
  }

  disable() {
    global.display.disconnect(this._windowAttentionHandler);

    this._windowAttentionHandler = null;
    this._settings = null;
  }
}
