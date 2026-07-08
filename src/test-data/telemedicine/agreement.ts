/** Agreement page: expected on-screen copy and consent-popup content, keyed by language. */

export type LangCode = 'TH' | 'EN';
export type ConsentKind = 'service' | 'marketing';

type AgreementContent = {
    /** Heading pieces as the DOM splits them (TH renders as two <strong> lines). */
    headingParts: string[];
    serviceConsent: string;
    marketingConsent: string;
    cancel: string;
    confirm: string;
};

export const agreementTexts: Record<LangCode, AgreementContent> = {
    TH: {
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
};

type ConsentPopupContent = {
    /** Phrases that must all appear in the popup. */
    contains: string[];
    /** A phrase unique to this consent — proves the two popups aren't swapped. */
    unique: string;
};

/** OK button label on both consent popups (identical in TH and EN). */
export const consentPopupOk = 'OK';

export const consentPopups: Record<LangCode, Record<ConsentKind, ConsentPopupContent>> = {
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
};
