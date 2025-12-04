import * as AppFavorites from 'resource:///org/gnome/shell/ui/appFavorites.js';

export function updateNoFavoriteNotification() {
  if (this._settings.get_boolean('no-favorite-notification')) {
    enableNoFavoriteNotification.bind(this)();
  } else {
    disableNoFavoriteNotification.bind(this)();
  }
}

export function enableNoFavoriteNotification() {
  const favorites = AppFavorites.getAppFavorites();

  // Back up the original favorites prototype
  this._originalFavoritesProto = {
    addFavoriteAtPos: favorites.addFavoriteAtPos,
    removeFavorite: favorites.removeFavorite
  }

  // Override with methods that don't send notifications
  Object.assign(AppFavorites.getAppFavorites(), {
    addFavoriteAtPos(appId, pos) {
      this._addFavorite(appId, pos);
    },
    removeFavorite(appId) {
      this._removeFavorite(appId);
    }
  });
}

export function disableNoFavoriteNotification() {
  const favorites = AppFavorites.getAppFavorites();

  if (this._originalFavoritesProto) {
    Object.assign(favorites, this._originalFavoritesProto);
  }

  this._originalFavoritesProto = null;
}
