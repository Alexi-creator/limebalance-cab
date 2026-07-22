import { GlobalModal } from "@components/GlobalModal"
import { GuestRoute } from "@components/GuestRoute"
import { ProtectedRoute } from "@components/ProtectedRoute"
import { RouteNames } from "@constants/routeNames"
import { useAuthInit } from "@hooks/useAuthInit"
import { Layout } from "@layout/Layout"
import { PublicLayout } from "@layout/PublicLayout"
import { LoadingOverlay } from "@mantine/core"
import { appRoutes, publicRoutes } from "@settings/routesConfig"
import { lazy } from "react"
import { Route, Routes } from "react-router-dom"

// Email confirmation link target — reachable by both guests and authenticated users,
// so it lives outside GuestRoute/ProtectedRoute.
const ConfirmEmailPage = lazy(() =>
  import("@pages/ConfirmEmailPage").then((m) => ({ default: m.ConfirmEmailPage })),
)

// Password-reset link target — like email confirmation, reachable by guests and
// authenticated users alike, so it lives outside GuestRoute/ProtectedRoute.
const ResetPasswordPage = lazy(() =>
  import("@pages/ResetPasswordPage").then((m) => ({ default: m.ResetPasswordPage })),
)

function App() {
  const { isInitialized } = useAuthInit()

  if (!isInitialized) return <LoadingOverlay visible />

  return (
    <>
      <GlobalModal />

      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            {appRoutes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
          </Route>
        </Route>

        <Route element={<GuestRoute />}>
          <Route element={<PublicLayout />}>
            {publicRoutes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
          </Route>
        </Route>

        <Route element={<PublicLayout />}>
          <Route path={RouteNames.ConfirmEmail} element={<ConfirmEmailPage />} />
          <Route path={RouteNames.ResetPassword} element={<ResetPasswordPage />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
