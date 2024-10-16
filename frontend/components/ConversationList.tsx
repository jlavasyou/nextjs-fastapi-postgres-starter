import React from 'react'

interface Conversation {
  id: number
  user_id: number
  last_message?: {
    content: string
    timestamp: string
    is_user: boolean
  }
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedConversation: Conversation | null
  onSelectConversation: (conversation: Conversation) => void
  onCreateConversation: () => void
}

export default function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  onCreateConversation
}: ConversationListProps) {
  return (
    <div className="conversation-list">
      <button onClick={onCreateConversation} className="create-conversation-btn">
        New Conversation
      </button>
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          className={`conversation-item ${selectedConversation?.id === conversation.id ? 'active' : ''}`}
          onClick={() => onSelectConversation(conversation)}
        >
          <span>Conversation {conversation.id}</span>
          {conversation.last_message && (
            <p className="last-message">
              {conversation.last_message.content.substring(0, 30)}...
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
