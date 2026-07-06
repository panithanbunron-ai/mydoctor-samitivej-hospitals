import { test, expect, type Page } from '@playwright/test';
import { AgreementPage, type LangCode } from '../../src/pages/telemedicine/AgreementPage';
import { agreementTexts } from '../../src/test-data/agreement';
import { check } from '../../src/utils/visual-check';

// Open the app once and share it across the cases in this file. 'default' (not
// 'serial') keeps them in one worker sharing the page, but lets every case run
// even when an earlier one fails — serial would skip the rest on first failure.
test.describe.configure({ mode: 'default' });

test.describe('Telemedicine - Agreement', () => {
    let page: Page;
    let agreement: AgreementPage;
    const pageErrors: string[] = [];

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        page.on('pageerror', (err) => {
            // WebKit surfaces UAT backend CORS/network failures (e.g. the
            // GetAgreement fetch "due to access control checks") as pageerror
            // events; Chromium does not. These are environmental noise, not app
            // JS errors, so keep only genuine runtime errors.
            if (/access control checks|Load failed|Failed to fetch/i.test(err.message)) return;
            pageErrors.push(err.message);
        });
        agreement = new AgreementPage(page);
        await agreement.goto();
    });

    test.afterAll(async () => {
        await page.close();
    });

    async function checkTexts(lang: LangCode, note: string): Promise<void> {
        for (const { label, locator } of agreement.textElements(lang)) {
            await check(locator, `${label} — ${note}`, (l) => expect(l).toBeVisible());
        }
    }

    test('Verify the Language Toggle switches all Agreement page text between EN and TH', async () => {
        await check(agreement.languageToggle, 'language toggle visible', (l) =>
            expect(l).toBeVisible(),
        );

        const current = await agreement.currentLanguage();
        expect(current === 'TH' || current === 'EN').toBeTruthy();
        const other: LangCode = current === 'TH' ? 'EN' : 'TH';

        await checkTexts(current, 'baseline');

        await agreement.switchLanguage(other);
        await checkTexts(other, `after switch to ${other}`);
        await check(
            agreement.headingLocator(current),
            `${current} heading hidden after switch`,
            (l) => expect(l).toBeHidden(),
        );

        // Toggle back to confirm the switch is reversible.
        await agreement.switchLanguage(current);
        await check(
            agreement.headingLocator(current),
            `${current} heading restored after switching back`,
            (l) => expect(l).toBeVisible(),
        );

        expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toEqual([]);
    });

    test('Verify checkbox 1 cannot be checked and an alert is shown if the agreement text has not been scrolled to the bottom', async () => {
        const lang = await agreement.currentLanguage();

        await check(agreement.serviceConsentCheckbox, 'checkbox 1 unchecked (before)', (l) =>
            expect(l).not.toBeChecked(),
        );
        await check(agreement.confirmButton(lang), 'Confirm disabled (before)', (l) =>
            expect(l).toBeDisabled(),
        );

        // Tap checkbox 1 before scrolling the terms to the bottom.
        await agreement.serviceConsentCheckbox.click({ force: true });

        await check(agreement.readAgreementAlert, 'read-agreement alert shown', (l) =>
            expect(l).toBeVisible(),
        );
        await check(agreement.readAgreementAlert, 'alert instructs user to read the terms', (l) =>
            expect(l).toContainText(/กรุณาอ่าน|read/i),
        );
        await check(agreement.serviceConsentCheckbox, 'checkbox 1 still unchecked (after)', (l) =>
            expect(l).not.toBeChecked(),
        );
        await check(agreement.confirmButton(lang), 'Confirm still disabled (after)', (l) =>
            expect(l).toBeDisabled(),
        );
    });

    test('Verify checkbox 2 can be checked at any time without any scroll condition', async () => {
        // Re-open the page for a pristine, top-of-page state (no scroll, no lingering alert).
        await agreement.goto();

        await check(agreement.serviceConsentCheckbox, 'checkbox 1 unchecked (precondition)', (l) =>
            expect(l).not.toBeChecked(),
        );
        await check(agreement.marketingConsentCheckbox, 'checkbox 2 unchecked (before)', (l) =>
            expect(l).not.toBeChecked(),
        );

        // Tap checkbox 2 immediately, without scrolling the terms.
        await agreement.marketingConsentCheckbox.click();

        await check(agreement.marketingConsentCheckbox, 'checkbox 2 checked immediately', (l) =>
            expect(l).toBeChecked(),
        );
        // No scroll dependency: no read-agreement alert should appear.
        await check(agreement.readAgreementAlert, 'no read-agreement alert shown', (l) =>
            expect(l).toBeHidden(),
        );
        // No dependency on checkbox 1's state either.
        await check(agreement.serviceConsentCheckbox, 'checkbox 1 still unchecked', (l) =>
            expect(l).not.toBeChecked(),
        );
    });

    test('Verify the Confirm button stays disabled until checkbox 1 is checked, then becomes enabled', async () => {
        await agreement.goto();
        const lang = await agreement.currentLanguage();
        await agreement.scrollTermsToBottom();

        // Both checkboxes unchecked; Confirm is disabled.
        await check(agreement.serviceConsentCheckbox, 'checkbox 1 unchecked (before)', (l) =>
            expect(l).not.toBeChecked(),
        );
        await check(agreement.marketingConsentCheckbox, 'checkbox 2 unchecked (before)', (l) =>
            expect(l).not.toBeChecked(),
        );
        await check(agreement.confirmButton(lang), 'Confirm disabled before checkbox 1', (l) =>
            expect(l).toBeDisabled(),
        );

        // Check checkbox 1 only, so any enable depends on checkbox 1 alone.
        await agreement.serviceConsentCheckbox.click({ force: true });
        await check(agreement.serviceConsentCheckbox, 'checkbox 1 checked', (l) =>
            expect(l).toBeChecked(),
        );

        // Confirm becomes enabled immediately, regardless of checkbox 2.
        await check(agreement.confirmButton(lang), 'Confirm enabled after checkbox 1', (l) =>
            expect(l).toBeEnabled(),
        );
        await check(agreement.marketingConsentCheckbox, 'checkbox 2 still unchecked', (l) =>
            expect(l).not.toBeChecked(),
        );
        await check(agreement.confirmButton(lang), 'Confirm label matches language', (l) =>
            expect(l).toContainText(agreementTexts[lang].confirm),
        );
    });

    test('Verify clicking the Cancel button keeps the user on the Agreement page', async () => {
        await agreement.goto();
        const lang = await agreement.currentLanguage();

        await check(agreement.cancelButton(lang), 'Cancel label matches language', (l) =>
            expect(l).toContainText(agreementTexts[lang].cancel),
        );

        await agreement.cancelButton(lang).click();

        // User stays on the Agreement page: path unchanged and heading still shown.
        expect(new URL(page.url()).pathname).toBe('/');
        await check(agreement.headingLocator(lang), 'Agreement heading still visible', (l) =>
            expect(l).toBeVisible(),
        );

        expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toEqual([]);
    });
});
