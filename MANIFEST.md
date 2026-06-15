# Dutch OS Repository Manifest

This repository powers the Polilingua static learning app while preserving the original lesson evidence and canonical Dutch-learning data.

## App

| Path | Purpose |
| --- | --- |
| `app/index.html` | Static application entrypoint. |
| `app/src/` | Dashboard, academy, simulator, profiles, and progress behavior. |
| `app/styles/` | Responsive light and dark themes. |
| `app/data-loader/` | Read-only loading of repository data. |
| `app/assets/` | Application images and profile thumbnails. |

## Canonical Knowledge

| Path | Contents |
| --- | --- |
| `knowledge/words/items.json` | Words, articles, plurals, examples, and provenance. |
| `knowledge/expressions/items.json` | Reusable phrases and expressions. |
| `knowledge/particles/items.json` | Context-sensitive particles and pragmatic functions. |
| `knowledge/grammar-patterns/items.json` | Grammar rules, explanations, and constraints. |
| `knowledge/verb-constructions/items.json` | Modal, fixed, prepositional, and separable verbs. |
| `knowledge/dialogues/items.json` | Structured conversational scenarios and turns. |
| `knowledge/mistakes/items.json` | Source-supported learner errors and corrections. |

## Reviews And Metadata

| Path | Contents |
| --- | --- |
| `reviews/items.json` | Weekly recall, translation, cloze, grammar, and roleplay material. |
| `metadata/catalog.json` | App index with one row per canonical item and its `source_path`. |
| `metadata/statistics.json` | Totals by knowledge type and Monday week-start date. |
| `metadata/tags.json` | Tag registry and usage counts. |
| `metadata/ingestion-log.json` | Ingestion and duplicate-handling history. |
| `metadata/needs_review.json` | Unresolved transcription or classification questions. |

## Sources And Maintenance

| Path | Purpose |
| --- | --- |
| `sources/inbox/` | Temporary upload location for unprocessed lesson images. |
| `sources/archive/` | Immutable images, OCR, transcriptions, checksums, and manifests. |
| `schemas/` | Contracts for canonical and review JSON. |
| `prompts/ingest-weekly-notes.md` | Codex workflow for processing lesson notes. |
| `scripts/rebuild_metadata.py` | Rebuilds the catalog, statistics, and tags used by the app. |
| `scripts/validate_json.py` | Validates canonical data, references, source paths, and metadata. |

## Source Of Truth

`knowledge/**/items.json` and `reviews/items.json` are canonical. Metadata is derived, the app is a read-only consumer, and `sources/archive/` is immutable evidence.
