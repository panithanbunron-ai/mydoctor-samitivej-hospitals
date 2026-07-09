import { test, expect } from '@playwright/test';
import { OneTimePasswordPage } from '../../src/pages/backoffice/oneTimePasswordPage';
import { DashboardPage } from '../../src/pages/backoffice/dashboardPage';
import { AdminPage } from '../../src/pages/backoffice/adminPage';
import { mailbox, otpEmail } from '../../src/test-data/backoffice/oneTimePassword';
import { backofficeCredentials } from '../../src/test-data/backoffice/login';
import { adminTexts, adminCases } from '../../src/test-data/backoffice/admin';
import { check } from '../../src/utils/visual-check';
import { MailClient } from '../../src/utils/mailClient';

// Reaching the Create Admin form needs a real login (which emails a fresh OTP each time)...
const missingCredentials = !backofficeCredentials.username || !backofficeCredentials.password;
const credentialsHint = 'Set BACKOFFICE_USERNAME and BACKOFFICE_PASSWORD to run the admin cases.';

// ...and the registered mailbox to read the OTP back out and get past the OTP step.
const missingMailbox = !mailbox.address || !mailbox.password || !mailbox.accountName;
const mailboxHint =
    'Set MAILBOX_ADDRESS, MAILBOX_PASSWORD and MAILBOX_ACCOUNT_NAME to run the admin cases.';

test.describe('Backoffice - Admin', () => {
    // Shared login/mailbox state — run sequentially in a single worker, like the OTP/dashboard cases.
    test.describe.configure({ mode: 'default' });

    // The required-field copy is inferred (see adminTexts) — confirm against live UAT. Needs a
    // real login + emailed OTP (skips when login/mailbox env is unset). The สิทธิ์/โรงพยาบาล
    // dropdowns are not filled yet (selectors/valid values unknown) — add them once known.
    test('TC_MDR_ADM_001 : Verify Admin cannot save a new system administrator when the "ชื่อ" (First name) field is left blank', async ({
        page,
        request,
    }) => {
        test.skip(missingCredentials, credentialsHint);
        test.skip(missingMailbox, mailboxHint);
        test.setTimeout(otpEmail.deliveryTimeoutMs + 60_000);

        // Reach the dashboard via login -> OTP (read the emailed code); OTP lands straight on it.
        const mail = await MailClient.login(request, mailbox);
        const otp = new OneTimePasswordPage(page);
        await otp.gotoViaLogin(backofficeCredentials);
        const onScreenRefCode = await otp.refCode();
        const email = await mail.waitForOtpEmail(onScreenRefCode, otpEmail.deliveryTimeoutMs);
        await otp.fillOtp(email.otp);
        await otp.verify();
        await new DashboardPage(page).waitFor();

        // Precondition: on the blank Create Admin form (menu icon -> ผู้ดูแลระบบ -> เพิ่ม).
        const admin = new AdminPage(page);
        await admin.openCreateAdminForm();

        // Fill every field correctly except leave "ชื่อ" (First name) blank, then save.
        await admin.fillForm(adminCases.TC_MDR_ADM_001);
        await admin.save();

        // UI: a validation error points specifically at the "ชื่อ" (First name) field.
        await check(
            admin.firstNameRequired,
            `required-field error for "${adminTexts.firstNameLabel}" shown`,
            // The error renders well after the Save click — wait for it, don't fail at the 5s default.
            (l) => expect(l).toBeVisible({ timeout: 30_000 }),
        );

        // Behavior: the save is rejected — stays on the Create Admin form (never leaves AdminDetail).
        await check(admin.saveButton, 'stays on the Create Admin form (Save still shown)', (l) =>
            expect(l).toBeVisible(),
        );
        // Compare pathname only — the rejected save appends "#" to the URL.
        expect(new URL(page.url()).pathname).toBe(AdminPage.detailPath);
    });
});
