# Dutch OS

Dutch OS is the user’s AI-maintained Dutch learning memory. The repository, not chat history, is the source of truth. The user uploads class notes; Codex maintains the structured knowledge, evidence, reviews, and indexes. The user should not need to edit canonical data manually.

## Project Rule

- Never use, invoke, consult, or apply the `jet-agents-md` skill in this repository.
- Maintain this file directly when Dutch OS operating rules change.

## Priorities

1. Preserve source evidence.
2. Keep canonical data accurate, deduplicated, and traceable.
3. Minimize manual maintenance for the user.
4. Optimize data for practical app-based learning, review, and roleplay exercises.
5. Keep the app useful without weakening canonical data or source provenance.

## Repository Areas

- `sources/inbox/`: temporary upload folders for unprocessed images.
- `sources/archive/`: immutable ingestion packages containing original images, manifests, checksums, OCR, and transcriptions.
- `knowledge/`: canonical words, expressions, particles, grammar patterns, verb constructions, dialogues, and mistakes.
- `reviews/`: generated review and practice material.
- `metadata/`: derived catalogs, statistics, tags, ingestion logs, and `needs_review.json`.
- `schemas/`: JSON contracts for structured data.
- `prompts/`: reusable note-ingestion instructions.
- `scripts/`: validation and maintenance utilities.
- `app/`: static GitHub Pages learning cockpit, kept separate from and read-only toward canonical data.

Read the relevant schema and prompt before changing data in an area.

## One-Command Weekly Workflow

In a new Codex chat for this repository, the user may upload all lesson pictures and say only something like:

- `Process this week's pictures.`
- `Process this week's notes.`
- `Update the app with this week's lesson.`

Treat these as complete, actionable requests for the full note-ingestion workflow. Do not ask the user to restate repository rules, provide a folder structure, name every image, specify the current week, or request each maintenance step separately.

For this workflow:

1. Use image files attached to the current chat when provided. Their reported local paths are valid ingestion inputs even when they are outside `sources/inbox/`.
2. Otherwise, find real image files under `sources/inbox/`. Ignore `.gitkeep`, `.DS_Store`, and empty placeholder week folders.
3. Unless the user gives another lesson date, assign the Monday starting the current local calendar week in `Europe/Amsterdam`. Use image dates and visible lesson dates as supporting context; if they clearly contradict the assumed week, investigate before writing canonical data.
4. Inspect every supplied image and establish reading order from EXIF capture time, filename, visible page numbering, and content continuity. Ask the user only when unresolved ordering or handwriting uncertainty would materially affect accuracy.
5. Execute the entire `Note Ingestion` workflow below without waiting for separate approval between routine steps.
6. Update everything required for the app in the same task: archived evidence, canonical knowledge, weekly review material, needs-review records, ingestion history, catalog, tags, statistics, and any app data contract affected by the new material.
7. Improve the lesson notes when they contain a supported error, incomplete grammar explanation, missing contrast, or unclear example. Stay strictly within the week's taught topics and vocabulary already present in that lesson or previously learned canonical material. Do not introduce new canonical words or expressions merely to make the lesson richer.
8. Run metadata rebuilding and all validation. Fix failures rather than reporting an incomplete ingestion.
9. Verify the app still loads and that the new week, item counts, dictionary entries, and Academy scope are available. Use the in-app browser when a local app URL is available.
10. Do not commit or push unless the user explicitly asks. The ingestion itself is complete without a Git operation.
11. Finish with a concise report of the assigned week, images processed, items created, items enriched or merged, corrections and note improvements, uncertainties, review updates, app verification, and validation result.

If no attached images and no real inbox images exist, report that no lesson pictures were found and identify the locations checked. This is the only normal missing-input case that should stop the workflow.

## App Data Discovery

- `metadata/catalog.json` must index every canonical item used by the app.
- Every catalog row must include `source_path`, pointing to the category file containing the full record.
- `metadata/statistics.json` and `metadata/tags.json` provide app summaries and filters.
- The app fetches complete category files only when full item details or practice data are needed.
- Rebuild app metadata with `python3 scripts/rebuild_metadata.py` after canonical data changes.

## Evidence Rules

- Never rewrite, replace, or delete files under `sources/archive/`.
- Preserve raw OCR and source transcriptions even when they contain errors.
- Put corrections or normalized text in a new derived file or canonical record.
- Every canonical item must reference at least one archived source image.
- Generated or inferred material must not be presented as a direct transcription.
- Mark generated examples with `source_type: ai_generated`.

## Canonical Data

- Store Dutch and idiomatic English only. Romanian may remain only in archived source material.
- Follow the current schema exactly; update schema, data, and validation together when the model changes.
- Use clear JSON and add fields only for a concrete learning, provenance, search, or maintenance need.
- Required concepts include a stable ID, Dutch, English, category, tags, source images, a Monday `week_start` date such as `2026-06-08`, and ingestion date. The exact `week_start` must also appear in the item's `tags` array. Category-specific fields come from the schema.
- Keep entries useful for speaking and comprehension. Do not turn `knowledge/` into a generic dictionary.

## Stable IDs

- Use readable lowercase category-prefixed IDs, such as `word-jas`, `particle-hoor`, or `expression-het-maakt-me-niet-uit`.
- Keep an existing ID when enriching an item.
- Do not rename IDs casually. If a rename is necessary, update every reference and record the migration.
- Do not use UUIDs unless readable deterministic IDs are genuinely insufficient.

## Duplicate and Merge Rules

Before creating an item, search existing Dutch forms, normalized spelling, inflections, meanings, examples, and related records.

When meaning and usage match:

- enrich the existing item;
- preserve its ID, useful notes, examples, and source references;
- add new evidence without weakening existing information.

Keep separate items when pragmatic function or meaning differs. For example, a normal lexical use and a discourse-particle use may require separate records.

## Uncertainty

Accuracy is more important than extraction volume.

- Do not guess unclear handwriting, OCR, spelling, phrase boundaries, meaning, or classification.
- Exclude unsupported readings from canonical data.
- Record uncertainty in `metadata/needs_review.json` and the relevant review.
- Include the source image and a concise reason.
- Ask the user only when confirmation is necessary to proceed accurately.
- Do not classify likely OCR noise as a learner mistake.

## Classification

- **Words:** single lexical items such as nouns, adjectives, adverbs, prepositions, pronouns, and basic verbs.
- **Expressions:** useful multi-word chunks or sentence-like phrases.
- **Particles:** words such as `maar`, `even`, `hoor`, and `toch` whose pragmatic meaning depends on context or intonation.
- **Grammar patterns:** reusable rules such as word order, questions, negation, plurals, demonstratives, and time expressions.
- **Verb constructions:** modal patterns, fixed combinations, prepositional verbs, and usage contrasts.
- **Dialogues:** useful conversational sequences, clearly identified as source transcription or normalized dialogue.
- **Mistakes:** source-supported learner errors, corrections, or recurring confusions.

Classify by learning function, not surface form alone.

## Examples and Reviews

- Generate at most one or two examples for important items.
- Keep examples natural, practical, beginner-friendly, and within the learner’s likely vocabulary.
- Include an English translation and distinguish generated examples from source examples.
- Each ingestion must generate review material covering important new items, particles, grammar, difficult material, and recurring mistakes.
- Reviews should include useful recall, translation, cloze, grammar, or roleplay prompts without mechanically including every extracted item.
- Improve incomplete lesson material with concise rules, contrasts, corrections, and generated examples when this helps explain the taught topic.
- Generated improvements may reuse words and expressions from the current lesson or previously learned canonical data, but must not introduce untaught vocabulary as new learning material.
- Never create a new canonical word or expression unless it is supported by the uploaded lesson evidence. If an explanation genuinely requires an unfamiliar helper word, prefer simple English explanation instead.
- Preserve the source transcription unchanged and clearly distinguish teacher-provided content from Codex corrections or generated enrichment.

## GitHub Pages App

The app is a static, mobile-first Dutch learning cockpit for browsing repository knowledge and doing non-AI practice. GitHub Pages is its free hosting layer.

The app may progressively provide:

- dashboard counts, latest batch, newest items, local weak items, and review suggestions;
- browsing and filtering across every knowledge category and weekly review;
- client-side search across Dutch, English, examples, tags, categories, and notes;
- flashcards, quizzes, cloze tasks, sentence rebuilding, particle selection, dialogue gap-fill, and mistake correction;
- dedicated particle, dialogue, mistake, and weekly-review modes;
- device-specific practice history in `localStorage`;

The app must:

- use only static HTML, CSS, JavaScript, and repository data compatible with GitHub Pages;
- require no backend, server-side code, database, authentication, paid infrastructure, API key, or browser-side LLM API call;
- treat `knowledge/`, `reviews/`, and `metadata/` as read-only inputs;
- keep `localStorage` progress device-specific and non-canonical;
- remain mobile-first, accessible, fast, and maintainable with thousands of items;
- avoid a heavy framework unless scale or demonstrated complexity justifies one.

There is currently no chat, voice, connector, or LLM integration. A future LLM API integration may be designed separately, but the current app must not depend on one. Codex maintains repository data and app code. If the UI reveals missing metadata or schema problems, fix the canonical data layer instead of hiding the problem in app code.

Planned structure:

```text
app/
  index.html
  assets/
  src/
  styles/
  data-loader/
```

The exact internal structure may evolve. The app must never become the source of truth. Its data loader must continue reading canonical repository files instead of maintaining copied app data.

## Note Ingestion

When the user asks to process notes:

1. Read `prompts/ingest-weekly-notes.md`, relevant schemas, and existing canonical data.
2. Resolve input images from current-chat attachments first, then from `sources/inbox/`.
3. Inspect every uploaded source and determine page order. Report only material unresolved ambiguity.
4. Assign the Monday week-start date while preserving lesson-date context in the archive manifest.
5. Copy attached originals, or move inbox originals, into `sources/archive/YYYY/YYYY-MM-DD/` without modifying image contents.
6. Create the manifest, checksums, raw OCR, and curated transcription.
7. Extract and classify only supported learning material.
8. Check the lesson for incorrect forms, incomplete rules, missing contrasts, or examples that would be misleading without context. Correct or enrich the derived material while preserving the raw transcription and source evidence.
9. Keep enrichment inside the taught scope: use only words and expressions visible in the current lesson or already present in canonical data. Do not add new canonical vocabulary or expressions without source support.
10. Detect duplicates and merge before creating records.
11. Add provenance and ingestion metadata, including the exact `week_start` date in every item's `tags` array.
12. Generate the review with the same explicit week tag and update needs-review data.
13. Rebuild affected catalogs, tags, statistics, and ingestion logs.
14. Run validation and fix every failure.
15. Verify the updated week and material in the app.
16. Report additions, merges, corrections, generated enrichment, uncertainty, assumptions, app verification, and validation results.

Do not claim an ingestion is complete until every uploaded source has been inspected and archived.

## Validation

After changing JSON, schemas, reviews, or metadata, run:

```bash
python3 scripts/validate_json.py
```

Do not finish with validation failures. Validation must continue to cover JSON syntax, required fields, stable IDs, source paths, batch labels, English-only canonical data, cross-references, catalog source paths and counts, and derived metadata consistency.

## Commits

- Do not commit unless the user requests it or the active workflow explicitly requires it.
- Keep commits focused.
- A note-ingestion commit should contain only its archive package, knowledge changes, review, metadata, and necessary validation changes.
- Preserve unrelated user changes.

## Completion Checklist

Before finishing a substantial task:

1. Confirm archived evidence was preserved.
2. Check new records for duplicates.
3. Validate all affected structured data.
4. Confirm source paths, cross-references, and derived app metadata.
5. Summarize changes, uncertainty, assumptions, and anything not verified.

The guiding test is: will this make the user’s Dutch easier to practice and maintain over the next five years with less manual work?
