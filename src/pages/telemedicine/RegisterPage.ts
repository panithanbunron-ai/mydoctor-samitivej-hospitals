import { type Page, type Locator } from '@playwright/test';
import { registerTexts } from '../../test-data/register';
import { type LangCode } from '../../test-data/agreement';

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

    /** The telephone input, located by its (language-specific) placeholder. */
    phoneField(lang: LangCode): Locator {
        return this.page.getByPlaceholder(registerTexts[lang].phonePlaceholder);
    }
}
