# Weekly Notes Ingestion Prompt

Process the new handwritten Dutch notes currently placed under `sources/inbox/`.

## Inputs

- Target week start: `<YYYY-MM-DD>` (Monday)
- Optional class context: `<topic, textbook chapter, teacher correction, or leave blank>`

## Required Workflow

1. Inventory the new images and compute a checksum for each file. Determine reading order from EXIF capture time, then filename, then file modification time. Report ambiguous ordering rather than guessing.
2. Read every image carefully. Create a faithful transcription and mark uncertain text as `[uncertain: ...]`; never silently guess.
3. Extract candidate words, expressions, particles, grammar patterns, verb constructions, dialogues, and learner mistakes.
4. Search all existing `knowledge/**/items.json` files before creating anything.
5. Compare candidates using exact spelling, normalized forms, inflections, separable verbs, meaning, and usage. Merge genuine duplicates.
6. Preserve all previous sources, examples, notes, relations, and learning history when merging. Increment `exposure_count` and update `last_seen`.
7. Add idiomatic English translations or explanations. Do not add Romanian translations. Distinguish literal meaning from pragmatic meaning where useful.
8. Add concise examples. Label generated examples with `source_type: ai_generated`; never present them as class-note quotations.
9. Record archived source-image provenance for each item. Use stable IDs and the Monday week-start date, such as `2026-06-08`. Add that exact date to both `week_start` and the item's `tags` array.
10. Create or update a weekly review in `reviews/items.json`, emphasizing new material and recurring mistakes. Give the review the same `week_start` value and date tag.
11. Rebuild derived metadata and `chatgpt/dutch-os-chatgpt-context.md`; do not leave the portable ChatGPT snapshot stale.
12. Run `python3 scripts/validate_json.py` and fix all failures.
13. Move the completed source package to `sources/archive/YYYY/YYYY-MM-DD/` with:
    - original images
    - `transcription.md`
    - `manifest.json` containing checksums, processing date, uncertainties, and changed item IDs
14. Summarize created, merged, and uncertain items. Commit the ingestion as one focused change when requested.

## Quality Rules

- Prefer improving an existing item over creating a near-duplicate.
- Do not overwrite conflicting information; retain both interpretations with an explanatory note.
- Keep entries useful for future tutoring, voice practice, roleplay, search, and spaced repetition.
- Treat archived sources as immutable after ingestion.
