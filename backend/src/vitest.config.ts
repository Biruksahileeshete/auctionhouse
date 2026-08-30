import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 30000,
    hookTimeout: 30000,
    // Default 'threads' pool (worker_threads) has occasionally shown
    // flaky outbound-connection behavior on Windows in some setups —
    // 'forks' uses real child processes instead, which more closely
    // matches how a normal `node`/`tsx` process behaves.
    pool: "forks",
  },
});
