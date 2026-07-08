import { type Page, type Locator, expect } from '@playwright/test';
import { successTexts } from '../../test-data/telemedicine/success';
import { type LangCode } from '../../test-data/telemedicine/agreement';

export class SuccessPage {
    /** Path the Review page's Submit button navigates to. */
    static readonly path = '/success';

    readonly page: Page;
    /** Header language toggle (TH/EN), same shared header component as the other pages. */
    readonly languageToggle: Locator;
    /** The "Close" button that ends the flow. */
    readonly closeButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.languageToggle = page
            .locator('button')
            .filter({ hasText: /^(TH|EN)$/ })
            .first();
        this.closeButton = page.locator('#dismissButton');
    }

    /** Thank-you message shown for `lang`. */
    message(lang: LangCode): Locator {
        return this.page.getByText(successTexts[lang].message).first();
    }

    async switchLanguage(target: LangCode): Promise<void> {
        await this.languageToggle.click();
        // Dropdown options are full-width buttons; the header toggle is not.
        await this.page
            .locator('button.w-full')
            .filter({ hasText: new RegExp(`^${target}$`) })
            .click();
        await expect(this.languageToggle).toHaveText(target);
    }

    /** Tap Close; the app performs a full navigation back to "/" (the Agreement page). */
    async close(): Promise<void> {
        await Promise.all([this.page.waitForURL('**/'), this.closeButton.click()]);
    }
}
