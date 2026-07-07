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
