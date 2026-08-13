#!/usr/bin/env bash
# Render GitHub-safe PNG charts from render.html (Chrome headless).
set -euo pipefail
CHROME="${CHROME:-/usr/bin/google-chrome}"
DIR="$(cd "$(dirname "$0")" && pwd)"

shot() {
  local name="$1" w="$2" h="$3"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --no-sandbox --allow-file-access-from-files \
    --force-device-scale-factor=1 --window-size="${w},${h}" \
    --screenshot="${DIR}/${name}.png" \
    "file://${DIR}/render.html?chart=${name}"
}

shot winloss 1720 680
shot expectancy 1720 760
shot equity 1720 760
shot drawdown 1720 680
echo "wrote ${DIR}/{winloss,expectancy,equity,drawdown}.png"
