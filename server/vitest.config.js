import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Force sequential execution — avoids port/db race conditions
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },

    // Environment variables injected for every test run
    env: {
      NODE_ENV:   'test',
      JWT_SECRET: 'neevevera-test-secret-do-not-use-in-production',
      JWT_REFRESH_SECRET: 'neevevera-refresh-secret-do-not-use',
    },

    // Timeout per test (career tests seed DB, need headroom)
    testTimeout: 20000,

    // Only look in the tests folder
    include: ['src/tests/**/*.test.js'],
  },
});
