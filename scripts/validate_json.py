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
TYPE_TO_STAT_KEY = {
    "word": "words",
    "expression": "expressions",
    "particle": "particles",
    "grammar_pattern": "grammar-patterns",
    "verb_construction": "verb-constructions",
    "dialogue": "dialogues",
    "mistake": "mistakes",
}
CATEGORY_SOURCE_PATHS = {
    category: f"knowledge/{category}/items.json"
    for category in CATEGORY_REQUIRED
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


def nested_strings(value: object):
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for child in value.values():
            yield from nested_strings(child)
    elif isinstance(value, list):
        for child in value:
            yield from nested_strings(child)


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
    item_source_paths: dict[str, str] = {}
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
                item_source_paths[item_id] = CATEGORY_SOURCE_PATHS[category]
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

    catalog_path = ROOT / "metadata" / "catalog.json"
    catalog = parsed.get(catalog_path)
    catalog_items: list[dict[str, object]] = []
    if not isinstance(catalog, dict):
        failures.append("metadata/catalog.json: expected an object")
    else:
        if catalog.get("item_count") != len(all_items):
            failures.append(
                "metadata/catalog.json: item_count does not match canonical knowledge"
            )
        raw_catalog_items = catalog.get("items")
        if not isinstance(raw_catalog_items, list):
            failures.append("metadata/catalog.json: items must be an array")
        else:
            catalog_items = [
                item for item in raw_catalog_items if isinstance(item, dict)
            ]
            if len(catalog_items) != len(raw_catalog_items):
                failures.append(
                    "metadata/catalog.json: every catalog item must be an object"
                )

    canonical_by_id = {
        str(item["id"]): item
        for item in all_items
        if isinstance(item.get("id"), str)
    }
    catalog_ids: set[str] = set()
    catalog_required = {
        "id", "type", "dutch", "english", "category", "week", "tags",
        "source_path",
    }
    for index, catalog_item in enumerate(catalog_items):
        location = f"metadata/catalog.json.items[{index}]"
        missing = sorted(catalog_required - catalog_item.keys())
        if missing:
            failures.append(f"{location}: missing fields {', '.join(missing)}")
            continue
        item_id = catalog_item.get("id")
        if not isinstance(item_id, str):
            failures.append(f"{location}: invalid id")
            continue
        if item_id in catalog_ids:
            failures.append(f"{location}: duplicate id {item_id}")
        catalog_ids.add(item_id)
        canonical_item = canonical_by_id.get(item_id)
        if canonical_item is None:
            failures.append(f"{location}: unknown canonical id {item_id}")
            continue
        if canonical_item["type"] == "dialogue":
            expected_dutch = canonical_item["title"]
            expected_english = canonical_item["setting"]
            expected_category = "dialogue"
        elif canonical_item["type"] == "mistake":
            expected_dutch = canonical_item["correct"]
            expected_english = canonical_item["english"]
            expected_category = canonical_item["category"]
        else:
            expected_dutch = canonical_item["dutch"]
            expected_english = canonical_item["english"]
            expected_category = canonical_item["category"]
        expected_catalog_values = {
            "type": canonical_item["type"],
            "dutch": expected_dutch,
            "english": expected_english,
            "category": expected_category,
            "week": canonical_item["week"],
            "tags": canonical_item["tags"],
        }
        for field, expected_value in expected_catalog_values.items():
            if catalog_item.get(field) != expected_value:
                failures.append(
                    f"{location}: stale or incorrect {field}"
                )
        source_path = catalog_item.get("source_path")
        expected_source_path = item_source_paths[item_id]
        if source_path != expected_source_path:
            failures.append(
                f"{location}: source_path must be {expected_source_path}"
            )
        if not isinstance(source_path, str) or not (ROOT / source_path).is_file():
            failures.append(f"{location}: missing source_path {source_path}")

    if catalog_ids != set(canonical_by_id):
        missing_ids = sorted(set(canonical_by_id) - catalog_ids)
        if missing_ids:
            failures.append(
                "metadata/catalog.json: missing canonical ids "
                + ", ".join(missing_ids)
            )

    statistics = parsed.get(ROOT / "metadata" / "statistics.json")
    expected_type_counts = {
        item_type: sum(item.get("type") == item_type for item in all_items)
        for item_type in TYPE_TO_STAT_KEY
    }
    if not isinstance(statistics, dict):
        failures.append("metadata/statistics.json: expected an object")
    else:
        totals = statistics.get("totals")
        if not isinstance(totals, dict):
            failures.append("metadata/statistics.json: totals must be an object")
        else:
            if totals.get("knowledge_items") != len(all_items):
                failures.append(
                    "metadata/statistics.json: knowledge_items is inconsistent"
                )
            for item_type, stat_key in TYPE_TO_STAT_KEY.items():
                if totals.get(stat_key) != expected_type_counts[item_type]:
                    failures.append(
                        f"metadata/statistics.json: inconsistent {stat_key} count"
                    )

    entrypoint = parsed.get(ROOT / "metadata" / "ai-entrypoint.json")
    if not isinstance(entrypoint, dict):
        failures.append("metadata/ai-entrypoint.json: expected an object")
    else:
        if entrypoint.get("total_items") != len(catalog_items):
            failures.append(
                "metadata/ai-entrypoint.json: total_items does not match catalog"
            )
        catalog_type_counts = {
            item_type: sum(
                item.get("type") == item_type for item in catalog_items
            )
            for item_type in TYPE_TO_STAT_KEY
        }
        if entrypoint.get("counts_by_type") != catalog_type_counts:
            failures.append(
                "metadata/ai-entrypoint.json: counts do not match catalog"
            )
        if entrypoint.get("counts_by_type") != expected_type_counts:
            failures.append(
                "metadata/ai-entrypoint.json: counts do not match statistics"
            )
        expected_latest_week = max(
            (str(item["week"]) for item in all_items),
            key=lambda week: int(week.removeprefix("week_")),
        )
        if entrypoint.get("latest_week") != expected_latest_week:
            failures.append(
                "metadata/ai-entrypoint.json: latest_week is inconsistent"
            )
        if entrypoint.get("latest_batch") != expected_latest_week:
            failures.append(
                "metadata/ai-entrypoint.json: latest_batch is inconsistent"
            )

        fetch_order = entrypoint.get("recommended_fetch_order")
        if not isinstance(fetch_order, list) or fetch_order[:2] != [
            "metadata/ai-entrypoint.json",
            "metadata/catalog.json",
        ]:
            failures.append(
                "metadata/ai-entrypoint.json: invalid recommended fetch order"
            )
        else:
            for listed_path in fetch_order:
                if not isinstance(listed_path, str) or not (ROOT / listed_path).is_file():
                    failures.append(
                        "metadata/ai-entrypoint.json: missing fetch path "
                        f"{listed_path}"
                    )

        paths = entrypoint.get("paths")
        if not isinstance(paths, dict):
            failures.append("metadata/ai-entrypoint.json: paths must be an object")
        else:
            for listed_path in nested_strings(paths):
                if not (ROOT / listed_path).exists():
                    failures.append(
                        "metadata/ai-entrypoint.json: missing listed path "
                        f"{listed_path}"
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
