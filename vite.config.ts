import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(async () => {
  const plugins = [react()];

  const isReplit = process.env.REPL_ID !== undefined && process.env.NODE_ENV !== "production";

  if (isReplit) {
    const runtimeErrorOverlay = (await import("@replit/vite-plugin-runtime-error-modal")).default;
    const { cartographer } = await import("@replit/vite-plugin-cartographer");

    plugins.push(runtimeErrorOverlay());
    plugins.push(cartographer());
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: "client/index.html",
          admin: "client/admin.html",
        },
      },
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
      historyApiFallback: {
        rewrites: [
          { from: /^\/admin/, to: "/admin.html" },
          { from: /^\/admin-login/, to: "/admin.html" },
        ],
      },
    },
  };
});
