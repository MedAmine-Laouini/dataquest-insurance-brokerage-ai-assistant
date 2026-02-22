"""
validation.py
-------------
Schema and data-quality checks run BEFORE feature engineering.
Raises clear errors early so failures are caught at the pipeline boundary.
"""

import pandas as pd
import numpy as np
from dataclasses import dataclass, field
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)


# ── Expected schema ───────────────────────────────────────────────────────────

REQUIRED_COLUMNS = [
    "User_ID",
    "Estimated_Annual_Income",
    "Adult_Dependents",
    "Child_Dependents",
    "Infant_Dependents",
    "Previous_Policy_Duration_Months",
    "Days_Since_Quote",
    "Grace_Period_Extensions",
    "Custom_Riders_Requested",
    "Vehicles_on_Policy",
    "Policy_Amendments_Count",
    "Previous_Claims_Filed",
    "Years_Without_Claims",
    "Underwriting_Processing_Days",
    "Region_Code",
    "Broker_Agency_Type",
    "Deductible_Tier",
    "Acquisition_Channel",
    "Payment_Schedule",
    "Employment_Status",
    "Policy_Start_Month",
    "Broker_ID",
    "Employer_ID",
]

NUMERIC_NON_NEGATIVE = [
    "Estimated_Annual_Income",
    "Adult_Dependents",
    "Child_Dependents",
    "Infant_Dependents",
    "Previous_Policy_Duration_Months",
    "Days_Since_Quote",
    "Grace_Period_Extensions",
    "Custom_Riders_Requested",
    "Vehicles_on_Policy",
    "Policy_Amendments_Count",
    "Previous_Claims_Filed",
    "Years_Without_Claims",
    "Underwriting_Processing_Days",
]


# ── Result dataclass ──────────────────────────────────────────────────────────

@dataclass
class ValidationReport:
    passed: bool = True
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)

    def add_error(self, msg: str):
        self.errors.append(msg)
        self.passed = False

    def add_warning(self, msg: str):
        self.warnings.append(msg)

    def summary(self) -> str:
        lines = [f"Validation {'PASSED' if self.passed else 'FAILED'}"]
        for e in self.errors:
            lines.append(f"  [ERROR]   {e}")
        for w in self.warnings:
            lines.append(f"  [WARN]    {w}")
        return "\n".join(lines)


# ── Checks ────────────────────────────────────────────────────────────────────

def check_required_columns(df: pd.DataFrame, report: ValidationReport):
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        report.add_error(f"Missing required columns: {missing}")


def check_empty_dataframe(df: pd.DataFrame, report: ValidationReport):
    if len(df) == 0:
        report.add_error("DataFrame is empty (0 rows).")


def check_duplicate_user_ids(df: pd.DataFrame, report: ValidationReport):
    if "User_ID" not in df.columns:
        return
    dupes = df["User_ID"].duplicated().sum()
    if dupes > 0:
        report.add_warning(f"{dupes} duplicate User_ID values detected.")


def check_non_negative_numerics(df: pd.DataFrame, report: ValidationReport):
    for col in NUMERIC_NON_NEGATIVE:
        if col not in df.columns:
            continue
        neg_count = (df[col] < 0).sum()
        if neg_count > 0:
            report.add_warning(f"Column '{col}' has {neg_count} negative values.")


def check_null_rates(df: pd.DataFrame, report: ValidationReport, threshold: float = 0.5):
    """Warn if any column has > threshold null rate (excluding known nullable cols)."""
    known_nullable = {"Broker_ID", "Employer_ID", "Child_Dependents", "Region_Code"}
    for col in df.columns:
        if col in known_nullable:
            continue
        null_rate = df[col].isna().mean()
        if null_rate > threshold:
            report.add_warning(
                f"Column '{col}' has {null_rate:.1%} null values (threshold={threshold:.0%})."
            )


# ── Master validator ──────────────────────────────────────────────────────────

def validate(df: pd.DataFrame, raise_on_error: bool = True) -> ValidationReport:
    """
    Run all validation checks.
    If raise_on_error=True (default), raises ValueError on any ERROR-level finding.
    """
    report = ValidationReport()

    check_empty_dataframe(df, report)
    check_required_columns(df, report)
    check_duplicate_user_ids(df, report)
    check_non_negative_numerics(df, report)
    check_null_rates(df, report)

    logger.info(report.summary())

    if not report.passed and raise_on_error:
        raise ValueError(f"Data validation failed:\n{report.summary()}")

    return report