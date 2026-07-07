# mydoctor-samitivej-hospitals

Playwright end-to-end test suite for the Samitivej **My Doctor** web apps
(UAT). This repo contains tests only — no application code:

- **telemedicine** — the patient-facing mobile web app (runs at an iPhone 14
  Pro Max viewport)
- **backoffice** — the staff back-office app (runs on Desktop Chrome)

## Setup

```bash
npm ci
npx playwright install chromium webkit
cp .env.example .env    # then fill in the values
```

`.env` values:

| Variable                                      | Required | Purpose                                                                     |
| --------------------------------------------- | -------- | --------------------------------------------------------------------------- |
| `TELEMEDICINE_URL`                            | yes      | Telemedicine UAT base URL                                                   |
| `BACKOFFICE_URL`                              | yes      | Backoffice UAT base URL                                                     |
| `BACKOFFICE_USERNAME` / `BACKOFFICE_PASSWORD` | no       | Real UAT account for the login/OTP happy paths; those cases skip when unset |

Tests run against the live UAT servers — no local server is started.

## Running tests

```bash
npm test                    # all projects, headless
npm run test:telemedicine   # telemedicine project, headed
npm run test:backoffice     # backoffice project
npm run test:ui             # Playwright UI mode
npm run test:report         # open the HTML report from the last run

# One spec / one case:
npx playwright test tests/telemedicine/agreement.spec.ts
npx playwright test -g "TC_MDR_AGR_002"
```

The HTML report attaches an annotated screenshot (green PASS / red FAIL box)
for every visual checkpoint — see `src/utils/visual-check.ts`.

## Quality checks

```bash
npm run lint          # eslint (typescript-eslint + eslint-plugin-playwright)
npm run typecheck     # tsc --noEmit
npm run format        # prettier --write
```

CI (`.github/workflows/playwright.yml`) runs lint, typecheck, format check and
the full suite on every push/PR to `main`. Add `BACKOFFICE_USERNAME` /
`BACKOFFICE_PASSWORD` as GitHub Actions secrets to include the
credential-gated cases.

## Project layout

```
tests/<app>/*.spec.ts        # specs, one file per wizard step (TC_MDR_<AREA>_NNN)
src/pages/<app>/*.ts         # Page Object Models — specs never use raw selectors
src/test-data/<app>/*.ts     # expected on-screen copy, keyed by language (TH/EN)
src/fixtures/telemedicine.ts # worker-shared Agreement page + pageErrors fixtures
src/utils/visual-check.ts    # check(): soft assertion + annotated screenshot
```

Both apps are bilingual (TH/EN) and can load in either language: tests read
the current language at runtime and pull the expected copy from `test-data`
rather than hard-coding strings.

See [CLAUDE.md](CLAUDE.md) for architecture details and the non-obvious app
behaviors the suite encodes (WebKit redirect handling, the terms scroll gate,
shared AngularJS form ids, and more).
