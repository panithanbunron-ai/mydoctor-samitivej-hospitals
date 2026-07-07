import { type Page, type Locator } from '@playwright/test';
import { confirmTexts } from '../../test-data/confirm';
import { type LangCode } from '../../test-data/agreement';

export class ConfirmPage {
    /** Path the Register page's Next button navigates to. */
    static readonly path = '/confirm';

    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /** The "Start" button that begins the consultation. */
    startButton(lang: LangCode): Locator {
        return this.page.locator('button:visible', { hasText: confirmTexts[lang].start }).first();
    }

    /** On-screen step description at `index` (0-based, on-screen order). */
    stepText(lang: LangCode, index: number): Locator {
        return this.page.getByText(confirmTexts[lang].steps[index]).first();
    }
}
