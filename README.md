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
app/         Planned static GitHub Pages cockpit; not implemented yet
```

Knowledge files are JSON arrays. Every item has a stable ID, Dutch text, an English translation or explanation, examples, source provenance, tags, a course batch, and an ingestion date. Category-specific fields add linguistic detail without changing the shared core.

## Add Weekly Notes

1. Create a folder such as `sources/inbox/2026-W24/images/`.
2. Put the original note photos in that folder. Renaming is unnecessary: Codex uses EXIF capture time first, then filename and file modification time as fallbacks.
3. Ask Codex: **“Process this week’s notes.”** Codex assigns the next course batch label, such as `week_02`, while preserving the calendar upload folder as source context.
4. Review only any transcription uncertainties that Codex flags. Routine data maintenance should not require manual editing.

After processing, Codex moves the complete source package to `sources/archive/YYYY/week_NN/`, including the original images, a transcription, raw OCR evidence, and a manifest.

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

## ChatGPT Tutoring

When this repository is connected to ChatGPT, use [prompts/tutor.md](prompts/tutor.md) as the tutoring contract. ChatGPT should prioritize canonical entries, adapt practice to difficulty and mistake history, cite item IDs when useful, and avoid claiming that generated examples came from class notes.

Useful practice requests include:

- “Quiz me on items learned in 2026-W24.”
- “Create a Dutch roleplay using my recent expressions.”
- “Practice my recurring word-order mistakes.”
- “Give me a short voice exercise at my current level.”

## Planned Web App

The roadmap includes a static, mobile-first GitHub Pages cockpit for browsing, search, reviews, local non-AI practice, and generating prompts for ChatGPT. It will read repository data without modifying it and store optional device-specific progress in `localStorage`. AI tutoring and voice practice remain in ChatGPT. See `TODO.md` for the phased plan.

## Validation

Run:

```bash
python3 scripts/validate_json.py
```

This checks JSON syntax, required schema fields, course-week labels, unique IDs, archived source paths, English-only data, cross-references, and catalog consistency.

## Version

This is the version 0.1 repository foundation. It intentionally does not include a web application, OCR service, or automated spaced-repetition engine yet.
