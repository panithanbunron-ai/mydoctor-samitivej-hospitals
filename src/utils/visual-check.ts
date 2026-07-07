import { expect, test, type Locator, type Page } from '@playwright/test';

type Assertion = (locator: Locator) => Promise<void>;

/** Run `assertion` as a soft check: draw a Pass/Fail box, attach an annotated screenshot, and keep going on failure. */
export async function check(
    locator: Locator,
    label: string,
    assertion: Assertion,
): Promise<boolean> {
    const page = locator.page();

    let passed = true;
    let message = '';
    try {
        await assertion(locator);
    } catch (err) {
        passed = false;
        message = err instanceof Error ? err.message : String(err);
    }

    let box: Awaited<ReturnType<Locator['boundingBox']>> = null;
    try {
        await locator.first().scrollIntoViewIfNeeded({ timeout: 1000 });
        box = await locator.first().boundingBox();
    } catch {
        // Not present/visible (e.g. an intentionally-hidden check) — banner-only annotation.
    }

    // Strip Playwright's ANSI color codes and keep the first line for the banner/title.
    const reason = message
        .replace(/\u001b\[[0-9;]*m/g, '')
        .split('\n')[0]
        .trim();

    const screenshot = await annotate(page, box, label, passed, reason);
    const title = passed ? `PASS — ${label}` : `FAIL — ${label}${reason ? ` — ${reason}` : ''}`;
    await test.info().attach(title, {
        body: screenshot,
        contentType: 'image/png',
    });

    expect.soft(passed, message ? `${label} — ${message}` : label).toBe(true);
    return passed;
}

/** Draw the highlight box + status banner, screenshot, then clean up. */
async function annotate(
    page: Page,
    box: { x: number; y: number; width: number; height: number } | null,
    label: string,
    passed: boolean,
    reason: string,
): Promise<Buffer> {
    await page.evaluate(
        ({ box, label, passed, reason }) => {
            const color = passed ? '#22c55e' : '#ef4444';
            const status = passed ? 'PASS' : 'FAIL';
            document.getElementById('__vcheck__')?.remove();

            const root = document.createElement('div');
            root.id = '__vcheck__';
            root.style.cssText =
                'position:fixed;inset:0;z-index:2147483647;pointer-events:none;font-family:system-ui,sans-serif;';

            if (box) {
                const rect = document.createElement('div');
                rect.style.cssText = `position:fixed;left:${box.x - 4}px;top:${box.y - 4}px;width:${box.width + 8}px;height:${box.height + 8}px;border:3px solid ${color};border-radius:6px;box-shadow:0 0 0 3px rgba(0,0,0,.15);`;
                root.appendChild(rect);

                const tag = document.createElement('div');
                tag.textContent = `${status}: ${label}`;
                tag.style.cssText = `position:fixed;left:${box.x - 4}px;top:${Math.max(2, box.y - 28)}px;background:${color};color:#fff;font-size:13px;font-weight:600;padding:2px 8px;border-radius:4px;white-space:nowrap;`;
                root.appendChild(tag);
            }

            const banner = document.createElement('div');
            banner.style.cssText = `position:fixed;top:10px;right:10px;max-width:70vw;background:${color};color:#fff;font-size:14px;font-weight:700;padding:6px 12px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,.25);`;
            const head = document.createElement('div');
            head.textContent = `${status}: ${label}`;
            banner.appendChild(head);
            if (!passed && reason) {
                const detail = document.createElement('div');
                detail.textContent = reason;
                detail.style.cssText =
                    'margin-top:4px;font-size:12px;font-weight:500;line-height:1.3;white-space:pre-wrap;';
                banner.appendChild(detail);
            }
            root.appendChild(banner);

            document.body.appendChild(root);
        },
        { box, label, passed, reason },
    );

    // Viewport screenshot so the fixed overlay aligns with the boundingBox coordinates.
    const buffer = await page.screenshot();
    await page.evaluate(() => document.getElementById('__vcheck__')?.remove());
    return buffer;
}
