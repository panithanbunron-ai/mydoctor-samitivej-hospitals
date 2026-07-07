import { type LangCode } from './agreement';

/** Confirm page copy. Steps are listed in on-screen order. */
export const confirmTexts: Record<
    LangCode,
    {
        steps: string[];
        start: string;
    }
> = {
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
