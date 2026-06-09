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
        // В контейнере (docker compose) хостовый бэкенд недоступен по localhost —
        // переопределяем target через env на host.docker.internal.
        target: process.env.VITE_DEV_PROXY_TARGET ?? "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@api": resolve(__dirname, "src/api"),
      "@i18n": resolve(__dirname, "src/i18n"),
      "@hooks": resolve(__dirname, "src/hooks"),
      "@layout": resolve(__dirname, "src/layout"),
      "@appTypes": resolve(__dirname, "src/types"),
      "@components": resolve(__dirname, "src/components"),
      "@constants": resolve(__dirname, "src/constants"),
      "@pages": resolve(__dirname, "src/pages"),
      "@settings": resolve(__dirname, "src/settings"),
      "@store": resolve(__dirname, "src/store"),
      "@ui": resolve(__dirname, "src/ui"),
      "@utils": resolve(__dirname, "src/utils"),
    },
  },
})
