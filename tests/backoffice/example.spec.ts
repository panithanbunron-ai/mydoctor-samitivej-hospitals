import { test, expect } from '@playwright/test';

/**
 * Tests for my-doctor-backoffice.
 * baseURL is set per-project in playwright.config.ts (BACKOFFICE_URL),
 * so page.goto('/') targets the backoffice app.
 */
test('backoffice home page loads', async ({ page }) => {
    await page.goto('/');

    // TODO: replace with a real assertion for the backoffice app.
    await expect(page).toHaveTitle(/.+/);
});
