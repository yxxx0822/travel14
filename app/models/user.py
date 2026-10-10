from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    userId = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    nickname = Column(String)
    avatarUrl = Column(String)
    email = Column(String, unique=True, index=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    lastLoginAt = Column(DateTime)
    locationAuthorized = Column(Boolean, default=False)

    # 关系
    diaries = relationship("Diary", back_populates="author", cascade="all, delete-orphan")
    followers = relationship("Follow", foreign_keys="Follow.followerId", back_populates="follower")
    following = relationship("Follow", foreign_keys="Follow.followId", back_populates="followed")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
