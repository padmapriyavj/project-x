import secrets
import string
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app_platform.auth.dependencies import get_current_user
from database import get_db
from models.course import Course
from models.enrollment import Enrollment
from models.user import User

from .schemas import (
    CourseResponse,
    CreateCourseRequest,
    EnrollRequest,
    StudentResponse,
    UpdateCourseRequest,
)

router = APIRouter(prefix="/api/v1/courses", tags=["courses"])

_JOIN_ALPHABET = string.ascii_uppercase + string.digits


def _generate_join_code() -> str:
    return "".join(secrets.choice(_JOIN_ALPHABET) for _ in range(6))


def _course_or_404(db: Session, course_id: int) -> Course:
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course


def _user_enrolled(db: Session, user_id: int, course_id: int) -> bool:
    row = db.execute(
        select(Enrollment.id).where(
            Enrollment.user_id == user_id,
            Enrollment.course_id == course_id,
        )
    ).scalar_one_or_none()
    return row is not None


@router.post("/", response_model=CourseResponse)
def create_course(
    body: CreateCourseRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> Course:
    if current_user.role != "professor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Professor access required")

    description = body.description
    for attempt in range(20):
        course = Course(
            professor_id=current_user.id,
            name=body.name,
            description=description,
            schedule=body.schedule,
            join_code=_generate_join_code(),
        )
        db.add(course)
        try:
            db.commit()
            db.refresh(course)
            return course
        except IntegrityError:
            db.rollback()
            continue
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Could not allocate a unique join code",
    )


@router.get("/", response_model=list[CourseResponse])
def list_courses(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> list[Course]:
    if current_user.role == "professor":
        return list(
            db.execute(select(Course).where(Course.professor_id == current_user.id)).scalars().all()
        )
    return list(
        db.execute(
            select(Course)
            .join(Enrollment, Enrollment.course_id == Course.id)
            .where(Enrollment.user_id == current_user.id)
        )
        .scalars()
        .all()
    )


@router.get("/{course_id}", response_model=CourseResponse)
def get_course(
    course_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> Course:
    course = _course_or_404(db, course_id)
    if course.professor_id != current_user.id and not _user_enrolled(
        db, current_user.id, course_id
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return course


@router.patch("/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: int,
    body: UpdateCourseRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> Course:
    course = _course_or_404(db, course_id)
    if course.professor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the course owner can update")

    data = body.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(course, key, value)
    db.commit()
    db.refresh(course)
    return course


@router.post("/{course_id}/enroll", response_model=CourseResponse)
def enroll_in_course(
    course_id: int,
    body: EnrollRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> Course:
    if current_user.role != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student access required")

    course = _course_or_404(db, course_id)
    if body.join_code.strip().upper() != course.join_code.strip().upper():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid join code")

    db.add(Enrollment(user_id=current_user.id, course_id=course_id))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already enrolled in this course",
        ) from None
    db.refresh(course)
    return course


@router.get("/{course_id}/students", response_model=list[StudentResponse])
def list_course_students(
    course_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> list[User]:
    course = _course_or_404(db, course_id)
    if course.professor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the course owner can view students")

    rows = db.execute(
        select(User)
        .join(Enrollment, Enrollment.user_id == User.id)
        .where(Enrollment.course_id == course_id)
    ).scalars().all()
    return list(rows)
