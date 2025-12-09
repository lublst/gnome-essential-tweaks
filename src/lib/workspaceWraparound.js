import Meta from 'gi://Meta';

import { InjectionManager } from 'resource:///org/gnome/shell/extensions/extension.js';

export class WorkspaceWraparound {
  constructor(settings) {
    this._settings = settings;

    this._signal = this._settings.connect('changed::workspace-wraparound', () => {
      this.update();
    });

    this._injectionManager = new InjectionManager();
  }

  update() {
    if (this._settings.get_boolean('workspace-wraparound')) {
      this.enable();
    } else {
      this.disable();
    }
  }

  enable() {
    this._injectionManager.overrideMethod(Meta.Workspace.prototype, 'get_neighbor', () => function (direction) {
      let index = this.index();
      let lastIndex = global.workspace_manager.n_workspaces - 1;
      let neighborIndex;

      if (direction === Meta.MotionDirection.UP || direction === Meta.MotionDirection.LEFT) {
        neighborIndex = (index > 0) ? index - 1 : lastIndex;
      } else {
        neighborIndex = (index < lastIndex) ? index + 1 : 0;
      }

      return global.workspace_manager.get_workspace_by_index(neighborIndex);
    });
  }

  disable() {
    this._injectionManager.clear();
  }

  destroy() {
    this._settings.disconnect(this._signal);

    this.disable();

    this._settings = null;
    this._signal = null;
    this._injectionManager = null;
  }
}
