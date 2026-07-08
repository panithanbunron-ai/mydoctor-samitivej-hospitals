import { type LangCode } from './agreement';

type CallContent = {
    cancel: string;
};

/** Call page copy (waiting/connecting state). */
export const callTexts: Record<LangCode, CallContent> = {
    TH: { cancel: 'ยกเลิก' },
    EN: { cancel: 'Cancel' },
};
