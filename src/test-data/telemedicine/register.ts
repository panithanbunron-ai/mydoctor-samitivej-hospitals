/** Register page: expected on-screen copy, then the inputs the tests feed in. */
import { type LangCode } from './agreement';

type RegisterContent = {
    firstNameLabel: string;
    lastNameLabel: string;
    firstNamePlaceholder: string;
    lastNamePlaceholder: string;
    phonePlaceholder: string;
    next: string;
    requiredFieldsError: { title: string; body: string };
};

/** Name fields are located by their required-field labels ("... *"), the phone field by its placeholder. */
export const registerTexts: Record<LangCode, RegisterContent> = {
    TH: {
        firstNameLabel: 'ชื่อ *',
        lastNameLabel: 'นามสกุล *',
        firstNamePlaceholder: 'ชื่อ',
        lastNamePlaceholder: 'นามสกุล',
        phonePlaceholder: 'กรุณากรอกเบอร์โทรศัพท์',
        next: 'ถัดไป',
        requiredFieldsError: {
            title: 'ข้อผิดพลาด',
            body: 'กรุณากรอกข้อมูลให้ครบถ้วนก่อนดำเนินการต่อ',
        },
    },
    EN: {
        firstNameLabel: 'First Name *',
        lastNameLabel: 'Last Name *',
        firstNamePlaceholder: 'First Name',
        lastNamePlaceholder: 'Last Name',
        phonePlaceholder: 'Please fill your telephone number',
        next: 'Continue',
        // EN error copy pending confirmation from the dev team.
        requiredFieldsError: {
            title: 'Error',
            body: 'Please fill in all required fields before proceeding.',
        },
    },
};

/** A complete, valid register-form submission. */
export const validRegistration = {
    firstName: 'Somchai',
    lastName: 'Jaidee',
    phone: '0812345678',
};

/** First Name only; the rest cleared explicitly (the session restores earlier values). */
export const partialRegistration = {
    firstName: validRegistration.firstName,
    lastName: '',
    phone: '',
};

/** Letters/digits/dashes mix proving the phone field accepts free text. */
export const mixedPhoneInput = '08-abc-1234';
