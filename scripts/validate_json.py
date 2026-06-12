#!/usr/bin/env python3
"""Validate Dutch OS JSON syntax and repository integrity."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ARRAY_ROOTS = (ROOT / "knowledge", ROOT / "reviews")
BASE_REQUIRED = {
    "id", "type", "dutch", "english", "category", "examples", "week",
    "source_images", "ingestion_date", "tags", "notes",
}
CATEGORY_REQUIRED = {
    "words": BASE_REQUIRED | {"part_of_speech", "article", "plural"},
    "expressions": BASE_REQUIRED | {"register"},
    "particles": BASE_REQUIRED | {"functions", "tone_effect"},
    "grammar-patterns": BASE_REQUIRED | {"pattern", "explanation", "constraints"},
    "verb-constructions": BASE_REQUIRED | {
        "infinitive", "construction", "word_order_notes",
        "fixed_preposition", "separable",
    },
    "dialogues": {
        "id", "type", "title", "setting", "week", "source_images",
        "ingestion_date", "tags", "target_ids", "turns", "notes",
    },
    "mistakes": {
        "id", "type", "incorrect", "correct", "english", "category",
        "week", "source_images", "ingestion_date", "tags", "status", "notes",
    },
}


def contains_forbidden_romanian_key(value: object) -> bool:
    if isinstance(value, dict):
        return any(
            key.lower() == "romanian" or contains_forbidden_romanian_key(child)
            for key, child in value.items()
        )
    if isinstance(value, list):
        return any(contains_forbidden_romanian_key(child) for child in value)
    return False


def main() -> int:
    failures: list[str] = []
    parsed: dict[Path, object] = {}
    files = sorted(
        path
        for path in ROOT.rglob("*.json")
        if ".git" not in path.parts
    )

    for path in files:
        try:
            with path.open(encoding="utf-8") as handle:
                value = json.load(handle)
        except (OSError, json.JSONDecodeError) as error:
            failures.append(f"{path.relative_to(ROOT)}: {error}")
            continue

        parsed[path] = value

        if contains_forbidden_romanian_key(value):
            failures.append(
                f"{path.relative_to(ROOT)}: contains a forbidden Romanian field"
            )

        if path.name == "items.json" and any(
            path.is_relative_to(root) for root in ARRAY_ROOTS
        ):
            if not isinstance(value, list):
                failures.append(
                    f"{path.relative_to(ROOT)}: expected a top-level JSON array"
                )

    all_items: list[dict[str, object]] = []
    ids: set[str] = set()
    for category, required in CATEGORY_REQUIRED.items():
        path = ROOT / "knowledge" / category / "items.json"
        value = parsed.get(path)
        if not isinstance(value, list):
            continue
        for index, item in enumerate(value):
            location = f"{path.relative_to(ROOT)}[{index}]"
            if not isinstance(item, dict):
                failures.append(f"{location}: expected an object")
                continue
            missing = sorted(required - item.keys())
            if missing:
                failures.append(f"{location}: missing fields {', '.join(missing)}")
            item_id = item.get("id")
            if not isinstance(item_id, str) or not item_id:
                failures.append(f"{location}: invalid id")
            elif item_id in ids:
                failures.append(f"{location}: duplicate id {item_id}")
            else:
                ids.add(item_id)
            if not re.fullmatch(r"week_[0-9]{2,}", str(item.get("week", ""))):
                failures.append(f"{location}: invalid course week")
            source_images = item.get("source_images")
            if not isinstance(source_images, list) or not source_images:
                failures.append(f"{location}: source_images must be a non-empty array")
            else:
                for source_image in source_images:
                    if not isinstance(source_image, str) or not (ROOT / source_image).is_file():
                        failures.append(f"{location}: missing source image {source_image}")
            if "examples" in item:
                examples = item.get("examples")
                if not isinstance(examples, list):
                    failures.append(f"{location}: examples must be an array")
                else:
                    for example_index, example in enumerate(examples):
                        if not isinstance(example, dict) or not {
                            "dutch", "english", "source_type"
                        }.issubset(example):
                            failures.append(
                                f"{location}.examples[{example_index}]: invalid example"
                            )
            all_items.append(item)

    review_path = ROOT / "reviews" / "items.json"
    reviews = parsed.get(review_path)
    review_required = {
        "id", "type", "week", "ingestion_date", "source_images",
        "focus_ids", "recall", "translation", "cloze", "grammar",
        "roleplay", "mistake_ids", "needs_review", "notes",
    }
    if isinstance(reviews, list):
        for index, review in enumerate(reviews):
            location = f"{review_path.relative_to(ROOT)}[{index}]"
            if not isinstance(review, dict):
                failures.append(f"{location}: expected an object")
                continue
            missing = sorted(review_required - review.keys())
            if missing:
                failures.append(f"{location}: missing fields {', '.join(missing)}")
            for source_image in review.get("source_images", []):
                if not (ROOT / source_image).is_file():
                    failures.append(f"{location}: missing source image {source_image}")
            references = list(review.get("focus_ids", [])) + list(
                review.get("mistake_ids", [])
            )
            for section in ("recall", "translation", "cloze", "grammar", "roleplay"):
                for exercise in review.get(section, []):
                    references.extend(exercise.get("target_ids", []))
            for reference in references:
                if reference not in ids:
                    failures.append(f"{location}: dangling reference {reference}")

    for item in all_items:
        for reference in item.get("target_ids", []):
            if reference not in ids:
                failures.append(f"{item['id']}: dangling target id {reference}")

    catalog = parsed.get(ROOT / "metadata" / "catalog.json")
    if isinstance(catalog, dict) and catalog.get("item_count") != len(all_items):
        failures.append(
            "metadata/catalog.json: item_count does not match canonical knowledge"
        )

    if failures:
        print("JSON validation failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print(
        f"Validated {len(files)} JSON files and {len(all_items)} canonical items."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
