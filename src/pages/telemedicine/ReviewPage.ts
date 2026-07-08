import { type Page, type Locator } from '@playwright/test';
import { reviewTexts } from '../../test-data/telemedicine/review';
import { type LangCode } from '../../test-data/telemedicine/agreement';
import { SuccessPage } from './SuccessPage';

export class ReviewPage {
    /** Path the Call page's Cancel button navigates to. */
    static readonly path = '/review';

    readonly page: Page;
    /** The optional free-text suggestions field. */
    readonly suggestionsField: Locator;

    constructor(page: Page) {
        this.page = page;
        this.suggestionsField = page.locator('#comment');
    }

    /** On-screen question text at `index` (0-based, on-screen order). */
    questionText(lang: LangCode, index: number): Locator {
        return this.page.getByText(reviewTexts[lang].questions[index]).first();
    }

    /** Suggestions field label. */
    suggestionsLabel(lang: LangCode): Locator {
        return this.page.getByText(reviewTexts[lang].suggestionsLabel).first();
    }

    /** Star rating buttons for the question at `index` (0-based), in on-screen 1-to-5 order. */
    starButtons(index: number): Locator {
        return this.page
            .locator('div.flex.justify-center.my-4')
            .nth(index)
            .locator('button[aria-label*="star"]');
    }

    // A filled run of stars shares one image asset; an unfilled tail uses a different one, so counting matches against the first star's asset gives the rating.
    async ratingValue(index: number): Promise<number> {
        const sources = await this.starButtons(index)
            .locator('img')
            .evaluateAll((imgs) => imgs.map((img) => (img as HTMLImageElement).src));
        const filled = sources[0];
        return sources.filter((source) => source === filled).length;
    }

    /** The "Submit Review" button. */
    submitButton(lang: LangCode): Locator {
        return this.page.locator('button:visible', { hasText: reviewTexts[lang].submit }).first();
    }

    /** From the Review page, tap Submit and land on the Success page. */
    async proceedToSuccess(lang: LangCode): Promise<SuccessPage> {
        await Promise.all([
            this.page.waitForURL(`**${SuccessPage.path}`),
            this.submitButton(lang).click(),
        ]);
        return new SuccessPage(this.page);
    }
}
