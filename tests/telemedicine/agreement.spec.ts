import { test, expect, type Page } from '@playwright/test';
import {
    AgreementPage,
    type LangCode,
} from '../../src/pages/telemedicine/AgreementPage';

// Open the app once and share it across the cases in this file.
test.describe.configure({ mode: 'serial' });

test.describe('Telemedicine - Agreement', () => {
    let page: Page;
    let agreement: AgreementPage;
    const pageErrors: string[] = [];

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        page.on('pageerror', (err) => pageErrors.push(err.message));
        agreement = new AgreementPage(page);
        await agreement.goto();
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('Verify the Language Toggle switches all Agreement page text between EN and TH', async () => {
        await expect(agreement.languageToggle).toBeVisible();

        const current = await agreement.currentLanguage();
        expect(current === 'TH' || current === 'EN').toBeTruthy();
        const other: LangCode = current === 'TH' ? 'EN' : 'TH';

        await agreement.expectCopy(current);

        await agreement.switchLanguage(other);
        await agreement.expectCopy(other);
        await agreement.expectHeadingHidden(current);

        // Toggle back to confirm the switch is reversible.
        await agreement.switchLanguage(current);
        await agreement.expectCopy(current);

        expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toEqual([]);
    });

    test('Verify checkbox 1 cannot be checked and an alert is shown if the agreement text has not been scrolled to the bottom', async () => {
        const lang = await agreement.currentLanguage();

        // Precondition: checkbox unchecked and Confirm disabled.
        await expect(agreement.serviceConsentCheckbox).not.toBeChecked();
        await expect(agreement.confirmButton(lang)).toBeDisabled();

        // Tap checkbox 1 before scrolling the terms to the bottom.
        await agreement.serviceConsentCheckbox.click({ force: true });

        // Alert shown; state unchanged; Confirm still disabled.
        await expect(agreement.readAgreementAlert).toBeVisible();
        await expect(agreement.readAgreementAlert).toContainText(
            /กรุณาอ่าน|read/i,
        );
        await expect(agreement.serviceConsentCheckbox).not.toBeChecked();
        await expect(agreement.confirmButton(lang)).toBeDisabled();
    });
});
