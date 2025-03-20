# Contributing

## Prerequisites

```sh
npm -v
# 9.6.6
node -v
# v20.2.0
npm install -g yarn
yarn -v
# 1.22.22
```

### Ubuntu

```sh
sudo apt update && sudo apt -y upgrade
sudo apt install libnss3-dev libatk1.0-0 libatk-bridge2.0-0 libgdk-pixbuf2.0-0 libgtk-3-0 -y
```

## Install

```sh
yarn
yarn build
```

## Development

```sh
yarn dev
```

## Testing

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

## Build for production

```sh
yarn build-bin:win
yarn build-bin:linux
yarn build-bin:mac
```

Run `./packages/electron/out/make/squirrel.windows/x64/Privatefolio-0.2.0\ Setup.exe`.
Run `sudo dpkg -i ./packages/electron/out/make/deb/x64/privatefolio_0.2.0_amd64.deb`.

## Create a release

```sh
yarn new-version <major|minor|patch>
```

Note: this will trigger the `release.yml` GitHub Actions workflow, which will build the binaries and attach them to the GitHub release.

## Development utils

### Add a package as a dependency to another

Note: you need to specify a version due to [this bug](https://github.com/yarnpkg/yarn/issues/4878#issuecomment-386607832).

```sh
yarn workspace privatefolio-frontend add privatefolio-backend@0.2.0
yarn workspace privatefolio-frontend remove privatefolio-backend
yarn workspaces info
```

### Add a dependency to a package

Note: this is broken because `nohoist` is only respected on a fresh install.

```sh
yarn workspace privatefolio-frontend add react
yarn workspace privatefolio-frontend remove react
```

Alternative:

1. Manually add the dependency to the package.json file.
2. Run `yarn clean` in the root directory.
3. Run `yarn` in the root directory.

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
   - Squirrel logs: `C:\Users\daniel\AppData\Local\SquirrelTemp`
   - Electron logs: `C:\Users\daniel\AppData\Roaming\Privatefolio\logs`
   - User data: `C:\Users\daniel\AppData\Roaming\Privatefolio\data`
   - App config: `C:\Users\daniel\AppData\Roaming\Privatefolio\config.json`

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
