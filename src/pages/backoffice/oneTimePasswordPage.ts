import { type Page, type Locator } from '@playwright/test';
import { LoginPage } from './LoginPage';
import { otpTexts } from '../../test-data/backoffice/oneTimePassword';

export class OneTimePasswordPage {
    /** The OTP step stays on /Login — the login form hides and the OTP form shows in its place. */
    static readonly path = '/Login';

    readonly page: Page;
    /** The OTP form reuses the login form's element ids, so scope every locator to it. */
    readonly form: Locator;
    readonly logo: Locator;
    readonly otpLabel: Locator;
    /** The visible OTP input's id is a duplicate #username; name="Otp" is the stable hook. */
    readonly otpField: Locator;
    readonly refCodeLabel: Locator;
    readonly refCodeValue: Locator;
    readonly verifyOtpButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.form = page.locator('form[name="otpForm"]:visible');
        this.logo = this.form.locator('#hospitalLogo');
        this.otpLabel = this.form.locator('label', { hasText: otpTexts.otpLabel });
        this.otpField = this.form.locator('input[name="Otp"]');
        this.refCodeLabel = this.form.locator('label', { hasText: otpTexts.refCodeLabel });
        this.refCodeValue = this.form.locator('label.ng-binding');
        this.verifyOtpButton = this.form.locator('button', { hasText: otpTexts.verifyOtpButton });
    }

    /** The OTP page is only reachable through a real login; each call emails a fresh OTP. */
    async gotoViaLogin(credentials: { username: string; password: string }): Promise<void> {
        const login = new LoginPage(this.page);
        await login.goto();
        await login.fill(credentials);
        await login.submit();
        await this.form.waitFor({ state: 'visible' });
    }

    /** Ref.Code value as displayed, with the &nbsp; padding stripped. */
    async refCode(): Promise<string> {
        return (await this.refCodeValue.innerText()).replace(/\u00a0/g, ' ').trim();
    }

    async fillOtp(code: string): Promise<void> {
        await this.otpField.fill(code);
    }

    /** Click Verify OTP for a valid code — the happy path advances to the Reset Password page. */
    async verify(): Promise<void> {
        await this.verifyOtpButton.click();
    }

    /** Click Verify OTP and return the message of the native alert() the app shows on a rejected OTP. */
    async verifyExpectingAlert(): Promise<string> {
        const dialog = this.page.waitForEvent('dialog');
        await this.verifyOtpButton.click();
        const d = await dialog;
        const message = d.message();
        await d.accept();
        return message;
    }
}
