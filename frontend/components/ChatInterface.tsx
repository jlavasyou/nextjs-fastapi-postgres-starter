'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useFormStatus } from 'react-dom'
import { useOptimistic } from 'react'

interface User {
  id: number
  name: string
}

interface Message {
  id?: number
  content: string
  is_user: boolean
  timestamp?: string
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL;


export default function ChatInterface({ initialUser, initialMessages }: { initialUser: User, initialMessages: Message[] }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    setIsLoading(true)
    const userMessage: Message = { content: input, is_user: true }

    try {
      const response = await fetch(`${apiUrl}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input }),
      })

      if (!response.ok) throw new Error('Failed to send message')

      const botMessage: Message = await response.json()
      setMessages(prev => [...prev, userMessage, botMessage])
      setInput('')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="chat-container">
      <div className="greeting">
        <p>Hello, {initialUser.name}! Continue your conversation below</p>
      </div>
      <div className="messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.is_user ? 'user' : 'bot'}`}>
            {message.content}
          </div>
        ))}
        {isLoading && <div className="loading-indicator">Bot is typing...</div>}
      </div>
      <form onSubmit={sendMessage} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
}