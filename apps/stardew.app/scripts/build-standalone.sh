#!/usr/bin/env bash
# Build standalone package for Linux distribution
# Usage: bash scripts/build-standalone.sh
# Run from: apps/stardew.app directory

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
OUT_DIR="$APP_DIR/dist"

echo -e "\033[36mBuilding Next.js...\033[0m"
cd "$APP_DIR"
npm run build

echo -e "\033[36mAssembling standalone package...\033[0m"

# Clean dist (skip locked files gracefully)
rm -rf "$OUT_DIR" 2>/dev/null || true
mkdir -p "$OUT_DIR"

STANDALONE_ROOT="$APP_DIR/.next/standalone"
STANDALONE_APP="$STANDALONE_ROOT/apps/stardew.app"

# Copy standalone output
cp -r "$STANDALONE_ROOT/node_modules" "$OUT_DIR/node_modules"
cp -r "$STANDALONE_APP/." "$OUT_DIR/"

# Copy static files (not included in standalone by default)
if [ -d "$APP_DIR/.next/static" ]; then
  mkdir -p "$OUT_DIR/.next/static"
  cp -r "$APP_DIR/.next/static/." "$OUT_DIR/.next/static/"
fi

# Copy public folder
if [ -d "$APP_DIR/public" ]; then
  cp -r "$APP_DIR/public" "$OUT_DIR/public"
fi

# Copy launcher
cp "$SCRIPT_DIR/launcher.js" "$OUT_DIR/launcher.js"

# Create shell launcher script
cat > "$OUT_DIR/stardew-tracker.sh" << 'LAUNCHER'
#!/usr/bin/env bash
# Stardew Tracker launcher
# Usage: ./stardew-tracker.sh [--port 3000] [--save /path/to/SaveFolder] [--no-browser]
cd "$(dirname "$0")"
node launcher.js "$@"
LAUNCHER
chmod +x "$OUT_DIR/stardew-tracker.sh"

echo ""
echo -e "\033[32mBuild complete! Distribution folder: $OUT_DIR\033[0m"
echo ""
echo -e "\033[33mTo run:\033[0m"
echo "  cd dist && ./stardew-tracker.sh"
echo "  ./stardew-tracker.sh --port 8080"
echo "  ./stardew-tracker.sh --save ~/StardewValley/Saves/MyFarmer_123456789"
echo "  ./stardew-tracker.sh --port 8080 --save ~/StardewValley/Saves/MyFarmer_123456789 --no-browser"
