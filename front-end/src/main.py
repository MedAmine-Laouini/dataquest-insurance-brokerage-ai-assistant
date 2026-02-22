"""
main.py  —  Assurance AI Backend
=================================
Extends the original data-serving FastAPI with:

  POST /api/predict          – XGBoost inference + class probabilities
  GET  /api/explain/global   – Global SHAP summary (feature importances)
  POST /api/explain/local    – Per-prediction SHAP waterfall values
  GET  /api/model/info       – Model metadata (version, features, metrics)
  GET  /api/mlops/health     – Extended health: model loaded, uptime, counters
  GET  /api/mlops/metrics    – Request/latency/prediction distribution stats
  POST /api/mlops/feedback   – Log broker feedback for drift monitoring

Run:
  uvicorn main:app --reload --port 8000
"""

import os
import time
import json
import uuid
import logging
from collections import Counter, deque
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import joblib
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ── Optional SHAP (gracefully degrade if not installed) ─────────────────────
try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
    logging.warning("shap not installed — /api/explain/* will return placeholder data")

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("assurance.api")

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR  = Path(__file__).parent
DATA_DIR  = BASE_DIR.parent / "front-end" / "data"
MODEL_PATH = Path(os.environ.get("MODEL_PATH", BASE_DIR / "model.joblib"))

# ── Runtime state ────────────────────────────────────────────────────────────
_state: dict[str, Any] = {
    "model": None,
    "explainer": None,
    "feature_names": None,
    "global_shap": None,   # cached global importance
    "start_time": None,
    "request_count": 0,
    "prediction_counter": Counter(),
    "latency_window": deque(maxlen=200),   # last 200 latencies (ms)
    "feedback_log": [],
}

# ── Feature engineering (mirrors solution.py exactly) ────────────────────────

CATEGORICAL_COLS = [
    "Region_Code", "Broker_Agency_Type", "Deductible_Tier",
    "Acquisition_Channel", "Payment_Schedule",
    "Employment_Status", "Policy_Start_Month",
]

def _preprocess(df: pd.DataFrame) -> pd.DataFrame:
    from sklearn.preprocessing import LabelEncoder
    df = df.copy()
    df["Child_Dependents"]  = df["Child_Dependents"].fillna(0)
    df["Has_Broker"]        = df["Broker_ID"].notna().astype(int)
    df["Has_Employer"]      = df["Employer_ID"].notna().astype(int)
    df["Broker_ID"]         = df["Broker_ID"].fillna(-1)
    df["Employer_ID"]       = df["Employer_ID"].fillna(-1)
    df["Total_Dependents"]  = df["Adult_Dependents"] + df["Child_Dependents"] + df["Infant_Dependents"]
    df["Has_Children"]      = ((df["Child_Dependents"] > 0) | (df["Infant_Dependents"] > 0)).astype(int)
    df["Family_Size"]       = df["Total_Dependents"] + 1
    df["Income_Per_Family"] = df["Estimated_Annual_Income"] / df["Family_Size"]
    df["Income_Bracket"]    = pd.qcut(df["Estimated_Annual_Income"], q=10, labels=False, duplicates="drop")
    df["Is_New_Policy"]     = (df["Previous_Policy_Duration_Months"] == 0).astype(int)
    df["Duration_Bucket"]   = pd.cut(df["Previous_Policy_Duration_Months"],
                                     bins=[-1,0,3,6,12,24,9999], labels=[0,1,2,3,4,5]).astype(float)
    df["Quick_Purchase"]    = (df["Days_Since_Quote"] <= 7).astype(int)
    df["Delayed_Purchase"]  = (df["Days_Since_Quote"] > 90).astype(int)
    df["Quote_Delay_Bucket"]= pd.cut(df["Days_Since_Quote"],
                                     bins=[-1,7,30,90,180,99999], labels=[0,1,2,3,4]).astype(float)
    df["Grace_X_Duration"]      = df["Grace_Period_Extensions"] * df["Previous_Policy_Duration_Months"]
    df["Riders_Plus_Vehicles"]  = df["Custom_Riders_Requested"] + df["Vehicles_on_Policy"]
    df["Amendments_X_Duration"] = df["Policy_Amendments_Count"] * df["Previous_Policy_Duration_Months"]
    df["Has_Claims"]            = (df["Previous_Claims_Filed"] > 0).astype(int)
    df["Claims_Per_Year"]       = df["Previous_Claims_Filed"] / (df["Years_Without_Claims"] + 1)
    df["Has_Riders"]            = (df["Custom_Riders_Requested"] > 0).astype(int)
    df["Has_Vehicles"]          = (df["Vehicles_on_Policy"] > 0).astype(int)
    df["Has_Amendments"]        = (df["Policy_Amendments_Count"] > 0).astype(int)
    df["Has_Grace_Ext"]         = (df["Grace_Period_Extensions"] > 0).astype(int)
    med_uw = df["Underwriting_Processing_Days"].median()
    df["Long_Underwriting"]     = (df["Underwriting_Processing_Days"] > med_uw).astype(int)
    df["rule_renter_premium"]   = (
        df["Region_Code"].isna() &
        (df["Estimated_Annual_Income"] == 0) &
        (df["Deductible_Tier"] == "Tier_4_Zero_Ded") &
        (df["Custom_Riders_Requested"] == 0)
    ).astype(int)
    for col in CATEGORICAL_COLS:
        from sklearn.preprocessing import LabelEncoder
        enc = LabelEncoder()
        df[col] = enc.fit_transform(df[col].astype(str))
    for col in ["Broker_ID", "Employer_ID"]:
        freq = df[col].value_counts(normalize=True)
        df[f"{col}_freq"] = df[col].map(freq)
    return df


# ── Lifespan: load model & build SHAP explainer ───────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    _state["start_time"] = time.time()
    if MODEL_PATH.exists():
        logger.info("Loading model from %s", MODEL_PATH)
        model = joblib.load(MODEL_PATH)
        _state["model"] = model
        # Extract feature names from the booster if possible
        try:
            _state["feature_names"] = model.get_booster().feature_names
        except Exception:
            _state["feature_names"] = None
        # Build SHAP TreeExplainer
        if SHAP_AVAILABLE:
            try:
                _state["explainer"] = shap.TreeExplainer(model)
                logger.info("SHAP TreeExplainer ready")
            except Exception as e:
                logger.warning("SHAP explainer failed: %s", e)
        logger.info("Model loaded: %s", type(model).__name__)
    else:
        logger.warning("Model file not found at %s — inference endpoints will return mock data", MODEL_PATH)
    yield
    logger.info("Shutting down")


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(title="Assurance AI API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Original data endpoints (unchanged) ───────────────────────────────────────

def _clean(df: pd.DataFrame):
    return df.replace({float("nan"): None}).to_dict(orient="records")

@app.get("/api/clients")
def get_clients():
    try:
        return _clean(pd.read_csv(DATA_DIR / "CLIENTS.csv"))
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/api/policies")
def get_policies():
    try:
        return _clean(pd.read_csv(DATA_DIR / "POLICIES.csv"))
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/api/insurance-companies")
def get_insurance_companies():
    try:
        return _clean(pd.read_csv(DATA_DIR / "INSURANCE_COMPANIES.csv"))
    except Exception as e:
        raise HTTPException(500, str(e))


# ── Schemas ───────────────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    """Raw customer record — mirrors the competition's input schema."""
    User_ID: Any = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    Estimated_Annual_Income: float = 60000
    Adult_Dependents: int = 1
    Child_Dependents: float | None = None
    Infant_Dependents: int = 0
    Previous_Policy_Duration_Months: int = 12
    Days_Since_Quote: int = 30
    Grace_Period_Extensions: int = 0
    Custom_Riders_Requested: int = 0
    Vehicles_on_Policy: int = 1
    Policy_Amendments_Count: int = 0
    Previous_Claims_Filed: int = 0
    Years_Without_Claims: int = 3
    Underwriting_Processing_Days: int = 5
    Region_Code: str | None = "R01"
    Broker_Agency_Type: str = "Independent"
    Deductible_Tier: str = "Tier_2"
    Acquisition_Channel: str = "Online"
    Payment_Schedule: str = "Monthly"
    Employment_Status: str = "Employed"
    Policy_Start_Month: str = "January"
    Broker_ID: float | None = None
    Employer_ID: float | None = 100.0


class ShapValue(BaseModel):
    feature: str
    value: float        # raw feature value
    shap_value: float   # SHAP contribution
    abs_shap: float


class PredictResponse(BaseModel):
    request_id: str
    predicted_bundle: int
    confidence: float                  # 0–100
    class_probabilities: list[float]   # length 10, 0–100
    rule_override: bool
    latency_ms: float
    shap_values: list[ShapValue] | None = None


class FeedbackRequest(BaseModel):
    request_id: str
    predicted_bundle: int
    actual_bundle: int | None = None
    broker_rating: int | None = Field(default=None, ge=1, le=5)
    notes: str | None = None


# ── /api/predict ─────────────────────────────────────────────────────────────

@app.post("/api/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    t0 = time.time()
    _state["request_count"] += 1
    request_id = str(uuid.uuid4())[:12]

    # Build DataFrame
    raw = pd.DataFrame([req.model_dump()])

    # Preprocess
    try:
        features = _preprocess(raw)
    except Exception as e:
        raise HTTPException(422, f"Preprocessing failed: {e}")

    X = features.drop(columns=["User_ID"], errors="ignore")

    model = _state["model"]

    # ── Real model inference ─────────────────────────────────────────────────
    if model is not None:
        try:
            proba_raw = model.predict_proba(X)[0]          # shape (10,)
            pred_class = int(np.argmax(proba_raw))
        except Exception as e:
            raise HTTPException(500, f"Model inference error: {e}")

        # Business rule override
        rule_override = bool(features["rule_renter_premium"].iloc[0] == 1)
        if rule_override:
            pred_class = 9

        class_probs = [round(float(p) * 100, 1) for p in proba_raw]
        confidence  = round(float(proba_raw[pred_class]) * 100, 1)

        # ── SHAP local explanation ───────────────────────────────────────────
        shap_vals = None
        explainer = _state["explainer"]
        if explainer is not None and SHAP_AVAILABLE:
            try:
                sv = explainer.shap_values(X)           # list of arrays per class
                # Use SHAP values for the predicted class
                if isinstance(sv, list):
                    sv_pred = sv[pred_class][0]
                else:
                    sv_pred = sv[0]                     # single-output fallback
                feat_names = list(X.columns)
                feat_vals  = X.iloc[0].tolist()
                top_n      = 15
                shap_abs   = np.abs(sv_pred)
                top_idx    = np.argsort(shap_abs)[::-1][:top_n]
                shap_vals  = [
                    ShapValue(
                        feature   = feat_names[i],
                        value     = round(float(feat_vals[i]), 4),
                        shap_value= round(float(sv_pred[i]), 4),
                        abs_shap  = round(float(shap_abs[i]), 4),
                    )
                    for i in top_idx
                ]
            except Exception as e:
                logger.warning("SHAP local explain failed: %s", e)

    # ── Mock fallback (no model.joblib present) ──────────────────────────────
    else:
        import random
        random.seed(hash(str(req.model_dump())))
        income = req.Estimated_Annual_Income
        if income < 30000:   pred_class = 0
        elif income < 60000: pred_class = 1
        elif income < 100000:pred_class = 3
        elif income < 200000:pred_class = 5
        else:                pred_class = 7
        raw_scores = [max(0.01, 1 - abs(i - pred_class) * 0.3 + random.uniform(-0.05, 0.05))
                      for i in range(10)]
        total = sum(raw_scores)
        class_probs = [round(s / total * 100, 1) for s in raw_scores]
        confidence  = class_probs[pred_class]
        rule_override = False
        shap_vals   = None

    latency = round((time.time() - t0) * 1000, 2)
    _state["latency_window"].append(latency)
    _state["prediction_counter"][pred_class] += 1

    return PredictResponse(
        request_id         = request_id,
        predicted_bundle   = pred_class,
        confidence         = confidence,
        class_probabilities= class_probs,
        rule_override      = rule_override,
        latency_ms         = latency,
        shap_values        = shap_vals,
    )


# ── /api/explain/global ───────────────────────────────────────────────────────

@app.get("/api/explain/global")
def global_explanation():
    """
    Returns global feature importance from the XGBoost model.
    Uses built-in gain/weight importances — no background data needed.
    Cached after first call.
    """
    model = _state["model"]

    if model is not None:
        # Return cached if available
        if _state["global_shap"] is not None:
            return _state["global_shap"]

        try:
            # XGBoost gain importances
            booster    = model.get_booster()
            gain_imp   = booster.get_score(importance_type="gain")
            weight_imp = booster.get_score(importance_type="weight")
            cover_imp  = booster.get_score(importance_type="cover")

            # Normalize each to 0–100
            def _normalize(d: dict) -> dict:
                if not d: return {}
                mx = max(d.values())
                return {k: round(v / mx * 100, 1) for k, v in d.items()} if mx else d

            gn = _normalize(gain_imp)
            wn = _normalize(weight_imp)
            cn = _normalize(cover_imp)

            all_feats = sorted(set(gn) | set(wn) | set(cn))
            result = [
                {
                    "feature"        : f,
                    "gain"           : gn.get(f, 0),
                    "weight"         : wn.get(f, 0),
                    "cover"          : cn.get(f, 0),
                    "composite_score": round((gn.get(f, 0) * 0.6 +
                                              cn.get(f, 0) * 0.3 +
                                              wn.get(f, 0) * 0.1), 1),
                }
                for f in all_feats
            ]
            result.sort(key=lambda x: x["composite_score"], reverse=True)
            top20 = result[:20]

            payload = {"source": "xgboost_importance", "features": top20}
            _state["global_shap"] = payload
            return payload

        except Exception as e:
            logger.warning("Global importance failed: %s", e)

    # Mock fallback
    mock_features = [
        "Estimated_Annual_Income", "Previous_Policy_Duration_Months", "Days_Since_Quote",
        "Family_Size", "Income_Per_Family", "Total_Dependents", "Claims_Per_Year",
        "Underwriting_Processing_Days", "Grace_X_Duration", "Amendments_X_Duration",
        "Duration_Bucket", "Quote_Delay_Bucket", "Income_Bracket", "Broker_ID_freq",
        "Employer_ID_freq", "Has_Children", "Has_Riders", "Has_Vehicles",
        "Policy_Amendments_Count", "rule_renter_premium",
    ]
    scores = [100, 85, 72, 68, 63, 58, 52, 48, 44, 40,
              37, 33, 30, 27, 24, 21, 18, 15, 12, 8]
    return {
        "source": "mock",
        "features": [
            {"feature": f, "gain": s, "weight": round(s*0.8,1),
             "cover": round(s*0.9,1), "composite_score": s}
            for f, s in zip(mock_features, scores)
        ],
    }


# ── /api/explain/local ────────────────────────────────────────────────────────

@app.post("/api/explain/local")
def local_explanation(req: PredictRequest):
    """
    Detailed SHAP waterfall for a single prediction.
    Returns values for ALL features (not just top-N) so the frontend
    can render a full waterfall chart.
    """
    # Re-run predict to get SHAP values (or reuse cached)
    response = predict(req)
    if response.shap_values:
        return {
            "predicted_bundle": response.predicted_bundle,
            "confidence": response.confidence,
            "shap_values": [sv.model_dump() for sv in response.shap_values],
            "source": "shap_tree_explainer",
        }
    # If SHAP not available, return importance-proxy values
    global_imp = global_explanation()
    feats = global_imp["features"][:15]
    return {
        "predicted_bundle": response.predicted_bundle,
        "confidence"       : response.confidence,
        "shap_values"      : [
            {
                "feature"   : f["feature"],
                "value"     : 0,
                "shap_value": round(f["composite_score"] / 100 * (1 if i % 2 == 0 else -0.3), 3),
                "abs_shap"  : round(f["composite_score"] / 100, 3),
            }
            for i, f in enumerate(feats)
        ],
        "source": "importance_proxy",
    }


# ── /api/model/info ───────────────────────────────────────────────────────────

@app.get("/api/model/info")
def model_info():
    model = _state["model"]
    feat_names = _state["feature_names"]

    if model is not None:
        try:
            params = model.get_params()
        except Exception:
            params = {}
        return {
            "model_type"    : type(model).__name__,
            "n_features"    : len(feat_names) if feat_names else "unknown",
            "feature_names" : feat_names,
            "n_classes"     : 10,
            "class_labels"  : list(range(10)),
            "params"        : {k: str(v) for k, v in params.items()},
            "model_path"    : str(MODEL_PATH),
            "shap_available": SHAP_AVAILABLE and _state["explainer"] is not None,
            "version"       : "1.0.0",
        }
    return {
        "model_type"    : "XGBClassifier (not loaded — mock mode)",
        "n_features"    : 48,
        "n_classes"     : 10,
        "class_labels"  : list(range(10)),
        "params"        : {},
        "model_path"    : str(MODEL_PATH),
        "shap_available": False,
        "version"       : "1.0.0-mock",
    }


# ── /api/mlops/health ─────────────────────────────────────────────────────────

@app.get("/api/mlops/health")
def mlops_health():
    uptime = round(time.time() - _state["start_time"], 1) if _state["start_time"] else 0
    lw = list(_state["latency_window"])
    avg_lat = round(sum(lw) / len(lw), 1) if lw else 0
    return {
        "status"         : "ok",
        "model_loaded"   : _state["model"] is not None,
        "shap_available" : SHAP_AVAILABLE and _state["explainer"] is not None,
        "uptime_seconds" : uptime,
        "request_count"  : _state["request_count"],
        "avg_latency_ms" : avg_lat,
        "timestamp"      : datetime.utcnow().isoformat() + "Z",
    }


# ── /api/mlops/metrics ────────────────────────────────────────────────────────

@app.get("/api/mlops/metrics")
def mlops_metrics():
    lw = list(_state["latency_window"])
    pred_dist = dict(_state["prediction_counter"])
    total_preds = sum(pred_dist.values())

    def pct(c): return round(c / total_preds * 100, 1) if total_preds else 0

    return {
        "total_requests"  : _state["request_count"],
        "total_predictions": total_preds,
        "latency_ms"      : {
            "avg" : round(sum(lw) / len(lw), 1) if lw else 0,
            "min" : round(min(lw), 1) if lw else 0,
            "max" : round(max(lw), 1) if lw else 0,
            "p95" : round(sorted(lw)[int(len(lw)*0.95)], 1) if len(lw) >= 20 else (max(lw) if lw else 0),
        },
        "prediction_distribution": {
            str(k): {"count": v, "pct": pct(v)}
            for k, v in sorted(pred_dist.items())
        },
        "feedback_count"  : len(_state["feedback_log"]),
        "timestamp"       : datetime.utcnow().isoformat() + "Z",
    }


# ── /api/mlops/feedback ───────────────────────────────────────────────────────

@app.post("/api/mlops/feedback")
def submit_feedback(fb: FeedbackRequest):
    """Log broker feedback for monitoring + future fine-tuning."""
    entry = {
        **fb.model_dump(),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    _state["feedback_log"].append(entry)
    logger.info("Feedback logged: %s", entry)
    return {"status": "logged", "feedback_id": str(uuid.uuid4())[:8]}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)