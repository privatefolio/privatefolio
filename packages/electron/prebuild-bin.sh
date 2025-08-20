#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status



# Bundle bun-sh into the resources folder
BUN_LOCATION="resources/bun-sh"
mkdir -p "$BUN_LOCATION"


GITHUB="https://github.com"
GITHUB_REPO="$GITHUB/oven-sh/bun"

# Determine which Bun binary to download based on the build target
if [[ "$1" == "win" || "$npm_lifecycle_event" == *":win" ]]; then
  echo "Downloading Bun for Windows..."
  target="windows-x64"
  curl -fsSL "$GITHUB_REPO/releases/latest/download/bun-$target.zip" -o "$BUN_LOCATION/bun-win.zip"
  unzip -o "$BUN_LOCATION/bun-win.zip" -d "$BUN_LOCATION"
  rm "$BUN_LOCATION/bun-win.zip"
  mv "./$BUN_LOCATION/bun-$target/bun.exe" "$BUN_LOCATION/privatefolio.exe"
  rm -rf "$BUN_LOCATION/bun-$target"
elif [[ "$1" == "mac" || "$1" == mac* || "$npm_lifecycle_event" == *"mac"* ]]; then
  if [[ "$npm_lifecycle_event" == *"x64"* || "$npm_lifecycle_event" == *"amd64"* || "$1" == *"x64"* || "$1" == *"amd64"* ]]; then
    target="darwin-x64"
  else
    target="darwin-aarch64"
  fi
  echo "Downloading Bun for macOS ($target)..."
  curl -fsSL "$GITHUB_REPO/releases/latest/download/bun-$target.zip" -o "$BUN_LOCATION/bun-darwin.zip"
  unzip -o "$BUN_LOCATION/bun-darwin.zip" -d "$BUN_LOCATION"
  rm "$BUN_LOCATION/bun-darwin.zip"
  mv "./$BUN_LOCATION/bun-$target/bun" "$BUN_LOCATION/privatefolio"
  rm -rf "$BUN_LOCATION/bun-$target"
elif [[ "$1" == "linux" || "$npm_lifecycle_event" == *":linux" ]]; then
  echo "Downloading Bun for Linux..."
  target="linux-x64"
  curl -fsSL "$GITHUB_REPO/releases/latest/download/bun-$target.zip" -o "$BUN_LOCATION/bun-linux.zip"
  unzip -o "$BUN_LOCATION/bun-linux.zip" -d "$BUN_LOCATION"
  rm "$BUN_LOCATION/bun-linux.zip"
  mv "./$BUN_LOCATION/bun-$target/bun" "$BUN_LOCATION/privatefolio"
  rm -rf "$BUN_LOCATION/bun-$target"
else
  echo "Unknown platform for Bun download. Please specify win, mac, or linux."
  exit 1
fi

# Make bun executable
chmod +x "$BUN_LOCATION/privatefolio"*
