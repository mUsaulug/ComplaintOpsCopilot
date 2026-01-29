import { defineConfig, devices } from '@playwright/test';

/**
 * ComplaintOps Copilot - Playwright Configuration
 * 
 * Screenshots, video ve trace kayıtları aktif.
 * Çıktılar docs/evidence/ altına kaydedilir.
 */
export default defineConfig({
    testDir: './tests/e2e',

    /* Timeout settings */
    timeout: 120000,
    expect: {
        timeout: 120000
    },

    /* Fail fast on CI */
    fullyParallel: false,

    /* Retry on failure */
    retries: 1,

    /* Reporter */
    reporter: [
        ['html', { outputFolder: '../docs/evidence/20260126_0539/playwright-report' }],
        ['list']
    ],

    /* Shared settings */
    use: {
        /* Base URL */
        baseURL: 'http://localhost:3000',

        /* Screenshots */
        screenshot: 'on',

        /* Video recording */
        video: 'on',

        /* Trace on first retry */
        trace: 'on-first-retry',

        /* Viewport */
        viewport: { width: 1280, height: 720 },
    },

    /* Output directories */
    outputDir: '../docs/evidence/20260126_0539/playwright-results',

    /* Projects */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    /* Web server - optional, if frontend is not already running */
    // webServer: {
    //   command: 'npm run dev',
    //   url: 'http://localhost:3000',
    //   reuseExistingServer: true,
    // },
});
