from fastapi import FastAPI
import uvicorn
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from config.database import connect_db
from routes.user_routes import user_router

load_dotenv()

app = FastAPI(title="Swiggy", version="1.0.0")

origins = [
    "http://localhost:1234",  
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Database connection
@app.on_event("startup")
async def startup_event():
    await connect_db()

# Routes
app.include_router(user_router, prefix="/api/user", tags=["user"])

@app.get("/")
async def root():
    return {"message": "API Working"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 4000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)