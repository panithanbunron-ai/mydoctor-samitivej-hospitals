const tseslint = require('typescript-eslint');
const playwright = require('eslint-plugin-playwright');
const prettier = require('eslint-config-prettier');

module.exports = tseslint.config(
    {
        ignores: ['node_modules/', 'playwright-report/', 'test-results/', 'eslint.config.js'],
    },
    ...tseslint.configs.recommended,
    {
        // Playwright rules for specs and the page/fixture layers they drive.
        ...playwright.configs['flat/recommended'],
        files: ['tests/**/*.ts', 'src/**/*.ts'],
    },
    {
        files: ['tests/**/*.ts', 'src/**/*.ts'],
        rules: {
            // Bilingual design: tests branch on the runtime language by design (see CLAUDE.md).
            'playwright/no-conditional-in-test': 'off',
            // Manual and credential-gated cases are deliberately encoded as skips.
            'playwright/no-skipped-test': 'off',
            // Consent checkboxes are covered by styled labels; force-click is the documented workaround.
            'playwright/no-force-option': 'off',
            // check() is this repo's soft-assertion wrapper.
            'playwright/expect-expect': ['warn', { assertFunctionNames: ['check'] }],
        },
    },
    {
        files: ['src/**/*.ts'],
        rules: {
            // Page objects legitimately call expect outside a test body.
            'playwright/no-standalone-expect': 'off',
        },
    },
    {
        // Manual OTP placeholders are skip-only cases with no assertions by design.
        files: ['tests/backoffice/oneTimePassword.spec.ts'],
        rules: {
            'playwright/expect-expect': 'off',
        },
    },
    prettier,
);
