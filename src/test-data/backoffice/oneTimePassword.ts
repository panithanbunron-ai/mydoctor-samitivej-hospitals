/** Backoffice OTP page copy (English-only, like the login page). */
export const otpTexts = {
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

/** Per-case OTP inputs, keyed by test-case id — expected copy stays in otpTexts. */
export const otpCases = {
    // Well-formed length but never a valid code.
    TC_MDR_OTP_009: { invalidOtp: '00000000' },
} as const;
