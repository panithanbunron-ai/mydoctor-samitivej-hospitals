import { type Page, type Locator, expect } from '@playwright/test';
import { confirmTexts } from '../../test-data/telemedicine/confirm';
import { type LangCode } from '../../test-data/telemedicine/agreement';
import { CallPage } from './CallPage';

export class ConfirmPage {
    /** Path the Register page's Next button navigates to. */
    static readonly path = '/confirm';

    readonly page: Page;
    /** Header language toggle (TH/EN), same shared header component as the Agreement page. */
    readonly languageToggle: Locator;

    constructor(page: Page) {
        this.page = page;
        this.languageToggle = page
            .locator('button')
            .filter({ hasText: /^(TH|EN)$/ })
            .first();
    }

    /** The "Start" button that begins the consultation. */
    startButton(lang: LangCode): Locator {
        return this.page.locator('button:visible', { hasText: confirmTexts[lang].start }).first();
    }

    /** On-screen step description at `index` (0-based, on-screen order). */
    stepText(lang: LangCode, index: number): Locator {
        return this.page.getByText(confirmTexts[lang].steps[index]).first();
    }

    /** Top step icon image at `index` (0-based); alt text reads "step N" regardless of language. */
    stepIcon(index: number): Locator {
        return this.page.getByAltText(`step ${index + 1}`);
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

    /** From the Confirm page, tap Start and land on the Call page. */
    async proceedToCall(lang: LangCode): Promise<CallPage> {
        await Promise.all([
            this.page.waitForURL(`**${CallPage.path}`),
            this.startButton(lang).click(),
        ]);
        return new CallPage(this.page);
    }
}
