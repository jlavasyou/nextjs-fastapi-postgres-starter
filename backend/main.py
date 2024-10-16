from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from db_engine import engine
from models import User, Message, Conversation
from seed import seed_user_if_needed
import random
from typing import List, Optional

seed_user_if_needed()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
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

class ConversationRead(BaseModel):
    id: int
    messages: list[MessageRead]
    user_id: int

class ConversationListItem(BaseModel):
    id: int
    user_id: int
    last_message: Optional[MessageRead]

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
    
@app.get("/conversations", response_model=List[ConversationListItem])
async def get_all_conversations(db: AsyncSession = Depends(get_db)):
    async with db.begin():
        # Get the current user (assuming there's only one user for simplicity)
        user_result = await db.execute(select(User))
        user = user_result.scalars().first()

        if user is None:
            raise HTTPException(status_code=404, detail="User not found")

        # Get all conversations for the user
        conversations_result = await db.execute(
            select(Conversation).where(Conversation.user_id == user.id)
        )
        conversations = conversations_result.scalars().all()

        conversation_list = []
        for conversation in conversations:
            # Get the last message for each conversation
            last_message_result = await db.execute(
                select(Message)
                .where(Message.conversation_id == conversation.id)
                .order_by(Message.timestamp.desc())
                .limit(1)
            )
            last_message = last_message_result.scalars().first()

            last_message_read = None
            if last_message:
                last_message_read = MessageRead(
                    id=last_message.id,
                    content=last_message.content,
                    is_user=last_message.is_user,
                    timestamp=last_message.timestamp.isoformat()
                )

            conversation_list.append(
                ConversationListItem(
                    id=conversation.id,
                    user_id=user.id,
                    last_message=last_message_read
                )
            )

        return conversation_list

@app.get("/conversations/{conversation_id}")
async def get_conversations(conversation_id: int, db: AsyncSession = Depends(get_db)):
    async with db.begin():
        result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
        conversation = result.scalars().first()

        if conversation is None:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        result = await db.execute(select(Message).where(Message.conversation_id == conversation_id).order_by(Message.timestamp))
        messages = result.scalars().all()

        message_reads = [
            MessageRead(
                id=message.id,
                content=message.content,
                is_user=message.is_user,
                timestamp=message.timestamp.isoformat()
            )
            for message in messages
        ]

        return ConversationRead(
            user_id=conversation.user_id,
            id=conversation_id,
            messages=message_reads
        )

@app.post("/conversations")
async def create_conversation(db: AsyncSession = Depends(get_db)):
    async with db.begin():
        user = await db.execute(select(User))
        user = user.scalars().first()

        if user is None:
            raise HTTPException(status_code=404, detail="User not found")

        new_conversation = Conversation(user_id=user.id)
        db.add(new_conversation)
        await db.flush()

        # Seed the conversation with an initial message
        initial_message = Message(
            content="Welcome to the conversation!",
            is_user=False,
            conversation_id=new_conversation.id
        )

        db.add(initial_message)
        await db.flush()

        return ConversationRead(
            id=new_conversation.id,
            user_id=user.id,
            messages=[
                MessageRead(
                    id=initial_message.id,
                    content=initial_message.content,
                    is_user=initial_message.is_user,
                    timestamp=initial_message.timestamp.isoformat()
                )
            ]
        )

@app.post("/messages")
async def create_message(message: MessageCreate, db: AsyncSession = Depends(get_db)):
    async with db.begin():
        result = await db.execute(select(Conversation).where(Conversation.id == message.conversation_id))
        conversation = result.scalars().first()

        if conversation is None:
            raise HTTPException(status_code=404, detail="Conversation not found")

        new_message = Message(
            content=message.content,
            is_user=True,
            conversation_id=message.conversation_id
        )
        db.add(new_message)
        await db.flush()

        # Generate bot response
        bot_response = generate_bot_response()
        bot_message = Message(
            content=bot_response,
            is_user=False,
            conversation_id=message.conversation_id
        )
        db.add(bot_message)
        await db.flush()

        return MessageRead(
            id=bot_message.id,
            content=bot_message.content,
            is_user=bot_message.is_user,
            timestamp=bot_message.timestamp.isoformat()
        )

@app.get("/messages")
async def get_messages(conversation_id: int, db: AsyncSession = Depends(get_db)):
    async with db.begin():
        result = await db.execute(select(Message).where(Message.conversation_id == conversation_id).order_by(Message.timestamp))
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
