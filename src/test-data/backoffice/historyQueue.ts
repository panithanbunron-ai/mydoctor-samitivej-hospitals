type HistoryQueueContent = {
    queuesMenuItem: string;
    historyQueueMenuItem: string;
    listPath: string;
    detailPath: string;
    viewDetailsButton: string;
    detailSections: {
        medicalHistory: string;
        chiefComplaint: string;
    };
    detailFields: {
        hn: string;
        firstName: string;
        lastName: string;
    };
    saveButton: string;
    /** Test input values used in TC_MDR_HQ_002. */
    saveInput: {
        medicalHistory: string;
        chiefComplaint: string;
        /** Fallback value used only if the patient has no birthdate — Save requires one. */
        birthdate: string;
    };
    assignment: {
        heading: string;
        assignButton: string;
    };
};

// Copy inferred from the test-case spec — verify against live UAT if an assertion misses.
export const historyQueueTexts: HistoryQueueContent = {
    queuesMenuItem: 'Queues',
    historyQueueMenuItem: 'History Queue',
    listPath: '/Queue/History',
    detailPath: '/Queue/QueueDetail',
    viewDetailsButton: 'ดูรายละเอียด',
    detailSections: {
        medicalHistory: 'Medical History',
        chiefComplaint: 'Chief Complaint :', // renders with a colon suffix on UAT
    },
    detailFields: {
        hn: 'HN :',
        firstName: 'Name :', // combined first/last name field on UAT
        lastName: 'Last Name',
    },
    saveButton: 'Save',
    saveInput: {
        medicalHistory: 'No known allergies',
        chiefComplaint: 'Sore throat for 2 days',
        birthdate: '1990-01-01',
    },
    assignment: {
        heading: 'Assignment',
        assignButton: 'Assign',
    },
};
