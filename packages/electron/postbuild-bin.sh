#!/bin/bash

# Define packages to handle
PACKAGES=(
  "privatefolio-frontend:../../frontend"
  "privatefolio-backend:../../backend"
)

for PACKAGE_INFO in "${PACKAGES[@]}"; do
  # Split the package info into name and source path
  PACKAGE_NAME=${PACKAGE_INFO%%:*}
  PACKAGE_SRC=${PACKAGE_INFO#*:}
  PACKAGE_LOCATION="node_modules/$PACKAGE_NAME"
  
  # Check if directory exists (if symlink exists this will return false)
  if [ -d "$PACKAGE_LOCATION" ]; then
      # Remove the copied directory
      rm -rf "$PACKAGE_LOCATION"
      # Restore the symlink
      ln -s "$PACKAGE_SRC" "$PACKAGE_LOCATION"
  fi
done
