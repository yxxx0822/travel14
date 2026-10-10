from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import datetime

from app.database import get_db
from app.models.diary import Diary
from app.schemas.diary import DiaryCreate, DiaryUpdate, DiaryResponse, DiaryListResponse

router = APIRouter(prefix="/diaries", tags=["日记"])


# 临时：用于测试的固定用户ID，实际应该从认证中间件获取
TEMP_USER_ID = "test-user-id"


@router.post("/", response_model=DiaryResponse, status_code=status.HTTP_201_CREATED)
def create_diary(
    diary_data: DiaryCreate,
    db: Session = Depends(get_db)
):
    """创建日记"""
    new_diary = Diary(
        diaryId=str(uuid.uuid4()),
        title=diary_data.title,
        content=diary_data.content,
        travelDate=diary_data.travelDate,
        mood=diary_data.mood,
        visibility=diary_data.visibility,
        userId=TEMP_USER_ID,  # TODO: 从认证中获取真实用户ID
        locationId=diary_data.locationId,
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
    db: Session = Depends(get_db)
):
    """获取日记列表"""
    # TODO: 根据可见性和用户关系过滤
    total = db.query(Diary).filter(Diary.userId == TEMP_USER_ID).count()
    diaries = (
        db.query(Diary)
        .filter(Diary.userId == TEMP_USER_ID)
        .order_by(Diary.createdAt.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return {"total": total, "diaries": diaries}


@router.get("/{diary_id}", response_model=DiaryResponse)
def get_diary(diary_id: str, db: Session = Depends(get_db)):
    """获取单个日记详情"""
    diary = db.query(Diary).filter(Diary.diaryId == diary_id).first()

    if not diary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="日记不存在"
        )

    # TODO: 检查可见性权限
    return diary


@router.put("/{diary_id}", response_model=DiaryResponse)
def update_diary(
    diary_id: str,
    diary_data: DiaryUpdate,
    db: Session = Depends(get_db)
):
    """更新日记"""
    diary = db.query(Diary).filter(Diary.diaryId == diary_id).first()

    if not diary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="日记不存在"
        )

    # TODO: 检查是否是日记作者
    if diary.userId != TEMP_USER_ID:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权修改此日记"
        )

    # 更新字段
    update_data = diary_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(diary, field, value)

    diary.updatedAt = datetime.utcnow()

    db.commit()
    db.refresh(diary)

    return diary


@router.delete("/{diary_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_diary(diary_id: str, db: Session = Depends(get_db)):
    """删除日记"""
    diary = db.query(Diary).filter(Diary.diaryId == diary_id).first()

    if not diary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="日记不存在"
        )

    # TODO: 检查是否是日记作者
    if diary.userId != TEMP_USER_ID:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权删除此日记"
        )

    db.delete(diary)
    db.commit()

    return None
