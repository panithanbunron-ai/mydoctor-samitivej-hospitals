import { type Page, type Locator } from '@playwright/test';
import { registerTexts } from '../../test-data/register';
import { type LangCode } from '../../test-data/agreement';
import { ConfirmPage } from './ConfirmPage';

export class RegisterPage {
    /** Path the Agreement page's Confirm button navigates to. */
    static readonly path = '/register';

    readonly page: Page;
    /** Header language toggle (TH/EN). Present on Agreement, expected absent here. */
    readonly languageToggle: Locator;
    /** SweetAlert2 popup shown when submitting with required fields blank. */
    readonly errorPopup: Locator;
    /** The red X icon inside the error popup. */
    readonly errorPopupIcon: Locator;

    constructor(page: Page) {
        this.page = page;
        this.languageToggle = page.locator('button').filter({ hasText: /^(TH|EN)$/ });
        this.errorPopup = page.locator('.swal2-popup');
        this.errorPopupIcon = this.errorPopup.locator('.swal2-icon.swal2-error');
    }

    /** The "Next" button that submits the register form. */
    nextButton(lang: LangCode): Locator {
        return this.page.locator('button:visible', { hasText: registerTexts[lang].next }).first();
    }

    /** Required-field label above the first-name input. */
    firstNameLabel(lang: LangCode): Locator {
        return this.page.getByText(registerTexts[lang].firstNameLabel).first();
    }

    /** Required-field label above the last-name input. */
    lastNameLabel(lang: LangCode): Locator {
        return this.page.getByText(registerTexts[lang].lastNameLabel).first();
    }

    /** The first-name input, located by its (language-specific) placeholder. */
    firstNameField(lang: LangCode): Locator {
        return this.page.getByPlaceholder(registerTexts[lang].firstNamePlaceholder, {
            exact: true,
        });
    }

    /** The last-name input, located by its (language-specific) placeholder. */
    lastNameField(lang: LangCode): Locator {
        return this.page.getByPlaceholder(registerTexts[lang].lastNamePlaceholder, { exact: true });
    }

    /** The telephone input, located by its (language-specific) placeholder. */
    phoneField(lang: LangCode): Locator {
        return this.page.getByPlaceholder(registerTexts[lang].phonePlaceholder);
    }

    /** Fill whichever of the three form fields are provided; omitted fields are left untouched. */
    async fillForm(
        lang: LangCode,
        data: { firstName?: string; lastName?: string; phone?: string },
    ): Promise<void> {
        if (data.firstName !== undefined) await this.firstNameField(lang).fill(data.firstName);
        if (data.lastName !== undefined) await this.lastNameField(lang).fill(data.lastName);
        if (data.phone !== undefined) await this.phoneField(lang).fill(data.phone);
    }

    /** From a completely filled form, submit via Next and land on the Confirm page. */
    async proceedToConfirm(lang: LangCode): Promise<ConfirmPage> {
        await Promise.all([
            this.page.waitForURL(`**${ConfirmPage.path}`),
            this.nextButton(lang).click(),
        ]);
        return new ConfirmPage(this.page);
    }
}
