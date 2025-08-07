from fastapi import APIRouter, HTTPException,Header,Depends
from passlib.context import CryptContext
from jose import jwt
import os
from datetime import datetime, timedelta
import re
from bson import ObjectId
from config.database import get_database
from models.user_model import User, UserLogin,user_helper,UpdateUserProfile
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
        
        existing_user = await users_collection.find_one({"email": user.email})
        if existing_user:
            raise ApiError(409, "User already exists")
        
        if not is_valid_email(user.email):
            raise ApiError(400, "Please enter valid email")
        
        if len(user.password) < 8:
            raise ApiError(400, "Please enter strong password")
        
        hashed_password = get_password_hash(user.password)
        
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
    

def get_current_user(token: str = Header(...)) -> str:
    try:
        payload = jwt.decode(token,SECRET_KEY,algorithms=["HS256"])
        user_id = payload.get("id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except ApiError:
        raise HTTPException(status_code=401,detail="Invalid token")

@router.get("/user-profile")
async def show_profile(user_id: str = Depends(get_current_user)):
    try:
        db = get_database()
        if db is None:
            raise ApiError(500, "Database not connected")
        users_collection = db.users

        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise ApiError(404, "User not found")

        profile_data = user_helper(user)
        response = ApiResponse(200, profile_data, "Profile fetched successfully")
        return response.to_dict()

    except ApiError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/update-profile")
async def update_profile(
    update_data: UpdateUserProfile,
    user_id: str = Depends(get_current_user)
):
    try:
        db = get_database()
        if db is None:
            raise ApiError(500, "Database not connected")

        users_collection = db.users
        existing_user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not existing_user:
            raise ApiError(404, "User not found")

        update_fields = {}

        if update_data.name is not None:
            update_fields["name"] = update_data.name
        if update_data.phone_number is not None:
            update_fields["phone_number"] = update_data.phone_number
        if update_data.addresses is not None:
            update_fields["addresses"] = [address.dict() for address in update_data.addresses]

        if update_fields:
            await users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_fields}
            )

        updated_user = await users_collection.find_one({"_id": ObjectId(user_id)})
        profile_data = user_helper(updated_user)

        return ApiResponse(200, profile_data, "Profile updated successfully").to_dict()

    except ApiError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

user_router = router