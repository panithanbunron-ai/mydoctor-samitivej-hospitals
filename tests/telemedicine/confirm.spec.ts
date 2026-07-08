import { test, expect } from '../../src/fixtures/telemedicine';
import { RegisterPage } from '../../src/pages/telemedicine/RegisterPage';
import { ConfirmPage } from '../../src/pages/telemedicine/ConfirmPage';
import { CallPage } from '../../src/pages/telemedicine/CallPage';
import { validRegistration } from '../../src/test-data/telemedicine/register';
import { confirmTexts } from '../../src/test-data/telemedicine/confirm';
import { check } from '../../src/utils/visual-check';

// 'default' (not 'serial'): cases share the worker's page but each still runs if an earlier one fails.
test.describe.configure({ mode: 'default' });

test.describe('Telemedicine - Confirm', () => {
    test('TC_MDR_CFM_001 : Verify the Thai version of the Confirm page shows an ID card image as the top step icon', async ({
        agreement,
        pageErrors,
    }) => {
        await agreement.goto();
        const lang = await agreement.currentLanguage();
        const register = await agreement.proceedToRegister();
        expect(new URL(register.page.url()).pathname).toBe(RegisterPage.path);

        await register.fillForm(lang, validRegistration);
        const confirm = await register.proceedToConfirm(lang);
        expect(new URL(confirm.page.url()).pathname).toBe(ConfirmPage.path);

        // Precondition: language set to Thai (the Confirm page toggle controls this independently of Register's).
        await confirm.switchLanguage('TH');

        // UI: top step icon is the ID card graphic — its filename contains "id_card".
        await check(confirm.stepIcon(0), 'top step icon is the ID card graphic', (l) =>
            expect(l).toHaveAttribute('src', /id_card/),
        );

        // Wording: step text below the icon reads "กรุณาเตรียมบัตรประชาชน".
        await check(
            confirm.stepText('TH', 0),
            `step text reads "${confirmTexts.TH.steps[0]}"`,
            (l) => expect(l).toHaveText(confirmTexts.TH.steps[0]),
        );

        expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toEqual([]);
    });

    test('TC_MDR_CFM_002 : Verify the English version of the Confirm page shows a passport image as the top step icon', async ({
        agreement,
        pageErrors,
    }) => {
        await agreement.goto();
        const lang = await agreement.currentLanguage();
        const register = await agreement.proceedToRegister();
        expect(new URL(register.page.url()).pathname).toBe(RegisterPage.path);

        await register.fillForm(lang, validRegistration);
        const confirm = await register.proceedToConfirm(lang);
        expect(new URL(confirm.page.url()).pathname).toBe(ConfirmPage.path);

        // Precondition: language set to English.
        await confirm.switchLanguage('EN');

        // UI: top step icon is a passport graphic — a different asset than the Thai ID card image.
        await check(
            confirm.stepIcon(0),
            "top step icon differs from the Thai version's ID card graphic",
            (l) => expect(l).not.toHaveAttribute('src', /id_card/),
        );

        // Wording: step text below the icon reads "Please prepare your passport."
        await check(
            confirm.stepText('EN', 0),
            `step text reads "${confirmTexts.EN.steps[0]}"`,
            (l) => expect(l).toHaveText(confirmTexts.EN.steps[0]),
        );

        expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toEqual([]);
    });

    test('TC_MDR_CFM_003 : Verify clicking Start begins the call and navigates to the Call page', async ({
        agreement,
        pageErrors,
    }) => {
        await agreement.goto();
        const lang = await agreement.currentLanguage();
        const register = await agreement.proceedToRegister();
        expect(new URL(register.page.url()).pathname).toBe(RegisterPage.path);

        await register.fillForm(lang, validRegistration);
        const confirm = await register.proceedToConfirm(lang);
        expect(new URL(confirm.page.url()).pathname).toBe(ConfirmPage.path);

        // Wording: the Start button label reads "เริ่มสนทนา" / "Start".
        await check(
            confirm.startButton(lang),
            `Start button label reads "${confirmTexts[lang].start}"`,
            (l) => expect(l).toHaveText(confirmTexts[lang].start),
        );

        const call = await confirm.proceedToCall(lang);

        // Behavior: navigation goes to /call.
        expect(new URL(call.page.url()).pathname).toBe(CallPage.path);

        // UI: the Call page's waiting/connecting layout is shown (Cancel button visible).
        await check(call.cancelButton(lang), 'Call page Cancel button is visible', (l) =>
            expect(l).toBeVisible(),
        );

        expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toEqual([]);
    });
});
