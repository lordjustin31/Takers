import { createContext, useContext, useState } from "react"
import type { ReactNode } from "react"

interface ChatContextType {
  isOpen: boolean
  openChat: () => void
  closeChat: () => void
  openThreadWithUser: (userId: number, productId?: number) => void
  targetUserId: number | null
  targetProductId: number | null
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [targetUserId, setTargetUserId] = useState<number | null>(null)
  const [targetProductId, setTargetProductId] = useState<number | null>(null)

  const openChat = () => setIsOpen(true)
  const closeChat = () => {
    setIsOpen(false)
    setTargetUserId(null)
    setTargetProductId(null)
  }

  const openThreadWithUser = (userId: number, productId?: number) => {
    setTargetUserId(userId)
    setTargetProductId(productId || null)
    setIsOpen(true)
  }

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        openChat,
        closeChat,
        openThreadWithUser,
        targetUserId,
        targetProductId,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}
