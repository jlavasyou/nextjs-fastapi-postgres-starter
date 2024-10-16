from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from db_engine import engine
from models import User, Message
from seed import seed_user_if_needed
import random

seed_user_if_needed()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserRead(BaseModel):
    id: int
    name: str

class MessageCreate(BaseModel):
    content: str

class MessageRead(BaseModel):
    id: int
    content: str
    is_user: bool
    timestamp: str

async def get_db():
    async with AsyncSession(engine) as session:
        yield session

@app.get("/users/me")
async def get_my_user(db: AsyncSession = Depends(get_db)):
    async with db.begin():
        result = await db.execute(select(User))
        user = result.scalars().first()

        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        return UserRead(id=user.id, name=user.name)

@app.post("/messages")
async def create_message(message: MessageCreate, db: AsyncSession = Depends(get_db)):
    async with db.begin():
        user = await db.execute(select(User))
        user = user.scalars().first()

        if user is None:
            raise HTTPException(status_code=404, detail="User not found")

        new_message = Message(content=message.content, is_user=True, user_id=user.id)
        db.add(new_message)
        await db.flush()

        # Generate bot response
        bot_response = generate_bot_response()
        bot_message = Message(content=bot_response, is_user=False, user_id=user.id)
        db.add(bot_message)
        await db.flush()

        return MessageRead(
            id=bot_message.id,
            content=bot_message.content,
            is_user=bot_message.is_user,
            timestamp=bot_message.timestamp.isoformat()
        )

@app.get("/messages")
async def get_messages(db: AsyncSession = Depends(get_db)):
    async with db.begin():
        result = await db.execute(select(Message).order_by(Message.timestamp))
        messages = result.scalars().all()

        return [
            MessageRead(
                id=message.id,
                content=message.content,
                is_user=message.is_user,
                timestamp=message.timestamp.isoformat()
            )
            for message in messages
        ]

def generate_bot_response() -> str:
    responses = [
        "That's interesting! Tell me more.",
        "I see. How does that make you feel?",
        "Could you elaborate on that?",
        "Interesting perspective. What led you to think that way?",
        "I understand. Is there anything else on your mind?",
    ]
    return random.choice(responses)