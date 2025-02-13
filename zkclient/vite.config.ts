import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: {},
    "process.env": {},
  },
  resolve: {
    alias: {
      buffer: path.resolve(__dirname, "node_modules/buffer/"),
      util: path.resolve(__dirname, "node_modules/util/"),
    },
  },
  optimizeDeps: {
    include: ["buffer", "util"],
  },
});
