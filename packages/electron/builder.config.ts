import type { Configuration } from "electron-builder"

const config: Configuration = {
  appId: "net.danielconstantin.privatefolio",
  asar: false,
  deb: {
    depends: ["libnotify4", "libxtst6", "libnss3"],
    packageName: "privatefolio",
  },
  directories: {
    output: "out",
  },
  extraResources: [
    {
      from: "resources",
      to: "resources",
    },
  ],
  files: [
    "build/**/*",
    "resources/**/*",
    "node_modules/**/*",
    "!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}",
    "!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}",
    "!**/node_modules/*.d.ts",
    "!**/node_modules/.bin",
    "!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}",
    "!.editorconfig",
    "!**/._*",
    "!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}",
    "!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}",
    "!**/{appveyor.yml,.travis.yml,circle.yml}",
    "!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}",
    {
      from: "../frontend/build",
      to: "node_modules/privatefolio-frontend/build",
    },
    {
      from: "../backend/build",
      to: "node_modules/privatefolio-backend/build",
    },
  ],
  linux: {
    category: "Office;Finance",
    icon: "build/icons/png/512x512.png",
    target: [
      {
        arch: ["x64"],
        target: "deb",
      },
      {
        arch: ["x64"],
        target: "snap",
      },
    ],
  },
  mac: {
    category: "public.app-category.utilities",
    icon: "build/images/icon.icns",
    target: [
      {
        arch: ["x64", "arm64"],
        target: "zip",
      },
    ],
  },
  nsis: {
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    installerIcon: "build/images/icon.ico",
    shortcutName: "Privatefolio",
  },
  productName: "Privatefolio",
  publish: {
    owner: "privatefolio",
    provider: "github",
    repo: "privatefolio",
  },
  win: {
    icon: "build/images/icon.ico",
    target: [
      {
        arch: ["x64"],
        target: "nsis",
      },
    ],
  },
}

export default config
