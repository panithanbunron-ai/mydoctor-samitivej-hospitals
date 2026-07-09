import { defineConfig, devices } from '@playwright/test';

import dotenv from 'dotenv';
import path from 'path';

/**
 * Read environment variables from .env (see .env.example).
 * https://github.com/motdotla/dotenv
 */
dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Base URLs for the two apps under test, loaded from .env.
 * Env vars still win, so you can override per run:
 *   BACKOFFICE_URL=https://... npx playwright test
 */
const BACKOFFICE_URL = process.env.BACKOFFICE_URL || 'http://localhost:3000';
const TELEMEDICINE_URL = process.env.TELEMEDICINE_URL || 'http://localhost:3001';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry failing tests once locally, twice on CI */
    retries: process.env.CI ? 2 : 1,
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: 'html',
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',
        /* Fail a stuck action/navigation fast instead of letting it eat a long OTP-case test timeout. */
        actionTimeout: 30_000,
        navigationTimeout: 30_000,
    },

    /* One project per app. Run a single app with: npx playwright test --project=backoffice */
    projects: [
        {
            name: 'backoffice',
            testDir: './tests/backoffice',
            use: {
                ...devices['Desktop Chrome'],
                baseURL: BACKOFFICE_URL,
            },
        },
        {
            name: 'telemedicine',
            testDir: './tests/telemedicine',
            /* Telemedicine is a mobile web app: run it at a mobile viewport. */
            use: {
                ...devices['iPhone 14 Pro Max'],
                // Capture report screenshots at 1x (device is 3x) to keep them a
                // reasonable size; viewport and mobile behavior are unchanged.
                deviceScaleFactor: 1,
                baseURL: TELEMEDICINE_URL,
            },
        },

        /* Add more browsers per app if needed, e.g.:
        {
            name: 'backoffice-firefox',
            testDir: './tests/backoffice',
            use: { ...devices['Desktop Firefox'], baseURL: BACKOFFICE_URL },
        },
        */
    ],

    /* Run your local dev server before starting the tests */
    // webServer: {
    //   command: 'npm run start',
    //   url: 'http://localhost:3000',
    //   reuseExistingServer: !process.env.CI,
    // },
});
