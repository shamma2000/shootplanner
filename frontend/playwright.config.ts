import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://localhost:3001",
    channel: "msedge",
    screenshot: "only-on-failure",
    timezoneId: "Asia/Colombo",
  },
  webServer: {
    command: "npm run dev -- --host localhost --port 3001",
    url: "http://localhost:3001",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
