# Weekly Notes Ingestion Prompt

Process the new handwritten Dutch notes attached to the current chat or placed under `sources/inbox/`. Prefer current-chat attachments when both exist.

## Inputs

- Target week start: `<YYYY-MM-DD>` (Monday). If omitted, use the Monday starting the current local week in `Europe/Amsterdam`.
- Optional class context: `<topic, textbook chapter, teacher correction, or leave blank>`

## Required Workflow

1. Inventory current-chat image attachments first, otherwise real images under `sources/inbox/`, and compute a checksum for each file. Ignore placeholders such as `.gitkeep` and `.DS_Store`. Determine reading order from EXIF capture time, visible page numbering, filename, file modification time, and content continuity. Report unresolved material ambiguity rather than guessing.
2. Read every image carefully. Create a faithful transcription and mark uncertain text as `[uncertain: ...]`; never silently guess.
3. Extract candidate words, expressions, particles, grammar patterns, verb constructions, dialogues, and learner mistakes.
4. Search all existing `knowledge/**/items.json` files before creating anything.
5. Compare candidates using exact spelling, normalized forms, inflections, separable verbs, meaning, and usage. Merge genuine duplicates.
6. Preserve all previous sources, examples, notes, relations, and learning history when merging. Increment `exposure_count` and update `last_seen`.
7. Add idiomatic English translations or explanations. Do not add Romanian translations. Distinguish literal meaning from pragmatic meaning where useful.
8. Add concise examples. Label generated examples with `source_type: ai_generated`; never present them as class-note quotations.
9. Record archived source-image provenance for each item. Use stable IDs and the Monday week-start date, such as `2026-06-08`. Add that exact date to both `week_start` and the item's `tags` array.
10. Create or update a weekly review in `reviews/items.json`, emphasizing new material and recurring mistakes. Give the review the same `week_start` value and date tag.
11. Rebuild the catalog, tags, and statistics used by the app.
12. Run `python3 scripts/validate_json.py` and fix all failures.
13. Copy attached originals, or move inbox originals, into the completed source package at `sources/archive/YYYY/YYYY-MM-DD/` with:
    - original images
    - `transcription.md`
    - `manifest.json` containing checksums, processing date, uncertainties, and changed item IDs
14. Summarize created, merged, and uncertain items. Commit the ingestion as one focused change when requested.

## Quality Rules

- Prefer improving an existing item over creating a near-duplicate.
- Do not overwrite conflicting information; retain both interpretations with an explanatory note.
- Keep entries useful for app practice, roleplay exercises, search, and spaced repetition.
- Treat archived sources as immutable after ingestion.
