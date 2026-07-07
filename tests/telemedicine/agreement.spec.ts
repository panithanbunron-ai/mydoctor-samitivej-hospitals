import { test, expect } from '../../src/fixtures/telemedicine';
import { type AgreementPage, type LangCode } from '../../src/pages/telemedicine/AgreementPage';
import { RegisterPage } from '../../src/pages/telemedicine/RegisterPage';
import { agreementTexts, consentPopups } from '../../src/test-data/agreement';
import { check } from '../../src/utils/visual-check';

// 'default' (not 'serial'): cases share the worker's page but each still runs if an earlier one fails.
test.describe.configure({ mode: 'default' });

test.describe('Telemedicine - Agreement', () => {
    async function checkTexts(
        agreement: AgreementPage,
        lang: LangCode,
        note: string,
    ): Promise<void> {
        for (const { label, locator } of agreement.textElements(lang)) {
            await check(locator, `${label} — ${note}`, (l) => expect(l).toBeVisible());
        }
    }

    test('TC_MDR_AGR_001 : Verify the Language Toggle switches all Agreement page text between EN and TH', async ({
        agreement,
        pageErrors,
    }) => {
        await check(agreement.languageToggle, 'language toggle visible', (l) =>
            expect(l).toBeVisible(),
        );

        const current = await agreement.currentLanguage();
        expect(current === 'TH' || current === 'EN').toBeTruthy();
        const other: LangCode = current === 'TH' ? 'EN' : 'TH';

        await checkTexts(agreement, current, 'baseline');

        await agreement.switchLanguage(other);
        await checkTexts(agreement, other, `after switch to ${other}`);
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

    test('TC_MDR_AGR_002 : Verify checkbox 1 cannot be checked and an alert is shown if the agreement text has not been scrolled to the bottom', async ({
        agreement,
    }) => {
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

    test('TC_MDR_AGR_003 : Verify checkbox 2 can be checked at any time without any scroll condition', async ({
        agreement,
    }) => {
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

    test('TC_MDR_AGR_004 : Verify the Confirm button stays disabled until checkbox 1 is checked, then becomes enabled', async ({
        agreement,
    }) => {
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

    test('TC_MDR_AGR_005 : Verify clicking the Cancel button keeps the user on the Agreement page', async ({
        agreement,
        pageErrors,
    }) => {
        await agreement.goto();
        const lang = await agreement.currentLanguage();

        await check(agreement.cancelButton(lang), 'Cancel label matches language', (l) =>
            expect(l).toContainText(agreementTexts[lang].cancel),
        );

        await agreement.cancelButton(lang).click();

        // User stays on the Agreement page: path unchanged and heading still shown.
        expect(new URL(agreement.page.url()).pathname).toBe('/');
        await check(agreement.headingLocator(lang), 'Agreement heading still visible', (l) =>
            expect(l).toBeVisible(),
        );

        expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toEqual([]);
    });

    test("TC_MDR_AGR_006 : Verify tapping each checkbox's label text opens a popup with the correct consent content", async ({
        agreement,
        pageErrors,
    }) => {
        await agreement.goto();
        const lang = await agreement.currentLanguage();
        const popups = consentPopups[lang];

        // 1. Tap checkbox 1's label → personal-data-disclosure consent popup.
        await agreement.openConsentPopup(lang, 'service');
        await check(agreement.consentPopup, "checkbox 1's label opens a popup", (l) =>
            expect(l).toBeVisible(),
        );
        for (const phrase of popups.service.contains) {
            await check(agreement.consentPopup, `service popup shows: "${phrase}"`, (l) =>
                expect(l).toContainText(phrase),
            );
        }
        // The two popups must not be swapped: no marketing-only wording here.
        await check(agreement.consentPopup, 'service popup is not the marketing consent', (l) =>
            expect(l).not.toContainText(popups.marketing.unique),
        );
        await check(agreement.consentPopupOkButton, 'popup OK button reads "OK"', (l) =>
            expect(l).toHaveText(consentPopups.ok),
        );

        // 2. Close the popup.
        await agreement.closeConsentPopup();
        await check(agreement.consentPopup, 'popup dismissed after tapping OK', (l) =>
            expect(l).toBeHidden(),
        );

        // 3. Tap checkbox 2's label → marketing-consent popup.
        await agreement.openConsentPopup(lang, 'marketing');
        await check(agreement.consentPopup, "checkbox 2's label opens a popup", (l) =>
            expect(l).toBeVisible(),
        );
        for (const phrase of popups.marketing.contains) {
            await check(agreement.consentPopup, `marketing popup shows: "${phrase}"`, (l) =>
                expect(l).toContainText(phrase),
            );
        }
        await check(agreement.consentPopup, 'marketing popup is not the service consent', (l) =>
            expect(l).not.toContainText(popups.service.unique),
        );
        await check(agreement.consentPopupOkButton, 'popup OK button reads "OK"', (l) =>
            expect(l).toHaveText(consentPopups.ok),
        );
        await agreement.closeConsentPopup();

        expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toEqual([]);
    });

    test('TC_MDR_AGR_007 : Verify clicking Confirm after checking checkbox 1 navigates to the Register page', async ({
        agreement,
        pageErrors,
    }) => {
        await agreement.goto();
        const lang = await agreement.currentLanguage();

        // 1. Scroll the terms to the bottom (the app's precondition for checkbox 1).
        await agreement.scrollTermsToBottom();

        // 2. Check checkbox 1, which enables Confirm.
        await agreement.serviceConsentCheckbox.click({ force: true });
        await check(agreement.serviceConsentCheckbox, 'checkbox 1 checked', (l) =>
            expect(l).toBeChecked(),
        );
        await check(agreement.confirmButton(lang), 'Confirm enabled', (l) =>
            expect(l).toBeEnabled(),
        );

        // 3. Tap Confirm and wait for the Register navigation.
        await Promise.all([
            agreement.page.waitForURL(`**${RegisterPage.path}`),
            agreement.confirmButton(lang).click(),
        ]);

        // Behavior: navigation lands on "/register".
        expect(new URL(agreement.page.url()).pathname).toBe(RegisterPage.path);

        // UI/Wording: the Register page shows the required-field labels and the
        // phone field with its expected placeholder.
        const register = new RegisterPage(agreement.page);
        await check(register.firstNameLabel(lang), 'First Name required-field label shown', (l) =>
            expect(l).toBeVisible(),
        );
        await check(register.lastNameLabel(lang), 'Last Name required-field label shown', (l) =>
            expect(l).toBeVisible(),
        );
        await check(register.phoneField(lang), 'phone field with expected placeholder shown', (l) =>
            expect(l).toBeVisible(),
        );

        expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toEqual([]);
    });
});
