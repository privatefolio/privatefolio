#!/bin/bash

APP_VERSION=$(npm pkg get version) \
GIT_HASH=$(git rev-parse HEAD) \
GIT_DATE=$(git show -s --format=%cI HEAD) \
bun src/start.ts
