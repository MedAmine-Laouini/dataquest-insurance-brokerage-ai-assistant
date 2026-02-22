"""
test_preprocessing.py
---------------------
Unit tests for feature engineering and validation.
Run with: pytest tests/test_preprocessing.py -v
"""

import pandas as pd
import numpy as np
import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.preprocessing.feature_engineering import (
    fill_missing_values,
    build_dependent_features,
    build_income_features,
    build_policy_duration_features,
    build_quote_timing_features,
    build_interaction_features,
    build_claims_features,
    build_binary_flags,
    build_rule_features,
    preprocess,
    CATEGORICAL_COLS,
)
from src.preprocessing.validation import validate, ValidationReport


# ── Fixtures ──────────────────────────────────────────────────────────────────

def make_minimal_row(**overrides) -> dict:
    """Return a minimal valid raw record."""
    base = {
        "User_ID": 1,
        "Estimated_Annual_Income": 60000,
        "Adult_Dependents": 1,
        "Child_Dependents": None,
        "Infant_Dependents": 0,
        "Previous_Policy_Duration_Months": 12,
        "Days_Since_Quote": 30,
        "Grace_Period_Extensions": 0,
        "Custom_Riders_Requested": 2,
        "Vehicles_on_Policy": 1,
        "Policy_Amendments_Count": 0,
        "Previous_Claims_Filed": 1,
        "Years_Without_Claims": 2,
        "Underwriting_Processing_Days": 5,
        "Region_Code": "R01",
        "Broker_Agency_Type": "Independent",
        "Deductible_Tier": "Tier_2",
        "Acquisition_Channel": "Online",
        "Payment_Schedule": "Monthly",
        "Employment_Status": "Employed",
        "Policy_Start_Month": "January",
        "Broker_ID": None,
        "Employer_ID": 100,
    }
    base.update(overrides)
    return base


def make_df(*rows) -> pd.DataFrame:
    return pd.DataFrame([make_minimal_row(**r) for r in rows])


# ── Missing value tests ───────────────────────────────────────────────────────

class TestFillMissingValues:
    def test_child_dependents_null_filled_zero(self):
        df = make_df({"Child_Dependents": None})
        out = fill_missing_values(df)
        assert out["Child_Dependents"].iloc[0] == 0

    def test_has_broker_flag_correct(self):
        df = make_df({"Broker_ID": None}, {"Broker_ID": 42})
        out = fill_missing_values(df)
        assert out["Has_Broker"].tolist() == [0, 1]

    def test_broker_id_null_becomes_minus_one(self):
        df = make_df({"Broker_ID": None})
        out = fill_missing_values(df)
        assert out["Broker_ID"].iloc[0] == -1

    def test_no_side_effects_on_input(self):
        df = make_df()
        _ = fill_missing_values(df)
        assert df["Child_Dependents"].iloc[0] is None  # original unchanged


# ── Dependent feature tests ───────────────────────────────────────────────────

class TestDependentFeatures:
    def test_total_dependents_sum(self):
        df = fill_missing_values(make_df(
            {"Adult_Dependents": 2, "Child_Dependents": 1, "Infant_Dependents": 0}
        ))
        out = build_dependent_features(df)
        assert out["Total_Dependents"].iloc[0] == 3

    def test_family_size_includes_self(self):
        df = fill_missing_values(make_df(
            {"Adult_Dependents": 0, "Child_Dependents": 0, "Infant_Dependents": 0}
        ))
        out = build_dependent_features(df)
        assert out["Family_Size"].iloc[0] == 1

    def test_has_children_true_when_infant(self):
        df = fill_missing_values(make_df(
            {"Child_Dependents": 0, "Infant_Dependents": 1}
        ))
        out = build_dependent_features(df)
        assert out["Has_Children"].iloc[0] == 1


# ── Policy duration tests ─────────────────────────────────────────────────────

class TestPolicyDuration:
    def test_is_new_policy_zero_months(self):
        df = fill_missing_values(make_df({"Previous_Policy_Duration_Months": 0}))
        out = build_policy_duration_features(df)
        assert out["Is_New_Policy"].iloc[0] == 1

    def test_duration_bucket_zero_for_new(self):
        df = fill_missing_values(make_df({"Previous_Policy_Duration_Months": 0}))
        out = build_policy_duration_features(df)
        assert out["Duration_Bucket"].iloc[0] == 0.0


# ── Claims tests ──────────────────────────────────────────────────────────────

class TestClaimsFeatures:
    def test_has_claims_flag(self):
        df1 = fill_missing_values(make_df({"Previous_Claims_Filed": 0}))
        df2 = fill_missing_values(make_df({"Previous_Claims_Filed": 3}))
        assert build_claims_features(df1)["Has_Claims"].iloc[0] == 0
        assert build_claims_features(df2)["Has_Claims"].iloc[0] == 1

    def test_claims_per_year_no_division_by_zero(self):
        df = fill_missing_values(make_df(
            {"Previous_Claims_Filed": 5, "Years_Without_Claims": 0}
        ))
        out = build_claims_features(df)
        assert np.isfinite(out["Claims_Per_Year"].iloc[0])


# ── Rule feature tests ────────────────────────────────────────────────────────

class TestRuleFeatures:
    def test_renter_premium_rule_triggers(self):
        df = make_df({
            "Region_Code": None,
            "Estimated_Annual_Income": 0,
            "Deductible_Tier": "Tier_4_Zero_Ded",
            "Custom_Riders_Requested": 0,
        })
        out = build_rule_features(df)
        assert out["rule_renter_premium"].iloc[0] == 1

    def test_renter_premium_rule_no_false_positive(self):
        df = make_df()  # default row doesn't meet all conditions
        out = build_rule_features(df)
        assert out["rule_renter_premium"].iloc[0] == 0


# ── End-to-end preprocess tests ───────────────────────────────────────────────

class TestPreprocess:
    def test_user_id_retained(self):
        df = make_df({"User_ID": 999})
        out = preprocess(df)
        assert "User_ID" in out.columns
        assert out["User_ID"].iloc[0] == 999

    def test_output_has_more_cols_than_input(self):
        df = make_df()
        out = preprocess(df)
        assert out.shape[1] > df.shape[1]

    def test_categorical_cols_are_numeric_after_preprocess(self):
        df = make_df()
        out = preprocess(df)
        for col in CATEGORICAL_COLS:
            assert pd.api.types.is_numeric_dtype(out[col]), (
                f"Expected numeric dtype for '{col}' after encoding"
            )


# ── Validation tests ──────────────────────────────────────────────────────────

class TestValidation:
    def test_valid_dataframe_passes(self):
        df = make_df()
        report = validate(df, raise_on_error=False)
        assert report.passed

    def test_missing_column_fails(self):
        df = make_df()
        df = df.drop(columns=["User_ID"])
        report = validate(df, raise_on_error=False)
        assert not report.passed

    def test_empty_dataframe_fails(self):
        df = pd.DataFrame()
        report = validate(df, raise_on_error=False)
        assert not report.passed

    def test_raise_on_error_raises(self):
        df = make_df()
        df = df.drop(columns=["User_ID"])
        with pytest.raises(ValueError):
            validate(df, raise_on_error=True)