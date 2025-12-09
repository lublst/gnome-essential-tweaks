import * as AppFavorites from 'resource:///org/gnome/shell/ui/appFavorites.js';

import { InjectionManager } from 'resource:///org/gnome/shell/extensions/extension.js';

export class NoFavoriteNotification {
  constructor(settings) {
    this._settings = settings;
    this._favorites = AppFavorites.getAppFavorites();

    this._signal = this._settings.connect('changed::no-favorite-notification', () => {
      this.update();
    });

    this._injectionManager = new InjectionManager();
  }

  update() {
    if (this._settings.get_boolean('no-favorite-notification')) {
      this.enable();
    } else {
      this.disable();
    }
  }

  enable() {
    this._injectionManager.overrideMethod(this._favorites, 'addFavoriteAtPos', () => function (appId, pos) {
      this._addFavorite(appId, pos);
    });

    this._injectionManager.overrideMethod(this._favorites, 'removeFavorite', () => function (appId) {
      this._removeFavorite(appId);
    });
  }

  disable() {
    this._injectionManager.clear();
  }

  destroy() {
    this._settings.disconnect(this._signal);

    this.disable();

    this._settings = null;
    this._favorites = null;
    this._signal = null;
    this._injectionManager = null;
  }
}
