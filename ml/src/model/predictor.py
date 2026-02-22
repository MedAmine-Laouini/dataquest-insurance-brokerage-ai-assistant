"""
predictor.py
------------
Model loading and prediction utilities for the Coverage Bundle classifier.
"""

import logging
import os
from pathlib import Path

import joblib
import pandas as pd

logger = logging.getLogger(__name__)

# Default model path — resolved relative to this file's location:
# predictor.py is at  ml/src/model/predictor.py
# model.joblib is at  front-end/src/model.joblib  (4 levels up, then into front-end/src/)
_HERE = Path(__file__).resolve().parent
_DEFAULT_MODEL_PATH = _HERE.parent.parent.parent / "front-end" / "src" / "model.joblib"


def load_model(model_path: str | Path | None = None):
    """Load and return the trained sklearn model from *model_path*.

    Falls back to the environment variable MODEL_PATH, then to the
    default computed relative to this file.
    """
    path = Path(
        model_path
        or os.environ.get("MODEL_PATH", "")
        or _DEFAULT_MODEL_PATH
    )
    if not path.exists():
        raise FileNotFoundError(f"Model file not found: {path}")
    logger.info("Loading model from %s", path)
    model = joblib.load(path)
    logger.info("Model loaded: %s", type(model).__name__)
    return model


def predict(df_features: pd.DataFrame, model) -> pd.DataFrame:
    """Run inference and return a DataFrame with User_ID + predictions.

    Parameters
    ----------
    df_features : pd.DataFrame
        Fully engineered feature matrix (output of preprocess()).
        Must contain User_ID.  All other columns are used as features.
    model :
        Fitted sklearn estimator.

    Returns
    -------
    pd.DataFrame with columns:
        - User_ID
        - Predicted_Bundle  (int label)
        - prob_<i>          (float, one per class, if predict_proba available)
    """
    id_col = "User_ID"
    drop_cols = [c for c in [id_col, "Purchased_Coverage_Bundle"] if c in df_features.columns]
    X = df_features.drop(columns=drop_cols)

    # Exact feature order the model was trained on (from XGBoost booster).
    # Hardcoded because sklearn Pipeline doesn't expose feature_names_in_
    # and traversing to the inner booster is fragile.
    MODEL_FEATURE_ORDER = [
        "Policy_Cancelled_Post_Purchase", "Policy_Start_Year", "Policy_Start_Week",
        "Policy_Start_Day", "Grace_Period_Extensions", "Previous_Policy_Duration_Months",
        "Adult_Dependents", "Child_Dependents", "Infant_Dependents", "Region_Code",
        "Existing_Policyholder", "Previous_Claims_Filed", "Years_Without_Claims",
        "Policy_Amendments_Count", "Broker_ID", "Employer_ID",
        "Underwriting_Processing_Days", "Vehicles_on_Policy", "Custom_Riders_Requested",
        "Broker_Agency_Type", "Deductible_Tier", "Acquisition_Channel",
        "Payment_Schedule", "Employment_Status", "Estimated_Annual_Income",
        "Days_Since_Quote", "Policy_Start_Month", "Has_Broker", "Has_Employer",
        "Total_Dependents", "Has_Children", "Family_Size", "Income_Per_Family",
        "Income_Bracket", "Is_New_Policy", "Duration_Bucket", "Quick_Purchase",
        "Delayed_Purchase", "Quote_Delay_Bucket", "Grace_X_Duration",
        "Riders_Plus_Vehicles", "Amendments_X_Duration", "Has_Claims",
        "Claims_Per_Year", "Has_Riders", "Has_Vehicles", "Has_Amendments",
        "Has_Grace_Ext", "Long_Underwriting", "rule_renter_premium",
        "Broker_ID_freq", "Employer_ID_freq",
    ]

    # Add any missing columns as 0, then reorder to training order
    for col in MODEL_FEATURE_ORDER:
        if col not in X.columns:
            X[col] = 0
    # Keep only model columns in the exact expected order
    X = X[[c for c in MODEL_FEATURE_ORDER if c in X.columns]]

    preds = model.predict(X)
    out = pd.DataFrame({id_col: df_features[id_col].values, "Predicted_Bundle": preds})

    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(X)
        for i in range(proba.shape[1]):
            out[f"prob_{i}"] = proba[:, i]

    logger.info("Predictions complete | rows=%d", len(out))
    return out
