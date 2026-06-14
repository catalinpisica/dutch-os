# Dutch OS Repository Manifest

This is the connector-friendly discovery map for Dutch OS. When GitHub code search is unavailable, fetch the exact paths below instead of guessing filenames.

## Fetch First

1. `metadata/ai-entrypoint.json` - compact purpose, source-of-truth rule, counts, latest batch, and fetch order.
2. `metadata/catalog.json` - index of every canonical item, including the path to its complete record.
3. `reviews/items.json` - prepared weekly exercises, focus IDs, roleplays, mistakes, and unresolved review items.
4. `prompts/chatgpt-tutor-entrypoint.md` - instructions for ChatGPT and GitHub connectors.

For ChatGPT text chat or Voice mode, download and upload `chatgpt/dutch-os-chatgpt-context.md` to the Dutch OS ChatGPT Project. That portable context does not require the other repository files.

Fetch a full category file from `knowledge/` only after locating relevant IDs in the catalog.

## Canonical Knowledge

These files are the source of truth for learned Dutch material:

| Path | Contents |
| --- | --- |
| `knowledge/words/items.json` | Words, articles, plurals, parts of speech, examples, and provenance. |
| `knowledge/expressions/items.json` | Reusable phrases and sentence-like expressions with register information. |
| `knowledge/particles/items.json` | Context-sensitive particles, pragmatic functions, and tone effects. |
| `knowledge/grammar-patterns/items.json` | Grammar rules, explanations, examples, and constraints. |
| `knowledge/verb-constructions/items.json` | Modal, fixed, prepositional, and separable verb constructions. |
| `knowledge/dialogues/items.json` | Structured conversational scenarios and turns. |
| `knowledge/mistakes/items.json` | Source-supported learner errors, corrections, and status. |

## Reviews

| Path | Contents |
| --- | --- |
| `reviews/items.json` | Weekly recall, translation, cloze, grammar, roleplay, mistake, and needs-review material. |

## Discovery And Metadata

Metadata is derived and must not override canonical records.

| Path | Contents |
| --- | --- |
| `metadata/ai-entrypoint.json` | Small first-fetch document for AI connectors. |
| `metadata/catalog.json` | One index row per canonical item, with `source_path` for the complete record. |
| `metadata/statistics.json` | Current totals by knowledge type and Monday week-start date. |
| `metadata/tags.json` | Tag registry and usage counts. |
| `metadata/ingestion-log.json` | Ingestion batches, duplicate handling, and review-resolution history. |
| `metadata/needs_review.json` | Current unresolved transcription or classification questions. |

## ChatGPT Export

| Path | Contents |
| --- | --- |
| `chatgpt/dutch-os-chatgpt-context.md` | Generated, portable snapshot for ChatGPT text chat and Voice mode, grouped by Monday week-start date. |

## Schemas

| Path | Validates |
| --- | --- |
| `schemas/common.schema.json` | Shared item fields, examples, tags, weeks, and source-image paths. |
| `schemas/words.schema.json` | `knowledge/words/items.json`. |
| `schemas/expressions.schema.json` | `knowledge/expressions/items.json`. |
| `schemas/particles.schema.json` | `knowledge/particles/items.json`. |
| `schemas/grammar-patterns.schema.json` | `knowledge/grammar-patterns/items.json`. |
| `schemas/verb-constructions.schema.json` | `knowledge/verb-constructions/items.json`. |
| `schemas/dialogues.schema.json` | `knowledge/dialogues/items.json`. |
| `schemas/mistakes.schema.json` | `knowledge/mistakes/items.json`. |
| `schemas/reviews.schema.json` | `reviews/items.json`. |
| `schemas/needs-review.schema.json` | Needs-review objects in metadata and reviews. |

## Prompts

| Path | Purpose |
| --- | --- |
| `prompts/chatgpt-tutor-entrypoint.md` | First tutoring instructions for ChatGPT and GitHub connectors. |
| `prompts/tutor.md` | Full tutoring behavior and session flow. |
| `prompts/ingest-weekly-notes.md` | Codex workflow for processing handwritten notes. |

## Other Areas

| Path | Purpose |
| --- | --- |
| `sources/inbox/` | Temporary upload location for unprocessed note images. |
| `sources/archive/` | Immutable images, OCR, transcriptions, checksums, and manifests. |
| `scripts/rebuild_metadata.py` | Rebuilds catalog, statistics, tags, and AI entrypoint metadata. |
| `scripts/generate_chatgpt_context.py` | Generates or checks the portable ChatGPT context file. |
| `scripts/validate_json.py` | Validates canonical data, references, discovery paths, and indexes. |
| `config/` | Learner and ingestion preferences. |
| `app/` | Static GitHub Pages cockpit for dashboard browsing, search, reviews, and item details. |

## Source-Of-Truth Rule

Use `knowledge/**/items.json` and `reviews/items.json` as canonical learning data. Use `metadata/catalog.json` only to discover IDs and choose a canonical file to fetch. Use `sources/archive/` only as immutable evidence. Never infer that the learner knows an item merely because it is common Dutch; confirm that its ID or Dutch form exists in the catalog.
