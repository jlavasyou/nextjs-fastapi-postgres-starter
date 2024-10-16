import ChatInterface from '@/components/ChatInterface'

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

async function getUser() {
  const res = await fetch(`${apiUrl}/users/me`, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error('Failed to fetch user')
  }
  return res.json()
}

async function getMessages() {
  const res = await fetch(`${apiUrl}/messages`, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error('Failed to fetch messages')
  }
  return res.json()
}

export default async function Home() {
  const initialUser = await getUser()
  const initialMessages = await getMessages()

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold mb-8">Simple Chatbot</h1>
      <ChatInterface initialUser={initialUser} initialMessages={initialMessages} />
    </main>
  )
}
