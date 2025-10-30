import { defineConfig } from "vite";
import path from "path";

// Serverless build configuration - creates a version without app.listen()
export default defineConfig({
  build: {
    outDir: "dist/serverless",
    target: "node22",
    ssr: true,
    rollupOptions: {
      input: path.resolve(__dirname, "server/serverless.ts"),
      external: [
        // Only Node.js built-ins should be external
        "fs",
        "path",
        "url",
        "http",
        "https",
        "os",
        "crypto",
        "stream",
        "util",
        "events",
        "buffer",
        "querystring",
        "child_process",
        // Bundle all npm packages for serverless
      ],
      output: {
        format: "cjs",
        entryFileNames: "serverless.cjs",
      },
    },
    minify: false, // Keep readable for debugging
    sourcemap: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
