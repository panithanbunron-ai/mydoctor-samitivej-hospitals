import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/backoffice/LoginPage';
import {
    loginTexts,
    unregisteredCredentials,
    wrongPassword,
    usernameOnly,
    backofficeCredentials,
} from '../../src/test-data/backoffice/login';
import { check } from '../../src/utils/visual-check';

test.describe('Backoffice - Login', () => {
    test('TC_MDR_LOGIN_001a : Verify the login page renders the logo, Username, Password and LOGIN button', async ({
        page,
    }) => {
        const login = new LoginPage(page);
        await login.goto();

        // Precondition: we're on the login page.
        expect(new URL(page.url()).pathname).toBe(LoginPage.path);

        // UI: the login page renders logo, Username field, Password field and LOGIN button.
        await check(login.logo, 'my doctor logo shown', (l) => expect(l).toBeVisible());
        await check(login.usernameField, 'Username field shown', (l) => expect(l).toBeVisible());
        await check(login.passwordField, 'Password field shown', (l) => expect(l).toBeVisible());
        await check(login.loginButton, 'LOGIN button shown', (l) => expect(l).toBeVisible());
        await check(login.loginButton, `LOGIN button reads "${loginTexts.loginButton}"`, (l) =>
            expect(l).toHaveText(loginTexts.loginButton),
        );
    });

    test('TC_MDR_LOGIN_001b : Verify a valid username and password logs in and redirects to the OTP page', async ({
        page,
    }) => {
        // Real account only — a proper skip so the report shows the missing coverage.
        test.skip(
            !backofficeCredentials.username || !backofficeCredentials.password,
            'Set BACKOFFICE_USERNAME and BACKOFFICE_PASSWORD to run the OTP-redirect case.',
        );

        const login = new LoginPage(page);
        await login.goto();

        // Enter valid credentials and submit.
        await login.fill({
            username: backofficeCredentials.username,
            password: backofficeCredentials.password,
        });
        await login.submit();

        // Behavior + wording: the OTP page shows a Ref.Code and a VERIFY OTP button.
        await login.otpForm.waitFor({ state: 'visible' });
        await check(login.refCode, 'OTP page shows a Ref.Code value', (l) =>
            expect(l).toBeVisible(),
        );
        await check(login.verifyOtpButton, 'VERIFY OTP button shown', (l) =>
            expect(l).toBeVisible(),
        );
    });

    test('TC_MDR_LOGIN_002 : Verify an invalid/unregistered username is rejected with a generic error', async ({
        page,
    }) => {
        const login = new LoginPage(page);
        await login.goto();

        await login.fill(unregisteredCredentials);

        // UI + wording: a generic native alert appears; it must not reveal which field is wrong.
        const alertMessage = await login.submitExpectingAlert();
        expect(alertMessage).toBe(loginTexts.invalidCredentialsAlert);

        // Behavior: login rejected — no navigation to the OTP page, still on /Login.
        expect(new URL(page.url()).pathname).toBe(LoginPage.path);
        await check(login.otpForm, 'no OTP form — login not accepted', (l) =>
            expect(l).toHaveCount(0),
        );
    });

    test('TC_MDR_LOGIN_003 : Verify a valid username with an incorrect password is rejected with the same generic error', async ({
        page,
    }) => {
        // Needs a real username (the wrong password is intentional, not a secret).
        test.skip(
            !backofficeCredentials.username,
            'Set BACKOFFICE_USERNAME to run the wrong-password case.',
        );

        const login = new LoginPage(page);
        await login.goto();

        await login.fill({
            username: backofficeCredentials.username,
            password: wrongPassword,
        });

        // Wording: identical generic alert as TC_MDR_LOGIN_002 (consistency across both cases).
        const alertMessage = await login.submitExpectingAlert();
        expect(alertMessage).toBe(loginTexts.invalidCredentialsAlert);

        // Behavior: login rejected — no OTP page, still on /Login.
        expect(new URL(page.url()).pathname).toBe(LoginPage.path);
        await check(login.otpForm, 'no OTP form — login not accepted', (l) =>
            expect(l).toHaveCount(0),
        );
    });

    test('TC_MDR_LOGIN_004 : Verify blank Username and/or Password shows required-field messages and blocks submit', async ({
        page,
    }) => {
        const login = new LoginPage(page);
        await login.goto();

        // Submit with both fields blank.
        await login.submit();

        // UI: an inline required message appears under each blank field.
        await check(login.usernameRequiredMessage, 'Username required message shown', (l) =>
            expect(l).toBeVisible(),
        );
        await check(login.passwordRequiredMessage, 'Password required message shown', (l) =>
            expect(l).toBeVisible(),
        );

        // Behavior: form is not submitted; no navigation away from /Login.
        expect(new URL(page.url()).pathname).toBe(LoginPage.path);

        // Filling only one field still blocks submit and shows the other field's message.
        await login.fill(usernameOnly);
        await login.submit();
        await check(
            login.passwordRequiredMessage,
            'Password required message shown when only Username is filled',
            (l) => expect(l).toBeVisible(),
        );
        expect(new URL(page.url()).pathname).toBe(LoginPage.path);
    });
});
