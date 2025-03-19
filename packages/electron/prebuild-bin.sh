#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

# Define packages to handle with their dependencies
# declare -A PACKAGE_DEPS
# PACKAGE_DEPS["privatefolio-backend"]="" # "sqlite3 sqlite"
# PACKAGE_DEPS["privatefolio-frontend"]=""

# Define packages to handle
PACKAGES=(
  "privatefolio-frontend:../frontend"
  "privatefolio-backend:../backend"
)

for PACKAGE_INFO in "${PACKAGES[@]}"; do
  # Split the package info into name and source path
  PACKAGE_NAME=${PACKAGE_INFO%%:*}
  PACKAGE_SRC=${PACKAGE_INFO#*:}
  PACKAGE_LOCATION="node_modules/$PACKAGE_NAME"
  
  # Check if symlink exists
  if [ -L "$PACKAGE_LOCATION" ]; then
      # Remove existing symlink
      unlink "$PACKAGE_LOCATION"
      # Copy the files
      mkdir -p "$PACKAGE_LOCATION/build"
      cp -r "$PACKAGE_SRC"/build/* "$PACKAGE_LOCATION/build/"
      # mkdir -p "$PACKAGE_LOCATION/src"
      # cp -r "$PACKAGE_SRC"/src/* "$PACKAGE_LOCATION/src/"
      
      # Copy dependencies based on package
      # IFS=' ' read -ra DEPS <<< "${PACKAGE_DEPS[$PACKAGE_NAME]}"
      # for DEP in "${DEPS[@]}"; do
      #   if [ -n "$DEP" ]; then
      #     echo "Copying $DEP"
      #     mkdir -p "$PACKAGE_LOCATION/node_modules/$DEP"
      #     cp -r "$PACKAGE_SRC/node_modules/$DEP"/* "$PACKAGE_LOCATION/node_modules/$DEP/"
      #   fi
      # done
  fi
done

# Bundle bun-sh into the resources folder
BUN_LOCATION="resources/bun-sh"
mkdir -p "$BUN_LOCATION"

# Download Bun binary based on platform
PLATFORM=$(uname -s)
ARCH=$(uname -m)

GITHUB="https://github.com"
GITHUB_REPO="$GITHUB/oven-sh/bun"

# Determine which Bun binary to download based on the build target
if [[ "$1" == "win" || "$npm_lifecycle_event" == *":win" ]]; then
  echo "Downloading Bun for Windows..."
  target="windows-x64"
  curl -fsSL "$GITHUB_REPO/releases/latest/download/bun-$target.zip" -o "$BUN_LOCATION/bun-win.zip"
  unzip -o "$BUN_LOCATION/bun-win.zip" -d "$BUN_LOCATION"
  rm "$BUN_LOCATION/bun-win.zip"
  mv "./$BUN_LOCATION/bun-$target/bun.exe" "$BUN_LOCATION/bun.exe"
  rm -rf "$BUN_LOCATION/bun-$target"
elif [[ "$1" == "mac" || "$npm_lifecycle_event" == *":mac" ]]; then
  echo "Downloading Bun for macOS..."
  if [[ "$ARCH" == "arm64" ]]; then
    target="darwin-aarch64"
  else
    target="darwin-x64"
  fi
  curl -fsSL "$GITHUB_REPO/releases/latest/download/bun-$target.zip" -o "$BUN_LOCATION/bun-darwin.zip"
  unzip -o "$BUN_LOCATION/bun-darwin.zip" -d "$BUN_LOCATION"
  rm "$BUN_LOCATION/bun-darwin.zip"
  mv "./$BUN_LOCATION/bun-$target/bun" "$BUN_LOCATION/bun"
  rm -rf "$BUN_LOCATION/bun-$target"
elif [[ "$1" == "linux" || "$npm_lifecycle_event" == *":linux" ]]; then
  echo "Downloading Bun for Linux..."
  target="linux-x64"
  curl -fsSL "$GITHUB_REPO/releases/latest/download/bun-$target.zip" -o "$BUN_LOCATION/bun-linux.zip"
  unzip -o "$BUN_LOCATION/bun-linux.zip" -d "$BUN_LOCATION"
  rm "$BUN_LOCATION/bun-linux.zip"
  mv "./$BUN_LOCATION/bun-$target/bun" "$BUN_LOCATION/bun"
  rm -rf "$BUN_LOCATION/bun-$target"
else
  echo "Unknown platform for Bun download. Please specify win, mac, or linux."
  exit 1
fi

# Make bun executable
chmod +x "$BUN_LOCATION/bun"*
