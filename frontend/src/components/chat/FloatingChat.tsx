import { AnimatePresence } from "framer-motion"
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
  product?: number | null
  product_detail?: {
    id: number
    title: string
    price: string
  } | null
  body: string
  is_read: boolean
  delivered_at: string | null
  read_at: string | null
  created_at: string
  message_type: "general" | "marketplace"
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
  const [friendIds, setFriendIds] = useState<number[]>([])
  
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
      console.log("[FloatingChat] fetchMessages called, user:", user?.id)
      const response = await apiClient.get<any>(
        "/messages/?ordering=-created_at"
      )
      console.log("[FloatingChat] API response status:", response.status)
      console.log("[FloatingChat] Raw response data keys:", Object.keys(response.data))
      const rawData = response.data
      const messages: MessageItem[] = Array.isArray(rawData) ? rawData : (rawData?.results || [])
      
      // Debug logging
      console.log("[FloatingChat] Fetched messages:", messages.length)
      if (messages.length > 0) {
        console.log("[FloatingChat] Sample message:", {
          id: messages[0].id,
          thread_id: messages[0].thread_id,
          sender: messages[0].sender,
          recipient: messages[0].recipient,
          recipient_detail: messages[0].recipient_detail,
          product: messages[0].product,
          product_detail: messages[0].product_detail,
          message_type: messages[0].message_type,
          body: messages[0].body,
          is_read: messages[0].is_read,
          delivered_at: messages[0].delivered_at,
          read_at: messages[0].read_at,
          created_at: messages[0].created_at,
        })
      }

      // Group by thread
      const map = new Map<string, MessageItem[]>()
      messages.forEach((message) => {
        const list = map.get(message.thread_id) || []
        list.push(message)
        map.set(message.thread_id, list)
      })

      // Group by participant user ID instead of backend thread_id UUID
      const participantMap = new Map<number, MessageItem[]>()
      const currentUserId = user ? Number(user.id) : null

      messages.forEach((message) => {
        const senderId = typeof message.sender === 'object' && message.sender !== null ? Number(message.sender.id) : Number(message.sender)
        const recipientId = Number(message.recipient)
        
        let otherUserId: number | null = null
        if (currentUserId) {
          if (senderId === currentUserId) {
            otherUserId = recipientId
          } else {
            otherUserId = senderId
          }
        } else {
          otherUserId = senderId
        }

        if (otherUserId) {
          const list = participantMap.get(otherUserId) || []
          list.push(message)
          participantMap.set(otherUserId, list)
        }
      })

      const threadsList = Array.from(participantMap.entries()).map(([participantId, threadMessages]) => {
        const sorted = [...threadMessages].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        const lastMessage = sorted[sorted.length - 1]
        const senderId = typeof lastMessage.sender === 'object' && lastMessage.sender !== null ? Number(lastMessage.sender.id) : Number(lastMessage.sender)
        const currentUserId = user ? Number(user.id) : null

        // Extract participant details dynamically
        let participant: UserSummary
        if (currentUserId && senderId === currentUserId) {
          participant = lastMessage.recipient_detail || {
            id: participantId,
            username: `User ${participantId}`,
            display_name: `User ${participantId}`,
            avatar_url: "",
          }
        } else {
          participant = (typeof lastMessage.sender === 'object' ? lastMessage.sender : null) || {
            id: participantId,
            username: `User ${participantId}`,
            display_name: `User ${participantId}`,
            avatar_url: "",
          }
        }

        const unreadCount = sorted.filter(
          (message) => !message.is_read && Number(message.recipient) === (user ? Number(user.id) : null)
        ).length
        
        const productMsg = sorted.find(msg => msg.product || msg.product_detail)
        const productId = typeof productMsg?.product === 'number' ? productMsg.product : productMsg?.product_detail?.id
        
        const effectiveThreadId = lastMessage.thread_id || `user_${participantId}`

        return {
          threadId: effectiveThreadId,
          messages: sorted,
          participant,
          unreadCount,
          lastMessage,
          productId,
        }
      })

      setThreads(threadsList)
      
      // Update active thread if it exists - match by threadId or participant.id
      const currentActiveThread = activeThreadRef.current
      if (currentActiveThread) {
        const updatedThread = threadsList.find(
          (t) =>
            t.threadId === currentActiveThread.threadId ||
            (Number(t.participant.id) === Number(currentActiveThread.participant.id) &&
              ((currentActiveThread.productId && t.productId === currentActiveThread.productId) ||
                (!currentActiveThread.productId && !t.productId)))
        )
        if (updatedThread) {
          setActiveThread(updatedThread)
        } else if (!currentActiveThread.threadId.startsWith("temp_")) {
          // If active thread is non-temp but matches participant id in list
          const sameParticipantThread = threadsList.find(t => Number(t.participant.id) === Number(currentActiveThread.participant.id))
          if (sameParticipantThread) {
            setActiveThread(sameParticipantThread)
          }
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

  // Handle opening with specific user and product from context - Auto select or create active thread
  useEffect(() => {
    if (isOpen && targetUserId) {
      const numTargetUserId = Number(targetUserId)
      const numTargetProductId = targetProductId ? Number(targetProductId) : null

      if (numTargetProductId) {
        setActiveTab("marketplace")
      } else {
        setActiveTab("general")
      }

      // Check if thread already exists for this user (matching marketplace vs general requirement if applicable)
      const existingThread = threads.find(
        (thread) =>
          Number(thread.participant.id) === numTargetUserId &&
          (numTargetProductId
            ? thread.productId === numTargetProductId
            : !thread.productId)
      ) || threads.find(
        (thread) => Number(thread.participant.id) === numTargetUserId
      )

      if (existingThread) {
        setActiveThread(existingThread)
      } else {
        // Fetch participant details or create a dummy thread structure for starting new conversation
        apiClient.get(`/users/${numTargetUserId}/`).then((res) => {
          const participantData: UserSummary = {
            id: res.data.id,
            username: res.data.username,
            display_name: res.data.display_name || res.data.username,
            avatar_url: res.data.avatar_url || "",
          }
          const tempThread: ThreadSummary = {
            threadId: `temp_${numTargetUserId}_${Date.now()}`,
            messages: [],
            participant: participantData,
            unreadCount: 0,
            lastMessage: {
              id: 0,
              thread_id: "",
              sender: user!,
              recipient: numTargetUserId,
              recipient_detail: participantData,
              body: "",
              is_read: true,
              delivered_at: null,
              read_at: null,
              created_at: new Date().toISOString(),
              message_type: numTargetProductId ? "marketplace" : "general",
            },
            productId: numTargetProductId || undefined,
          }
          setActiveThread(tempThread)
        }).catch((err) => {
          console.error("Failed to fetch target user details:", err)
        })
      }
    }
  }, [isOpen, targetUserId, targetProductId, threads, user])

  // Fetch friends list to identify friend user IDs
  useEffect(() => {
    if (user) {
      apiClient.get('/friendships/friends/').then((res) => {
        const friendsList = Array.isArray(res.data) ? res.data : []
        setFriendIds(friendsList.map((f: any) => f.id).filter(Boolean))
      }).catch((err) => {
        console.warn("Failed to fetch friends list:", err)
        setFriendIds([])
      })
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchMessages()
      // Poll every 30 seconds to reduce server load - messages will still be real-time when chat is open
      const interval = setInterval(fetchMessages, 30000)
      return () => clearInterval(interval)
    }
  }, [user, fetchMessages])

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

      const newMessage = response.data

      setActiveThread((prev) => {
        if (!prev) return null
        return {
          ...prev,
          threadId: newMessage.thread_id,
          messages: [...prev.messages, newMessage],
          lastMessage: newMessage,
        }
      })

      setThreads((prev) => {
        const exists = prev.some((t) => t.threadId === activeThread.threadId || t.threadId === newMessage.thread_id)
        if (exists) {
          return prev.map((thread) =>
            thread.threadId === activeThread.threadId || thread.threadId === newMessage.thread_id
              ? {
                  ...thread,
                  threadId: newMessage.thread_id,
                  messages: [...thread.messages, newMessage],
                  lastMessage: newMessage,
                }
              : thread
          )
        } else {
          return [
            ...prev,
            {
              threadId: newMessage.thread_id,
              messages: [newMessage],
              participant: activeThread.participant,
              unreadCount: 0,
              lastMessage: newMessage,
              productId: targetProductId || activeThread.productId,
            },
          ]
        }
      })

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
      if (!thread) return false
      const displayName = thread?.participant?.display_name || thread?.participant?.username || ""
      const username = thread?.participant?.username || ""
      const query = (searchQuery || "").toLowerCase()
      if (query && !displayName.toLowerCase().includes(query) && !username.toLowerCase().includes(query)) {
        return false
      }
      
      const isMarketplace = Boolean(
        thread.productId ||
        thread.messages?.some(m => Boolean(m.product || m.product_detail || m.message_type === "marketplace")) ||
        thread.lastMessage?.message_type === "marketplace" ||
        Boolean(thread.lastMessage?.product || thread.lastMessage?.product_detail)
      )

      if (activeTab === "marketplace") {
        return isMarketplace
      } else {
        // Show non-marketplace threads in General tab. If there are no non-marketplace threads but user has conversations, display them so chat history is always visible.
        return !isMarketplace || (threads.length > 0 && !threads.some(t => !t.productId && !t.messages?.some(m => m.product || m.product_detail || m.message_type === "marketplace")))
      }
    })

  if (!user) return null

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={openChat}
          className="fixed bottom-6 right-6 z-50 glass-button-primary flex h-16 w-16 items-center justify-center rounded-full shadow-glow-moonstone hover:shadow-glow-moonstone-lg transition-transform duration-200"
          style={{ transform: 'scale(1)' }}
        >
          <MessageCircle className="h-7 w-7" />
          {messageCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-moonstone-500 text-xs font-bold text-white">
              {messageCount > 9 ? "9+" : messageCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex w-[380px] flex-col overflow-hidden rounded-3xl glass-card shadow-glass-xl transition-all duration-300 ${
              isMinimized ? "h-auto" : "h-[600px]"
            }`}
            style={{ opacity: 1, transform: 'translateY(0) scale(1)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-moonstone-200/50 bg-gradient-to-r from-moonstone-600 to-moonstone-700 px-5 py-3.5 text-white">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-6 w-6" />
                <div>
                  <h3 className="text-lg font-bold">
                    {activeThread ? (
                      activeThread.lastMessage?.product_detail?.title || 
                      activeThread.participant?.display_name || 
                      activeThread.participant?.username ||
                      "Chat"
                    ) : "Chats"}
                  </h3>
                  {activeThread && activeThread.participant && (
                    <p className="text-xs text-moonstone-200">
                      {activeThread.lastMessage?.product_detail ? 
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
                    <button className="rounded-full p-2 text-white/80 hover:bg-white/15 transition">
                      <Phone className="h-4 w-4" />
                    </button>
                    <button className="rounded-full p-2 text-white/80 hover:bg-white/15 transition">
                      <Video className="h-4 w-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="rounded-full p-2 text-white/80 hover:bg-white/15 transition"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    closeChat()
                    setActiveThread(null)
                  }}
                  className="rounded-full p-2 text-white/80 hover:bg-white/15 transition"
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
                    <div className="border-b border-moonstone-200/30 px-4 pt-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setActiveTab("general")}
                          className={`flex-1 pb-3 text-sm font-bold transition ${
                            activeTab === "general"
                              ? "border-b-2 border-moonstone-300 text-moonstone-100"
                              : "text-moonstone-400 hover:text-moonstone-200"
                          }`}
                        >
                          General
                        </button>
                        <button
                          onClick={() => setActiveTab("marketplace")}
                          className={`flex-1 pb-3 text-sm font-bold transition ${
                            activeTab === "marketplace"
                              ? "border-b-2 border-moonstone-300 text-moonstone-100"
                              : "text-moonstone-400 hover:text-moonstone-200"
                          }`}
                        >
                          Marketplace
                        </button>
                      </div>
                    </div>

                    {/* Search */}
                    <div className="border-b border-moonstone-200/30 p-4">
                      <div className="glass-input flex items-center gap-2 rounded-full px-4 py-2">
                        <Search className="h-4 w-4 text-moonstone-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search conversations..."
                          className="flex-1 bg-transparent text-sm text-moonstone-100 placeholder:text-moonstone-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Thread List */}
                    <div className="flex-1 overflow-y-auto">
                      {filteredThreads.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                          <MessageCircle className="h-16 w-16 text-moonstone-300" />
                          <p className="mt-4 text-sm font-medium text-moonstone-200">
                            No {activeTab} conversations yet
                          </p>
                          <p className="mt-1 text-xs text-moonstone-400">
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
                            className="flex w-full items-center gap-3 border-b border-moonstone-200/20 px-4 py-3 transition hover:bg-white/10"
                          >
                            {/* Avatar */}
                            <div className="relative">
                              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-moonstone-400 to-moonstone-600">
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
                                  <p className="text-sm font-semibold text-moonstone-100">
                                    {thread.lastMessage?.product_detail?.title || 
                                     thread.participant?.display_name ||
                                     thread.participant?.username ||
                                     "Unknown"}
                                  </p>
                                  {((thread.lastMessage?.message_type === "marketplace" || thread.productId) &&
                                    (!friendIds.includes(thread.participant.id) || !thread.messages.every(m => m.is_read || m.sender.id === user?.id))) && (
                                    <span className="rounded-full bg-moonstone-500/30 border border-moonstone-400/40 px-2 py-0.5 text-xs font-medium text-moonstone-200">
                                      Marketplace
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-moonstone-400">
                                  {thread.lastMessage?.created_at ? timeAgo(thread.lastMessage.created_at) : ""}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="line-clamp-1 text-xs text-moonstone-300">
                                  {thread.lastMessage?.product_detail ? 
                                    `${thread.participant?.display_name || thread.participant?.username}: ${thread.lastMessage?.body || ""}` :
                                    thread.lastMessage?.body || "No messages yet"
                                  }
                                </p>
                                {thread.unreadCount > 0 && (
                                  <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-moonstone-500 text-xs font-bold text-white">
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
                      className="flex-shrink-0 border-b border-moonstone-200/50 px-4 py-2 text-left text-sm text-moonstone-600 hover:bg-moonstone-50"
                    >
                      ← Back to chats
                    </button>

                    {/* Messages Container - Flex 1 to take remaining space */}
                    <div className="flex-1 overflow-y-auto bg-moonstone-50/50 p-4">
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
                                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-moonstone-400 to-moonstone-600">
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
                                      ? "rounded-br-md bg-moonstone-600 text-white"
                                      : "rounded-bl-md bg-white/80 backdrop-blur-sm text-moonstone-900 border border-moonstone-200/30"
                                  }`}
                                >
                                  {message.body}
                                </div>
                                
                                {/* Delivered/Seen Status for Own Messages */}
                                {isOwn && (
                                  <div className="flex items-center gap-1 text-xs px-1">
                                    {message.read_at ? (
                                      <div className="flex items-center gap-0.5 text-moonstone-500">
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
                          <div className="flex h-full items-center justify-center text-center text-moonstone-400">
                            <p className="text-sm">Start the conversation...</p>
                          </div>
                        )}
                        {/* Invisible div for auto-scroll target */}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>

                    {/* Input - Fixed at Bottom */}
                    <div className="flex-shrink-0 border-t border-moonstone-200/50 bg-white/70 backdrop-blur-sm p-3">
                      <div className="flex items-center gap-2">
                        <button className="glass-button flex-shrink-0 rounded-full p-2 text-moonstone-600">
                          <Paperclip className="h-5 w-5" />
                        </button>
                        <div className="glass-input flex flex-1 items-center gap-2 rounded-full px-4 py-2">
                          <input
                            type="text"
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent text-sm text-moonstone-800 placeholder:text-moonstone-400 focus:outline-none"
                          />
                          <button className="flex-shrink-0 text-moonstone-400 hover:text-moonstone-600">
                            <Smile className="h-5 w-5" />
                          </button>
                        </div>
                        {messageText.trim() ? (
                          <button
                            onClick={handleSendMessage}
                            className="glass-button-primary flex-shrink-0 rounded-full p-2 shadow-glow-moonstone"
                          >
                            <Send className="h-5 w-5" />
                          </button>
                        ) : (
                          <button className="glass-button flex-shrink-0 rounded-full p-2 text-moonstone-600">
                            <Mic className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

export default FloatingChat
