from sqlalchemy import Column, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


# 多对多关系表
diary_mood_tags = Table(
    "diary_mood_tags",
    Base.metadata,
    Column("diaryId", String, ForeignKey("diaries.diaryId"), primary_key=True),
    Column("tagId", String, ForeignKey("mood_tags.tagId"), primary_key=True)
)


class MoodTag(Base):
    __tablename__ = "mood_tags"

    tagId = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    color = Column(String)

    # 关系
    diaries = relationship("Diary", secondary=diary_mood_tags, back_populates="moodTags")
