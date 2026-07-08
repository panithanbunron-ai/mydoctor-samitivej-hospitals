import { test, expect } from '../../src/fixtures/telemedicine';
import { type AgreementPage } from '../../src/pages/telemedicine/AgreementPage';
import { RegisterPage } from '../../src/pages/telemedicine/RegisterPage';
import { ConfirmPage } from '../../src/pages/telemedicine/ConfirmPage';
import { CallPage } from '../../src/pages/telemedicine/CallPage';
import { ReviewPage } from '../../src/pages/telemedicine/ReviewPage';
import { SuccessPage } from '../../src/pages/telemedicine/SuccessPage';
import { validRegistration } from '../../src/test-data/telemedicine/register';
import { successTexts } from '../../src/test-data/telemedicine/success';
import { type LangCode } from '../../src/test-data/telemedicine/agreement';
import { check } from '../../src/utils/visual-check';

// 'default' (not 'serial'): cases share the worker's page but each still runs if an earlier one fails.
test.describe.configure({ mode: 'default' });

// Drive Agreement → Register → Confirm → Call → Review → Success, submitting a review to reach a fresh Success page.
async function gotoSuccess(
    agreement: AgreementPage,
): Promise<{ lang: LangCode; success: SuccessPage }> {
    await agreement.goto();
    const lang = await agreement.currentLanguage();
    const register = await agreement.proceedToRegister();
    expect(new URL(register.page.url()).pathname).toBe(RegisterPage.path);

    await register.fillForm(lang, validRegistration);
    const confirm = await register.proceedToConfirm(lang);
    expect(new URL(confirm.page.url()).pathname).toBe(ConfirmPage.path);

    const call = await confirm.proceedToCall(lang);
    expect(new URL(call.page.url()).pathname).toBe(CallPage.path);

    const review = await call.proceedToReview(lang);
    expect(new URL(review.page.url()).pathname).toBe(ReviewPage.path);

    const success = await review.proceedToSuccess(lang);
    expect(new URL(success.page.url()).pathname).toBe(SuccessPage.path);

    return { lang, success };
}

test.describe('Telemedicine - Success', () => {
    test('TC_MDR_SUC_001 : Verify clicking Close on the Success page returns the user to the Agreement page', async ({
        agreement,
        pageErrors,
    }) => {
        const { lang, success } = await gotoSuccess(agreement);

        // Wording: message reads the thank-you copy, Close button reads "ปิด" / "Close".
        await check(
            success.message(lang),
            `success message reads "${successTexts[lang].message}"`,
            (l) => expect(l).toBeVisible(),
        );
        await check(success.closeButton, `Close button reads "${successTexts[lang].close}"`, (l) =>
            expect(l).toHaveText(successTexts[lang].close),
        );

        await success.close();

        // Behavior: navigation returns to "/", the Agreement page.
        expect(new URL(agreement.page.url()).pathname).toBe('/');

        // Behavior: prior checkbox state is reset (a fresh load, not a client-side route back).
        await check(
            agreement.serviceConsentCheckbox,
            'service consent checkbox resets to unchecked on return',
            (l) => expect(l).not.toBeChecked(),
        );
        await check(
            agreement.marketingConsentCheckbox,
            'marketing consent checkbox resets to unchecked on return',
            (l) => expect(l).not.toBeChecked(),
        );

        expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toEqual([]);
    });

    test('TC_MDR_SUC_002 : Verify the Language Toggle on the Success page correctly switches the thank-you message and Close button text', async ({
        agreement,
        pageErrors,
    }) => {
        const { lang, success } = await gotoSuccess(agreement);
        const other: LangCode = lang === 'TH' ? 'EN' : 'TH';

        await success.switchLanguage(other);

        // UI/Wording: message and Close button switch to the other language's copy.
        await check(
            success.message(other),
            `success message switches to "${successTexts[other].message}"`,
            (l) => expect(l).toBeVisible(),
        );
        await check(
            success.closeButton,
            `Close button switches to "${successTexts[other].close}"`,
            (l) => expect(l).toHaveText(successTexts[other].close),
        );

        expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toEqual([]);
    });
});
