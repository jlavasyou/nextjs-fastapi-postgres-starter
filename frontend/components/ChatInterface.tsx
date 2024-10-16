'use client'

import React, { useState, useEffect } from 'react'
import ConversationList from './ConversationList'
import MessageList from './MessageList'
import MessageInput from './MessageInput'

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

interface Conversation {
  id: number
  user_id: number
  last_message?: {
    content: string
    timestamp: string
    is_user: boolean
  }
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function ChatInterface({ initialUser }: { initialUser: User }) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${apiUrl}/conversations`)
      if (!response.ok) throw new Error('Failed to fetch conversations')
      const data = await response.json()
      setConversations(data)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    }
  }

  const fetchMessages = async (conversationId: number) => {
    try {
      const response = await fetch(`${apiUrl}/conversations/${conversationId}`)
      if (!response.ok) throw new Error('Failed to fetch messages')
      const data = await response.json()
      setMessages(data.messages)
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    fetchMessages(conversation.id)
  }

  const handleCreateConversation = async () => {
    try {
      const response = await fetch(`${apiUrl}/conversations`, { method: 'POST' })
      if (!response.ok) throw new Error('Failed to create conversation')
      const newConversation = await response.json()
      setConversations([...conversations, newConversation])
      handleSelectConversation(newConversation)
    } catch (error) {
      console.error('Error creating conversation:', error)
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!selectedConversation) return

    try {
      const response = await fetch(`${apiUrl}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, conversation_id: selectedConversation.id }),
      })
      if (!response.ok) throw new Error('Failed to send message')
      const newMessage = await response.json()
      setMessages([...messages, newMessage])
      // Update the last message in the conversation list
      setConversations(conversations.map(conv =>
        conv.id === selectedConversation.id ? { ...conv, last_message: newMessage } : conv
      ))
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  return (
    <div className="chat-container">
      <div className="greeting-top">
        <p>Hello, {initialUser.name}! How may you serve me today?</p>
      </div>
      <div className="chat-interface">
        <ConversationList
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={handleSelectConversation}
          onCreateConversation={handleCreateConversation}
        />
        <div className="message-area">
          <MessageList messages={messages} />
          <MessageInput onSendMessage={handleSendMessage} disabled={!selectedConversation} />
        </div>
      </div>
    </div>
  )
}
