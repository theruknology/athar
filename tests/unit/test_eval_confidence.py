"""Confidence intervals and evaluation coverage (SPEC §17).

The Evaluation page's job is to stop "precision 1.00" being read as a stronger claim than the
sample supports. These pin the arithmetic behind that, because the failure mode is silent: an
interval that collapses to zero width at a perfect score looks like extra rigour while actually
removing the caveat.
"""

from __future__ import annotations

import pytest

from athar.eval.harness import MIN_SUPPORT, RuleConfusion, per_rule_confusion, wilson_interval


class TestWilsonInterval:
    def test_a_perfect_score_still_carries_a_lower_bound(self) -> None:
        """The whole reason this is a Wilson and not a normal interval."""
        low, high = wilson_interval(48, 48)
        assert high == 1.0
        assert 0.90 < low < 0.94, "48/48 should bound at roughly 92.6%, not at 100%"

    def test_the_interval_narrows_as_the_sample_grows(self) -> None:
        small_low, _ = wilson_interval(5, 5)
        large_low, _ = wilson_interval(500, 500)
        assert large_low > small_low
        assert small_low < 0.6, "five perfect samples evidence very little"

    def test_a_perfect_score_on_one_sample_is_almost_no_evidence(self) -> None:
        low, _ = wilson_interval(1, 1)
        assert low < 0.3

    def test_no_trials_is_not_a_score_of_zero(self) -> None:
        assert wilson_interval(0, 0) == (0.0, 0.0)

    def test_bounds_stay_inside_zero_and_one(self) -> None:
        for successes, trials in ((0, 3), (1, 2), (7, 9), (0, 1), (100, 100)):
            low, high = wilson_interval(successes, trials)
            assert 0.0 <= low <= high <= 1.0

    def test_a_total_miss_bounds_above_zero_not_at_it(self) -> None:
        low, high = wilson_interval(0, 20)
        assert low == 0.0
        assert 0.0 < high < 0.2


class TestRuleSupport:
    def test_a_rule_with_no_ground_truth_is_unexercised_not_perfect(self) -> None:
        """R7 is the live case: registered and tested, but this estate cannot produce a positive."""
        rows = {r.rule_id: r for r in per_rule_confusion({}, [])}
        assert rows, "the ruleset should always be enumerated, even with no data"
        for row in rows.values():
            assert row.support == 0
            assert row.exercised is False
            assert row.underpowered is False, "unexercised is a stronger statement than under-powered"
            assert row.precision is None and row.recall is None

    @pytest.mark.parametrize(
        ("support", "expect_underpowered"),
        [(1, True), (MIN_SUPPORT - 1, True), (MIN_SUPPORT, False), (MIN_SUPPORT + 50, False)],
    )
    def test_underpowered_is_decided_by_support_alone(self, support: int, expect_underpowered: bool) -> None:
        row = RuleConfusion(
            rule_id="R1",
            tp=support,
            fp=0,
            fn=0,
            support=support,
            exercised=support > 0,
            underpowered=0 < support < MIN_SUPPORT,
        )
        assert row.underpowered is expect_underpowered
