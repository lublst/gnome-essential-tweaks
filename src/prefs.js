import Gio from "gi://Gio";
import Adw from "gi://Adw";

import { ExtensionPreferences, gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

export default class EssentialTweaksPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    // Load extension settings
    window._settings = this.getSettings();

    // Create the preferences window
    const page = new Adw.PreferencesPage({
      title: _("General"),
      icon_name: "preferences-other-symbolic"
    });
    window.add(page);

    // Behavior preferences
    const group = new Adw.PreferencesGroup({
      title: _("Behavior"),
      description: _("Enable quality of life features and tweak annoying defaults")
    });
    page.add(group);

    const noWindowAttentionRow = new Adw.SwitchRow({
      title: _("No Window Attention Notification"),
      subtitle: _("Focus new windows instead of showing a \"window is ready\" notification")
    });
    group.add(noWindowAttentionRow);

    const clickToCloseOverviewRow = new Adw.SwitchRow({
      title: _("Click to Close the Overview"),
      subtitle: _("Close the overview when clicking on the empty space around the background")
    });
    group.add(clickToCloseOverviewRow);

    // Bind settings
    window._settings.bind("no-window-attention", noWindowAttentionRow, "active", Gio.SettingsBindFlags.DEFAULT);
    window._settings.bind("click-to-close-overview", clickToCloseOverviewRow, "active", Gio.SettingsBindFlags.DEFAULT);
  }
}
