import { type Page, type Locator } from '@playwright/test';
import { callTexts } from '../../test-data/telemedicine/call';
import { type LangCode } from '../../test-data/telemedicine/agreement';

export class CallPage {
    /** Path the Confirm page's Start button navigates to. */
    static readonly path = '/call';

    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /** The "Cancel" button shown while waiting to connect to a representative. */
    cancelButton(lang: LangCode): Locator {
        return this.page.locator('button:visible', { hasText: callTexts[lang].cancel }).first();
    }
}
