import GObject from 'gi://GObject';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as AppFavorites from 'resource:///org/gnome/shell/ui/appFavorites.js';

import { AppDisplay, FolderView } from 'resource:///org/gnome/shell/ui/appDisplay.js';
import { DashIcon } from 'resource:///org/gnome/shell/ui/dash.js';
import { DragDropResult, DragMotionResult } from 'resource:///org/gnome/shell/ui/dnd.js';
import { InjectionManager } from 'resource:///org/gnome/shell/extensions/extension.js';

export class KeepFavoritesInAppGrid {
  constructor(settings) {
    this._settings = settings;
    this._appDisplay = Main.overview._overview.controls.appDisplay;
    this._favorites = AppFavorites.getAppFavorites();

    // Create a dummy AppFavorites instance that pretends to have no favorites
    this._dummyFavorites = new this._favorites.constructor();

    this._signal = this._settings.connect('changed::keep-favorites-in-app-grid', () => {
      this.update();
    });

    this._injectionManager = new InjectionManager();
  }

  update() {
    if (this._settings.get_boolean('keep-favorites-in-app-grid')) {
      this.enable();
    } else {
      this.disable();
    }
  }

  enable() {
    const module = this;

    // Make the app grid show all apps by passing it the dummy favorites
    this._injectionManager.overrideMethod(this._dummyFavorites, 'isFavorite', () => function () {
      return false;
    });

    this._injectionManager.overrideMethod(AppDisplay.prototype, '_redisplay', originalFn => function () {
      this._appFavorites = module._dummyFavorites;

      originalFn.call(this);

      // Fix folder icon previews not showing favorite apps
      // https://github.com/brunos3d/pinned-apps-in-appgrid/issues/3
      if (this._folderIcons) {
        this._folderIcons.forEach(folderIcon => {
          if (folderIcon && folderIcon.icon) {
            folderIcon.icon.update();
          }
        });
      }
    });

    // Show favorites in FolderView
    this._injectionManager.overrideMethod(FolderView.prototype, '_redisplay', originalFn => function () {
      this._appFavorites = module._dummyFavorites;

      originalFn.call(this);
    });

    // Remove apps from favorites when they are dragged from the dash to the app grid
    this._injectionManager.overrideMethod(this._appDisplay, 'acceptDrop', originalFn => function (source) {
      if (module._isDashIcon(source)) {
        if (module._favorites.isFavorite(source.id)) {
          module._favorites.removeFavorite(source.id);
        }

        return DragDropResult.SUCCESS;
      }

      return originalFn.call(this, source);
    });

    this._injectionManager.overrideMethod(this._appDisplay, '_onDragMotion', originalFn => function (dragEvent) {
      if (module._isDashIcon(dragEvent.source)) {
        return DragMotionResult.CONTINUE;
      }

      return originalFn.call(this, dragEvent);
    });

    this._appDisplay._disconnectDnD();
    this._appDisplay._connectDnD();
    this._appDisplay._redisplay();
  }

  disable() {
    this._injectionManager.clear();

    this._appDisplay._disconnectDnD();
    this._appDisplay._connectDnD();
    this._appDisplay._redisplay();
  }

  destroy() {
    this._settings.disconnect(this._signal);

    this.disable();

    this._settings = null;
    this._signal = null;
    this._appDisplay = null;
    this._favorites = null;
    this._dummyFavorites = null;
    this._injectionManager = null;
  }

  _isDashIcon(source) {
    const typeName = GObject.type_name(source);

    // Gjs_dash-to-dock_micxgx_gmail_com_appIcons_DockAppIcon
    // Gjs_dash-to-panel_jderose9_github_com_appIcons_TaskbarAppIcon
    return source instanceof DashIcon
      || typeName.endsWith('DockAppIcon')
      || typeName.endsWith('TaskbarAppIcon');
  }
}
