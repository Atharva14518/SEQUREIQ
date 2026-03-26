import posthog from "posthog-js"

export function initPostHog() {
  const key = import.meta.env.VITE_POSTHOG_KEY
  const host = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com"

  if (!key) {
    console.warn("[PostHog] Missing VITE_POSTHOG_KEY")
    return
  }

  posthog.init(key, {
    api_host: host,
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false,
    debug: import.meta.env.DEV,
    loaded: (ph) => {
      console.log("[PostHog] loaded", {
        distinctId: ph.get_distinct_id(),
        host,
      })
    },
  })
}

export default posthog
