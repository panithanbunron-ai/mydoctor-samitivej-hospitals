import { type Page, type Locator } from '@playwright/test';
import { loginTexts } from '../../test-data/backoffice/login';

export class LoginPage {
    /** "/" redirects here; the login form lives at /Login. */
    static readonly path = '/Login';

    readonly page: Page;
    /** The visible login form; the OTP/resend forms share element ids, so scope everything to this. */
    readonly form: Locator;
    readonly logo: Locator;
    readonly usernameField: Locator;
    readonly passwordField: Locator;
    readonly loginButton: Locator;
    /** Inline Angular required-field messages. */
    readonly usernameRequiredMessage: Locator;
    readonly passwordRequiredMessage: Locator;
    /** OTP form shown after a successful login. */
    readonly otpForm: Locator;
    readonly refCode: Locator;
    readonly verifyOtpButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.form = page.locator('form[name="myForm"]');
        this.logo = this.form.locator('#hospitalLogo');
        this.usernameField = this.form.locator('#username');
        this.passwordField = this.form.locator('#password');
        this.loginButton = this.form.locator('button', { hasText: loginTexts.loginButton });
        this.usernameRequiredMessage = this.form.getByText(loginTexts.usernameRequired);
        this.passwordRequiredMessage = this.form.getByText(loginTexts.passwordRequired);
        this.otpForm = page.locator('form[name="otpForm"]:visible');
        this.refCode = this.otpForm.getByText(loginTexts.otp.refCode);
        this.verifyOtpButton = this.otpForm.locator('button', {
            hasText: loginTexts.otp.verifyButton,
        });
    }

    async goto(): Promise<void> {
        await this.page.goto('/');
        await this.page.waitForLoadState('domcontentloaded');
        await this.loginButton.waitFor({ state: 'visible' });
    }

    /** Fill whichever fields are provided; omitted fields are left untouched. */
    async fill(data: { username?: string; password?: string }): Promise<void> {
        if (data.username !== undefined) await this.usernameField.fill(data.username);
        if (data.password !== undefined) await this.passwordField.fill(data.password);
    }

    async submit(): Promise<void> {
        await this.loginButton.click();
    }

    /** Click Login and return the message of the native alert() the app shows on bad credentials. */
    async submitExpectingAlert(): Promise<string> {
        const dialog = this.page.waitForEvent('dialog');
        await this.loginButton.click();
        const d = await dialog;
        const message = d.message();
        await d.accept();
        return message;
    }
}
