import { defineConfig, devices } from "@playwright/test";

const localUrl = "http://127.0.0.1:3100";
const previewUrl = process.env.BEETLE_TEST_URL;

export default defineConfig({
  testDir: "./tests",
  outputDir: "./output/playwright/test-results",
  use: {
    baseURL: previewUrl ?? localUrl,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium-mobile", use: { ...devices["Pixel 7"] } },
    { name: "webkit-mobile", use: { ...devices["iPhone 15"] } },
  ],
  webServer: previewUrl ? undefined : {
    command: "pnpm build && pnpm start --hostname 127.0.0.1 --port 3100",
    url: localUrl,
    timeout: 120_000,
  },
});
