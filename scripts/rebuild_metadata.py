#!/usr/bin/env python3
"""Rebuild derived metadata from canonical knowledge files."""

import json
from collections import Counter
from datetime import date
from pathlib import Path

from generate_chatgpt_context import build_chatgpt_context


ROOT = Path(__file__).resolve().parents[1]
KNOWLEDGE_DIRS = (
    "words",
    "expressions",
    "particles",
    "grammar-patterns",
    "verb-constructions",
    "dialogues",
    "mistakes",
)

SOURCE_PATHS = {
    directory: f"knowledge/{directory}/items.json"
    for directory in KNOWLEDGE_DIRS
}


def read_json(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, value) -> None:
    with path.open("w", encoding="utf-8") as handle:
        json.dump(value, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def main() -> None:
    generated_at = date.today().isoformat()
    items = []
    item_source_paths = {}
    totals = {}

    for directory in KNOWLEDGE_DIRS:
        source_path = SOURCE_PATHS[directory]
        category_items = read_json(ROOT / source_path)
        items.extend(category_items)
        item_source_paths.update(
            {item["id"]: source_path for item in category_items}
        )
        totals[directory] = len(category_items)

    catalog_items = []
    for item in items:
        if item["type"] == "dialogue":
            dutch = item["title"]
            english = item["setting"]
            category = "dialogue"
        elif item["type"] == "mistake":
            dutch = item["correct"]
            english = item["english"]
            category = item["category"]
        else:
            dutch = item["dutch"]
            english = item["english"]
            category = item["category"]

        catalog_items.append(
            {
                "id": item["id"],
                "type": item["type"],
                "dutch": dutch,
                "english": english,
                "category": category,
                "week_start": item["week_start"],
                "tags": item["tags"],
                "source_path": item_source_paths[item["id"]],
            }
        )
    write_json(
        ROOT / "metadata" / "catalog.json",
        {
            "generated_at": generated_at,
            "item_count": len(items),
            "items": catalog_items,
        },
    )

    tag_counts = Counter(tag for item in items for tag in item["tags"])
    write_json(
        ROOT / "metadata" / "tags.json",
        {
            "generated_at": generated_at,
            "tags": [
                {"tag": tag, "count": count}
                for tag, count in sorted(tag_counts.items())
            ],
        },
    )

    week_counts = Counter(item["week_start"] for item in items)
    write_json(
        ROOT / "metadata" / "statistics.json",
        {
            "generated_at": generated_at,
            "totals": {"knowledge_items": len(items), **totals},
            "by_week_start": dict(sorted(week_counts.items())),
        },
    )

    counts_by_type = Counter(item["type"] for item in items)
    latest_week_start = max(week_counts)
    write_json(
        ROOT / "metadata" / "ai-entrypoint.json",
        {
            "schema_version": "1.0",
            "repo_purpose": (
                "Dutch OS is the learner's AI-maintained, long-term Dutch "
                "language memory and tutoring dataset."
            ),
            "source_of_truth": (
                "Canonical learning data lives in knowledge/**/items.json and "
                "reviews/items.json. Metadata is derived; sources/archive is "
                "immutable evidence."
            ),
            "recommended_fetch_order": [
                "metadata/ai-entrypoint.json",
                "metadata/catalog.json",
                "reviews/items.json",
                "prompts/chatgpt-tutor-entrypoint.md",
                "prompts/tutor.md",
            ],
            "total_items": len(items),
            "counts_by_type": dict(sorted(counts_by_type.items())),
            "latest_week_start": latest_week_start,
            "paths": {
                "manifest": "MANIFEST.md",
                "catalog": "metadata/catalog.json",
                "statistics": "metadata/statistics.json",
                "tags": "metadata/tags.json",
                "needs_review": "metadata/needs_review.json",
                "reviews": "reviews/items.json",
                "chatgpt_context": "chatgpt/dutch-os-chatgpt-context.md",
                "tutoring_entrypoint": "prompts/chatgpt-tutor-entrypoint.md",
                "tutoring_prompt": "prompts/tutor.md",
                "ingestion_prompt": "prompts/ingest-weekly-notes.md",
                "schemas": {
                    "common": "schemas/common.schema.json",
                    "words": "schemas/words.schema.json",
                    "expressions": "schemas/expressions.schema.json",
                    "particles": "schemas/particles.schema.json",
                    "grammar_patterns": "schemas/grammar-patterns.schema.json",
                    "verb_constructions": "schemas/verb-constructions.schema.json",
                    "dialogues": "schemas/dialogues.schema.json",
                    "mistakes": "schemas/mistakes.schema.json",
                    "reviews": "schemas/reviews.schema.json",
                    "needs_review": "schemas/needs-review.schema.json",
                },
                "canonical": SOURCE_PATHS,
            },
        },
    )

    chatgpt_path = ROOT / "chatgpt" / "dutch-os-chatgpt-context.md"
    chatgpt_path.parent.mkdir(parents=True, exist_ok=True)
    chatgpt_path.write_text(build_chatgpt_context(ROOT), encoding="utf-8")

    print(
        f"Rebuilt metadata for {len(items)} canonical items and generated "
        "the ChatGPT context."
    )


if __name__ == "__main__":
    main()
