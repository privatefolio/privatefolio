# Getting started [How to build Privatefolio from source]

## Prerequisites

To build & run the project, you need to have the following build dependencies installed:

```sh
node -v
# v22.15.0
npm -v
# 11.3.0
yarn -v
# 1.22.22
bun -v
# 1.2.12
```

### Node.js

It's recommended to install Node.js through NVM (Node Version Manager), and to install Yarn through NPM.

On Windows, get it from [coreybutler/nvm-windows](https://github.com/coreybutler/nvm-windows).
On Linux, get it from [nvm-sh/nvm](https://github.com/nvm-sh/nvm).

Afterwards, upgrade NPM and install Yarn:

```sh
npm install -g npm
npm install -g yarn
```

### Windows

Install the latest version of [Python](https://www.python.org/downloads/) and add it to your PATH.

```ps
python --version
# 3.13.3
```

Afterwards, install Bun:

```ps
powershell -c "irm bun.sh/install.ps1|iex"
```

### Ubuntu

Ensure these development dependencies are installed:

```sh
sudo apt update && sudo apt -y upgrade
sudo apt install libnss3-dev libatk1.0-0 libatk-bridge2.0-0 libgdk-pixbuf2.0-0 libgtk-3-0 -y
```

Afterwards, install Bun:

```sh
curl -fsSL https://bun.sh/install | bash
```

## Install

Before we can build the project from source, we also need to install the project dependencies:

```sh
yarn
yarn build
```

On Ubuntu, you need to install the set the permissions for the chrome-sandbox file:

```sh
sudo chown root:root packages/electron/node_modules/electron/dist/chrome-sandbox
sudo chmod 4755 packages/electron/node_modules/electron/dist/chrome-sandbox
```

## Development

Run the project in development mode, to see your code changes in real-time.

```sh
yarn dev
```

## Build native apps

To build the native apps, run any of the following commands:

```sh
# desktop apps
yarn bundle:win
yarn bundle:linux
yarn bundle:mac
yarn bundle:mac-x64
# mobile apps
yarn bundle:android
yarn bundle:ios
```

Now you can run the artifacts from these paths:

* Windows `./packages/electron/out/Privatefolio\ Setup\ 2.0.0-beta.44.exe`
* Linux `sudo dpkg -i ./packages/electron/out/privatefolio-electron_2.0.0-beta.44_amd64.deb`
* MacOS Arm64 `./packages/electron/out/Privatefolio-2.0.0-beta.44-arm64.dmg`
* MacOS Intel `./packages/electron/out/Privatefolio-2.0.0-beta.44.dmg`
* iOS `./packages/expo/out/ios/Privatefolio.ipa`
* Android `./packages/expo/out/android/app-release.apk`

## Build docker image

```sh
yarn docker:build
```

## Testing

After making changes to the code, you can run the tests to see if anything broke.

```sh
yarn test
yarn test:bun # special test that has to run separately to ensure sqlite3 is compatible with bun:sqlite
yarn test:ci # running all tests in CI mode
```

To run a single test file:

```sh
cd packages/backend
yarn test <test-file>
yarn test test/tags/tags-api.test.ts
```

## Create a release

```sh
yarn new-version <major|minor|patch>
```

Note: this will trigger the `publish-*.yml` workflows, which will:

* publish the frontend to Cloudflare Pages.
* publish the backend to Docker Hub.
* build the native apps and attach them to the GitHub release.

## Tips & Know-how

### Add a package as a dependency to another

Note: you need to specify a version due to [this bug](https://github.com/yarnpkg/yarn/issues/4878#issuecomment-386607832).

```sh
yarn workspace privatefolio-frontend add privatefolio-backend@0.2.0
yarn workspace privatefolio-frontend remove privatefolio-backend
yarn workspaces info
```

### Add a dependency to a package

```sh
yarn workspace privatefolio-frontend add react
yarn workspace privatefolio-frontend remove react
```

### NPM utils

```sh
npm list ms # List all packages that depend on ms
```

### Yarn utils

```sh
yarn list ms # List all packages that depend on ms
yarn upgrade-interactive # Upgrade all packages to the latest version
yarn cache clean # Clean the cache
```

## Troubleshooting

### Electron

Data is persisted in the following directories:

1. Windows:
   - Updater logs: `C:\Users\daniel\AppData\Local\privatefolio-electron-updater`
   - Electron logs: `C:\Users\daniel\AppData\Roaming\Privatefolio\logs`
   - User data: `C:\Users\daniel\AppData\Roaming\Privatefolio\data`
   - App config: `C:\Users\daniel\AppData\Roaming\Privatefolio\config.json`
   - App code: `C:\Users\daniel\AppData\Local\Programs\Privatefolio`

2. Linux:
   - Electron logs: `~/.config/Privatefolio/logs`
   - User data: `~/.config/Privatefolio/data`
   - App config: `~/.config/Privatefolio/config.json`

You can also package the app without building the binaries:

```sh
cd packages/electron
yarn package
```

And run the executable `./out/Privatefolio-win32-x64/Privatefolio.exe`.
