import * as React from "react"
import { defineConfig, Theme } from "vocs"
import { version } from "./package.json"

const theme: Partial<Theme> = {
  accentColor: "#1e88e5", // blue[600] - matches app's accent color
  // colorScheme: "system",
  variables: {
    // borderRadius: {
    //   "0": "0px",
    //   "2": "2px",
    //   "4": "4px",
    //   "8": "8px", // matches app's borderRadius
    // },
    // color: {
    //   // Base colors
    //   white: { light: "#ffffff", dark: "#ffffff" },
    //   black: { light: "#000000", dark: "#000000" },

    //   // Background colors - matching app theme
    //   background: { light: "rgb(242, 243, 245)", dark: "rgb(30, 30, 30)" }, // bgColor and dark background
    //   background2: { light: "rgb(248, 249, 250)", dark: "rgb(35, 35, 35)" },
    //   background3: { light: "rgb(253, 253, 253)", dark: "rgb(40, 40, 40)" }, // paper background
    //   background4: { light: "rgb(255, 255, 255)", dark: "rgb(45, 45, 45)" },
    //   background5: { light: "rgb(250, 250, 250)", dark: "rgb(50, 50, 50)" },

    //   // Accent colors - using blue theme
    //   backgroundAccent: { light: "#1e88e5", dark: "#42a5f5" }, // blue[600]/blue[400]
    //   backgroundAccentHover: { light: "#1976d2", dark: "#64b5f6" }, // blue[700]/blue[300]
    //   backgroundAccentText: { light: "#ffffff", dark: "#ffffff" },

    //   // Tint backgrounds
    //   backgroundBlueTint: { light: "rgba(30, 136, 229, 0.08)", dark: "rgba(66, 165, 245, 0.12)" },
    //   backgroundDark: { light: "rgb(30, 30, 30)", dark: "rgb(20, 20, 20)" },
    //   backgroundGreenTint: { light: "rgba(76, 175, 80, 0.08)", dark: "rgba(129, 199, 132, 0.12)" },
    //   backgroundGreenTint2: { light: "rgba(76, 175, 80, 0.04)", dark: "rgba(129, 199, 132, 0.06)" },
    //   backgroundIrisTint: { light: "rgba(103, 58, 183, 0.08)", dark: "rgba(149, 117, 205, 0.12)" },
    //   backgroundRedTint: { light: "rgba(244, 67, 54, 0.08)", dark: "rgba(239, 154, 154, 0.12)" },
    //   backgroundRedTint2: { light: "rgba(244, 67, 54, 0.04)", dark: "rgba(239, 154, 154, 0.06)" },
    //   backgroundYellowTint: { light: "rgba(255, 193, 7, 0.08)", dark: "rgba(255, 241, 118, 0.12)" },

    //   // Border colors
    //   border: { light: "rgba(0, 0, 0, 0.12)", dark: "rgba(255, 255, 255, 0.12)" }, // divider colors
    //   border2: { light: "rgba(0, 0, 0, 0.08)", dark: "rgba(255, 255, 255, 0.08)" },
    //   borderAccent: { light: "#1e88e5", dark: "#42a5f5" },
    //   borderBlue: { light: "#1976d2", dark: "#64b5f6" },
    //   borderGreen: { light: "#388e3c", dark: "#81c784" },
    //   borderIris: { light: "#673ab7", dark: "#9575cd" },
    //   borderRed: { light: "#d32f2f", dark: "#ef9a9a" },
    //   borderYellow: { light: "#f57f17", dark: "#fff176" },

    //   // Text colors - matching app theme
    //   heading: { light: "rgb(30, 30, 30)", dark: "rgb(240, 240, 240)" }, // primary text
    //   text: { light: "rgb(30, 30, 30)", dark: "rgb(240, 240, 240)" }, // primary text
    //   text2: { light: "rgba(0, 0, 0, 0.6)", dark: "rgba(255, 255, 255, 0.55)" }, // secondary text
    //   text3: { light: "rgb(120, 120, 120)", dark: "rgb(160, 160, 160)" }, // secondary main
    //   text4: { light: "rgba(0, 0, 0, 0.38)", dark: "rgba(255, 255, 255, 0.38)" },

    //   // Accent text colors
    //   textAccent: { light: "#1e88e5", dark: "#42a5f5" },
    //   textAccentHover: { light: "#1976d2", dark: "#64b5f6" },
    //   textBlue: { light: "#1976d2", dark: "#64b5f6" },
    //   textBlueHover: { light: "#1565c0", dark: "#90caf9" },
    //   textGreen: { light: "#388e3c", dark: "#81c784" },
    //   textGreenHover: { light: "#2e7d32", dark: "#a5d6a7" },
    //   textIris: { light: "#673ab7", dark: "#9575cd" },
    //   textIrisHover: { light: "#5e35b1", dark: "#b39ddb" },
    //   textRed: { light: "#d32f2f", dark: "#ef9a9a" },
    //   textRedHover: { light: "#c62828", dark: "#ffcdd2" },
    //   textYellow: { light: "#f57f17", dark: "#fff176" },
    //   textYellowHover: { light: "#ef6c00", dark: "#ffeb3b" },

    //   // Component-specific colors
    //   shadow: { light: "rgba(0, 0, 0, 0.1)", dark: "rgba(0, 0, 0, 0.3)" },
    //   blockquoteBorder: { light: "rgba(0, 0, 0, 0.12)", dark: "rgba(255, 255, 255, 0.12)" },
    //   blockquoteText: { light: "rgba(0, 0, 0, 0.6)", dark: "rgba(255, 255, 255, 0.55)" },
    //   codeBlockBackground: { light: "rgb(248, 249, 250)", dark: "rgb(35, 35, 35)" },
    //   codeCharacterHighlightBackground: { light: "rgba(30, 136, 229, 0.1)", dark: "rgba(66, 165, 245, 0.15)" },
    //   codeHighlightBackground: { light: "rgba(30, 136, 229, 0.08)", dark: "rgba(66, 165, 245, 0.12)" },
    //   codeHighlightBorder: { light: "#1e88e5", dark: "#42a5f5" },
    //   codeInlineBackground: { light: "rgba(0, 0, 0, 0.04)", dark: "rgba(255, 255, 255, 0.08)" },
    //   codeInlineBorder: { light: "rgba(0, 0, 0, 0.08)", dark: "rgba(255, 255, 255, 0.12)" },
    //   codeInlineText: { light: "rgb(30, 30, 30)", dark: "rgb(240, 240, 240)" },
    //   codeTitleBackground: { light: "rgb(245, 245, 245)", dark: "rgb(45, 45, 45)" },

    //   // Alert colors
    //   dangerBackground: { light: "rgba(244, 67, 54, 0.08)", dark: "rgba(239, 154, 154, 0.12)" },
    //   dangerBorder: { light: "#d32f2f", dark: "#ef9a9a" },
    //   dangerText: { light: "#d32f2f", dark: "#ef9a9a" },
    //   dangerTextHover: { light: "#c62828", dark: "#ffcdd2" },

    //   infoBackground: { light: "rgba(30, 136, 229, 0.08)", dark: "rgba(66, 165, 245, 0.12)" },
    //   infoBorder: { light: "#1e88e5", dark: "#42a5f5" },
    //   infoText: { light: "#1976d2", dark: "#64b5f6" },
    //   infoTextHover: { light: "#1565c0", dark: "#90caf9" },

    //   successBackground: { light: "rgba(76, 175, 80, 0.08)", dark: "rgba(129, 199, 132, 0.12)" },
    //   successBorder: { light: "#388e3c", dark: "#81c784" },
    //   successText: { light: "#388e3c", dark: "#81c784" },
    //   successTextHover: { light: "#2e7d32", dark: "#a5d6a7" },

    //   warningBackground: { light: "rgba(255, 193, 7, 0.08)", dark: "rgba(255, 241, 118, 0.12)" },
    //   warningBorder: { light: "#f57f17", dark: "#fff176" },
    //   warningText: { light: "#f57f17", dark: "#fff176" },
    //   warningTextHover: { light: "#ef6c00", dark: "#ffeb3b" },

    //   // Utility colors
    //   hr: { light: "rgba(0, 0, 0, 0.12)", dark: "rgba(255, 255, 255, 0.12)" },
    //   lineNumber: { light: "rgba(0, 0, 0, 0.38)", dark: "rgba(255, 255, 255, 0.38)" },
    //   link: { light: "#1e88e5", dark: "#42a5f5" },
    //   linkHover: { light: "#1976d2", dark: "#64b5f6" },

    //   // Note and tip colors
    //   noteBackground: { light: "rgba(103, 58, 183, 0.08)", dark: "rgba(149, 117, 205, 0.12)" },
    //   noteBorder: { light: "#673ab7", dark: "#9575cd" },
    //   noteText: { light: "#673ab7", dark: "#9575cd" },

    //   tipBackground: { light: "rgba(76, 175, 80, 0.08)", dark: "rgba(129, 199, 132, 0.12)" },
    //   tipBorder: { light: "#388e3c", dark: "#81c784" },
    //   tipText: { light: "#388e3c", dark: "#81c784" },
    //   tipTextHover: { light: "#2e7d32", dark: "#a5d6a7" },

    //   // Table colors
    //   tableBorder: { light: "rgba(0, 0, 0, 0.12)", dark: "rgba(255, 255, 255, 0.12)" },
    //   tableHeaderBackground: { light: "rgb(248, 249, 250)", dark: "rgb(45, 45, 45)" },
    //   tableHeaderText: { light: "rgb(30, 30, 30)", dark: "rgb(240, 240, 240)" },
    // },

    content: {
      // horizontalPadding: "24px", // matches app's card padding
      // verticalPadding: "20px",
      width: "900px",
    },
    fontFamily: {
      default: "'IBM Plex Sans', sans-serif",
      mono: "'IBM Plex Mono', monospace",
    },
    // fontSize: {
    //   root: "16px",
    //   "9": "0.5625rem",
    //   "11": "0.6875rem",
    //   "12": "0.75rem",
    //   "13": "0.8125rem",
    //   "14": "0.875rem", // matches app's chip fontSize
    //   "15": "0.9375rem",
    //   "16": "1rem",
    //   "18": "1.125rem", // matches app's h6 fontSize
    //   "20": "1.25rem",
    //   "24": "1.5rem",
    //   "32": "2rem",
    //   h1: "2rem",
    //   h2: "1.75rem",
    //   h3: "1.5rem",
    //   h4: "1.25rem", // matches app's h5 lineHeight
    //   h5: "1.125rem",
    //   h6: "1rem",
    //   code: "0.875rem",
    //   codeBlock: "0.875rem",
    //   lineNumber: "0.75rem",
    //   subtitle: "1rem",
    //   th: "0.875rem",
    //   td: "0.875rem",
    // },
    // fontWeight: {
    //   regular: "400",
    //   medium: "500",
    //   semibold: "600",
    // },
    // lineHeight: {
    //   code: "1.4",
    //   heading: "1.25", // matches app's h5 and body1 lineHeight
    //   listItem: "1.5",
    //   outlineItem: "1.4",
    //   paragraph: "1.5", // matches app's caption lineHeight
    // },
    // space: {
    //   "0": "0px",
    //   "1": "4px",
    //   "2": "8px",
    //   "3": "12px",
    //   "4": "16px", // matches app's common padding
    //   "6": "24px", // matches app's card padding
    //   "8": "32px",
    //   "12": "48px",
    //   "14": "56px",
    //   "16": "64px",
    //   "18": "72px",
    //   "20": "80px",
    //   "22": "88px",
    //   "24": "96px",
    //   "28": "112px",
    //   "32": "128px",
    //   "40": "160px",
    //   "44": "176px",
    //   "48": "192px",
    //   "56": "224px",
    //   "64": "256px",
    //   "72": "288px",
    //   "80": "320px",
    // }
  },
}

export default defineConfig({
  title: "Privatefolio",
  rootDir: ".",
  description: "Documentation for users & developers.",
  theme,
  head: (
    <>
      <meta
        property="og:description"
        content="Free, open-source cryptocurrency portfolio manager built as a desktop app with React frontend and Node.js/Bun backend."
      />
      <link rel="icon" type="image/png" href="/favicon.png" />
    </>
  ),
  iconUrl: {
    light: "/favicon.png",
    dark: "/favicon-dark.png",
  },
  // logoUrl: {
  //   light: "/favicon-dark.png",
  //   dark: "/favicon.png",
  // },
  socials: [
    {
      icon: "discord",
      link: "https://discord.gg/YHHu9nK8VD",
    },
    {
      icon: "github",
      link: "https://github.com/privatefolio/privatefolio",
    },
    {
      icon: "x",
      link: "https://twitter.com/PrivatefolioApp",
    },
  ],
  topNav: [ 
    { text: 'Website', link: 'https://privatefolio.xyz' }, 
    { text: 'Blog', link: 'https://paragraph.com/@privatefolio' }, 
    // { 
    //   text: version, 
    //   element: <p>v{version}</p>,
    //   // items: [ 
    //   //   { 
    //   //     text: 'Changelog', 
    //   //     link: 'https://github.com/privatefolio/privatefolio/blob/main/CHANGELOG.md', 
    //   //   }, 
    //   //   { 
    //   //     text: 'Contributing', 
    //   //     link: 'https://github.com/privatefolio/privatefolio/blob/main/CONTRIBUTING.md', 
    //   //   }, 
    //   // ], 
    // }, 
  ], 
  sidebar: [
    {
      text: "About",
      collapsed: false,
      items: [
        { text: "Readme", link: "/" },
        // { text: "Vision", link: "/vision" },
        // { text: "Roadmap", link: "/roadmap" },
        // {
        //   text: "Comparisons",
        //   link: "/comparisons",
        // },
      ],
    },
    // {
    //   text: "User guide",
    //   collapsed: false,
    //   items: [
    //     { text: "Getting started", link: "/getting-started" },
    //     { text: "Portfolio", link: "/portfolio" },
    //     { text: "Transactions", link: "/transactions" },
    //     { text: "Settings", link: "/settings" },
    //     { text: "Backup & Restore", link: "/backup-and-restore" },
    //     { text: "FAQ", link: "/faq" },
    //   ],
    // },
    {
      collapsed: false,
      text: "Developer docs",
      items: [
        { text: "Contributing", link: "/contributing" },
        { text: "Architecture", link: "/ARCHITECTURE" },
        { text: "Backend", link: "/BACKEND" },
        { text: "Frontend", link: "/FRONTEND" },
        { text: "AI setup", link: "/AI" },
        { text: "Testing", link: "/TESTING" },
        { text: "Docker Build", link: "/DOCKER_BUILD" },
        { text: "Docker Deploy", link: "/DOCKER_DEPLOY" },
        { text: "Desktop apps", link: "/ELECTRON_SETUP" },
      ],
    },
  ],
})
