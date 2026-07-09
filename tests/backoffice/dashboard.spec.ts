import { test, expect } from '@playwright/test';
import { OneTimePasswordPage } from '../../src/pages/backoffice/oneTimePasswordPage';
import { ResetPasswordPage } from '../../src/pages/backoffice/resetPasswordPage';
import { DashboardPage } from '../../src/pages/backoffice/dashboardPage';
import { mailbox, otpEmail } from '../../src/test-data/backoffice/oneTimePassword';
import { backofficeCredentials } from '../../src/test-data/backoffice/login';
import { dashboardTexts } from '../../src/test-data/backoffice/dashboard';
import { check } from '../../src/utils/visual-check';
import { MailClient } from '../../src/utils/mailClient';

// Reaching the dashboard needs a real login (which emails a fresh OTP each time)...
const missingCredentials = !backofficeCredentials.username || !backofficeCredentials.password;
const credentialsHint = 'Set BACKOFFICE_USERNAME and BACKOFFICE_PASSWORD to run the dashboard cases.';

// ...and the registered mailbox to read the OTP back out and get past the OTP step.
const missingMailbox = !mailbox.address || !mailbox.password || !mailbox.accountName;
const mailboxHint =
    'Set MAILBOX_ADDRESS, MAILBOX_PASSWORD and MAILBOX_ACCOUNT_NAME to run the dashboard cases.';

test.describe('Backoffice - Dashboard', () => {
    // Shared login/mailbox state — run sequentially in a single worker, like the OTP cases.
    test.describe.configure({ mode: 'default' });

    // Statically skipped: the dashboard (and the Reset Password page it comes after) markup was
    // not observable when written, so every selector here is inferred (see DashboardPage /
    // ResetPasswordPage). DASH_001 also completes a real password reset, and DASH_002 needs a
    // live queued call — neither is reproducible unattended. Un-skip and correct selectors once
    // the flow can be driven against live UAT.
    test.skip(
        'TC_MDR_DASH_001 : Verify a successful password reset lands on the dashboard with the four queue tabs',
        async ({ page, request }) => {
            test.skip(missingCredentials, credentialsHint);
            test.skip(missingMailbox, mailboxHint);
            test.setTimeout(otpEmail.deliveryTimeoutMs + 60_000);

            // Login -> OTP (read the emailed code) -> Reset Password.
            const mail = await MailClient.login(request, mailbox);
            const otp = new OneTimePasswordPage(page);
            await otp.gotoViaLogin(backofficeCredentials);
            const onScreenRefCode = await otp.refCode();
            const email = await mail.waitForOtpEmail(onScreenRefCode, otpEmail.deliveryTimeoutMs);
            expect(email.otp).toMatch(otpEmail.otpPattern);
            await otp.fillOtp(email.otp);
            await otp.verify();

            // Reset to the current password so the account stays usable for later runs.
            const reset = new ResetPasswordPage(page);
            await reset.waitFor();
            await reset.fill(backofficeCredentials.password);
            await reset.submit();

            // Behavior: submitting a valid reset navigates to the Backend dashboard.
            const dashboard = new DashboardPage(page);
            await dashboard.waitFor();
            expect(new URL(page.url()).pathname).toBe(DashboardPage.path);

            // UI: top nav — logo, breadcrumb, account menu and Mute button.
            await check(dashboard.logo, `nav shows the "${dashboardTexts.logoText}" logo`, (l) =>
                expect(l).toBeVisible(),
            );
            await check(
                dashboard.breadcrumb,
                `breadcrumb reads "${dashboardTexts.breadcrumb}"`,
                (l) => expect(l).toBeVisible(),
            );
            await check(dashboard.accountMenu, 'account name + dropdown shown top-right', (l) =>
                expect(l).toBeVisible(),
            );
            await check(
                dashboard.muteButton,
                `"${dashboardTexts.muteButton}" button shown`,
                (l) => expect(l).toBeVisible(),
            );

            // Wording: the four queue tabs are present, each with a "(n)" count.
            const tabs = [
                dashboard.waitingNurseTab,
                dashboard.nurseRoomTab,
                dashboard.waitingDoctorTab,
                dashboard.doctorRoomTab,
            ];
            for (const tab of tabs) {
                await check(tab, 'queue tab shown with a live "(n)" count', (l) =>
                    expect(l).toBeVisible(),
                );
                await check(tab, 'tab label carries a numeric count in parentheses', (l) =>
                    expect(l).toHaveText(dashboardTexts.tabCountPattern),
                );
            }
        },
    );

    test.skip(
        'TC_MDR_DASH_002 : Verify an incoming call shows correct patient details with working Information and Start Call buttons',
        async ({ page, request }) => {
            test.skip(missingCredentials, credentialsHint);
            test.skip(missingMailbox, mailboxHint);
            test.setTimeout(otpEmail.deliveryTimeoutMs + 60_000);

            // Reach the dashboard via the same login -> OTP -> reset flow as DASH_001.
            const mail = await MailClient.login(request, mailbox);
            const otp = new OneTimePasswordPage(page);
            await otp.gotoViaLogin(backofficeCredentials);
            const onScreenRefCode = await otp.refCode();
            const email = await mail.waitForOtpEmail(onScreenRefCode, otpEmail.deliveryTimeoutMs);
            await otp.fillOtp(email.otp);
            await otp.verify();
            const reset = new ResetPasswordPage(page);
            await reset.waitFor();
            await reset.fill(backofficeCredentials.password);
            await reset.submit();

            const dashboard = new DashboardPage(page);
            await dashboard.waitFor();

            // Precondition: a call must be queued under Waiting Nurse; nothing to assert otherwise.
            const waitingNurse = await dashboard.tabCount(dashboard.waitingNurseTab);
            test.skip(waitingNurse < 1, 'No incoming call queued — DASH_002 needs a live call.');

            // UI: red card header "#n : Incoming Call" with an HH:MM Wait Time counter.
            await check(
                dashboard.incomingCallHeader,
                `card header matches "${dashboardTexts.incomingCall.headerPattern}"`,
                (l) => expect(l).toHaveText(dashboardTexts.incomingCall.headerPattern),
            );
            await check(dashboard.waitTime, 'Wait Time HH:MM counter shown', (l) =>
                expect(l).toContainText(dashboardTexts.incomingCall.waitTimePattern),
            );

            // UI: every field is populated with a real, non-placeholder value.
            for (const label of Object.values(dashboardTexts.incomingCall.fields)) {
                await check(
                    dashboard.fieldValue(label),
                    `field "${label}" has a populated value`,
                    (l) => expect(l).not.toHaveText(/^\s*(-|N\/?A)?\s*$/),
                );
            }

            // Behavior: Information opens patient info without error; Start Call is actionable.
            await check(dashboard.informationButton, '"Information" button shown', (l) =>
                expect(l).toBeVisible(),
            );
            await dashboard.informationButton.click();
            await check(dashboard.startCallButton, '"Start Call" button shown and enabled', (l) =>
                expect(l).toBeEnabled(),
            );
        },
    );
});
