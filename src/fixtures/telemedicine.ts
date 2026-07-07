import { test as base } from '@playwright/test';
import { AgreementPage } from '../pages/telemedicine/AgreementPage';

// WebKit reports UAT CORS/network failures as pageerror events; filter them as environmental noise.
const NETWORK_NOISE = /access control checks|Load failed|Failed to fetch/i;

type TelemedicineTestFixtures = {
    /** Runtime errors seen during the current case only; earlier cases' errors are drained away. */
    pageErrors: string[];
};

type TelemedicineWorkerFixtures = {
    /** Agreement page opened once per worker, shared across the file's cases. */
    agreement: AgreementPage;
    /** Raw per-worker error sink the shared page's pageerror listener pushes into. */
    workerPageErrors: string[];
};

// Worker-scoped fixtures: open the Agreement page once per worker, shared across a file's cases (not isolated — call agreement.goto() for a fresh state).
export const test = base.extend<TelemedicineTestFixtures, TelemedicineWorkerFixtures>({
    workerPageErrors: [
        async ({}, use) => {
            await use([]);
        },
        { scope: 'worker' },
    ],

    agreement: [
        async ({ browser, workerPageErrors }, use) => {
            const page = await browser.newPage();
            page.on('pageerror', (err) => {
                if (NETWORK_NOISE.test(err.message)) return;
                workerPageErrors.push(err.message);
            });
            const agreement = new AgreementPage(page);
            await agreement.goto();
            await use(agreement);
            await page.close();
        },
        { scope: 'worker' },
    ],

    // Drain leftovers from earlier cases so an error is blamed on the case that caused it.
    pageErrors: async ({ workerPageErrors }, use) => {
        workerPageErrors.length = 0;
        await use(workerPageErrors);
    },
});

export { expect } from '@playwright/test';
