"""Ported from packages/core/__tests__/pricing.test.ts — keeps the Python port in
lockstep with the TypeScript @janus/core."""
from janus_core import calculate_payment_details, evaluate_price_rule

# --- evaluate_price_rule: nested switch ------------------------------------

def test_flat_switch_returns_matching_case():
    rule = {"switch": {"field": "ticket", "cases": {"full": 10000, "half": 5000}, "default": 0}}
    assert evaluate_price_rule(rule, {"ticket": "full"}) == 10000
    assert evaluate_price_rule(rule, {"ticket": "half"}) == 5000


def test_nested_switch_resolves_both_levels():
    rule = {
        "switch": {
            "field": "ticket",
            "cases": {
                "full": {"switch": {"field": "age", "cases": {"adult": 19500, "child": 10000}, "default": 19500}},
                "half": {"switch": {"field": "age", "cases": {"adult": 11500, "child": 7000}, "default": 11500}},
            },
            "default": 0,
        }
    }
    assert evaluate_price_rule(rule, {"ticket": "full", "age": "adult"}) == 19500
    assert evaluate_price_rule(rule, {"ticket": "full", "age": "child"}) == 10000
    assert evaluate_price_rule(rule, {"ticket": "half", "age": "adult"}) == 11500
    assert evaluate_price_rule(rule, {"ticket": "half", "age": "child"}) == 7000
    assert evaluate_price_rule(rule, {"ticket": "full"}) == 19500  # missing age → default
    assert evaluate_price_rule(rule, {"age": "adult"}) == 0  # missing ticket → outer default


def test_nested_default_evaluates_as_rule():
    rule = {"switch": {"field": "ticket", "cases": {}, "default": {"switch": {"field": "age", "cases": {"adult": 100}, "default": 50}}}}
    assert evaluate_price_rule(rule, {"age": "adult"}) == 100
    assert evaluate_price_rule(rule, {"age": "child"}) == 50


# --- count_tier -------------------------------------------------------------

def test_count_tier_tuple_format():
    rule = {"count_tier": {"field": "workshops", "tiers": [[1, 1000], [3, 2500], [5, 4000]]}}
    assert evaluate_price_rule(rule, {"workshops": []}) == 0
    assert evaluate_price_rule(rule, {"workshops": ["a"]}) == 1000
    assert evaluate_price_rule(rule, {"workshops": ["a", "b"]}) == 1000
    assert evaluate_price_rule(rule, {"workshops": ["a", "b", "c"]}) == 2500
    assert evaluate_price_rule(rule, {"workshops": ["a", "b", "c", "d", "e"]}) == 4000


def test_count_tier_object_format():
    rule = {"count_tier": {"field": "workshops", "tiers": [{"min_count": 1, "price": 1000}, {"min_count": 3, "price": 2500}, {"min_count": 5, "price": 4000}]}}
    assert evaluate_price_rule(rule, {"workshops": ["a"]}) == 1000
    assert evaluate_price_rule(rule, {"workshops": ["a", "b", "c"]}) == 2500


def test_count_tier_edge_cases():
    rule = {"count_tier": {"field": "workshops", "tiers": [[1, 500]]}}
    assert evaluate_price_rule(rule, {}) == 0
    assert evaluate_price_rule(rule, {"workshops": "not-a-list"}) == 0
    assert evaluate_price_rule({"count_tier": {"field": "workshops", "tiers": []}}, {"workshops": ["a", "b"]}) == 0


def test_count_tier_sums_quantity_dict():
    rule = {"count_tier": {"field": "tickets", "tiers": [[1, 1000], [5, 4000]]}}
    assert evaluate_price_rule(rule, {"tickets": {"sat": 2, "sun": 2}}) == 1000
    assert evaluate_price_rule(rule, {"tickets": {"sat": 3, "sun": 3}}) == 4000
    assert evaluate_price_rule(rule, {"tickets": {"sat": 0}}) == 0


# --- per_quantity -----------------------------------------------------------

def test_per_quantity_multiplies_unit_by_qty():
    rule = {"per_quantity": {"field": "age_category", "prices": {"adult": 19500, "child": 10000}}}
    assert evaluate_price_rule(rule, {"age_category": {"adult": 1, "child": 2}}) == 19500 + 20000


def test_per_quantity_nested_switch():
    rule = {"per_quantity": {"field": "age_category", "prices": {
        "adult": {"switch": {"field": "ticket_type", "cases": {"full": 19500, "half": 11500}, "default": 0}},
        "child": {"switch": {"field": "ticket_type", "cases": {"full": 10000, "half": 7000}, "default": 0}},
    }}}
    assert evaluate_price_rule(rule, {"ticket_type": "full", "age_category": {"adult": 1, "child": 3}}) == 19500 + 30000
    assert evaluate_price_rule(rule, {"ticket_type": "half", "age_category": {"adult": 1, "child": 2}}) == 11500 + 14000


def test_per_quantity_misc():
    rule = {"per_quantity": {"field": "tickets", "prices": {"sat": 2000, "sun": 1500}}}
    assert evaluate_price_rule(rule, {"tickets": {"sat": 0, "sun": 2}}) == 3000
    assert evaluate_price_rule({"per_quantity": {"field": "tickets", "prices": {"sat": 2000}}}, {}) == 0
    assert evaluate_price_rule({"per_quantity": {"field": "tickets", "prices": {"sat": 2000}}}, {"tickets": "sat"}) == 0
    assert evaluate_price_rule({"per_quantity": {"field": "tickets", "prices": {"sat": 2000}}}, {"tickets": {"sun": 1}}) == 0
    free = {"per_quantity": {"field": "age_category", "prices": {"adult": 19500, "infant": 0}}}
    assert evaluate_price_rule(free, {"age_category": {"adult": 1, "infant": 2}}) == 19500


def test_literal_and_unknown_rule():
    assert evaluate_price_rule(5000, {}) == 5000
    assert evaluate_price_rule({"unknown_type": {}}, {}) == 0


# --- calculate_payment_details ---------------------------------------------

def test_hidden_option_price_not_in_total():
    form = {"currency": "EUR", "decimals": 2, "pages": [{"id": "p1", "title": "P", "questions": [
        {"id": "ticket", "type": "single_choice", "label": "Ticket", "options": [
            {"id": "early", "label": "Early", "price": 17500, "visible_if": {"before": "2020-01-01"}},
            {"id": "normal", "label": "Normal", "price": 19500},
        ]},
    ]}]}
    assert calculate_payment_details(form, {"ticket": "early"})["total"] == 0
    assert calculate_payment_details(form, {"ticket": "normal"})["total"] == 19500


def test_nested_switch_payment_total_and_line():
    form = {"currency": "EUR", "decimals": 2, "pages": [{"id": "p1", "title": "P", "questions": [
        {"id": "age", "type": "single_choice", "label": "Age", "options": [{"id": "adult", "label": "Adult"}, {"id": "child", "label": "Child"}]},
        {"id": "ticket", "type": "single_choice", "label": "Ticket", "options": [{"id": "full", "label": "Full"}]},
    ]}], "price_rules": [{"description": "Ticket price", "rule": {
        "switch": {"field": "ticket", "cases": {"full": {"switch": {"field": "age", "cases": {"adult": 19500, "child": 10000}, "default": 19500}}}, "default": 0}
    }}]}
    result = calculate_payment_details(form, {"ticket": "full", "age": "child"})
    assert result["total"] == 10000
    assert result["lines"][0]["description"] == "Ticket price"
    assert result["lines"][0]["price"] == 10000


def test_multi_choice_sums_and_currency():
    form = {"currency": "USD", "decimals": 2, "pages": [{"id": "p1", "title": "P", "questions": [
        {"id": "addons", "type": "multi_choice", "label": "Add-ons", "options": [
            {"id": "tshirt", "label": "T-shirt", "price": 2500},
            {"id": "lunch", "label": "Lunch", "price": 3000},
            {"id": "sticker", "label": "Sticker"},
        ]},
    ]}]}
    result = calculate_payment_details(form, {"addons": ["tshirt", "lunch"]})
    assert result["total"] == 5500
    assert len(result["lines"]) == 2
    assert result["currency"] == "USD"


def test_hidden_question_prices_excluded():
    form = {"currency": "EUR", "decimals": 2, "pages": [{"id": "p1", "title": "P", "questions": [
        {"id": "level", "type": "single_choice", "label": "Level", "options": [{"id": "beg", "label": "Beginner"}]},
        {"id": "extras", "type": "single_choice", "label": "Extras", "visible_if": {"eq": ["level", "adv"]}, "options": [{"id": "vip", "label": "VIP", "price": 5000}]},
    ]}]}
    assert calculate_payment_details(form, {"level": "beg", "extras": "vip"})["total"] == 0


def test_defaults_eur_two_decimals():
    result = calculate_payment_details({"pages": []}, {})
    assert result["currency"] == "EUR"
    assert result["decimals"] == 2
    assert result["total"] == 0
    assert result["lines"] == []


def test_quantity_choice_multiplies():
    form = {"currency": "EUR", "decimals": 2, "pages": [{"id": "p1", "title": "P", "questions": [
        {"id": "tickets", "type": "quantity_choice", "label": "Tickets", "options": [
            {"id": "sat", "label": "Saturday", "price": 2000},
            {"id": "sun", "label": "Sunday", "price": 1500},
        ]},
    ]}]}
    result = calculate_payment_details(form, {"tickets": {"sat": 3, "sun": 2}})
    assert result["total"] == 3 * 2000 + 2 * 1500
    assert result["lines"][0]["description"] == "Saturday x3"
    assert result["lines"][0]["price"] == 6000
    assert result["lines"][1]["description"] == "Sunday x2"


def test_zero_quantity_no_line():
    form = {"currency": "EUR", "decimals": 2, "pages": [{"id": "p1", "title": "P", "questions": [
        {"id": "tickets", "type": "quantity_choice", "label": "Tickets", "options": [{"id": "sat", "label": "Saturday", "price": 2000}]},
    ]}]}
    result = calculate_payment_details(form, {"tickets": {"sat": 0}})
    assert result["total"] == 0
    assert len(result["lines"]) == 0
