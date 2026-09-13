import { resolve } from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return
          if (id.includes("@mantine") || id.includes("mantine-datatable")) return "mantine"
          if (id.includes("@tabler/icons-react")) return "icons"
          if (/[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id))
            return "react"
          if (id.includes("react-hook-form") || id.includes("@hookform") || id.includes("zod"))
            return "forms"
          if (id.includes("i18next")) return "i18n"
          if (id.includes("@tanstack")) return "query"
          if (id.includes("date-fns") || id.includes("dayjs")) return "dates"
          return "vendor"
        },
      },
    },
  },
  server: {
    allowedHosts: true,
    proxy: {
      "/api": {
        // Inside the container (docker compose) the host backend is not reachable via localhost —
        // override the target through env to host.docker.internal.
        target: process.env.VITE_DEV_PROXY_TARGET ?? "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
})
