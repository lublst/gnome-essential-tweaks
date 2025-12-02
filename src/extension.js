import Clutter from 'gi://Clutter';
import Meta from 'gi://Meta';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { ScreenCorners, PanelCorners } from './corners.js';

export default class EssentialTweaksExtension extends Extension {
  enable() {
    this._settings = this.getSettings();
    this._settingsSignals = [];
    this._sharedSignals = {};
    this._modules = [
      ['no-window-attention',
        this._updateNoWindowAttention.bind(this),
        this._disableNoWindowAttention.bind(this)],
      ['click-to-close-overview',
        this._updateClickToCloseOverview.bind(this),
        this._disableClickToCloseOverview.bind(this)],
      ['panel-corners',
        this._updatePanelCorners.bind(this),
        this._disablePanelCorners.bind(this)],
      ['screen-corners',
        this._updateScreenCorners.bind(this),
        this._disableScreenCorners.bind(this)],
      ['show-overview-on-startup',
        this._updateNoOverviewOnStartup.bind(this),
        this._disableNoOverviewOnStartup.bind(this)],
      ['workspace-wraparound',
        this._updateWorkspaceWraparound.bind(this),
        this._disableWorkspaceWraparound.bind(this)]
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
      this._handleSharedSignal('startup-complete');
    });

    this._monitorsChangedHandler = Main.layoutManager.connect('monitors-changed', () => {
      this._handleSharedSignal('monitors-changed');
    });

    this._workareasChangedHandler = global.display.connect('workareas-changed', () => {
      this._handleSharedSignal('workareas-changed');
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

    this._settings = null;
    this._settingsSignals = null;
    this._sharedSignals = null;
    this._modules = null;
  }

  _handleSharedSignal(signalName) {
    Object.values(this._sharedSignals)
      .filter(([name, _]) => name === signalName)
      .forEach(([_, handler]) => handler());
  }

  _enableClickToCloseOverview() {
    this._overviewClickGesture = new Clutter.ClickGesture();

    this._overviewClickGesture.connect('recognize', action => {
      // Only allow left click
      if (action.get_button() > Clutter.BUTTON_PRIMARY) {
        return;
      }

      // Ignore clicks on the search box
      const searchEntry = Main.overview._overview._controls._searchEntry;
      const [x, y] = global.get_pointer();
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

  _disableClickToCloseOverview() {
    if (this._overviewClickGesture) {
      Main.layoutManager.overviewGroup.remove_action(this._overviewClickGesture);
    }

    this._overviewClickGesture = null;
  }

  _updateClickToCloseOverview() {
    if (this._settings.get_boolean('click-to-close-overview')) {
      this._enableClickToCloseOverview();
    } else {
      this._disableClickToCloseOverview();
    }
  }

  _enableNoWindowAttention() {
    this._windowAttentionHandler = global.display.connect('window-demands-attention', (_, window) => {
      // Ignore when in overview
      if (Main.overview._shown) {
        return;
      }

      // Focus the window
      Main.activateWindow(window);
    });
  }

  _disableNoWindowAttention() {
    if (this._windowAttentionHandler) {
      global.display.disconnect(this._windowAttentionHandler);
    }

    this._windowAttentionHandler = null;
  }

  _updateNoWindowAttention() {
    if (this._settings.get_boolean('no-window-attention')) {
      this._enableNoWindowAttention();
    } else {
      this._disableNoWindowAttention();
    }
  }

  _enablePanelCorners() {
    const init = () => {
      this._panelCorners = new PanelCorners();

      update();
    }

    const update = () => {
      if (this._panelCorners) {
        this._panelCorners.update();
      }
    }

    if (Main.layoutManager._startingUp) {
      this._sharedSignals.panelCornersStartup = ['startup-complete', init];
    } else {
      init();
    }

    this._sharedSignals.panelCornersMonitorsChanged = ['monitors-changed', update];
    this._sharedSignals.panelCornersWorkareasChanged = ['workareas-changed', update];
  }

  _disablePanelCorners() {
    if (this._panelCorners) {
      this._panelCorners.remove();
    }

    this._panelCorners = null;

    delete this._sharedSignals.panelCornersStartup;
    delete this._sharedSignals.panelCornersMonitorsChanged;
    delete this._sharedSignals.panelCornersWorkareasChanged;
  }

  _updatePanelCorners() {
    if (this._settings.get_boolean('panel-corners')) {
      this._enablePanelCorners();
    } else {
      this._disablePanelCorners();
    }
  }

  _enableScreenCorners() {
    const init = () => {
      this._screenCorners = new ScreenCorners();

      update();
    }

    const update = () => {
      if (this._screenCorners) {
        this._screenCorners.update();
      }
    }

    if (Main.layoutManager._startingUp) {
      this._sharedSignals.screenCornersStartup = ['startup-complete', init];
    } else {
      init();
    }

    this._sharedSignals.screenCornersMonitorsChanged = ['monitors-changed', update];
    this._sharedSignals.screenCornersWorkareasChanged = ['workareas-changed', update];
  }

  _disableScreenCorners() {
    if (this._screenCorners) {
      this._screenCorners.remove();
    }

    this._screenCorners = null;

    delete this._sharedSignals.screenCornersStartup;
    delete this._sharedSignals.screenCornersMonitorsChanged;
    delete this._sharedSignals.screenCornersWorkareasChanged;
  }

  _updateScreenCorners() {
    if (this._settings.get_boolean('screen-corners')) {
      this._enableScreenCorners();
    } else {
      this._disableScreenCorners();
    }
  }

  _enableNoOverviewOnStartup() {
    if (!Main.layoutManager._startingUp) {
      return;
    }

    // Disable the overview entirely
    if (this._originalHasOverview != null) {
      this._originalHasOverview = Main.sessionMode.hasOverview;
    }

    Main.sessionMode.hasOverview = false;

    // Restore the original state after startup is complete
    this._sharedSignals.noOverviewOnStartup = ['startup-complete', this._disableNoOverviewOnStartup.bind(this)];
  }

  _disableNoOverviewOnStartup() {
    if (this._originalHasOverview != null) {
      Main.sessionMode.hasOverview = this._originalHasOverview;
    }

    this._originalHasOverview = null;

    delete this._sharedSignals.noOverviewOnStartup;
  }

  _updateNoOverviewOnStartup() {
    if (this._settings.get_boolean('show-overview-on-startup')) {
      this._disableNoOverviewOnStartup();
    } else {
      this._enableNoOverviewOnStartup();
    }
  }

  _enableWorkspaceWraparound() {
    // Back up the original workspace prototype
    this._originalWorkspaceProto = Meta.Workspace.prototype.get_neighbor;

    // Monkey patching time
    Meta.Workspace.prototype.get_neighbor = function (direction) {
      let index = this.index();
      let lastIndex = global.workspace_manager.n_workspaces - 1;
      let neighborIndex;

      if (direction === Meta.MotionDirection.UP || direction === Meta.MotionDirection.LEFT) {
        neighborIndex = (index > 0) ? index - 1 : lastIndex;
      } else {
        neighborIndex = (index < lastIndex) ? index + 1 : 0;
      }

      return global.workspace_manager.get_workspace_by_index(neighborIndex);
    }
  }

  _disableWorkspaceWraparound() {
    if (this._originalWorkspaceProto) {
      Meta.Workspace.prototype.get_neighbor = this._originalWorkspaceProto;
    }

    this._originalWorkspaceProto = null;
  }

  _updateWorkspaceWraparound() {
    if (this._settings.get_boolean('workspace-wraparound')) {
      this._enableWorkspaceWraparound();
    } else {
      this._disableWorkspaceWraparound();
    }
  }
}
