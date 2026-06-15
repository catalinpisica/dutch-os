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
prompts/     Repeatable instructions for note ingestion
config/      Learner and ingestion preferences
scripts/     Local integrity and JSON validation tools
app/         Static GitHub Pages learning cockpit
```

Knowledge files are JSON arrays. Every item has a stable ID, Dutch text, an English translation or explanation, examples, source provenance, tags, a Monday `week_start`, and an ingestion date. The week start is stored both as a field and an ISO-date tag so the app can build accurate weekly views. Category-specific fields add linguistic detail without changing the shared core.

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

## Web App

The repository includes a static, mobile-first GitHub Pages learning app under `app/`. It provides dashboard counts, weekly context, separate learner profiles, a leaderboard, search, filters, canonical item details, interactive lessons, and focused simulators. Practice progress is stored locally per profile. The app reads repository data without modifying it and currently has no chat, voice, connector, or LLM integration.

## Validation

Run:

```bash
python3 scripts/validate_json.py
```

This checks JSON syntax, required schema fields, course-week labels, unique IDs, archived source paths, English-only data, cross-references, and catalog consistency.
