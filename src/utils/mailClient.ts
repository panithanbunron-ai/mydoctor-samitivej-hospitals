import { type APIRequestContext } from '@playwright/test';

/** A backoffice OTP email, parsed into the fields the tests assert on. */
export type OtpEmail = {
    id: string;
    fromAddress: string;
    fromName: string;
    /** Every recipient address (to + cc + bcc) — used to prove delivery went only to the mailbox. */
    recipients: string[];
    subject: string;
    /** The body text, whitespace-collapsed to a single line. */
    text: string;
    /** The name in the "Dear user <name>," greeting. */
    greetingName: string;
    otp: string;
    refCode: string;
    /** When the mail server received the email (its own clock, so free of local skew). */
    receivedAt: Date;
};

/** The mail.tm account plus its token — what the web SPA restores from localStorage. */
export type AccountSession = { address: string; token: string; [key: string]: unknown };

/** Body format: "Dear user <first> <last>, Your OTP Code is : <OTP> and Ref.Code : <RefCode>". */
const BODY_PATTERN = /^Dear user (.+?), Your OTP Code is : (\d+) and Ref\.Code : ([A-Z0-9]+)$/;

/**
 * Thin client over the mail.tm REST API (https://docs.mail.tm) for reading the
 * OTP email the backoffice sends to the registered address. Preferred over
 * driving the mail.tm web UI: no second browser, and message read/delete are
 * single HTTP calls. All requests use absolute URLs so the fixture's baseURL
 * (the app under test) is ignored.
 */
export class MailClient {
    private constructor(
        private readonly request: APIRequestContext,
        private readonly apiURL: string,
        private readonly token: string,
    ) {}

    /** Authenticate against mail.tm and return a client bound to the account's token. */
    static async login(
        request: APIRequestContext,
        config: { apiURL: string; address: string; password: string },
    ): Promise<MailClient> {
        const res = await request.post(`${config.apiURL}/token`, {
            data: { address: config.address, password: config.password },
        });
        if (!res.ok()) {
            throw new Error(`mail.tm auth failed (${res.status()}): ${await res.text()}`);
        }
        const { token } = await res.json();
        return new MailClient(request, config.apiURL, token);
    }

    private get auth() {
        return { Authorization: `Bearer ${this.token}` };
    }

    /** The account object plus token, for seeding the mail.tm web SPA's localStorage. */
    async account(): Promise<AccountSession> {
        const res = await this.request.get(`${this.apiURL}/me`, { headers: this.auth });
        return { ...(await res.json()), token: this.token };
    }

    /** Message summaries, newest first (mail.tm's default order). */
    // Message summaries carry `intro` (the body preview, which already contains the
    // "Ref.Code : XXX" line) so we can match without fetching each message in full.
    private async list(): Promise<Array<{ id: string; intro?: string }>> {
        const res = await this.request.get(`${this.apiURL}/messages`, { headers: this.auth });
        // Tolerate throttling (429/5xx): treat as "nothing yet" and let the caller retry.
        if (!res.ok()) return [];
        return (await res.json())['hydra:member'] ?? [];
    }

    private async fetch(id: string): Promise<OtpEmail> {
        const res = await this.request.get(`${this.apiURL}/messages/${id}`, { headers: this.auth });
        const m = await res.json();
        const recipients = [...(m.to ?? []), ...(m.cc ?? []), ...(m.bcc ?? [])].map(
            (r: { address: string }) => r.address,
        );
        const text = String(m.text ?? '')
            .replace(/\s+/g, ' ')
            .trim();
        const [, greetingName = '', otp = '', refCode = ''] = text.match(BODY_PATTERN) ?? [];
        return {
            id: m.id,
            fromAddress: m.from?.address ?? '',
            fromName: m.from?.name ?? '',
            recipients,
            subject: m.subject ?? '',
            text,
            greetingName,
            otp,
            refCode,
            receivedAt: new Date(m.createdAt),
        };
    }

    async delete(id: string): Promise<void> {
        await this.request.delete(`${this.apiURL}/messages/${id}`, { headers: this.auth });
    }

    /**
     * Purge every message except `keepId`. UAT reuses a valid OTP across logins and
     * only e-mails it once, so we must keep the live code's email (deleting it would
     * leave the reused on-screen code unverifiable) while dropping stale codes.
     */
    async keepOnly(keepId: string): Promise<void> {
        for (const m of await this.list()) if (m.id !== keepId) await this.delete(m.id);
    }

    /** Keep only the newest message (the currently-valid OTP), deleting the rest. */
    async keepNewest(): Promise<void> {
        const [newest, ...stale] = await this.list();
        if (!newest) return;
        for (const m of stale) await this.delete(m.id);
    }

    /**
     * Poll the inbox until an OTP email whose Ref.Code matches `refCode` arrives,
     * or throw after `timeoutMs`. Matching on the on-screen Ref.Code (rather than
     * "newest email") guarantees we read the message for this exact login.
     */
    async waitForOtpEmail(refCode: string, timeoutMs = 60_000, intervalMs = 2_000): Promise<OtpEmail> {
        const deadline = Date.now() + timeoutMs;
        for (;;) {
            // Match on the list preview (`intro`) to avoid fetching every message each
            // poll, which otherwise hits mail.tm's rate limit on a busy inbox.
            const match = (await this.list()).find((m) => (m.intro ?? '').includes(refCode));
            if (match) return this.fetch(match.id);
            if (Date.now() >= deadline) {
                throw new Error(`No OTP email with Ref.Code ${refCode} within ${timeoutMs}ms`);
            }
            await new Promise((r) => setTimeout(r, intervalMs));
        }
    }
}

export { BODY_PATTERN };
