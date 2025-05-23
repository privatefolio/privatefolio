# Contributing

Before jumping in consider getting familiar with the [ARCHITECTURE.md](./docs//ARCHITECTURE.md) docs.

## Prerequisites

```sh
npm -v
# 11.3.0
node -v
# v22.15.0
yarn -v
# 1.22.22
python --version
# 3.13.3
bun -v
# 1.2.12
```

It's recommended to install Node.js through NVM (Node Version Manager), and to install Yarn through NPM.

```sh
npm install -g npm # Upgrade NPM
npm install -g yarn # Install Yarn
```

On Windows, get it from [coreybutler/nvm-windows](https://github.com/coreybutler/nvm-windows).
On Linux, get it from [nvm-sh/nvm](https://github.com/nvm-sh/nvm).

### Windows

Install the latest version of [Python](https://www.python.org/downloads/) and add it to your PATH.

```ps
powershell -c "irm bun.sh/install.ps1|iex" # Install Bun
```

### Ubuntu

```sh
sudo apt update && sudo apt -y upgrade
sudo apt install libnss3-dev libatk1.0-0 libatk-bridge2.0-0 libgdk-pixbuf2.0-0 libgtk-3-0 -y
curl -fsSL https://bun.sh/install | bash # Install Bun
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

Note: this will trigger the `publish-*.yml` workflows, which will:

- publish the frontend to Cloudflare Pages.
- publish the backend to Docker Hub.
- build the binaries and attach them to the GitHub release.

## Development utils

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
   - Squirrel logs: `C:\Users\daniel\AppData\Local\SquirrelTemp`
   - Electron logs: `C:\Users\daniel\AppData\Roaming\Privatefolio\logs`
   - User data: `C:\Users\daniel\AppData\Roaming\Privatefolio\data`
   - App config: `C:\Users\daniel\AppData\Roaming\Privatefolio\config.json`
   - App code: `C:\Users\daniel\AppData\Local\privatefolio_electron`

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
