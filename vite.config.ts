import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          const packageName = id.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/)?.[1];
          if (!packageName) return;

          if (/^(react|react-dom|scheduler|react-router-dom|@remix-run\/router)$/.test(packageName)) {
            return "framework";
          }
          if (/^(@supabase\/|@tanstack\/|date-fns$)/.test(packageName)) {
            return "data";
          }
          if (/^(recharts|d3-|victory-vendor)/.test(packageName)) {
            return "charts";
          }
          if (/^(ai$|@ai-sdk\/|@streamdown\/|streamdown$|remark-|rehype-|unified$|micromark|mdast|hast|shiki$|mermaid$|katex$|unist-util-)/.test(packageName)) {
            return "assistant";
          }
          if (/^(@radix-ui\/|class-variance-authority$|cmdk$|vaul$|input-otp$|embla-carousel)/.test(packageName)) {
            return "ui-primitives";
          }
        },
      },
    },
  },
}));
