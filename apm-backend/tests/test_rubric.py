from app.rubric import PAID_FLOOR, TIERS, compute_difficulty, label_for


def test_tiers_are_contiguous_and_cover_0_to_100():
    assert TIERS[0][1] == 0 and TIERS[-1][2] == 100
    for (_, _, high), (_, low, _) in zip(TIERS, TIERS[1:]):
        assert low == high + 1


def test_every_score_has_a_label_matching_its_tier():
    for score in range(0, 101):
        label = label_for(score)
        _, low, high = next(t for t in TIERS if t[0] == label)
        assert low <= score <= high


def test_github_like_is_easy():
    d = compute_difficulty({"review_required_for_distribution": False, "requires_paid_plan": False})
    assert d.score == 0 and d.label == "EASY"


def test_restricted_scope_audit_stack_is_gated():
    d = compute_difficulty({
        "review_required_for_distribution": True, "uses_restricted_scopes": True,
        "requires_domain_verification": True, "requires_video_demo": True,
        "requires_security_audit": True, "review_wait_days_max": 42.0,
    })
    assert d.label == "GATED" and d.score <= 100


def test_paywall_forces_gated():
    d = compute_difficulty({"requires_paid_plan": True})
    assert d.score == PAID_FLOOR and d.label == "GATED"


def test_unknown_inputs_make_it_a_lower_bound():
    d = compute_difficulty({"review_required_for_distribution": True})
    assert d.lower_bound and "requires_security_audit" in d.unknown_inputs
    assert d.score == 25 and d.label == "MODERATE"


def test_no_review_means_wait_is_not_unknown():
    d = compute_difficulty({"review_required_for_distribution": False})
    assert "review_wait_days_max" not in d.unknown_inputs