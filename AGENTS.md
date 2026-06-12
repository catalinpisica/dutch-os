# Dutch OS

Dutch OS is the user’s AI-maintained Dutch learning memory. The repository, not chat history, is the source of truth. The user uploads class notes; Codex maintains the structured knowledge, evidence, reviews, and indexes. The user should not need to edit canonical data manually.

## Project Rule

- Never use, invoke, consult, or apply the `jet-agents-md` skill in this repository.
- Maintain this file directly when Dutch OS operating rules change.

## Priorities

1. Preserve source evidence.
2. Keep canonical data accurate, deduplicated, and traceable.
3. Minimize manual maintenance for the user.
4. Optimize data for practical ChatGPT tutoring, including voice practice and roleplay.
5. Build the data layer before the planned web application; do not let UI needs weaken canonical data.

## Repository Areas

- `sources/inbox/`: temporary upload folders for unprocessed images.
- `sources/archive/`: immutable ingestion packages containing original images, manifests, checksums, OCR, and transcriptions.
- `knowledge/`: canonical words, expressions, particles, grammar patterns, verb constructions, dialogues, and mistakes.
- `reviews/`: generated review and practice material.
- `metadata/`: derived catalogs, statistics, tags, ingestion logs, and `needs_review.json`.
- `schemas/`: JSON contracts for structured data.
- `prompts/`: reusable ingestion and tutoring instructions.
- `scripts/`: validation and maintenance utilities.
- `app/`: planned GitHub Pages application, created only when implementation begins and kept separate from canonical data.

Read the relevant schema and prompt before changing data in an area.

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
- Use clear JSON and add fields only for a concrete tutoring, provenance, search, or maintenance need.
- Required concepts include a stable ID, Dutch, English, category, tags, source images, course batch such as `week_01`, and ingestion date. Category-specific fields come from the schema.
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

## Planned GitHub Pages App

The future app is a static, mobile-first Dutch learning cockpit for browsing repository knowledge and doing non-AI practice. GitHub Pages is its free hosting layer.

The app may provide:

- dashboard counts, latest batch, newest items, local weak items, and review suggestions;
- browsing and filtering across every knowledge category and weekly review;
- client-side search across Dutch, English, examples, tags, categories, and notes;
- flashcards, quizzes, cloze tasks, sentence rebuilding, particle selection, dialogue gap-fill, and mistake correction;
- dedicated particle, dialogue, mistake, and weekly-review modes;
- device-specific practice history in `localStorage`;
- copyable ChatGPT prompts generated from selected batches, categories, or item IDs.

The app must:

- use only static HTML, CSS, JavaScript, and repository data compatible with GitHub Pages;
- require no backend, server-side code, database, authentication, paid infrastructure, API key, or browser-side OpenAI API call;
- treat `knowledge/`, `reviews/`, and `metadata/` as read-only inputs;
- keep `localStorage` progress device-specific and non-canonical;
- remain mobile-first, accessible, fast, and maintainable with thousands of items;
- avoid a heavy framework unless scale or demonstrated complexity justifies one.

The app is not the AI tutor. Reasoning, conversation, correction, intelligent roleplay, and voice practice remain in ChatGPT through the GitHub connector. Codex maintains repository data and app code. If the UI reveals missing metadata or schema problems, fix the canonical data layer instead of hiding the problem in app code.

Planned structure:

```text
app/
  index.html
  assets/
  src/
  styles/
  data-loader/
```

The exact internal structure may evolve. The app must never become the source of truth, and it must not be implemented until the user requests the relevant roadmap phase.

## Note Ingestion

When the user asks to process notes:

1. Read `prompts/ingest-weekly-notes.md`, relevant schemas, and existing canonical data.
2. Inspect every uploaded source and determine page order. Report ambiguous ordering.
3. Assign the next course-batch label while preserving calendar context in the archive manifest.
4. Move originals into `sources/archive/YYYY/week_NN/` without modifying them.
5. Create the manifest, checksums, raw OCR, and curated transcription.
6. Extract and classify only supported learning material.
7. Detect duplicates and merge before creating records.
8. Add provenance and ingestion metadata.
9. Generate the review and update needs-review data.
10. Rebuild affected catalogs, tags, statistics, and ingestion logs.
11. Run validation and fix every failure.
12. Report additions, merges, uncertainty, assumptions, and validation results.

Do not claim an ingestion is complete until every uploaded source has been inspected and archived.

## Validation

After changing JSON, schemas, reviews, or metadata, run:

```bash
python3 scripts/validate_json.py
```

Do not finish with validation failures. Validation must continue to cover JSON syntax, required fields, stable IDs, source paths, batch labels, English-only canonical data, cross-references, and derived catalog consistency.

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
4. Confirm source paths and cross-references.
5. Summarize changes, uncertainty, assumptions, and anything not verified.

The guiding test is: will this make the user’s Dutch easier to practice and maintain over the next five years with less manual work?
