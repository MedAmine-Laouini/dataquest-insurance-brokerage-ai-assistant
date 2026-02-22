from pydantic import BaseModel, EmailStr
from typing import Optional, List


# ──────────────────── Auth Schemas ────────────────────
class UserCreate(BaseModel):
    email: str
    name: str
    password: str
    role: str = "broker"


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ──────────────────── Client Schemas ────────────────────
class ClientOut(BaseModel):
    id: int
    user_id: Optional[str] = None
    policy_cancelled: Optional[int] = None
    policy_start_year: Optional[int] = None
    policy_start_week: Optional[int] = None
    policy_start_day: Optional[int] = None
    grace_period_extensions: Optional[int] = None
    previous_policy_duration_months: Optional[int] = None
    adult_dependents: Optional[int] = None
    child_dependents: Optional[float] = None
    infant_dependents: Optional[int] = None
    region_code: Optional[str] = None
    existing_policyholder: Optional[int] = None
    previous_claims_filed: Optional[int] = None
    years_without_claims: Optional[int] = None
    policy_amendments_count: Optional[int] = None
    broker_id: Optional[float] = None
    employer_id: Optional[float] = None
    underwriting_processing_days: Optional[int] = None
    vehicles_on_policy: Optional[int] = None
    custom_riders_requested: Optional[int] = None
    broker_agency_type: Optional[str] = None
    deductible_tier: Optional[str] = None
    acquisition_channel: Optional[str] = None
    payment_schedule: Optional[str] = None
    employment_status: Optional[str] = None
    estimated_annual_income: Optional[float] = None
    days_since_quote: Optional[int] = None
    policy_start_month: Optional[str] = None
    purchased_coverage_bundle: Optional[str] = None

    class Config:
        from_attributes = True


# ──────────────────── Bundle Policy Schemas ────────────────────
class BundlePolicyOut(BaseModel):
    id: int
    bundle_name: str
    description: str

    class Config:
        from_attributes = True


# ──────────────────── Dashboard Schemas ────────────────────
class DashboardStats(BaseModel):
    total_clients: int
    total_cancelled: int
    total_active: int
    cancellation_rate: float
    avg_income: float
    bundle_distribution: dict
    region_distribution: dict
    employment_distribution: dict
    agency_type_distribution: dict
    monthly_distribution: dict
    channel_distribution: dict
    deductible_distribution: dict


# ──────────────────── Classification / Prediction Schemas ────────────────────

class ClientPredictInput(BaseModel):
    """All 22 columns the ML pipeline requires for inference."""
    user_id: Optional[str] = None
    estimated_annual_income: float
    adult_dependents: int = 0
    child_dependents: Optional[float] = None
    infant_dependents: int = 0
    previous_policy_duration_months: int = 0
    days_since_quote: int = 30
    grace_period_extensions: int = 0
    custom_riders_requested: int = 0
    vehicles_on_policy: int = 0
    policy_amendments_count: int = 0
    previous_claims_filed: int = 0
    years_without_claims: int = 0
    underwriting_processing_days: int = 5
    region_code: Optional[str] = None
    broker_agency_type: str = "Independent"
    deductible_tier: str = "Tier_2"
    acquisition_channel: str = "Online"
    payment_schedule: str = "Monthly"
    employment_status: str = "Employed"
    policy_start_month: str = "January"
    broker_id: Optional[float] = None
    employer_id: Optional[float] = None


class PredictionOut(BaseModel):
    user_id: str
    predicted_bundle: int
    bundle_name: str
    confidence: int
    class_probabilities: List[int]


class BatchPredictionOut(BaseModel):
    count: int
    results: List[PredictionOut]
