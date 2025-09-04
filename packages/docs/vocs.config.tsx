import * as React from "react"
import { defineConfig, Theme } from "vocs"
import { version } from "./package.json"

const theme: Partial<Theme> = {
  accentColor: "#1e88e5", // blue[600] - matches app's accent color
  variables: {
    borderRadius: {
      "0": "0px",
      "2": "4px",
      "3": "6px",
      "4": "8px",
      "6": "12px",
      "8": "16px",
    },
    color: {
      backgroundDark: {
        light: "rgb(249, 250, 252)",
        // , dark: "rgb(30, 30, 30)"
        dark: "rgb(14, 13, 15)",
      },
    },
    content: {
      width: "900px",
    },
    fontFamily: {
      default: "'IBM Plex Sans', sans-serif",
      mono: "'IBM Plex Mono', monospace",
    },
  },
}

export default defineConfig({
  title: "Privatefolio Docs",
  rootDir: ".",
  description: "Documentation for users & developers.",
  theme,
  head() {
    return (
      <>
      {/* TODO posthog */}
      </>
    )
  },
  iconUrl: {
    light: "/favicon-dark.png",
    dark: "/favicon.png",
  },
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
    { text: "Website", link: "https://privatefolio.xyz" },
    { text: "Blog", link: "https://paragraph.com/@privatefolio" },
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
        // { text: "Home", link: "/home-page" },
        { text: "Readme", link: "/" },
        { text: "Changelog", link: "/changelog" },
        { text: "Contributing", link: "/contributing" },
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
        { text: "Architecture", link: "/ARCHITECTURE" },
        { text: "Backend", link: "/BACKEND" },
        { text: "Frontend", link: "/FRONTEND" },
        { text: "AI setup", link: "/AI" },
        { text: "Testing", link: "/TESTING" },
        { text: "Docker Build", link: "/DOCKER_BUILD" },
        { text: "Docker Deploy", link: "/DOCKER_DEPLOY" },
        { text: "Desktop apps", link: "/ELECTRON_SETUP" },
        { text: "Web deployment", link: "/web-deployment" },
      ],
    },
  ],
})
