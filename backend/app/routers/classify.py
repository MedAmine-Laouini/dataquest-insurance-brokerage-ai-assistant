"""
classify.py
-----------
POST /api/classify/single  — predict bundle for one customer, save to DB.
POST /api/classify/batch   — predict bundles for a CSV upload, bulk-save to DB.
"""

import io
import sys
import uuid
import logging
from functools import lru_cache
from pathlib import Path
from typing import Optional

import joblib
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

# ─── Add ml package to Python path ───────────────────────────────────────────
# classify.py is at  backend/app/routers/classify.py
# workspace root is 4 levels up
_WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent.parent
_ML_ROOT = _WORKSPACE_ROOT / "ml"
if str(_ML_ROOT) not in sys.path:
    sys.path.insert(0, str(_ML_ROOT))

from src.preprocessing.validation import validate          # noqa: E402
from src.preprocessing.feature_engineering import preprocess  # noqa: E402
from src.model.predictor import load_model, predict        # noqa: E402

from app.database import get_db                            # noqa: E402
from app.models import Client                              # noqa: E402
from app.auth import get_current_user                      # noqa: E402
from app.schemas import ClientPredictInput, PredictionOut, BatchPredictionOut  # noqa: E402

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/classify", tags=["classify"])

# Bundle ID (0-9) → DB-friendly name
BUNDLE_NAMES = [
    "Liability_Only",
    "Essential_Auto",
    "Home_Auto_Starter",
    "Comprehensive_Home",
    "Life_Health_Basic",
    "Full_Auto_Home",
    "Business_Protection_Basic",
    "Premium_All_Coverage",
    "Enterprise_Protection_Suite",
    "Ultra_Premium_Complete",
]


# ─── Cached model loader ──────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _get_model():
    model_path = _WORKSPACE_ROOT / "front-end" / "src" / "model.joblib"
    return load_model(model_path)


# ─── Pipeline helpers ─────────────────────────────────────────────────────────

# Columns present in training data but NOT in the user-facing input form.
# We inject safe defaults so the feature-engineering pipeline and XGBoost
# receive the exact column set they were trained on.
_TRAINING_ONLY_DEFAULTS = {
    "Policy_Cancelled_Post_Purchase": 0,  # unknown at inference time
    "Policy_Start_Year":  0,
    "Policy_Start_Week":  1,
    "Policy_Start_Day":   1,
    "Existing_Policyholder": 0,           # treat as new customer
}


def _fill_training_defaults(df: pd.DataFrame) -> pd.DataFrame:
    """Inject training-only columns with default values if they are absent."""
    for col, default in _TRAINING_ONLY_DEFAULTS.items():
        if col not in df.columns:
            df[col] = default
    return df


def _run_pipeline(df: pd.DataFrame) -> pd.DataFrame:
    """validate → preprocess → predict.  Returns result DataFrame."""
    validate(df, raise_on_error=False)
    df_feat = preprocess(df)
    model = _get_model()
    return predict(df_feat, model)


def _extract_prediction(result_df: pd.DataFrame, idx: int = 0) -> tuple:
    """Return (pred_bundle: int, confidence: int, class_probs: list[int])."""
    pred_bundle = int(result_df["Predicted_Bundle"].iloc[idx])
    prob_cols = sorted([c for c in result_df.columns if c.startswith("prob_")])
    if prob_cols:
        raw = [float(result_df[col].iloc[idx]) for col in prob_cols]
        proba = [round(p * 100) for p in raw]
        diff = 100 - sum(proba)
        proba[proba.index(max(proba))] += diff  # ensure sum == 100
    else:
        proba = [0] * 10
        proba[pred_bundle] = 100
    return pred_bundle, proba[pred_bundle], proba


# ─── Single-customer endpoint ─────────────────────────────────────────────────

@router.post("/single", response_model=PredictionOut)
async def classify_single(
    data: ClientPredictInput,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = data.user_id or f"USR_{uuid.uuid4().hex[:6].upper()}"

    df = pd.DataFrame([{
        "User_ID":                         uid,
        "Estimated_Annual_Income":         data.estimated_annual_income,
        "Adult_Dependents":                data.adult_dependents,
        "Child_Dependents":                data.child_dependents,
        "Infant_Dependents":               data.infant_dependents,
        "Previous_Policy_Duration_Months": data.previous_policy_duration_months,
        "Days_Since_Quote":                data.days_since_quote,
        "Grace_Period_Extensions":         data.grace_period_extensions,
        "Custom_Riders_Requested":         data.custom_riders_requested,
        "Vehicles_on_Policy":              data.vehicles_on_policy,
        "Policy_Amendments_Count":         data.policy_amendments_count,
        "Previous_Claims_Filed":           data.previous_claims_filed,
        "Years_Without_Claims":            data.years_without_claims,
        "Underwriting_Processing_Days":    data.underwriting_processing_days,
        "Region_Code":                     data.region_code,
        "Broker_Agency_Type":              data.broker_agency_type,
        "Deductible_Tier":                 data.deductible_tier,
        "Acquisition_Channel":             data.acquisition_channel,
        "Payment_Schedule":                data.payment_schedule,
        "Employment_Status":               data.employment_status,
        "Policy_Start_Month":              data.policy_start_month,
        "Broker_ID":                       data.broker_id,
        "Employer_ID":                     data.employer_id,
    }])
    df = _fill_training_defaults(df)

    try:
        result = _run_pipeline(df)
    except Exception as exc:
        logger.exception("Pipeline error for single prediction")
        raise HTTPException(status_code=422, detail=str(exc))

    pred_bundle, confidence, proba = _extract_prediction(result)
    bundle_name = BUNDLE_NAMES[pred_bundle] if pred_bundle < len(BUNDLE_NAMES) else str(pred_bundle)

    client = Client(
        user_id=uid,
        estimated_annual_income=data.estimated_annual_income,
        adult_dependents=data.adult_dependents,
        child_dependents=data.child_dependents,
        infant_dependents=data.infant_dependents,
        previous_policy_duration_months=data.previous_policy_duration_months,
        days_since_quote=data.days_since_quote,
        grace_period_extensions=data.grace_period_extensions,
        custom_riders_requested=data.custom_riders_requested,
        vehicles_on_policy=data.vehicles_on_policy,
        policy_amendments_count=data.policy_amendments_count,
        previous_claims_filed=data.previous_claims_filed,
        years_without_claims=data.years_without_claims,
        underwriting_processing_days=data.underwriting_processing_days,
        region_code=data.region_code,
        broker_agency_type=data.broker_agency_type,
        deductible_tier=data.deductible_tier,
        acquisition_channel=data.acquisition_channel,
        payment_schedule=data.payment_schedule,
        employment_status=data.employment_status,
        policy_start_month=data.policy_start_month,
        broker_id=data.broker_id,
        employer_id=data.employer_id,
        purchased_coverage_bundle=bundle_name,
    )
    db.add(client)
    await db.commit()

    return PredictionOut(
        user_id=uid,
        predicted_bundle=pred_bundle,
        bundle_name=bundle_name,
        confidence=confidence,
        class_probabilities=proba,
    )


# ─── Batch CSV endpoint ───────────────────────────────────────────────────────

@router.post("/batch", response_model=BatchPredictionOut)
async def classify_batch(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Cannot parse CSV: {exc}")

    if "User_ID" not in df.columns:
        df["User_ID"] = [f"USR_{uuid.uuid4().hex[:6].upper()}" for _ in range(len(df))]

    df = _fill_training_defaults(df)

    try:
        result = _run_pipeline(df)
    except Exception as exc:
        logger.exception("Pipeline error for batch prediction")
        raise HTTPException(status_code=422, detail=str(exc))

    predictions: list[PredictionOut] = []
    clients_to_add: list[Client] = []

    for i in range(len(result)):
        pred_bundle, confidence, proba = _extract_prediction(result, i)
        bundle_name = BUNDLE_NAMES[pred_bundle] if pred_bundle < len(BUNDLE_NAMES) else str(pred_bundle)
        uid = str(result["User_ID"].iloc[i])

        predictions.append(PredictionOut(
            user_id=uid,
            predicted_bundle=pred_bundle,
            bundle_name=bundle_name,
            confidence=confidence,
            class_probabilities=proba,
        ))

        row = df.iloc[i]

        def _int(col: str, default: int = 0) -> int:
            v = row.get(col, default)
            return int(v) if pd.notna(v) else default

        def _float_or_none(col: str) -> Optional[float]:
            v = row.get(col)
            return float(v) if pd.notna(v) else None

        def _str(col: str, default: str = "") -> Optional[str]:
            v = row.get(col, default)
            return str(v) if pd.notna(v) else None

        clients_to_add.append(Client(
            user_id=uid,
            estimated_annual_income=float(row.get("Estimated_Annual_Income", 0)),
            adult_dependents=_int("Adult_Dependents"),
            child_dependents=_float_or_none("Child_Dependents"),
            infant_dependents=_int("Infant_Dependents"),
            previous_policy_duration_months=_int("Previous_Policy_Duration_Months"),
            days_since_quote=_int("Days_Since_Quote"),
            grace_period_extensions=_int("Grace_Period_Extensions"),
            custom_riders_requested=_int("Custom_Riders_Requested"),
            vehicles_on_policy=_int("Vehicles_on_Policy"),
            policy_amendments_count=_int("Policy_Amendments_Count"),
            previous_claims_filed=_int("Previous_Claims_Filed"),
            years_without_claims=_int("Years_Without_Claims"),
            underwriting_processing_days=_int("Underwriting_Processing_Days"),
            region_code=_str("Region_Code"),
            broker_agency_type=_str("Broker_Agency_Type"),
            deductible_tier=_str("Deductible_Tier"),
            acquisition_channel=_str("Acquisition_Channel"),
            payment_schedule=_str("Payment_Schedule"),
            employment_status=_str("Employment_Status"),
            policy_start_month=_str("Policy_Start_Month"),
            broker_id=_float_or_none("Broker_ID"),
            employer_id=_float_or_none("Employer_ID"),
            purchased_coverage_bundle=bundle_name,
        ))

    db.add_all(clients_to_add)
    await db.commit()

    return BatchPredictionOut(count=len(predictions), results=predictions)
