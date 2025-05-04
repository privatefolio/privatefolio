#!/bin/bash

VITE_APP_VERSION=$(npm pkg get version) \
VITE_GIT_HASH=$(git rev-parse HEAD) \
VITE_GIT_DATE=$(git show -s --format=%cI HEAD) \
vite preview
