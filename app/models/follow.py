from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class Follow(Base):
    __tablename__ = "follows"

    followId = Column(String, primary_key=True, index=True)
    followerId = Column(String, ForeignKey("users.userId"), nullable=False)
    followedId = Column(String, ForeignKey("users.userId"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)

    # 关系
    follower = relationship("User", foreign_keys=[followerId], back_populates="following")
    followed = relationship("User", foreign_keys=[followedId], back_populates="followers")
