type LoginContent = {
    usernameLabel: string;
    passwordLabel: string;
    loginButton: string;
    usernameRequired: string;
    passwordRequired: string;
    invalidCredentialsAlert: string;
    otp: {
        refCode: RegExp;
        verifyButton: string;
    };
};

/** Backoffice login page copy. The app is English-only here; the wrong-credentials alert is Thai. */
export const loginTexts: LoginContent = {
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

/** Unregistered username paired with a well-formed password. */
export const unregisteredCredentials = { username: 'notregistered999', password: 'Valid@Pass123' };

/** Deliberately wrong password to pair with the real BACKOFFICE_USERNAME. */
export const wrongPassword = 'WrongPass000';

/** Username-only fill for the one-field-blank check. */
export const usernameOnly = { username: 'someuser' };
