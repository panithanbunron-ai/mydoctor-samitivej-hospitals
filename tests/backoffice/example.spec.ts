import { test, expect } from '@playwright/test';

// Backoffice project sets baseURL to BACKOFFICE_URL, so page.goto('/') targets the backoffice app.
test('backoffice home page loads', async ({ page }) => {
    await page.goto('/');

    // TODO: replace with a real assertion for the backoffice app.
    await expect(page).toHaveTitle(/.+/);
});
