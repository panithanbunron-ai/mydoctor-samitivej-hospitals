---
name: comment-style
description: Rules for writing code comments in this repo. Use before adding or editing any comment in TypeScript source, page objects, fixtures, specs, or test-data. Keep every comment to a single line — just enough to understand what/why.
---

# Comment style

Write comments that are **a single line — just enough to understand what the code
does or why it's there.** Never write a lot. If it doesn't fit on one line, cut it
down until it does.

## Rules

1. **Explain the non-obvious, not the obvious.** Skip comments that restate the
   code (`// increment i`). Comment the *why* behind a workaround, a quirk of the
   app under test, or a decision that isn't visible from the code.

2. **One line, always.** Every comment — inline or doc-comment — fits on a single
   line. If it won't fit, the point is too big for a comment: trim it or let the
   code carry it.

3. **Prefer one plain sentence.** Drop hedging and background prose. Say the point
   once. Cut words like "basically", "essentially", "note that".

4. **Doc-comments (`/** ... */`) state purpose in one line.** Describe what a
   function/type/export is for, not how it works line by line.

5. **Comment the workaround, name the reason.** For env/browser quirks (WebKit
   redirects, CORS noise, SweetAlert2 popups), state the cause in a few words so
   nobody "simplifies" it away.

6. **Step comments in specs are fine when they aid reading** — keep them terse
   (`// Tap checkbox 1 before scrolling`). Don't narrate every line.

7. **Don't duplicate CLAUDE.md.** Architecture-level "why" lives there; comments
   point at the local detail, not the whole story.

## Examples

Too much:

```ts
// The app immediately redirects "/" → "/?openExternalBrowser=1", which
// interrupts the initial navigation and throws under WebKit. Wait only for
// the commit, then settle on the post-redirect load. The redirect can fire
// before `commit`, aborting the goto — that abort *is* the navigation we want.
```

Right (one line):

```ts
// "/" redirects to "/?openExternalBrowser=1", aborting the initial nav under WebKit; wait for commit, swallow that abort, then settle.
```

Obvious — delete it:

```ts
// get the current language
return (await this.languageToggle.innerText()).trim() as LangCode;
```

Good doc-comment (one line, purpose only):

```ts
/** Scroll the terms to the bottom — the app's precondition for enabling checkbox 1. */
```
