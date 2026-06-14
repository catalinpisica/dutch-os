#!/usr/bin/env python3
"""Generate the portable ChatGPT context from canonical Dutch OS data."""

from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT / "chatgpt" / "dutch-os-chatgpt-context.md"
KNOWLEDGE_DIRS = (
    "words",
    "expressions",
    "particles",
    "grammar-patterns",
    "verb-constructions",
    "dialogues",
    "mistakes",
)
TYPE_HEADINGS = {
    "word": "Words",
    "expression": "Expressions",
    "particle": "Particles",
    "grammar_pattern": "Grammar Patterns",
    "verb_construction": "Verb Constructions",
    "dialogue": "Dialogues",
    "mistake": "Mistakes and Corrections",
}


def read_json(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def clean(value: object) -> str:
    return str(value).replace("\n", " ").strip()


def add_examples(lines: list[str], examples: list[dict[str, object]]) -> None:
    for example in examples:
        lines.append(
            "  - Example: "
            f"{clean(example['dutch'])} = {clean(example['english'])} "
            f"[{clean(example['source_type'])}]"
        )


def add_common_details(lines: list[str], item: dict[str, object]) -> None:
    tags = [tag for tag in item.get("tags", []) if tag != item["week_start"]]
    if tags:
        lines.append(f"  - Tags: {', '.join(clean(tag) for tag in tags)}")
    add_examples(lines, item.get("examples", []))
    if item.get("notes"):
        lines.append(f"  - Notes: {clean(item['notes'])}")


def render_item(lines: list[str], item: dict[str, object]) -> None:
    item_type = item["type"]
    item_id = clean(item["id"])
    if item_type == "dialogue":
        lines.append(f"- **{clean(item['title'])}** (`{item_id}`)")
        lines.append(f"  - Setting: {clean(item['setting'])}")
        if item.get("target_ids"):
            lines.append(f"  - Targets: {', '.join(item['target_ids'])}")
        for turn in item["turns"]:
            lines.append(
                f"  - {clean(turn['speaker'])}: {clean(turn['dutch'])} "
                f"= {clean(turn['english'])}"
            )
        if item.get("notes"):
            lines.append(f"  - Notes: {clean(item['notes'])}")
        return

    if item_type == "mistake":
        lines.append(
            f"- **{clean(item['incorrect'])} -> {clean(item['correct'])}** "
            f"(`{item_id}`): {clean(item['english'])}"
        )
        lines.append(f"  - Status: {clean(item['status'])}")
        add_common_details(lines, item)
        return

    lines.append(
        f"- **{clean(item['dutch'])}** (`{item_id}`): {clean(item['english'])}"
    )
    lines.append(f"  - Category: {clean(item['category'])}")
    if item_type == "word":
        lines.append(f"  - Part of speech: {clean(item['part_of_speech'])}")
        if item.get("article"):
            lines.append(f"  - Article: {clean(item['article'])}")
        if item.get("plural"):
            lines.append(f"  - Plural: {clean(item['plural'])}")
    elif item_type == "expression":
        lines.append(f"  - Register: {clean(item['register'])}")
    elif item_type == "particle":
        lines.append(f"  - Functions: {'; '.join(item['functions'])}")
        lines.append(f"  - Tone effect: {clean(item['tone_effect'])}")
    elif item_type == "grammar_pattern":
        lines.append(f"  - Pattern: {clean(item['pattern'])}")
        lines.append(f"  - Explanation: {clean(item['explanation'])}")
        if item.get("constraints"):
            lines.append(f"  - Constraints: {'; '.join(item['constraints'])}")
    elif item_type == "verb_construction":
        lines.append(f"  - Construction: {clean(item['construction'])}")
        lines.append(f"  - Word order: {clean(item['word_order_notes'])}")
        if item.get("fixed_preposition"):
            lines.append(
                f"  - Fixed preposition: {clean(item['fixed_preposition'])}"
            )
        lines.append(f"  - Separable: {'yes' if item['separable'] else 'no'}")
    add_common_details(lines, item)


def render_review(lines: list[str], review: dict[str, object]) -> None:
    labels = {
        "recall": "Recall",
        "translation": "Translation",
        "cloze": "Cloze",
        "grammar": "Grammar",
        "roleplay": "Roleplay",
    }
    lines.append("### Prepared Review")
    if review.get("focus_ids"):
        lines.append(f"Focus IDs: {', '.join(review['focus_ids'])}")
        lines.append("")
    for section, label in labels.items():
        exercises = review.get(section, [])
        if not exercises:
            continue
        lines.append(f"#### {label}")
        for exercise in exercises:
            lines.append(f"- Prompt: {clean(exercise['prompt'])}")
            lines.append(f"  - Answer: {clean(exercise['answer'])}")
            lines.append(f"  - Targets: {', '.join(exercise['target_ids'])}")
        lines.append("")
    if review.get("mistake_ids"):
        lines.append(f"Mistakes to revisit: {', '.join(review['mistake_ids'])}")
        lines.append("")


def build_chatgpt_context(root: Path = ROOT) -> str:
    items: list[dict[str, object]] = []
    for directory in KNOWLEDGE_DIRS:
        items.extend(read_json(root / "knowledge" / directory / "items.json"))
    reviews = read_json(root / "reviews" / "items.json")
    catalog = read_json(root / "metadata" / "catalog.json")

    by_week: dict[str, list[dict[str, object]]] = defaultdict(list)
    for item in items:
        by_week[item["week_start"]].append(item)
    reviews_by_week = {review["week_start"]: review for review in reviews}
    weeks = sorted(by_week)
    counts = Counter(item["type"] for item in items)

    lines = [
        "# Dutch OS ChatGPT Context",
        "",
        f"Generated from canonical repository data: {catalog['generated_at']}",
        f"Latest learning week starts: {weeks[-1]}",
        f"Total learned items: {len(items)}",
        "",
        "## How To Use This File",
        "",
        "This file is the learner's portable Dutch memory for ChatGPT text chat and Voice mode.",
        "Treat the learned material below as authoritative. Do not assume the learner has studied Dutch that is absent from this file.",
        "Weeks start on Monday and are identified by ISO dates. Resolve 'this week', 'last week', and similar requests using the conversation's current date and these Monday week-start dates.",
        "Use the most recent matching week for recent-practice requests. Use active mistakes and prepared reviews when the learner asks what to practice.",
        "In Voice mode, keep turns short and natural. In text chat, use concise formatting. Conduct most practice in Dutch, explain briefly in English when needed, and correct errors clearly.",
        "Generated examples are practice material; examples marked class_note came from source notes.",
        "",
        "## Contents",
        "",
        f"Weeks included: {', '.join(weeks)}",
        "Counts: " + ", ".join(
            f"{TYPE_HEADINGS[item_type]} {counts[item_type]}"
            for item_type in TYPE_HEADINGS
        ),
        "",
    ]

    for week_start in reversed(weeks):
        week_items = by_week[week_start]
        lines.append(f"## Week Starting {week_start}")
        lines.append("")
        lines.append(f"Items first learned in this batch: {len(week_items)}")
        lines.append("")
        for item_type, heading in TYPE_HEADINGS.items():
            typed_items = [item for item in week_items if item["type"] == item_type]
            if not typed_items:
                continue
            lines.append(f"### {heading}")
            for item in typed_items:
                render_item(lines, item)
            lines.append("")
        review = reviews_by_week.get(week_start)
        if review:
            render_review(lines, review)

    return "\n".join(lines).rstrip() + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--check",
        action="store_true",
        help="Fail when the committed ChatGPT context is stale.",
    )
    args = parser.parse_args()
    expected = build_chatgpt_context()
    if args.check:
        if not OUTPUT_PATH.is_file() or OUTPUT_PATH.read_text(encoding="utf-8") != expected:
            print(f"ChatGPT context is stale: {OUTPUT_PATH.relative_to(ROOT)}")
            return 1
        print(f"ChatGPT context is current: {OUTPUT_PATH.relative_to(ROOT)}")
        return 0
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(expected, encoding="utf-8")
    print(f"Generated {OUTPUT_PATH.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
