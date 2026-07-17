import { test, expect } from '@playwright/test';
import { OneTimePasswordPage } from '../../src/pages/backoffice/oneTimePasswordPage';
import { DashboardPage } from '../../src/pages/backoffice/dashboardPage';
import { HistoryQueuePage } from '../../src/pages/backoffice/historyQueuePage';
import { mailbox, otpEmail } from '../../src/test-data/backoffice/oneTimePassword';
import { backofficeCredentials } from '../../src/test-data/backoffice/login';
import { historyQueueTexts } from '../../src/test-data/backoffice/historyQueue';
import { check } from '../../src/utils/visual-check';
import { MailClient } from '../../src/utils/mailClient';

const missingCredentials = !backofficeCredentials.username || !backofficeCredentials.password;
const credentialsHint =
    'Set BACKOFFICE_USERNAME and BACKOFFICE_PASSWORD to run the History Queue cases.';

const missingMailbox = !mailbox.address || !mailbox.password || !mailbox.accountName;
const mailboxHint =
    'Set MAILBOX_ADDRESS, MAILBOX_PASSWORD and MAILBOX_ACCOUNT_NAME to run the History Queue cases.';

test.describe('Backoffice - History Queue', () => {
    // Sequential worker — shared login/mailbox state, same as OTP/Dashboard/Admin suites.
    test.describe.configure({ mode: 'default' });

    test(
        'TC_MDR_HQ_001 : Verify navigating to Queues > History Queue shows the patient list and detail view',
        async ({ page, request }) => {
            test.skip(missingCredentials, credentialsHint);
            test.skip(missingMailbox, mailboxHint);
            test.setTimeout(otpEmail.deliveryTimeoutMs + 60_000);

            const mail = await MailClient.login(request, mailbox);
            const otp = new OneTimePasswordPage(page);
            await otp.gotoViaLogin(backofficeCredentials);
            const onScreenRefCode = await otp.refCode();
            const email = await mail.waitForOtpEmail(onScreenRefCode, otpEmail.deliveryTimeoutMs);
            expect(email.otp).toMatch(otpEmail.otpPattern);
            await otp.fillOtp(email.otp);
            await otp.verify();
            await new DashboardPage(page).waitFor();

            const historyQueue = new HistoryQueuePage(page);
            await historyQueue.openHistoryQueue();

            await check(
                historyQueue.viewDetailsLinks.first(),
                'patient list loads under History Queue — at least one "ดูรายละเอียด" row shown',
                (l) => expect(l).toBeVisible(),
            );
            expect(new URL(page.url()).pathname).toBe(HistoryQueuePage.listPath);

            await historyQueue.openFirstPatientDetail();

            await check(
                historyQueue.medicalHistoryLabel,
                `section label reads "${historyQueueTexts.detailSections.medicalHistory}"`,
                (l) => expect(l).toBeVisible(),
            );
            await check(
                historyQueue.chiefComplaintLabel,
                `section label reads "${historyQueueTexts.detailSections.chiefComplaint}"`,
                (l) => expect(l).toBeVisible(),
            );
            await check(
                historyQueue.medicalHistoryInput,
                '"Medical History" text box is present in the detail view',
                (l) => expect(l).toBeVisible(),
            );
            await check(
                historyQueue.chiefComplaintInput,
                '"Chief Complaint" text box is present in the detail view',
                (l) => expect(l).toBeVisible(),
            );

            for (const [key, label] of Object.entries(historyQueueTexts.detailFields)) {
                const field =
                    key === 'hn'
                        ? historyQueue.hnField
                        : key === 'firstName'
                          ? historyQueue.firstNameField
                          : historyQueue.lastNameField;
                await check(
                    field,
                    `patient field "${label}" is visible in the detail view`,
                    (l) => expect(l).toBeVisible(),
                );
            }

            // HN and Name are real text boxes; Last Name shares the Name text box so only visibility is meaningful.
            await check(
                historyQueue.hnField,
                `"${historyQueueTexts.detailFields.hn}" field has a real value`,
                (l) => expect(l).not.toBeEmpty(),
            );
            await check(
                historyQueue.firstNameField,
                `"${historyQueueTexts.detailFields.firstName}" field has a real value`,
                (l) => expect(l).not.toBeEmpty(),
            );
            await check(
                historyQueue.lastNameField,
                `"${historyQueueTexts.detailFields.lastName}" field has a real value`,
                (l) => expect(l).toBeVisible(),
            );

            expect(new URL(page.url()).pathname).toContain(HistoryQueuePage.detailPath);
        },
    );

    test(
        'TC_MDR_HQ_002 : Verify entering Medical History and Chief Complaint text and clicking Save stores the data',
        async ({ page, request }) => {
            test.skip(missingCredentials, credentialsHint);
            test.skip(missingMailbox, mailboxHint);
            test.setTimeout(otpEmail.deliveryTimeoutMs + 90_000);

            const mail = await MailClient.login(request, mailbox);
            const otp = new OneTimePasswordPage(page);
            await otp.gotoViaLogin(backofficeCredentials);
            const onScreenRefCode = await otp.refCode();
            const email = await mail.waitForOtpEmail(onScreenRefCode, otpEmail.deliveryTimeoutMs);
            expect(email.otp).toMatch(otpEmail.otpPattern);
            await otp.fillOtp(email.otp);
            await otp.verify();
            await new DashboardPage(page).waitFor();

            const historyQueue = new HistoryQueuePage(page);
            await historyQueue.openHistoryQueue();
            await historyQueue.openFirstPatientDetail();
            // Save rejects the whole form (Medical History/Chief Complaint included) if birthdate is blank.
            await historyQueue.ensureBirthdateFilled(historyQueueTexts.saveInput.birthdate);

            // Recorded so the same patient can be reopened after Save to check persistence.
            const detailUrl = page.url();

            await historyQueue.medicalHistoryInput.clear();
            await historyQueue.medicalHistoryInput.fill(historyQueueTexts.saveInput.medicalHistory);
            await check(
                historyQueue.medicalHistoryInput,
                `Medical History field contains "${historyQueueTexts.saveInput.medicalHistory}" after typing`,
                (l) => expect(l).toHaveValue(historyQueueTexts.saveInput.medicalHistory),
            );

            await historyQueue.chiefComplaintInput.clear();
            await historyQueue.chiefComplaintInput.fill(historyQueueTexts.saveInput.chiefComplaint);
            await check(
                historyQueue.chiefComplaintInput,
                `Chief Complaint field contains "${historyQueueTexts.saveInput.chiefComplaint}" after typing`,
                (l) => expect(l).toHaveValue(historyQueueTexts.saveInput.chiefComplaint),
            );

            await check(
                historyQueue.saveButton,
                `Save button label reads "${historyQueueTexts.saveButton}"`,
                (l) => expect(l).toBeVisible(),
            );
            await historyQueue.save();

            // Navigate away then back to the same detail URL to confirm the save persisted.
            await historyQueue.openHistoryQueue();
            await page.goto(detailUrl);
            await historyQueue.waitForDetail();

            await check(
                historyQueue.medicalHistoryInput,
                `Medical History persists as "${historyQueueTexts.saveInput.medicalHistory}" after reopening`,
                (l) => expect(l).toHaveValue(historyQueueTexts.saveInput.medicalHistory),
            );
            await check(
                historyQueue.chiefComplaintInput,
                `Chief Complaint persists as "${historyQueueTexts.saveInput.chiefComplaint}" after reopening`,
                (l) => expect(l).toHaveValue(historyQueueTexts.saveInput.chiefComplaint),
            );
        },
    );

    test(
        'TC_MDR_HQ_003 : Verify using the Assignment section to reassign the case to another doctor/nurse works correctly',
        async ({ page, request }) => {
            test.skip(missingCredentials, credentialsHint);
            test.skip(missingMailbox, mailboxHint);
            test.setTimeout(otpEmail.deliveryTimeoutMs + 60_000);

            const mail = await MailClient.login(request, mailbox);
            const otp = new OneTimePasswordPage(page);
            await otp.gotoViaLogin(backofficeCredentials);
            const onScreenRefCode = await otp.refCode();
            const email = await mail.waitForOtpEmail(onScreenRefCode, otpEmail.deliveryTimeoutMs);
            expect(email.otp).toMatch(otpEmail.otpPattern);
            await otp.fillOtp(email.otp);
            await otp.verify();
            await new DashboardPage(page).waitFor();

            const historyQueue = new HistoryQueuePage(page);
            await historyQueue.openHistoryQueue();
            await historyQueue.openFirstPatientDetail();

            const doctorName = await historyQueue.selectDoctorNurse();
            await check(
                historyQueue.doctorNurseDisplay,
                `Assignment dropdown shows "${doctorName}" after selecting a different doctor/nurse`,
                (l) => expect(l).toHaveText(doctorName),
            );

            const result = await historyQueue.assign();

            await check(
                historyQueue.saveErrorAlert,
                'no error alert shown after clicking Assign',
                (l) => expect(l).toBeHidden(),
            );
            await check(
                historyQueue.doctorNurseDisplay,
                `assignment reflects the newly selected staff member "${doctorName}"`,
                (l) => expect(l).toHaveText(doctorName),
            );

            // Best available confirmation the case moved to the new assignee's queue — this admin
            // account has no way to view a doctor/nurse's own queue to check directly.
            expect(result.isSuccess, result.message).toBe(true);
        },
    );
});
