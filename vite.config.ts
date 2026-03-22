import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return
          }

          if (id.includes("@excalidraw/excalidraw")) {
            return "excalidraw-core"
          }

          if (id.includes("@excalidraw/mermaid-to-excalidraw")) {
            return "mermaid-import"
          }

          if (id.includes("react") || id.includes("react-dom")) {
            return "react-vendor"
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
