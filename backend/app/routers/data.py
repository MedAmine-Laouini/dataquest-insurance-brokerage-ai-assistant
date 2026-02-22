"""Data endpoints for bundle policies and insurance companies."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import BundlePolicy, User
from app.schemas import BundlePolicyOut
from app.auth import get_current_user

router = APIRouter(prefix="/api", tags=["data"])


@router.get("/policies", response_model=list[BundlePolicyOut])
async def get_policies(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(BundlePolicy).order_by(BundlePolicy.id))
    return result.scalars().all()
