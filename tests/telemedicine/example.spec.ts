import { test, expect } from '@playwright/test';

/**
 * Tests for my-doctor-telemedicine.
 * baseURL is set per-project in playwright.config.ts (TELEMEDICINE_URL),
 * so page.goto('/') targets the telemedicine app.
 */
test('telemedicine home page loads', async ({ page }) => {
    await page.goto('/');

    // TODO: replace with a real assertion for the telemedicine app.
    await expect(page).toHaveTitle(/.+/);
});
