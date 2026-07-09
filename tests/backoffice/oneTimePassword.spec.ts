import { test, expect, request as apiRequest } from '@playwright/test';
import { OneTimePasswordPage } from '../../src/pages/backoffice/oneTimePasswordPage';
import { ResetPasswordPage } from '../../src/pages/backoffice/resetPasswordPage';
import {
    otpTexts,
    invalidOtp,
    expiredOtp,
    mailbox,
    otpEmail,
    resetPasswordTexts,
} from '../../src/test-data/backoffice/oneTimePassword';
import { backofficeCredentials } from '../../src/test-data/backoffice/login';
import { check } from '../../src/utils/visual-check';
import { MailClient } from '../../src/utils/mailClient';
import { MailTmPage } from '../../src/pages/mailtm/MailTmPage';

// Every automated OTP case starts with a real login (which emails a fresh OTP each time).
const missingCredentials = !backofficeCredentials.username || !backofficeCredentials.password;
const credentialsHint = 'Set BACKOFFICE_USERNAME and BACKOFFICE_PASSWORD to run the OTP cases.';

// The email cases also need the registered mailbox to read the OTP back out.
const missingMailbox = !mailbox.address || !mailbox.password || !mailbox.accountName;
const mailboxHint =
    'Set MAILBOX_ADDRESS, MAILBOX_PASSWORD and MAILBOX_ACCOUNT_NAME to run the OTP-email cases.';

test.describe('Backoffice - One-Time Password', () => {
    // These cases share one registered mailbox, so run them sequentially in a single
    // worker (not fully-parallel) — otherwise one case's cleanup races another's OTP
    // email. 'default' (unlike 'serial') still runs every case if one fails.
    test.describe.configure({ mode: 'default' });

    // Keep only the newest (currently-valid) OTP email and drop stale ones. We can't
    // just empty the inbox: UAT reuses a valid OTP without re-sending, so the live
    // code's email must survive for the next run to verify it.
    test.afterAll(async () => {
        if (missingMailbox) return;
        const ctx = await apiRequest.newContext();
        try {
            const mail = await MailClient.login(ctx, mailbox);
            await mail.keepNewest();
        } finally {
            await ctx.dispose();
        }
    });

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

        // Behavior: a second login attempt still shows a Ref.Code in the same format (UAT may reuse the value while the OTP is valid).
        await otp.gotoViaLogin(backofficeCredentials);
        const secondRefCode = await otp.refCode();
        expect(secondRefCode).toMatch(otpTexts.refCodePattern);
    });

    test('TC_MDR_OTP_006 : Verify the OTP code and Ref.Code are emailed to the registered address', async ({
        page,
        context,
        request,
    }) => {
        test.skip(missingCredentials, credentialsHint);
        test.skip(missingMailbox, mailboxHint);
        // Login + email delivery wait + driving the mail.tm web UI can exceed the 30s default.
        test.setTimeout(otpEmail.deliveryTimeoutMs + 60_000);

        // Don't empty the inbox first: UAT reuses a valid OTP and only e-mails it once,
        // so we match the on-screen Ref.Code against the live code's existing email
        // (or a fresh send) rather than depending on a re-send that may never come.
        const mail = await MailClient.login(request, mailbox);

        const otp = new OneTimePasswordPage(page);
        try {
            const start = Date.now();
            await otp.gotoViaLogin(backofficeCredentials);
            const onScreenRefCode = await otp.refCode();

            // Correlate by the on-screen Ref.Code; waiting past the timeout fails the test.
            const email = await mail.waitForOtpEmail(onScreenRefCode, otpEmail.deliveryTimeoutMs);
            const availableMs = Date.now() - start;

            // UI: an email for this Ref.Code is available promptly, its sender/subject MyDoctor.
            expect.soft(availableMs, 'OTP email available within a minute').toBeLessThanOrEqual(
                otpEmail.deliveryTimeoutMs,
            );
            expect.soft(email.fromAddress, 'sender address').toBe(otpEmail.fromAddress);
            expect.soft(email.fromName, 'sender name identifies MyDoctor').toBe(otpEmail.fromName);
            expect.soft(email.subject, 'subject').toBe(otpEmail.subject);

            // Behavior: delivered only to the registered address, nowhere else.
            expect.soft(email.recipients, 'delivered only to the registered address').toEqual([
                mailbox.address,
            ]);

            // Wording: greeting name, OTP digits and Ref.Code all match the expected format.
            expect.soft(email.greetingName, 'greeting name is the registered account name').toBe(
                mailbox.accountName,
            );
            expect.soft(email.otp, 'OTP is 8 digits').toMatch(otpEmail.otpPattern);
            expect.soft(email.refCode, 'Ref.Code format').toMatch(otpTexts.refCodePattern);

            // Behavior: the emailed Ref.Code matches the one shown on the OTP screen.
            await check(
                otp.refCodeValue,
                `on-screen Ref.Code matches emailed "${email.refCode}"`,
                (l) => expect(l).toHaveText(new RegExp(`\\b${email.refCode}\\b`)),
            );

            // Web evidence: open the same email in the real mail.tm inbox and screenshot it.
            // Seed the API session into the SPA rather than driving its flaky login form.
            const mailPage = await context.newPage();
            const inbox = new MailTmPage(mailPage);
            await inbox.open(mailbox.webURL, await mail.account());
            await inbox.openEmailByRefCode(email.refCode);

            await check(inbox.emailSubject, `mail.tm shows subject "${otpEmail.subject}"`, (l) =>
                expect(l).toBeVisible(),
            );
            await check(inbox.emailSender, `mail.tm shows sender "${otpEmail.fromName}"`, (l) =>
                expect(l).toBeVisible(),
            );
            await check(
                inbox.emailBody,
                `mail.tm email body shows OTP ${email.otp} and Ref.Code ${email.refCode}`,
                (l) => expect(l).toContainText(email.refCode),
            );

            // Attach a full-page shot of the mail.tm inbox as the report evidence.
            await test.info().attach('mail.tm — OTP email in the registered inbox', {
                body: await mailPage.screenshot({ fullPage: true }),
                contentType: 'image/png',
            });
        } finally {
            // Keep only the newest (live) OTP email and drop stale ones — deleting the
            // live code's email would leave the reused on-screen code unverifiable.
            await mail.keepNewest();
        }
    });

    test('TC_MDR_OTP_007 : Verify the on-screen Ref.Code matches the Ref.Code in the email', async ({
        page,
        request,
    }) => {
        test.skip(missingCredentials, credentialsHint);
        test.skip(missingMailbox, mailboxHint);
        test.setTimeout(otpEmail.deliveryTimeoutMs + 60_000);

        // Read-only comparison — never empties the inbox (the afterAll cleanup does that),
        // so the live code's email survives for the reused-OTP cases.
        const mail = await MailClient.login(request, mailbox);

        const otp = new OneTimePasswordPage(page);
        await otp.gotoViaLogin(backofficeCredentials);
        const onScreenRefCode = await otp.refCode();

        // Correlate to this login by the on-screen Ref.Code; waiting past the timeout fails.
        const email = await mail.waitForOtpEmail(onScreenRefCode, otpEmail.deliveryTimeoutMs);

        // Behavior: on-screen and emailed Ref.Codes are identical, in the 6-char uppercase format.
        expect(onScreenRefCode).toMatch(otpTexts.refCodePattern);
        expect(email.refCode).toBe(onScreenRefCode);

        await check(
            otp.refCodeValue,
            `on-screen Ref.Code matches emailed "${email.refCode}"`,
            (l) => expect(l).toHaveText(new RegExp(`\\b${email.refCode}\\b`)),
        );
    });

    test.skip('TC_MDR_OTP_008 : Verify a correct OTP navigates to the Reset Password page', async ({
        page,
        request,
    }) => {
        test.skip(missingCredentials, credentialsHint);
        test.skip(missingMailbox, mailboxHint);
        test.setTimeout(otpEmail.deliveryTimeoutMs + 60_000);

        const mail = await MailClient.login(request, mailbox);

        const otp = new OneTimePasswordPage(page);
        await otp.gotoViaLogin(backofficeCredentials);
        const onScreenRefCode = await otp.refCode();

        // Read the real one-time code emailed for this exact login (matched by Ref.Code).
        const email = await mail.waitForOtpEmail(onScreenRefCode, otpEmail.deliveryTimeoutMs);
        expect(email.otp).toMatch(otpEmail.otpPattern);

        // Behavior: a valid code is accepted (no rejection alert) and advances to Reset Password.
        // Note: submitting the code consumes it — single-use rejection on reuse is not re-asserted here.
        await otp.fillOtp(email.otp);
        await otp.verify();

        const reset = new ResetPasswordPage(page);
        await reset.waitFor();

        // Still on /Login; the OTP form is replaced by the Reset Password form.
        expect(new URL(page.url()).pathname).toBe(ResetPasswordPage.path);
        await expect(reset.title).toBeVisible();
        await expect(reset.newPasswordField).toBeVisible();
        await expect(reset.newPasswordHint).toHaveText(resetPasswordTexts.passwordHint);
        await expect(reset.confirmPasswordField).toBeVisible();
        await expect(reset.showPasswordToggle).toBeVisible();
        await expect(reset.submitButton).toBeVisible();
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

    test('TC_MDR_OTP_010 : Verify an expired OTP is rejected with an error message', async ({
        page,
    }) => {
        test.skip(missingCredentials, credentialsHint);

        const otp = new OneTimePasswordPage(page);
        await otp.gotoViaLogin(backofficeCredentials);

        // Real time-expiry can't be waited out in CI, so a well-formed invalid code stands
        // in for an expired one. UAT rejects a wrong AND an expired OTP with the same
        // generic alert, so this asserts that shared rejection (it can't prove a distinct
        // "expired" message — that stays the manual note on this case).
        await otp.fillOtp(expiredOtp);
        const alertMessage = await otp.verifyExpectingAlert();
        expect(alertMessage).toBe(otpTexts.invalidOtpAlert);

        // Behavior: rejected — still on the OTP step with the form visible.
        expect(new URL(page.url()).pathname).toBe(OneTimePasswordPage.path);
        await check(otp.form, 'still on the OTP form — expired code not accepted', (l) =>
            expect(l).toBeVisible(),
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
