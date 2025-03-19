const { execSync } = require("child_process")

const deps = execSync("npm ls --omit=dev --parseable --depth=10")
  .toString()
  .trim()
  .split("\n")
  .filter((x) => x.includes("packages/electron/node_modules/"))
  .map((depPath) => depPath.split("packages/electron/node_modules/").pop())

console.log("Dependencies to include:", deps)
const depsManuallyCopied = ["privatefolio-frontend", "privatefolio-backend"]
console.log("Dependencies to manually copied:", depsManuallyCopied)

/**
 * @type {import('@electron-forge/shared-types').ForgeConfig}
 */
module.exports = {
  makers: [
    {
      /** @type {import('@electron-forge/maker-squirrel').MakerSquirrelConfig} */
      config: {
        iconUrl: "https://danielconstantin.net/privatefolio.ico",
        setupIcon: "./build/images/icon.ico",
      },

      name: "@electron-forge/maker-squirrel",
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      config: {
        options: {
          bin: "Privatefolio",
          categories: ["Office", "Finance"],
          icon: "./build/icons/png/1024x1024.png",
          name: "privatefolio",
          productName: "Privatefolio",
        },
      },
      name: "@electron-forge/maker-deb",
    },
    // {
    //   config: {
    //     options: {
    //       categories: ["Office", "Finance"],
    //       icon: "./build/icons/png/1024x1024.png",
    //       name: "privatefolio",
    //       productName: "Privatefolio",
    //     },
    //   },
    //   name: "@electron-forge/maker-rpm",
    // },
  ],
  packagerConfig: {
    appBundleId: "net.danielconstantin.privatefolio",
    appCategoryType: "public.app-category.utilities",
    // TODO0
    // asar: {
    //   unpack: "**/bun-sh/**",
    // },
    executableName: "Privatefolio",
    extraResources: [
      {
        from: "./resources/**",
        to: "./resources/**",
      },
    ],
    icon: "./build/images/icon", // Path to the base name of your icon files (without extension)
    ignore: [
      "^\\/src$",
      `^\\/node_modules\\/(?!(${depsManuallyCopied.join("|")}|${deps.join("|")})).*`,
      "^\\/[.].+",
      //
    ],
    name: "Privatefolio",
    win32metadata: {
      CompanyName: "hello@danielconstantin.net",
      FileDescription: "Privatefolio",
      InternalName: "Privatefolio",
      OriginalFilename: "Privatefolio.exe",
      ProductName: "Privatefolio",
    },
  },
  rebuildConfig: {},
}
