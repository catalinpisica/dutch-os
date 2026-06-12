# Dutch OS Roadmap

Canonical knowledge and archived evidence remain the priority. The GitHub Pages app is planned but must not be implemented until requested.

## Current Foundation

- First real ingestion completed with archived evidence.
- Canonical Dutch-English data and category schemas exist.
- Reviews, indexes, needs-review tracking, manifests, and checksums exist.
- Repository integrity validation is available through `scripts/validate_json.py`.

## Data Layer Work

- Add complete JSON Schema evaluation to local validation and CI.
- Make catalog, tag, and statistics generation deterministic and reusable.
- Add duplicate-candidate reporting and merge regression tests.
- Define review history and spaced-repetition fields before adding them.
- Continue refining schemas from real lesson ingestion.

## Web App Constraints

- Static-only GitHub Pages deployment.
- No backend, database, authentication, paid hosting, API key, or OpenAI API call.
- Read canonical repository JSON and Markdown without modifying them.
- Store optional device-specific progress only in `localStorage`.
- Keep AI tutoring and voice practice in the ChatGPT Dutch OS project.
- Prefer mobile-first, accessible, lightweight implementation over visual complexity.

Planned structure:

```text
app/
  index.html
  assets/
  src/
  styles/
  data-loader/
```

Do not create `app/` until Phase B begins.

## Phase A - Data Layer Readiness

- Stabilize canonical JSON structures through continued ingestion.
- Confirm every browsable item has a stable ID, type, batch, category, tags, and required display fields.
- Ensure reviews and mistakes can be indexed consistently.
- Generate compact metadata indexes if loading category files directly becomes inefficient.
- Keep validation green before UI work begins.

## Phase B - Static Dashboard MVP

- Create the GitHub Pages application shell.
- Load repository JSON safely in the browser.
- Show counts, latest batch, newest items, and review suggestions.
- Browse words and expressions.
- Add fast basic search.
- Configure static GitHub Pages deployment.

## Phase C - Practice MVP

- Add Dutch-to-English and English-to-Dutch flashcards.
- Add simple multiple-choice and fill-in-the-blank quizzes.
- Track practiced IDs, correct and wrong counts, and last-practiced dates in `localStorage`.
- Derive a device-local weak-item list.

## Phase D - Specialized Trainers

- Add the particle trainer with functions, contexts, examples, and confusing cases.
- Add dialogue reading, hidden-speaker roleplay, and gap-fill.
- Add mistake correction and local prioritization.
- Add weekly browsing and review mode.
- Add sentence rebuilding and particle-selection exercises.

## Phase E - ChatGPT Bridge

- Generate prompts from selected batches, categories, items, weak items, particles, dialogues, or mistakes.
- Add copy-to-clipboard behavior.
- Keep generated prompts explicit about repository use, one-question-at-a-time practice, immediate correction, English explanations, and limited unfamiliar vocabulary.
- Do not call the OpenAI API from the app.

## Phase F - Polish

- Improve mobile navigation, large touch targets, and minimal-typing flows.
- Add filtering by batch, category, tag, difficulty when available, and item type.
- Add lightweight local statistics.
- Add offline-friendly caching only if it remains simple and reliable.
- Test performance with thousands of generated fixture items.

## Architectural Gate

If UI work reveals missing metadata, inconsistent IDs, or awkward schemas, fix and validate the canonical data layer first. Never make the app a competing source of truth.
