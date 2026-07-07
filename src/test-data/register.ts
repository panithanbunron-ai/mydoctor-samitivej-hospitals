import { type LangCode } from './agreement';

/** Register page copy. Name fields located by required-field labels ("... *"), phone field by its placeholder. */
export const registerTexts: Record<
    LangCode,
    {
        firstNameLabel: string;
        lastNameLabel: string;
        phonePlaceholder: string;
        next: string;
        requiredFieldsError: { title: string; body: string };
    }
> = {
    TH: {
        firstNameLabel: 'ชื่อ *',
        lastNameLabel: 'นามสกุล *',
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
        phonePlaceholder: 'Please fill your telephone number',
        next: 'Next',
        // EN error copy pending confirmation from the dev team.
        requiredFieldsError: {
            title: 'Error',
            body: 'Please fill in all required fields before proceeding.',
        },
    },
};
