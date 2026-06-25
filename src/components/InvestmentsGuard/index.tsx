import { RouteNames } from "@constants/routeNames"
import { useAuthStore } from "@store/authStore"
import { hasInvestmentsAccess } from "@utils/subscription"
import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"

/**
 * Route guard for the Investments section.
 * Free-plan users have no access, so opening the page directly via URL
 * redirects them to the overview — the sidebar link is disabled separately,
 * this also covers the direct-navigation case.
 */
export function InvestmentsGuard({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)

  if (!hasInvestmentsAccess(user)) return <Navigate to={RouteNames.Home} replace />

  return <>{children}</>
}
