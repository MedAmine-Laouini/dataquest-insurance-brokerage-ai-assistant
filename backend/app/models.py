from sqlalchemy import Column, Integer, String, Float, Boolean, Enum as SAEnum
from app.database import Base
import enum


# ──────────────────────────── User Model ────────────────────────────
class UserRole(str, enum.Enum):
    admin = "admin"
    broker = "broker"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.broker, nullable=False)
    is_active = Column(Boolean, default=True)


# ──────────────────────────── Client Model (train.csv) ───────────────
class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True)  # USR_000000
    policy_cancelled = Column(Integer, nullable=True)
    policy_start_year = Column(Integer, nullable=True)
    policy_start_week = Column(Integer, nullable=True)
    policy_start_day = Column(Integer, nullable=True)
    grace_period_extensions = Column(Integer, nullable=True)
    previous_policy_duration_months = Column(Integer, nullable=True)
    adult_dependents = Column(Integer, nullable=True)
    child_dependents = Column(Float, nullable=True)
    infant_dependents = Column(Integer, nullable=True)
    region_code = Column(String, nullable=True)
    existing_policyholder = Column(Integer, nullable=True)
    previous_claims_filed = Column(Integer, nullable=True)
    years_without_claims = Column(Integer, nullable=True)
    policy_amendments_count = Column(Integer, nullable=True)
    broker_id = Column(Float, nullable=True)
    employer_id = Column(Float, nullable=True)
    underwriting_processing_days = Column(Integer, nullable=True)
    vehicles_on_policy = Column(Integer, nullable=True)
    custom_riders_requested = Column(Integer, nullable=True)
    broker_agency_type = Column(String, nullable=True)
    deductible_tier = Column(String, nullable=True)
    acquisition_channel = Column(String, nullable=True)
    payment_schedule = Column(String, nullable=True)
    employment_status = Column(String, nullable=True)
    estimated_annual_income = Column(Float, nullable=True)
    days_since_quote = Column(Integer, nullable=True)
    policy_start_month = Column(String, nullable=True)
    purchased_coverage_bundle = Column(String, nullable=True)
