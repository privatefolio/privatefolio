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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
              
              posthog.init('phc_6vlr4ItLrmAGdVewHWNFEsL4P5mPuG9Z7ewgwrsOGef',{api_host: "https://telemetry.privatefolio.app", ui_host: "https://eu.posthog.com",person_profiles: "always", defaults:'2025-05-24'});
              posthog.register({ appVersion: "${version}", platform: "docs" })
              console.log("Telemetry enabled")
            `,
          }}
        />
      </>
    )
  },
  iconUrl: "/privatefolio.png",
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
    { text: "llms.txt", link: "https://docs.privatefolio.app/llms-full.txt" },
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
      text: "Developers",
      items: [
        { text: "Getting started", link: "/getting-started" },
        { text: "Architecture", link: "/ARCHITECTURE" },
        { text: "Backend", link: "/BACKEND" },
        { text: "Frontend", link: "/FRONTEND" },
        { text: "AI setup", link: "/AI" },
        { text: "Testing", link: "/TESTING" },
        { text: "Docker Build", link: "/DOCKER_BUILD" },
        { text: "Docker Deploy", link: "/DOCKER_DEPLOY" },
        { text: "Desktop apps", link: "/ELECTRON_SETUP" },
        { text: "Web deployment", link: "/web-deployment" },
        { text: "Guidelines for AI agents and LLMs", link: "/agents-guidelines" },
      ],
    },
  ],
})
