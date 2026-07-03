export const AGREEMENT_COPY = {
    TH: {
        // Heading renders as two <strong> lines split by <br>, so match each part.
        headingParts: ['ข้อกำหนดและเงื่อนไขของการรับบริการ', 'และการให้ความยินยอม'],
        serviceConsent: 'ให้ความยินยอมสำหรับการใช้บริการ',
        marketingConsent: 'ให้ความยินยอมสำหรับวัตถุประสงค์ทางการตลาด',
        cancel: 'ยกเลิก',
        confirm: 'ยืนยัน',
    },
    EN: {
        headingParts: ['Service Terms and Conditions and Consent'],
        serviceConsent: 'Giving consent for the use of our service',
        marketingConsent: 'Giving consent for marketing purposes',
        cancel: 'Cancel',
        confirm: 'Confirm',
    },
} as const;

export type LangCode = keyof typeof AGREEMENT_COPY;
