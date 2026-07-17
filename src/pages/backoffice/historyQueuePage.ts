import { type Page, type Locator } from '@playwright/test';
import { historyQueueTexts } from '../../test-data/backoffice/historyQueue';

export class HistoryQueuePage {
    /** URL path for the History Queue patient list — verify against live UAT. */
    static readonly listPath = historyQueueTexts.listPath;
    /** URL path fragment for the History Queue detail view — verify against live UAT. */
    static readonly detailPath = historyQueueTexts.detailPath;

    readonly page: Page;

    readonly queuesMenuItem: Locator;
    readonly historyQueueMenuItem: Locator;

    readonly viewDetailsLinks: Locator;

    readonly medicalHistoryLabel: Locator;
    readonly chiefComplaintLabel: Locator;

    readonly medicalHistoryInput: Locator;
    readonly chiefComplaintInput: Locator;

    readonly hnField: Locator;
    readonly firstNameField: Locator;
    readonly lastNameField: Locator;
    readonly birthdateField: Locator;

    readonly saveButton: Locator;
    /** Error alert/toast shown after a failed save — not visible means the save succeeded. */
    readonly saveErrorAlert: Locator;

    readonly assignmentHeading: Locator;
    /** Native select behind the Select2 widget — selectOption() works on it despite Select2 hiding it visually. */
    readonly doctorNurseSelect: Locator;
    /** Select2's rendered label, showing the currently selected doctor/nurse (or the placeholder). */
    readonly doctorNurseDisplay: Locator;
    readonly assignButton: Locator;

    constructor(page: Page) {
        this.page = page;

        // Queues renders as either a link or a toggle button on UAT.
        this.queuesMenuItem = page
            .getByRole('link', { name: historyQueueTexts.queuesMenuItem, exact: true })
            .or(page.getByRole('button', { name: historyQueueTexts.queuesMenuItem, exact: true }));

        this.historyQueueMenuItem = page.getByRole('link', {
            name: historyQueueTexts.historyQueueMenuItem,
            exact: true,
        });

        this.viewDetailsLinks = page
            .getByRole('link', { name: historyQueueTexts.viewDetailsButton })
            .or(page.getByRole('button', { name: historyQueueTexts.viewDetailsButton }));

        this.medicalHistoryLabel = page
            .getByText(historyQueueTexts.detailSections.medicalHistory, { exact: true })
            .first();
        this.chiefComplaintLabel = page
            .getByText(historyQueueTexts.detailSections.chiefComplaint, { exact: true })
            .first();

        // Both comment boxes share accessible name "Comment"; Medical History renders first on UAT.
        const commentBoxes = page.getByRole('textbox', { name: 'Comment', exact: true });
        this.medicalHistoryInput = commentBoxes.nth(0);
        this.chiefComplaintInput = commentBoxes.nth(1);

        // Patient fields are reached via their aria-labels, not the div/text-based selectors that also match unrelated ancestor divs.
        this.hnField = page.getByRole('textbox', { name: "Fill in patient's HN" });
        this.firstNameField = page.getByRole('textbox', { name: "Fill in patient's name" });
        // Last Name isn't a separate field on UAT — falls back to the combined Name textbox.
        this.lastNameField = this.firstNameField;
        // input[type=date] doesn't expose placeholder as its accessible name — targeted by id instead.
        this.birthdateField = page.locator('#PatientBirthdate');

        this.saveButton = page.getByRole('button', {
            name: historyQueueTexts.saveButton,
            exact: true,
        });
        this.saveErrorAlert = page
            .locator('[class*="alert-danger"], [class*="toast-error"], [role="alert"]')
            .first();

        this.assignmentHeading = page.getByText(historyQueueTexts.assignment.heading, { exact: true });
        this.doctorNurseSelect = page.locator('#selectDoctor');
        this.doctorNurseDisplay = page.locator('#select2-selectDoctor-container');
        this.assignButton = page.getByRole('button', {
            name: historyQueueTexts.assignment.assignButton,
            exact: true,
        });
    }

    /** Go straight to the list URL — sidebar links are icon-only on UAT so clicking by name is unreliable. */
    async openHistoryQueue(): Promise<void> {
        await this.page.goto(HistoryQueuePage.listPath);
        await this.waitForList();
    }

    async openFirstPatientDetail(): Promise<void> {
        await this.viewDetailsLinks.first().click();
        await this.waitForDetail();
    }

    async waitForList(): Promise<void> {
        await this.viewDetailsLinks.first().waitFor({ state: 'visible' });
    }

    async waitForDetail(): Promise<void> {
        await this.medicalHistoryLabel.waitFor({ state: 'visible' });
    }

    // Save rejects with "Patient birthdate is required" if this is blank; don't overwrite a real one.
    async ensureBirthdateFilled(date: string): Promise<void> {
        if (!(await this.birthdateField.inputValue())) {
            await this.birthdateField.fill(date);
        }
    }

    // Waits for the save request to resolve — navigating away right after click() can abort it in-flight.
    async save(): Promise<void> {
        await Promise.all([
            this.page.waitForResponse((r) => r.url().includes('SaveQueueDetails')),
            this.saveButton.click(),
        ]);
    }

    async fillAndSave(medicalHistory: string, chiefComplaint: string): Promise<void> {
        await this.medicalHistoryInput.clear();
        await this.medicalHistoryInput.fill(medicalHistory);
        await this.chiefComplaintInput.clear();
        await this.chiefComplaintInput.fill(chiefComplaint);
        await this.save();
    }

    // Index 0 is the "Choose Doctor/Nurse" placeholder; picks the next option so the list doesn't need hardcoding.
    async selectDoctorNurse(index = 1): Promise<string> {
        const label = (await this.doctorNurseSelect.locator('option').nth(index).textContent()) ?? '';
        await this.doctorNurseSelect.selectOption({ index });
        return label.trim();
    }

    // Returns the /Queue/UpdateDoctor result — the admin account can't view a doctor/nurse's own queue, so this is the best confirmation the case moved.
    async assign(): Promise<{ isSuccess: boolean; message: string }> {
        const [response] = await Promise.all([
            this.page.waitForResponse((r) => r.url().includes('UpdateDoctor')),
            this.assignButton.click(),
        ]);
        return response.json();
    }
}
