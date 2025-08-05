from pydantic import BaseModel, EmailStr
from typing import Optional, Dict
from bson import ObjectId

class User(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserInDB(User):
    id: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    token: str


def user_helper(user) -> dict:
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
    }