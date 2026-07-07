import { type Page, type Locator, expect } from '@playwright/test';
import {
    agreementTexts,
    type LangCode,
    type ConsentKind,
} from '../../test-data/telemedicine/agreement';
import { RegisterPage } from './RegisterPage';

export type { LangCode, ConsentKind };

export class AgreementPage {
    readonly page: Page;
    readonly languageToggle: Locator;
    readonly serviceConsentCheckbox: Locator;
    readonly marketingConsentCheckbox: Locator;
    readonly readAgreementAlert: Locator;
    /** The consent-detail popup opened by tapping a checkbox's label text. */
    readonly consentPopup: Locator;
    readonly consentPopupOkButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.languageToggle = page
            .locator('button')
            .filter({ hasText: /^(TH|EN)$/ })
            .first();
        this.serviceConsentCheckbox = this.consentCheckbox('service');
        this.marketingConsentCheckbox = this.consentCheckbox('marketing');
        this.readAgreementAlert = page.locator('.swal2-popup');
        // Extra class distinguishes it from the plain `.swal2-popup` read-agreement alert.
        this.consentPopup = page.locator('.swal2-popup.consent-swal-popup');
        this.consentPopupOkButton = this.consentPopup.locator('.swal2-confirm');
    }

    // Anchor on the row div directly holding the checkbox plus its label text (either language) — survives added/reordered checkboxes.
    private consentCheckbox(kind: ConsentKind): Locator {
        const key = kind === 'service' ? 'serviceConsent' : 'marketingConsent';
        const label = new RegExp(`${agreementTexts.TH[key]}|${agreementTexts.EN[key]}`);
        return this.page
            .locator('div:has(> input[type="checkbox"])')
            .filter({ hasText: label })
            .locator('input[type="checkbox"]');
    }

    /** The tappable label text next to a consent checkbox. */
    consentLabel(lang: LangCode, kind: ConsentKind): Locator {
        const text =
            kind === 'service'
                ? agreementTexts[lang].serviceConsent
                : agreementTexts[lang].marketingConsent;
        return this.page.getByText(text).first();
    }

    /** Tap a checkbox's label text to open its consent-detail popup. */
    async openConsentPopup(lang: LangCode, kind: ConsentKind): Promise<void> {
        await this.consentLabel(lang, kind).click();
        await this.consentPopup.waitFor({ state: 'visible' });
    }

    /** Dismiss the consent popup via its OK button. */
    async closeConsentPopup(): Promise<void> {
        await this.consentPopupOkButton.click();
        await this.consentPopup.waitFor({ state: 'hidden' });
    }

    async goto(): Promise<void> {
        // "/" redirects to "/?openExternalBrowser=1", aborting the initial nav under WebKit; wait for commit, swallow that abort, then settle.
        try {
            await this.page.goto('/', { waitUntil: 'commit' });
        } catch (err) {
            if (!/interrupted by another navigation/i.test(String(err))) throw err;
        }
        await this.page.waitForLoadState('domcontentloaded');
    }

    /** From a pristine Agreement page, accept the service consent and Confirm through to Register. */
    async proceedToRegister(): Promise<RegisterPage> {
        await this.goto();
        const lang = await this.currentLanguage();
        await this.scrollTermsToBottom();
        await this.serviceConsentCheckbox.click({ force: true });
        await expect(this.confirmButton(lang)).toBeEnabled();
        await Promise.all([
            this.page.waitForURL(`**${RegisterPage.path}`),
            this.confirmButton(lang).click(),
        ]);
        return new RegisterPage(this.page);
    }

    /** Scroll the terms to the bottom — the app's precondition for enabling checkbox 1. */
    async scrollTermsToBottom(): Promise<void> {
        await this.serviceConsentCheckbox.waitFor({ state: 'visible' });
        // Scroll region mounts after the checkboxes; find it heuristically (tallest scrollable element) and scroll to bottom.
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
        // eslint-disable-next-line playwright/no-wait-for-timeout -- app needs a beat after the scroll event before checkbox 1 unlocks
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
