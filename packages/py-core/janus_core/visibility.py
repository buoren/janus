"""Visibility conditions — Python port of @janus/core `visibility.ts`.

Forms and answers are plain JSON (dicts/lists), so this operates on dicts
directly. Keep behaviour identical to the TS: the two implementations are kept
in lockstep by the shared test vectors (see tests/). See also the JS source at
packages/core/src/visibility.ts.
"""
from __future__ import annotations

import math
from datetime import date, timezone
from datetime import datetime as _dt
from typing import Any


def _num(value: Any) -> float:
    """Mirror JS `Number(x)`: unparseable/None becomes NaN (so comparisons with
    it are always False, matching JS)."""
    if isinstance(value, bool):
        return 1.0 if value else 0.0
    try:
        return float(value)
    except (TypeError, ValueError):
        return math.nan


def _today() -> str:
    return _dt.now(timezone.utc).date().isoformat()


def evaluate_visible_if(
    condition: dict | None,
    answers: dict,
    now: str | None = None,
    previous_answers: dict | None = None,
) -> bool:
    """Evaluate a `visible_if` condition against current answers."""
    if not condition:
        return True

    if "has_any" in condition:
        val = answers.get(condition["has_any"])
        if isinstance(val, dict):
            return any((v or 0) > 0 for v in val.values())
        return isinstance(val, list) and len(val) > 0

    if "has_none" in condition:
        val = answers.get(condition["has_none"])
        if isinstance(val, dict):
            return all((v or 0) == 0 for v in val.values())
        return not isinstance(val, list) or len(val) == 0

    if "eq" in condition:
        field, expected = condition["eq"]
        return answers.get(field) == expected

    if "not_eq" in condition:
        field, expected = condition["not_eq"]
        return answers.get(field) != expected

    if "less_than" in condition:
        field, threshold = condition["less_than"]
        return _num(answers.get(field)) < threshold

    if "greater_than" in condition:
        field, threshold = condition["greater_than"]
        return _num(answers.get(field)) > threshold

    # prev_* conditions — all False when no previous answers are provided.
    if "prev_increased" in condition:
        if not previous_answers:
            return False
        field = condition["prev_increased"]
        curr, prev = _num(answers.get(field)), _num(previous_answers.get(field))
        if math.isnan(curr) or math.isnan(prev):
            return False
        return curr > prev

    if "prev_decreased" in condition:
        if not previous_answers:
            return False
        field = condition["prev_decreased"]
        curr, prev = _num(answers.get(field)), _num(previous_answers.get(field))
        if math.isnan(curr) or math.isnan(prev):
            return False
        return curr < prev

    if "prev_unchanged" in condition:
        if not previous_answers:
            return False
        field = condition["prev_unchanged"]
        return answers.get(field) == previous_answers.get(field)

    if "prev_changed" in condition:
        if not previous_answers:
            return False
        field = condition["prev_changed"]
        return answers.get(field) != previous_answers.get(field)

    if "prev_changed_from" in condition:
        if not previous_answers:
            return False
        field, value = condition["prev_changed_from"]
        return previous_answers.get(field) == value

    if "prev_changed_to" in condition:
        if not previous_answers:
            return False
        field, value = condition["prev_changed_to"]
        return answers.get(field) == value and previous_answers.get(field) != value

    today = now if now is not None else _today()

    if "before" in condition:
        return today < condition["before"]

    if "after" in condition:
        return today >= condition["after"]

    return True


def is_question_visible(question: dict, answers: dict, now: str | None = None, previous_answers: dict | None = None) -> bool:
    return evaluate_visible_if(question.get("visible_if"), answers, now, previous_answers)


def is_option_visible(option: dict, answers: dict, now: str | None = None, previous_answers: dict | None = None) -> bool:
    return evaluate_visible_if(option.get("visible_if"), answers, now, previous_answers)


def visible_options(question: dict, answers: dict, now: str | None = None, previous_answers: dict | None = None) -> list[dict]:
    return [o for o in (question.get("options") or []) if is_option_visible(o, answers, now, previous_answers)]


def visible_pages(form: dict, answers: dict, previous_answers: dict | None = None) -> list[dict]:
    from .decision import is_page_visible

    rules = form.get("decision_rules") or []
    pages = form.get("pages") or []
    if not rules:
        return pages
    return [p for p in pages if is_page_visible(p, rules, answers, previous_answers)]
