"""Decision rules — Python port of @janus/core `decision.ts`.

Gates whole pages of a form on cross-field conditions. Most forms have no
decision rules (then every page is visible). See packages/core/src/decision.ts.
"""
from __future__ import annotations

from .visibility import evaluate_visible_if


def evaluate_decision_rules(rules: list[dict], answers: dict, previous_answers: dict | None = None) -> set[str]:
    """The set of page ids made visible by the decision rules."""
    visible: set[str] = set()
    for rule in rules:
        matched = False
        for branch in rule.get("branches", []):
            if evaluate_visible_if(branch.get("condition"), answers, None, previous_answers):
                visible.update(branch.get("pages", []))
                matched = True
        if not matched and rule.get("default"):
            visible.update(rule["default"])
    return visible


def is_page_gated(page_id: str, rules: list[dict]) -> bool:
    """Whether a page is referenced by any rule (branch or default)."""
    for rule in rules:
        for branch in rule.get("branches", []):
            if page_id in branch.get("pages", []):
                return True
        if page_id in (rule.get("default") or []):
            return True
    return False


def is_page_visible(page: dict, rules: list[dict], answers: dict, previous_answers: dict | None = None) -> bool:
    """Ungated pages are always visible; gated pages only when an active branch
    includes them."""
    if not rules:
        return True
    if not is_page_gated(page.get("id"), rules):
        return True
    return page.get("id") in evaluate_decision_rules(rules, answers, previous_answers)
