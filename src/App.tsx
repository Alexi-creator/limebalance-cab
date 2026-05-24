import { checkAuth } from "@api/auth"
import { GuestRoute } from "@components/GuestRoute"
import { Layout } from "@components/Layout"
import { ProtectedRoute } from "@components/ProtectedRoute"
import { PublicLayout } from "@components/PublicLayout"
import { LoadingOverlay } from "@mantine/core"
import { GoogleOAuthProvider } from "@react-oauth/google"
import { appRoutes, publicRoutes } from "@settings/routesConfig"
import { useAuthStore } from "@store/authStore"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Route, Routes } from "react-router-dom"

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

function App() {
  const { setUser, setInitialized, isInitialized } = useAuthStore()
  const { i18n } = useTranslation()

  useEffect(() => {
    checkAuth()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(setInitialized)
  }, [setUser, setInitialized])

  if (!isInitialized) return <LoadingOverlay visible />

  return (
    <GoogleOAuthProvider key={i18n.language} clientId={GOOGLE_CLIENT_ID} locale={i18n.language}>
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
      </Routes>
    </GoogleOAuthProvider>
  )
}

export default App
