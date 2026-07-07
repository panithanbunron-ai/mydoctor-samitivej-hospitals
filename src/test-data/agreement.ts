export const agreementTexts = {
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

export type LangCode = keyof typeof agreementTexts;

/** Expected consent-popup content: `contains` = phrases that must all appear; `unique` = a phrase unique to this consent (proves the popups aren't swapped). */
export const consentPopups = {
    ok: 'OK',
    TH: {
        service: {
            contains: ['เปิดเผยข้อมูลส่วนบุคคลของข้าพเจ้า', 'บริษัท กรุงเทพดรักสโตร์'],
            unique: 'บริษัท กรุงเทพดรักสโตร์',
        },
        marketing: {
            contains: ['จัดกิจกรรมทางการตลาด', 'Mydoctor@allianz.co.th'],
            unique: 'ส่งเสริมการขาย',
        },
    },
    EN: {
        service: {
            contains: ['disclose my personal information', 'Bangkok Drug Store'],
            unique: 'Bangkok Drug Store',
        },
        marketing: {
            contains: ['marketing activities', 'Mydoctor@allianz.co.th'],
            unique: 'promote sales',
        },
    },
} as const;

export type ConsentKind = 'service' | 'marketing';
