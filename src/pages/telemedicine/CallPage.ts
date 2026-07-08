import { type Page, type Locator } from '@playwright/test';
import { callTexts } from '../../test-data/telemedicine/call';
import { type LangCode } from '../../test-data/telemedicine/agreement';
import { ReviewPage } from './ReviewPage';

export class CallPage {
    /** Path the Confirm page's Start button navigates to. */
    static readonly path = '/call';

    readonly page: Page;
    // Cancelling before this resolves throws "No transaction ID found" and the app reloads /call; listen from construction to avoid missing it.
    private readonly queueReady: Promise<unknown>;

    constructor(page: Page) {
        this.page = page;
        // Swallow so it never surfaces as an unhandled rejection for callers (e.g. TC_MDR_CFM_003) that never await it.
        // eslint-disable-next-line playwright/missing-playwright-await -- awaited later, in proceedToReview
        this.queueReady = page
            .waitForResponse((r) => r.url().includes('/Transaction/CreateQueue') && r.ok())
            .catch(() => undefined);
    }

    /** The "Cancel" button shown while waiting to connect to a representative. */
    cancelButton(lang: LangCode): Locator {
        return this.page.locator('button:visible', { hasText: callTexts[lang].cancel }).first();
    }

    /** From the Call page, tap Cancel and land on the Review page (cancelling mid-call skips straight to review). */
    async proceedToReview(lang: LangCode): Promise<ReviewPage> {
        await this.queueReady;
        await Promise.all([
            this.page.waitForURL(`**${ReviewPage.path}`),
            this.cancelButton(lang).click(),
        ]);
        return new ReviewPage(this.page);
    }
}
