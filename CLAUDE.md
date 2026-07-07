# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A Playwright end-to-end **test suite only** — it contains no application code. It
tests two externally-hosted Samitivej "My Doctor" web apps against their UAT
environments (URLs in `.env`):

- **telemedicine** — the patient-facing mobile web app (`TELEMEDICINE_URL`)
- **backoffice** — the staff back-office app (`BACKOFFICE_URL`)

The telemedicine flow is a multi-step wizard: Agreement → Register → Confirm →
Operation → Call → Review → Success. Agreement, Register, and the Register→Confirm
transition are implemented; the later steps exist as empty placeholders. On the
backoffice side, the Login step (through the OTP-page redirect) is implemented.

## Commands

```bash
npm test                    # run all projects (headless)
npm run test:telemedicine   # telemedicine project, headed (mobile viewport)
npm run test:backoffice     # backoffice project
npm run test:ui             # Playwright UI mode
npm run test:debug          # step-through debugger
npm run test:report         # open the HTML report from the last run
npm run lint                # eslint (typescript-eslint + eslint-plugin-playwright)
npm run typecheck           # tsc --noEmit
npm run format              # prettier --write (4-space indent, single quotes, width 100)

# Run one spec / one test:
npx playwright test tests/telemedicine/agreement.spec.ts
npx playwright test -g "TC_MDR_AGR_002"

# Override a target env for a single run:
TELEMEDICINE_URL=https://... npx playwright test --project=telemedicine
```

Tests run against live UAT servers — no local dev server is started (the
`webServer` block in the config is intentionally commented out).

## Architecture

Two Playwright **projects**, one per app, each with its own `testDir` and
`baseURL` (`playwright.config.ts`). `page.goto('/')` therefore hits whichever app
the project targets. The telemedicine project runs at an **iPhone 14 Pro Max**
mobile viewport (it's a mobile web app); backoffice runs Desktop Chrome.

Directory layout:

- `tests/<app>/*.spec.ts` — specs, one file per wizard step. Named
  `TC_MDR_<AREA>_NNN : <behavior>`.
- `src/pages/<app>/*.ts` — **Page Object Models**. A spec never uses raw
  selectors; it goes through a page object's locators and action methods.
- `src/test-data/<app>/*.ts` — the app's on-screen strings, keyed by `LangCode`
  (`'TH' | 'EN'`). `telemedicine/agreement.ts` is the source of truth for
  `LangCode`, `ConsentKind`, and the bilingual copy other modules import.
- `src/fixtures/telemedicine.ts` — custom `test`/`expect` fixtures (see below).
- `src/utils/visual-check.ts` — the `check()` visual-assertion helper.

### Bilingual by design

The apps ship in Thai and English and the toggle can start in either language.
Tests read `agreement.currentLanguage()` at runtime and pull the expected copy
from `test-data` by `LangCode` rather than hard-coding strings — so a test asserts
the _right_ language for whatever state the app loads in. Thai literals are
expected throughout; cSpell ignores Thai via a regex in `cspell.json`.

### Worker-scoped fixtures (telemedicine)

`src/fixtures/telemedicine.ts` exports a `test` that opens the Agreement page
**once per worker** (`agreement` fixture) and shares it across a file's cases —
fast, but cases are **not** isolated. A case needing a pristine state calls
`agreement.goto()` itself (several AGR cases do). Specs use
`test.describe.configure({ mode: 'default' })` so a failing case doesn't skip the
rest (unlike `serial`). The test-scoped `pageErrors` fixture exposes genuine page
errors seen during the current case (it drains the worker-level sink first, and
filters environmental WebKit CORS/network noise via `NETWORK_NOISE`); assert
`expect(pageErrors).toEqual([])` to catch real runtime errors.

### `check()` visual assertions

`src/utils/visual-check.ts` `check(locator, label, assertion)` wraps an assertion
as a **soft** failure (`expect.soft`), draws a green PASS / red FAIL box around the
element, and attaches an annotated screenshot to the HTML report. Use it for
report-visible checkpoints so a run annotates every checkpoint instead of aborting
on the first failure. Use a plain `expect(...)` for hard preconditions (e.g. URL
path assertions) that should stop the test.

## Non-obvious app behaviors already encoded

- **Agreement `goto()`**: `/` immediately redirects to `/?openExternalBrowser=1`,
  which aborts the initial navigation under WebKit. `goto()` waits for `commit`,
  swallows only the "interrupted by another navigation" error, then settles on
  `domcontentloaded`. Don't "simplify" this back to a plain `page.goto('/')`.
- **Terms scroll gate**: consent checkbox 1 can't be checked until the terms are
  scrolled to the bottom; `scrollTermsToBottom()` finds the scroll region
  heuristically (tallest scrollable element) rather than via a brittle selector.
- Consent popups and alerts are **SweetAlert2** (`.swal2-popup`); the consent
  popup is distinguished by the extra `.consent-swal-popup` class.
- **Register form persists within the session**: revisiting `/register` restores
  previously entered field values, so on the shared worker page a case that needs
  blank fields must clear them explicitly (`fillForm(lang, { firstName: '', ... })`).
- The Register Next button is labelled **"ถัดไป" in TH but "Continue" in EN** (not
  "Next") — `registerTexts[lang].next` holds the per-language label.
- **Backoffice login is AngularJS**: the login, OTP, and resend forms coexist in
  the DOM sharing element ids (`#username`, `#password`), so `LoginPage` scopes
  every locator to `form[name="myForm"]` / `form[name="otpForm"]:visible`.
- **Wrong credentials show a native browser `alert()`** (not SweetAlert/toast) with
  generic Thai copy that hides which field is wrong; `submitExpectingAlert()`
  captures it via a `page.on('dialog')` wait. Blank fields instead show inline
  AngularJS `ng-show` messages ("Please enter Username" / "Password Required").
- The login **happy path needs a real account**: `LOGIN_001b` (OTP redirect) and
  `LOGIN_003` read `BACKOFFICE_USERNAME`/`BACKOFFICE_PASSWORD` from env and skip when
  unset, so no credentials are committed and CI stays green without secrets.
