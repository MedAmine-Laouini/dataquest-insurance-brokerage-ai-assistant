"""Seed the database with train.csv data and default users."""
import asyncio
import os
import pandas as pd
import math

from sqlalchemy import select, text

from app.database import engine, async_session, Base
from app.models import User, Client, UserRole
from app.auth import hash_password
from app.config import settings


async def seed():
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        # ── Seed default users ──────────────────────────────────────
        existing = await db.execute(select(User).where(User.email == "admin@marcos.ai"))
        if not existing.scalar_one_or_none():
            admin = User(
                email="admin@marcos.ai",
                name="Admin",
                hashed_password=hash_password("admin123"),
                role=UserRole.admin,
            )
            broker = User(
                email="broker@marcos.ai",
                name="Broker",
                hashed_password=hash_password("broker123"),
                role=UserRole.broker,
            )
            db.add_all([admin, broker])
            await db.commit()
            print("[SEED] Created default users: admin@marcos.ai / broker@marcos.ai")
        else:
            print("[SEED] Default users already exist, skipping.")

        # ── Seed clients from train.csv ─────────────────────────────
        count_result = await db.execute(text("SELECT COUNT(*) FROM clients"))
        count = count_result.scalar()
        if count > 0:
            print(f"[SEED] Clients table already has {count} rows, skipping.")
            return

        csv_path = os.path.join(settings.DATA_DIR, "train.csv")
        print(f"[SEED] Loading train.csv from {csv_path} ...")
        df = pd.read_csv(csv_path)

        column_map = {
            "User_ID": "user_id",
            "Policy_Cancelled_Post_Purchase": "policy_cancelled",
            "Policy_Start_Year": "policy_start_year",
            "Policy_Start_Week": "policy_start_week",
            "Policy_Start_Day": "policy_start_day",
            "Grace_Period_Extensions": "grace_period_extensions",
            "Previous_Policy_Duration_Months": "previous_policy_duration_months",
            "Adult_Dependents": "adult_dependents",
            "Child_Dependents": "child_dependents",
            "Infant_Dependents": "infant_dependents",
            "Region_Code": "region_code",
            "Existing_Policyholder": "existing_policyholder",
            "Previous_Claims_Filed": "previous_claims_filed",
            "Years_Without_Claims": "years_without_claims",
            "Policy_Amendments_Count": "policy_amendments_count",
            "Broker_ID": "broker_id",
            "Employer_ID": "employer_id",
            "Underwriting_Processing_Days": "underwriting_processing_days",
            "Vehicles_on_Policy": "vehicles_on_policy",
            "Custom_Riders_Requested": "custom_riders_requested",
            "Broker_Agency_Type": "broker_agency_type",
            "Deductible_Tier": "deductible_tier",
            "Acquisition_Channel": "acquisition_channel",
            "Payment_Schedule": "payment_schedule",
            "Employment_Status": "employment_status",
            "Estimated_Annual_Income": "estimated_annual_income",
            "Days_Since_Quote": "days_since_quote",
            "Policy_Start_Month": "policy_start_month",
            "Purchased_Coverage_Bundle": "purchased_coverage_bundle",
        }
        df = df.rename(columns=column_map)

        # Insert in batches
        BATCH_SIZE = 2000
        total = len(df)
        for start in range(0, total, BATCH_SIZE):
            batch = df.iloc[start : start + BATCH_SIZE]
            clients = []
            for _, row in batch.iterrows():
                record = {}
                for col in column_map.values():
                    val = row.get(col)
                    if val is not None and isinstance(val, float) and math.isnan(val):
                        val = None
                    record[col] = val
                clients.append(Client(**record))
            db.add_all(clients)
            await db.commit()
            print(f"[SEED]   Inserted {min(start + BATCH_SIZE, total)}/{total} clients")

        print(f"[SEED] Done! Seeded {total} clients from train.csv")


if __name__ == "__main__":
    asyncio.run(seed())
