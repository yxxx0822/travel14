from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
import enum


class Visibility(enum.Enum):
    PUBLIC = "PUBLIC"
    PRIVATE = "PRIVATE"
    FRIENDS_ONLY = "FRIENDS_ONLY"


class Diary(Base):
    __tablename__ = "diaries"

    diaryId = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(String)
    travelDate = Column(DateTime, nullable=False)
    mood = Column(String)
    visibility = Column(SQLEnum(Visibility), default=Visibility.PUBLIC)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 外键
    userId = Column(String, ForeignKey("users.userId"), nullable=False)
    locationId = Column(String, ForeignKey("locations.locationId"))

    # 关系
    author = relationship("User", back_populates="diaries")
    location = relationship("Location", back_populates="diaries")
    photos = relationship("Photo", back_populates="diary", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="diary", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="diary", cascade="all, delete-orphan")
    moodTags = relationship("MoodTag", secondary="diary_mood_tags", back_populates="diaries")
