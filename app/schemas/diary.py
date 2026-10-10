from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.diary import Visibility


class DiaryBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: Optional[str] = None
    travelDate: datetime
    mood: Optional[str] = None
    visibility: Visibility = Visibility.PUBLIC


class DiaryCreate(DiaryBase):
    locationId: Optional[str] = None


class DiaryUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = None
    travelDate: Optional[datetime] = None
    mood: Optional[str] = None
    visibility: Optional[Visibility] = None
    locationId: Optional[str] = None


class DiaryResponse(DiaryBase):
    diaryId: str
    userId: str
    locationId: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class DiaryListResponse(BaseModel):
    total: int
    diaries: List[DiaryResponse]
