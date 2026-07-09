type OtpContent = {
    otpLabel: string;
    otpPlaceholder: string;
    refCodeLabel: string;
    verifyOtpButton: string;
    invalidOtpAlert: string;
    refCodePattern: RegExp;
};

/** Backoffice OTP page copy (English-only, like the login page). */
export const otpTexts: OtpContent = {
    otpLabel: 'OTP Code',
    otpPlaceholder: 'OTP',
    refCodeLabel: 'Ref.Code:',
    // Rendered uppercase ("VERIFY OTP") via CSS; the DOM text is "Verify OTP".
    verifyOtpButton: 'Verify OTP',
    // Native alert() shown for a wrong AND a blank OTP — the app has no inline OTP error message.
    invalidOtpAlert: 'Invalid OTP. Please check and try again.',
    // Ref.Code format observed on UAT: 6 uppercase alphanumerics.
    refCodePattern: /^[A-Z0-9]{6}$/,
};

/** Well-formed length but never a valid code. */
export const invalidOtp = '00000000';

/**
 * A distinct well-formed but invalid code, used as a proxy for an expired OTP.
 * Real time-expiry can't be waited out in CI, and UAT shows the same generic
 * "Invalid OTP" alert for a wrong AND an expired code — so this can only assert
 * the shared rejection, not a distinct "expired" message.
 */
export const expiredOtp = '99999999';

type ResetPasswordContent = {
    title: string;
    newPasswordLabel: string;
    confirmPasswordLabel: string;
    passwordHint: string;
    submitButton: string;
};

/** Reset Password page copy — reached after a valid OTP (TC_MDR_OTP_008). */
export const resetPasswordTexts: ResetPasswordContent = {
    title: 'Reset Password',
    newPasswordLabel: 'New password',
    confirmPasswordLabel: 'Confirm password',
    // Exact policy hint shown under the New password field.
    passwordHint:
        'Password must be at least 8 characters long, containing alphanumerics, lower-case, upper-case, and special characters',
    submitButton: 'Submit',
};

/** The mail.tm inbox registered to the backoffice account, read from env so no inbox is committed. */
export const mailbox = {
    apiURL: process.env.MAIL_API_URL || 'https://api.mail.tm',
    // The mail.tm web UI, for the browser-visible email screenshot in TC_MDR_OTP_006.
    webURL: process.env.TEMEMAIL_URL || 'https://mail.tm/en/',
    address: process.env.MAILBOX_ADDRESS ?? '',
    password: process.env.MAILBOX_PASSWORD ?? '',
    // The account's on-screen name, expected in the email's "Dear user <name>," greeting.
    accountName: process.env.MAILBOX_ACCOUNT_NAME ?? '',
};

/** Expected sender/subject and shape of the backoffice OTP email (observed on UAT). */
export const otpEmail = {
    fromAddress: 'svh.virtualhospital@bdms.co.th',
    fromName: 'My Doctor Telemedicine System',
    subject: 'Your OTP Verification',
    // OTP observed on UAT: 8 digits (matches the 8-char invalidOtp above).
    otpPattern: /^\d{8}$/,
    // UAT delivery is slow (5-8 min observed); reused-OTP runs match instantly from the inbox.
    deliveryTimeoutMs: 480_000,
};
