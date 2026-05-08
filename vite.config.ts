import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Fallbacks must match the current remixed project (read from .env at build time).
  const fallbackProjectId = "ethlttlixqmraqvlqpve";
  const fallbackPublishableKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0aGx0dGxpeHFtcmFxdmxxcHZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzA5MDUsImV4cCI6MjA5MTE0NjkwNX0.lDpt2zXGyCtj6Lbzzz3lWIfYShJg_oXBZRntdLyx0Zk";

  const supabaseUrl =
    env.VITE_SUPABASE_URL ||
    env.SUPABASE_URL ||
    `https://${env.VITE_SUPABASE_PROJECT_ID || fallbackProjectId}.supabase.co`;

  const supabasePublishableKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_ANON_KEY ||
    fallbackPublishableKey;

  return {
    server: {
      host: "::",
      port: 8080,
    },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        supabasePublishableKey
      ),
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
