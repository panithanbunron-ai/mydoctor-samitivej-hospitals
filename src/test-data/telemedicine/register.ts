/** Register page: expected on-screen copy, then the inputs the tests feed in. */
import { type LangCode } from './agreement';

type RegisterCopy = {
    firstNameLabel: string;
    lastNameLabel: string;
    firstNamePlaceholder: string;
    lastNamePlaceholder: string;
    phonePlaceholder: string;
    next: string;
    requiredFieldsError: { title: string; body: string };
};

/** Name fields are located by their required-field labels ("... *"), the phone field by its placeholder. */
export const registerTexts: Record<LangCode, RegisterCopy> = {
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

/** Per-case form inputs, keyed by test-case id — expected copy stays in registerTexts. */
export const registerCases = {
    // First Name only; the rest cleared explicitly (the session restores earlier values).
    TC_MDR_REG_003: { firstName: validRegistration.firstName, lastName: '', phone: '' },
    TC_MDR_REG_004: validRegistration,
    // Letters/digits/dashes mix proving the phone field accepts free text.
    TC_MDR_REG_006: { mixedPhone: '08-abc-1234' },
} as const;
