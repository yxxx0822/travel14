from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    nickname: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    username: str
    password: str


class UserUpdate(BaseModel):
    nickname: Optional[str] = None
    avatarUrl: Optional[str] = None
    email: Optional[EmailStr] = None


class UserResponse(UserBase):
    userId: str
    avatarUrl: Optional[str] = None
    createdAt: datetime
    lastLoginAt: Optional[datetime] = None
    locationAuthorized: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    userId: Optional[str] = None
