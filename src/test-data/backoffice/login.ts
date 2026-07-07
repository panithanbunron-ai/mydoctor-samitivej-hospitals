/** Backoffice login page copy. The app is English-only here; the wrong-credentials alert is Thai. */
export const loginTexts = {
    usernameLabel: 'Username',
    passwordLabel: 'Password',
    // Rendered uppercase ("LOGIN") via CSS; the DOM text is "Login".
    loginButton: 'Login',
    usernameRequired: 'Please enter Username',
    passwordRequired: 'Password Required',
    // Generic native alert() on any bad credential — does not reveal which field is wrong.
    invalidCredentialsAlert: 'Username หรือ Password ผิด !! กรุณาลองใหม่อีกครั้งค่ะ',
    otp: {
        refCode: /Ref\.?\s*Code/i,
        verifyButton: 'Verify OTP',
    },
};

/** Credentials for the login happy path, read from env so no real account is committed. */
export const backofficeCredentials = {
    username: process.env.BACKOFFICE_USERNAME ?? '',
    password: process.env.BACKOFFICE_PASSWORD ?? '',
};

/** Per-case login inputs, keyed by test-case id — expected copy stays in loginTexts. */
export const loginCases = {
    // Unregistered username paired with a well-formed password.
    TC_MDR_LOGIN_002: { username: 'notregistered999', password: 'Valid@Pass123' },
    // Deliberately wrong password to pair with the real BACKOFFICE_USERNAME.
    TC_MDR_LOGIN_003: { wrongPassword: 'WrongPass000' },
    // Username-only fill for the one-field-blank check.
    TC_MDR_LOGIN_004: { username: 'someuser' },
} as const;
