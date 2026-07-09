"""janus_core — Python port of @janus/core.

The backend's authoritative implementation of the form spec's pure logic:
pricing, visibility, and decision rules. Mirrors the TypeScript @janus/core and
is kept in lockstep with it via shared test vectors.
"""
from .decision import evaluate_decision_rules, is_page_gated, is_page_visible
from .pricing import calculate_payment_details, evaluate_price_rule
from .visibility import (
    evaluate_visible_if,
    is_option_visible,
    is_question_visible,
    visible_options,
    visible_pages,
)

__all__ = [
    "calculate_payment_details",
    "evaluate_price_rule",
    "evaluate_visible_if",
    "is_question_visible",
    "is_option_visible",
    "visible_options",
    "visible_pages",
    "evaluate_decision_rules",
    "is_page_gated",
    "is_page_visible",
]
