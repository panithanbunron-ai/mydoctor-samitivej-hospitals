import { type Page, type Locator, expect } from '@playwright/test';
import { otpEmail } from '../../test-data/backoffice/oneTimePassword';
import { type AccountSession } from '../../utils/mailClient';

/**
 * The mail.tm web inbox — used to view the OTP email in a real browser for a
 * report screenshot. mail.tm actively resists automation (a honeypot login field,
 * and a UI login that intermittently drops to a random guest account), so instead
 * of driving the login form we inject the API session token straight into the
 * localStorage the SPA reads on load. The token comes from `MailClient`, which
 * remains the source of truth for the data assertions; this page only supplies
 * the human-visible view. The email body renders inline (no iframe).
 */
export class MailTmPage {
    readonly page: Page;
    readonly emailSubject: Locator;
    readonly emailSender: Locator;
    readonly emailSenderAddress: Locator;
    readonly emailBody: Locator;

    constructor(page: Page) {
        this.page = page;
        this.emailSubject = page.getByRole('heading', { name: otpEmail.subject });
        this.emailSender = page.getByText(otpEmail.fromName, { exact: false });
        this.emailSenderAddress = page.getByText(otpEmail.fromAddress, { exact: false });
        // The email body is sandboxed in an iframe-resizer frame, not the main page.
        this.emailBody = page
            .frameLocator('iframe[id^="iFrameResizer"]')
            .getByText(/Your OTP Code is/);
    }

    /**
     * Load the inbox already signed in to `account`: navigate once so localStorage
     * is writable, seed the account the SPA restores on load, then reload.
     */
    async open(webURL: string, account: AccountSession): Promise<void> {
        await this.page.goto(webURL);
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.evaluate((acc) => {
            localStorage.setItem('account', JSON.stringify(acc));
            localStorage.setItem('active', JSON.stringify(acc));
            localStorage.setItem('accounts', JSON.stringify([acc]));
        }, account);
        await this.page.reload();
        await this.page.waitForLoadState('domcontentloaded');
        // The active account renders as a readonly <input value="…"> in the top bar.
        await expect(this.page.locator(`input[value="${account.address}"]`)).toBeVisible();
    }

    /** Open the inbox email whose preview carries `refCode`, and wait for its body. */
    async openEmailByRefCode(refCode: string): Promise<void> {
        await this.page.getByText(refCode).first().click();
        await expect(this.emailSubject).toBeVisible();
    }
}
