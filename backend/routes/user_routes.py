from fastapi import APIRouter, HTTPException
from passlib.context import CryptContext
from jose import jwt
import os
from datetime import datetime, timedelta
import re

from config.database import get_database
from models.user_model import User, UserLogin
from utils.apiResponse import ApiResponse, ApiError

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("JWT_SECRET")
SALT_ROUNDS = int(os.getenv("SALT", "10"))

def create_token(user_id: str) -> str:
    return jwt.encode({"id": user_id}, SECRET_KEY, algorithm="HS256")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def is_valid_email(email: str) -> bool:
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

@router.post("/register")
async def register_user(user: User):
    try:
        db = get_database()
        if db is None:
            raise ApiError(500, "Database not connected")
        users_collection = db.users
        
        # Check if user exists
        existing_user = await users_collection.find_one({"email": user.email})
        if existing_user:
            raise ApiError(409, "User already exists")
        
        # Validate email
        if not is_valid_email(user.email):
            raise ApiError(400, "Please enter valid email")
        
        # Validate password
        if len(user.password) < 8:
            raise ApiError(400, "Please enter strong password")
        
        # Hash password
        hashed_password = get_password_hash(user.password)
        
        # Create user
        user_data = {
            "name": user.name,
            "email": user.email,
            "password": hashed_password,
        }
        
        result = await users_collection.insert_one(user_data)
        created_user = await users_collection.find_one({"_id": result.inserted_id})
        
        token = create_token(str(created_user["_id"]))
        response = ApiResponse(201, {"token": token}, "Registration successful")
        
        return response.to_dict()
        
    except ApiError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login")
async def login_user(user_login: UserLogin):
    try:
        db = get_database()
        if db is None:
            raise ApiError(500, "Database not connected")
        users_collection = db.users
        
        # Find user
        user = await users_collection.find_one({"email": user_login.email})
        if not user:
            raise ApiError(404, "User Doesn't exist")
        
        # Verify password
        if not verify_password(user_login.password, user["password"]):
            raise ApiError(401, "Invalid Credentials")
        
        token = create_token(str(user["_id"]))
        response = ApiResponse(200, {"token": token}, "Login successful")
        
        return response.to_dict()
        
    except ApiError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

user_router = router