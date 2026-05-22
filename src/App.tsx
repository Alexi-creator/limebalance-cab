import { Layout } from "@components/Layout"
import { PublicLayout } from "@components/PublicLayout"
import { appRoutes, publicRoutes } from "@settings/routesConfig"
import { Route, Routes } from "react-router-dom"

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {appRoutes.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
      </Route>

      <Route element={<PublicLayout />}>
        {publicRoutes.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
      </Route>
    </Routes>
  )
}

export default App
