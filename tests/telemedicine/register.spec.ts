import { test, expect } from '../../src/fixtures/telemedicine';
import { RegisterPage } from '../../src/pages/telemedicine/RegisterPage';
import { ConfirmPage } from '../../src/pages/telemedicine/ConfirmPage';
import { registerTexts, validRegistration } from '../../src/test-data/telemedicine/register';
import { check } from '../../src/utils/visual-check';

// 'default' (not 'serial'): cases share the worker's page but each still runs if an earlier one fails.
test.describe.configure({ mode: 'default' });

test.describe('Telemedicine - Register', () => {
    test('TC_MDR_REG_001 : Verify the Register page does not show a Language Toggle', async ({
        agreement,
        pageErrors,
    }) => {
        // Navigate from the Agreement page into Register.
        await agreement.goto();
        const register = await agreement.proceedToRegister();

        // Precondition: we're actually on the Register page.
        expect(new URL(register.page.url()).pathname).toBe(RegisterPage.path);

        // The header language toggle present on the Agreement page must not appear here.
        await check(register.languageToggle, 'no Language Toggle on the Register page', (l) =>
            expect(l).toHaveCount(0),
        );

        expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toEqual([]);
    });

    test('TC_MDR_REG_002 : Verify clicking Next with all fields blank shows the shared error popup', async ({
        agreement,
        pageErrors,
    }) => {
        // A prior case may have left the shared page on /register; reset to a pristine
        // Agreement page. Register has no toggle, so read the language here before navigating.
        await agreement.goto();
        const lang = await agreement.currentLanguage();
        const register = await agreement.proceedToRegister();
        expect(new URL(register.page.url()).pathname).toBe(RegisterPage.path);

        // Leave First Name, Last Name and Phone Number blank and tap Next.
        await register.nextButton(lang).click();

        // UI: an error popup with a red X icon appears.
        await check(register.errorPopup, 'error popup shown', (l) => expect(l).toBeVisible());
        await check(register.errorPopupIcon, 'error popup shows a red X icon', (l) =>
            expect(l).toBeVisible(),
        );

        // Wording: popup heading and body match the required-fields error copy.
        const { title, body } = registerTexts[lang].requiredFieldsError;
        await check(register.errorPopup, `error popup heading reads "${title}"`, (l) =>
            expect(l).toContainText(title),
        );
        await check(register.errorPopup, `error popup body reads "${body}"`, (l) =>
            expect(l).toContainText(body),
        );

        // Behavior: the form is not submitted; the user stays on the Register page.
        expect(new URL(register.page.url()).pathname).toBe(RegisterPage.path);

        expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toEqual([]);
    });

    test('TC_MDR_REG_003 : Verify clicking Next with only some required fields filled still shows the error popup', async ({
        agreement,
        pageErrors,
    }) => {
        await agreement.goto();
        const lang = await agreement.currentLanguage();
        const register = await agreement.proceedToRegister();
        expect(new URL(register.page.url()).pathname).toBe(RegisterPage.path);

        // Fill First Name only; clear the rest — the app restores values entered earlier in the session.
        await register.fillForm(lang, {
            firstName: validRegistration.firstName,
            lastName: '',
            phone: '',
        });
        await register.nextButton(lang).click();

        // UI: the same shared error popup as TC_MDR_REG_002 — no per-field inline message.
        await check(register.errorPopup, 'error popup shown', (l) => expect(l).toBeVisible());
        await check(register.errorPopupIcon, 'error popup shows a red X icon', (l) =>
            expect(l).toBeVisible(),
        );

        // Wording: the same generic error copy as the all-blank scenario.
        const { title, body } = registerTexts[lang].requiredFieldsError;
        await check(register.errorPopup, `error popup heading reads "${title}"`, (l) =>
            expect(l).toContainText(title),
        );
        await check(register.errorPopup, `error popup body reads "${body}"`, (l) =>
            expect(l).toContainText(body),
        );

        // Behavior: navigation is blocked until all three fields are filled.
        expect(new URL(register.page.url()).pathname).toBe(RegisterPage.path);

        expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toEqual([]);
    });

    test('TC_MDR_REG_004 : Verify filling all required fields and clicking Next navigates to the Confirm page', async ({
        agreement,
        pageErrors,
    }) => {
        await agreement.goto();
        const lang = await agreement.currentLanguage();
        const register = await agreement.proceedToRegister();
        expect(new URL(register.page.url()).pathname).toBe(RegisterPage.path);

        // Wording: the Next button label reads "ถัดไป" / "Continue".
        await check(
            register.nextButton(lang),
            `Next button label reads "${registerTexts[lang].next}"`,
            (l) => expect(l).toHaveText(registerTexts[lang].next),
        );

        // Fill First Name, Last Name and Phone Number, then tap Next.
        await register.fillForm(lang, validRegistration);
        const confirm = await register.proceedToConfirm(lang);

        // Behavior: navigation goes to /confirm.
        expect(new URL(confirm.page.url()).pathname).toBe(ConfirmPage.path);

        // UI: no error popup; the Confirm page layout (step text, Start button) is shown.
        await check(register.errorPopup, 'no error popup after a valid submit', (l) =>
            expect(l).toHaveCount(0),
        );
        await check(confirm.stepText(lang, 0), 'Confirm page first step is visible', (l) =>
            expect(l).toBeVisible(),
        );
        await check(confirm.startButton(lang), 'Confirm page Start button is visible', (l) =>
            expect(l).toBeVisible(),
        );

        expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toEqual([]);
    });

    test('TC_MDR_REG_005 : Verify the Next button remains visually enabled at all times regardless of field completion', async ({
        agreement,
        pageErrors,
    }) => {
        await agreement.goto();
        const lang = await agreement.currentLanguage();
        const register = await agreement.proceedToRegister();
        expect(new URL(register.page.url()).pathname).toBe(RegisterPage.path);

        // Blank all fields explicitly — the app restores values entered earlier in the session.
        await register.fillForm(lang, { firstName: '', lastName: '', phone: '' });

        // UI: with all fields blank the button is not greyed out/disabled.
        await check(register.nextButton(lang), 'Next button enabled with all fields blank', (l) =>
            expect(l).toBeEnabled(),
        );

        // Behavior: the button is clickable; validation only fires on click (error popup appears).
        await register.nextButton(lang).click();
        await check(register.errorPopup, 'validation error appears only after the click', (l) =>
            expect(l).toBeVisible(),
        );

        expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toEqual([]);
    });

    test('TC_MDR_REG_006 : Verify the Phone Number field accepts free text input rather than digits only', async ({
        agreement,
        pageErrors,
    }) => {
        await agreement.goto();
        const lang = await agreement.currentLanguage();
        const register = await agreement.proceedToRegister();
        expect(new URL(register.page.url()).pathname).toBe(RegisterPage.path);

        // Documented current behavior: the field is free text; flag as a data-quality concern.
        test.info().annotations.push({
            type: 'issue',
            description:
                'Phone Number accepts non-numeric input — confirm with the team whether this is intended.',
        });

        // Type a mix of letters, digits and dashes into the Phone Number field.
        const mixedInput = '08-abc-1234';
        await register.phoneField(lang).fill(mixedInput);

        // UI: the field keeps the typed characters without blocking or stripping input.
        await check(register.phoneField(lang), 'Phone Number keeps non-numeric input', (l) =>
            expect(l).toHaveValue(mixedInput),
        );

        expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toEqual([]);
    });
});
