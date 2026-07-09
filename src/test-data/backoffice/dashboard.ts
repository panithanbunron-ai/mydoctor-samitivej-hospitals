type DashboardContent = {
    logoText: string;
    breadcrumb: string;
    muteButton: string;
    /** Queue tab base labels; each renders with a live count in parentheses, e.g. "Waiting Nurse(3)". */
    tabs: {
        waitingNurse: string;
        nurseRoom: string;
        waitingDoctor: string;
        doctorRoom: string;
    };
    /** A tab's live count in parentheses, captured as group 1 ("Waiting Nurse(3)" -> "3"). */
    tabCountPattern: RegExp;
    incomingCall: {
        /** Red card header, e.g. "#1 : Incoming Call". */
        headerPattern: RegExp;
        waitTimeLabel: string;
        /** "Wait Time HH:MM" counter value. */
        waitTimePattern: RegExp;
        /** Field labels shown on the incoming-call card, in display order. */
        fields: {
            hn: string;
            firstName: string;
            lastName: string;
            phoneNumber: string;
            channel: string;
            doctor: string;
            department: string;
        };
        informationButton: string;
        startCallButton: string;
    };
};

/**
 * Backend dashboard copy (English-only, like the rest of the backoffice).
 * Selectors/copy inferred from the test-case spec — the dashboard markup was not
 * observable when written; correct against live UAT if any assertion misses.
 */
export const dashboardTexts: DashboardContent = {
    logoText: 'my doctor',
    breadcrumb: 'Home / Dashboard',
    muteButton: 'Mute',
    tabs: {
        waitingNurse: 'Waiting Nurse',
        nurseRoom: 'Nurse Room',
        waitingDoctor: 'Waiting Doctor',
        doctorRoom: 'Doctor Room',
    },
    tabCountPattern: /\((\d+)\)/,
    incomingCall: {
        headerPattern: /#\d+\s*:\s*Incoming Call/,
        waitTimeLabel: 'Wait Time',
        // HH:MM elapsed counter, e.g. "00:37".
        waitTimePattern: /\b\d{2}:\d{2}\b/,
        fields: {
            hn: 'HN',
            firstName: 'First Name',
            lastName: 'Last Name',
            phoneNumber: 'Phone Number',
            channel: 'Channel',
            doctor: 'Doctor',
            department: 'Department',
        },
        informationButton: 'Information',
        startCallButton: 'Start Call',
    },
};
