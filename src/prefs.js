import Gio from 'gi://Gio';
import Adw from 'gi://Adw';

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class EssentialTweaksPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const page = new Adw.PreferencesPage({
      title: _('Behavior'),
      icon_name: 'preferences-other-symbolic'
    });
    window.add(page);

    const overviewGroup = new Adw.PreferencesGroup({
      title: _('Overview and Workspaces')
    });
    page.add(overviewGroup);

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

    const appearanceGroup = new Adw.PreferencesGroup({
      title: _('Appearance')
    });
    page.add(appearanceGroup);

    const screenCornersRow = new Adw.SwitchRow({
      title: _('Screen Corners'),
      subtitle: _('Round the corners of the screen for a more premium look')
    });
    appearanceGroup.add(screenCornersRow);

    const panelCornersRow = new Adw.SwitchRow({
      title: _('Panel Corners'),
      subtitle: _('Also round the corners of the panel')
    });
    appearanceGroup.add(panelCornersRow);

    const otherGroup = new Adw.PreferencesGroup({
      title: _('Other')
    });
    page.add(otherGroup);

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

    // Bind settings
    window._settings = this.getSettings();

    window._settings.bind('click-to-close-overview', clickToCloseOverviewRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    window._settings.bind('no-favorite-notification', noFavoriteNotificationRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    window._settings.bind('no-window-attention', noWindowAttentionRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    window._settings.bind('screen-corners', screenCornersRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    window._settings.bind('panel-corners', panelCornersRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    window._settings.bind('show-overview-on-startup', showOverviewOnStartupRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    window._settings.bind('workspace-wraparound', workspaceWraparoundRow, 'active', Gio.SettingsBindFlags.DEFAULT);
  }
}
