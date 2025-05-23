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
  
  # Remove the copied directory
  rm -rf "$PACKAGE_LOCATION"
done
