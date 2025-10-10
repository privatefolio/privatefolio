---
title: Start here
description: The AI Wealth Manager - A free* and open-source toolkit for financial empowerment
head:
  - tag: title
    content: Privatefolio Docs
---

<p align="center">
  <img src="https://github.com/privatefolio/privatefolio/blob/main/packages/electron/src/app-icon.png?raw=true" alt="Privatefolio Logo" width="100">
</p>

<h1 align="center">Privatefolio</h1>

<div align="center">

The AI Wealth Manager - A free\* and open-source toolkit for financial empowerment

</div>

<div align="center">

[![X Follow](https://img.shields.io/twitter/follow/PrivatefolioApp)](https://twitter.com/PrivatefolioApp)
[![Discord](https://img.shields.io/discord/1200080531581321246?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/YHHu9nK8VD)

</div>

<div align="center">

[![GitHub downloads](https://img.shields.io/github/downloads/privatefolio/privatefolio/total.svg?style=flat)](https://GitHub.com/privatefolio/privatefolio/releases/)
![Visitors](https://api.visitorbadge.io/api/visitors?path=privatefolio%2Fprivatefolio%20&style=flat)
[![GitHub last commit](https://img.shields.io/github/last-commit/privatefolio/privatefolio?style=flat)](https://github.com/privatefolio/privatefolio/commits/main)
[![GitHub commits](https://img.shields.io/github/commit-activity/t/privatefolio/privatefolio)](https://GitHub.com/privatefolio/privatefolio/commit/)
[![GitHub contributors](https://img.shields.io/github/contributors/privatefolio/privatefolio.svg?style=flat)](https://github.com/privatefolio/privatefolio/graphs/contributors)
[![GitHub forks](https://img.shields.io/github/forks/privatefolio/privatefolio?style=flat)](https://github.com/privatefolio/privatefolio/forks)
[![GitHub stars](https://img.shields.io/github/stars/privatefolio/privatefolio?style=flat)](https://github.com/privatefolio/privatefolio/stargazers)

</div>

## Installation

To install the Privatefolio desktop app, you can either download the apps from [privatefolio.xyz/apps](https://privatefolio.xyz/apps) or from [GitHub releases](https://github.com/privatefolio/privatefolio/releases).

Each release contains the binaries for Windows, Linux and Mac.

On Windows, you can run the `Privatefolio-<version>.Setup.exe` executable directly.

On Linux, you can run `sudo dpkg -i privatefolio_<version>_amd64.deb` to install the package.

On Mac, download the dmg for your platform and run the installer.

## What is it?

**Privatefolio is a tool you own**. It allows you to collect, analyze and visualize your financial data.

You can use it in conjunction with LLMs and AI agents to gain a deeper understanding of where you are at, and to plan for the future.

Privatefolio is for: 1) Investment portfolios, 2) Accounting, 3) Tax reporting & planning, 4) Financial intelligence, 5) Privacy, 6) AI workflows, 7) Expense tracking, 8) Budgeting, 9) Cashflow predictions, 10) Retirement planning, 11) FIRE, 12) Volatility simulations, 13) Risk management and much more.

## Features

<div style="display:flex; gap:16px; align-items:flex-start">
<div style="min-width: 250px; height: 450px; overflow: hidden;">
<img src="https://github.com/privatefolio/privatefolio/blob/main/packages/frontend/public/landing/mobile-demo.png?raw=true" alt="Privatefolio screenshot" style="width: 250px; height: 450px; object-fit: cover; object-position: top; mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 90%);">
</div>
<div style="margin-top: 60px;">

- Time travel through trades to surface the strengths and weaknesses of your portfolio
- Inspect and compare your historical net worth with no limitations
- Use advanced TradingView features on your data like indicators, drawing tools, etc.
- Prepare your tax report or feed data into your AI assistant
- Extend the project under the AGPL-3.0 license

</div>
</div>

## License

Privatefolio is licensed under **GNU AGPL-3.0**, a copyleft license.

In summary, this license gives you the following freedoms:

- **Freedom to Use**: You can use the software for any purpose, including commercial use.
- **Freedom to Study and Modify**: You can study how the program works and modify it to suit your needs, including for commercial purposes.
- **Freedom to Distribute Copies**: You can redistribute copies of the original program.
- **Freedom to Distribute Modified Versions**: You are allowed to distribute your modified versions, including for profit. However, if you run a modified version of the software on a server and allow others to interact with it, you must provide the source code of the modified version to those users.

See the [LICENSE](https://github.com/privatefolio/privatefolio/blob/main/LICENSE) file for more details.

## For Developers

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A.svg?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Electron](https://img.shields.io/badge/Electron-2B2E3A?style=flat&logo=electron&logoColor=9FEAF9)](https://electronjs.org/)
[![Lerna](https://img.shields.io/badge/Lerna-blueviolet?style=flat&logo=lerna&logoColor=white)](https://lerna.js.org/)
[![Prettier](https://img.shields.io/badge/Prettier-1A2C34?style=flat&logo=prettier&logoColor=F7BA3E)](https://prettier.io/)

Privatefolio is built with modern technologies like TypeScript, React, Bun (Node.js) and SQLite, making it familiar for open-source developers to contribute to the project.

For detailed setup instructions, architecture blueprints and more, please refer to [docs.privatefolio.app](https://docs.privatefolio.app).

### How to Contribute

1. Fork the repository and clone it locally.
2. Install dependencies using `yarn` and build the project using `yarn build`.
3. Use `yarn dev` to start the development environment.
4. Check [open issues](https://github.com/privatefolio/privatefolio/issues) or `TODO` comments in the codebase to find tasks to work on.
5. Join our [Discord community](https://discord.gg/YHHu9nK8VD) to discuss development and get help.
6. When you are ready, commit your changes and submit a pull request.

For a complete example of adding a new feature, check out [PR #46](https://github.com/privatefolio/privatefolio/pull/46) which demonstrates how to add a new price API extension.

For deployment steps, please refer to [docs.privatefolio.app](https://docs.privatefolio.app).

### Key Technologies

- **Frontend:** React, Vite, Material-UI
- **Backend:** Node.js, Bun runtime, SQLite
- **Desktop apps:** Electron
- **Mobile apps:** Expo (React Native)
- **Deployment:** Docker

Feel free to open issues for bugs or feature requests!
