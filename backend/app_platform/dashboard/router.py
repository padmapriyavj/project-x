"""Dashboard API routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app_platform.auth.dependencies import get_current_user
from models.user import User

from .schemas import StudentDashboardResponse
from .service import build_student_dashboard

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/student", response_model=StudentDashboardResponse)
def get_student_dashboard(
    current_user: Annotated[User, Depends(get_current_user)],
) -> StudentDashboardResponse:
    """Get dashboard data for the current student."""
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required",
        )
    return build_student_dashboard(current_user)
