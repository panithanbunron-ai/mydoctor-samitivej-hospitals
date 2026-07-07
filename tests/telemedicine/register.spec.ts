import { test, expect } from '../../src/fixtures/telemedicine';
import { RegisterPage } from '../../src/pages/telemedicine/RegisterPage';
import { registerTexts } from '../../src/test-data/register';
import { check } from '../../src/utils/visual-check';

// 'default' (not 'serial'): cases share the worker's page but each still runs if an earlier one fails.
test.describe.configure({ mode: 'default' });

test.describe('Telemedicine - Register', () => {
    test('TC_MDR_REG_001 : Verify the Register page does not show a Language Toggle', async ({
        agreement,
        pageErrors,
    }) => {
        // Navigate from the Agreement page into Register.
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
});
