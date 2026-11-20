import { defineConfig } from "@playwright/test";

const baseURL = process.env.BEETLE_TEST_URL ?? "http://127.0.0.1:3210";

export default defineConfig({
  testDir: "./tests",
  outputDir: "./output/playwright/test-results",
  use: { baseURL, viewport: { width: 1440, height: 900 } },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", use: { browserName: "firefox" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
  webServer: process.env.BEETLE_TEST_URL
    ? undefined
    : {
        command: "pnpm start --hostname 127.0.0.1 --port 3210",
        url: baseURL + "/beetle",
        reuseExistingServer: !process.env.CI,
      },
});
