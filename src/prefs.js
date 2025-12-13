import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class EssentialTweaksPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    window._settings = this.getSettings();

    const behaviorPage = new Adw.PreferencesPage({
      title: _('Behavior'),
      icon_name: 'org.gnome.Settings-system-symbolic'
    });
    window.add(behaviorPage);

    const overviewGroup = new Adw.PreferencesGroup({
      title: _('Overview and Workspaces')
    });
    behaviorPage.add(overviewGroup);

    const showOverviewOnStartupRow = new Adw.SwitchRow({
      title: _('Show Overview on Startup'),
      subtitle: _('Toggle between showing the overview or the desktop on startup')
    });
    overviewGroup.add(showOverviewOnStartupRow);

    const clickToCloseOverviewRow = new Adw.SwitchRow({
      title: _('Click to Close the Overview'),
      subtitle: _('Close the overview when clicking on the empty space around the background')
    });
    overviewGroup.add(clickToCloseOverviewRow);

    const workspaceWraparoundRow = new Adw.SwitchRow({
      title: _('Workspace Wraparound'),
      subtitle: _('Allow switching from the last workspace to the first and vice versa')
    });
    overviewGroup.add(workspaceWraparoundRow);

    const otherGroup = new Adw.PreferencesGroup({
      title: _('Other')
    });
    behaviorPage.add(otherGroup);

    const noWindowReadyNotificationsRow = new Adw.SwitchRow({
      title: _('No Window Attention Notifications'),
      subtitle: _('Focus new windows instead of showing a "window is ready" notification')
    });
    otherGroup.add(noWindowReadyNotificationsRow);

    const noFavoriteNotificationsRow = new Adw.SwitchRow({
      title: _('No Favorite Notifications'),
      subtitle: _('Don\'t show notifications when pinning apps to the dash')
    });
    otherGroup.add(noFavoriteNotificationsRow);

    const keepFavoritesInAppGridRow = new Adw.SwitchRow({
      title: _('Keep Favorites in App Grid'),
      subtitle: _('Because the app grid is for all apps')
    });
    otherGroup.add(keepFavoritesInAppGridRow);

    const appearancePage = new Adw.PreferencesPage({
      title: _('Appearance'),
      icon_name: 'org.gnome.Settings-appearance-symbolic'
    });
    window.add(appearancePage);

    const cornersGroup = new Adw.PreferencesGroup({
      title: _('Corners'),
    });
    appearancePage.add(cornersGroup);

    const screenCornersRow = new Adw.SwitchRow({
      title: _('Screen Corners'),
      subtitle: _('Round the corners of the screen for a more premium look')
    });
    cornersGroup.add(screenCornersRow);

    const panelCornersRow = new Adw.SwitchRow({
      title: _('Panel Corners'),
      subtitle: _('Also round the corners of the panel')
    });
    cornersGroup.add(panelCornersRow);

    const panelLeftCornerColorButton = new Gtk.ColorDialogButton({
      dialog: new Gtk.ColorDialog(),
    });
    this._connectColorButton(panelLeftCornerColorButton, window._settings, 'panel-left-corner-color');

    const panelRightCornerColorButton = new Gtk.ColorDialogButton({
      dialog: new Gtk.ColorDialog(),
    });
    this._connectColorButton(panelRightCornerColorButton, window._settings, 'panel-right-corner-color');

    const panelLeftCornerColorRow = new Adw.ActionRow({
      title: _('Left Panel Corner Color'),
    });
    panelLeftCornerColorRow.add_suffix(panelLeftCornerColorButton);
    panelLeftCornerColorRow.set_activatable_widget(panelLeftCornerColorButton);
    cornersGroup.add(panelLeftCornerColorRow);

    const panelRightCornerColorRow = new Adw.ActionRow({
      title: _('Right Panel Corner Color'),
    });
    panelRightCornerColorRow.add_suffix(panelRightCornerColorButton);
    panelRightCornerColorRow.set_activatable_widget(panelRightCornerColorButton);
    cornersGroup.add(panelRightCornerColorRow);

    window._settings.bind('click-to-close-overview', clickToCloseOverviewRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    window._settings.bind('keep-favorites-in-app-grid', keepFavoritesInAppGridRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    window._settings.bind('no-favorite-notifications', noFavoriteNotificationsRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    window._settings.bind('no-window-ready-notifications', noWindowReadyNotificationsRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    window._settings.bind('panel-corners', panelCornersRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    window._settings.bind('screen-corners', screenCornersRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    window._settings.bind('show-overview-on-startup', showOverviewOnStartupRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    window._settings.bind('workspace-wraparound', workspaceWraparoundRow, 'active', Gio.SettingsBindFlags.DEFAULT);
  }

  _connectColorButton(button, settings, key) {
    const rgba = new Gdk.RGBA();

    rgba.parse(settings.get_string(key));
    button.set_rgba(rgba);

    button.connect('notify::rgba', () => {
      settings.set_string(key, button.get_rgba().to_string());
    });
  }
}
