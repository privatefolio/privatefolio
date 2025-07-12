<p align="center">
  <img src="https://github.com/privatefolio/privatefolio/blob/main/packages/electron/src/app-icon.png?raw=true" alt="Privatefolio Logo" width="100">
</p>

<h1 align="center">Privatefolio</h1>

<p align="center">
  The Free* and Open-source Portfolio Manager - All your crypto assets in one place
</p>

<div align="center">

[![X Follow](https://img.shields.io/twitter/follow/PrivatefolioApp)](https://twitter.com/PrivatefolioApp)
[![Discord](https://img.shields.io/discord/1200080531581321246?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/YHHu9nK8VD)

</div>

<div align="center">

[![Github downloads](https://img.shields.io/github/downloads/privatefolio/privatefolio/total.svg?style=flat)](https://GitHub.com/privatefolio/privatefolio/releases/)
![Visitors](https://api.visitorbadge.io/api/visitors?path=privatefolio%2Fprivatefolio%20&style=flat)
[![GitHub last commit](https://img.shields.io/github/last-commit/privatefolio/privatefolio?style=flat)](https://github.com/privatefolio/privatefolio/commits/main)
[![GitHub commits](https://img.shields.io/github/commit-activity/t/privatefolio/privatefolio)](https://GitHub.com/privatefolio/privatefolio/commit/)
[![GitHub contributors](https://img.shields.io/github/contributors/privatefolio/privatefolio.svg?style=flat)](https://github.com/privatefolio/privatefolio/graphs/contributors)
[![GitHub forks](https://img.shields.io/github/forks/privatefolio/privatefolio?style=flat)](https://github.com/privatefolio/privatefolio/forks)
[![GitHub stars](https://img.shields.io/github/stars/privatefolio/privatefolio?style=flat)](https://github.com/privatefolio/privatefolio/stargazers)

</div>

## Installation

Go to [GitHub releases](https://github.com/privatefolio/privatefolio/releases) and download the latest version for your platform. Each release contains the binaries for Windows, Linux and macOS under the Assets dropdown.

On Windows, you can run the `Privatefolio-<version>.Setup.exe` executable directly.

On Linux, you can run `sudo dpkg -i privatefolio_<version>_amd64.deb` to install the package.

## Features

<table>
<tr>
<td width="250">
<div style="width: 250px; height: 450px; overflow: hidden;">
<img src="https://github.com/privatefolio/privatefolio/blob/main/packages/frontend/public/landing/mobile-demo.png?raw=true" alt="Privatefolio screenshot" style="width: 250px; height: 450px; object-fit: cover; object-position: top; mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 90%);">
</div>
</td>
<td>

- Time travel through trades to surface the strengths and weaknesses of your portfolio
- Inspect and compare your historical net worth with no limitations
- Use advanced TradingView features on your data like indicators, drawing tools, etc.
- Prepare your tax report or feed data into your AI assistant
- Extend the project under the AGPL-3.0 license

</td>
</tr>
</table>

## License

This project is licensed under the **AGPLv3** (GNU Affero General Public License v3.0).

### Key Points of the GNU AGPLv3 License

- **Freedom to Use**: You can use the software for any purpose, including commercial use.
- **Freedom to Study and Modify**: You can study how the program works and modify it to suit your needs, including for commercial purposes.
- **Freedom to Distribute Copies**: You can redistribute copies of the original program, helping others benefit from it.
- **Freedom to Distribute Modified Versions**: You are allowed to distribute your modified versions, including for profit. However, if you run a modified version of the software on a server and allow others to interact with it, you must provide the source code of the modified version to those users.

See the [LICENSE](LICENSE) file for more details.

## For Developers

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A.svg?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Electron](https://img.shields.io/badge/Electron-2B2E3A?style=flat&logo=electron&logoColor=9FEAF9)](https://electronjs.org/)
[![Lerna](https://img.shields.io/badge/Lerna-blueviolet?style=flat&logo=lerna&logoColor=white)](https://lerna.js.org/)
[![Prettier](https://img.shields.io/badge/Prettier-1A2C34?style=flat&logo=prettier&logoColor=F7BA3E)](https://prettier.io/)

Privatefolio is built with modern technologies like TypeScript, React, Bun, and Electron. Contributions are welcome to improve the project further.

For detailed setup instructions, including prerequisites, installation, and testing, please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file.

### How to Contribute

1. Fork the repository and clone it locally.
2. Install dependencies using `yarn` and build the project using `yarn build`.
3. Use `yarn dev` to start the development environment.
4. Check [open issues](https://github.com/privatefolio/privatefolio/issues) or `TODO` comments in the codebase to find tasks to work on.
5. Join our [Discord community](https://discord.gg/YHHu9nK8VD) to discuss development and get help.
6. When you are ready, commit your changes and submit a pull request.

For a complete example of adding a new feature, check out [PR #46](https://github.com/privatefolio/privatefolio/pull/46) which demonstrates how to add a new price API extension.

For Docker setup and deployment, see the [Docker documentation](docs/DOCKER_DEPLOY.md).

### Key Technologies

- **Frontend:** React, Vite, Material-UI
- **Backend:** Node.js, Bun runtime, SQLite
- **Desktop App:** Electron
- **Deployment:** Docker

Feel free to open issues for bugs or feature requests!
