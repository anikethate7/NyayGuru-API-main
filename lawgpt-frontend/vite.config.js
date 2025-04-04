import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables from .env files
  const env = loadEnv(mode, process.cwd(), "");
  
  console.log("Google Client ID:", env.GOOGLE_CLIENT_ID); // Log to verify it's loaded

  return {
    plugins: [react()],
    define: {
      // Make environment variables available to the client
      'process.env.GOOGLE_CLIENT_ID': JSON.stringify(env.GOOGLE_CLIENT_ID || "")
    },
    server: {
      proxy: {
        // Proxy API requests to the FastAPI backend
        "/api": {
          target: "http://localhost:8000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
