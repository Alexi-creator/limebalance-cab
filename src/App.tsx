import { Layout } from "@components/Layout"
import { PublicLayout } from "@components/PublicLayout"
import { Route, Routes } from "react-router-dom"
import { appRoutes, publicRoutes } from "./routes"

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
