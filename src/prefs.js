import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class EssentialTweaksPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
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

    const noWindowAttentionRow = new Adw.SwitchRow({
      title: _('No Window Attention Notification'),
      subtitle: _('Focus new windows instead of showing a \"window is ready\" notification')
    });
    otherGroup.add(noWindowAttentionRow);

    const noFavoriteNotificationRow = new Adw.SwitchRow({
      title: _('No Favorite Notification'),
      subtitle: _('Don\'t show a notification when pinning an app to the dash')
    });
    otherGroup.add(noFavoriteNotificationRow);

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

    // Bind settings
    window._settings = this.getSettings();

    window._settings.bind('click-to-close-overview', clickToCloseOverviewRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    window._settings.bind('no-favorite-notification', noFavoriteNotificationRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    window._settings.bind('no-window-attention', noWindowAttentionRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    window._settings.bind('panel-corners', panelCornersRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    window._settings.bind('screen-corners', screenCornersRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    window._settings.bind('show-overview-on-startup', showOverviewOnStartupRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    window._settings.bind('workspace-wraparound', workspaceWraparoundRow, 'active', Gio.SettingsBindFlags.DEFAULT);
  }
}
