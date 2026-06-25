import { getEnv } from "@constants/env"

const GA_MEASUREMENT_ID = getEnv("VITE_GA_MEASUREMENT_ID")

type GtagArgs =
  | ["js", Date]
  | ["config", string, Record<string, unknown>?]
  | ["event", string, Record<string, unknown>?]

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: GtagArgs) => void
  }
}

let initialized = false

/**
 * Loads gtag.js and configures GA4 once.
 * No-op when VITE_GA_MEASUREMENT_ID is empty (dev / preview without a key).
 * Page views are sent manually via trackPageView on route change.
 */
export function initGA(): void {
  if (initialized || !GA_MEASUREMENT_ID) return
  initialized = true

  const script = document.createElement("script")
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  // gtag.js only processes a real `arguments` object as a command.
  // Pushing a plain array leaves config/event unprocessed and no hits are sent.
  window.gtag = function gtag() {
    // biome-ignore lint: gtag.js requires the arguments object, not an array
    window.dataLayer?.push(arguments)
  }

  window.gtag("js", new Date())
  window.gtag("config", GA_MEASUREMENT_ID, { send_page_view: false })
}

/** Sends a page_view event for SPA navigations. */
export function trackPageView(path: string): void {
  if (!GA_MEASUREMENT_ID || !window.gtag) return
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.origin + path,
    page_title: document.title,
  })
}
