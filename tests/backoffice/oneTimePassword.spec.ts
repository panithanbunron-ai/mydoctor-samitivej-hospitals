import { test, expect } from '@playwright/test';
import { OneTimePasswordPage } from '../../src/pages/backoffice/oneTimePasswordPage';
import { otpTexts, invalidOtp } from '../../src/test-data/backoffice/oneTimePassword';
import { backofficeCredentials } from '../../src/test-data/backoffice/login';
import { check } from '../../src/utils/visual-check';

// Every automated OTP case starts with a real login (which emails a fresh OTP each time).
const missingCredentials = !backofficeCredentials.username || !backofficeCredentials.password;
const credentialsHint = 'Set BACKOFFICE_USERNAME and BACKOFFICE_PASSWORD to run the OTP cases.';

test.describe('Backoffice - One-Time Password', () => {
    test('TC_MDR_OTP_005 : Verify a successful login shows the OTP input page with a Ref.Code', async ({
        page,
    }) => {
        test.skip(missingCredentials, credentialsHint);

        const otp = new OneTimePasswordPage(page);
        await otp.gotoViaLogin(backofficeCredentials);

        // UI: logo, labelled OTP field, Ref.Code line and VERIFY OTP button all render.
        await check(otp.logo, 'my doctor logo shown', (l) => expect(l).toBeVisible());
        await check(otp.otpField, 'OTP input field shown', (l) => expect(l).toBeVisible());
        await check(otp.otpField, `OTP field placeholder is "${otpTexts.otpPlaceholder}"`, (l) =>
            expect(l).toHaveAttribute('placeholder', otpTexts.otpPlaceholder),
        );
        await check(otp.otpLabel, `OTP field label reads "${otpTexts.otpLabel}"`, (l) =>
            expect(l).toHaveText(otpTexts.otpLabel),
        );
        await check(otp.refCodeLabel, `Ref.Code prefix reads "${otpTexts.refCodeLabel}"`, (l) =>
            expect(l).toHaveText(otpTexts.refCodeLabel),
        );
        await check(otp.verifyOtpButton, 'VERIFY OTP button shown', (l) => expect(l).toBeVisible());

        // Behavior: the Ref.Code value is non-empty, in the observed 6-char uppercase format.
        const firstRefCode = await otp.refCode();
        expect(firstRefCode).toMatch(otpTexts.refCodePattern);

        // Behavior: a second login attempt should issue a fresh Ref.Code (soft — UAT reuses it while the OTP is valid).
        await otp.gotoViaLogin(backofficeCredentials);
        const secondRefCode = await otp.refCode();
        expect(secondRefCode).toMatch(otpTexts.refCodePattern);
        await check(otp.refCodeValue, 'Ref.Code differs from the previous login attempt', (l) =>
            expect(l).not.toHaveText(firstRefCode),
        );
    });

    test('TC_MDR_OTP_006 : Verify the OTP code and Ref.Code are emailed to the registered address', async () => {
        // Automation has no access to the registered inbox on UAT, so this stays manual.
        test.skip(
            true,
            'Manual — check the registered inbox for a prompt MyDoctor email reading "Dear user <first> <last>, Your OTP Code is : <OTP> and Ref.Code : <RefCode>".',
        );
    });

    test('TC_MDR_OTP_007 : Verify the on-screen Ref.Code matches the Ref.Code in the email', async () => {
        // Needs the email half of the comparison; the on-screen format is covered by TC_MDR_OTP_005.
        test.skip(
            true,
            'Manual — compare the on-screen Ref.Code with the emailed one character by character (note the "Ref.Code:" vs "Ref.Code :" copy difference).',
        );
    });

    test('TC_MDR_OTP_008 : Verify a correct OTP navigates to the Reset Password page', async () => {
        // Needs the real one-time code from the email, which automation cannot read.
        test.skip(
            true,
            'Manual — enter the emailed OTP, verify the Reset Password page (policy hint, Confirm password with eye icon, Submit) and that the OTP cannot be reused.',
        );
    });

    test('TC_MDR_OTP_009 : Verify an incorrect OTP is rejected with an error and does not proceed', async ({
        page,
    }) => {
        test.skip(missingCredentials, credentialsHint);

        const otp = new OneTimePasswordPage(page);
        await otp.gotoViaLogin(backofficeCredentials);

        await otp.fillOtp(invalidOtp);

        // Wording: the app rejects via a native alert() — there is no inline field error on UAT.
        const alertMessage = await otp.verifyExpectingAlert();
        expect(alertMessage).toBe(otpTexts.invalidOtpAlert);

        // Behavior: attempt rejected — still on the OTP step, and the field is cleared for a retry.
        expect(new URL(page.url()).pathname).toBe(OneTimePasswordPage.path);
        await check(otp.form, 'still on the OTP form — code not accepted', (l) =>
            expect(l).toBeVisible(),
        );
        await check(otp.otpField, 'OTP field cleared after rejection', (l) =>
            expect(l).toHaveValue(''),
        );
    });

    test('TC_MDR_OTP_010 : Verify an expired OTP is rejected with an error message', async () => {
        // Expiry duration is undocumented and waiting it out is too slow/flaky for CI.
        test.skip(
            true,
            'Manual — let the OTP pass its validity period, submit it, and record the actual expiry duration and error copy.',
        );
    });

    test('TC_MDR_OTP_011 : Verify a blank OTP shows an error and the form does not submit', async ({
        page,
    }) => {
        test.skip(missingCredentials, credentialsHint);

        const otp = new OneTimePasswordPage(page);
        await otp.gotoViaLogin(backofficeCredentials);

        // Wording: a blank OTP triggers the same generic alert() — no dedicated required-field message.
        const alertMessage = await otp.verifyExpectingAlert();
        expect(alertMessage).toBe(otpTexts.invalidOtpAlert);

        // Behavior: form not submitted — still on the OTP step with the form visible.
        expect(new URL(page.url()).pathname).toBe(OneTimePasswordPage.path);
        await check(otp.form, 'still on the OTP form — empty OTP not submitted', (l) =>
            expect(l).toBeVisible(),
        );
    });
});
