"""Serve static CSV data for policies and insurance companies."""
from fastapi import APIRouter, Depends
import pandas as pd
import os
import math

from app.config import settings
from app.models import User
from app.auth import get_current_user

router = APIRouter(prefix="/api", tags=["data"])


def clean_data(df: pd.DataFrame) -> list[dict]:
    df = df.replace({float("nan"): None})
    records = df.to_dict(orient="records")
    # Also replace any remaining NaN that slips through
    for rec in records:
        for k, v in rec.items():
            if isinstance(v, float) and math.isnan(v):
                rec[k] = None
    return records


@router.get("/policies")
async def get_policies(current_user: User = Depends(get_current_user)):
    file_path = os.path.join(settings.DATA_DIR, "POLICIES.csv")
    try:
        df = pd.read_csv(file_path)
        return clean_data(df)
    except Exception as e:
        return {"error": str(e)}


@router.get("/insurance-companies")
async def get_insurance_companies(current_user: User = Depends(get_current_user)):
    file_path = os.path.join(settings.DATA_DIR, "INSURANCE_COMPANIES.csv")
    try:
        df = pd.read_csv(file_path)
        return clean_data(df)
    except Exception as e:
        return {"error": str(e)}
