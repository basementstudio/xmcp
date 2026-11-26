#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
OUT="../../apps/website/public/og/figures"
URL="file://$(pwd)/cards.html"
mkdir -p "$OUT"
for theme in light dark; do
  for figure in silk fine swirl edge rain tangle corner; do
    "$CHROME" --headless=new --disable-gpu --hide-scrollbars --default-background-color=00000000 \
      --user-data-dir="$(mktemp -d)" --force-device-scale-factor=1 --window-size=1200,630 \
      --screenshot="$OUT/$theme-$figure.png" "$URL?figure=$figure&theme=$theme&w=1200&h=630" >/dev/null 2>&1
  done
done
