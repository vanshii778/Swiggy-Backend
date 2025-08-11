from fastapi import APIRouter, HTTPException, Header, Depends, BackgroundTasks
from passlib.context import CryptContext
from jose import jwt
import os
from datetime import datetime, timedelta, timezone
import re
from bson import ObjectId
from config.database import get_database
from models.user_model import User, UserLogin, user_helper, UpdateUserProfile, ForgotPassword, ResetPassword, ChangePassword
from utils.apiResponse import ApiResponse, ApiError
import secrets
from starlette import status

from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("JWT_SECRET")

conf = ConnectionConfig(
    MAIL_USERNAME = os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD"),
    MAIL_FROM = os.getenv("MAIL_FROM"),
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER = os.getenv("MAIL_SERVER"),
    MAIL_STARTTLS = True,  
    MAIL_SSL_TLS = False, 
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)

def create_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=1)
    to_encode = {"id": user_id, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

@router.post("/register")
async def register_user(user: User):
    try:
        db = get_database()
        users_collection = db.users
        existing_user = await users_collection.find_one({"email": user.email})
        if existing_user:
            raise ApiError(409, "User already exists")
        
        hashed_password = get_password_hash(user.password)
        user_data = { "name": user.name, "email": user.email, "password": hashed_password }
        result = await users_collection.insert_one(user_data)
        created_user = await users_collection.find_one({"_id": result.inserted_id})
        token = create_token(str(created_user["_id"]))
        return ApiResponse(201, {"token": token}, "Registration successful").to_dict()
    except ApiError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login")
async def login_user(user_login: UserLogin):
    try:
        db = get_database()
        users_collection = db.users
        user = await users_collection.find_one({"email": user_login.email})
        if not user or not verify_password(user_login.password, user["password"]):
            raise ApiError(401, "Invalid Credentials")
        
        token = create_token(str(user["_id"]))
        user_name = user.get("name")
        return ApiResponse(200, {"token": token, "name": user_name}, "Login successful").to_dict()
    except ApiError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_current_user(token: str = Header(..., alias="Authorization")) -> str:
    if not token.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication scheme.")
    token = token.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("id")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload.")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired.")
    except jwt.JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")

@router.get("/user-profile")
async def show_profile(user_id: str = Depends(get_current_user)):
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return ApiResponse(200, user_helper(user), "Profile fetched successfully").to_dict()

@router.put("/update-profile")
async def update_profile(update_data: UpdateUserProfile, user_id: str = Depends(get_current_user)):
    db = get_database()
    update_fields = update_data.model_dump(exclude_unset=True)
    if "addresses" in update_fields:
        update_fields["addresses"] = [address for address in update_fields["addresses"]]
    
    if update_fields:
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_fields})
    
    updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
    return ApiResponse(200, user_helper(updated_user), "Profile updated successfully").to_dict()

@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(data: ChangePassword, user_id: str = Depends(get_current_user)):
    try:
        db = get_database()
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user or not verify_password(data.current_password, user["password"]):
            raise ApiError(status.HTTP_401_UNAUTHORIZED, "Incorrect current password")

        hashed_password = get_password_hash(data.new_password)
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"password": hashed_password}})
        return ApiResponse(status.HTTP_200_OK, message="Password changed successfully").to_dict()
    except ApiError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.post("/forgot-password")
async def forgot_password(data: ForgotPassword, background_tasks: BackgroundTasks):
    try:
        db = get_database()
        user = await db.users.find_one({"email": data.email})

        if user:
            token = secrets.token_urlsafe(32)
            expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"reset_token": token, "reset_token_expires_at": expires_at}}
            )

            reset_link = f"http://localhost:1234/reset-password/{token}"
            html_content = f"""
                <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
                    <h2>Password Reset Request</h2>
                    <p>You requested a password reset. Click the button below to set a new password:</p>
                    <a href="{reset_link}" style="background-color: #f97316; color: white; padding: 14px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 8px; font-size: 16px;">
                        Reset Password
                    </a>
                    <p style="margin-top: 20px;">If you did not request this, please ignore this email.</p>
                    <p><small>This link will expire in 15 minutes.</small></p>
                </div>
            """
            message = MessageSchema(
                subject="Your Password Reset Link",
                recipients=[data.email],
                body=html_content,
                subtype=MessageType.html
            )
            fm = FastMail(conf)
            background_tasks.add_task(fm.send_message, message)

        return ApiResponse(200, message="If an account with that email exists, a password reset link has been sent.").to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reset-password")
async def reset_password(data: ResetPassword):
    try:
        db = get_database()
        user = await db.users.find_one({
            "reset_token": data.token,
            "reset_token_expires_at": {"$gt": datetime.now(timezone.utc)}
        })
        if not user:
            raise ApiError(400, "Invalid or expired password reset token.")
        
        hashed_password = get_password_hash(data.new_password)
        await db.users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {"password": hashed_password},
                "$unset": {"reset_token": "", "reset_token_expires_at": ""}
            }
        )
        return ApiResponse(200, message="Your password has been successfully reset.").to_dict()
    except ApiError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

user_router = router
