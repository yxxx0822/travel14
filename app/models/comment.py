from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class Comment(Base):
    __tablename__ = "comments"

    commentId = Column(String, primary_key=True, index=True)
    content = Column(String, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)

    # 外键
    userId = Column(String, ForeignKey("users.userId"), nullable=False)
    diaryId = Column(String, ForeignKey("diaries.diaryId"), nullable=False)

    # 关系
    user = relationship("User", back_populates="comments")
    diary = relationship("Diary", back_populates="comments")


class Like(Base):
    __tablename__ = "likes"

    likeId = Column(String, primary_key=True, index=True)
    createdAt = Column(DateTime, default=datetime.utcnow)

    # 外键
    userId = Column(String, ForeignKey("users.userId"), nullable=False)
    diaryId = Column(String, ForeignKey("diaries.diaryId"), nullable=False)

    # 关系
    user = relationship("User", back_populates="likes")
    diary = relationship("Diary", back_populates="likes")
