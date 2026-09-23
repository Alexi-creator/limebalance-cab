import "@/shared/i18n"
import { localStorageColorSchemeManager, MantineProvider } from "@mantine/core"
import { Notifications } from "@mantine/notifications"
import { QueryClientProvider } from "@tanstack/react-query"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { useAuthStore } from "@/modules/auth/hooks/useAuthStore"
import { queryClient } from "@/shared/api/queryClient"
import { onSessionExpired } from "@/shared/api/session"
import { setPersistScope } from "@/shared/lib/persistedParams"
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

// A 401 from any request signs the user out. Registered here so that shared/api never has to
// import the auth module (see shared/api/session.ts).
onSessionExpired(() => useAuthStore.getState().setUser(null))

// Tables remember their filters per user (see shared/lib/persistedParams.ts) — the scope follows
// whoever is signed in, from the same store, for the same layering reason.
setPersistScope(useAuthStore.getState().user?.id ?? null)
useAuthStore.subscribe((s) => setPersistScope(s.user?.id ?? null))

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
