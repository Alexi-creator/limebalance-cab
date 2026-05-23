import { checkAuth } from "@api/auth"
import { GuestRoute } from "@components/GuestRoute"
import { Layout } from "@components/Layout"
import { ProtectedRoute } from "@components/ProtectedRoute"
import { PublicLayout } from "@components/PublicLayout"
import { LoadingOverlay } from "@mantine/core"
import { appRoutes, publicRoutes } from "@settings/routesConfig"
import { useAuthStore } from "@store/authStore"
import { useEffect } from "react"
import { Route, Routes } from "react-router-dom"

function App() {
  const { setUser, setInitialized, isInitialized } = useAuthStore()

  useEffect(() => {
    checkAuth()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(setInitialized)
  }, [setUser, setInitialized])

  if (!isInitialized) return <LoadingOverlay visible />

  return (
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
  )
}

export default App
