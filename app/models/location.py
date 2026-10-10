from sqlalchemy import Column, String, Double, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class Location(Base):
    __tablename__ = "locations"

    locationId = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    latitude = Column(Double, nullable=False)
    longitude = Column(Double, nullable=False)
    region = Column(String)
    address = Column(String)

    # 关系
    diaries = relationship("Diary", back_populates="location")
    records = relationship("LocationRecord", back_populates="location")


class LocationRecord(Base):
    __tablename__ = "location_records"

    recordId = Column(String, primary_key=True, index=True)
    latitude = Column(Double, nullable=False)
    longitude = Column(Double, nullable=False)
    recordedAt = Column(DateTime, default=datetime.utcnow)

    # 外键
    locationId = Column(String, Column(String, ForeignKey("locations.locationId")))

    # 关系
    location = relationship("Location", back_populates="records")
