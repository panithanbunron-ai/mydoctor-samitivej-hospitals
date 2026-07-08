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
