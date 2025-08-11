from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List

class Address(BaseModel):
    street_address: str
    city: str
    state: str
    zip_code: str

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "street_address": "123 Main St",
                "city": "Anytown",
                "state": "CA",
                "zip_code": "12345"
            }
        }

class User(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UpdateUserProfile(BaseModel):
    name: Optional[str] = Field(None, min_length=2)
    phone_number: Optional[str] = Field(None, pattern=r"^\+?1?\d{9,15}$")
    addresses: Optional[List[Address]] = None

    @field_validator('addresses', mode='before')
    @classmethod
    def empty_list_to_none(cls, v):
        if isinstance(v, list) and not v:
            return None
        return v


class ShowUserProfile(BaseModel):
    id: str
    name: str
    email: EmailStr
    phone_number: Optional[str] = None
    addresses: List[Address] = []

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    token: str

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    token: str
    new_password: str

class ChangePassword(BaseModel):
    current_password: str
    new_password: str

def user_helper(user_data) -> dict:
    if not user_data:
        return {}
    return {
        "id": str(user_data["_id"]),
        "name": user_data.get("name"),
        "email": user_data.get("email"),
        "phone_number": user_data.get("phone_number"),
        "addresses": user_data.get("addresses", [])
    }
