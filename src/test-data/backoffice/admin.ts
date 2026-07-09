type AdminFormContent = {
    /** src of the sidebar menu icon (an alt-less <img>) that opens the flyout menu. */
    menuIconSrc: string;
    /** Flyout entry that opens the System Administrator list. */
    adminMenuItem: string;
    /** Button on the list that opens a blank Create Admin form. */
    addAdminButton: string;
    /** Submits / cancels the Create Admin form. */
    saveButton: string;
    cancelButton: string;
    /** Text inputs sit in a separate column from their Thai labels, so locate them by placeholder. */
    placeholders: {
        firstName: string;
        lastName: string;
        username: string;
        password: string;
        confirmPassword: string;
        email: string;
    };
    /** Thai first-name field label; on screen it renders with a trailing ':'. */
    firstNameLabel: string;
    /** Error under a blank "ชื่อ" after clicking Save; several fields share this exact copy. */
    firstNameRequired: string;
};

/** Admin area (ผู้ดูแลระบบ) Create Admin form copy, observed on UAT (/Admin/AdminDetail). */
export const adminTexts: AdminFormContent = {
    menuIconSrc: '/Content/images/dicut/6.png',
    adminMenuItem: 'ผู้ดูแลระบบ',
    addAdminButton: 'เพิ่ม',
    saveButton: 'บันทึกข้อมูล',
    cancelButton: 'ยกเลิก',
    placeholders: {
        firstName: 'Your Firstname',
        lastName: 'Your Lastname',
        username: 'Your Username',
        password: 'Your Password',
        confirmPassword: 'Your Confirm Password',
        email: 'Your email',
    },
    firstNameLabel: 'ชื่อ',
    firstNameRequired: 'This field is required.',
};

/** Unique suffix so each run creates a fresh, non-duplicate admin. */
const unique = Date.now();

/** A complete, valid Create Admin submission (text fields). */
export const validAdmin = {
    firstName: 'Somchai',
    lastName: 'Jaidee',
    username: `qa_admin_${unique}`,
    password: 'Valid@Pass123',
    confirmPassword: 'Valid@Pass123',
    email: `qa_admin_${unique}@example.com`,
};

/** Per-case inputs keyed by test-case id. */
export const adminCases = {
    // All fields valid except "ชื่อ" (First name) left blank.
    TC_MDR_ADM_001: { ...validAdmin, firstName: '' },
};
