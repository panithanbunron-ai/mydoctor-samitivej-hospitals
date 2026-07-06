import { type Page, type Locator, expect } from '@playwright/test';
import { agreementTexts, type LangCode } from '../../test-data/agreement';

export type { LangCode };

export class AgreementPage {
    readonly page: Page;
    readonly languageToggle: Locator;
    readonly serviceConsentCheckbox: Locator;
    readonly marketingConsentCheckbox: Locator;
    readonly readAgreementAlert: Locator;

    constructor(page: Page) {
        this.page = page;
        this.languageToggle = page
            .locator('button')
            .filter({ hasText: /^(TH|EN)$/ })
            .first();
        this.serviceConsentCheckbox = page.locator('input[type="checkbox"]').first();
        this.marketingConsentCheckbox = page.locator('input[type="checkbox"]').nth(1);
        this.readAgreementAlert = page.locator('.swal2-popup');
    }

    async goto(): Promise<void> {
        // The app immediately redirects "/" → "/?openExternalBrowser=1", which
        // interrupts the initial navigation and throws under WebKit. Wait only for
        // the commit, then settle on the post-redirect load.
        await this.page.goto('/', { waitUntil: 'commit' });
        await this.page.waitForLoadState('domcontentloaded');
    }

    /** Scroll the terms to the bottom — the app's precondition for enabling checkbox 1. */
    async scrollTermsToBottom(): Promise<void> {
        await this.serviceConsentCheckbox.waitFor({ state: 'visible' });
        // The terms scroll region mounts after the checkboxes; poll for it (tallest
        // scrollable element, no brittle selector), then scroll it to the bottom.
        await this.page.waitForFunction(() => {
            let target: HTMLElement | null = null;
            let maxDelta = 0;
            document.querySelectorAll<HTMLElement>('*').forEach((el) => {
                const overflowY = getComputedStyle(el).overflowY;
                const scrollable = overflowY === 'auto' || overflowY === 'scroll';
                const delta = el.scrollHeight - el.clientHeight;
                if (scrollable && el.clientHeight > 100 && delta > maxDelta) {
                    maxDelta = delta;
                    target = el;
                }
            });
            if (!target) return false;
            const el = target as HTMLElement;
            el.scrollTop = el.scrollHeight;
            el.dispatchEvent(new Event('scroll', { bubbles: true }));
            return true;
        });
        await this.page.waitForTimeout(300);
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
        return this.visibleButton(agreementTexts[lang].confirm);
    }

    cancelButton(lang: LangCode): Locator {
        return this.visibleButton(agreementTexts[lang].cancel);
    }

    headingLocator(lang: LangCode): Locator {
        return this.page.getByText(agreementTexts[lang].headingParts[0]).first();
    }

    /** Each tracked piece of text for `lang`, with a label for reporting. */
    textElements(lang: LangCode): { label: string; locator: Locator }[] {
        const texts = agreementTexts[lang];
        return [
            ...texts.headingParts.map((text, i) => ({
                label: `${lang} heading part ${i + 1}`,
                locator: this.page.getByText(text).first(),
            })),
            {
                label: `${lang} service-consent label`,
                locator: this.page.getByText(texts.serviceConsent).first(),
            },
            {
                label: `${lang} marketing-consent label`,
                locator: this.page.getByText(texts.marketingConsent).first(),
            },
            {
                label: `${lang} Cancel button`,
                locator: this.visibleButton(texts.cancel),
            },
            {
                label: `${lang} Confirm button`,
                locator: this.confirmButton(lang),
            },
        ];
    }
}
