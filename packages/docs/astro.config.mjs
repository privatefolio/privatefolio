import react from "@astrojs/react"
import starlight from "@astrojs/starlight"
import { defineConfig } from "astro/config"
import starlightLlmsTxt from "starlight-llms-txt"
import starlightThemeObsidian from "starlight-theme-obsidian"

import { version } from "./package.json"

const isProduction = process.env.NODE_ENV === "production"

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    starlight({
      customCss: ["./src/styles/global.css"],
      description: "Documentation for users & developers.",
      editLink: {
        baseUrl: "https://github.com/privatefolio/privatefolio/edit/main/packages/docs/",
      },
      expressiveCode: {
        themes: ["catppuccin-macchiato", "catppuccin-latte"],
      },
      favicon: "/favicon.png",
      head: [
        {
          attrs: {
            content: "https://docs.privatefolio.app",
            property: "og:url",
          },
          tag: "meta",
        },
        {
          attrs: {
            content: "https://docs.privatefolio.app/privatefolio.png",
            property: "og:logo",
          },
          tag: "meta",
        },
        {
          attrs: {
            type: "text/javascript",
          },
          content: `console.log("Environment is ${isProduction ? "production" : "development"}")`,
          tag: "script",
        },
        ...(isProduction
          ? [
              {
                attrs: {
                  type: "text/javascript",
                },
                content: `
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

posthog.init('phc_6vlr4ItLrmAGdVewHWNFEsL4P5mPuG9Z7ewgwrsOGef',{api_host: "https://telemetry.privatefolio.app", ui_host: "https://eu.posthog.com",person_profiles: "always", defaults:'2025-05-24'});
posthog.register({ appVersion: "${version}", platform: "docs" })
console.log("Telemetry enabled")
          `,
                tag: "script",
              },
            ]
          : []),
      ],
      plugins: [
        starlightLlmsTxt({
          exclude: ["**/api/**"],
          projectName: "Privatefolio",
          rawContent: true,
        }),
        starlightThemeObsidian({
          graph: false,
        }),
      ],
      // logo: {
      //   dark: "/src/assets/favicon.png",
      //   light: "/src/assets/favicon.png",
      // },
      sidebar: [
        {
          items: [
            "index",
            "vision",
            "comparison-table",
            "faq",
            "changelog",
            //
            {
              attrs: { target: "_blank" },
              label: "Adoption metrics ↗︎",
              link: "https://eu.posthog.com/shared/v1v6JkLETgvBpgebo5pR7eXpqqFUgA",
            },
            {
              attrs: { target: "_blank" },
              label: "Roadmap ↗︎",
              link: "https://github.com/orgs/privatefolio/projects/1/",
            },
            // { link: "https://paragraph.com/@privatefolio", text: "Blog" },
          ],
          label: "About",
        },
        {
          autogenerate: { directory: "users" },
          label: "Users",
        },
        {
          items: [
            "developers/getting-started",
            "developers/architecture",
            "developers/backend",
            "developers/frontend",
            "developers/ai-setup",
            "developers/electron-setup",
            "developers/web-deployment",
            "developers/docker-deployment",
            "developers/agents-guidelines",
            {
              attrs: { target: "_blank" },
              label: "llms.txt ↗︎",
              link: "/llms.txt",
            },
            {
              attrs: { target: "_blank" },
              label: "llms-small.txt ↗︎",
              link: "/llms-small.txt",
            },
            {
              attrs: { target: "_blank" },
              label: "llms-full.txt ↗︎",
              link: "/llms-full.txt",
            },
          ],
          label: "Developers",
        },
        {
          autogenerate: { directory: "maintainers" },
          collapsed: true,
          label: "Maintainers",
        },
        {
          collapsed: true,
          items: [
            "api",
            { label: "@privatefolio/commons", link: "/api/privatefolio/commons" },
            { label: "@privatefolio/commons-node", link: "/api/privatefolio/commons-node" },
            "api/privatefolio-backend",
          ],
          label: "API Reference",
        },
      ],
      social: [
        { href: "https://discord.gg/YHHu9nK8VD", icon: "discord", label: "Discord" },
        {
          href: "https://github.com/privatefolio/privatefolio",
          icon: "github",
          label: "GitHub",
        },
        { href: "https://twitter.com/PrivatefolioApp", icon: "twitter", label: "Twitter" },
      ],
      title: "Privatefolio Docs",
    }),
  ],
  site: "https://docs.privatefolio.app",
})
