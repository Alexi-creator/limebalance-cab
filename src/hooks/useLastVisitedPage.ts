import { RouteNames } from "@constants/routeNames"
import { appRoutes } from "@settings/routesConfig"
import { useEffect, useRef } from "react"
import { matchPath, useLocation, useNavigate } from "react-router-dom"

const STORAGE_KEY = "lastVisitedPage"

function isKnownAppRoute(pathname: string): boolean {
  return appRoutes.some((r) => matchPath({ path: r.path, end: true }, pathname) !== null)
}

/**
 * Landing on "/" (the app's default entry point — post-login, a bookmark, a fresh tab) jumps
 * straight to whichever top-level page the user was last on, instead of always showing the
 * overview. Layout mounts once per authenticated session (see usePageTracking), so a later
 * click on the Home nav link lands on the overview normally instead of bouncing back.
 *
 * Falls back to the overview when nothing's stored, the stored path no longer matches a route
 * (e.g. renamed/removed since it was saved), or the route redirects itself right back to "/"
 * (a plan guard like InvestmentsGuard) — the initial pathname is captured during Layout's first
 * render, before any such guard's own effect can reroute it, so this never fights that redirect.
 */
export function useLastVisitedPage(): void {
  const location = useLocation()
  const navigate = useNavigate()
  const initialPathname = useRef(location.pathname).current

  // Deliberately empty deps: this must run exactly once, at mount. `navigate` from
  // useNavigate() is *not* referentially stable here (this app uses a plain <BrowserRouter>,
  // not a data router — its useNavigate recreates the function on every route change), so
  // including it would re-run this on every navigation and fight the save effect below.
  // biome-ignore lint/correctness/useExhaustiveDependencies: run once at mount only, see above
  useEffect(() => {
    if (initialPathname !== RouteNames.Home) return
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && stored !== RouteNames.Home && isKnownAppRoute(stored)) {
      navigate(stored, { replace: true })
    }
  }, [])

  // Home included: without this, a reload while sitting on the overview would find the *previous*
  // page still in storage and bounce back to it instead of staying put.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, location.pathname)
  }, [location.pathname])
}
