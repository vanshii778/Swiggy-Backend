import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

client = None
database = None

async def connect_db():
    global client, database
    try:
        client = AsyncIOMotorClient(os.getenv("MONGO_URL"))
        db_name = os.getenv("MONGO_DB_NAME")
        if not db_name:
            raise Exception("MONGO_DB_NAME not set in environment variables")
        database = client[db_name]
        print("DB Connected")
    except Exception as e:
        print(f"Database connection error: {e}")
        database = None

def get_database():
    if database is None:
        raise Exception("Database not connected")
    return database