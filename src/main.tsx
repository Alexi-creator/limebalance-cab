import "./i18n"
import { queryClient } from "@api/queryClient"
import { localStorageColorSchemeManager, MantineProvider } from "@mantine/core"
import { Notifications } from "@mantine/notifications"
import { QueryClientProvider } from "@tanstack/react-query"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
// Layered builds wrap all Mantine styles in `@layer mantine`. Unlayered styles (our CSS modules,
// index.css) always beat layered ones regardless of bundle order — this fixes prod-only overrides
// where Mantine's CSS chunk loaded after ours and won on equal specificity.
import "@mantine/core/styles.layer.css"
import "@mantine/dates/styles.layer.css"
import "@mantine/notifications/styles.layer.css"
import "mantine-datatable/styles.layer.css"
import "./index.css"
import "driver.js/dist/driver.css"
import "./styles/driver-theme.css"
import App from "./App.tsx"
import { theme } from "./theme.ts"

const colorSchemeManager = localStorageColorSchemeManager({ key: "mantine-color-scheme" })

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <MantineProvider
          theme={theme}
          colorSchemeManager={colorSchemeManager}
          defaultColorScheme="dark"
        >
          <Notifications position="top-right" />
          <App />
        </MantineProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
