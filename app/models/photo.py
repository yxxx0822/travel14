from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class Photo(Base):
    __tablename__ = "photos"

    photoId = Column(String, primary_key=True, index=True)
    url = Column(String, nullable=False)
    caption = Column(String)
    uploadTime = Column(DateTime, default=datetime.utcnow)

    # 外键
    diaryId = Column(String, ForeignKey("diaries.diaryId"), nullable=False)

    # 关系
    diary = relationship("Diary", back_populates="photos")
