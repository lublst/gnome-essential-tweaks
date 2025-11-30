import Clutter from 'gi://Clutter';
import Meta from 'gi://Meta';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { ScreenCorners } from './corners.js';

export default class EssentialTweaksExtension extends Extension {
  enable() {
    this._settings = this.getSettings();
    this._signals = [];
    this._modules = [
      ['no-window-attention',
        this._updateNoWindowAttention.bind(this),
        this._disableNoWindowAttention.bind(this)],
      ['click-to-close-overview',
        this._updateClickToCloseOverview.bind(this),
        this._disableClickToCloseOverview.bind(this)],
      ['screen-corners',
        this._updateScreenCorners.bind(this),
        this._disableScreenCorners.bind(this)],
      ['show-overview-on-startup',
        this._updateShowOverviewOnStartup.bind(this),
        this._enableShowOverviewOnStartup.bind(this)],
      ['workspace-wraparound',
        this._updateWorkspaceWraparound.bind(this),
        this._disableWorkspaceWraparound.bind(this)]
    ];

    // Bind module settings
    this._modules.forEach(([name, update, _disable]) => {
      update();

      this._signals.push(this._settings.connect(`changed::${name}`, () => {
        update();
      }));
    });
  }

  disable() {
    // Disconnect signals and disable all modules
    this._signals.forEach(signal => this._settings.disconnect(signal));
    this._modules.forEach(([_name, _update, disable]) => disable());

    this._settings = null;
    this._signals = null;
    this._modules = null;
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

  _enableScreenCorners() {
    const self = this;

    function init() {
      self._screenCorners = new ScreenCorners();

      update();
    }

    function update() {
      if (self._screenCorners) {
        self._screenCorners.update();
      }
    }

    if (Main.layoutManager._startingUp) {
      this._screenCornerStartupHandler = Main.layoutManager.connect('startup-complete', init);
    } else {
      init();
    }

    this._monitorsChangedHandler = Main.layoutManager.connect('monitors-changed', update);
    this._workareasChangedHandler = global.display.connect('workareas-changed', update);
  }

  _disableScreenCorners() {
    if (this._screenCorners) {
      this._screenCorners.remove();
    }

    if (this._screenCornerStartupHandler) {
      Main.layoutManager.disconnect(this._screenCornerStartupHandler);
    }

    if (this._monitorsChangedHandler) {
      Main.layoutManager.disconnect(this._monitorsChangedHandler);
    }

    if (this._workareasChangedHandler) {
      global.display.disconnect(this._workareasChangedHandler);
    }

    this._screenCorners = null;
    this._screenCornerStartupHandler = null;
    this._monitorsChangedHandler = null;
    this._workareasChangedHandler = null;
  }

  _updateScreenCorners() {
    if (this._settings.get_boolean('screen-corners')) {
      this._enableScreenCorners();
    } else {
      this._disableScreenCorners();
    }
  }

  _enableShowOverviewOnStartup() {
    if (this._originalHasOverview != null) {
      Main.sessionMode.hasOverview = this._originalHasOverview;
    }

    if (this._overviewStartupHandler) {
      Main.layoutManager.disconnect(this._overviewStartupHandler);
    }

    this._originalHasOverview = null;
    this._overviewStartupHandler = null;
  }

  _disableShowOverviewOnStartup() {
    if (!Main.layoutManager._startingUp || this._overviewStartupHandler) {
      return;
    }

    // Disable the overview entirely
    if (this._originalHasOverview != null) {
      this._originalHasOverview = Main.sessionMode.hasOverview;
    }

    Main.sessionMode.hasOverview = false;

    // Restore the original state after startup is complete
    this._overviewStartupHandler = Main.layoutManager.connect('startup-complete', () => {
      this._enableShowOverviewOnStartup();
    });
  }

  _updateShowOverviewOnStartup() {
    if (this._settings.get_boolean('show-overview-on-startup')) {
      this._enableShowOverviewOnStartup();
    } else {
      this._disableShowOverviewOnStartup();
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
