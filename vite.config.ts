import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    react(),
    dts({
      entryRoot: "src",
      insertTypesEntry: true,
      exclude: ["**/node_modules/**", "dist/**"],
    }),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: false,
    lib: {
      entry: "./src/index.ts",
      formats: ["es"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      external: (id) => {
        if (id === "react" || id.startsWith("react/")) return true;
        if (id === "react-dom" || id.startsWith("react-dom/")) return true;
        if (id === "react-rnd") return true;
        if (id === "ts-debounce") return true;
        if (id.startsWith("pdfjs-dist")) return true;
        return false;
      },
    },
  },
});
