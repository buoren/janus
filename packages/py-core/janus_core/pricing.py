"""Pricing — Python port of @janus/core `pricing.ts`.

`calculate_payment_details(form, answers)` is the authoritative charge for a
registration: the server computes it from the stored form (with its price rules)
and the submission's answers, so the amount can never be set by the client.

Prices are integers in the smallest currency unit (e.g. cents). Kept in lockstep
with the TS via shared test vectors. See packages/core/src/pricing.ts.
"""
from __future__ import annotations

from typing import Any

from .visibility import is_question_visible, visible_options, visible_pages


def _normalize_tier(tier: Any) -> tuple[int, int]:
    if isinstance(tier, (list, tuple)):
        return tier[0], tier[1]
    return tier["min_count"], tier["price"]


def evaluate_price_rule(rule: Any, answers: dict) -> float:
    """Evaluate a price_rule to a number. Supports plain number, switch,
    count_tier, and per_quantity (recursively)."""
    if isinstance(rule, bool):
        return 0
    if isinstance(rule, (int, float)):
        return rule
    if not isinstance(rule, dict):
        return 0

    if "switch" in rule:
        sw = rule["switch"]
        field_val = answers.get(sw["field"])
        cases = sw.get("cases") or {}
        if isinstance(field_val, (str, int, float)) and not isinstance(field_val, bool) and field_val in cases:
            result = cases[field_val]
            return evaluate_price_rule(result, answers) if isinstance(result, dict) else _number(result)
        default = sw.get("default", 0)
        return evaluate_price_rule(default, answers) if isinstance(default, dict) else _number(default)

    if "per_quantity" in rule:
        pq = rule["per_quantity"]
        field_val = answers.get(pq["field"])
        if not isinstance(field_val, dict):
            return 0
        prices = pq.get("prices") or {}
        total = 0
        for opt_id, qty in field_val.items():
            if not isinstance(qty, (int, float)) or isinstance(qty, bool) or qty <= 0:
                continue
            unit_rule = prices.get(opt_id)
            if unit_rule is None:
                continue
            unit_price = evaluate_price_rule(unit_rule, answers) if isinstance(unit_rule, dict) else _number(unit_rule)
            total += unit_price * qty
        return total

    if "count_tier" in rule:
        ct = rule["count_tier"]
        field_val = answers.get(ct["field"])
        if isinstance(field_val, dict):
            count = sum(_number(v) or 0 for v in field_val.values())
        elif isinstance(field_val, list):
            count = len(field_val)
        else:
            count = 0
        tiers = sorted((_normalize_tier(t) for t in (ct.get("tiers") or [])), key=lambda t: t[0])
        price = 0
        for tier_count, tier_price in tiers:
            if count >= tier_count:
                price = tier_price
        return price

    return 0


def _number(value: Any) -> float:
    try:
        return float(value) if not isinstance(value, bool) else (1.0 if value else 0.0)
    except (TypeError, ValueError):
        return 0


def calculate_payment_details(
    form: dict,
    answers: dict,
    now: str | None = None,
    previous_answers: dict | None = None,
) -> dict:
    """Full payment breakdown: sums prices from selected (visible) options, then
    evaluates the form's price_rules. Returns {currency, decimals, total, lines}."""
    currency = form.get("currency", "EUR")
    decimals = form.get("decimals", 2)
    lines: list[dict] = []
    sort_order = 0

    for page in visible_pages(form, answers, previous_answers):
        for q in page.get("questions") or []:
            if not is_question_visible(q, answers, now, previous_answers):
                continue
            answer = answers.get(q["id"])
            if answer is None:
                continue

            opts_by_id = {o["id"]: o for o in visible_options(q, answers, now, previous_answers)}
            qtype = q.get("type")

            if qtype == "single_choice" and answer in opts_by_id:
                opt = opts_by_id[answer]
                if opt.get("price") is not None:
                    sort_order += 1
                    lines.append({"description": opt.get("label"), "price": opt["price"], "sort_order": sort_order})
            elif qtype == "multi_choice" and isinstance(answer, list):
                for val in answer:
                    opt = opts_by_id.get(val)
                    if opt is not None and opt.get("price") is not None:
                        sort_order += 1
                        lines.append({"description": opt.get("label"), "price": opt["price"], "sort_order": sort_order})
            elif qtype == "quantity_choice" and isinstance(answer, dict):
                for opt_id, qty in answer.items():
                    opt = opts_by_id.get(opt_id)
                    if qty and qty > 0 and opt is not None and opt.get("price") is not None:
                        sort_order += 1
                        lines.append(
                            {"description": f"{opt.get('label')} x{qty}", "price": opt["price"] * qty, "sort_order": sort_order}
                        )

    for pr in form.get("price_rules") or []:
        if pr.get("rule") is None:
            continue
        price = evaluate_price_rule(pr["rule"], answers)
        if price > 0:
            sort_order += 1
            lines.append({"description": pr.get("description", "Calculated price"), "price": price, "sort_order": sort_order})

    total = sum(line["price"] for line in lines)
    return {"currency": currency, "decimals": decimals, "total": total, "lines": lines}
