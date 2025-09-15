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
        // , dark: "rgb(30, 30, 30)"
        dark: "rgb(14, 13, 15)",
        light: "rgb(249, 250, 252)",
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

const isProduction = process.env.NODE_ENV === "production"

export default defineConfig({
  description: "Documentation for users & developers.",
  head() {
    return (
      <>
        <meta property="og:url" content="https://docs.privatefolio.app" />
        <meta property="og:logo" content="https://docs.privatefolio.app/privatefolio.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `console.log("Environment is ${isProduction ? "production" : "development"}")`,
          }}
        />
        {isProduction && (
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
        )}
      </>
    )
  },
  iconUrl: "/privatefolio.png",
  // llm: {
  //   ignore: ["api/**"],
  // },
  ogImageUrl: `https://vocs.dev/api/og?logo=${encodeURIComponent("https://docs.privatefolio.app/favicon.png")}&title=%title&description=%description`,
  rootDir: ".",
  sidebar: [
    {
      collapsed: false,
      items: [
        { link: "/", text: "Read me" },
        { link: "/vision", text: "Vision" },
        {
          link: "/comparison-table",
          text: "Comparison table",
        },
        { link: "/faq", text: "FAQ" },
        { link: "/changelog", text: "Changelog" },
        //
        {
          link: "https://eu.posthog.com/shared/v1v6JkLETgvBpgebo5pR7eXpqqFUgA",
          text: "Adoption metrics",
        },
        { link: "https://github.com/orgs/privatefolio/projects/1/", text: "Roadmap" },
        // { link: "https://paragraph.com/@privatefolio", text: "Blog" },
      ],
      text: "About",
    },
    {
      collapsed: false,
      items: [
        // { link: "/getting-started", text: "Getting started" },
        // { link: "/portfolio", text: "Portfolio" },
        // { link: "/transactions", text: "Transactions" },
        // { link: "/settings", text: "Settings" },
        // { link: "/backup-and-restore", text: "Backup & Restore" },
        { link: "/installation", text: "Installation" },
        { link: "/self-hosting-with-docker", text: "Self-hosting with Docker" },
        { link: "/self-hosting-with-fly-io", text: "Self-hosting with Fly.io" },
      ],
      text: "Users",
    },
    {
      collapsed: false,
      items: [
        { link: "/getting-started", text: "Getting started" },
        { link: "/ARCHITECTURE", text: "Architecture" },
        { link: "/BACKEND", text: "Backend" },
        { link: "/FRONTEND", text: "Frontend" },
        { link: "/AI", text: "AI setup" },
        { link: "/ELECTRON_SETUP", text: "Desktop apps" },
        { link: "/web-deployment", text: "Web deployment" },
        { link: "/docker-deployment", text: "Docker deployment" },
        // { link: "/self-hosting-with-docker", text: "Self-hosting with Docker" },
        // { link: "/self-hosting-with-fly-io", text: "Self-hosting with Fly.io" },
        { link: "/agents-guidelines", text: "Guidelines for AI agents and LLMs" },
        // { link: "/api", text: "API Reference" },
        // { link: "/software-provenance", text: "Software Provenance" },
      ],
      text: "Developers",
    },
    {
      collapsed: true,
      items: [
        { link: "/create-release", text: "Create release" },
        // { link: "/web-deployment", text: "Web deployment" },
        // { link: "/docker-deployment", text: "Docker deployment" },
        { link: "/TESTING", text: "Testing" },
      ],
      text: "Maintainers",
    },
  ],
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
  theme,
  title: "Privatefolio Docs",
  topNav: [
    // { link: "/api", text: "API Reference" },
    { link: "/blog", text: "Blog" },
    { link: "https://privatefolio.xyz", text: "Website" },
    { link: "https://docs.privatefolio.app/llms-full.txt", text: "llms.txt" },
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
})
