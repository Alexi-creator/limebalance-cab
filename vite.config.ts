import { resolve } from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
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
