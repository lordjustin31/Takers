import { AnimatePresence, motion } from "framer-motion"
import {
  MessageCircle,
  X,
  Minus,
  Search,
  Phone,
  Video,
  Send,
  Smile,
  Paperclip,
  Mic,
} from "lucide-react"
import { useCallback, useEffect, useState, useRef } from "react"

import apiClient from "../../api/client"
import { useAuth } from "../../auth/AuthContext"
import { useChat } from "../../contexts/ChatContext"

interface UserSummary {
  id: number
  username: string
  display_name: string
  avatar_url: string
}

interface MessageItem {
  id: number
  thread_id: string
  sender: UserSummary
  recipient: number
  recipient_detail: UserSummary
  body: string
  is_read: boolean
  delivered_at: string | null
  read_at: string | null
  created_at: string
  message_type: "general" | "marketplace"
  product?: {
    id: number
    title: string
    price: string
  }
}

interface ThreadSummary {
  threadId: string
  messages: MessageItem[]
  participant: UserSummary
  unreadCount: number
  lastMessage: MessageItem
  productId?: number // Add product ID to thread
}

interface FloatingChatProps {
  messageCount?: number
}

function FloatingChat({ messageCount = 0 }: FloatingChatProps) {
  const { user } = useAuth()
  const chatContext = useChat()
  const { isOpen, closeChat, openChat, targetUserId, targetProductId } = chatContext
  const [isMinimized, setIsMinimized] = useState(false)
  const [threads, setThreads] = useState<ThreadSummary[]>([])
  const [activeThread, setActiveThread] = useState<ThreadSummary | null>(null)
  const [messageText, setMessageText] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"general" | "marketplace">("general")
  
  // Ref for auto-scrolling to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Ref to track current active thread without causing re-renders
  const activeThreadRef = useRef<ThreadSummary | null>(null)
  
  // Update ref when activeThread changes
  useEffect(() => {
    activeThreadRef.current = activeThread
  }, [activeThread])

  const fetchMessages = useCallback(async () => {
    if (!user) return
    try {
      const response = await apiClient.get<{ results: MessageItem[] }>(
        "/messages/?ordering=-created_at"
      )
      const messages = response.data?.results || []

      // Group by thread
      const map = new Map<string, MessageItem[]>()
      messages.forEach((message) => {
        const list = map.get(message.thread_id) || []
        list.push(message)
        map.set(message.thread_id, list)
      })

      const threadsList = Array.from(map.entries()).map(([threadId, threadMessages]) => {
        const sorted = [...threadMessages].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        const lastMessage = sorted[sorted.length - 1]
        const participant =
          lastMessage.sender.id === user?.id ? lastMessage.recipient_detail : lastMessage.sender
        const unreadCount = sorted.filter(
          (message) => !message.is_read && message.recipient === user?.id
        ).length
        // Get product ID from any message in thread (if it's a marketplace thread)
        const productId = sorted.find(msg => msg.product)?.product?.id
        return {
          threadId,
          messages: sorted,
          participant,
          unreadCount,
          lastMessage,
          productId,
        }
      })

      setThreads(threadsList)
      
      // Update active thread if it exists - use ref to avoid dependency
      const currentActiveThread = activeThreadRef.current
      if (currentActiveThread) {
        const updatedThread = threadsList.find(t => t.threadId === currentActiveThread.threadId)
        if (updatedThread) {
          // Update even if message count is same (for is_read status changes)
          setActiveThread(updatedThread)
        }
      }
    } catch (error: any) {
      console.error("Failed to fetch messages:", error)
      // If unauthorized, don't crash - just keep empty threads
      if (error.response?.status === 401) {
        console.warn("Authentication required for messages")
        setThreads([])
      }
    }
  }, [user]) // Remove activeThread from dependencies

  // Handle opening with specific user from context
  // DON'T auto-select thread - let user manually select
  useEffect(() => {
    // Only switch to appropriate tab, don't auto-open thread
    if (targetUserId && targetProductId && threads.length > 0) {
      // Check if it's a marketplace conversation
      const existingThread = threads.find(
        (thread) => thread.participant.id === targetUserId
      )
      
      if (existingThread && existingThread.lastMessage?.message_type === "marketplace") {
        setActiveTab("marketplace")
      } else if (targetProductId) {
        // New marketplace conversation
        setActiveTab("marketplace")
      }
    }
  }, [targetUserId, targetProductId, threads])

  useEffect(() => {
    if (isOpen && user) {
      fetchMessages()
      // Poll every 30 seconds to avoid rate limiting
      const interval = setInterval(fetchMessages, 30000)
      return () => clearInterval(interval)
    }
  }, [isOpen, user, fetchMessages])

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (activeThread) {
      scrollToBottom()
    }
  }, [activeThread?.messages.length])

  // Mark messages as read when viewing thread
  useEffect(() => {
    if (!activeThread || !user) return

    const unreadMessages = activeThread.messages.filter(
      (message) => !message.is_read && message.recipient === user.id
    )

    if (unreadMessages.length === 0) return

    // Mark all unread messages as read
    unreadMessages.forEach((message) => {
      apiClient.post(`/messages/${message.id}/mark_read/`)
        .catch(error => console.error("Failed to mark message as read:", error))
    })
  }, [activeThread, user])

  const handleSendMessage = async () => {
    if (!activeThread || !messageText.trim()) return

    try {
      const payload: any = {
        recipient: activeThread.participant.id,
        body: messageText,
      }
      
      // Add product if this is a marketplace conversation
      // Check targetProductId first (for new threads), then activeThread.productId
      const productId = targetProductId || activeThread.productId
      if (productId) {
        payload.product = productId
      }

      const response = await apiClient.post<MessageItem>("/messages/", payload)

      setThreads((prev) =>
        prev.map((thread) =>
          thread.threadId === activeThread.threadId
            ? {
                ...thread,
                messages: [...thread.messages, response.data],
                lastMessage: response.data,
              }
            : thread
        )
      )

      setActiveThread((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, response.data],
              lastMessage: response.data,
            }
          : null
      )

      setMessageText("")
      
      // Refresh messages to get the updated thread list
      fetchMessages()
    } catch (error: any) {
      console.error("Failed to send message:", error)
      console.error("Error response:", error.response?.data)
      console.error("Attempted payload:", {
        recipient: activeThread.participant.id,
        body: messageText,
      })
    }
  }

  const timeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return "now"
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`
    return date.toLocaleDateString()
  }

  const filteredThreads = (threads || [])
    .filter((thread) => {
      const displayName = thread?.participant?.display_name || thread?.participant?.username || ""
      const username = thread?.participant?.username || ""
      const query = (searchQuery || "").toLowerCase()
      return displayName.toLowerCase().includes(query) || username.toLowerCase().includes(query)
    })
    .filter((thread) => {
      // Filter by message type (general or marketplace)
      const messageType = thread.lastMessage.message_type || "general"
      return messageType === activeTab
    })

  if (!user) return null

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={openChat}
          className="fixed bottom-6 right-6 z-50 neu-card flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-glow-blue hover:from-blue-600 hover:to-blue-700"
        >
          <MessageCircle className="h-7 w-7" />
          {messageCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {messageCount > 9 ? "9+" : messageCount}
            </span>
          )}
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 flex w-[380px] flex-col overflow-hidden rounded-3xl border border-neu-300 bg-white shadow-2xl transition-all duration-300 ${
              isMinimized ? "h-auto" : "h-[600px]"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neu-200 bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-6 w-6" />
                <div>
                  <h3 className="text-lg font-bold">
                    {activeThread ? (
                      activeThread.lastMessage?.product?.title || 
                      activeThread.participant?.display_name || 
                      activeThread.participant?.username ||
                      "Chat"
                    ) : "Chats"}
                  </h3>
                  {activeThread && activeThread.participant && (
                    <p className="text-xs text-blue-100">
                      {activeThread.lastMessage?.product ? 
                        `with ${activeThread.participant.display_name || activeThread.participant.username}` : 
                        "Active now"
                      }
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeThread && (
                  <>
                    <button className="neu-button rounded-full p-2 text-white hover:bg-white/20">
                      <Phone className="h-4 w-4" />
                    </button>
                    <button className="neu-button rounded-full p-2 text-white hover:bg-white/20">
                      <Video className="h-4 w-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="rounded-full p-2 hover:bg-white/20"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    closeChat()
                    setActiveThread(null)
                  }}
                  className="rounded-full p-2 hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            {!isMinimized && (
              <>
                {!activeThread ? (
                  // Threads List
                  <div className="flex-1 overflow-hidden">
                    {/* Tabs */}
                    <div className="border-b border-neu-200 px-4 pt-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setActiveTab("general")}
                          className={`flex-1 pb-3 text-sm font-semibold transition ${
                            activeTab === "general"
                              ? "border-b-2 border-blue-600 text-blue-600"
                              : "text-neu-600 hover:text-neu-800"
                          }`}
                        >
                          General
                        </button>
                        <button
                          onClick={() => setActiveTab("marketplace")}
                          className={`flex-1 pb-3 text-sm font-semibold transition ${
                            activeTab === "marketplace"
                              ? "border-b-2 border-blue-600 text-blue-600"
                              : "text-neu-600 hover:text-neu-800"
                          }`}
                        >
                          Marketplace
                        </button>
                      </div>
                    </div>

                    {/* Search */}
                    <div className="border-b border-neu-200 p-4">
                      <div className="neu-card-inset flex items-center gap-2 rounded-full px-4 py-2">
                        <Search className="h-4 w-4 text-neu-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search conversations..."
                          className="flex-1 bg-transparent text-sm text-neu-800 placeholder:text-neu-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Thread List */}
                    <div className="overflow-y-auto" style={{ height: "calc(100% - 150px)" }}>
                      {filteredThreads.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                          <MessageCircle className="h-16 w-16 text-neu-300" />
                          <p className="mt-4 text-sm font-medium text-neu-600">
                            No {activeTab} conversations yet
                          </p>
                          <p className="mt-1 text-xs text-neu-500">
                            {activeTab === "marketplace" 
                              ? "Message sellers about products"
                              : "Start messaging other users"}
                          </p>
                        </div>
                      ) : (
                        filteredThreads.map((thread) => (
                          <button
                            key={thread.threadId}
                            onClick={() => setActiveThread(thread)}
                            className="flex w-full items-center gap-3 border-b border-neu-100 px-4 py-3 transition hover:bg-neu-50"
                          >
                            {/* Avatar */}
                            <div className="relative">
                              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-400 to-blue-600">
                                {thread.participant?.avatar_url ? (
                                  <img
                                    src={thread.participant.avatar_url}
                                    alt={thread.participant.display_name || thread.participant.username}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-sm font-bold text-white">
                                    {(
                                      thread.participant?.display_name ||
                                      thread.participant?.username ||
                                      "U"
                                    )
                                      ?.slice(0, 2)
                                      .toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 text-left">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-neu-900">
                                    {thread.lastMessage?.product?.title || 
                                     thread.participant?.display_name ||
                                     thread.participant?.username ||
                                     "Unknown"}
                                  </p>
                                  {thread.lastMessage?.message_type === "marketplace" && (
                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                      Marketplace
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-neu-500">
                                  {thread.lastMessage?.created_at ? timeAgo(thread.lastMessage.created_at) : ""}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="line-clamp-1 text-xs text-neu-600">
                                  {thread.lastMessage?.product ? 
                                    `${thread.participant?.display_name || thread.participant?.username}: ${thread.lastMessage?.body || ""}` :
                                    thread.lastMessage?.body || "No messages yet"
                                  }
                                </p>
                                {thread.unreadCount > 0 && (
                                  <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                                    {thread.unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  // Active Thread View
                  <div className="flex h-full flex-col">
                    {/* Back Button */}
                    <button
                      onClick={() => setActiveThread(null)}
                      className="flex-shrink-0 border-b border-neu-200 px-4 py-2 text-left text-sm text-blue-600 hover:bg-neu-50"
                    >
                      ← Back to chats
                    </button>

                    {/* Messages Container - Flex 1 to take remaining space */}
                    <div className="flex-1 overflow-y-auto bg-neu-50 p-4">
                      <div className="flex flex-col gap-3">
                        {activeThread.messages?.length > 0 ? (
                          activeThread.messages.map((message, index) => {
                            const isOwn = message.sender?.id === user?.id
                            const showAvatar =
                              index === 0 ||
                              activeThread.messages[index - 1]?.sender?.id !== message.sender?.id

                            return (
                              <div
                                key={message.id || index}
                                className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                              >
                                {/* Avatar */}
                                {!isOwn && showAvatar && message.sender && (
                                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-400 to-blue-600">
                                    {message.sender.avatar_url ? (
                                      <img
                                        src={message.sender.avatar_url}
                                        alt={message.sender.display_name || message.sender.username}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-xs font-bold text-white">
                                        {(message.sender.display_name || message.sender.username || "U")
                                          ?.slice(0, 2)
                                          .toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                )}
                              {!isOwn && !showAvatar && <div className="w-8 flex-shrink-0" />}

                              {/* Message Bubble */}
                              <div
                                className={`flex flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}
                              >
                                <div
                                  className={`max-w-[240px] break-words rounded-2xl px-4 py-2 text-sm ${
                                    isOwn
                                      ? "rounded-br-md bg-blue-500 text-white"
                                      : "rounded-bl-md bg-white text-neu-900"
                                  }`}
                                >
                                  {message.body}
                                </div>
                                
                                {/* Delivered/Seen Status for Own Messages */}
                                {isOwn && (
                                  <div className="flex items-center gap-1 text-xs px-1">
                                    {message.read_at ? (
                                      <div className="flex items-center gap-0.5 text-blue-400">
                                        <span>✓✓</span>
                                        <span className="text-[10px]">Seen</span>
                                      </div>
                                    ) : message.delivered_at ? (
                                      <div className="flex items-center gap-0.5 text-gray-400">
                                        <span>✓</span>
                                        <span className="text-[10px]">Delivered</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-0.5 text-gray-300">
                                        <span>○</span>
                                        <span className="text-[10px]">Sending...</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })
                        ) : (
                          <div className="flex h-full items-center justify-center text-center text-slate-400">
                            <p className="text-sm">Start the conversation...</p>
                          </div>
                        )}
                        {/* Invisible div for auto-scroll target */}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>

                    {/* Input - Fixed at Bottom */}
                    <div className="flex-shrink-0 border-t border-neu-200 bg-white p-3">
                      <div className="flex items-center gap-2">
                        <button className="neu-button flex-shrink-0 rounded-full p-2 text-blue-600">
                          <Paperclip className="h-5 w-5" />
                        </button>
                        <div className="neu-card-inset flex flex-1 items-center gap-2 rounded-full px-4 py-2">
                          <input
                            type="text"
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent text-sm text-neu-800 placeholder:text-neu-400 focus:outline-none"
                          />
                          <button className="flex-shrink-0 text-neu-400 hover:text-neu-600">
                            <Smile className="h-5 w-5" />
                          </button>
                        </div>
                        {messageText.trim() ? (
                          <button
                            onClick={handleSendMessage}
                            className="neu-button flex-shrink-0 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 p-2 text-white shadow-glow-blue"
                          >
                            <Send className="h-5 w-5" />
                          </button>
                        ) : (
                          <button className="neu-button flex-shrink-0 rounded-full p-2 text-blue-600">
                            <Mic className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default FloatingChat
