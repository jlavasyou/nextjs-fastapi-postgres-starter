import React from 'react'

interface Message {
  id?: number
  content: string
  is_user: boolean
  timestamp?: string
}

interface MessageListProps {
  messages: Message[]
}

export default function MessageList({ messages }: MessageListProps) {
  return (
    <div className="messages">
      {messages.map((message, index) => (
        <div key={message.id || index} className={`message ${message.is_user ? 'user' : 'bot'}`}>
          {message.content}
        </div>
      ))}
    </div>
  )
}
