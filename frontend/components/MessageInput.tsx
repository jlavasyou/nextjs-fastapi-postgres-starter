import React, { useState } from 'react'

interface MessageInputProps {
  onSendMessage: (content: string) => void
  disabled: boolean
}

export default function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !disabled) {
      onSendMessage(input.trim())
      setInput('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="input-form">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
        disabled={disabled}
      />
      <button type="submit" disabled={disabled || !input.trim()}>
        Send
      </button>
    </form>
  )
}
