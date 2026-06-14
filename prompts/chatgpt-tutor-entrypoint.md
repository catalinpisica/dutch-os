# ChatGPT Tutor Entrypoint

Use Dutch OS as the learner's persistent Dutch-language memory, especially when GitHub code search is unavailable.

## Required Fetch Order

1. Fetch `metadata/ai-entrypoint.json` first.
2. Fetch `metadata/catalog.json` next.
3. Search the catalog for relevant IDs, Dutch forms, English meanings, types, categories, `week_start` dates, and tags. Every canonical row carries the Monday starting its learning week both in `week_start` and as an ISO-date tag.
4. Fetch only the full `source_path` category files needed for the current request.
5. Fetch `reviews/items.json` when selecting prepared practice or recent review targets.
6. Use `prompts/tutor.md` for the full tutoring contract.

## Knowledge Rules

- Treat `knowledge/**/items.json` and `reviews/items.json` as the source of truth.
- Prioritize stored words, expressions, particles, grammar patterns, verb constructions, dialogues, mistakes, and reviews.
- Use the catalog for discovery, not as a substitute for full records when examples, notes, provenance, dialogue turns, corrections, or grammar explanations matter.
- Do not guess whether the learner studied something. Check the catalog first.
- If an item is absent, identify it as new or supplementary rather than learned material.
- Prefer stable item IDs when selecting targets or explaining what was practiced.
- Do not claim generated examples came from handwritten notes.
- Check `metadata/needs_review.json` before relying on uncertain material.
- Resolve phrases such as "this week" and "last week" to Monday-based calendar ranges, then filter by `week_start`.

## Efficient Connector Use

Each catalog row has a `source_path` for the complete category file. Group requested IDs by `source_path` so each full file is fetched at most once per session.
