from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from datetime import datetime

from app.database import get_db
from app.models.diary import Diary
from app.models.location import Location
from app.schemas.diary import DiaryCreate, DiaryUpdate, DiaryResponse, DiaryListResponse
from app.api.auth import oauth2_scheme
from app.utils.auth import decode_token
from app.models.user import User

router = APIRouter(prefix="/diaries", tags=["日记"])


def get_current_user_id(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> str:
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="无效的认证凭据")
    user = db.query(User).filter(User.userId == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")
    return user_id


@router.post("/", response_model=DiaryResponse, status_code=status.HTTP_201_CREATED)
def create_diary(
    diary_data: DiaryCreate,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """创建日记"""
    location_id = diary_data.locationId

    # If frontend passed an inline location object, create/find the Location row
    if hasattr(diary_data, 'location') and diary_data.location:
        loc = diary_data.location
        location_id = str(uuid.uuid4())
        new_loc = Location(
            locationId=location_id,
            name=loc.get('name', '未知地点'),
            latitude=loc.get('latitude', 0.0),
            longitude=loc.get('longitude', 0.0),
            address=loc.get('address'),
        )
        db.add(new_loc)

    new_diary = Diary(
        diaryId=str(uuid.uuid4()),
        title=diary_data.title,
        content=diary_data.content,
        travelDate=diary_data.travelDate,
        mood=diary_data.mood,
        visibility=diary_data.visibility,
        userId=current_user_id,
        locationId=location_id,
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow()
    )

    db.add(new_diary)
    db.commit()
    db.refresh(new_diary)
    return new_diary


@router.get("/", response_model=DiaryListResponse)
def list_diaries(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """获取当前用户的日记列表"""
    total = db.query(Diary).filter(Diary.userId == current_user_id).count()
    diaries = (
        db.query(Diary)
        .filter(Diary.userId == current_user_id)
        .order_by(Diary.createdAt.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return {"total": total, "diaries": diaries}


@router.get("/public", response_model=List[DiaryResponse])
def list_public_diaries(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """获取公开日记"""
    from app.models.diary import Visibility
    diaries = (
        db.query(Diary)
        .filter(Diary.visibility == Visibility.PUBLIC)
        .order_by(Diary.createdAt.desc())
        .limit(limit)
        .all()
    )
    return diaries


@router.get("/public", response_model=List[DiaryResponse])
def list_public_diaries(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """获取公开日记"""
    from app.models.diary import Visibility
    diaries = (
        db.query(Diary)
        .filter(Diary.visibility == Visibility.PUBLIC)
        .order_by(Diary.createdAt.desc())
        .limit(limit)
        .all()
    )
    return diaries


@router.get("/{diary_id}", response_model=DiaryResponse)
def get_diary(diary_id: str, db: Session = Depends(get_db)):
    """获取单个日记详情"""
    diary = db.query(Diary).filter(Diary.diaryId == diary_id).first()
    if not diary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="日记不存在")
    return diary


@router.put("/{diary_id}", response_model=DiaryResponse)
def update_diary(
    diary_id: str,
    diary_data: DiaryUpdate,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """更新日记"""
    diary = db.query(Diary).filter(Diary.diaryId == diary_id).first()
    if not diary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="日记不存在")
    if diary.userId != current_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权修改此日记")
    update_data = diary_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(diary, field, value)
    diary.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(diary)
    return diary


@router.delete("/{diary_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_diary(
    diary_id: str,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """删除日记"""
    diary = db.query(Diary).filter(Diary.diaryId == diary_id).first()
    if not diary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="日记不存在")
    if diary.userId != current_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权删除此日记")
    db.delete(diary)
    db.commit()
    return None

