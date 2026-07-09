import { type Page, type Locator } from '@playwright/test';
import { resetPasswordTexts } from '../../test-data/backoffice/oneTimePassword';

export class ResetPasswordPage {
    /** Shown after a valid OTP; the reset form replaces the OTP form, still on /Login. */
    static readonly path = '/Login';

    readonly page: Page;
    /** Its own AngularJS form; ids are shared across the app's forms, so scope every locator to it. */
    readonly form: Locator;
    readonly title: Locator;
    readonly newPasswordField: Locator;
    readonly newPasswordHint: Locator;
    readonly confirmPasswordField: Locator;
    /** Show/hide-password (eye) toggle on the Confirm password field. */
    readonly showPasswordToggle: Locator;
    readonly submitButton: Locator;

    constructor(page: Page) {
        this.page = page;
        // Selectors inferred from the test-case spec — the reset form's markup was not
        // observable when written; correct against live UAT if any assertion misses.
        this.form = page.locator('form[name="resetForm"]:visible');
        this.title = this.form.getByText(resetPasswordTexts.title);
        this.newPasswordField = this.form.locator('input[name="newPassword"]');
        this.newPasswordHint = this.form.getByText(resetPasswordTexts.passwordHint);
        this.confirmPasswordField = this.form.locator('input[name="confirmPassword"]');
        this.showPasswordToggle = this.form.locator('[class*="eye"], .toggle-password');
        this.submitButton = this.form.locator('button', { hasText: resetPasswordTexts.submitButton });
    }

    async waitFor(): Promise<void> {
        await this.form.waitFor({ state: 'visible' });
    }

    /** Fill both password fields; confirm defaults to the same value as the new password. */
    async fill(newPassword: string, confirmPassword: string = newPassword): Promise<void> {
        await this.newPasswordField.fill(newPassword);
        await this.confirmPasswordField.fill(confirmPassword);
    }

    async submit(): Promise<void> {
        await this.submitButton.click();
    }
}
