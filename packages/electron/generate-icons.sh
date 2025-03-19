#!/bin/bash

# Generate icons for the Electron app
yarn electron-icon-builder --input=./src/app-icon.png --output=./build

# Ensure the build/images directory exists
mkdir -p ./build/images

# Copy icons in the electron forge format
cp ./build/icons/win/icon.ico ./build/images/icon.ico
cp ./build/icons/mac/icon.icns ./build/images/icon.icns
cp ./build/icons/png/512x512.png ./build/images/icon.png
cp ./build/icons/png/1024x1024.png ./build/images/icon@2x.png
