from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models import Client, User
from app.schemas import DashboardStats
from app.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Total clients
    total_result = await db.execute(select(func.count(Client.id)))
    total_clients = total_result.scalar()

    # Cancelled count
    cancelled_result = await db.execute(
        select(func.count(Client.id)).where(Client.policy_cancelled == 1)
    )
    total_cancelled = cancelled_result.scalar()
    total_active = total_clients - total_cancelled

    # Avg income
    income_result = await db.execute(
        select(func.avg(Client.estimated_annual_income))
    )
    avg_income = round(income_result.scalar() or 0, 2)

    # Bundle distribution
    bundle_rows = await db.execute(
        select(Client.purchased_coverage_bundle, func.count(Client.id))
        .group_by(Client.purchased_coverage_bundle)
    )
    bundle_distribution = {
        row[0] or "Unknown": row[1] for row in bundle_rows.all()
    }

    # Region distribution
    region_rows = await db.execute(
        select(Client.region_code, func.count(Client.id))
        .group_by(Client.region_code)
    )
    region_distribution = {
        row[0] or "Unknown": row[1] for row in region_rows.all()
    }

    # Employment distribution
    emp_rows = await db.execute(
        select(Client.employment_status, func.count(Client.id))
        .group_by(Client.employment_status)
    )
    employment_distribution = {
        row[0] or "Unknown": row[1] for row in emp_rows.all()
    }

    # Agency type distribution
    agency_rows = await db.execute(
        select(Client.broker_agency_type, func.count(Client.id))
        .group_by(Client.broker_agency_type)
    )
    agency_type_distribution = {
        row[0] or "Unknown": row[1] for row in agency_rows.all()
    }

    # Monthly distribution
    month_rows = await db.execute(
        select(Client.policy_start_month, func.count(Client.id))
        .group_by(Client.policy_start_month)
    )
    monthly_distribution = {
        row[0] or "Unknown": row[1] for row in month_rows.all()
    }

    # Channel distribution
    channel_rows = await db.execute(
        select(Client.acquisition_channel, func.count(Client.id))
        .group_by(Client.acquisition_channel)
    )
    channel_distribution = {
        row[0] or "Unknown": row[1] for row in channel_rows.all()
    }

    # Deductible distribution
    ded_rows = await db.execute(
        select(Client.deductible_tier, func.count(Client.id))
        .group_by(Client.deductible_tier)
    )
    deductible_distribution = {
        row[0] or "Unknown": row[1] for row in ded_rows.all()
    }

    cancellation_rate = round((total_cancelled / total_clients * 100), 2) if total_clients else 0

    return DashboardStats(
        total_clients=total_clients,
        total_cancelled=total_cancelled,
        total_active=total_active,
        cancellation_rate=cancellation_rate,
        avg_income=avg_income,
        bundle_distribution=bundle_distribution,
        region_distribution=region_distribution,
        employment_distribution=employment_distribution,
        agency_type_distribution=agency_type_distribution,
        monthly_distribution=monthly_distribution,
        channel_distribution=channel_distribution,
        deductible_distribution=deductible_distribution,
    )
