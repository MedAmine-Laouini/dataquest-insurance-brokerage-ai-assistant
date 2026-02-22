"""
feature_engineering.py
-----------------------
Stateless, reproducible feature engineering for the Coverage Bundle model.
All transformations are deterministic and side-effect-free.
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
import logging

logger = logging.getLogger(__name__)


# ── Column groups ─────────────────────────────────────────────────────────────

CATEGORICAL_COLS = [
    "Region_Code", "Broker_Agency_Type", "Deductible_Tier",
    "Acquisition_Channel", "Payment_Schedule",
    "Employment_Status", "Policy_Start_Month",
]

FREQ_ENCODE_COLS = ["Broker_ID", "Employer_ID"]

ID_COL = "User_ID"


# ── Individual transforms ─────────────────────────────────────────────────────

def fill_missing_values(df: pd.DataFrame) -> pd.DataFrame:
    """Fill known nullable columns with sensible defaults."""
    df = df.copy()
    df["Child_Dependents"] = df["Child_Dependents"].fillna(0)
    df["Has_Broker"]       = df["Broker_ID"].notna().astype(int)
    df["Has_Employer"]     = df["Employer_ID"].notna().astype(int)
    df["Broker_ID"]        = df["Broker_ID"].fillna(-1)
    df["Employer_ID"]      = df["Employer_ID"].fillna(-1)
    return df


def build_dependent_features(df: pd.DataFrame) -> pd.DataFrame:
    """Dependents & family-size features."""
    df = df.copy()
    df["Total_Dependents"] = (
        df["Adult_Dependents"] + df["Child_Dependents"] + df["Infant_Dependents"]
    )
    df["Has_Children"] = (
        (df["Child_Dependents"] > 0) | (df["Infant_Dependents"] > 0)
    ).astype(int)
    df["Family_Size"] = df["Total_Dependents"] + 1
    return df


def build_income_features(df: pd.DataFrame) -> pd.DataFrame:
    """Income & wealth-proxy features."""
    df = df.copy()
    df["Income_Per_Family"] = df["Estimated_Annual_Income"] / df["Family_Size"]
    df["Income_Bracket"]    = pd.qcut(
        df["Estimated_Annual_Income"], q=10, labels=False, duplicates="drop"
    )
    return df


def build_policy_duration_features(df: pd.DataFrame) -> pd.DataFrame:
    """Previous-policy tenure features."""
    df = df.copy()
    df["Is_New_Policy"]   = (df["Previous_Policy_Duration_Months"] == 0).astype(int)
    df["Duration_Bucket"] = pd.cut(
        df["Previous_Policy_Duration_Months"],
        bins=[-1, 0, 3, 6, 12, 24, 9999],
        labels=[0, 1, 2, 3, 4, 5],
    ).astype(float)
    return df


def build_quote_timing_features(df: pd.DataFrame) -> pd.DataFrame:
    """Quote-to-purchase timing features."""
    df = df.copy()
    df["Quick_Purchase"]     = (df["Days_Since_Quote"] <= 7).astype(int)
    df["Delayed_Purchase"]   = (df["Days_Since_Quote"] > 90).astype(int)
    df["Quote_Delay_Bucket"] = pd.cut(
        df["Days_Since_Quote"],
        bins=[-1, 7, 30, 90, 180, 99999],
        labels=[0, 1, 2, 3, 4],
    ).astype(float)
    return df


def build_interaction_features(df: pd.DataFrame) -> pd.DataFrame:
    """Multiplicative interaction terms."""
    df = df.copy()
    df["Grace_X_Duration"]      = (
        df["Grace_Period_Extensions"] * df["Previous_Policy_Duration_Months"]
    )
    df["Riders_Plus_Vehicles"]  = (
        df["Custom_Riders_Requested"] + df["Vehicles_on_Policy"]
    )
    df["Amendments_X_Duration"] = (
        df["Policy_Amendments_Count"] * df["Previous_Policy_Duration_Months"]
    )
    return df


def build_claims_features(df: pd.DataFrame) -> pd.DataFrame:
    """Claims history features."""
    df = df.copy()
    df["Has_Claims"]      = (df["Previous_Claims_Filed"] > 0).astype(int)
    df["Claims_Per_Year"] = df["Previous_Claims_Filed"] / (df["Years_Without_Claims"] + 1)
    return df


def build_binary_flags(df: pd.DataFrame) -> pd.DataFrame:
    """Existence binary flags."""
    df = df.copy()
    df["Has_Riders"]     = (df["Custom_Riders_Requested"] > 0).astype(int)
    df["Has_Vehicles"]   = (df["Vehicles_on_Policy"] > 0).astype(int)
    df["Has_Amendments"] = (df["Policy_Amendments_Count"] > 0).astype(int)
    df["Has_Grace_Ext"]  = (df["Grace_Period_Extensions"] > 0).astype(int)
    return df


def build_underwriting_features(df: pd.DataFrame) -> pd.DataFrame:
    """Underwriting-delay flag (uses population median – fit on train)."""
    df = df.copy()
    med_uw = df["Underwriting_Processing_Days"].median()
    df["Long_Underwriting"] = (df["Underwriting_Processing_Days"] > med_uw).astype(int)
    return df


def build_rule_features(df: pd.DataFrame) -> pd.DataFrame:
    """Deterministic business-rule flags."""
    df = df.copy()
    df["rule_renter_premium"] = (
        df["Region_Code"].isna() &
        (df["Estimated_Annual_Income"] == 0) &
        (df["Deductible_Tier"] == "Tier_4_Zero_Ded") &
        (df["Custom_Riders_Requested"] == 0)
    ).astype(int)
    return df


def encode_categoricals(df: pd.DataFrame) -> pd.DataFrame:
    """Label-encode categorical columns (fit per-call; safe for inference)."""
    df = df.copy()
    for col in CATEGORICAL_COLS:
        enc = LabelEncoder()
        df[col] = enc.fit_transform(df[col].astype(str))
    return df


def encode_frequencies(df: pd.DataFrame) -> pd.DataFrame:
    """Frequency-encode high-cardinality ID columns."""
    df = df.copy()
    for col in FREQ_ENCODE_COLS:
        freq = df[col].value_counts(normalize=True)
        df[f"{col}_freq"] = df[col].map(freq)
    return df


# ── Master pipeline ───────────────────────────────────────────────────────────

TRANSFORM_STEPS = [
    fill_missing_values,
    build_dependent_features,
    build_income_features,
    build_policy_duration_features,
    build_quote_timing_features,
    build_interaction_features,
    build_claims_features,
    build_binary_flags,
    build_underwriting_features,
    build_rule_features,
    encode_categoricals,
    encode_frequencies,
]


def preprocess(df: pd.DataFrame) -> pd.DataFrame:
    """
    Run the full feature-engineering pipeline.
    Input  : raw DataFrame (must include User_ID).
    Output : enriched DataFrame (User_ID retained).
    """
    logger.info("Starting preprocessing | rows=%d cols=%d", len(df), df.shape[1])
    for step in TRANSFORM_STEPS:
        df = step(df)
        logger.debug("After %s | cols=%d", step.__name__, df.shape[1])
    logger.info("Preprocessing complete | final cols=%d", df.shape[1])
    return df