#!/usr/bin/env bash
# sim-screenshot.sh
#
# Boot an iPhone simulator at the App Store-required 6.5" display size,
# pin the status bar to a clean "marketing" state (9:41, full battery,
# full Wi-Fi, full cellular bars), and open Simulator.app. After this
# script you can install BiteIQ in the simulator, navigate to each
# screen, and press Cmd+S to save 1284x2778 PNGs to your Desktop ready
# to upload to App Store Connect.
#
# Usage:
#   bash scripts/sim-screenshot.sh                  # default: iPhone 14 Plus
#   bash scripts/sim-screenshot.sh "iPhone 13 Pro Max"
#   bash scripts/sim-screenshot.sh reset            # clear status bar override
#
# Requires: macOS, Xcode + iOS Simulator installed.

set -e

DEVICE="${1:-iPhone 14 Plus}"

if [[ "$DEVICE" == "reset" ]]; then
  echo "Clearing status bar override on the booted simulator..."
  xcrun simctl status_bar booted clear
  echo "Done."
  exit 0
fi

if ! command -v xcrun >/dev/null 2>&1; then
  echo "ERROR: xcrun not found. Install Xcode from the App Store." >&2
  exit 1
fi

# 6.5" display devices accepted by App Store Connect at 1284x2778 or 1242x2688
ALLOWED=(
  "iPhone 14 Plus"
  "iPhone 13 Pro Max"
  "iPhone 12 Pro Max"
  "iPhone 11 Pro Max"
  "iPhone XS Max"
)

ok=false
for a in "${ALLOWED[@]}"; do
  if [[ "$DEVICE" == "$a" ]]; then ok=true; break; fi
done
if [[ "$ok" != "true" ]]; then
  echo "WARNING: '$DEVICE' is not in the recommended 6.5\" device list."
  echo "         Apple accepts these at the right resolution:"
  for a in "${ALLOWED[@]}"; do echo "         - $a"; done
fi

echo "Looking up simulator UDID for '$DEVICE'..."
UDID=$(xcrun simctl list devices available | grep -F "$DEVICE (" | head -n1 | awk -F'[()]' '{print $2}')

if [[ -z "$UDID" ]]; then
  echo "ERROR: No available simulator named '$DEVICE'." >&2
  echo "       Run 'xcrun simctl list devices available' to see what is installed," >&2
  echo "       or open Xcode > Settings > Platforms to download more simulators." >&2
  exit 1
fi
echo "  UDID: $UDID"

echo "Booting simulator..."
xcrun simctl boot "$UDID" 2>/dev/null || echo "  (already booted)"

echo "Opening Simulator.app..."
open -a Simulator

# Give the simulator a moment to come up before status bar override
sleep 2

echo "Pinning marketing status bar (9:41, full bars, charged battery)..."
xcrun simctl status_bar "$UDID" override \
  --time "9:41" \
  --dataNetwork wifi \
  --wifiMode active \
  --wifiBars 3 \
  --cellularMode active \
  --cellularBars 4 \
  --batteryState charged \
  --batteryLevel 100

cat <<EOF

Simulator is ready. Next steps:

  1. Install BiteIQ in the simulator. Two options:
       a) Build a simulator binary:
            cd $(pwd)
            eas build --profile preview --platform ios --simulator
          Then drag the resulting .app onto the Simulator window.
       b) Or install Expo Go in the simulator, then run from the
          dev server and open the project.

  2. Sign in with the demo account you registered for App Store review.
     The credentials live only in App Store Connect (Sign-In Information)
     and your password manager — never in this repo. The app auto-seeds a
     populated dashboard the first time the demo email signs in.

  3. For each screen you want to capture, press Cmd+S in the simulator
     window. Files save to your Desktop at the App Store resolution.

  4. Recommended capture order:
       1) Dashboard (calorie ring + macros)
       2) Photo logging result screen
       3) Voice logging transcript
       4) Coach tab (workout plan with How to do it / Why it helps)
       5) Devices screen

  5. When you're done, clear the marketing status bar:
       bash scripts/sim-screenshot.sh reset

EOF
