import { resolve } from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
  },
  resolve: {
    alias: {
      "@api": resolve(__dirname, "src/api"),
      "@appTypes": resolve(__dirname, "src/types"),
      "@components": resolve(__dirname, "src/components"),
      "@constants": resolve(__dirname, "src/constants"),
      "@pages": resolve(__dirname, "src/pages"),
      "@settings": resolve(__dirname, "src/settings"),
      "@store": resolve(__dirname, "src/store"),
      "@utils": resolve(__dirname, "src/utils"),
    },
  },
})
