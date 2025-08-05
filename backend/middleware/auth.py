from fastapi import HTTPException, Header
from jose import JWTError, jwt
import os
from typing import Optional

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"

async def get_current_user(token: Optional[str] = Header(None)):
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Not Authorized Login Again"
        )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")