import { type Page, type Locator } from '@playwright/test';
import { adminTexts } from '../../test-data/backoffice/admin';

export class AdminPage {
    /** System Administrator list, and the Create/Edit form it opens. Observed on UAT. */
    static readonly listPath = '/Admin';
    static readonly detailPath = '/Admin/AdminDetail';

    readonly page: Page;
    /** Sidebar menu icon — an alt-less <img>, so locate it by src rather than role/name. */
    readonly menuIcon: Locator;
    readonly adminMenuItem: Locator;
    readonly addAdminButton: Locator;
    readonly saveButton: Locator;
    readonly cancelButton: Locator;
    /** The สิทธิ์ dropdown — the only native select on the form (โรงพยาบาล is a select2 textbox). */
    readonly permissionSelect: Locator;
    /** Required-field error under the "ชื่อ" input, shown only after clicking Save. */
    readonly firstNameRequired: Locator;

    constructor(page: Page) {
        this.page = page;
        this.menuIcon = page.locator(`img[src="${adminTexts.menuIconSrc}"]`);
        this.adminMenuItem = page.getByRole('link', {
            name: adminTexts.adminMenuItem,
            exact: true,
        });
        // Legacy MVC markup — the "เพิ่ม" control may render as a button or a styled link.
        this.addAdminButton = page
            .getByRole('button', { name: adminTexts.addAdminButton })
            .or(page.getByRole('link', { name: adminTexts.addAdminButton }));
        this.saveButton = page.getByRole('button', { name: adminTexts.saveButton });
        this.cancelButton = page.getByRole('button', { name: adminTexts.cancelButton });
        this.permissionSelect = page.getByRole('combobox');
        // Other blank fields show the same copy; the ชื่อ row is the first in the form.
        this.firstNameRequired = page.getByText(adminTexts.firstNameRequired).first();
    }

    /** Dashboard -> menu icon (dicut/6.png) -> ผู้ดูแลระบบ -> เพิ่ม -> blank Create Admin form. */
    async openCreateAdminForm(): Promise<void> {
        await this.menuIcon.click();
        await this.adminMenuItem.click();
        await this.addAdminButton.click();
        await this.saveButton.waitFor({ state: 'visible' });
        // The form renders before the bottom script bundles load; Save's onclick needs them.
        await this.page.waitForLoadState('load');
    }

    /** A Create Admin text input, located by its placeholder. */
    field(placeholder: string): Locator {
        return this.page.getByPlaceholder(placeholder);
    }

    /** Fill whichever text fields are provided; omitted fields are left untouched. */
    async fillForm(data: {
        firstName?: string;
        lastName?: string;
        username?: string;
        password?: string;
        confirmPassword?: string;
        email?: string;
    }): Promise<void> {
        const p = adminTexts.placeholders;
        if (data.firstName !== undefined) await this.field(p.firstName).fill(data.firstName);
        if (data.lastName !== undefined) await this.field(p.lastName).fill(data.lastName);
        if (data.username !== undefined) await this.field(p.username).fill(data.username);
        if (data.password !== undefined) await this.field(p.password).fill(data.password);
        if (data.confirmPassword !== undefined)
            await this.field(p.confirmPassword).fill(data.confirmPassword);
        if (data.email !== undefined) await this.field(p.email).fill(data.email);
    }

    // Save first AJAX-checks Email/Username via AdminUserCheck and only submits/validates after
    // that round trip — so the pre-check firing is the proof the click landed.
    async save(): Promise<void> {
        for (let attempt = 0; ; attempt++) {
            const precheck = this.page
                .waitForResponse(/AdminUserCheck/, { timeout: 5_000 })
                .then(() => true)
                .catch(() => false);
            await this.saveButton.click();
            // Late layout shifts (webfont/chosen init) can drop the click on the fieldset instead.
            if (await precheck) return;
            if (attempt >= 3)
                throw new Error('Save click never triggered the AdminUserCheck pre-check.');
        }
    }
}
