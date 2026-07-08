import { type LangCode } from './agreement';

/** Review page copy. Questions are listed in on-screen order. */
export const reviewTexts: Record<
    LangCode,
    {
        questions: string[];
        suggestionsLabel: string;
        suggestionsPlaceholder: string;
        submit: string;
    }
> = {
    TH: {
        questions: [
            '1. ความพึงพอใจในการใช้บริการ',
            '2. ท่านจะแนะนำบริการของโรงพยาบาลให้ญาติ/เพื่อน/ผู้ที่ท่านรู้จักมาใช้บริการหรือไม่',
        ],
        suggestionsLabel: 'คำแนะนำเพิ่มเติม',
        suggestionsPlaceholder: 'กรุณาระบุ',
        submit: 'ส่งคำแนะนำ',
    },
    EN: {
        questions: [
            '1. Overall satisfaction of service.',
            '2. Would you recommend this service to your friends and families?',
        ],
        suggestionsLabel: 'Suggestions',
        suggestionsPlaceholder: 'You suggestions',
        submit: 'Submit Review',
    },
};

/** Star rating both questions default to before any user interaction. */
export const defaultRating = 5;
