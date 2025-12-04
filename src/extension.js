import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { updateClickToCloseOverview, disableClickToCloseOverview } from './lib/clickToCloseOverview.js';
import { updateNoFavoriteNotification, disableNoFavoriteNotification } from './lib/noFavoriteNotification.js';
import { updateNoWindowAttention, disableNoWindowAttention } from './lib/noWindowAttention.js';
import { updatePanelCorners, disablePanelCorners } from './lib/panelCorners.js';
import { updateScreenCorners, disableScreenCorners } from './lib/screenCorners.js';
import { updateNoOverviewOnStartup, disableNoOverviewOnStartup } from './lib/noOverviewOnStartup.js';
import { updateWorkspaceWraparound, disableWorkspaceWraparound } from './lib/workspaceWraparound.js';

export default class EssentialTweaksExtension extends Extension {
  enable() {
    this._main = Main;

    this._settings = this.getSettings();
    this._settingsSignals = [];
    this._sharedSignals = {};
    this._modules = [
      ['click-to-close-overview',
        updateClickToCloseOverview.bind(this),
        disableClickToCloseOverview.bind(this)],
      ['no-favorite-notification',
        updateNoFavoriteNotification.bind(this),
        disableNoFavoriteNotification.bind(this)],
      ['no-window-attention',
        updateNoWindowAttention.bind(this),
        disableNoWindowAttention.bind(this)],
      ['panel-corners',
        updatePanelCorners.bind(this),
        disablePanelCorners.bind(this)],
      ['screen-corners',
        updateScreenCorners.bind(this),
        disableScreenCorners.bind(this)],
      ['show-overview-on-startup',
        updateNoOverviewOnStartup.bind(this),
        disableNoOverviewOnStartup.bind(this)],
      ['workspace-wraparound',
        updateWorkspaceWraparound.bind(this),
        disableWorkspaceWraparound.bind(this)]
    ];

    // Bind module settings
    this._modules.forEach(([name, update, _disable]) => {
      update();

      this._settingsSignals.push(this._settings.connect(`changed::${name}`, () => {
        update();
      }));
    });

    // Signals shared by modules
    this._startupHandler = Main.layoutManager.connect('startup-complete', () => {
      Object.values(this._sharedSignals)
        .filter(([name, _]) => name === 'startup-complete')
        .forEach(([_, handler]) => handler());
    });

    this._monitorsChangedHandler = Main.layoutManager.connect('monitors-changed', () => {
      Object.values(this._sharedSignals)
        .filter(([name, _]) => name === 'monitors-changed')
        .forEach(([_, handler]) => handler());
    });

    this._workareasChangedHandler = global.display.connect('workareas-changed', () => {
      Object.values(this._sharedSignals)
        .filter(([name, _]) => name === 'workareas-changed')
        .forEach(([_, handler]) => handler());
    });
  }

  disable() {
    // Disconnect shared signals
    Main.layoutManager.disconnect(this._startupHandler);
    Main.layoutManager.disconnect(this._monitorsChangedHandler);
    global.display.disconnect(this._workareasChangedHandler);

    this._startupHandler = null;
    this._monitorsChangedHandler = null;
    this._workareasChangedHandler = null;

    // Disconnect signals and disable all modules
    this._settingsSignals.forEach(signal => this._settings.disconnect(signal));
    this._modules.forEach(([_name, _update, disable]) => disable());

    this._main = null;
    this._settings = null;
    this._settingsSignals = null;
    this._sharedSignals = null;
    this._modules = null;
  }
}
