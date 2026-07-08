import { type LangCode } from './agreement';

/** Success page copy. */
export const successTexts: Record<LangCode, { message: string; close: string }> = {
    TH: {
        message: 'ขอบคุณที่ใช้บริการ My doctor และคำแนะนำของท่าน',
        close: 'ปิด',
    },
    EN: {
        message: "Thank you for using My Doctor's service and your suggestion.",
        close: 'Close',
    },
};
