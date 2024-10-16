from sqlalchemy import String, ForeignKey, Boolean
from sqlalchemy.orm import DeclarativeBase, relationship
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from datetime import datetime

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "user"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(30))
    conversations: Mapped[list["Conversation"]] = relationship("Conversation", back_populates="user")

    def __repr__(self) -> str:
        return f"User(id={self.id!r}, name={self.name!r})"
    
class Conversation(Base):
    __tablename__ = "conversation"

    id: Mapped[int] = mapped_column(primary_key=True)
    messages: Mapped[list["Message"]] = relationship("Message", back_populates="conversation")
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"))
    user: Mapped["User"] = relationship("User", back_populates="conversations")

    def __repr__(self) -> str:
        return f"Conversation(id={self.id!r})"

class Message(Base):
    __tablename__ = "message"

    id: Mapped[int] = mapped_column(primary_key=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey("conversation.id"))
    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")
    content: Mapped[str] = mapped_column(String(500))
    timestamp: Mapped[datetime] = mapped_column(default=datetime.now)
    is_user: Mapped[bool] = mapped_column(Boolean)
    
    def __repr__(self) -> str:
        return f"Message(id={self.id!r}, content={self.content!r}, is_user={self.is_user!r})"