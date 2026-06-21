import { initGA, trackPageView } from "@utils/analytics"
import { useEffect } from "react"
import { useLocation } from "react-router-dom"

/** Initializes GA4 once and reports a page_view on every route change. */
export function usePageTracking(): void {
  const location = useLocation()

  useEffect(() => {
    initGA()
  }, [])

  useEffect(() => {
    trackPageView(location.pathname + location.search)
  }, [location.pathname, location.search])
}
