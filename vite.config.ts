import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const TOKEN = "eyJhbGciOiJSUzI1NiIsImprdSI6Imh0dHBzOi8vZXctYnRwLWNmLWRldi5hdXRoZW50aWNhdGlvbi5hcDExLmhhbmEub25kZW1hbmQuY29tL3Rva2VuX2tleXMiLCJraWQiOiJkZWZhdWx0LWp3dC1rZXktMzkyYzU4NTg1NSIsInR5cCI6IkpXVCIsImppZCI6ICJ3bEM0UzhpOVZMOHBiSS9kMVdwK3FYU0N4UlRPUlA0RmhsTkJWWjJvUUUwPSJ9.eyJqdGkiOiJjNzBmZjkwZGMyZjI0Y2Q2YTYwNjVhZmJlZjUyNTgzMyIsImV4dF9hdHRyIjp7ImVuaGFuY2VyIjoiWFNVQUEiLCJzdWJhY2NvdW50aWQiOiJlMzUzNDQ0ZC1iYTlhLTQwYWQtYjgxZi1lOWFiNjE0NjFjNTIiLCJ6ZG4iOiJldy1idHAtY2YtZGV2Iiwib2lkY0lzc3VlciI6Imh0dHBzOi8vYW91YXhremZtLmFjY291bnRzLm9uZGVtYW5kLmNvbSJ9LCJ1c2VyX3V1aWQiOiI2NjRhYjZmMS05ZDM1LTQ1YzAtYmQwOS03YjY2NGFiMzNjMDkiLCJ4cy51c2VyLmF0dHJpYnV0ZXMiOnt9LCJ4cy5zeXN0ZW0uYXR0cmlidXRlcyI6eyJ4cy5zYW1sLmdyb3VwcyI6WyJHUlBfU0NIRSIsIk5hdXRpY2FsIEFwcHJvdmVyIl19LCJnaXZlbl9uYW1lIjoiVGVqZW5kcmEiLCJmYW1pbHlfbmFtZSI6Ikt1bWFyIiwic3ViIjoiYzExNmNlYTMtY2NmOS00OGZlLWIyZjAtOGEwMTUwOWYwZmE1Iiwic2NvcGUiOlsib3BlbmlkIiwiY29tLWV3LXdmbXNjaC1kZXYhdDEzODgwLnVzZXJEYXRhIiwidXNlcl9hdHRyaWJ1dGVzIiwidWFhLnVzZXIiXSwiY2xpZW50X2lkIjoic2ItY29tLWV3LXdmbXNjaC1kZXYhdDEzODgwIiwiY2lkIjoic2ItY29tLWV3LXdmbXNjaC1kZXYhdDEzODgwIiwiYXpwIjoic2ItY29tLWV3LXdmbXNjaC1kZXYhdDEzODgwIiwiZ3JhbnRfdHlwZSI6ImF1dGhvcml6YXRpb25fY29kZSIsInVzZXJfaWQiOiJjMTE2Y2VhMy1jY2Y5LTQ4ZmUtYjJmMC04YTAxNTA5ZjBmYTUiLCJvcmlnaW4iOiJzYXAuY3VzdG9tIiwidXNlcl9uYW1lIjoiZGV2ZWxvcGVyLnRlamVuZHJhQGdtYWlsLmNvbSIsImVtYWlsIjoiZGV2ZWxvcGVyLnRlamVuZHJhQGdtYWlsLmNvbSIsImF1dGhfdGltZSI6MTc1MjQ4MjU4MSwicmV2X3NpZyI6IjZlZWIxNDEzIiwiaWF0IjoxNzUyNDgyNTgzLCJleHAiOjE3NTI1MjU3ODMsImlzcyI6Imh0dHBzOi8vZXctYnRwLWNmLWRldi5hdXRoZW50aWNhdGlvbi5hcDExLmhhbmEub25kZW1hbmQuY29tL29hdXRoL3Rva2VuIiwiemlkIjoiZTM1MzQ0NGQtYmE5YS00MGFkLWI4MWYtZTlhYjYxNDYxYzUyIiwiYXVkIjpbInNiLWNvbS1ldy13Zm1zY2gtZGV2IXQxMzg4MCIsInVhYSIsIm9wZW5pZCIsImNvbS1ldy13Zm1zY2gtZGV2IXQxMzg4MCJdfQ.d2SWZUPkxbJ5FK_YlpI5Jv0R737Pvxb3bonv18rrWxyKM7bDgsk7VVGmUybQqbZ0s_43R7248mTyXGA18ouKVzkI8pWYL4n_V1_OEMuzh1EKFcmL6IIrpDjUMkLSCgbKYjuDsH14oOEg68BcB1GmKP_VkzQp9cI04Ox0d0b604vFC4qSh-RN6sG9Wj6t2Y3V0ltjPNRCJf5XeOnWkMABwJBiYw75wHnknm0DdKFjiNu4POUg2c8Hj9yJUkaW88bxP8sgqdUXt3nj2rO58kbsz0rU4rKn-MxxC26k2OM87w6kyYkvWPGxywica7gMKnlx11yrrF9D1r6LX2XFTlpwEg";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  root: 'webapp',
  base: '/',
  build: {
    outDir: './../dist',
  },
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'https://ew-btp-cf-dev-dev-vkschservice.cfapps.ap11.hana.ondemand.com/api/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Authorization', TOKEN);
          });
        },
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./webapp"),
    },
  },
}));
