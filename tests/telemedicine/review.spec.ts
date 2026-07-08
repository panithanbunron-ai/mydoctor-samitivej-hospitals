import { test, expect } from '../../src/fixtures/telemedicine';
import { type AgreementPage } from '../../src/pages/telemedicine/AgreementPage';
import { RegisterPage } from '../../src/pages/telemedicine/RegisterPage';
import { ConfirmPage } from '../../src/pages/telemedicine/ConfirmPage';
import { CallPage } from '../../src/pages/telemedicine/CallPage';
import { ReviewPage } from '../../src/pages/telemedicine/ReviewPage';
import { SuccessPage } from '../../src/pages/telemedicine/SuccessPage';
import { validRegistration } from '../../src/test-data/telemedicine/register';
import { reviewTexts, defaultRating } from '../../src/test-data/telemedicine/review';
import { type LangCode } from '../../src/test-data/telemedicine/agreement';
import { check } from '../../src/utils/visual-check';

// 'default' (not 'serial'): cases share the worker's page but each still runs if an earlier one fails.
test.describe.configure({ mode: 'default' });

// Cancelling right after Start (before a representative connects) routes to the Review page, skipping Operation.
async function gotoReview(
    agreement: AgreementPage,
): Promise<{ lang: LangCode; review: ReviewPage }> {
    await agreement.goto();
    const lang = await agreement.currentLanguage();
    const register = await agreement.proceedToRegister();
    expect(new URL(register.page.url()).pathname).toBe(RegisterPage.path);

    await register.fillForm(lang, validRegistration);
    const confirm = await register.proceedToConfirm(lang);
    expect(new URL(confirm.page.url()).pathname).toBe(ConfirmPage.path);

    const call = await confirm.proceedToCall(lang);
    expect(new URL(call.page.url()).pathname).toBe(CallPage.path);

    const review = await call.proceedToReview(lang);
    expect(new URL(review.page.url()).pathname).toBe(ReviewPage.path);

    return { lang, review };
}

test.describe('Telemedicine - Review', () => {
    test('TC_MDR_REV_001 : Verify both rating questions default to 5 stars when the Review page loads', async ({
        agreement,
        pageErrors,
    }) => {
        const { lang, review } = await gotoReview(agreement);

        // Wording: question text reads the expected copy for each question, in on-screen order.
        for (const [index, text] of reviewTexts[lang].questions.entries()) {
            await check(
                review.questionText(lang, index),
                `question ${index + 1} reads "${text}"`,
                (l) => expect(l).toBeVisible(),
            );
        }

        // UI/Behavior: both rating widgets show all 5 stars filled by default, before any interaction.
        for (const index of [0, 1]) {
            await check(
                review.starButtons(index),
                `question ${index + 1} rating defaults to ${defaultRating} stars`,
                async () => expect(await review.ratingValue(index)).toBe(defaultRating),
            );
        }

        expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toEqual([]);
    });

    test('TC_MDR_REV_002 : Verify the Submit Review button is always enabled, even without changing the default ratings', async ({
        agreement,
        pageErrors,
    }) => {
        const { lang, review } = await gotoReview(agreement);

        // Wording: button label reads "ส่งคำแนะนำ" (TH) / "Submit Review" (EN).
        // Behavior: button is enabled immediately, without any prior interaction.
        await check(
            review.submitButton(lang),
            `Submit Review button reads "${reviewTexts[lang].submit}" and is enabled`,
            async (l) => {
                await expect(l).toHaveText(reviewTexts[lang].submit);
                await expect(l).toBeEnabled();
            },
        );

        expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toEqual([]);
    });

    test('TC_MDR_REV_003 : Verify the Suggestions field is optional and the review can be submitted while it is left blank', async ({
        agreement,
        pageErrors,
    }) => {
        const { lang, review } = await gotoReview(agreement);

        // Wording: field label reads "คำแนะนำเพิ่มเติม" / "Suggestions"; placeholder reads "กรุณาระบุ" (TH) / "You suggestions" (EN).
        await check(
            review.suggestionsLabel(lang),
            `Suggestions label reads "${reviewTexts[lang].suggestionsLabel}"`,
            (l) => expect(l).toBeVisible(),
        );
        await check(
            review.suggestionsField,
            `Suggestions placeholder reads "${reviewTexts[lang].suggestionsPlaceholder}"`,
            (l) =>
                expect(l).toHaveAttribute('placeholder', reviewTexts[lang].suggestionsPlaceholder),
        );
        await expect(review.suggestionsField).toHaveValue('');

        // UI/Behavior: submitting with the field left blank proceeds without a validation error.
        const success = await review.proceedToSuccess(lang);
        expect(new URL(success.page.url()).pathname).toBe(SuccessPage.path);

        expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toEqual([]);
    });

    test('TC_MDR_REV_004 : Verify clicking Submit Review navigates to the Success page', async ({
        agreement,
        pageErrors,
    }) => {
        const { lang, review } = await gotoReview(agreement);

        const success = await review.proceedToSuccess(lang);

        // Behavior: navigation goes to path "/success".
        expect(new URL(success.page.url()).pathname).toBe(SuccessPage.path);

        expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toEqual([]);
    });
});
