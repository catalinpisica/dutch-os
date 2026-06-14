# Dutch OS

Dutch OS is a continuously growing personal memory and learning system for Dutch. Handwritten class notes are preserved as source evidence, while Codex turns them into structured vocabulary, expressions, grammar, dialogues, mistakes, and review material.

The repository is designed for AI-driven maintenance. The learner uploads notes; the AI performs transcription, classification, deduplication, enrichment, validation, and review generation.

## Repository Layout

```text
knowledge/   Canonical learning data, separated by category
schemas/     JSON Schemas for every knowledge and review file
sources/     Uploaded note images and immutable processed source packages
reviews/     Generated weekly review material
metadata/    Ingestion history, tag registry, and derived statistics
prompts/     Repeatable instructions for ingestion and tutoring
config/      Learner and ingestion preferences
scripts/     Local integrity and JSON validation tools
app/         Static GitHub Pages learning cockpit
chatgpt/     Generated portable context for ChatGPT text chat and Voice mode
```

Knowledge files are JSON arrays. Every item has a stable ID, Dutch text, an English translation or explanation, examples, source provenance, tags, a Monday `week_start`, and an ingestion date. The week start is stored both as a field and an ISO-date tag so ChatGPT can resolve calendar phrases such as "this week" directly. Category-specific fields add linguistic detail without changing the shared core.

## Add Weekly Notes

1. Create a folder such as `sources/inbox/2026-06-08/images/`.
2. Put the original note photos in that folder. Renaming is unnecessary: Codex uses EXIF capture time first, then filename and file modification time as fallbacks.
3. Ask Codex: **“Process this week’s notes.”** Codex assigns the Monday starting that calendar week, such as `2026-06-08`, while preserving source context.
4. Review only any transcription uncertainties that Codex flags. Routine data maintenance should not require manual editing.

After processing, Codex moves the complete source package to `sources/archive/YYYY/YYYY-MM-DD/`, including the original images, a transcription, raw OCR evidence, and a manifest.

## Codex Ingestion Contract

Codex should follow [prompts/ingest-weekly-notes.md](prompts/ingest-weekly-notes.md) and `AGENTS.md`. In summary, it should:

1. Inventory and hash new images.
2. Transcribe visible text while marking uncertainty.
3. Classify candidate knowledge by type.
4. Detect exact, normalized, morphological, and semantic duplicates.
5. Merge with canonical entries without losing previous information.
6. Add translations, examples, linguistic details, tags, and relations.
7. Generate a weekly review and refresh metadata.
8. Validate JSON and report the changed knowledge.
9. Commit one focused weekly ingestion change when requested.

Original archived sources are immutable. Reviews and metadata are derived and may be regenerated.

## ChatGPT Context

Use [chatgpt/dutch-os-chatgpt-context.md](chatgpt/dutch-os-chatgpt-context.md) as the single file uploaded to a Dutch OS ChatGPT Project. It contains all learned material and prepared reviews, grouped by Monday `week_start`, so both text chat and Voice mode can answer questions such as "What did I learn this week?" without accessing GitHub during the conversation.

After every ingestion, `python3 scripts/rebuild_metadata.py` regenerates this file automatically. Replace the previous Project file with the newly generated version; do not edit the export manually.

## ChatGPT Tutoring

When this repository is connected to ChatGPT, use [prompts/tutor.md](prompts/tutor.md) as the tutoring contract. ChatGPT should prioritize canonical entries, adapt practice to difficulty and mistake history, cite item IDs when useful, and avoid claiming that generated examples came from class notes.

Useful practice requests include:

- “Quiz me on items learned in the week starting 2026-06-08.”
- “Create a Dutch roleplay using my recent expressions.”
- “Practice my recurring word-order mistakes.”
- “Give me a short voice exercise at my current level.”

## Web App

The repository includes a static, mobile-first GitHub Pages cockpit under `app/`. The dashboard provides learning counts, latest-week context, prepared review previews, search, filters, and full canonical item details. Interactive lessons mix multiple choice, typed Dutch recall, and cloze questions, with immediate feedback, hearts, XP, streaks, retries, and device-local weak-item prioritization. It reads repository data without modifying it. Later roadmap phases add specialized trainers and ChatGPT prompt generation. AI tutoring and voice practice remain in ChatGPT.

## Validation

Run:

```bash
python3 scripts/validate_json.py
```

This checks JSON syntax, required schema fields, course-week labels, unique IDs, archived source paths, English-only data, cross-references, and catalog consistency.

## Version

This is the version 0.1 repository foundation. It intentionally does not include a web application, OCR service, or automated spaced-repetition engine yet.
