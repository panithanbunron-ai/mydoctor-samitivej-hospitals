import { type LangCode } from './agreement';

type ConfirmContent = {
    /** Steps are listed in on-screen order. */
    steps: string[];
    start: string;
};

/** Confirm page copy. */
export const confirmTexts: Record<LangCode, ConfirmContent> = {
    TH: {
        steps: ['กรุณาเตรียมบัตรประชาชน', 'ซักถามอาการเบื้องต้น (ไม่มีค่าใช้จ่าย)', 'ปรึกษาแพทย์'],
        start: 'เริ่มสนทนา',
    },
    EN: {
        steps: [
            'Please prepare your passport.',
            'Consult a nurse (No charge).',
            'Consult a doctor.',
        ],
        start: 'Start',
    },
};
