import { type LangCode } from './agreement';

/** Call page copy (waiting/connecting state). */
export const callTexts: Record<LangCode, { cancel: string }> = {
    TH: { cancel: 'ยกเลิก' },
    EN: { cancel: 'Cancel' },
};
