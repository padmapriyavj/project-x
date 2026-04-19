from fastapi import APIRouter

from engagement.scoring.router import router as scoring_router

router = APIRouter(prefix="/api/v1", tags=["Engagement"])
router.include_router(scoring_router)
