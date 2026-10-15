import path from "path";
import { defineConfig } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    cloudflare(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/"),
    },
  },
  server: {
    watch: {
      /**
       * `outputs/` adalah folder kerja — tangkapan layar, skrip sekali pakai,
       * dan profil browser sisa verifikasi — bukan bagian aplikasi. Memantau
       * folder ini pernah mematikan dev server seketika: satu entri profil
       * Edge yang rusak membuat chokidar melempar `UNKNOWN: lstat` dan proses
       * Vite keluar sebelum sempat melayani permintaan.
       */
      ignored: ["**/outputs/**"],
    },
  },
});
