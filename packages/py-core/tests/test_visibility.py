"""Visibility conditions — key vectors mirrored from packages/core (visibility +
decision) to keep the Python port faithful."""
from janus_core import evaluate_visible_if, is_page_visible


def test_no_condition_is_visible():
    assert evaluate_visible_if(None, {}) is True
    assert evaluate_visible_if({}, {}) is True


def test_eq_and_not_eq():
    assert evaluate_visible_if({"eq": ["level", "adv"]}, {"level": "adv"}) is True
    assert evaluate_visible_if({"eq": ["level", "adv"]}, {"level": "beg"}) is False
    assert evaluate_visible_if({"not_eq": ["level", "adv"]}, {"level": "beg"}) is True


def test_has_any_has_none():
    assert evaluate_visible_if({"has_any": "ws"}, {"ws": ["a"]}) is True
    assert evaluate_visible_if({"has_any": "ws"}, {"ws": []}) is False
    assert evaluate_visible_if({"has_any": "ws"}, {"ws": {"a": 0, "b": 2}}) is True
    assert evaluate_visible_if({"has_none": "ws"}, {"ws": []}) is True
    assert evaluate_visible_if({"has_none": "ws"}, {"ws": ["a"]}) is False
    assert evaluate_visible_if({"has_none": "ws"}, {"ws": {"a": 0}}) is True


def test_numeric_comparisons_and_missing():
    assert evaluate_visible_if({"less_than": ["n", 5]}, {"n": 3}) is True
    assert evaluate_visible_if({"greater_than": ["n", 5]}, {"n": 7}) is True
    # missing field → NaN comparison → False (matches JS Number(undefined))
    assert evaluate_visible_if({"less_than": ["n", 5]}, {}) is False


def test_date_before_after_with_now_override():
    assert evaluate_visible_if({"before": "2020-01-01"}, {}, now="2019-06-01") is True
    assert evaluate_visible_if({"before": "2020-01-01"}, {}, now="2021-06-01") is False
    assert evaluate_visible_if({"after": "2020-01-01"}, {}, now="2021-06-01") is True


def test_prev_conditions_need_previous_answers():
    assert evaluate_visible_if({"prev_increased": "n"}, {"n": 5}) is False  # no previous
    assert evaluate_visible_if({"prev_increased": "n"}, {"n": 5}, previous_answers={"n": 3}) is True
    assert evaluate_visible_if({"prev_decreased": "n"}, {"n": 2}, previous_answers={"n": 3}) is True
    assert evaluate_visible_if({"prev_changed": "n"}, {"n": 2}, previous_answers={"n": 3}) is True
    assert evaluate_visible_if({"prev_unchanged": "n"}, {"n": 3}, previous_answers={"n": 3}) is True


def test_page_gating_by_decision_rules():
    rules = [{"branches": [{"condition": {"eq": ["role", "teacher"]}, "pages": ["teacher_page"]}], "default": []}]
    # ungated page always visible
    assert is_page_visible({"id": "main"}, rules, {"role": "attendee"}) is True
    # gated page visible only when its branch is active
    assert is_page_visible({"id": "teacher_page"}, rules, {"role": "teacher"}) is True
    assert is_page_visible({"id": "teacher_page"}, rules, {"role": "attendee"}) is False
