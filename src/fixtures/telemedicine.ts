import { test as base } from '@playwright/test';
import { AgreementPage } from '../pages/telemedicine/AgreementPage';

// WebKit surfaces UAT backend CORS/network failures (e.g. the GetAgreement fetch
// "due to access control checks") as pageerror events; Chromium does not. These
// are environmental noise, not app JS errors.
const NETWORK_NOISE = /access control checks|Load failed|Failed to fetch/i;

type TelemedicineFixtures = {
    /** Agreement page opened once per worker, shared across the file's cases. */
    agreement: AgreementPage;
    /** Genuine runtime errors seen on the page, with network noise filtered out. */
    pageErrors: string[];
};

/**
 * Worker-scoped fixtures: open the Agreement page a single time per worker and
 * share it across the cases in a file — fast, but cases are not isolated (use a
 * fresh `agreement.goto()` in a case that needs a pristine state).
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const test = base.extend<{}, TelemedicineFixtures>({
    pageErrors: [
        async ({}, use) => {
            await use([]);
        },
        { scope: 'worker' },
    ],

    agreement: [
        async ({ browser, pageErrors }, use) => {
            const page = await browser.newPage();
            page.on('pageerror', (err) => {
                if (NETWORK_NOISE.test(err.message)) return;
                pageErrors.push(err.message);
            });
            const agreement = new AgreementPage(page);
            await agreement.goto();
            await use(agreement);
            await page.close();
        },
        { scope: 'worker' },
    ],
});

export { expect } from '@playwright/test';
