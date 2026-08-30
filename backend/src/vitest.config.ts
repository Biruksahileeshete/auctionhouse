import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 30000, // concurrency test genuinely runs 20+ real DB transactions
    hookTimeout: 30000,
  },
});
