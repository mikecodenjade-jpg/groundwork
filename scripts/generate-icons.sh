#!/bin/bash
# Generate PNG icons from SVG source for iOS/PWA
# Requires: ImageMagick (brew install imagemagick)
# Run from project root: bash scripts/generate-icons.sh

set -e

SVG_SOURCE="public/icons/icon-512.svg"
OUT_DIR="public/icons"

if ! command -v convert &> /dev/null; then
  echo "Error: ImageMagick is required. Install with: brew install imagemagick"
  exit 1
fi

if [ ! -f "$SVG_SOURCE" ]; then
  echo "Error: SVG source not found at $SVG_SOURCE"
  exit 1
fi

echo "Generating PNG icons from $SVG_SOURCE..."

# PWA / App Store icons
convert -background none -density 300 "$SVG_SOURCE" -resize 1024x1024 "$OUT_DIR/icon-1024.png"
convert -background none -density 300 "$SVG_SOURCE" -resize 512x512   "$OUT_DIR/icon-512.png"
convert -background none -density 300 "$SVG_SOURCE" -resize 192x192   "$OUT_DIR/icon-192.png"
convert -background none -density 300 "$SVG_SOURCE" -resize 180x180   "$OUT_DIR/apple-touch-icon.png"
convert -background none -density 300 "$SVG_SOURCE" -resize 120x120   "$OUT_DIR/icon-120.png"

echo "Done! Generated icons:"
ls -la "$OUT_DIR"/*.png
