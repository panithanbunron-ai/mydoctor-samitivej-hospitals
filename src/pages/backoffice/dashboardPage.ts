import { type Page, type Locator } from '@playwright/test';
import { dashboardTexts } from '../../test-data/backoffice/dashboard';

export class DashboardPage {
    /** Landing page after a successful password reset. Path inferred — correct against live UAT. */
    static readonly path = '/Dashboard';

    readonly page: Page;
    // Selectors inferred from the test-case spec — the dashboard markup was not
    // observable when written; correct against live UAT if any assertion misses.
    readonly logo: Locator;
    readonly breadcrumb: Locator;
    /** Account name + dropdown at the top-right of the nav bar. */
    readonly accountMenu: Locator;
    readonly muteButton: Locator;

    // The four queue tabs. Each label carries a live count, so match by base label text.
    readonly waitingNurseTab: Locator;
    readonly nurseRoomTab: Locator;
    readonly waitingDoctorTab: Locator;
    readonly doctorRoomTab: Locator;

    /** Incoming-call card and its controls (present only when a call is queued). */
    readonly incomingCallCard: Locator;
    readonly incomingCallHeader: Locator;
    readonly waitTime: Locator;
    readonly informationButton: Locator;
    readonly startCallButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.logo = page.getByText(dashboardTexts.logoText, { exact: false }).first();
        this.breadcrumb = page.getByText(dashboardTexts.breadcrumb);
        this.accountMenu = page.locator('.dropdown-toggle, [class*="account"]').first();
        this.muteButton = page.getByRole('button', { name: dashboardTexts.muteButton });

        this.waitingNurseTab = this.tab(dashboardTexts.tabs.waitingNurse);
        this.nurseRoomTab = this.tab(dashboardTexts.tabs.nurseRoom);
        this.waitingDoctorTab = this.tab(dashboardTexts.tabs.waitingDoctor);
        this.doctorRoomTab = this.tab(dashboardTexts.tabs.doctorRoom);

        this.incomingCallCard = page
            .locator('.card, [class*="card"]')
            .filter({ hasText: dashboardTexts.incomingCall.headerPattern })
            .first();
        this.incomingCallHeader = this.incomingCallCard.getByText(
            dashboardTexts.incomingCall.headerPattern,
        );
        this.waitTime = this.incomingCallCard.getByText(dashboardTexts.incomingCall.waitTimeLabel);
        this.informationButton = this.incomingCallCard.getByRole('button', {
            name: dashboardTexts.incomingCall.informationButton,
        });
        this.startCallButton = this.incomingCallCard.getByRole('button', {
            name: dashboardTexts.incomingCall.startCallButton,
        });
    }

    /** A queue tab whose label starts with `label` — the "(n)" count is appended live. */
    // UAT renders the tabs as plain links (Bootstrap nav, no role=tab), some with a space before "(n)".
    tab(label: string): Locator {
        const name = new RegExp(`^${label}\\s*\\(\\d+\\)`);
        return this.page.getByRole('tab', { name }).or(this.page.getByRole('link', { name }));
    }

    async waitFor(): Promise<void> {
        await this.waitingNurseTab.waitFor({ state: 'visible' });
    }

    /** Live count parsed from a tab's "(n)" suffix; -1 if the tab text has no count. */
    async tabCount(tab: Locator): Promise<number> {
        const text = (await tab.innerText()).trim();
        const match = text.match(dashboardTexts.tabCountPattern);
        return match ? Number(match[1]) : -1;
    }

    /** Value shown beside a field label on the incoming-call card. */
    fieldValue(label: string): Locator {
        return this.incomingCallCard
            .locator('[class*="row"], li, tr')
            .filter({ hasText: label })
            .locator('[class*="value"], td, span')
            .last();
    }
}
