#!/usr/bin/env bash

BUNDLE=0

for arg in "$@"; do
    [ "$arg" = "--bundle" ] && BUNDLE=1
done

NAME="essential-tweaks"
DOMAIN="lublst.github.io"
ZIP_NAME="$NAME@$DOMAIN.zip"

echo ":: Creating extension bundle..."
cd src
zip -qr "$ZIP_NAME" .

if [ "$BUNDLE" -eq 1 ]; then
    mv "$ZIP_NAME" ..
else
    echo ":: Installing extension..."
    gnome-extensions install -f "$ZIP_NAME"
    rm "$ZIP_NAME"
fi
