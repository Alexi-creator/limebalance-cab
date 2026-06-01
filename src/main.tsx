import "./i18n"
import { localStorageColorSchemeManager, MantineProvider } from "@mantine/core"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import "@mantine/core/styles.css"
import "@mantine/dates/styles.css"
import "mantine-datatable/styles.css"
import "./index.css"
import App from "./App.tsx"
import { theme } from "./theme.ts"

const queryClient = new QueryClient()
const colorSchemeManager = localStorageColorSchemeManager({ key: "mantine-color-scheme" })

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <MantineProvider theme={theme} colorSchemeManager={colorSchemeManager}>
          <App />
        </MantineProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
