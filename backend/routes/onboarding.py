from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from database import (
    create_or_get_user_profile, get_user_profile,
    update_user_profile, mark_onboarding_complete
)

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


class InitProfileRequest(BaseModel):
    clerk_user_id: str
    email: Optional[str] = None
    full_name: Optional[str] = None


class SaveOnboardingRequest(BaseModel):
    clerk_user_id: str
    business_name: Optional[str] = None
    website_type: Optional[str] = None
    website_url: Optional[str] = None
    monthly_visitors: Optional[str] = None
    team_size: Optional[str] = None
    tech_comfort_level: Optional[str] = None
    has_customer_data: Optional[bool] = None
    has_payment_processing: Optional[bool] = None
    has_user_login: Optional[bool] = None
    previous_security_audit: Optional[bool] = None
    biggest_concern: Optional[str] = None
    hosting_provider: Optional[str] = None


class CompleteRequest(BaseModel):
    clerk_user_id: str


def profile_to_dict(p) -> dict:
    if not p:
        return {}
    return {
        "id": p.id,
        "clerk_user_id": p.clerk_user_id,
        "email": p.email,
        "full_name": p.full_name,
        "business_name": p.business_name,
        "website_type": p.website_type,
        "website_url": p.website_url,
        "monthly_visitors": p.monthly_visitors,
        "team_size": p.team_size,
        "tech_comfort_level": p.tech_comfort_level,
        "has_customer_data": p.has_customer_data,
        "has_payment_processing": p.has_payment_processing,
        "has_user_login": p.has_user_login,
        "previous_security_audit": p.previous_security_audit,
        "biggest_concern": p.biggest_concern,
        "hosting_provider": p.hosting_provider,
        "onboarding_completed": p.onboarding_completed,
        "onboarding_completed_at": str(p.onboarding_completed_at) if p.onboarding_completed_at else None,
        "created_at": str(p.created_at),
    }


@router.post("/profile/init")
async def init_profile(req: InitProfileRequest):
    profile = await create_or_get_user_profile(req.clerk_user_id, req.email, req.full_name)
    return profile_to_dict(profile)


@router.get("/profile/{clerk_user_id}")
async def get_profile(clerk_user_id: str):
    profile = await get_user_profile(clerk_user_id)
    return profile_to_dict(profile) if profile else {"error": "Profile not found"}


@router.post("/profile/save")
async def save_profile(req: SaveOnboardingRequest):
    data = {k: v for k, v in req.dict().items() if v is not None and k != "clerk_user_id"}
    profile = await update_user_profile(req.clerk_user_id, data)
    return profile_to_dict(profile)


@router.post("/profile/complete")
async def complete_onboarding(req: CompleteRequest):
    profile = await mark_onboarding_complete(req.clerk_user_id)
    return {"success": True, "profile": profile_to_dict(profile)}


@router.get("/profile/{clerk_user_id}/onboarding-status")
async def onboarding_status(clerk_user_id: str):
    profile = await get_user_profile(clerk_user_id)
    if not profile:
        return {"onboarding_completed": False, "profile_exists": False}
    return {
        "onboarding_completed": profile.onboarding_completed,
        "profile_exists": True,
        "website_type": profile.website_type,
        "business_name": profile.business_name,
    }
