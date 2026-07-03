import { type Page, type Locator, expect } from '@playwright/test';
import { AGREEMENT_COPY, type LangCode } from '../../test-data/agreement';

export type { LangCode };

export class AgreementPage {
    readonly page: Page;
    readonly languageToggle: Locator;
    readonly serviceConsentCheckbox: Locator;
    readonly readAgreementAlert: Locator;

    constructor(page: Page) {
        this.page = page;
        this.languageToggle = page
            .locator('button')
            .filter({ hasText: /^(TH|EN)$/ })
            .first();
        this.serviceConsentCheckbox = page.locator('input[type="checkbox"]').first();
        this.readAgreementAlert = page.locator('.swal2-popup');
    }

    async goto(): Promise<void> {
        await this.page.goto('/');
    }

    async currentLanguage(): Promise<LangCode> {
        return (await this.languageToggle.innerText()).trim() as LangCode;
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

    // :visible avoids clashing with off-screen confirm-dialog buttons of the same label.
    private visibleButton(text: string): Locator {
        return this.page.locator('button:visible', { hasText: text }).first();
    }

    confirmButton(lang: LangCode): Locator {
        return this.visibleButton(AGREEMENT_COPY[lang].confirm);
    }

    async expectCopy(lang: LangCode): Promise<void> {
        const copy = AGREEMENT_COPY[lang];
        for (const part of copy.headingParts) {
            await expect(this.page.getByText(part).first()).toBeVisible();
        }
        await expect(this.page.getByText(copy.serviceConsent).first()).toBeVisible();
        await expect(this.page.getByText(copy.marketingConsent).first()).toBeVisible();
        await expect(this.visibleButton(copy.cancel)).toBeVisible();
        await expect(this.visibleButton(copy.confirm)).toBeVisible();
    }

    async expectHeadingHidden(lang: LangCode): Promise<void> {
        await expect(
            this.page.getByText(AGREEMENT_COPY[lang].headingParts[0]).first(),
        ).toBeHidden();
    }
}
